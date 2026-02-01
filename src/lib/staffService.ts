import { supabase } from './supabase';
import type { UserProfile } from './types';
import { logAction } from './auditService';
import { getVirtualEmail } from './authService';

declare const process: {
    env: {
        NODE_ENV?: 'development' | 'production' | 'test';
    };
};

export interface CreateStaffParams {
    fullName: string;
    email?: string;  // Made optional as we'll use virtual email if not provided
    role: 'staff' | 'bursar' | 'admin';
    specialization?: string;
    phoneNumber?: string;
    staffId?: string;
    sendInviteEmail?: boolean; // Whether to send an invitation email
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
 * Generate a deterministic UUID from staff data
 */
async function generateDeterministicUUID(schoolId: string, staffId: string): Promise<string> {
    const input = `staff_${schoolId}_${staffId.toLowerCase()}`;
    const msgUint8 = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Convert to UUID format (8-4-4-4-12)
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32)
    ].join('-');
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
 * Create a staff account with auth user
 */
interface CreateStaffAccountResult {
    staffId: string;
    docId: string;
    message: string;
    warning?: string;
    tempPassword?: string;
}

export const createStaffAccount = async (
    schoolId: string,
    adminId: string,
    data: CreateStaffParams
): Promise<CreateStaffAccountResult> => {
    const staffId = data.staffId || generateStaffId(schoolId);
    const email = data.email || getVirtualEmail(schoolId, staffId);
    const tempPassword = generateTemporaryPassword();
    
    try {
        // 1. Generate deterministic staff UUID
        const userId = await generateDeterministicUUID(schoolId, staffId);

        // 2. Prepare user data for the RPC call
        const userData = {
            id: userId,
            email: email,
            password: tempPassword,
            user_metadata: {
                full_name: data.fullName,
                role: data.role,
                schoolId: schoolId,
                staff_id: staffId,
                phone_number: data.phoneNumber || null,
                specialization: data.specialization || null
            }
        };

        console.log('Creating user with data:', JSON.stringify(userData, null, 2));

        // 3. Call the RPC function to create the user
        const { data: createdUser, error: rpcError } = await supabase.rpc('create_user_with_profile', {
            user_data: userData
        });

        if (rpcError) {
            console.error('User creation failed:', rpcError);
            throw new Error(`Failed to create user: ${rpcError.message}`);
        }

        if (!createdUser) {
            throw new Error('User creation returned no data');
        }

        // 4. Log the action
        await logAction(
            schoolId, 
            adminId, 
            'System', // User name - in a real app, you might want to fetch this from the admin user
            'create', 
            'staff',
            userId,
            {
                staffId,
                fullName: data.fullName,
                email: email,
                role: data.role
            },
            { 
                timestamp: new Date().toISOString(),
                staffId: staffId
            }
        );

        const result: CreateStaffAccountResult = {
            staffId,
            docId: userId,
            message: `Staff account created successfully. Login with email: ${email} and temporary password.`,
        };

        // Include the temporary password in non-production environments
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            result.tempPassword = tempPassword;
        }

        return result;
    } catch (err) {
        console.error('Error creating staff:', err);
        throw err;
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
