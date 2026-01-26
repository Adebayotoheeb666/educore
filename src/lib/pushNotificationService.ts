import { supabase } from './supabase';

/**
 * Push Notification Service
 * Handles browser push notifications using Web Push API
 */

export interface PushSubscriptionData {
    endpoint: string;
    p256dh: string;
    auth: string;
}

export interface NotificationPreferences {
    push_enabled: boolean;
    sound_enabled: boolean;
    vibration_enabled: boolean;
    types: {
        attendance: boolean;
        results: boolean;
        fees: boolean;
        messages: boolean;
        general: boolean;
    };
}

// VAPID public key (this should be generated and stored securely)
// For production, generate using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDJo3QVy8qhJOKQdXNVKjZMJNLhYJhzVJJKNRJKNRJKN';

/**
 * Check if push notifications are supported
 */
export const isPushSupported = (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Check current notification permission
 */
export const getNotificationPermission = (): NotificationPermission => {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
};

/**
 * Convert VAPID key from base64 to Uint8Array
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async (
    userId: string,
    schoolId: string
): Promise<PushSubscriptionData | null> => {
    try {
        if (!isPushSupported()) {
            throw new Error('Push notifications not supported');
        }

        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            throw new Error('Notification permission denied');
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });

        // Extract subscription data
        const subscriptionJSON = subscription.toJSON();
        const subscriptionData: PushSubscriptionData = {
            endpoint: subscriptionJSON.endpoint!,
            p256dh: subscriptionJSON.keys!.p256dh!,
            auth: subscriptionJSON.keys!.auth!,
        };

        // Save subscription to database
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                school_id: schoolId,
                endpoint: subscriptionData.endpoint,
                p256dh: subscriptionData.p256dh,
                auth: subscriptionData.auth,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,endpoint',
            });

        if (error) {
            console.error('Failed to save push subscription:', error);
            throw error;
        }

        console.log('Push notification subscription successful');
        return subscriptionData;
    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        return null;
    }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async (
    userId: string
): Promise<boolean> => {
    try {
        if (!isPushSupported()) {
            return false;
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Get current subscription
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Unsubscribe
            await subscription.unsubscribe();

            // Remove from database
            const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', userId);

            if (error) {
                console.error('Failed to remove push subscription from database:', error);
            }
        }

        console.log('Push notification unsubscription successful');
        return true;
    } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
        return false;
    }
};

/**
 * Check if user is subscribed to push notifications
 */
export const isPushSubscribed = async (): Promise<boolean> => {
    try {
        if (!isPushSupported()) {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        return subscription !== null;
    } catch (error) {
        console.error('Failed to check push subscription:', error);
        return false;
    }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (
    userId: string
): Promise<NotificationPreferences | null> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('notification_preferences')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return data?.notification_preferences || getDefaultPreferences();
    } catch (error) {
        console.error('Failed to get notification preferences:', error);
        return getDefaultPreferences();
    }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
    userId: string,
    preferences: Partial<NotificationPreferences>
): Promise<boolean> => {
    try {
        const currentPrefs = await getNotificationPreferences(userId);
        const updatedPrefs = { ...currentPrefs, ...preferences };

        const { error } = await supabase
            .from('users')
            .update({ notification_preferences: updatedPrefs })
            .eq('id', userId);

        if (error) throw error;

        console.log('Notification preferences updated');
        return true;
    } catch (error) {
        console.error('Failed to update notification preferences:', error);
        return false;
    }
};

/**
 * Get default notification preferences
 */
const getDefaultPreferences = (): NotificationPreferences => ({
    push_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
    types: {
        attendance: true,
        results: true,
        fees: true,
        messages: true,
        general: true,
    },
});

/**
 * Show a test notification
 */
export const showTestNotification = async (): Promise<void> => {
    try {
        const permission = await requestNotificationPermission();

        if (permission !== 'granted') {
            throw new Error('Notification permission not granted');
        }

        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification('EduCore Test Notification', {
            body: 'Push notifications are working! 🎉',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            vibrate: [200, 100, 200],
            tag: 'test-notification',
            requireInteraction: false,
            actions: [
                {
                    action: 'close',
                    title: 'Close',
                },
            ],
        } as NotificationOptions & { vibrate?: VibratePattern });
    } catch (error) {
        console.error('Failed to show test notification:', error);
        throw error;
    }
};

/**
 * Play notification sound
 */
export const playNotificationSound = () => {
    try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.warn('Could not play notification sound:', err));
    } catch (error) {
        console.warn('Notification sound not available:', error);
    }
};

/**
 * Trigger vibration
 */
export const triggerVibration = (pattern: number[] = [200, 100, 200]) => {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
};
