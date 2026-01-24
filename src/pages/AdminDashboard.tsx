import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    BookOpen,
    GraduationCap,
    Plus,
    Search,
    TrendingUp,
    Download,
    X,
    Calendar,
    FileText,
    Library,
    Trash2,
    Edit2,
    AlertCircle,
    Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { BulkStudentImport } from '../components/BulkStudentImport';
import { StaffAssignmentModal } from '../components/StaffAssignmentModal';
import { ParentStudentLinkModal } from '../components/ParentStudentLinkModal';
import { StaffCreationModal } from '../components/StaffCreationModal';
import { SchoolSettingsModal } from '../components/SchoolSettingsModal';
import { supabase } from '../lib/supabase';
import type { ImportResult } from '../lib/bulkImportService';
import { ToastContainer, type ToastProps } from '../components/common/Toast';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const AdminDashboard = () => {
    const navigate = useNavigate();
    const { schoolId, role, user, profile, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'staff' | 'students' | 'classes' | 'subjects'>('staff');
    const [staff, setStaff] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [financials, setFinancials] = useState({ totalRevenue: 0, outstanding: 0 });
    const [loading, setLoading] = useState(true);
    const [showAddMenu, setShowAddMenu] = useState(false);

    // Modals
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [showStaffCreation, setShowStaffCreation] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showClassModal, setShowClassModal] = useState(false);
    const [showSchoolSettings, setShowSchoolSettings] = useState(false);

    const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState<{ id: string; name: string } | null>(null);
    const [selectedStudentForLinking, setSelectedStudentForLinking] = useState<{ id: string; name: string } | null>(null);

    // Form States
    const [newSubject, setNewSubject] = useState({ name: '', code: '' });
    const [newClass, setNewClass] = useState({ name: '', level: '' });
    const [editingSubject, setEditingSubject] = useState<any | null>(null);
    const [editingClass, setEditingClass] = useState<any | null>(null);
    const [editingStaff, setEditingStaff] = useState<any | null>(null);

    // Toast/Notification state
    const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info'
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const fetchData = async () => {
        if (!schoolId) return;

        setLoading(true);
        try {
            // Fetch All School Users
            const { data: allUsers, error: usersError } = await supabase
                .from('users')
                .select('*')
                .eq('school_id', schoolId);

            if (usersError) throw usersError;

            const mappedUsers = (allUsers || []).map(u => ({
                id: u.id,
                ...u,
                schoolId: u.school_id,
                fullName: u.full_name,
                admissionNumber: u.admission_number,
                staffId: u.staff_id
            }));

            setStaff(mappedUsers.filter((u: any) => u.role === 'staff' || u.role === 'admin' || u.role === 'bursar'));
            setStudents(mappedUsers.filter((u: any) => u.role === 'student'));

            // Fetch Classes
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('*')
                .eq('school_id', schoolId);

            if (classError) throw classError;
            setClasses(classData || []);

            // Fetch Subjects
            const { data: subjectData, error: subjectError } = await supabase
                .from('subjects')
                .select('*')
                .eq('school_id', schoolId);

            if (subjectError) throw subjectError;
            setSubjects(subjectData || []);

            // Fetch Financials
            const { data: transData, error: transError } = await supabase
                .from('financial_transactions')
                .select('amount')
                .eq('school_id', schoolId);

            if (transError) console.error("Financial fetch error", transError);

            const total = (transData || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
            const totalExpected = mappedUsers.filter((u: any) => u.role === 'student').length * 150000;

            setFinancials({
                totalRevenue: total,
                outstanding: totalExpected - total
            });
        } catch (err) {
            console.error("Error fetching school data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImportSuccess = (result: ImportResult) => {
        if (result.imported > 0) {
            fetchData();
        }
    };

    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSubject) {
                const { error, count } = await supabase
                    .from('subjects')
                    .update({
                        name: newSubject.name,
                        code: newSubject.code
                    }, { count: 'exact' })
                    .eq('id', editingSubject.id);
                if (error) throw error;
                if (count === 0) {
                    showToast('Update failed: access denied (RLS) or record not found.', 'error');
                    return;
                }
                showToast('Subject updated successfully!', 'success');
            } else {
                const { error } = await supabase.from('subjects').insert({
                    school_id: schoolId,
                    name: newSubject.name,
                    code: newSubject.code
                });
                if (error) throw error;
                showToast('Subject created successfully!', 'success');
            }
            setShowSubjectModal(false);
            setEditingSubject(null);
            setNewSubject({ name: '', code: '' });
            fetchData();
        } catch (err) {
            showToast(`Failed to ${editingSubject ? 'update' : 'create'} subject`, 'error');
            console.error(err);
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClass) {
                const { error, count } = await supabase
                    .from('classes')
                    .update({
                        name: newClass.name,
                        level: newClass.level
                    }, { count: 'exact' })
                    .eq('id', editingClass.id);
                if (error) throw error;
                if (count === 0) {
                    showToast('Update failed: access denied (RLS) or record not found.', 'error');
                    return;
                }
                showToast('Class updated successfully!', 'success');
            } else {
                const { error } = await supabase.from('classes').insert({
                    school_id: schoolId,
                    name: newClass.name,
                    level: newClass.level
                });
                if (error) throw error;
                showToast('Class created successfully!', 'success');
            }
            setShowClassModal(false);
            setEditingClass(null);
            setNewClass({ name: '', level: '' });
            fetchData();
        } catch (err) {
            showToast(`Failed to ${editingClass ? 'update' : 'create'} class`, 'error');
            console.error(err);
        }
    };

    const handleDeleteSubject = async (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Subject',
            message: `Are you sure you want to delete the subject "${name}"? This action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const { error, count } = await supabase.from('subjects').delete({ count: 'exact' }).eq('id', id);
                    if (error) throw error;
                    if (count === 0) {
                        showToast('Delete failed: access denied (RLS) or record not found.', 'error');
                    } else {
                        showToast('Subject deleted successfully', 'success');
                        fetchData();
                    }
                } catch (err) {
                    showToast('Failed to delete subject', 'error');
                    console.error(err);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleDeleteClass = async (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Class',
            message: `Are you sure you want to delete the class "${name}"? This action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const { error, count } = await supabase.from('classes').delete({ count: 'exact' }).eq('id', id);
                    if (error) throw error;
                    if (count === 0) {
                        showToast('Delete failed: access denied (RLS) or record not found.', 'error');
                    } else {
                        showToast('Class deleted successfully', 'success');
                        fetchData();
                    }
                } catch (err) {
                    showToast('Failed to delete class', 'error');
                    console.error(err);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleDeleteStaff = async (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Staff Member',
            message: `Are you sure you want to delete "${name}"? This will remove their profile and access to the school.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const { error, count } = await supabase.from('users').delete({ count: 'exact' }).eq('id', id);
                    if (error) throw error;
                    if (count === 0) {
                        showToast('Delete failed: access denied (RLS) or record not found.', 'error');
                    } else {
                        showToast('Staff member deleted successfully', 'success');
                        fetchData();
                    }
                } catch (err) {
                    showToast('Failed to delete staff member', 'error');
                    console.error(err);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    useEffect(() => {
        if (schoolId) {
            fetchData();
        }
    }, [schoolId]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Unable to Load Profile</h2>
                <p className="text-gray-400 mb-4">We couldn't fetch your profile data. Please refresh the page or contact support.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold py-2 px-4 rounded"
                >
                    Refresh Page
                </button>
            </div>
        );
    }

    if (schoolId === 'pending-setup' || !schoolId) {
        return (
            <div className="p-8 text-white">
                <div className="max-w-md bg-dark-card border border-white/10 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-4">School Setup Required</h2>
                    <p className="text-gray-400 mb-6">Your school hasn't been set up yet. Please contact your administrator or register your school to continue.</p>
                    <button
                        onClick={() => navigate('/login?mode=school-reg')}
                        className="bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold py-2 px-4 rounded w-full"
                    >
                        Register School
                    </button>
                </div>
            </div>
        );
    }

    if (role !== 'admin') {
        return <div className="p-8 text-white">Access Denied: Admins Only</div>;
    }

    if (!schoolId && !authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-dark-card border border-white/5 rounded-3xl m-8">
                <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">School Context Missing</h2>
                <p className="text-gray-400 max-w-sm mx-auto">
                    We could not verify your school association. This can happen if your account setup is incomplete.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
                >
                    Refresh Dashboard
                </button>
            </div>
        );
    }

    // --- Modals ---

    // Staff Assignment Modal
    if (selectedStaffForAssignment) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-dark-card border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-dark-card border-b border-white/10 p-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white">Assign Classes & Subjects</h1>
                        <button onClick={() => setSelectedStaffForAssignment(null)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6">
                        <StaffAssignmentModal
                            staffId={selectedStaffForAssignment.id}
                            staffName={selectedStaffForAssignment.name}
                            onSuccess={() => { setSelectedStaffForAssignment(null); fetchData(); }}
                            onClose={() => setSelectedStaffForAssignment(null)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Parent Linking Modal
    if (selectedStudentForLinking) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-dark-card border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-dark-card border-b border-white/10 p-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white">Link Parents</h1>
                        <button onClick={() => setSelectedStudentForLinking(null)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6">
                        <ParentStudentLinkModal
                            studentId={selectedStudentForLinking.id}
                            studentName={selectedStudentForLinking.name}
                            onSuccess={() => { setSelectedStudentForLinking(null); fetchData(); }}
                            onClose={() => setSelectedStudentForLinking(null)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Bulk Import Modal
    if (showBulkImport) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-dark-card border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-dark-card border-b border-white/10 p-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white">Bulk Import Students</h1>
                        <button onClick={() => setShowBulkImport(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6">
                        <BulkStudentImport
                            user={user}
                            profile={profile}
                            schoolId={schoolId}
                            onSuccess={handleBulkImportSuccess}
                            onClose={() => setShowBulkImport(false)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Staff Creation Modal
    if (showStaffCreation) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <StaffCreationModal
                    initialData={editingStaff}
                    user={user}
                    profile={profile}
                    schoolId={schoolId}
                    onSuccess={() => { fetchData(); setShowStaffCreation(false); setEditingStaff(null); }}
                    onClose={() => { setShowStaffCreation(false); setEditingStaff(null); }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Subject Creation Modal */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{editingSubject ? 'Edit Subject' : 'Create New Subject'}</h2>
                            <button onClick={() => { setShowSubjectModal(false); setEditingSubject(null); setNewSubject({ name: '', code: '' }); }} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleCreateSubject} className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400">Subject Name</label>
                                <input type="text" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-3 text-white mt-1" value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="e.g. Mathematics" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Subject Code (Optional)</label>
                                <input type="text" className="w-full bg-dark-bg border border-white/10 rounded-lg p-3 text-white mt-1" value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value })} placeholder="e.g. MTH101" />
                            </div>
                            <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl">
                                {editingSubject ? 'Update Subject' : 'Create Subject'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Class Creation Modal */}
            {showClassModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{editingClass ? 'Edit Class' : 'Create New Class'}</h2>
                            <button onClick={() => { setShowClassModal(false); setEditingClass(null); setNewClass({ name: '', level: '' }); }} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400">Class Name</label>
                                <input type="text" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-3 text-white mt-1" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} placeholder="e.g. SS1 A" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Level/Category</label>
                                <select className="w-full bg-dark-bg border border-white/10 rounded-lg p-3 text-white mt-1" value={newClass.level} onChange={e => setNewClass({ ...newClass, level: e.target.value })}>
                                    <option value="">Select Level</option>
                                    <option value="Senior Secondary">Senior Secondary</option>
                                    <option value="Junior Secondary">Junior Secondary</option>
                                    <option value="Primary">Primary</option>
                                    <option value="Nursery">Nursery</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">
                                {editingClass ? 'Update Class' : 'Create Class'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">School Management</h1>
                    <p className="text-gray-400">Manage your institution's staff, students, and curriculum.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSchoolSettings(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-gray-400 hover:text-teal-400 transition-colors"
                        title="School settings and UUID"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">School Settings</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New</span>
                        </button>
                        {showAddMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-dark-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <button onClick={() => { setEditingStaff(null); setShowStaffCreation(true); setShowAddMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 border-b border-white/5">Add Staff Member</button>
                                <button onClick={() => { setShowClassModal(true); setShowAddMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 border-b border-white/5">Create New Class</button>
                                <button onClick={() => { setShowSubjectModal(true); setShowAddMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 border-b border-white/5">Create Subject</button>
                                <button onClick={() => { setShowBulkImport(true); setShowAddMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center justify-between">
                                    <span>Bulk Student Upload</span>
                                    <Download className="w-4 h-4 text-teal-500" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Staff" value={staff.filter(u => u.role === 'staff').length} color="teal" />
                <StatCard icon={GraduationCap} label="Total Students" value={students.length} color="emerald" />
                <StatCard icon={BookOpen} label="Classes" value={classes.length} color="blue" />
                <StatCard icon={Library} label="Subjects" value={subjects.length} color="purple" />
            </div>

            {/* Interactive Tabs */}
            <div className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden">
                <div className="flex border-b border-white/5 bg-white/5">
                    <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} label="Staff Members" />
                    <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} label="Student List" />
                    <TabButton active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} label="Class Arms" />
                    <TabButton active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} label="Subjects" />
                </div>

                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 border-b border-white/5">
                    <div className="bg-dark-card border border-white/5 rounded-2xl p-6 hover:border-teal-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-orange-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">₦{(financials.outstanding / 1000000).toFixed(2)}M</h3>
                        <p className="text-gray-400 text-sm">Outstanding Fees</p>
                    </div>

                    <div onClick={() => window.location.href = '/admin/terms'} className="bg-dark-card border border-white/5 rounded-2xl p-6 hover:border-teal-500/30 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-teal-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Term Management</h3>
                        <p className="text-gray-400 text-sm">Manage academic terms</p>
                    </div>

                    <div onClick={() => window.location.href = '/admin/audit-logs'} className="bg-dark-card border border-white/5 rounded-2xl p-6 hover:border-teal-500/30 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Audit Logs</h3>
                        <p className="text-gray-400 text-sm">View system activity</p>
                    </div>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-500 text-sm uppercase tracking-wider font-bold">
                                        <th className="pb-4 px-4">Name/Title</th>
                                        <th className="pb-4 px-4">ID/Code</th>
                                        <th className="pb-4 px-4">{activeTab === 'staff' ? 'Contact' : activeTab === 'students' ? 'Class' : activeTab === 'classes' ? 'Stats' : 'Stats'}</th>
                                        <th className="pb-4 px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {activeTab === 'staff' && staff.map(u => (
                                        <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">{u.fullName?.charAt(0) || 'U'}</div>
                                                    <div>
                                                        <div className="text-white font-medium">{u.fullName}</div>
                                                        <div className="text-xs text-gray-500 capitalize">{u.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 font-mono text-sm">{u.staffId || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">{u.email}</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingStaff({
                                                                id: u.id,
                                                                fullName: u.fullName,
                                                                email: u.email,
                                                                role: u.role,
                                                                phoneNumber: u.phoneNumber,
                                                                staffId: u.staffId
                                                            });
                                                            setShowStaffCreation(true);
                                                        }}
                                                        className="p-2 hover:bg-teal-500/10 rounded-lg text-gray-500 hover:text-teal-400 transition-colors"
                                                        title="Edit Staff"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStaff(u.id, u.fullName || u.email)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                        title="Delete Staff"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setSelectedStaffForAssignment({ id: u.id, name: u.fullName })} className="px-4 py-2 bg-teal-600/20 hover:bg-teal-600/40 text-teal-400 rounded-lg transition-colors text-sm font-bold">Assign</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'students' && students.map(u => (
                                        <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">{u.fullName?.charAt(0) || 'S'}</div>
                                                    <span className="text-white font-medium">{u.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 font-mono text-sm">{u.admissionNumber}</td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">{u.classId || 'Not Assigned'}</td>
                                            <td className="py-4 px-4">
                                                <button onClick={() => setSelectedStudentForLinking({ id: u.id, name: u.fullName })} className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg transition-colors text-sm font-bold">Link Parents</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'classes' && classes.map(c => (
                                        <tr key={c.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold"><BookOpen className="w-5 h-5" /></div>
                                                    <span className="text-white font-medium">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">{c.level || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">{c.studentCount || 0} Students</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingClass(c);
                                                            setNewClass({ name: c.name, level: c.level || '' });
                                                            setShowClassModal(true);
                                                        }}
                                                        className="p-2 hover:bg-blue-500/10 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
                                                        title="Edit Class"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClass(c.id, c.name)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                        title="Delete Class"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'subjects' && subjects.map(s => (
                                        <tr key={s.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold"><Library className="w-5 h-5" /></div>
                                                    <span className="text-white font-medium">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 font-mono text-sm">{s.code || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">Active</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingSubject(s);
                                                            setNewSubject({ name: s.name, code: s.code || '' });
                                                            setShowSubjectModal(true);
                                                        }}
                                                        className="p-2 hover:bg-blue-500/10 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
                                                        title="Edit Subject"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSubject(s.id, s.name)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                        title="Delete Subject"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {((activeTab === 'staff' && staff.length === 0) ||
                                (activeTab === 'students' && students.length === 0) ||
                                (activeTab === 'classes' && classes.length === 0) ||
                                (activeTab === 'subjects' && subjects.length === 0)) && (
                                    <div className="text-center py-20 text-gray-500">No records found in this category.</div>
                                )}
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback UI */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
            <ConfirmationModal
                {...confirmModal}
                confirmLabel="Delete"
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-dark-card border border-white/5 p-6 rounded-2xl flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <div>
            <div className="text-gray-500 text-sm font-bold">{label}</div>
            <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        </div>
    </div>
);

const TabButton = ({ active, onClick, label }: any) => (
    <button onClick={onClick} className={`px-8 py-4 font-bold text-sm transition-all relative ${active ? 'text-teal-400' : 'text-gray-500 hover:text-white'}`}>
        {label}
        {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500" />}
    </button>
);
