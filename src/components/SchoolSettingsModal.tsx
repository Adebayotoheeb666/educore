import { X, Copy, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SchoolSettingsModalProps {
    schoolId?: string;
    onClose?: () => void;
}

export const SchoolSettingsModal = ({ schoolId, onClose }: SchoolSettingsModalProps) => {
    const [school, setSchool] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSchool = async () => {
            if (!schoolId) {
                setError('No school ID provided');
                setLoading(false);
                return;
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('schools')
                    .select('*')
                    .eq('id', schoolId)
                    .single();

                if (fetchError) throw fetchError;
                setSchool(data);
            } catch (err) {
                console.error('Error fetching school:', err);
                setError(err instanceof Error ? err.message : 'Failed to load school');
            } finally {
                setLoading(false);
            }
        };

        fetchSchool();
    }, [schoolId]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !school) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error || 'School not found'}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                    >
                        Close
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-white mb-2">School Information</h3>
                <p className="text-gray-400 text-sm">Share these details with staff for login</p>
            </div>

            <div className="bg-dark-bg border border-white/10 rounded-lg p-4 space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">School Name</label>
                    <p className="text-white font-medium">{school.name}</p>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">School UUID (for login)</label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black/30 border border-white/5 rounded px-3 py-2 text-teal-400 font-mono text-sm break-all">
                            {school.id}
                        </code>
                        <button
                            onClick={() => copyToClipboard(school.id)}
                            className="p-2 hover:bg-teal-500/20 text-teal-400 rounded transition-colors flex-shrink-0"
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-green-400" />
                            ) : (
                                <Copy className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {school.address && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Address</label>
                        <p className="text-gray-300">{school.address}</p>
                    </div>
                )}

                {school.contact_email && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Contact Email</label>
                        <p className="text-gray-300">{school.contact_email}</p>
                    </div>
                )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-400 mb-2">How to Share With Staff</h4>
                <p className="text-blue-200 text-sm mb-3">
                    When staff members log in, they should enter the School UUID above in the "School ID" field. 
                    They can also enter the school name if they don't know the UUID.
                </p>
                <ul className="text-blue-200 text-xs space-y-1 list-disc list-inside">
                    <li>Share this UUID with all staff members</li>
                    <li>Staff can use either the UUID or the school name during login</li>
                    <li>Make sure staff also have their Staff ID (e.g., STF-WIS-1234)</li>
                </ul>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 border border-white/10 hover:bg-white/5 text-white font-bold rounded-lg transition-colors"
                >
                    Close
                </button>
            )}
        </div>
    );
};
