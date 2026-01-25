import { useState, useEffect } from 'react';
import {
  Bell,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  Award,
  CreditCard,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { playNotificationSound, triggerVibration } from '../../lib/pushNotificationService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'attendance' | 'result' | 'fee';
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  timestamp: string;
  metadata?: {
    childId?: string;
    childName?: string;
    subjectName?: string;
    attendanceRate?: number;
    score?: number;
    amount?: number;
  };
}

export const NotificationCenter = () => {
  const { user, schoolId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'attendance' | 'result' | 'fee'>('all');
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !schoolId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const notificationsList = (data || []).map((notif: any) => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: notif.read,
          actionUrl: notif.link,
          timestamp: notif.created_at,
          metadata: notif.metadata || {},
        }));

        setNotifications(notificationsList);
        setUnreadCount(notificationsList.filter((n) => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`notifications:${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const newNotif = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            read: false,
            timestamp: payload.new.created_at,
            metadata: payload.new.metadata || {},
          };
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Play sound and vibrate on new notification
          playNotificationSound();
          triggerVibration();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, schoolId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const deletedNotif = notifications.find((n) => n.id === notificationId);
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'all') return true;
    return notif.type === filter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'warning':
      case 'attendance':
        return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'result':
        return <Award className="w-5 h-5 text-teal-400" />;
      case 'fee':
        return <CreditCard className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'warning':
      case 'attendance':
        return 'border-orange-500/30 bg-orange-500/5';
      case 'error':
        return 'border-red-500/30 bg-red-500/5';
      case 'result':
        return 'border-teal-500/30 bg-teal-500/5';
      case 'fee':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-3 rounded-full hover:bg-white/10 transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="fixed right-4 top-20 w-96 max-h-[600px] bg-dark-card border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-400" />
              Notifications
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-3 pb-0 flex gap-2 overflow-x-auto">
            {(['all', 'unread', 'attendance', 'result', 'fee'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors capitalize ${filter === f
                  ? 'bg-teal-500 text-dark-bg'
                  : 'text-gray-400 hover:text-white border border-white/10'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-xs text-teal-400 hover:text-teal-300 border-b border-white/5 transition-colors text-left"
            >
              Mark all as read
            </button>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No {filter !== 'all' ? filter : ''} notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-l-4 transition-all ${notif.read ? 'opacity-60' : 'border-teal-500'
                      } ${getNotificationColor(notif.type)} cursor-pointer hover:bg-white/5`}
                    onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{notif.title}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notif.message}</p>

                        {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            {notif.metadata.childName && (
                              <p>👤 {notif.metadata.childName}</p>
                            )}
                            {notif.metadata.subjectName && (
                              <p>📚 {notif.metadata.subjectName}</p>
                            )}
                            {notif.metadata.attendanceRate !== undefined && (
                              <p>📅 Attendance: {notif.metadata.attendanceRate}%</p>
                            )}
                            {notif.metadata.score !== undefined && (
                              <p>📊 Score: {notif.metadata.score}</p>
                            )}
                            {notif.metadata.amount !== undefined && (
                              <p>💰 Amount: ₦{notif.metadata.amount.toLocaleString()}</p>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notif.id);
                        }}
                        className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
