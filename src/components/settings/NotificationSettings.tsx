import { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Smartphone, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
    isPushSupported,
    getNotificationPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    isPushSubscribed,
    getNotificationPreferences,
    updateNotificationPreferences,
    showTestNotification,
    type NotificationPreferences,
} from '../../lib/pushNotificationService';

export const NotificationSettings = () => {
    const { user, schoolId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushSupported, setPushSupported] = useState(false);
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [preferences, setPreferences] = useState<NotificationPreferences>({
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

    useEffect(() => {
        loadSettings();
    }, [user]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            // Check push support
            const supported = isPushSupported();
            setPushSupported(supported);

            if (supported) {
                // Check permission
                const perm = getNotificationPermission();
                setPermission(perm);

                // Check subscription
                const subscribed = await isPushSubscribed();
                setPushSubscribed(subscribed);
            }

            // Load preferences
            if (user) {
                const prefs = await getNotificationPreferences(user.id);
                if (prefs) {
                    setPreferences(prefs);
                }
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePush = async () => {
        if (!user || !schoolId) return;

        setSaving(true);
        try {
            if (pushSubscribed) {
                // Unsubscribe
                await unsubscribeFromPushNotifications(user.id);
                setPushSubscribed(false);

                // Update preferences
                await updateNotificationPreferences(user.id, { push_enabled: false });
                setPreferences({ ...preferences, push_enabled: false });
            } else {
                // Subscribe
                const subscription = await subscribeToPushNotifications(user.id, schoolId);

                if (subscription) {
                    setPushSubscribed(true);
                    setPermission('granted');

                    // Update preferences
                    await updateNotificationPreferences(user.id, { push_enabled: true });
                    setPreferences({ ...preferences, push_enabled: true });
                } else {
                    // Permission denied or error
                    const perm = getNotificationPermission();
                    setPermission(perm);
                }
            }
        } catch (error) {
            console.error('Failed to toggle push notifications:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleSound = async () => {
        if (!user) return;

        const newValue = !preferences.sound_enabled;
        setPreferences({ ...preferences, sound_enabled: newValue });

        await updateNotificationPreferences(user.id, { sound_enabled: newValue });
    };

    const handleToggleVibration = async () => {
        if (!user) return;

        const newValue = !preferences.vibration_enabled;
        setPreferences({ ...preferences, vibration_enabled: newValue });

        await updateNotificationPreferences(user.id, { vibration_enabled: newValue });
    };

    const handleToggleType = async (type: keyof NotificationPreferences['types']) => {
        if (!user) return;

        const newTypes = {
            ...preferences.types,
            [type]: !preferences.types[type],
        };

        setPreferences({ ...preferences, types: newTypes });

        await updateNotificationPreferences(user.id, { types: newTypes });
    };

    const handleTestNotification = async () => {
        try {
            await showTestNotification();
        } catch (error) {
            console.error('Failed to show test notification:', error);
            alert('Failed to show test notification. Please check permissions.');
        }
    };

    if (loading) {
        return (
            <div className="bg-dark-card border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-dark-card border border-white/10 rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Notification Settings</h3>
                    <p className="text-sm text-gray-400">Manage how you receive notifications</p>
                </div>
            </div>

            {/* Push Notifications */}
            {pushSupported ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-white">Push Notifications</p>
                                <p className="text-xs text-gray-500">
                                    {pushSubscribed
                                        ? 'Receive notifications even when the app is closed'
                                        : 'Enable to receive notifications on this device'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleTogglePush}
                            disabled={saving || permission === 'denied'}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushSubscribed ? 'bg-teal-500' : 'bg-gray-600'
                                } ${saving || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushSubscribed ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {permission === 'denied' && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <p className="text-xs text-red-300">
                                Push notifications are blocked. Please enable them in your browser settings.
                            </p>
                        </div>
                    )}

                    {pushSubscribed && (
                        <button
                            onClick={handleTestNotification}
                            className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
                        >
                            Send Test Notification
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                    <p className="text-sm text-orange-300">
                        Push notifications are not supported in your browser.
                    </p>
                </div>
            )}

            {/* Sound & Vibration */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-sm font-bold text-white">Notification Style</h4>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {preferences.sound_enabled ? (
                            <Volume2 className="w-5 h-5 text-gray-400" />
                        ) : (
                            <VolumeX className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-white">Sound</p>
                            <p className="text-xs text-gray-500">Play sound for new notifications</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleSound}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.sound_enabled ? 'bg-teal-500' : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-white">Vibration</p>
                            <p className="text-xs text-gray-500">Vibrate on new notifications (mobile)</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleVibration}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.vibration_enabled ? 'bg-teal-500' : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.vibration_enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Notification Types */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-sm font-bold text-white">Notification Types</h4>

                {Object.entries(preferences.types).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {enabled ? (
                                <Check className="w-4 h-4 text-teal-400" />
                            ) : (
                                <X className="w-4 h-4 text-gray-600" />
                            )}
                            <p className="text-sm text-white capitalize">{type}</p>
                        </div>
                        <button
                            onClick={() => handleToggleType(type as keyof NotificationPreferences['types'])}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-teal-500' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
