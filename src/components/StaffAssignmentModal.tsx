import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { StaffAssignment } from '../lib/types';

interface StaffAssignmentModalProps {
    staffId: string;
    staffName: string;
    onClose?: () => void;
    onSuccess?: () => void;
}

interface ClassOption {
    id: string;
    name: string;
}

interface SubjectOption {
    id: string;
    name: string;
}

interface AssignmentData {
    id: string; // Unique ID for this assignment entry
    classId: string;
    subjectId: string;
}

export const StaffAssignmentModal = ({ staffId, staffName, onClose, onSuccess }: StaffAssignmentModalProps) => {
    const { schoolId } = useAuth();
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [assignments, setAssignments] = useState<AssignmentData[]>([]);
    const [existingAssignments, setExistingAssignments] = useState<StaffAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!schoolId) return;

            setLoading(true);
            setError('');

            try {
                // Fetch classes
                const { data: classData, error: classError } = await supabase
                    .from('classes')
                    .select('*')
                    .eq('school_id', schoolId);

                if (classError) throw classError;
                setClasses(classData.map(c => ({ id: c.id, name: c.name })));

                // Fetch subjects
                const { data: subjectData, error: subjectError } = await supabase
                    .from('subjects')
                    .select('*')
                    .eq('school_id', schoolId);

                if (subjectError) throw subjectError;
                setSubjects(subjectData.map(s => ({ id: s.id, name: s.name })));

                // Fetch existing assignments
                const { data: assignmentData, error: assignmentError } = await supabase
                    .from('staff_assignments')
                    .select('*')
                    .eq('school_id', schoolId)
                    .eq('staff_id', staffId);

                if (assignmentError) throw assignmentError;

                const existing = assignmentData.map(a => ({
                    id: a.id,
                    schoolId: a.school_id,
                    staffId: a.staff_id,
                    classId: a.class_id,
                    subjectId: a.subject_id,
                    startDate: a.start_date,
                    createdAt: a.created_at,
                    updatedAt: a.updated_at
                })) as StaffAssignment[];

                setExistingAssignments(existing);

                // Initialize with existing assignments
                setAssignments(existing.map(a => ({ id: a.id, classId: a.classId, subjectId: a.subjectId })));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [schoolId, staffId]);

    const handleAddAssignment = () => {
        const newId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setAssignments([...assignments, { id: newId, classId: '', subjectId: '' }]);
    };

    const handleRemoveAssignment = (index: number) => {
        setAssignments(assignments.filter((_, i) => i !== index));
    };

    const handleAssignmentChange = (index: number, field: 'classId' | 'subjectId', value: string) => {
        const updated = [...assignments];
        updated[index][field] = value;
        setAssignments(updated);
    };

    const handleSave = async () => {
        if (!schoolId) {
            setError('School ID not found');
            return;
        }

        // Validate assignments
        const hasEmpty = assignments.some(a => !a.classId || !a.subjectId);
        if (hasEmpty) {
            setError('Please complete all assignments before saving');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            // Delete old assignments
            if (existingAssignments.length > 0) {
                const { error: deleteError } = await supabase
                    .from('staff_assignments')
                    .delete()
                    .eq('school_id', schoolId)
                    .eq('staff_id', staffId);

                if (deleteError) throw deleteError;
            }

            // Create new assignments
            for (const assignment of assignments) {
                const { error: insertError } = await supabase
                    .from('staff_assignments')
                    .insert({
                        school_id: schoolId,
                        staff_id: staffId,
                        class_id: assignment.classId,
                        subject_id: assignment.subjectId,
                        start_date: new Date().toISOString().split('T')[0]
                    });

                if (insertError) throw insertError;
            }

            setSuccess(true);
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save assignments');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-white mb-2">Assign Classes & Subjects</h3>
                <p className="text-gray-400 text-sm">for <span className="text-teal-400 font-bold">{staffName}</span></p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <p className="text-teal-300 text-sm">Assignments saved successfully!</p>
                </div>
            )}

            {classes.length === 0 || subjects.length === 0 ? (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <p className="text-orange-300 text-sm">
                        {classes.length === 0 ? 'No classes found. ' : ''}
                        {subjects.length === 0 ? 'No subjects found. ' : ''}
                        Please create classes and subjects first.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {assignments.map((assignment, index) => (
                        <div key={assignment.id} className="flex gap-3">
                            <select
                                value={assignment.classId}
                                onChange={(e) => handleAssignmentChange(index, 'classId', e.target.value)}
                                className="flex-1 px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>

                            <select
                                value={assignment.subjectId}
                                onChange={(e) => handleAssignmentChange(index, 'subjectId', e.target.value)}
                                className="flex-1 px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(subj => (
                                    <option key={subj.id} value={subj.id}>{subj.name}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => handleRemoveAssignment(index)}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {classes.length > 0 && subjects.length > 0 && (
                <button
                    onClick={handleAddAssignment}
                    className="w-full px-4 py-3 border border-dashed border-teal-500/30 hover:bg-teal-500/10 text-teal-400 rounded-lg transition-colors font-bold"
                >
                    + Add Assignment
                </button>
            )}

            <div className="flex gap-3 pt-4">
                <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-white/10 hover:bg-white/5 text-white font-bold rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || assignments.length === 0}
                    className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Assignments'}
                </button>
            </div>
        </div>
    );
};
