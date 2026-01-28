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
    Settings,
    Menu
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { BulkStudentImport } from '../components/BulkStudentImport';
import { StaffAssignmentModal } from '../components/StaffAssignmentModal';
import { ParentStudentLinkModal } from '../components/ParentStudentLinkModal';
import { StaffCreationModal } from '../components/StaffCreationModal';
import { StudentCreationModal } from '../components/StudentCreationModal';
import { ParentCreationModal } from '../components/ParentCreationModal';
import { SchoolSettingsModal } from '../components/SchoolSettingsModal';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditService';
import { deleteStaffAccount } from '../lib/staffService';
import type { ImportResult } from '../lib/bulkImportService';
import { ToastContainer, type ToastProps } from '../components/common/Toast';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const AdminDashboard = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { schoolId, role, user, profile, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'staff' | 'students' | 'parents' | 'classes' | 'subjects'>('staff');
    const [staff, setStaff] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [parents, setParents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [financials, setFinancials] = useState({ totalRevenue: 0, outstanding: 0 });
    // const [loading, setLoading] = useState(true); // Replaced by derived state
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [showStaffCreation, setShowStaffCreation] = useState(false);
    const [showStudentCreation, setShowStudentCreation] = useState(false);
    const [showParentCreation, setShowParentCreation] = useState(false);
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
    const [editingStudent, setEditingStudent] = useState<any | null>(null);
    const [editingParent, setEditingParent] = useState<any | null>(null);

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

    // Filter functions for search
    const filterStaff = (data: any[]) => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(s =>
            s.fullName?.toLowerCase().includes(term) ||
            s.email?.toLowerCase().includes(term) ||
            s.staffId?.toLowerCase().includes(term) ||
            s.phone_number?.toLowerCase().includes(term)
        );
    };

    const filterStudents = (data: any[]) => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(s =>
            s.fullName?.toLowerCase().includes(term) ||
            s.email?.toLowerCase().includes(term) ||
            s.admissionNumber?.toLowerCase().includes(term) ||
            s.phone_number?.toLowerCase().includes(term)
        );
    };

    const filterClasses = (data: any[]) => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(c =>
            c.name?.toLowerCase().includes(term) ||
            c.level?.toLowerCase().includes(term)
        );
    };

    const filterSubjects = (data: any[]) => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(s =>
            s.name?.toLowerCase().includes(term) ||
            s.code?.toLowerCase().includes(term)
        );
    };

    const filterParents = (data: any[]) => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(p =>
            p.fullName?.toLowerCase().includes(term) ||
            p.email?.toLowerCase().includes(term) ||
            p.parentId?.toLowerCase().includes(term) ||
            p.phone_number?.toLowerCase().includes(term)
        );
    };

    // Fetch functions
    const fetchUsers = async () => {
        if (!schoolId) return [];

        // Try RPC first
        try {
            const { data, error } = await supabase.rpc('get_school_users', { p_school_id: schoolId });
            if (!error && data) {
                // Fetch student class assignments
                const studentIds = data.filter((u: any) => u.role === 'student').map((u: any) => u.id);
                if (studentIds.length > 0) {
                    const { data: studentClasses } = await supabase
                        .from('student_classes')
                        .select('student_id, class_id, classes(name)')
                        .in('student_id', studentIds)
                        .eq('school_id', schoolId);

                    // Create a map of student_id to class name
                    const classMap = new Map();
                    studentClasses?.forEach((sc: any) => {
                        classMap.set(sc.student_id, sc.classes?.name || 'Unknown Class');
                    });

                    // Enrich user data with class names
                    return data.map((u: any) => ({
                        ...u,
                        className: u.role === 'student' ? classMap.get(u.id) : undefined
                    }));
                }
                return data;
            }
        } catch (e) {
            console.warn('RPC fetch failed, falling back to direct query', e);
        }

        // Fallback to direct query
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('school_id', schoolId);

        if (error) throw error;

        // Fetch student class assignments for fallback
        const studentIds = (data || []).filter((u: any) => u.role === 'student').map((u: any) => u.id);
        if (studentIds.length > 0) {
            const { data: studentClasses } = await supabase
                .from('student_classes')
                .select('student_id, class_id, classes(name)')
                .in('student_id', studentIds)
                .eq('school_id', schoolId);

            // Create a map of student_id to class name
            const classMap = new Map();
            studentClasses?.forEach((sc: any) => {
                classMap.set(sc.student_id, sc.classes?.name || 'Unknown Class');
            });

            // Enrich user data with class names
            return (data || []).map((u: any) => ({
                ...u,
                className: u.role === 'student' ? classMap.get(u.id) : undefined
            }));
        }

        return data || [];
    };

    const fetchClasses = async () => {
        if (!schoolId) return [];
        const { data, error } = await supabase.from('classes').select('*').eq('school_id', schoolId);
        if (error) throw error;
        return data as any[];
    };

    const fetchSubjects = async () => {
        if (!schoolId) return [];
        const { data, error } = await supabase.from('subjects').select('*').eq('school_id', schoolId);
        if (error) throw error;
        return data as any[];
    };

    const fetchFinancials = async () => {
        if (!schoolId) return { totalRevenue: 0, outstanding: 0 };

        // This relies on users being fetched, but for simplicity we'll do a separate count or just re-fetch light data if needed
        // Or we can combine queries. For now, independent fetches are safer for migration.
        const { data: transData, error: transError } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('school_id', schoolId);

        if (transError) throw transError;

        const total = (transData || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

        // Estimate expected revenue (this is a bit rough as it depends on student count)
        // We'll calculate "outstanding" in the component render or a derived memo, 
        // passing student count as a dependency if possible, or just fetch student count here.
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('role', 'student');

        const totalExpected = (count || 0) * 150000;

        return {
            totalRevenue: total,
            outstanding: totalExpected - total
        };
    };

    // Queries
    const {
        data: usersData,
        isLoading: usersLoading
    } = useQuery({
        queryKey: ['users', schoolId],
        queryFn: fetchUsers,
        enabled: !!schoolId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const {
        data: classesData,
        isLoading: classesLoading
    } = useQuery({
        queryKey: ['classes', schoolId],
        queryFn: fetchClasses,
        enabled: !!schoolId
    });

    const {
        data: subjectsData,
        isLoading: subjectsLoading
    } = useQuery({
        queryKey: ['subjects', schoolId],
        queryFn: fetchSubjects,
        enabled: !!schoolId
    });

    const {
        data: financialsData,
        isLoading: financialsLoading
    } = useQuery({
        queryKey: ['financials', schoolId],
        queryFn: fetchFinancials,
        enabled: !!schoolId
    });

    // Derived state
    useEffect(() => {
        if (usersData) {
            const mappedUsers = usersData.map((u: any) => ({
                id: u.id,
                ...u,
                schoolId: u.school_id,
                fullName: u.full_name,
                admissionNumber: u.admission_number,
                parentId: u.admission_number, // Store parent ID in admission_number field
                staffId: u.staff_id
            }));

            // Deduplicate
            const uniqueUsers = Array.from(new Map(mappedUsers.map((u: any) => [u.id, u])).values());

            setStaff(uniqueUsers.filter((u: any) => ['staff', 'admin', 'bursar'].includes(u.role)));
            setStudents(uniqueUsers.filter((u: any) => u.role === 'student'));
            setParents(uniqueUsers.filter((u: any) => u.role === 'parent'));
        }
    }, [usersData]);

    useEffect(() => {
        if (classesData) {
            // Deduplicate classes by ID
            const uniqueClasses = Array.from(new Map((classesData || []).map(c => [c.id, c])).values());
            setClasses(uniqueClasses);
        }
    }, [classesData]);

    useEffect(() => {
        if (subjectsData) {
            const uniqueSubjects = Array.from(new Map((subjectsData || []).map(s => [s.id, s])).values());
            setSubjects(uniqueSubjects);
        }
    }, [subjectsData]);

    useEffect(() => {
        if (financialsData) {
            setFinancials(financialsData);
        }
    }, [financialsData]);

    // Combined loading state
    const loading = usersLoading || classesLoading || subjectsLoading || financialsLoading;

    // Compatibility shim
    const fetchData = () => {
        queryClient.invalidateQueries({ queryKey: ['users', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['classes', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['subjects', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['financials', schoolId] });
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
                if (schoolId && user?.id && profile?.fullName) {
                    await logAction(
                        schoolId,
                        user.id,
                        profile.fullName,
                        'update',
                        'subject',
                        editingSubject.id,
                        {
                            name: { old: editingSubject.name, new: newSubject.name },
                            code: { old: editingSubject.code, new: newSubject.code }
                        }
                    );
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
            console.error('Subject operation error:', err instanceof Error ? err.message : String(err));
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
                if (schoolId && user?.id && profile?.fullName) {
                    await logAction(
                        schoolId,
                        user.id,
                        profile.fullName,
                        'update',
                        'class',
                        editingClass.id,
                        {
                            name: { old: editingClass.name, new: newClass.name },
                            level: { old: editingClass.level, new: newClass.level }
                        }
                    );
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
            console.error('Class operation error:', err instanceof Error ? err.message : String(err));
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
                        // Log the delete action
                        if (schoolId && user?.id && profile?.fullName) {
                            await logAction(
                                schoolId,
                                user.id,
                                profile.fullName,
                                'delete',
                                'subject',
                                id,
                                { name }
                            );
                        }
                        showToast('Subject deleted successfully', 'success');
                        fetchData();
                    }
                } catch (err) {
                    showToast('Failed to delete subject', 'error');
                    console.error('Subject deletion error:', err instanceof Error ? err.message : String(err));
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
                        // Log the delete action
                        if (schoolId && user?.id && profile?.fullName) {
                            await logAction(
                                schoolId,
                                user.id,
                                profile.fullName,
                                'delete',
                                'class',
                                id,
                                { name }
                            );
                        }
                        showToast('Class deleted successfully', 'success');
                        fetchData();
                    }
                } catch (err) {
                    showToast('Failed to delete class', 'error');
                    console.error('Class deletion error:', err instanceof Error ? err.message : String(err));
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
            message: `Are you sure you want to delete "${name}"? This will remove their profile, Auth account, and access to the school. This action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    // Use the service function that properly deletes both Auth account and profile
                    if (!schoolId || !user?.id) {
                        showToast('Missing school or user information', 'error');
                        return;
                    }

                    const result = await deleteStaffAccount(schoolId, user.id, id);

                    if (result.success) {
                        // Log the delete action
                        if (profile?.fullName) {
                            await logAction(
                                schoolId,
                                user.id,
                                profile.fullName,
                                'delete',
                                'staff',
                                id,
                                { name }
                            );
                        }
                        showToast('Staff member deleted successfully. They can no longer log in.', 'success');
                        fetchData();
                    } else {
                        showToast('Failed to delete staff member', 'error');
                    }
                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                    console.error('Delete staff error:', err);
                    showToast(`Failed to delete staff member: ${errorMsg}`, 'error');
                    console.error('Staff deletion error:', err instanceof Error ? err.message : String(err));
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleDeleteStudent = async (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Student',
            message: `Are you sure you want to delete "${name}"? This will remove their profile and all associated data from the system.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const { error, count } = await supabase.from('users').delete({ count: 'exact' }).eq('id', id);
                    if (error) throw error;
                    if (count === 0) {
                        showToast('Delete failed: access denied (RLS) or record not found.', 'error');
                    } else {
                        // Log the delete action
                        if (schoolId && user?.id && profile?.fullName) {
                            await logAction(
                                schoolId,
                                user.id,
                                profile.fullName,
                                'delete',
                                'student',
                                id,
                                { name }
                            );
                        }
                        showToast('Student deleted successfully', 'success');
                        fetchData();
                    }
                } catch (err) {
                    showToast('Failed to delete student', 'error');
                    console.error('Student deletion error:', err instanceof Error ? err.message : String(err));
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    // Manual loading state removed in favor of React Query
    // useEffect(() => {
    //     if (schoolId) {
    //         fetchData();
    //     }
    // }, [schoolId]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        console.warn('[AdminDashboard] Profile is missing - this should not happen with localStorage caching');
        return (
            <div className="p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Unable to Load Profile</h2>
                <p className="text-gray-400 mb-4">We're having trouble loading your profile. The app will automatically try again.</p>
                <div className="mt-8 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    // Check role first - only admins can access this dashboard
    if (role !== 'admin') {
        return <div className="p-8 text-white">Access Denied: Admins Only</div>;
    }

    // Only show "School Setup Required" if we're done loading and schoolId is still missing (shouldn't happen with caching)
    if (!schoolId || schoolId === 'pending-setup') {
        console.warn('[AdminDashboard] School setup required or pending setup');
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

    // --- Modals ---

    // Staff Assignment Modal
    if (selectedStaffForAssignment) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
                <div className="bg-dark-card border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-dark-card border-b border-white/10 p-4 md:p-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white">Assign Classes & Subjects</h1>
                        <button onClick={() => setSelectedStaffForAssignment(null)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="p-4 md:p-6">
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
                <div className="bg-dark-card border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-dark-card border-b border-white/10 p-4 md:p-6 flex items-center justify-between">
                        <h1 className="text-lg md:text-2xl font-bold text-white">Link Parents</h1>
                        <button onClick={() => setSelectedStudentForLinking(null)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><X className="w-5 md:w-6 h-5 md:h-6" /></button>
                    </div>
                    <div className="p-4 md:p-6">
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
                <div className="bg-dark-card border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-dark-card border-b border-white/10 p-4 md:p-6 flex items-center justify-between">
                        <h1 className="text-lg md:text-2xl font-bold text-white">Bulk Import Students</h1>
                        <button onClick={() => setShowBulkImport(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><X className="w-5 md:w-6 h-5 md:h-6" /></button>
                    </div>
                    <div className="p-4 md:p-6">
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

    // Student Creation Modal
    if (showStudentCreation) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <StudentCreationModal
                    initialData={editingStudent}
                    user={user}
                    profile={profile}
                    schoolId={schoolId}
                    classes={classes}
                    onSuccess={() => { fetchData(); setShowStudentCreation(false); setEditingStudent(null); }}
                    onClose={() => { setShowStudentCreation(false); setEditingStudent(null); }}
                />
            </div>
        );
    }

    // Parent Creation Modal
    if (showParentCreation) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <ParentCreationModal
                    initialData={editingParent}
                    user={user}
                    profile={profile}
                    schoolId={schoolId}
                    onSuccess={() => { fetchData(); setShowParentCreation(false); setEditingParent(null); }}
                    onClose={() => { setShowParentCreation(false); setEditingParent(null); }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Subject Creation Modal */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-md p-4 md:p-6">
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-md p-4 md:p-6">
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

            {/* School Settings Modal */}
            {showSchoolSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-dark-card border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-dark-card border-b border-white/10 p-4 md:p-6 flex items-center justify-between">
                            <h1 className="text-lg md:text-2xl font-bold text-white">School Settings</h1>
                            <button onClick={() => setShowSchoolSettings(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"><X className="w-5 md:w-6 h-5 md:h-6" /></button>
                        </div>
                        <div className="p-4 md:p-6">
                            <SchoolSettingsModal
                                schoolId={schoolId}
                                onClose={() => setShowSchoolSettings(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <header className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">School Management</h1>
                    <p className="text-gray-400 text-xs sm:text-sm md:text-base hidden sm:block">Manage your institution's staff, students, and curriculum.</p>
                </div>

                {/* Desktop Menu (hidden on md and below) */}
                <div className="hidden lg:flex items-center gap-3">
                    <button
                        onClick={() => setShowSchoolSettings(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-gray-400 hover:text-teal-400 transition-colors text-sm"
                        title="School settings and UUID"
                    >
                        <Settings className="w-4 h-4" />
                        <span>School Settings</span>
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 pl-10 border border-white/10 rounded-xl bg-dark-bg text-gray-300 text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all w-48"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className="flex items-center gap-2 px-6 py-2 bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 text-sm"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New</span>
                        </button>
                        {showAddMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-dark-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <button onClick={() => { setEditingStaff(null); setShowStaffCreation(true); setShowAddMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 border-b border-white/5">Add Staff Member</button>
                                <button onClick={() => { setEditingStudent(null); setShowStudentCreation(true); setShowAddMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 border-b border-white/5">Add Student</button>
                                <button onClick={() => { setEditingParent(null); setShowParentCreation(true); setShowAddMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 border-b border-white/5">Add Parent</button>
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

                {/* Mobile/Tablet Menu */}
                <div className="lg:hidden relative">
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    {showMobileMenu && (
                        <div className="absolute right-0 mt-2 w-64 bg-dark-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="p-4 border-b border-white/5">
                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 pl-9 border border-white/10 rounded-lg bg-dark-bg text-gray-300 text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-600" />
                                </div>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                <button onClick={() => { setShowSchoolSettings(true); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 border-b border-white/5 flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    School Settings
                                </button>
                                <div className="border-t border-white/5 my-2"></div>
                                <button onClick={() => { setEditingStaff(null); setShowStaffCreation(true); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-teal-400 hover:bg-white/5 border-b border-white/5">+ Add Staff Member</button>
                                <button onClick={() => { setEditingStudent(null); setShowStudentCreation(true); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-teal-400 hover:bg-white/5 border-b border-white/5">+ Add Student</button>
                                <button onClick={() => { setEditingParent(null); setShowParentCreation(true); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-teal-400 hover:bg-white/5 border-b border-white/5">+ Add Parent</button>
                                <button onClick={() => { setShowClassModal(true); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-teal-400 hover:bg-white/5 border-b border-white/5">+ Create New Class</button>
                                <button onClick={() => { setShowSubjectModal(true); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-teal-400 hover:bg-white/5 border-b border-white/5">+ Create Subject</button>
                                <button onClick={() => { setShowBulkImport(true); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-teal-400 hover:bg-white/5 flex items-center justify-between">
                                    <span>+ Bulk Student Upload</span>
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <StatCard icon={Users} label="Total Staff" value={staff.filter(u => u.role === 'staff').length} color="teal" />
                <StatCard icon={GraduationCap} label="Total Students" value={students.length} color="emerald" />
                <StatCard icon={Users} label="Total Parents" value={parents.length} color="blue" />
                <StatCard icon={BookOpen} label="Classes" value={classes.length} color="orange" />
                <StatCard icon={Library} label="Subjects" value={subjects.length} color="purple" />
            </div>

            {/* Interactive Tabs */}
            <div className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden">
                <div className="flex flex-wrap border-b border-white/5 bg-white/5">
                    <TabButton active={activeTab === 'staff'} onClick={() => { setActiveTab('staff'); setShowMobileMenu(false); }} label="Staff Members" />
                    <TabButton active={activeTab === 'students'} onClick={() => { setActiveTab('students'); setShowMobileMenu(false); }} label="Student List" />
                    <TabButton active={activeTab === 'parents'} onClick={() => { setActiveTab('parents'); setShowMobileMenu(false); }} label="Parent List" />
                    <TabButton active={activeTab === 'classes'} onClick={() => { setActiveTab('classes'); setShowMobileMenu(false); }} label="Class Arms" />
                    <TabButton active={activeTab === 'subjects'} onClick={() => { setActiveTab('subjects'); setShowMobileMenu(false); }} label="Subjects" />
                </div>

                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 border-b border-white/5">
                    <div className="bg-dark-card border border-white/5 rounded-2xl p-4 sm:p-6 hover:border-teal-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-orange-400" />
                            </div>
                        </div>
                        <h3 className="text-lg sm:text-2xl font-bold text-white mb-1">₦{(financials.outstanding / 1000000).toFixed(2)}M</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">Outstanding Fees</p>
                    </div>

                    <div onClick={() => window.location.href = '/admin/terms'} className="bg-dark-card border border-white/5 rounded-2xl p-4 sm:p-6 hover:border-teal-500/30 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-teal-500/20 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 sm:w-6 h-5 sm:h-6 text-teal-400" />
                            </div>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-1">Term Management</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">Manage academic terms</p>
                    </div>

                    <div onClick={() => window.location.href = '/admin/audit-logs'} className="bg-dark-card border border-white/5 rounded-2xl p-4 sm:p-6 hover:border-teal-500/30 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-purple-400" />
                            </div>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-1">Audit Logs</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">View system activity</p>
                    </div>
                </div>

                <div className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 sm:py-20">
                            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm md:text-base min-w-max md:min-w-full">
                                <thead>
                                    <tr className="text-gray-500 text-xs md:text-sm uppercase tracking-wider font-bold bg-dark-card sticky top-0 z-10">
                                        <th className="py-4 px-3 sm:px-4">Name/Title</th>
                                        <th className="py-4 px-3 sm:px-4 hidden sm:table-cell">ID/Code</th>
                                        <th className="py-4 px-3 sm:px-4 hidden md:table-cell">{activeTab === 'staff' ? 'Contact' : activeTab === 'students' ? 'Class' : activeTab === 'classes' ? 'Stats' : 'Stats'}</th>
                                        <th className="py-4 px-3 sm:px-4 text-right md:text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {activeTab === 'staff' && filterStaff(staff).map(u => (
                                        <tr key={u.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                                            <td className="py-3 md:py-4 px-3 sm:px-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">{u.fullName?.charAt(0) || 'U'}</div>
                                                    <div className="min-w-0">
                                                        <div className="text-white font-medium text-sm md:text-base truncate">{u.fullName}</div>
                                                        <div className="text-xs text-gray-500 capitalize hidden sm:block">{u.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4 text-gray-400 font-mono text-xs md:text-sm hidden sm:table-cell">{u.staffId || 'N/A'}</td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4 text-gray-400 text-xs md:text-sm hidden md:table-cell truncate">{u.email}</td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4">
                                                <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-end md:justify-start">
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
                                                        <Edit2 className="w-3 md:w-4 h-3 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStaff(u.id, u.fullName || u.email)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                        title="Delete Staff"
                                                    >
                                                        <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
                                                    </button>
                                                    <button onClick={() => setSelectedStaffForAssignment({ id: u.id, name: u.fullName })} className="px-2 md:px-4 py-1 md:py-2 bg-teal-600/20 hover:bg-teal-600/40 text-teal-400 rounded-lg transition-colors text-xs md:text-sm font-bold whitespace-nowrap">Assign</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'students' && filterStudents(students).map(u => (
                                        <tr key={u.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                                            <td className="py-3 md:py-4 px-3 sm:px-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">{u.fullName?.charAt(0) || 'S'}</div>
                                                    <span className="text-white font-medium text-sm md:text-base truncate">{u.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4 text-gray-400 font-mono text-xs md:text-sm hidden sm:table-cell">{u.admissionNumber}</td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4 text-gray-400 text-xs md:text-sm hidden md:table-cell">{u.className || 'Not Assigned'}</td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4">
                                                <div className="flex flex-wrap items-center gap-1 md:gap-2 justify-end md:justify-start">
                                                    <button
                                                        onClick={() => {
                                                            setEditingStudent({
                                                                id: u.id,
                                                                fullName: u.fullName,
                                                                email: u.email,
                                                                admissionNumber: u.admissionNumber,
                                                                phoneNumber: u.phoneNumber,
                                                                classId: u.classId
                                                            });
                                                            setShowStudentCreation(true);
                                                        }}
                                                        className="p-2 hover:bg-emerald-500/10 rounded-lg text-gray-500 hover:text-emerald-400 transition-colors"
                                                        title="Edit Student"
                                                    >
                                                        <Edit2 className="w-3 md:w-4 h-3 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStudent(u.id, u.fullName || u.email)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                        title="Delete Student"
                                                    >
                                                        <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
                                                    </button>
                                                    <button onClick={() => setSelectedStudentForLinking({ id: u.id, name: u.fullName })} className="px-2 md:px-3 py-1 md:py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg transition-colors text-xs md:text-sm font-bold whitespace-nowrap">Link Parents</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'classes' && filterClasses(classes).map(c => (
                                        <tr key={c.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                                            <td className="py-3 md:py-4 px-3 sm:px-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 md:w-10 h-8 md:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold"><BookOpen className="w-4 md:w-5 h-4 md:h-5" /></div>
                                                    <span className="text-white font-medium text-sm md:text-base truncate">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4 text-gray-400 text-xs md:text-sm hidden sm:table-cell">{c.level || 'N/A'}</td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4 text-gray-400 text-xs md:text-sm hidden md:table-cell">{c.studentCount || 0} Students</td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4">
                                                <div className="flex items-center gap-1 md:gap-2 justify-end md:justify-start">
                                                    <button
                                                        onClick={() => {
                                                            setEditingClass(c);
                                                            setNewClass({ name: c.name, level: c.level || '' });
                                                            setShowClassModal(true);
                                                        }}
                                                        className="p-2 hover:bg-blue-500/10 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
                                                        title="Edit Class"
                                                    >
                                                        <Edit2 className="w-3 md:w-4 h-3 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClass(c.id, c.name)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                        title="Delete Class"
                                                    >
                                                        <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'subjects' && filterSubjects(subjects).map(s => (
                                        <tr key={s.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                                            <td className="py-3 md:py-4 px-3 sm:px-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 md:w-10 h-8 md:h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold"><Library className="w-4 md:w-5 h-4 md:h-5" /></div>
                                                    <span className="text-white font-medium text-sm md:text-base truncate">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4 text-gray-400 font-mono text-xs md:text-sm hidden sm:table-cell">{s.code || 'N/A'}</td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4 text-gray-400 text-xs md:text-sm hidden md:table-cell">Active</td>
                                            <td className="py-3 md:py-4 px-3 sm:px-4">
                                                <div className="flex items-center gap-1 md:gap-2 justify-end md:justify-start">
                                                    <button
                                                        onClick={() => {
                                                            setEditingSubject(s);
                                                            setNewSubject({ name: s.name, code: s.code || '' });
                                                            setShowSubjectModal(true);
                                                        }}
                                                        className="p-2 hover:bg-blue-500/10 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
                                                        title="Edit Subject"
                                                    >
                                                        <Edit2 className="w-3 md:w-4 h-3 md:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSubject(s.id, s.name)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                        title="Delete Subject"
                                                    >
                                                        <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
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
                                    <div className="text-center py-12 sm:py-20 text-gray-500 text-sm sm:text-base px-4">No records found in this category.</div>
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
    <div className="bg-dark-card border border-white/5 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 sm:w-6 h-5 sm:h-6 text-${color}-400`} />
        </div>
        <div className="min-w-0">
            <div className="text-gray-500 text-xs sm:text-sm font-bold">{label}</div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{value}</div>
        </div>
    </div>
);

const TabButton = ({ active, onClick, label }: any) => (
    <button onClick={onClick} className={`px-3 sm:px-6 py-3 sm:py-4 font-bold text-xs sm:text-sm transition-all relative flex-1 sm:flex-none ${active ? 'text-teal-400' : 'text-gray-500 hover:text-white'}`}>
        {label}
        {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500" />}
    </button>
);
