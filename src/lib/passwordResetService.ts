import { supabase } from './supabase';

/**
 * Send password reset email to user
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password', // Redirect to specific reset page
    });

    if (error) throw error;
};

/**
 * Verify password reset code
 * In Supabase, the link logs the user in automatically with a 'recovery' event.
 * There isn't a separate "verify code" step that doesn't also log you in.
 * We'll use this to actually sign in if a code (hash) is passed, or just return success.
 */
export const verifyResetCode = async (_code: string): Promise<string> => {
    // Supabase handles this via the URL hash automatically.
    // If this is called, it might be legacy. 
    // If 'code' is actually a token, we might try to set the session.
    // But usually we just let the auto-handler work.
    // We'll return a placeholder email or current user email if logged in.

    // Check if we have a session (means recovery link worked)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) return session.user.email;

    // If no session, we can't really "verify" a code without consuming it.
    return "";
};

/**
 * Confirm password reset with new password
 * Assumes the user is already authenticated via the recovery link.
 */
export const confirmReset = async (_code: string, newPassword: string): Promise<void> => {
    // We ignore 'code' as Supabase recovery link authenticates the user.
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) throw error;
};

/**
 * Admin-assisted password reset for user accounts
 * Calls the reset-password edge function
 */
export const adminResetUserPassword = async (
    adminEmail: string,
    targetUserId: string,
    newPassword: string
): Promise<{ success: boolean; message: string }> => {
    try {
        // Get auth session to get Bearer token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            throw new Error('Not authenticated. Please log in first.');
        }

        // Call edge function
        const { data, error } = await supabase.functions.invoke('reset-password', {
            body: {
                email: adminEmail,
                targetUserId: targetUserId,
                newPassword: newPassword,
            },
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (error) {
            throw new Error(error.message || 'Failed to reset password');
        }

        return {
            success: data.success,
            message: data.message
        };
    } catch (err) {
        console.error('Password reset error:', err);
        throw err;
    }
};
