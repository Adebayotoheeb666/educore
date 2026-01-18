import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createStaffAccount, type CreateStaffParams } from '../lib/staffService';

interface StaffCreationModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const StaffCreationModal = ({ onClose, onSuccess }: StaffCreationModalProps) => {
    const { schoolId, user } = useAuth();
    const [formData, setFormData] = useState<CreateStaffParams>({
        fullName: '',
        email: '',
        role: 'staff',
        specialization: '',
        phoneNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdCredentials, setCreatedCredentials] = useState<{ staffId: string; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId || !user) {
            setError('System error: Missing school or admin ID');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await createStaffAccount(schoolId, user.id, formData);
            setCreatedCredentials({
                staffId: result.staffId
            });
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to create staff account');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    if (createdCredentials) {
        return (
            <div className="bg-dark-card p-6 w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Staff Invited!</h2>
                    <p className="text-gray-400">An invitation email has been sent to the staff member. They can set their password using the link in the email.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Staff ID (For Reference)</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 bg-black/30 p-3 rounded-lg text-teal-400 font-mono text-lg">{createdCredentials.staffId}</code>
                            <button onClick={() => handleCopy(createdCredentials.staffId)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
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
        <div className="bg-dark-card w-full max-w-md space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Create Staff Account</h2>
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
                                <span>Create Account</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
