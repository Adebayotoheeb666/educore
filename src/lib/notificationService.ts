import { supabase } from './supabase';
import type { Notification, DocWithId } from './types';

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
