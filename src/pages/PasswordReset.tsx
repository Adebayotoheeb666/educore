import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { sendPasswordReset, verifyResetCode, confirmReset } from '../lib/passwordResetService';

export const PasswordReset = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [mode, setMode] = useState<'request' | 'reset'>('request');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState('');

    const oobCode = searchParams.get('oobCode');

    useEffect(() => {
        // If we have an oobCode, verify it and switch to reset mode
        if (oobCode) {
            verifyCode(oobCode);
        }
    }, [oobCode]);

    const verifyCode = async (code: string) => {
        setLoading(true);
        setError('');
        try {
            const email = await verifyResetCode(code);
            setVerifiedEmail(email);
            setMode('reset');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid reset link');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await sendPasswordReset(email);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!oobCode) {
            setError('Invalid reset link');
            return;
        }

        setLoading(true);
        try {
            await confirmReset(oobCode, newPassword);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'request') {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-dark-card border border-white/10 rounded-3xl p-8 space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-teal-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                            <p className="text-gray-400 text-sm">
                                Enter your email address and we'll send you a link to reset your password
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        {success ? (
                            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-6 text-center space-y-3">
                                <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
                                <h3 className="text-teal-300 font-bold">Check Your Email</h3>
                                <p className="text-teal-200/70 text-sm">
                                    We've sent a password reset link to <span className="font-bold">{email}</span>
                                </p>
                                <p className="text-gray-400 text-xs">
                                    The link will expire in 1 hour
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleRequestReset} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-dark-input border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        )}

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Reset mode
    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-dark-card border border-white/10 rounded-3xl p-8 space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-teal-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
                        {verifiedEmail && (
                            <p className="text-gray-400 text-sm">
                                for <span className="text-teal-400 font-bold">{verifiedEmail}</span>
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {success ? (
                        <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-6 text-center space-y-3">
                            <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
                            <h3 className="text-teal-300 font-bold">Password Reset Successful</h3>
                            <p className="text-teal-200/70 text-sm">
                                Redirecting to login...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleConfirmReset} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-dark-input border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                                    placeholder="Enter new password"
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-dark-input border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
