import { useEffect, useState } from 'react';
import { Sparkles, HelpCircle, Scan, Cloud, ArrowRight, ScrollText, Users } from 'lucide-react';
import { NavLink, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const Dashboard = () => {
    const { user, profile, role } = useAuth();
    const displayName = profile?.fullName || user?.user_metadata?.full_name || 'Teacher';
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    if (role === 'student' || role === 'parent') {
        return <Navigate to="/portal" replace />;
    }

    useEffect(() => {
        const fetchPendingGrades = async () => {
            if (!user) return;
            try {
                // Query results - RLS will automatically filter based on user role
                // Students: see their own results (student_id = auth.uid())
                // Staff: see results for their assigned classes
                // Admins: see all results in their school
                const { count, error } = await supabase
                    .from('results')
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.error('Error fetching pending grades - Details:', {
                        message: error.message,
                        code: error.code,
                        hint: error.hint,
                        details: error.details
                    });
                    throw error;
                }
                setPendingCount(count || 0);
            } catch (err) {
                console.error('Error fetching pending grades:', err instanceof Error ? err.message : String(err));
                setPendingCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchPendingGrades();
    }, [user]);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 p-[2px]">
                        <img src={`https://ui-avatars.com/api/?name=${displayName}&background=random`} alt="User" className="w-full h-full rounded-full bg-dark-bg" />
                    </div>
                    <div>
                        <div className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-0.5">Dashboard</div>
                        <h1 className="text-2xl font-bold text-white">Welcome, {displayName}</h1>
                    </div>
                </div>

                <div className="px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-teal-400" />
                    <span className="text-teal-400 text-sm font-bold">OFFLINE SYNCED</span>
                </div>
            </header>

            {/* AI Toolkit Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">AI Toolkit</h2>
                    <span className="text-teal-500 text-sm font-bold">4 tools available</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Big Main Card */}
                    <div className="md:col-span-2">
                        <NavLink to="/lessons" className="relative h-64 rounded-[32px] bg-gradient-to-br from-teal-600 to-teal-800 p-8 flex flex-col justify-between overflow-hidden group transition-transform hover:scale-[1.01]">
                            <div>
                                <Sparkles className="w-10 h-10 text-white mb-4" />
                                <h3 className="text-3xl font-bold text-white mb-2">Generate Lesson Note</h3>
                                <p className="text-teal-100 font-medium text-lg">Automate your SS1-SS3 content</p>
                            </div>

                            <div className="flex items-center gap-2 text-white font-bold bg-white/20 w-fit px-6 py-3 rounded-xl backdrop-blur-sm self-start group-hover:bg-white/30 transition-colors">
                                <span>Start Generating</span>
                                <ArrowRight className="w-5 h-5" />
                            </div>

                            {/* Decorative */}
                            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
                        </NavLink>
                    </div>

                    {/* Smaller Cards */}
                    <NavLink to="/exams" className="bg-dark-card border border-white/5 p-6 rounded-[24px] h-48 flex flex-col justify-between hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                            <HelpCircle className="w-6 h-6 text-teal-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Create Quiz</span>
                    </NavLink>

                    <NavLink to="/marking" className="bg-dark-card border border-white/5 p-6 rounded-[24px] h-48 flex flex-col justify-between hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                            <Scan className="w-6 h-6 text-teal-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Scan Scripts</span>
                    </NavLink>

                    <NavLink to="/class-manager" className="bg-dark-card border border-white/5 p-6 rounded-[24px] h-48 flex flex-col justify-between hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                            <Users className="w-6 h-6 text-teal-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Class Manager</span>
                    </NavLink>

                    <NavLink to="/attendance" className="bg-dark-card border border-white/5 p-6 rounded-[24px] h-48 flex flex-col justify-between hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                            <Calendar className="w-6 h-6 text-teal-400" />
                        </div>
                        <span className="text-xl font-bold text-white">Take Attendance</span>
                    </NavLink>
                </div>
            </div>

            {/* Today's Schedule */}
            <div>
                <div className="flex items-center justify-between mb-6 pt-4">
                    <h2 className="text-xl font-bold text-white">Today's Schedule</h2>
                    <span className="text-gray-500 text-sm font-bold">{new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>

                <div className="space-y-3">
                    <div className="text-center py-8 text-gray-500">
                        <p>No schedule added yet. Add your classes to track your daily timetable.</p>
                    </div>
                </div>
            </div>

            {/* Pending Grading */}
            <div className="relative overflow-hidden bg-dark-card border border-white/5 rounded-[32px] p-8">
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Graded Scripts</h2>
                        <p className="text-gray-400">{pendingCount === 0 ? 'No grades recorded yet' : 'Scores recorded from Paper Scanner'}</p>
                    </div>
                    {pendingCount > 0 && (
                        <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase">
                            {pendingCount} {pendingCount === 1 ? 'Grade' : 'Grades'}
                        </div>
                    )}
                </div>

                <div className="mt-8 relative z-10 flex items-end justify-between">
                    <div>
                        <span className="text-6xl font-bold text-white tracking-tighter">{loading ? '...' : pendingCount}</span>
                        <span className="ml-3 text-gray-500 font-bold tracking-widest text-sm uppercase">Scripts graded</span>
                    </div>
                    <NavLink to="/marking" className="bg-teal-500 text-dark-bg px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-400 transition-colors">
                        <ScrollText className="w-5 h-5" />
                        {pendingCount === 0 ? 'Start Grading' : 'View Analytics'}
                    </NavLink>
                </div>

                {/* Background Decor */}
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full translate-x-1/3 translate-y-1/3" />
            </div>
        </div>
    );
};

// Help helper
const Calendar = ({ className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);
