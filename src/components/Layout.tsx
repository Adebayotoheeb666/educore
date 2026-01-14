
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileText, Camera, BarChart2, Settings, LogOut, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

// Helper for Tailwind classes
export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

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
    return (
        <div className="flex min-h-screen bg-dark-bg text-dark-text font-sans selection:bg-teal-500/30">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col p-6 fixed h-full bg-dark-bg/95 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-10 px-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                        <BookOpen className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        EduGemini
                    </span>
                </div>

                <nav className="flex-1 space-y-2">
                    <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/lessons" icon={BookOpen} label="Lesson Generator" />
                    <SidebarItem to="/exams" icon={FileText} label="Exam Builder" />
                    <SidebarItem to="/marking" icon={Camera} label="Paper Scanner" />
                    <SidebarItem to="/financial" icon={DollarSign} label="Financials" />
                    <SidebarItem to="/analytics" icon={BarChart2} label="Analytics" />
                    <div className="my-6 border-b border-white/5" />
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <button
                    onClick={async () => {
                        try {
                            await signOut(auth);
                            localStorage.removeItem('isAuthenticated'); // Clear mock auth if any
                            localStorage.removeItem('user');
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
                    {children}
                </div>
            </main>

            {/* Mobile Nav (Bottom) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-card border-t border-white/10 p-4 flex justify-around z-50 pb-safe">
                <NavLink to="/" className={({ isActive }) => isActive ? "text-teal-500" : "text-gray-500"}><LayoutDashboard /></NavLink>
                <NavLink to="/lessons" className={({ isActive }) => isActive ? "text-teal-500" : "text-gray-500"}><BookOpen /></NavLink>
                <NavLink to="/exams" className={({ isActive }) => isActive ? "text-teal-500" : "text-gray-500"}><FileText /></NavLink>
                <NavLink to="/analytics" className={({ isActive }) => isActive ? "text-teal-500" : "text-gray-500"}><BarChart2 /></NavLink>
            </nav>
        </div>
    );
};
