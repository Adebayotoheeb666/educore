import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, Plus, Trash2, X, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ParentCreationModal } from './ParentCreationModal';
import type { ParentStudentLink } from '../lib/types';

interface ParentStudentLinkModalProps {
    studentId: string;
    studentName: string;
    onClose?: () => void;
    onSuccess?: () => void;
}

interface ParentOption {
    id: string;
    name: string;
    phone?: string;
}

interface LinkData {
    parentId: string;
    relationship: 'Father' | 'Mother' | 'Guardian' | 'Other';
}

export const ParentStudentLinkModal = ({ studentId, studentName, onClose, onSuccess }: ParentStudentLinkModalProps) => {
    const { schoolId, user, profile } = useAuth();
    const [parents, setParents] = useState<ParentOption[]>([]);
    const [links, setLinks] = useState<LinkData[]>([]);
    const [existingLinks, setExistingLinks] = useState<ParentStudentLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showParentCreation, setShowParentCreation] = useState(false);

    const fetchParents = async () => {
        if (!schoolId) return;

        try {
            // Fetch parent accounts
            const { data: parentData, error: parentError } = await supabase
                .from('users')
                .select('*')
                .eq('school_id', schoolId)
                .eq('role', 'parent');

            if (parentError) throw parentError;

            setParents(parentData.map(p => ({
                id: p.id,
                name: p.full_name,
                phone: p.phone_number
            })));
        } catch (err) {
            console.error('Failed to fetch parents:', err);
            setError('Failed to load parents');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!schoolId) return;

            setLoading(true);
            setError('');

            try {
                // Fetch parent accounts
                await fetchParents();

                // Fetch existing parent-student links for this student
                const { data: linkData, error: linkError } = await supabase
                    .from('parent_student_links')
                    .select('*')
                    .eq('school_id', schoolId)
                    .eq('student_id', studentId);

                if (linkError) throw linkError;

                const existing = linkData.map(l => ({
                    id: l.id,
                    schoolId: l.school_id,
                    parentIds: l.parent_ids,
                    studentId: l.student_id,
                    relationship: l.relationship,
                    createdAt: l.created_at,
                    updatedAt: l.updated_at
                })) as ParentStudentLink[];

                setExistingLinks(existing);

                // Initialize with existing links
                const initialLinks: LinkData[] = existing.flatMap(link =>
                    link.parentIds.map(parentId => ({
                        parentId,
                        relationship: link.relationship
                    }))
                );
                setLinks(initialLinks.length > 0 ? initialLinks : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [schoolId, studentId]);

    const handleAddLink = () => {
        setLinks([...links, { parentId: '', relationship: 'Father' }]);
    };

    const handleRemoveLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleLinkChange = (index: number, field: 'parentId' | 'relationship', value: string) => {
        const updated = [...links];
        if (field === 'relationship') {
            updated[index].relationship = value as LinkData['relationship'];
        } else {
            updated[index].parentId = value;
        }
        setLinks(updated);
    };

    const handleSave = async () => {
        if (!schoolId) {
            setError('School ID not found');
            return;
        }

        // Validate links
        const hasEmpty = links.some(l => !l.parentId);
        if (hasEmpty) {
            setError('Please select parents for all relationships');
            return;
        }

        // Check for duplicates
        const parentIds = links.map(l => l.parentId);
        if (new Set(parentIds).size !== parentIds.length) {
            setError('Cannot link the same parent multiple times');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            // Delete existing links
            if (existingLinks.length > 0) {
                const { error: deleteError } = await supabase
                    .from('parent_student_links')
                    .delete()
                    .eq('school_id', schoolId)
                    .eq('student_id', studentId);

                if (deleteError) throw deleteError;
            }

            // Create new links for each parent
            for (const link of links) {
                // In Supabase, we don't necessarily need to construct the ID manually if auto-gen,
                // but if we Want to maintain the structure: `${link.parentId}_${studentId}`
                const linkId = `${link.parentId}_${studentId}`;

                const { error: insertError } = await supabase
                    .from('parent_student_links')
                    .insert({
                        id: linkId,
                        school_id: schoolId,
                        parent_ids: [link.parentId], // Array in DB? Or just parent_id? 
                        // The original interface implies parentIds: string[].
                        // If the DB schema supports array, fine. If it's a join table, usually one parent per row.
                        // Assuming the schema follows the original Firestore structure where 'parentIds' was an array.
                        // However, standard SQL normalization would suggest one row per link.
                        // Based on the 'links' state which has single parentId per entry, 
                        // but 'existingLinks' mapping 'parentIds' property...
                        // Let's assume the DB table 'parent_student_links' has a 'parent_ids' column (text[]).
                        student_id: studentId,
                        relationship: link.relationship
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
            setError(err instanceof Error ? err.message : 'Failed to save links');
        } finally {
            setSaving(false);
        }
    };

    // Show parent creation modal if requested
    if (showParentCreation) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <ParentCreationModal
                    user={user}
                    profile={profile}
                    schoolId={schoolId}
                    onSuccess={async () => {
                        setShowParentCreation(false);
                        await fetchParents();
                    }}
                    onClose={() => setShowParentCreation(false)}
                />
            </div>
        );
    }

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
                <h3 className="text-xl font-bold text-white mb-2">Link Parents to Student</h3>
                <p className="text-gray-400 text-sm">for <span className="text-teal-400 font-bold">{studentName}</span></p>
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
                    <p className="text-teal-300 text-sm">Parent-student links saved successfully!</p>
                </div>
            )}

            {parents.length === 0 ? (
                <div className="space-y-4">
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                        <p className="text-orange-300 text-sm mb-4">
                            No parent accounts found. Create parent accounts to link them to students.
                        </p>
                        <button
                            onClick={() => setShowParentCreation(true)}
                            className="w-full px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition font-medium flex items-center justify-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            Create First Parent Account
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map((link, index) => (
                        <div key={index} className="flex gap-3">
                            <select
                                value={link.parentId}
                                onChange={(e) => handleLinkChange(index, 'parentId', e.target.value)}
                                className="flex-1 px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                            >
                                <option value="">Select Parent</option>
                                {parents.map(parent => (
                                    <option key={parent.id} value={parent.id}>
                                        {parent.name} {parent.phone ? `(${parent.phone})` : ''}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={link.relationship}
                                onChange={(e) => handleLinkChange(index, 'relationship', e.target.value)}
                                className="px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                            >
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Other">Other</option>
                            </select>

                            <button
                                onClick={() => handleRemoveLink(index)}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {parents.length > 0 && (
                <button
                    onClick={handleAddLink}
                    className="w-full px-4 py-3 border border-dashed border-teal-500/30 hover:bg-teal-500/10 text-teal-400 rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Parent Link
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
                    disabled={saving || links.length === 0 || parents.length === 0}
                    className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Links'}
                </button>
            </div>
        </div>
    );
};
