/**
 * Staff Authentication Sync Service
 * Ensures every staff member has a corresponding Supabase Auth account
 * This is critical for audit logging and RBAC enforcement
 */

import { supabase } from './supabase';

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
        // Call Edge Function to create auth with service role
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-auth`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
                },
                body: JSON.stringify({
                    schoolId,
                    staffId,
                    staffName,
                    email,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: `Failed to create Auth account: ${data.error || 'Unknown error'}`,
            };
        }

        return {
            success: true,
            authId: data.authId,
            message: data.message || 'Auth account created for staff member',
        };
    } catch (err) {
        console.error('Staff auth creation error:', err);
        return {
            success: false,
            message: `Error creating staff Auth account: ${(err as Error).message}`,
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
export const auditStaffAuthAccounts = async (schoolId: string): Promise<{
    totalStaff: number;
    staffWithAuth: number;
    staffWithoutAuth: Array<{ id: string; name: string; email: string }>;
}> => {
    try {
        // Call Edge Function to perform audit with service role
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-staff-auth`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
                },
                body: JSON.stringify({ schoolId }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Staff auth audit error:', data.error);
            return {
                totalStaff: 0,
                staffWithAuth: 0,
                staffWithoutAuth: [],
            };
        }

        return {
            totalStaff: data.totalStaff || 0,
            staffWithAuth: data.staffWithAuth || 0,
            staffWithoutAuth: data.staffWithoutAuth || [],
        };
    } catch (err) {
        console.error('Staff auth audit error:', err);
        return {
            totalStaff: 0,
            staffWithAuth: 0,
            staffWithoutAuth: [],
        };
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
