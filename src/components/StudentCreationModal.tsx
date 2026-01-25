import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/types';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditService';
import { createStudentAccount, type CreateStudentParams } from '../lib/studentService';

interface StudentCreationModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    classes?: any[];
    user?: User | null;
    profile?: UserProfile | null;
    schoolId?: string | null;
}

export const StudentCreationModal = ({ onClose, onSuccess, initialData, classes = [], user: propUser, schoolId: propSchoolId }: StudentCreationModalProps) => {
    const { schoolId: authSchoolId, user: authUser } = useAuth();

    const user = propUser || authUser;
    const schoolId = propSchoolId || authSchoolId;

    const [formData, setFormData] = useState<CreateStudentParams>({
        fullName: initialData?.fullName || '',
        email: initialData?.email || '',
        phoneNumber: initialData?.phoneNumber || '',
        admissionNumber: initialData?.admissionNumber || '',
        classId: initialData?.classId || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdCredentials, setCreatedCredentials] = useState<{ admissionNumber: string; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId || !user) {
            setError('System error: Missing school or admin ID');
            return;
        }

        if (!formData.fullName.trim()) {
            setError('Student name is required');
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
                onSuccess();
            } else {
                // CREATE flow
                const result = await createStudentAccount(schoolId, formData);
                setCreatedCredentials({
                    admissionNumber: result.admissionNumber,
                    message: result.message
                });
            }
        } catch (err) {
            console.error('Student creation error:', err);
            let errorMessage = 'Failed to save student account';

            if (err instanceof Error) {
                errorMessage = err.message;
                // Provide more specific error messages
                if (err.message.includes('RLS')) {
                    errorMessage = 'Permission denied. Please ensure you have admin rights for this school.';
                } else if (err.message.includes('duplicate')) {
                    errorMessage = 'A student with this admission number already exists.';
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
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-500">Student Created!</h2>
                    <p className="text-gray-400 text-sm">{createdCredentials.message}</p>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Admission Number</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-dark-bg/50 border border-white/5 rounded px-3 py-2 text-emerald-400 font-mono text-sm">
                                {createdCredentials.admissionNumber}
                            </code>
                            <button
                                onClick={() => handleCopy(createdCredentials.admissionNumber)}
                                className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors"
                                title="Copy admission number"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="text-xs text-emerald-200 space-y-1">
                        <p>✓ Student profile created</p>
                        <p>✓ Ready to assign classes and subjects</p>
                        <p>✓ Can log in with admission number</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setCreatedCredentials(null);
                            setFormData({
                                fullName: '',
                                email: '',
                                phoneNumber: '',
                                admissionNumber: '',
                                classId: '',
                            });
                        }}
                        className="flex-1 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition font-medium"
                    >
                        Add Another
                    </button>
                    <button
                        onClick={onSuccess}
                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-medium"
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
                <h2 className="text-xl font-bold text-white">Add Student</h2>
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
                        className="w-full bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                        placeholder="e.g. John Doe"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-400 block mb-2">Email *</label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                        placeholder="e.g. john@example.com"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-400 block mb-2">Phone Number (Optional)</label>
                    <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                        placeholder="e.g. +234 800 000 0000"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-400 block mb-2">Admission Number (Optional)</label>
                    <input
                        type="text"
                        value={formData.admissionNumber}
                        onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                        className="w-full bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                        placeholder="Leave blank to auto-generate"
                    />
                    <p className="text-xs text-gray-500 mt-1">If left blank, an admission number will be generated automatically</p>
                </div>

                {classes && classes.length > 0 && (
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Class (Optional)</label>
                        <select
                            value={formData.classId}
                            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                            className="w-full bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                        >
                            <option value="">Select a class</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name} {cls.level && `(${cls.level})`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

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
                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Create Student
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
