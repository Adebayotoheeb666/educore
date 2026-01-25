import { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Search,
    Trash2,
    ArrowLeft,
    GraduationCap,
    CheckCircle2,
    X,
    FolderPlus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const StudentAssignment = () => {
    const { schoolId, user } = useAuth();
    const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [classStudents, setClassStudents] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const fetchData = async () => {
        if (!schoolId || !user) return;
        setLoading(true);
        try {
            // 1. Fetch classes assigned to this staff
            const { data: assignments, error: assignError } = await supabase
                .from('staff_assignments')
                .select('class_id, classes(*)')
                .eq('staff_id', user.id);

            if (assignError) throw assignError;

            // Deduplicate classes by id to avoid duplicate key errors
            const classMap = new Map();
            assignments?.forEach(a => {
                if (a.classes && a.classes.id) {
                    classMap.set(a.classes.id, a.classes);
                }
            });
            const classes = Array.from(classMap.values());
            setAssignedClasses(classes);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error("Error fetching assignments:", errorMsg, err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClassStudents = async (classId: string) => {
        try {
            // Fetch students enrolled in the selected class
            const { data, error } = await supabase
                .from('student_classes')
                .select('*, users(id, full_name, admission_number, email, role)')
                .eq('class_id', classId)
                .eq('status', 'active');

            if (error) throw error;

            const students = (data || []).map(enrollment => ({
                ...enrollment.users,
                enrollment_id: enrollment.id
            }));
            setClassStudents(students);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error("Error fetching class students:", errorMsg, err);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('school_id', schoolId)
                .eq('role', 'student');

            if (error) throw error;
            setAllStudents(data || []);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error("Error fetching all students:", errorMsg, err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [schoolId, user]);

    useEffect(() => {
        if (selectedClass) {
            fetchClassStudents(selectedClass.id);
        }
    }, [selectedClass]);

    const handleAddStudent = async (studentId: string) => {
        if (!selectedClass) return;
        setProcessing(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ class_id: selectedClass.id })
                .eq('id', studentId);

            if (error) throw error;
            fetchClassStudents(selectedClass.id);
        } catch (err) {
            alert("Failed to add student to class");
        } finally {
            setProcessing(false);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        setProcessing(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ class_id: null })
                .eq('id', studentId);

            if (error) throw error;
            fetchClassStudents(selectedClass.id);
        } catch (err) {
            alert("Failed to remove student");
        } finally {
            setProcessing(false);
        }
    };

    const filteredStudents = allStudents.filter(s =>
        (s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.admission_number?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        s.class_id !== selectedClass?.id
    );

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading assignments...</div>;
    }

    return (
        <div className="space-y-8 pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Student Assignment</h1>
                    <p className="text-gray-400">Assign students to your class arms and subjects.</p>
                </div>
            </header>

            {!selectedClass ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignedClasses.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedClass(c)}
                            className="bg-dark-card border border-white/5 rounded-[24px] p-8 text-left hover:border-teal-500/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                                <Users className="w-6 h-6 text-teal-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{c.name}</h3>
                            <p className="text-gray-500 text-sm mb-4">{c.level || 'General Level'}</p>
                            <div className="flex items-center gap-2 text-teal-500 font-bold group-hover:gap-3 transition-all">
                                <span>Manage Students</span>
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </button>
                    ))}
                    {assignedClasses.length === 0 && (
                        <div className="col-span-full py-20 bg-dark-card/50 border-2 border-dashed border-white/5 rounded-[32px] text-center text-gray-500">
                            <FolderPlus className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">You have no classes assigned. Contact your Admin to assign classes.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedClass(null)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 Transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-bold text-white">{selectedClass.name} <span className="text-gray-500 text-lg font-normal ml-2">Assigned Students</span></h2>
                        </div>
                        <button
                            onClick={() => { fetchAllStudents(); setShowAddModal(true); }}
                            className="bg-teal-500 hover:bg-teal-400 text-dark-bg px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Add Student</span>
                        </button>
                    </div>

                    <div className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
                        <div className="p-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-500 text-xs uppercase tracking-widest font-bold border-b border-white/5">
                                            <th className="pb-4 px-4">Student Name</th>
                                            <th className="pb-4 px-4">Admission ID</th>
                                            <th className="pb-4 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {classStudents.map(s => (
                                            <tr key={s.id} className="group hover:bg-white/5">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold">
                                                            {s.full_name?.charAt(0)}
                                                        </div>
                                                        <span className="text-white font-medium">{s.full_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-gray-400 font-mono text-sm">{s.admission_number}</td>
                                                <td className="py-4 px-4 text-right">
                                                    <button
                                                        onClick={() => handleRemoveStudent(s.id)}
                                                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                                        title="Remove from class"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {classStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-20 text-center text-gray-600">No students assigned to this class yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Add Students</h2>
                                <p className="text-gray-400">Search and select students to add to {selectedClass?.name}.</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 bg-white/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search by name or admission number..."
                                    className="w-full bg-dark-bg border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                            {filteredStudents.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-4 bg-dark-bg rounded-2xl border border-white/5 hover:border-teal-500/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold border border-teal-500/20">
                                            {s.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{s.full_name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{s.admission_number}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddStudent(s.id)}
                                        disabled={processing}
                                        className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        Assign
                                    </button>
                                </div>
                            ))}
                            {filteredStudents.length === 0 && searchQuery && (
                                <div className="text-center py-10 text-gray-500">
                                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p>No students found matching "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
