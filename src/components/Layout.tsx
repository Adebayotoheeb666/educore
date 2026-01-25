import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileText, Camera, BarChart2, Settings, LogOut, DollarSign, CheckCircle2, Calculator, Users, ShieldCheck, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/cn';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { clearUserContext } from '../lib/sentry';
import { getNotifications, markAsRead, markAllAsRead } from '../lib/notificationService';
import type { Notification } from '../lib/types';
import { OfflineIndicator } from './common/OfflineIndicator';

interface LayoutProps {
    children: ReactNode;
}

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                    ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_15px_rgba(0,150,136,0.1)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
            )
        }
    >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
    </NavLink>
);

export const Layout = ({ children }: LayoutProps) => {
    const navigate = useNavigate();
    const { profile, schoolId, user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (schoolId && user) {
                try {
                    const data = await getNotifications(schoolId, user.id);
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.read).length);
                } catch (error) {
                    // Silently fail - notifications are not critical
                    console.warn('Failed to fetch notifications (non-critical):', error);
                    setNotifications([]);
                    setUnreadCount(0);
                }
            }
        };

        if (schoolId && user) {
            fetchNotifications();
            // Poll every minute for new notifications
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [schoolId, user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: Notification & { id?: string }) => {
        if (!notification.read && notification.id) {
            await markAsRead(notification.id);
            setNotifications(prev => prev.map(n =>
                (n as any).id === notification.id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        if (notification.link) {
            navigate(notification.link);
            setShowNotifications(false);
        }
    };

    const handleMarkAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => (n as any).id).filter(Boolean);
        if (unreadIds.length > 0) {
            await markAllAsRead(unreadIds);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        }
    };

    return (
        <div className="flex min-h-screen bg-dark-bg text-dark-text font-sans selection:bg-teal-500/30">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col p-6 fixed h-full bg-dark-bg/95 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-10 px-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                        <BookOpen className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        EduCore
                    </span>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto min-h-0 custom-scrollbar">
                    <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

                    {/* Admin Specific Links */}
                    {profile?.role === 'admin' && (
                        <>
                            <SidebarItem to="/admin" icon={ShieldCheck} label="School Admin" />
                            <SidebarItem to="/admin/users" icon={Users} label="User Management" />
                            <SidebarItem to="/admin/staff-auth" icon={ShieldCheck} label="Staff Auth Audit" />
                            <SidebarItem to="/admin/audit-logs" icon={FileText} label="Audit Logs" />
                        </>
                    )}

                    {/* Staff Links */}
                    {(profile?.role === 'admin' || profile?.role === 'staff') && (
                        <>
                            <SidebarItem to="/lessons" icon={BookOpen} label="Lesson Generator" />
                            <SidebarItem to="/exams" icon={FileText} label="Exam Builder" />
                            <SidebarItem to="/marking" icon={Camera} label="Paper Scanner" />
                            <SidebarItem to="/students/assign" icon={Users} label="Student Assignment" />
                            <SidebarItem to="/attendance" icon={CheckCircle2} label="Attendance" />
                            <SidebarItem to="/grades" icon={Calculator} label="Grades" />
                            <SidebarItem to="/financial" icon={DollarSign} label="Financials" />
                            <SidebarItem to="/analytics" icon={BarChart2} label="Analytics" />
                        </>
                    )}

                    {/* Student/Parent Links */}
                    {(profile?.role === 'student' || profile?.role === 'parent') && (
                        <>
                            <SidebarItem to="/portal" icon={LayoutDashboard} label="My Portal" />
                            <SidebarItem to="/portal/attendance" icon={CheckCircle2} label="My Attendance" />
                            <SidebarItem to="/portal/results" icon={Calculator} label="My Results" />
                        </>
                    )}

                    <div className="my-6 border-b border-white/5" />
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <button
                    onClick={async () => {
                        try {
                            await supabase.auth.signOut();
                            localStorage.removeItem('isAuthenticated'); // Clear mock auth if any
                            localStorage.removeItem('user');
                            clearUserContext(); // Clear Sentry user context
                            navigate('/login');
                        } catch (e) {
                            console.error("Logout failed", e);
                        }
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mt-auto"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Top Bar with Notifications and Offline Indicator */}
                    <div className="flex justify-between items-center mb-6 relative z-40">
                        <OfflineIndicator />
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-dark-bg">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-dark-card border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="font-bold text-white">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-xs text-teal-400 hover:text-teal-300 font-medium"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 text-sm">
                                                No notifications yet
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-white/5">
                                                {notifications.map((notification, idx) => (
                                                    <div
                                                        key={(notification as any).id ? `notif-${(notification as any).id}` : `notif-fallback-${idx}`}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={cn(
                                                            "p-4 cursor-pointer hover:bg-white/5 transition-colors",
                                                            !notification.read && "bg-teal-500/5"
                                                        )}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                                                notification.type === 'error' ? "bg-red-500" :
                                                                    notification.type === 'warning' ? "bg-orange-500" :
                                                                        notification.type === 'success' ? "bg-emerald-500" :
                                                                            "bg-blue-500"
                                                            )} />
                                                            <div>
                                                                <h4 className={cn(
                                                                    "text-sm font-medium mb-1",
                                                                    !notification.read ? "text-white" : "text-gray-400"
                                                                )}>
                                                                    {notification.title}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                                    {notification.message}
                                                                </p>
                                                                <span className="text-[10px] text-gray-600 mt-2 block">
                                                                    {notification.createdAt && typeof notification.createdAt !== 'string'
                                                                        ? (notification.createdAt as any).toDate?.().toLocaleDateString()
                                                                        : new Date().toLocaleDateString()
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {children}
                </div>
            </main>

            {/* Mobile Nav (Bottom) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-card border-t border-white/10 p-4 flex justify-around z-50 pb-safe overflow-x-auto">
                {profile?.role === 'admin' && (
                    <NavLink to="/admin" className={({ isActive }) => isActive ? "text-teal-500 flex-shrink-0" : "text-gray-500 flex-shrink-0"} title="School Admin">
                        <ShieldCheck className="w-6 h-6" />
                    </NavLink>
                )}
                <NavLink to="/" className={({ isActive }) => isActive ? "text-teal-500 flex-shrink-0" : "text-gray-500 flex-shrink-0"}><LayoutDashboard className="w-6 h-6" /></NavLink>
                <NavLink to="/lessons" className={({ isActive }) => isActive ? "text-teal-500 flex-shrink-0" : "text-gray-500 flex-shrink-0"}><BookOpen className="w-6 h-6" /></NavLink>
                <NavLink to="/exams" className={({ isActive }) => isActive ? "text-teal-500 flex-shrink-0" : "text-gray-500 flex-shrink-0"}><FileText className="w-6 h-6" /></NavLink>
                <NavLink to="/analytics" className={({ isActive }) => isActive ? "text-teal-500 flex-shrink-0" : "text-gray-500 flex-shrink-0"}><BarChart2 className="w-6 h-6" /></NavLink>
            </nav>
        </div>
    );
};
