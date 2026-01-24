import { supabase } from './supabase';
import type { UserProfile } from './types';

/**
 * Maps an admission number to a virtual email for Auth
 */
export const getVirtualEmail = (schoolId: string, admissionNumber: string) => {
    // Sanitize schoolId and admissionNumber to ensure valid email format
    const cleanSchool = schoolId.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const cleanAdm = admissionNumber.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return `${cleanAdm}@${cleanSchool}.educore.app`;
};

/**
 * Maps a staff ID to a virtual email for Auth
 */
export const getStaffVirtualEmail = (schoolId: string, staffId: string) => {
    const cleanSchool = schoolId.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const cleanStaffId = staffId.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return `${cleanStaffId}@${cleanSchool}.educore.app`;
}

/**
 * Registers a new school and its first admin
 */
export const registerSchool = async (adminData: any, schoolData: any) => {
    const { email, password, fullName } = adminData;
    const { name, address } = schoolData;

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { fullName, role: 'admin' } // stored in authentication metadata
        }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    const uid = authData.user.id;

    // 2. Call RPC to create School and Admin Profile securely
    // This bypasses RLS issues if the user is not yet confirmed/logged in
    const { data: rpcData, error: rpcError } = await supabase.rpc('register_school_and_admin', {
        admin_uid: uid,
        admin_email: email,
        admin_full_name: fullName,
        school_name: name,
        school_address: address,
        school_contact_email: email
    });

    if (rpcError) {
        throw rpcError;
    }

    // 3. Update Auth User Metadata with the newly created school_id
    // This allows the AuthContext to have schoolId even if the profile fetch fails or times out.
    await supabase.auth.updateUser({
        data: { schoolId: rpcData.school_id }
    });

    return { schoolId: rpcData.school_id, uid };
};

/**
 * Activates a pre-created account (Student or Staff) on first login.
 * This performs a SignUp behind the scenes.
 */
