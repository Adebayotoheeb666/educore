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
 * This performs a SignUp behind the scenes, or handles already-registered accounts.
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

    // If the user is already registered, try to sign in instead
    if (error && (error.message?.includes('already registered') || error.code === 'user_already_exists')) {
        console.warn("Account already registered, attempting sign in...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: virtualEmail,
            password
        });

        if (signInError) {
            throw signInError;
        }

        if (!signInData.user) {
            throw new Error("Sign in failed after account registration");
        }

        return signInData;
    }

    if (error) throw error;
    if (!data.user) throw new Error("Activation failed");

    return data;
}

/**
 * Helper to reconcile the "Placeholder Profile" with the new "Auth Profile"
 */
const linkProfileAfterActivation = async (schoolId: string, authUid: string, identifier: string, role: 'student' | 'staff') => {
    // We only need special handling for staff via our new RPC
    if (role === 'staff') {
        try {
            console.log('[linkProfileAfterActivation] Attempting to resolve staff duplication/linking via RPC...');
            // We need to fetch the current user's details to pass to the RPC (as fail-safes)
            const { data: user } = await supabase.auth.getUser();
            const email = user.user?.email || '';
            const fullName = user.user?.user_metadata?.full_name || user.user?.user_metadata?.fullName || 'Staff Member';

            const { data, error } = await supabase.rpc('resolve_staff_first_login', {
                p_school_id: schoolId,
                p_auth_uid: authUid,
                p_staff_id: identifier,
                p_email: email,
                p_full_name: fullName
            });

            if (error) {
                console.error('[linkProfileAfterActivation] RPC failed:', error);
                throw error;
            }

            console.log('[linkProfileAfterActivation] RPC result:', data);
            return;
        } catch (err) {
            console.error('[linkProfileAfterActivation] Error calling resolve_staff_first_login:', err);
            // Fallthrough to manual linking if RPC fails? 
            // Better to rely on the RPC as manual linking is what caused the issue (RLS).
            // But we can keep student logic below.
        }
    }

    // Original logic for Students (or fallback for staff if we decide to keep it, but mostly student now)
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
        // If we are here as STAFF, it means RPC failed or didn't run, and we couldn't find placeholder manually.
        // Likely RLS blocking us. But for STUDENTs it might still work if policies allow.
        console.warn(`[linkProfileAfterActivation] No placeholder found for ${role} (or RLS blocked it).`);

        // Ensure new profile has correct ID field set
        const updateData: any = {};
        if (role === 'staff') updateData.staff_id = identifier;
        if (role === 'student') updateData.admission_number = identifier;
        updateData.school_id = schoolId; // Enforce school ID

        await supabase.from('users').update(updateData).eq('id', authUid);
        return;
    }

    // 2. Placeholder found! (This part mostly applies to Students now, or if RLS allows Staff to see)
    // ... [Rest of student linking logic if we want to preserve it, but for Staff we trust RPC] ...

    // For now, I will simplify this block to only run for STUDENTS to avoid confusion, 
    // as Staff is handled by RPC above.
    if (role === 'student') {
        console.log("Found placeholder profile for student, migrating...");
        // Delete placeholder and update current
        // (Simplified logic for student as requested focus is Staff)
        const { error: updateError } = await supabase
            .from('users')
            .update({
                school_id: schoolId,
                admission_number: identifier,
                role: role
                // Add other fields from placeholder if needed
            })
            .eq('id', authUid);

        if (!updateError) {
            // Migrate classes
            await supabase
                .from('student_classes')
                .update({ student_id: authUid })
                .eq('student_id', placeholder.id);

            // Delete placeholder
            await supabase.from('users').delete().eq('id', placeholder.id);
        }
    }
}

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
 * Login with Parent ID (similar to student admission number or staff ID)
 */
