import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import type { ParentStudentLink, UserProfile } from '../lib/types';

interface ParentStudentLinkModalProps {
    studentId: string;
    studentName: string;
    onClose?: () => void;
    onSuccess?: () => void;
}

interface ParentOption {
    uid: string;
    name: string;
    phone?: string;
}

interface LinkData {
    parentId: string;
    relationship: 'Father' | 'Mother' | 'Guardian' | 'Other';
}

export const ParentStudentLinkModal = ({ studentId, studentName, onClose, onSuccess }: ParentStudentLinkModalProps) => {
    const { schoolId } = useAuth();
    const [parents, setParents] = useState<ParentOption[]>([]);
    const [links, setLinks] = useState<LinkData[]>([]);
    const [existingLinks, setExistingLinks] = useState<ParentStudentLink[]>([]);
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
                // Fetch parent accounts
                const parentQ = query(
                    collection(db, 'users'),
                    where('schoolId', '==', schoolId),
                    where('role', '==', 'parent')
                );
                const parentSnap = await getDocs(parentQ);
                setParents(parentSnap.docs.map(doc => {
                    const data = doc.data() as UserProfile;
                    return { uid: doc.id, name: data.fullName, phone: data.phone };
                }));

                // Fetch existing parent-student links for this student
                const linkQ = query(
                    collection(db, 'parent_student_links'),
                    where('schoolId', '==', schoolId),
                    where('studentId', '==', studentId)
                );
                const linkSnap = await getDocs(linkQ);
                const existing = linkSnap.docs.map(doc => doc.data() as ParentStudentLink);
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
            for (const oldLink of existingLinks) {
                const linkId = `${oldLink.parentIds[0]}_${studentId}`;
                await deleteDoc(doc(db, 'parent_student_links', linkId));
            }

            // Create new links for each parent
            for (const link of links) {
                const linkId = `${link.parentId}_${studentId}`;
                const linkData: ParentStudentLink = {
                    schoolId,
                    parentIds: [link.parentId],
                    studentId,
                    relationship: link.relationship,
                    createdAt: serverTimestamp()
                };

                await setDoc(doc(db, 'parent_student_links', linkId), linkData);
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
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <p className="text-orange-300 text-sm">
                        No parent accounts found. Please create parent accounts first in the school.
                    </p>
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
                                    <option key={parent.uid} value={parent.uid}>
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