export const activateAccount = async (
    schoolId: string,
    identifier: string, // Admission Number or Staff ID
    password: string,
    type: 'student' | 'staff'
) => {
    const virtualEmail = type === 'student'
        ? getVirtualEmail(schoolId, identifier)
        : getStaffVirtualEmail(schoolId, identifier);

    // 1. Attempt Sign Up
    const { data, error } = await supabase.auth.signUp({
        email: virtualEmail,
        password,
        options: {
            data: {
                role: type,
                schoolId: schoolId,
                ...(type === 'staff'
                    ? { staff_id: identifier }
                    : { admission_number: identifier }
                )
            }
        }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Activation failed");

    return data;
}

/**
 * Helper to reconcile the "Placeholder Profile" with the new "Auth Profile"
 */
const linkProfileAfterActivation = async (schoolId: string, authUid: string, identifier: string, role: 'student' | 'staff') => {
    // 1. Find the placeholder profile
    const idField = role === 'student' ? 'admission_number' : 'staff_id';

    // We need to fetch the OLD row.
    const { data: placeholder, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .eq(idField, identifier)
        .neq('id', authUid) // Don't fetch if it's already the correct one
        .maybeSingle();

    if (error || !placeholder) {
        console.warn("No placeholder profile found to link. Creating fresh profile.");
        // Create fresh profile if missing
        await supabase.from('users').insert({
            id: authUid,
            school_id: schoolId,
            role: role,
            [idField]: identifier,
            full_name: role === 'student' ? 'Student' : 'Staff Member', // Default fallback
            email: getVirtualEmail(schoolId, identifier) // Just to have something
        });
        return;
    }

    // 2. Insert NEW row with correct UID (Clone)
    const { id, created_at, updated_at, ...profileData } = placeholder;

    const { error: insertError } = await supabase
        .from('users')
        .upsert({
            ...profileData,
            id: authUid, // The new Auth UID
            email: getVirtualEmail(schoolId, identifier) // Update email to virtual one
        });

    if (insertError) {
        console.error("Failed to link profile:", insertError);
        return;
    }

    // 3. Migrate Related Records
    if (placeholder.id) {
        // Migrate Classes (Students)
        if (role === 'student') {
            const { error: classError } = await supabase
                .from('student_classes')
                .update({ student_id: authUid })
                .eq('student_id', placeholder.id);

            if (classError) {
                console.warn("Student class migration warning:", classError);
            }
        }

        // Migrate Staff Assignments (if teacher) using RPC for secure migration
        if (role === 'staff') {
            try {
                const { data, error: rpcError } = await supabase.rpc('link_staff_profile_after_activation', {
                    p_school_id: schoolId,
                    p_auth_uid: authUid,
                    p_staff_id_identifier: identifier
                });

                if (rpcError) {
                    console.error("Staff profile linking RPC error:", rpcError);
                } else if (data && !data.success) {
                    console.warn("Staff profile linking failed:", data.message);
                } else {
                    console.log("Staff profile linked successfully:", data?.message, `(${data?.assignments_migrated || 0} assignments)`);
                }

                // Now delete the old placeholder (whether RPC succeeded or failed)
                // This is safe because the new profile with authUid should already exist
                const { error: deleteError } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', placeholder.id);

                if (deleteError) {
                    console.warn("Failed to delete placeholder profile:", deleteError);
                }
            } catch (err) {
                console.error("Staff profile linking exception:", err);
                // Attempt cleanup anyway
                await supabase.from('users').delete().eq('id', placeholder.id);
            }
        } else {
            // For other roles, just delete the old placeholder
            await supabase.from('users').delete().eq('id', placeholder.id);
        }
    }

    // Special case for parents: If they logged in with student creds,
    // we might need to ensure they have the 'parent' role if they intended to be in the parent portal.
    // However, the current logic assumes Admission Number login is primarily for students.
    // If a parent uses it, they effectively "are" the student for that session.
};

/**
 * Login for parents using their child's admission number and PIN
 * This is an alternative to phone OTP login.
 */
export const loginWithParentCredentials = async (schoolId: string, admissionNumber: string, pin: string) => {
    const virtualEmail = getVirtualEmail(schoolId, admissionNumber);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: pin
    });

    if (error) throw error;
    return data;
};

/**
 * Login with admission number (for students)
 */
export const loginWithAdmissionNumber = async (schoolId: string, admissionNumber: string, password: string) => {
    const virtualEmail = getVirtualEmail(schoolId, admissionNumber);

    // 1. Try Login
    const { data, error } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password
    });

    if (error) {
        // We attempt to ACTIVATE (SignUp) if login fails.
        // This is a "Just-in-Time" registration.
        try {
            console.log("Login failed, attempting activation...");
            const authResponse = await activateAccount(schoolId, admissionNumber, password, 'student');

            if (authResponse.user) {
                // Post-Activation: Link/Clone Profile
                await linkProfileAfterActivation(schoolId, authResponse.user.id, admissionNumber, 'student');
                return authResponse;
            }
        } catch (activationError) {
            console.error("Activation failed:", activationError);
            throw error; // Throw original login error if activation fails
        }
    }

    return data;
};

/**
 * Login with Staff ID
 */
export const loginWithStaffId = async (schoolId: string, staffId: string, password: string) => {
    const virtualEmail = getStaffVirtualEmail(schoolId, staffId);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password
    });

    if (error) {
        // Try Activation
        try {
            console.log("Login failed, attempting activation...");
            const authResponse = await activateAccount(schoolId, staffId, password, 'staff');
            if (authResponse.user) {
                await linkProfileAfterActivation(schoolId, authResponse.user.id, staffId, 'staff');
                return authResponse;
            }
        } catch (activationError) {
            console.error("Activation failed:", activationError);
            throw error;
        }
    }

    return data;
}

/**
 * Initiate phone login (sends OTP)
 */
export const signInWithPhone = async (phoneNumber: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber
    });

    if (error) throw error;
    return data;
};

/**
 * Confirm OTP code
 */
export const confirmPhoneOTP = async (phoneNumber: string, code: string, schoolId: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: code,
        type: 'sms'
    });

    if (error) throw error;
    const user = data.user;

    if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) {
            // Link new parent to school
            await supabase.from('users').insert({
                id: user.id,
                school_id: schoolId,
                role: 'parent',
                phone_number: phoneNumber,
                full_name: 'Parent' // Prompt to update later
            });
        }
    }

    return data;
};

/**
 * Get the current user's profile
 */
export const getCurrentUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        role: data.role,
        schoolId: data.school_id,
        admissionNumber: data.admission_number,
        phoneNumber: data.phone_number,
        staffId: data.staff_id,
        assignedClasses: data.assigned_classes,
        assignedSubjects: data.assigned_subjects,
        linkedStudents: data.linked_students,
        profileImage: data.profile_image,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
};
