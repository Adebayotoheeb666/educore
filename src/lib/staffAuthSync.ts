/**
 * Staff Authentication Sync Service
 * Ensures every staff member has a corresponding Supabase Auth account
 * This is critical for audit logging and RBAC enforcement
 */

import { supabase } from './supabase';

const isProduction = import.meta.env.MODE === 'production';

/**
 * Generate virtual email for staff (similar to student pattern)
 */
export const getStaffVirtualEmail = (schoolId: string, staffId: string): string => {
    const cleanSchool = schoolId.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const cleanStaffId = staffId.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return `${cleanStaffId}@${cleanSchool}.educore.app`;
};

/**
 * Create Auth account for a staff member
 * Called when staff is created in the database
 * Uses Edge Function for service role access
 */
export const createStaffAuthAccount = async (
    schoolId: string,
    staffId: string,
    staffName: string,
    email?: string
): Promise<{ success: boolean; authId?: string; message: string }> => {
    try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
            return {
                success: false,
                message: 'Supabase URL not configured',
            };
        }

        // Get the session and auth token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
            return {
                success: false,
                message: 'Unable to authenticate request',
            };
        }

        // Call Edge Function to create auth with service role
        const url = `${supabaseUrl}/functions/v1/create-staff-auth`;
        console.log('Calling create-staff-auth function at:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                schoolId,
                staffId,
                staffName,
                email,
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            console.warn(`Create-staff-auth function returned ${response.status}`);
            return {
                success: false,
                message: `Failed to create Auth account: ${data.error || 'Unknown error'}`,
            };
        }

        const data = await response.json();
        return {
            success: true,
            authId: data.authId,
            message: data.message || 'Auth account created for staff member',
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Staff auth creation error:', errorMsg);

        // In development, if Edge Function fails, suggest deploying it
        if (!isProduction) {
            return {
                success: false,
                message: `Create-staff-auth Edge Function not available. Please deploy Supabase Edge Functions: run 'supabase functions deploy create-staff-auth' from your project root.`,
            };
        }

        return {
            success: false,
            message: `Error creating staff Auth account: ${errorMsg}`,
        };
    }
};

/**
 * Link existing Auth user to staff profile
 * Use this if Auth user was created separately
 */
export const linkStaffToAuthUser = async (
    staffProfileId: string,
    authUserId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ id: authUserId })
            .eq('id', staffProfileId);

        if (error) {
            return {
                success: false,
                message: `Failed to link staff to Auth: ${error.message}`,
            };
        }

        return {
            success: true,
            message: 'Staff linked to Auth user successfully',
        };
    } catch (err) {
        console.error('Staff linking error:', err);
        return {
            success: false,
            message: `Error linking staff: ${(err as Error).message}`,
        };
    }
};

/**
 * Verify all staff have Auth accounts
 * Returns list of staff without Auth accounts
 * Uses Edge Function for service role access to auth.admin API
 */
/**
 * Development fallback for staff audit (when Edge Function not deployed)
 * Uses client-side queries only (no admin API access needed)
 */
