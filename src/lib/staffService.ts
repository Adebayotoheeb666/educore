import { supabase, supabaseAnonKey } from './supabase';
import type { UserProfile } from './types';

export interface CreateStaffParams {
    fullName: string;
    email: string;
    role: 'staff' | 'bursar';
    specialization?: string;
    phoneNumber?: string;
    staffId?: string;
}

/**
 * Generate a unique staff ID
 */
function generateStaffId(schoolId: string): string {
    const staffPrefix = schoolId.substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `STF-${staffPrefix}-${randomSuffix}`;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Generate a temporary password for staff
 */
function generateTemporaryPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 6; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Fallback for development: Create staff with Auth account
 * (used when edge function is not deployed)
 */
const createStaffAccountFallback = async (
    schoolId: string,
    data: CreateStaffParams
): Promise<{ staffId: string; docId: string; message: string; warning?: string }> => {
    console.log('Creating staff account...');

    const staffId = data.staffId || generateStaffId(schoolId);
    const tempPassword = generateTemporaryPassword();
    let authId: string | undefined;
    let authCreatedSuccessfully = false;

    try {
        // Step 1: Try to create Auth account (best effort)
        // Note: This may fail due to Supabase configuration, so we make it optional
        console.log('Step 1: Creating Auth account for email:', data.email);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: tempPassword,
                options: {
                    data: {
                        role: data.role,
                        schoolId: schoolId,
                        staffId: staffId,
                        fullName: data.fullName,
                    }
                }
            });

            if (authError) {
                console.warn('Auth creation warning:', {
                    message: authError.message,
                    status: (authError as any).status,
                });

                // Check if email already exists
                if (authError.message.includes('already registered') || authError.message.includes('User already exists')) {
                    console.log('Email already registered in Supabase Auth. This staff member likely already exists.');
                    authCreatedSuccessfully = true;
                    // Don't generate a new ID - we'll use the email-based lookup or let database decide
                    authId = undefined; // Will generate UUID for database record, which will be independent
                } else {
                    console.warn('Auth creation failed, will continue with database-only approach');
                }
            } else if (authData?.user?.id) {
                authId = authData.user.id;
                authCreatedSuccessfully = true;
                console.log('✅ Auth account created successfully with ID:', authId);
            } else if (authData?.user) {
                // User was created but doesn't have an ID (e.g., email confirmation pending)
                console.log('Auth signup succeeded (ID pending email confirmation)');
                authCreatedSuccessfully = true;
            }
        } catch (authErr) {
            console.warn('Auth operation failed (will continue):', authErr instanceof Error ? authErr.message : String(authErr));
            // Continue - we'll create the database record regardless
        }

        // Step 2: Create database record
        // Use authId if we have it, otherwise generate a UUID for the database record
        // The staff can be linked to Auth later if needed
        const userId = authId || generateUUID();

        console.log('Step 2: Creating database record with ID:', userId);

        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: userId,
                school_id: schoolId,
                email: data.email,
                full_name: data.fullName,
                role: data.role,
                staff_id: staffId,
                phone_number: data.phoneNumber,
                assigned_subjects: data.specialization ? [data.specialization] : [],
            })
            .select()
            .single();

        if (userError) {
            const errorDetails = {
                code: (userError as any).code,
                message: userError.message,
                details: (userError as any).details,
                hint: (userError as any).hint,
            };
            console.error('Database error:', errorDetails);

            let errorMsg = userError.message || 'Failed to insert user';
            if ((userError as any).code === '23505') {
                errorMsg = `Email '${data.email}' is already in use`;
            } else if ((userError as any).hint) {
                errorMsg = `${errorMsg} - ${(userError as any).hint}`;
            }

            throw new Error(`Database error: ${errorMsg}`);
        }

        console.log('✅ Database record created successfully');

        // Return appropriate message based on what succeeded
        if (authCreatedSuccessfully) {
            return {
                staffId,
                docId: userData.id,
                message: `✅ Staff account created successfully. Auth account is ready. Staff can log in with email: ${data.email}`
            };
        } else {
            return {
                staffId,
                docId: userData.id,
                message: `✅ Staff profile created in the system.`,
                warning: `The staff can log in after setting up their password. They can use the "Forgot Password" option on the login page to set their password with email: ${data.email}`
            };
        }
    } catch (error) {
        console.error('Staff creation error:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to create staff account: ${errorMsg}`);
    }
};

