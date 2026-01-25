import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/types';
import { createParentAccount, type CreateParentParams } from '../lib/parentService';

interface ParentCreationModalProps {
    onClose: () => void;
    onSuccess: () => void;
    user?: User | null;
    profile?: UserProfile | null;
    schoolId?: string | null;
}

export const ParentCreationModal = ({ onClose, onSuccess, user: propUser, schoolId: propSchoolId }: ParentCreationModalProps) => {
    const { schoolId: authSchoolId, user: authUser } = useAuth();

    const user = propUser || authUser;
    const schoolId = propSchoolId || authSchoolId;

    const [formData, setFormData] = useState<CreateParentParams>({
        fullName: '',
        email: '',
        phoneNumber: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdCredentials, setCreatedCredentials] = useState<{ parentId: string; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId || !user) {
            setError('System error: Missing school or admin ID');
            return;
        }

        if (!formData.fullName.trim()) {
            setError('Parent name is required');
            return;
        }

        if (!formData.phoneNumber?.trim() && !formData.email?.trim()) {
            setError('Phone number or email is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await createParentAccount(schoolId, formData);
            setCreatedCredentials({
                parentId: result.parentId,
                message: result.message
            });
        } catch (err) {
            console.error('Parent creation error:', err);
            let errorMessage = 'Failed to save parent account';
            
            if (err instanceof Error) {
                errorMessage = err.message;
                // Provide more specific error messages
                if (err.message.includes('RLS')) {
                    errorMessage = 'Permission denied. Please ensure you have admin rights for this school.';
                } else if (err.message.includes('duplicate')) {
                    errorMessage = 'A parent with this phone/email already exists.';
                } else if (err.message.includes('email')) {
                    errorMessage = 'Invalid email address or email already in use.';
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (createdCredentials) {
        return (
            <div className="bg-dark-card p-6 w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-purple-500/20">
                        <CheckCircle2 className="w-8 h-8 text-purple-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-purple-500">Parent Created!</h2>
                    <p className="text-gray-400 text-sm">{createdCredentials.message}</p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Parent Account</p>
                    <p className="text-white font-medium">{formData.fullName}</p>
                    {formData.phoneNumber && <p className="text-gray-400 text-sm">Phone: {formData.phoneNumber}</p>}
                    {formData.email && <p className="text-gray-400 text-sm">Email: {formData.email}</p>}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setCreatedCredentials(null);
                            setFormData({
                                fullName: '',
                                email: '',
                                phoneNumber: '',
                            });
                        }}
                        className="flex-1 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition font-medium"
                    >
                        Add Another
                    </button>
                    <button
                        onClick={onSuccess}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-dark-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create Parent Account</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm text-gray-400 block mb-2">Full Name *</label>
                    <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                        placeholder="e.g. Jane Doe"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-400 block mb-2">Email (Optional)</label>
                    <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                        placeholder="e.g. jane@example.com"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-400 block mb-2">Phone Number *</label>
                    <input
                        type="tel"
                        required
                        value={formData.phoneNumber || ''}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                        placeholder="e.g. +234 800 000 0000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Phone number is required to identify parents</p>
                </div>

                <div className="flex gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-white/10 hover:bg-white/5 text-white rounded-lg transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Create Parent
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
