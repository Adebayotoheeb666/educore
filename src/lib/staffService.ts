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
 * Fallback for development: Create staff directly in Supabase without Auth
 * (used when edge function is not deployed)
 */
const createStaffAccountFallback = async (
    schoolId: string,
    data: CreateStaffParams
): Promise<{ staffId: string; docId: string; message: string }> => {
    console.warn(
        '⚠️  Using development fallback for staff creation. ' +
        'The Supabase Edge Function "invite-staff" is not deployed. ' +
        'To use the full feature, deploy functions with: supabase functions deploy'
    );

    const staffId = data.staffId || generateStaffId(schoolId);

    // Create user profile directly in database
    // Note: This doesn't create an Auth account, which is a limitation in development
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
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
        console.error('Development fallback error:', userError);
        throw new Error(`Failed to create staff account: ${userError.message}`);
    }

    console.log(
        '✅ Staff created in database (development mode). ' +
        'Note: Auth account was not created. Staff cannot log in yet. ' +
        'Deploy the edge function for full functionality.'
    );

    return {
        staffId,
        docId: userData.id,
        message: `Staff profile created in development mode. ` +
            `Note: Deploy Supabase functions for Auth account creation and email notifications.`
    };
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

    try {
        // Try to use edge function (production or if deployed in development)
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

        console.log('Edge function response status:', response.status);

        const result = await response.json();
        console.log('Edge function result:', result);

        if (!response.ok) {
            // If in development and function not deployed, fall back to direct insert
            if (!isProduction && (response.status === 404 || response.status === 0)) {
                console.log('Function not deployed (404), using fallback...');
                return await createStaffAccountFallback(schoolId, data);
            }

            // Build detailed error message with any available details
            let errorMessage = result.error || `Failed to invite staff (HTTP ${response.status})`;
            if (result.details) {
                console.error('Edge function error details:', result.details);
                // Include specific error info if available
                if (typeof result.details === 'object') {
                    if (result.details.message) {
                        errorMessage += `: ${result.details.message}`;
                    }
                }
            }
            throw new Error(errorMessage);
        }

        // Handle both successful auth creation and fallback profile-only creation
        return {
            staffId: result.staffId,
            docId: result.authId,
            message: result.message || "Staff invited successfully. Confirmation email sent.",
            warning: result.warning || undefined
        };
    } catch (error) {
        console.error('Staff creation attempt failed:', error);

        // Network/CORS error - likely function not deployed or network issue
        if (!isProduction) {
            const isNetworkError = error instanceof TypeError &&
                (error.message.includes('Failed to fetch') ||
                 error.message.includes('CORS') ||
                 error.message.includes('NetworkError'));

            if (isNetworkError) {
                console.warn('Edge function not reachable in development, using fallback...');
                try {
                    return await createStaffAccountFallback(schoolId, data);
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    throw new Error(`Failed to create staff account: ${
                        fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
                    }`);
                }
            }
        }
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
