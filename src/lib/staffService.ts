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

        const result = await response.json();

        if (!response.ok) {
            // If in development and function not deployed, fall back to direct insert
            if (!isProduction && (response.status === 404 || response.status === 0)) {
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

        return {
            staffId: result.staffId,
            docId: result.authId,
            message: "Staff invited successfully. Confirmation email sent."
        };
    } catch (error) {
        // Network/CORS error - likely function not deployed
        if (!isProduction && error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.warn('Edge function not reachable in development, using fallback...');
            return await createStaffAccountFallback(schoolId, data);
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