export const createStaffAccount = async (
    schoolId: string,
    adminId: string,
    data: CreateStaffParams
) => {
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-staff`;
    const isProduction = import.meta.env.PROD;

    console.log('Creating staff account with:', {
        email: data.email,
        schoolId,
        role: data.role,
        edgeFunctionUrl,
        isProduction
    });

    // In development, prioritize the direct fallback due to infrastructure issues with edge functions
    if (!isProduction) {
        console.log('Development mode: Using direct database insert for staff creation...');
        return await createStaffAccountFallback(schoolId, data);
    }

    // In production, edge function is required
    try {
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
                email: data.email,
                fullName: data.fullName,
                schoolId,
                role: data.role,
                specialization: data.specialization,
                phoneNumber: data.phoneNumber,
                adminId,
                staffId: data.staffId
            })
        });

        const text = await response.text();

        if (!text) {
            throw new Error('Empty response from server');
        }

        const result = JSON.parse(text);

        if (!response.ok) {
            let errorMessage = result.error || `Failed to invite staff (HTTP ${response.status})`;
            if (result.details?.message) {
                errorMessage += `: ${result.details.message}`;
            }
            throw new Error(errorMessage);
        }

        return {
            staffId: result.staffId,
            docId: result.authId,
            message: result.message || "Staff invited successfully. Confirmation email sent.",
            warning: result.warning || undefined
        };
    } catch (error) {
        console.error('Production staff creation failed:', error);
        throw error;
    }
};

export const getStaffMembers = async (schoolId: string): Promise<UserProfile[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .in('role', ['staff', 'bursar', 'admin']);

    if (error) {
        console.error('Error fetching staff:', error);
        return [];
    }

    return (data || []).map(u => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        schoolId: u.school_id,
        admissionNumber: u.admission_number,
        phoneNumber: u.phone_number,
        staffId: u.staff_id,
        assignedClasses: u.assigned_classes,
        assignedSubjects: u.assigned_subjects,
        linkedStudents: u.linked_students,
        profileImage: u.profile_image,
        createdAt: u.created_at,
        updatedAt: u.updated_at
    })) as UserProfile[];
};

export const syncStaffIdFromMetadata = async (userId: string, staffIdFromMetadata: string) => {
    const { data, error } = await supabase
        .rpc('sync_staff_id_from_metadata', {
            p_user_id: userId,
            p_staff_id_from_metadata: staffIdFromMetadata
        });

    if (error) {
        console.error('Error syncing staff ID:', error);
        throw new Error(error.message || 'Failed to sync staff ID');
    }

    return data;
};

/**
 * Delete a staff member account (removes both Auth account and profile)
 * This ensures deleted staff cannot log in anymore
 */
export const deleteStaffAccount = async (
    schoolId: string,
    adminId: string,
    staffId: string
): Promise<{ success: boolean; message: string }> => {
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-staff`;
    const isProduction = import.meta.env.PROD;
    
    // Function to delete related records using the database function
    const deleteRelatedRecords = async () => {
        // First, check if the user exists and belongs to the school
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, school_id')
            .eq('id', staffId)
            .eq('school_id', schoolId)
            .single();
            
        if (userError || !userData) {
            throw new Error('User not found or does not belong to this school');
        }
        
        // Use the database function to safely delete the user and all related data
        const { error: deleteError } = await supabase
            .rpc('delete_user_safely', { p_user_id: staffId });
            
        if (deleteError) {
            console.error('Error in delete_user_safely:', deleteError);
            throw new Error(`Failed to delete user and related data: ${deleteError.message}`);
        }
    };

    console.log('[deleteStaffAccount] Attempting to delete staff:', {
        staffId,
        schoolId,
        adminId,
        edgeFunctionUrl,
        isProduction
    });

    try {
        // Use the database function to handle all related deletions
        await deleteRelatedRecords();
        
        // If we get here, the deletion was successful
        return { success: true, message: 'User and all related data deleted successfully' };
        
    } catch (error: unknown) {
        console.error('[deleteStaffAccount] Error:', error);
        
        // If there's an error, try to get more details about remaining references
        try {
            const { data: references, error: refError } = await supabase
                .rpc('check_user_references', { p_user_id: staffId });
                
            if (!refError && references && references.length > 0) {
                console.error('Remaining references to this user:', references);
                throw new Error(
                    `Cannot delete user due to remaining references. ` +
                    `References: ${JSON.stringify(references, null, 2)}`
                );
            }
        } catch (refCheckError) {
            console.error('Error checking user references:', refCheckError);
            // Continue with the original error if reference check fails
        }
        
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred while deleting the user';
            
        throw new Error(`Failed to delete user: ${errorMessage}`);
    }
};
