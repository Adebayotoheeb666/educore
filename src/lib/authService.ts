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
                    console.log('[loginWithParentId] Starting parent profile linking for auth user:', authResponse.user.id);

                    // Step 1: Try to use the RPC if it exists (for production after migrations are deployed)
                    // If it doesn't exist yet, we'll handle the migration manually in Step 2
                    let rpcSucceeded = false;
                    console.log('[loginWithParentId] Attempting to call link_parent_profile_after_login RPC...');
                    const { data: rpcResult, error: rpcError } = await supabase.rpc('link_parent_profile_after_login', {
                        p_school_id: schoolId,
                        p_new_parent_uid: authResponse.user.id,
                        p_parent_id: parentId
                    });

                    if (rpcError) {
                        if (rpcError.code === 'PGRST202') {
                            // Function doesn't exist yet - this is OK, we'll handle it manually
                            console.warn('[loginWithParentId] RPC function not yet deployed, falling back to client-side approach');
                        } else {
                            console.error('[loginWithParentId] RPC error:', {
                                message: rpcError.message,
                                code: rpcError.code,
                                details: rpcError.details,
                                hint: rpcError.hint
                            });
                        }
                    } else {
                        console.log('[loginWithParentId] RPC executed successfully. Result:', rpcResult);
                        rpcSucceeded = true;
                    }

                    // Step 2: If RPC didn't work, handle the profile update manually
                    // We can update our own profile without RLS issues
                    if (!rpcSucceeded) {
                        console.log('[loginWithParentId] Step 2: Handling profile setup manually...');

                        try {
                            // Find the admin-created placeholder parent to get its ID
                            const { data: placeholderParent, error: findError } = await supabase
                                .from('users')
                                .select('id')
                                .eq('school_id', schoolId)
                                .eq('admission_number', parentId)
                                .eq('role', 'parent')
                                .neq('id', authResponse.user.id)
                                .maybeSingle();

                            if (findError) {
                                console.warn('[loginWithParentId] Could not find placeholder parent:', findError.message);
                            } else if (placeholderParent) {
                                console.log('[loginWithParentId] Found placeholder parent:', placeholderParent.id);

                                // Migrate parent_student_links from placeholder to new auth user
                                // This is an UPDATE operation which should work even with RLS
                                console.log('[loginWithParentId] Migrating parent_student_links to new auth user...');
                                const { error: migrateError } = await supabase
                                    .from('parent_student_links')
                                    .update({ parent_id: authResponse.user.id })
                                    .eq('school_id', schoolId)
                                    .eq('parent_id', placeholderParent.id);

                                if (migrateError) {
                                    console.error('[loginWithParentId] Error migrating links:', {
                                        message: migrateError.message,
                                        code: migrateError.code,
                                        details: migrateError.details
                                    });
                                } else {
                                    console.log('[loginWithParentId] Successfully migrated parent_student_links');
                                }

                                // Note: We cannot delete the placeholder parent due to RLS restrictions
                                // That's why the RPC function was created. Once deployed, it will handle deletion.
                                // For now, the placeholder will remain but won't interfere since the actual
                                // parent_student_links will point to the authenticated user.
                                console.log('[loginWithParentId] Note: Placeholder parent record will remain until RPC is deployed');
                            }
                        } catch (migrationException) {
                            console.error('[loginWithParentId] Exception during manual migration:', {
                                message: migrationException instanceof Error ? migrationException.message : String(migrationException)
                            });
                        }

                        // Update our own profile with correct parent data
                        console.log('[loginWithParentId] Updating own profile with parent role...');
                        try {
                            const { error: updateError } = await supabase
                                .from('users')
                                .update({
                                    role: 'parent',
                                    admission_number: parentId,
                                    school_id: schoolId
                                })
                                .eq('id', authResponse.user.id);

                            if (updateError) {
                                console.error('[loginWithParentId] Error updating profile:', {
                                    message: updateError.message,
                                    code: updateError.code,
                                    details: updateError.details
                                });
                            } else {
                                console.log('[loginWithParentId] Successfully updated own profile');
                            }
                        } catch (updateException) {
                            console.error('[loginWithParentId] Exception updating profile:', {
                                message: updateException instanceof Error ? updateException.message : String(updateException)
                            });
                        }
                    }

                    // Step 3: Update auth metadata to reflect parent role
                    console.log('[loginWithParentId] Updating auth metadata with parent role...');
                    try {
                        await supabase.auth.updateUser({
                            data: {
                                schoolId: schoolId,
                                admission_number: parentId,
                                role: 'parent'
                            }
                        });
                        console.log('[loginWithParentId] Successfully updated auth metadata');
                    } catch (authUpdateError) {
                        console.error('[loginWithParentId] Error updating auth metadata:', {
                            message: authUpdateError instanceof Error ? authUpdateError.message : String(authUpdateError)
                        });
                        // Continue anyway - profile is already set up
                    }
                } catch (linkError) {
                    console.error("Profile linking error during parent activation:", {
                        message: linkError instanceof Error ? linkError.message : String(linkError)
                    });
                    // Continue anyway - user is already authenticated
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
        console.log('[repairProfileFromAuthMetadata] No user metadata available for repair');
        return;
    }

    try {
        const authMetadata = user.user_metadata;
        const schoolId = authMetadata.schoolId || authMetadata.school_id;
        const staffId = authMetadata.staff_id;
        const admissionNumber = authMetadata.admission_number;
        const fullName = authMetadata.full_name || authMetadata.fullName;
        const email = user.email;
        const role = authMetadata.role;

        console.log('[repairProfileFromAuthMetadata] Metadata found:', {
            schoolId,
            staffId,
            admissionNumber,
            fullName,
            email,
            role,
            uid
        });

        // First, check if the profile already exists
        const { data: existingProfile, error: fetchError } = await supabase
            .from('users')
            .select('id, school_id, admission_number, staff_id, full_name, email, role')
            .eq('id', uid)
            .maybeSingle();

        if (fetchError) {
            console.warn('[repairProfileFromAuthMetadata] Error checking for existing profile:', fetchError.message);
            return;
        }

        if (existingProfile) {
            console.log('[repairProfileFromAuthMetadata] Profile exists. Current state:', existingProfile);

            // Profile exists - ONLY repair cosmetic/non-constraint fields
            // DO NOT repair: school_id, admission_number, staff_id, or role
            // These should only be set through proper registration/creation flows
            const updateData: any = {};

            // SAFE fields that have no unique constraints and are cosmetic
            if (fullName && !existingProfile.full_name) {
                updateData.full_name = fullName;
                console.log('[repairProfileFromAuthMetadata] Will repair full_name');
            }
            if (email && !existingProfile.email) {
                updateData.email = email;
                console.log('[repairProfileFromAuthMetadata] Will repair email');
            }

            // DO NOT repair these constraint-sensitive fields via repair mechanism:
            // - school_id: Changing this with an existing admission_number violates unique constraint
            // - admission_number: Unique per (school_id, admission_number) pair
            // - staff_id: Unique per (school_id, staff_id) pair
            // - role: Should only be set through proper creation flows
            // These should be set through proper registration/admin creation, not repair

            if (schoolId && !existingProfile.school_id) {
                console.warn('[repairProfileFromAuthMetadata] school_id missing but repair skipped - must use proper registration flow');
            }
            if (admissionNumber && !existingProfile.admission_number) {
                console.warn('[repairProfileFromAuthMetadata] admission_number missing but repair skipped - must use proper registration flow');
            }
            if (staffId && !existingProfile.staff_id) {
                console.warn('[repairProfileFromAuthMetadata] staff_id missing but repair skipped - must use proper registration flow');
            }
            if (role && !existingProfile.role) {
                console.warn('[repairProfileFromAuthMetadata] role missing but repair skipped - must use proper registration flow');
            }

            if (Object.keys(updateData).length > 0) {
                console.log('[repairProfileFromAuthMetadata] Attempting update with cosmetic fields only:', updateData);

                const { error: updateError } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', uid);

                if (updateError) {
                    console.error('[repairProfileFromAuthMetadata] Update failed:', updateError.message, 'Code:', updateError.code);
                } else {
                    console.log('[repairProfileFromAuthMetadata] Profile updated successfully with cosmetic repairs');
                }
            } else {
                console.log('[repairProfileFromAuthMetadata] No cosmetic fields to repair. Profile structural fields (school_id, admission_number, staff_id, role) must be set through proper registration flows, not repair');
            }
        } else {
            console.log('[repairProfileFromAuthMetadata] Profile does not exist - cannot create via repair (use proper registration flow)');
            console.log('[repairProfileFromAuthMetadata] User should register through activation flow or admin creation');
        }
    } catch (err) {
        console.error('[repairProfileFromAuthMetadata] Exception during profile repair:', err instanceof Error ? err.message : err);
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