async function auditStaffAuthAccountsFallback(schoolId: string): Promise<{
    totalStaff: number;
    staffWithAuth: number;
    staffWithoutAuth: Array<{ id: string; name: string; email: string }>;
}> {
    try {
        // Fetch all staff in school from database
        const { data: allStaff, error: staffError } = await supabase
            .from('users')
            .select('id, full_name, email, auth_user_id')
            .eq('school_id', schoolId)
            .in('role', ['staff', 'admin', 'bursar']);

        if (staffError) {
            console.error('Error fetching staff:', staffError);
            return {
                totalStaff: 0,
                staffWithAuth: 0,
                staffWithoutAuth: [],
            };
        }

        // Find staff without Auth accounts by checking if auth_user_id is set
        // If the column doesn't exist, assume they don't have auth accounts
        const staffWithoutAuth = (allStaff || []).filter((staff) => {
            // Check if the staff member has an auth_user_id
            // If auth_user_id is null/undefined, they don't have an auth account
            return !staff.auth_user_id;
        });

        return {
            totalStaff: allStaff?.length || 0,
            staffWithAuth: (allStaff?.length || 0) - staffWithoutAuth.length,
            staffWithoutAuth: staffWithoutAuth.map((s) => ({
                id: s.id,
                name: s.full_name || 'Unknown',
                email: s.email || 'No email',
            })),
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Staff audit fallback error:', errorMsg);
        return {
            totalStaff: 0,
            staffWithAuth: 0,
            staffWithoutAuth: [],
        };
    }
}

export const auditStaffAuthAccounts = async (schoolId: string): Promise<{
    totalStaff: number;
    staffWithAuth: number;
    staffWithoutAuth: Array<{ id: string; name: string; email: string }>;
}> => {
    try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
            console.warn('Supabase URL not configured, using fallback');
            return auditStaffAuthAccountsFallback(schoolId);
        }

        // Get the session and auth token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.warn('Error getting session, using fallback:', sessionError);
            return auditStaffAuthAccountsFallback(schoolId);
        }

        if (!session?.access_token) {
            console.warn('No access token available, using fallback');
            return auditStaffAuthAccountsFallback(schoolId);
        }

        // Call Edge Function to perform audit with service role
        const url = `${supabaseUrl}/functions/v1/audit-staff-auth`;
        console.log('Calling audit function at:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ schoolId }),
        });

        if (!response.ok) {
            console.warn(`Audit function returned ${response.status}, using fallback`);
            return auditStaffAuthAccountsFallback(schoolId);
        }

        const data = await response.json();

        return {
            totalStaff: data.totalStaff || 0,
            staffWithAuth: data.staffWithAuth || 0,
            staffWithoutAuth: data.staffWithoutAuth || [],
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn('Audit function error, using fallback:', errorMsg);
        return auditStaffAuthAccountsFallback(schoolId);
    }
};

/**
 * Bulk create Auth accounts for staff without accounts
 * Use this to remediate staff that were created without Auth
 */
export const bulkCreateStaffAuthAccounts = async (schoolId: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ staffName: string; error: string }>;
}> => {
    try {
        const audit = await auditStaffAuthAccounts(schoolId);

        if (audit.staffWithoutAuth.length === 0) {
            return { success: 0, failed: 0, errors: [] };
        }

        const errors: Array<{ staffName: string; error: string }> = [];
        let successCount = 0;
        let failureCount = 0;

        // Create Auth accounts for staff without them
        for (const staff of audit.staffWithoutAuth) {
            const result = await createStaffAuthAccount(
                schoolId,
                staff.id,
                staff.name,
                staff.email
            );

            if (result.success) {
                successCount++;
            } else {
                failureCount++;
                errors.push({
                    staffName: staff.name,
                    error: result.message,
                });
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return {
            success: successCount,
            failed: failureCount,
            errors,
        };
    } catch (err) {
        console.error('Bulk staff auth creation error:', err);
        return {
            success: 0,
            failed: 1,
            errors: [
                {
                    staffName: 'Bulk operation',
                    error: (err as Error).message,
                },
            ],
        };
    }
};

/**
 * Send temporary password to staff (via email)
 * This would be called after creating Auth account
 */
export const sendStaffWelcomeEmail = async (
    staffEmail: string,
    staffName: string,
    schoolName: string,
    loginUrl: string
): Promise<{ success: boolean; message: string }> => {
    try {
        // Call notification service to send email
        const { error } = await supabase.functions.invoke(
            'send-notifications',
            {
                body: {
                    recipientEmail: staffEmail,
                    recipientName: staffName,
                    notificationType: 'general',
                    data: {
                        subject: 'Welcome to EduCore',
                        title: `Welcome, ${staffName}!`,
                        message: `You've been added as staff at ${schoolName}. Your account is ready to use. Please log in using your staff ID and the password that was shared separately.`,
                        actionUrl: loginUrl,
                        actionText: 'Go to Login',
                    },
                    schoolName: schoolName,
                },
            }
        );

        if (error) {
            return {
                success: false,
                message: `Failed to send email: ${error.message || 'Unknown error'}`,
            };
        }

        return {
            success: true,
            message: 'Welcome email sent successfully',
        };
    } catch (err) {
        console.error('Send welcome email error:', err);
        return {
            success: false,
            message: `Error sending email: ${(err as Error).message}`,
        };
    }
};
