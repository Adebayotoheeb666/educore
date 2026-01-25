import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createTerm, updateTerm, deleteTerm, setActiveTerm, getAllTerms } from '../lib/termService';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import type { Term } from '../lib/types';

export const TermManagement = () => {
    const { schoolId, role } = useAuth();
    const [terms, setTerms] = useState<(Term & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTerm, setEditingTerm] = useState<(Term & { id: string }) | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        termId: string;
        termName: string;
    }>({
        isOpen: false,
        termId: '',
        termName: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        isActive: false
    });

    useEffect(() => {
        if (schoolId) {
            loadTerms();
        }
    }, [schoolId]);

    const loadTerms = async () => {
        if (!schoolId) return;

        setLoading(true);
        try {
            const fetchedTerms = await getAllTerms(schoolId);
            setTerms(fetchedTerms);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load terms');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (editingTerm) {
                // Update existing term
                await updateTerm(editingTerm.id, formData);
                setSuccess('Term updated successfully');
            } else {
                // Create new term
                await createTerm(schoolId, formData);
                setSuccess('Term created successfully');
            }

            await loadTerms();
            handleCloseModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save term');
        } finally {
            setLoading(false);
        }
    };

    const handleSetActive = async (termId: string) => {
        if (!schoolId) return;

        setLoading(true);
        setError('');
        try {
            await setActiveTerm(schoolId, termId);
            setSuccess('Active term updated');
            await loadTerms();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set active term');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (termId: string) => {
        if (!confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        setError('');
        try {
            await deleteTerm(termId);
            setSuccess('Term deleted successfully');
            await loadTerms();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete term');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (term: Term & { id: string }) => {
        setEditingTerm(term);
        setFormData({
            name: term.name,
            startDate: term.startDate,
            endDate: term.endDate,
            isActive: term.isActive
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTerm(null);
        setFormData({
            name: '',
            startDate: '',
            endDate: '',
            isActive: false
        });
    };

    if (role?.toLowerCase() !== 'admin') {
        return <div className="p-8 text-white">Access Denied: Admins Only</div>;
    }

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Term Management</h1>
                    <p className="text-gray-400 mt-2">Manage academic terms and sessions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Term
                </button>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <p className="text-teal-300 text-sm">{success}</p>
                </div>
            )}

            {loading && terms.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : terms.length === 0 ? (
                <div className="bg-dark-card border border-white/5 rounded-2xl p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Terms Yet</h3>
                    <p className="text-gray-400 mb-6">Create your first academic term to get started</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
                    >
                        Create First Term
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {terms.map(term => (
                        <div
                            key={term.id}
                            className={`bg-dark-card border rounded-2xl p-6 transition-all ${term.isActive
                                ? 'border-teal-500/50 bg-teal-500/5'
                                : 'border-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-1">{term.name}</h3>
                                    {term.isActive && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-500/20 text-teal-400 text-xs font-bold rounded">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Active
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(term)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(term.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {!term.isActive && (
                                <button
                                    onClick={() => handleSetActive(term.id)}
                                    className="w-full px-4 py-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 rounded-lg transition-colors text-sm font-bold"
                                >
                                    Set as Active Term
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-card border border-white/10 rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {editingTerm ? 'Edit Term' : 'Create New Term'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Term Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-dark-input border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                                    placeholder="e.g., 1st Term 2025/2026"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-dark-input border border-white/10 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-dark-input border border-white/10 rounded-xl text-white focus:border-teal-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-6 py-3 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                                >
                                    {loading ? 'Saving...' : editingTerm ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