export const loginWithParentId = async (schoolId: string, parentId: string, password: string) => {
    const virtualEmail = getVirtualEmail(schoolId, parentId);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password
    });

    if (error) {
        // Check if it's an invalid credentials error (account exists but wrong password)
        if (error.message?.includes('invalid') || error.code === 'invalid_grant') {
            // Wrong password - don't try activation
            throw error;
        }

        // Account doesn't exist yet - Try Activation
        try {
            console.log("Login failed, attempting activation...");
            const authResponse = await activateAccount(schoolId, parentId, password, 'student'); // Use 'student' type for virtual email generation

            if (authResponse.user) {
                try {
                    // Ensure parent profile is created with parent_id
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', authResponse.user.id)
                        .single();

                    if (!profile) {
                        // Create parent profile
                        await supabase.from('users').insert({
                            id: authResponse.user.id,
                            school_id: schoolId,
                            role: 'parent',
                            admission_number: parentId, // Store parent ID in admission_number field
                            full_name: 'Parent'
                        });
                    } else if (profile.role !== 'parent') {
                        // Update existing profile to parent role
                        await supabase
                            .from('users')
                            .update({ role: 'parent', admission_number: parentId })
                            .eq('id', authResponse.user.id);
                    }
                } catch (linkError) {
                    console.error("Profile linking error during parent activation:", {
                        message: linkError instanceof Error ? linkError.message : String(linkError),
                        error: linkError
                    });
                }
                return authResponse;
            }
        } catch (activationError) {
            console.error("Activation failed:", activationError);
            throw activationError;
        }
    }

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
        // Check if it's an invalid credentials error (account exists but wrong password)
        if (error.message?.includes('invalid') || error.code === 'invalid_grant') {
            // Wrong password - don't try activation
            throw error;
        }

        // We attempt to ACTIVATE (SignUp) if login fails.
        // This is a "Just-in-Time" registration.
        try {
            console.log("Login failed, attempting activation...");
            const authResponse = await activateAccount(schoolId, admissionNumber, password, 'student');

            if (authResponse.user) {
                // Post-Activation: Link/Clone Profile
                try {
                    await linkProfileAfterActivation(schoolId, authResponse.user.id, admissionNumber, 'student');
                } catch (linkError) {
                    console.error("Profile linking error during student activation:", {
                        message: linkError instanceof Error ? linkError.message : String(linkError),
                        error: linkError
                    });
                    // Continue anyway - user is already authenticated
                    // The profile might have been partially created
                }
                return authResponse;
            }
        } catch (activationError) {
            console.error("Activation failed:", activationError);
            throw activationError; // Throw activation error for better diagnostics
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
        // Check if it's an invalid credentials error (account exists but wrong password)
        if (error.message?.includes('invalid') || error.code === 'invalid_grant') {
            // Wrong password - don't try activation
            throw error;
        }

        // Account doesn't exist yet - Try Activation
        try {
            console.log("Login failed, attempting activation...");
            const authResponse = await activateAccount(schoolId, staffId, password, 'staff');
            if (authResponse.user) {
                try {
                    await linkProfileAfterActivation(schoolId, authResponse.user.id, staffId, 'staff');
                } catch (linkError) {
                    console.error("Profile linking error during staff activation:", {
                        message: linkError instanceof Error ? linkError.message : String(linkError),
                        error: linkError
                    });
                    // Continue anyway - user is already authenticated
                    // The profile might have been partially created
                }
                return authResponse;
            }
        } catch (activationError) {
            console.error("Activation failed:", activationError);
            // Throw activation error instead of original login error for better diagnostics
            throw activationError;
        }
    }

    return data;
}


/**
 * Repair a broken profile by syncing missing fields from Auth metadata
 */
export const repairProfileFromAuthMetadata = async (uid: string, user: any): Promise<void> => {
    if (!user || !user.user_metadata) {
        console.log('No user metadata available for repair');
        return;
    }

    try {
        const authMetadata = user.user_metadata;
        const schoolId = authMetadata.schoolId || authMetadata.school_id;
        const staffId = authMetadata.staff_id;
        const admissionNumber = authMetadata.admission_number;
        const fullName = authMetadata.full_name || authMetadata.fullName;

        // Only update if we have data to update
        if (schoolId || staffId || admissionNumber || fullName) {
            const updateData: any = {};

            if (schoolId) updateData.school_id = schoolId;
            if (staffId) updateData.staff_id = staffId;
            if (admissionNumber) updateData.admission_number = admissionNumber;
            if (fullName) updateData.full_name = fullName;

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', uid);

            if (error) {
                console.error('Failed to repair profile:', error);
            } else {
                console.log('Profile repaired with data from Auth metadata:', updateData);
            }
        }
    } catch (err) {
        console.error('Exception during profile repair:', err);
    }
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
