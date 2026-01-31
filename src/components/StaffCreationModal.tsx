import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/types';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditService';
import { createStaffAccount, type CreateStaffParams } from '../lib/staffService';

interface StaffCreationModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    user?: User | null;
    profile?: UserProfile | null;
    schoolId?: string | null;
}

export const StaffCreationModal = ({ onClose, onSuccess, initialData, user: propUser, schoolId: propSchoolId }: StaffCreationModalProps) => {
    const { schoolId: authSchoolId, user: authUser } = useAuth();

    const user = propUser || authUser;
    const schoolId = propSchoolId || authSchoolId;

    const [formData, setFormData] = useState<CreateStaffParams>({
        fullName: initialData?.fullName || '',
        email: initialData?.email || '',
        role: (initialData?.role as any) || 'staff',
        specialization: '', // We can't easily fetch specialization here without more props or queries
        phoneNumber: initialData?.phoneNumber || '',
        staffId: initialData?.staffId || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdCredentials, setCreatedCredentials] = useState<{ staffId: string; message: string; warning?: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId || !user) {
            setError('System error: Missing school or admin ID');
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
                        role: formData.role,
                        phone_number: formData.phoneNumber,
                        staff_id: formData.staffId
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
                        'staff',
                        initialData.id,
                        {
                            full_name: { old: initialData.fullName, new: formData.fullName },
                            email: { old: initialData.email, new: formData.email },
                            role: { old: initialData.role, new: formData.role },
                            phone_number: { old: initialData.phoneNumber, new: formData.phoneNumber },
                            staff_id: { old: initialData.staffId, new: formData.staffId }
                        }
                    );
                }

                onSuccess();
            } else {
                // CREATE flow
                const result = await createStaffAccount(schoolId, user.id, formData);
                setCreatedCredentials({
                    staffId: result.staffId,
                    message: result.message,
                    warning: result.warning
                });
            }
        } catch (err) {
            console.error('Staff creation error:', err);
            let errorMessage = 'Failed to save staff account';

            if (err instanceof Error) {
                errorMessage = err.message;
                // Provide more specific guidance for common errors
                if (err.message.includes('Email already registered')) {
                    errorMessage = 'Email already registered in system. Try using a different email address.';
                } else if (err.message.includes('Invalid email')) {
                    errorMessage = 'Invalid email format. Please provide a valid email address.';
                } else if (err.message.includes('Not an admin')) {
                    errorMessage = 'You do not have permission to create staff accounts. Admin access required.';
                } else if (err.message.includes('RLS')) {
                    errorMessage = 'Permission denied. Please ensure you have admin rights for this school.';
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    if (createdCredentials) {
        const isDevelopmentFallback = createdCredentials.message.includes('development mode');
        const hasWarning = !!createdCredentials.warning;
        const isWarningState = isDevelopmentFallback || hasWarning;

        return (
            <div className="bg-dark-card p-6 w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isWarningState ? 'bg-yellow-500/20' : 'bg-green-500/20'
                        }`}>
                        <CheckCircle2 className={`w-8 h-8 ${isWarningState ? 'text-yellow-500' : 'text-green-500'}`} />
                    </div>
                    <h2 className={`text-2xl font-bold ${isWarningState ? 'text-yellow-500' : 'text-green-500'}`}>
                        {isWarningState ? 'Staff Profile Created' : 'Staff Invited!'}
                    </h2>
                    <p className="text-gray-400 text-sm">{createdCredentials.message}</p>
                </div>

                <div className={`border rounded-xl p-6 space-y-4 ${isWarningState
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-white/5 border-white/10'
                    }`}>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Staff ID</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 bg-black/30 p-3 rounded-lg text-teal-400 font-mono text-lg">{createdCredentials.staffId}</code>
                            <button onClick={() => handleCopy(createdCredentials.staffId)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {isDevelopmentFallback && (
                        <div className="bg-black/30 rounded-lg p-4 border border-yellow-500/30 text-sm text-yellow-100">
                            <p className="font-semibold mb-2">⚠️ Development Mode</p>
                            <ul className="list-disc list-inside space-y-1 text-xs text-yellow-100/80">
                                <li>Staff profile created in database</li>
                                <li>Auth account <strong>not created</strong> (Edge Function not deployed)</li>
                                <li>Staff cannot log in yet</li>
                                <li>Deploy functions to enable authentication</li>
                            </ul>
                        </div>
                    )}

                    {hasWarning && !isDevelopmentFallback && (
                        <div className="bg-black/30 rounded-lg p-4 border border-yellow-500/30 text-sm text-yellow-100">
                            <p className="font-semibold mb-2">⚠️ Partial Success</p>
                            <p className="text-xs text-yellow-100/80 mb-2">{createdCredentials.warning}</p>
                            <ul className="list-disc list-inside space-y-1 text-xs text-yellow-100/80">
                                <li>Staff profile has been created and is active</li>
                                <li>Auth account creation encountered a temporary issue</li>
                                <li>Staff can be manually linked to Auth accounts later if needed</li>
                                <li>Try creating the Auth account again after a few moments</li>
                            </ul>
                        </div>
                    )}
                </div>

                <button
                    onClick={onSuccess}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
                >
                    Done
                </button>
            </div>
        );
    }

    return (
        <div className="bg-dark-card w-full max-w-md space-y-6 px-6 py-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                    {initialData ? 'Edit Staff Account' : 'Create Staff Account'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                    <input
                        required
                        type="text"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                    <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                    <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                        className="w-full px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                    >
                        <option value="staff">Teacher / Academic Staff</option>
                        <option value="bursar">Bursar / Financial</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number (Optional)</label>
                    <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Staff ID (Optional)</label>
                    <input
                        type="text"
                        value={formData.staffId}
                        onChange={e => setFormData({ ...formData, staffId: e.target.value })}
                        placeholder="Leave blank to auto-generate"
                        className="w-full px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none font-mono"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>{initialData ? 'Save Changes' : 'Create Account'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
