import { supabase } from './supabase';
import type { Notification, DocWithId } from './types';
import { playNotificationSound, triggerVibration } from './pushNotificationService';

/**
 * Send an in-app notification
 */
export const sendNotification = async (
    schoolId: string,
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    link?: string
) => {
    try {
        await supabase.from('notifications').insert({
            school_id: schoolId,
            user_id: userId,
            title,
            message,
            type,
            link,
            read: false
            // created_at is default
        });
    } catch (error) {
        console.error('Failed to send notification:', error);
    }
};

/**
 * Send a push notification using the Supabase edge function
 */
export const sendPushNotification = async (
    userId: string,
    schoolId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    tag?: string
) => {
    try {
        const { data: response, error } = await supabase.functions.invoke('send-push-notification', {
            body: {
                userId,
                schoolId,
                title,
                body,
                data,
                tag,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png'
            }
        });

        if (error) {
            console.error('Failed to send push notification:', error);
            return { success: false, error: error.message };
        }

        return { success: true, response };
    } catch (error) {
        console.error('Push notification error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

/**
 * Send an email notification using the Resend edge function
 */
export const sendEmailNotification = async (
    recipientEmail: string,
    recipientName: string,
    notificationType: 'attendance' | 'result' | 'message' | 'fee-payment' | 'general',
    data: {
        studentName?: string;
        studentClass?: string;
        teacherName?: string;
        subject?: string;
        reason?: string;
        date?: string;
        score?: number;
        totalScore?: number;
        term?: string;
        amount?: number;
        dueDate?: string;
        message?: string;
        link?: string;
    },
    schoolName: string,
    schoolEmail?: string,
    senderInfo?: { name: string; role: string }
): Promise<{ success: boolean; emailId?: string; error?: string }> => {
    try {
        const response = await supabase.functions.invoke('send-notifications', {
            body: {
                type: notificationType,
                recipient: {
                    email: recipientEmail,
                    name: recipientName,
                },
                sender: senderInfo,
                data,
                schoolName,
                schoolEmail: schoolEmail || `noreply@${schoolName.toLowerCase().replace(/\s+/g, '')}.edugemini.app`,
            },
        });

        if (response.error) {
            console.error('Failed to send email notification:', response.error);
            return {
                success: false,
                error: response.error.message || 'Failed to send email',
            };
        }

        return {
            success: true,
            emailId: response.data?.emailId,
        };
    } catch (error) {
        console.error('Email notification error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

/**
 * Send attendance alert to parent (email + in-app)
 */
export const sendAttendanceAlert = async (
    schoolId: string,
    studentId: string,
    studentName: string,
    studentClass: string,
    parentEmail: string,
    parentName: string,
    date: string,
    reason?: string,
    schoolName?: string
) => {
    try {
        // Send in-app notification
        await sendNotification(
            schoolId,
            studentId,
            '📋 Attendance Alert',
            `${studentName} was marked absent on ${date}`,
            'info',
            `/student/attendance`
        );

        // Send email notification
        await sendEmailNotification(
            parentEmail,
            parentName,
            'attendance',
            {
                studentName,
                studentClass,
                date,
                reason: reason || 'Not specified',
                link: `https://educore.app/parent/attendance`,
            },
            schoolName || 'School',
            undefined,
            { name: schoolName || 'School', role: 'admin' }
        );

        // Send push notification
        await sendPushNotification(
            studentId, // This might be the parent's user_id in some contexts, but studentId is often used as recipient
            schoolId,
            '📋 Attendance Alert',
            `${studentName} was marked absent on ${date}`,
            { link: '/student/attendance' },
            'attendance'
        );

        return { success: true };
    } catch (error) {
        console.error('Attendance alert error:', error);
        return { success: false, error };
    }
};

/**
 * Send result publication notification to parent (email + in-app)
 */
export const sendResultNotification = async (
    schoolId: string,
    studentId: string,
    studentName: string,
    parentEmail: string,
    parentName: string,
    subject: string,
    score: number,
    totalScore: number,
    term: string,
    schoolName?: string
) => {
    try {
        // Send in-app notification
        await sendNotification(
            schoolId,
            studentId,
            '📊 Results Published',
            `Results for ${subject} (${score}/${totalScore}) - ${term}`,
            'success',
            `/student/results`
        );

        // Send email notification
        await sendEmailNotification(
            parentEmail,
            parentName,
            'result',
            {
                studentName,
                subject,
                score,
                totalScore,
                term,
                link: `https://educore.app/parent/results`,
            },
            schoolName || 'School'
        );

        // Send push notification
        await sendPushNotification(
            studentId,
            schoolId,
            '📊 Results Published',
            `Results for ${subject} (${score}/${totalScore}) - ${term}`,
            { link: '/student/results' },
            'result'
        );

        return { success: true };
    } catch (error) {
        console.error('Result notification error:', error);
        return { success: false, error };
    }
};

/**
 * Send fee payment due notification to parent (email + in-app)
 */
export const sendFeeNotification = async (
    schoolId: string,
    studentId: string,
    studentName: string,
    parentEmail: string,
    parentName: string,
    amount: number,
    dueDate: string,
    schoolName?: string
) => {
    try {
        // Send in-app notification
        await sendNotification(
            schoolId,
            studentId,
            '💰 Fee Payment Due',
            `₦${amount.toLocaleString()} due on ${dueDate}`,
            'warning',
            `/parent/finances`
        );

        // Send email notification
        await sendEmailNotification(
            parentEmail,
            parentName,
            'fee-payment',
            {
                studentName,
                amount,
                dueDate,
                link: `https://educore.app/parent/pay`,
            },
            schoolName || 'School',
            undefined,
            { name: schoolName || 'School', role: 'bursar' }
        );

        // Send push notification
        await sendPushNotification(
            studentId,
            schoolId,
            '💰 Fee Payment Due',
            `₦${amount.toLocaleString()} due on ${dueDate}`,
            { link: '/parent/finances' },
            'fee'
        );

        return { success: true };
    } catch (error) {
        console.error('Fee notification error:', error);
        return { success: false, error };
    }
};

/**
 * Send new message notification to recipient (email + in-app)
 */
export const sendMessageNotification = async (
    schoolId: string,
    recipientId: string,
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    senderRole: string,
    messageSubject: string,
    messagePreview: string,
    schoolName?: string
) => {
    try {
        // Send in-app notification
        await sendNotification(
            schoolId,
            recipientId,
            '💬 New Message',
            `${senderName} sent you a message: "${messagePreview}"`,
            'info',
            `/messages`
        );

        // Send email notification
        await sendEmailNotification(
            recipientEmail,
            recipientName,
            'message',
            {
                subject: messageSubject,
                message: messagePreview,
                link: `https://educore.app/messages`,
            },
            schoolName || 'School',
            undefined,
            { name: senderName, role: senderRole }
        );

        // Send push notification
        await sendPushNotification(
            recipientId,
            schoolId,
            '💬 New Message',
            `${senderName} sent you a message: "${messagePreview}"`,
            { link: '/messages' },
            'message'
        );

        return { success: true };
    } catch (error) {
        console.error('Message notification error:', error);
        return { success: false, error };
    }
};

export const getNotifications = async (schoolId: string, userId: string, limit = 20): Promise<DocWithId<Notification>[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('school_id', schoolId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return (data || []).map(doc => ({
        id: doc.id,
        schoolId: doc.school_id,
        userId: doc.user_id,
        title: doc.title,
        message: doc.message,
        type: doc.type,
        link: doc.link,
        read: doc.read,
        createdAt: doc.created_at
    })) as DocWithId<Notification>[];
};

export const markAsRead = async (notificationId: string) => {
    try {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
};

export const markAllAsRead = async (notificationIds: string[]) => {
    try {
        if (notificationIds.length === 0) return;

        await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', notificationIds);
    } catch (error) {
        console.error('Failed to mark all as read:', error);
    }
};
