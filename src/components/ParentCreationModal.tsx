import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/types';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditService';
import { createParentAccount, type CreateParentParams } from '../lib/parentService';

interface ParentCreationModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    user?: User | null;
    profile?: UserProfile | null;
    schoolId?: string | null;
}

export const ParentCreationModal = ({ onClose, onSuccess, initialData, user: propUser, schoolId: propSchoolId }: ParentCreationModalProps) => {
    const { schoolId: authSchoolId, user: authUser } = useAuth();

    const user = propUser || authUser;
    const schoolId = propSchoolId || authSchoolId;

    const [formData, setFormData] = useState<CreateParentParams>({
        fullName: initialData?.fullName || '',
        email: initialData?.email || '',
        phoneNumber: initialData?.phoneNumber || '',
        parentId: initialData?.parentId || ''
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

        if (!formData.email.trim()) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (initialData) {
                // UPDATE flow
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        full_name: formData.fullName,
                        email: formData.email,
                        phone_number: formData.phoneNumber,
                    })
                    .eq('id', initialData.id);

                if (updateError) throw updateError;

                // Log the update action
                if (schoolId && user?.id) {
                    await logAction(
                        schoolId,
                        user.id,
                        user.email || 'Unknown',
                        'update',
                        'parent',
                        initialData.id,
                        {
                            full_name: { old: initialData.fullName, new: formData.fullName },
                            email: { old: initialData.email, new: formData.email },
                            phone_number: { old: initialData.phoneNumber, new: formData.phoneNumber }
                        }
                    );
                }

                onSuccess();
            } else {
                // CREATE flow
                const result = await createParentAccount(schoolId, formData);
                setCreatedCredentials({
                    parentId: result.parentId,
                    message: result.message
                });

                // Log the create action
                if (schoolId && user?.id) {
                    await logAction(
                        schoolId,
                        user.id,
                        user.email || 'Unknown',
                        'create',
                        'parent',
                        result.parentUid,
                        {
                            parent_id: result.parentId,
                            email: formData.email,
                            full_name: formData.fullName
                        }
                    );
                }
            }
        } catch (err) {
            console.error('Parent creation error:', err);
            let errorMessage = 'Failed to save parent account';

            if (err instanceof Error) {
                errorMessage = err.message;
                // Provide more specific error messages
                if (err.message.includes('RLS')) {
                    errorMessage = 'Permission denied. Please ensure you have admin rights for this school.';
                } else if (err.message.includes('duplicate')) {
                    errorMessage = 'A parent with this email already exists.';
                } else if (err.message.includes('email')) {
                    errorMessage = 'Invalid email address or email already in use.';
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (createdCredentials) {
        return (
            <div className="bg-dark-card p-6 w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-500/20">
                        <CheckCircle2 className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-blue-500">Parent Created!</h2>
                    <p className="text-gray-400 text-sm">{createdCredentials.message}</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Parent ID</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-dark-bg/50 border border-white/5 rounded px-3 py-2 text-blue-400 font-mono text-sm">
                                {createdCredentials.parentId}
                            </code>
                            <button
                                onClick={() => handleCopy(createdCredentials.parentId)}
                                className="p-2 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                title="Copy parent ID"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Share this Parent ID with the parent so they can log in to the portal.
                    </p>
                </div>

                <button
                    onClick={onSuccess}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors"
                >
                    Done
                </button>
            </div>
        );
    }

    return (
        <div className="bg-dark-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                    {initialData ? 'Edit Parent' : 'Create Parent'}
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-200 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Parent Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-dark-bg border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                    <input
                        type="email"
                        required
                        className="w-full bg-dark-bg border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                        placeholder="parent@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number (Optional)</label>
                    <input
                        type="tel"
                        className="w-full bg-dark-bg border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                        placeholder="+234 800 000 0000"
                        value={formData.phoneNumber || ''}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                </div>

                {!initialData && (
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Parent ID (Optional)</label>
                        <input
                            type="text"
                            className="w-full bg-dark-bg border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                            placeholder="Leave blank to auto-generate"
                            value={formData.parentId || ''}
                            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            If left blank, a unique ID will be generated automatically.
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {initialData ? 'Update' : 'Create'} Parent
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
