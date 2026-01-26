import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { signInWithPhone, confirmPhoneOTP, registerSchool, loginWithAdmissionNumber, loginWithStaffId, loginWithParentCredentials } from '../lib/authService';
import { isValidUUID, findSchoolByName } from '../lib/schoolService';
import { Sparkles, Mail, Lock, ArrowRight, User, AlertCircle, Building2, UserCircle2, Phone, ShieldCheck, BadgeCheck } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'school-reg' | 'student-login' | 'parent-login' | 'staff-login';

export const Login = () => {
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') as AuthMode || 'login';
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [schoolAddress, setSchoolAddress] = useState('');
    const [schoolId, setSchoolId] = useState('');
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [staffId, setStaffId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user, profile, loading: authLoading } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && user && profile) {
            if (profile.role === 'admin') {
                navigate('/admin');
            } else if (profile.role === 'parent') {
                navigate('/portal/parent');
            } else if (profile.role === 'student') {
                navigate('/portal');
            } else {
                navigate('/dashboard'); // Staff/Teachers
            }
        }
    }, [user, profile, authLoading, navigate]);

    const getUserFriendlyErrorMessage = (error: any): string => {
        const message = error?.message || '';
        const lowerMessage = message.toLowerCase();

        // Network/Fetch errors
        if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('fetch failed')) {
            console.error('Network error detected:', error);
            return "Network error: Unable to connect to the authentication service. Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.";
        }
        if (lowerMessage.includes('cors') || lowerMessage.includes('cross-origin')) {
            return "Connection error: Unable to authenticate at this time. Please try again or contact support.";
        }

        if (lowerMessage.includes('violates row-level security')) {
            return "Access denied. You may not have permission to perform this action.";
        }
        if (lowerMessage.includes('user already registered') || lowerMessage.includes('already exists')) {
            return "An account with this email already exists.";
        }
        if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid_grant')) {
            return "Invalid email or password. Please try again.";
        }
        if (lowerMessage.includes('rate_limit') || lowerMessage.includes('too many requests')) {
            return "Too many attempts. Please wait a moment before trying again.";
        }

        // Return original message if it looks fairly readable, otherwise default
        if (message && message.length < 100) return message;

        return "An unexpected error occurred. Please try again.";
    };

    const handleSendOtp = async () => {
        if (!phoneNumber || !schoolId) {
            setError("Please enter School ID and Phone Number");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await signInWithPhone(phoneNumber);
            setShowOtpInput(true);
        } catch (err: any) {
            console.error("OTP send error:", err instanceof Error ? err.message : String(err));
            setError(getUserFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return;

        setLoading(true);
        setError(null);
        try {
            await confirmPhoneOTP(phoneNumber, otp, schoolId);
            navigate('/portal/parent');
        } catch (err: any) {
            console.error("OTP verification error:", err instanceof Error ? err.message : String(err));
            setError(getUserFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const resolveSchoolId = async (inputSchoolId: string): Promise<string> => {
        // If it's a valid UUID, use it as-is
        if (isValidUUID(inputSchoolId)) {
            return inputSchoolId;
        }

        // Otherwise, try to find the school by name
        console.log('School ID is not a UUID, attempting to look up by name:', inputSchoolId);
        const schools = await findSchoolByName(inputSchoolId);

        if (schools.length === 1) {
            console.log('Found school:', schools[0].name);
            return schools[0].id;
        } else if (schools.length > 1) {
            throw new Error(
                `Multiple schools found matching "${inputSchoolId}". Please use the school's UUID instead. ` +
                `Contact your administrator for the school UUID.`
            );
        } else {
            throw new Error(
                `School "${inputSchoolId}" not found. Please use the school's UUID. ` +
                `The School ID should be a unique identifier (like: abc12345-1234-5678-90ab-cdef12345678). ` +
                `If you don't know your school's UUID, contact your administrator.`
            );
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                console.log('[Login] Attempting admin login with email:', email);
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    console.error('[Login] Auth error:', error);
                    throw error;
                }
                console.log('[Login] Successfully authenticated, redirecting to /admin');
                navigate('/admin');
            } else if (mode === 'school-reg') {
                console.log('[Login] Attempting school registration');
                await registerSchool(
                    { email, password, fullName: name },
                    { name: schoolName, address: schoolAddress }
                );
                navigate('/admin');
            } else if (mode === 'student-login') {
                if (!schoolId || !admissionNumber || !password) {
                    throw new Error("Please fill in all fields (School ID, Admission Number, and PIN)");
                }
                const resolvedSchoolId = await resolveSchoolId(schoolId);
                await loginWithAdmissionNumber(resolvedSchoolId, admissionNumber, password);
                navigate('/portal');
            } else if (mode === 'staff-login') {
                if (!schoolId || !staffId || !password) {
                    throw new Error("Please fill in all fields (School ID, Staff ID, and Password)");
                }
                const resolvedSchoolId = await resolveSchoolId(schoolId);
                await loginWithStaffId(resolvedSchoolId, staffId, password);
                navigate('/dashboard');
            } else if (mode === 'parent-login') {
                if (showOtpInput) {
                    await handleVerifyOtp();
                } else if (schoolId && admissionNumber && password) {
                    const resolvedSchoolId = await resolveSchoolId(schoolId);
                    await loginWithParentCredentials(resolvedSchoolId, admissionNumber, password);
                    navigate('/portal/parent');
                } else if (phoneNumber) {
                    await handleSendOtp();
                } else {
                    throw new Error("Please enter School ID, Child's Admission Number and PIN, OR Phone Number for OTP");
                }
            }
        } catch (err: any) {
            console.error('[Login] Error during authentication:', {
                error: err,
                message: err?.message,
                status: err?.status,
                code: err?.code,
                mode: mode
            });
            setError(getUserFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-teal-400/5 blur-[100px] rounded-full" />
            </div>

            <div className="w-full max-w-md bg-dark-card border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-teal-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {mode === 'login' && 'Admin Login'}
                        {mode === 'staff-login' && 'Staff Portal'}
                        {mode === 'school-reg' && 'Register School'}
                        {mode === 'student-login' && 'Student Portal'}
                        {mode === 'parent-login' && 'Parent Portal'}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {mode === 'login' && 'Authorized administrators only'}
                        {mode === 'staff-login' && 'Login with the ID provided by your school administrator'}
                        {mode === 'school-reg' && 'Establish your institutional tenant on EduCore'}
                        {mode === 'student-login' && 'Enter your unique admission number and PIN'}
                        {mode === 'parent-login' && 'Access children\'s data via child ID or phone'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {mode === 'school-reg' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">School Name</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                    <input
                                        type="text" required
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                        placeholder="International Wisdom School"
                                        value={schoolName}
                                        onChange={(e) => setSchoolName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">School Address</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                    <input
                                        type="text" required
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                        placeholder="123 Education Ave, Lagos"
                                        value={schoolAddress}
                                        onChange={(e) => setSchoolAddress(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Admin Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                    <input
                                        type="text" required
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                        placeholder="Prof. John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {(mode === 'student-login' || mode === 'staff-login') && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">School ID or Name</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                <input
                                    type="text" required
                                    className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                    placeholder="School UUID or name (e.g., International Wisdom School)"
                                    value={schoolId}
                                    onChange={(e) => setSchoolId(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-gray-500 ml-1 mt-1">
                                {mode === 'staff-login' && 'Use your school\'s ID (UUID) or name. Ask your administrator if unsure.'}
                                {mode === 'student-login' && 'Use your school\'s ID (UUID) or name. Ask your school administrator if unsure.'}
                            </p>
                        </div>
                    )}

                    {mode === 'student-login' && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Admission Number</label>
                            <div className="relative group">
                                <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                <input
                                    type="text" required
                                    className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                    placeholder="STU-001"
                                    value={admissionNumber}
                                    onChange={(e) => setAdmissionNumber(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'staff-login' && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Staff ID</label>
                            <div className="relative group">
                                <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                <input
                                    type="text" required
                                    className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                    placeholder="STF-WIS-1234"
                                    value={staffId}
                                    onChange={(e) => setStaffId(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'parent-login' && !showOtpInput && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Child's Admission Number</label>
                                <div className="relative group">
                                    <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                    <input
                                        type="text"
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                        placeholder="STU-001"
                                        value={admissionNumber}
                                        onChange={(e) => setAdmissionNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-white/5"></div>
                                <span className="flex-shrink mx-4 text-gray-600 text-[10px] font-bold uppercase tracking-widest">OR USE PHONE OTP</span>
                                <div className="flex-grow border-t border-white/5"></div>
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">School ID</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                <input
                                    type="text" required
                                    className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                    placeholder="wisdom-school"
                                    value={schoolId}
                                    onChange={(e) => setSchoolId(e.target.value)}
                                    disabled={showOtpInput}
                                />
                            </div>
                        </div>

                        {!showOtpInput ? (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                    <input
                                        type="tel" required={!admissionNumber}
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50"
                                        placeholder="+234 800 000 0000"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                                <div id="recaptcha-container"></div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Enter OTP Code</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400" />
                                    <input
                                        type="text" required
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50 tracking-widest text-lg font-bold"
                                        placeholder="1 2 3 4 5 6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Code sent to {phoneNumber}. <button type="button" onClick={() => setShowOtpInput(false)} className="text-teal-400 hover:underline">Change Number</button>
                                </p>
                            </div>
                        )}
                    </div>

                    {(mode === 'login' || mode === 'school-reg') && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                                <input
                                    type="email" required
                                    className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50"
                                    placeholder="admin@school.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                            {mode === 'school-reg' || mode === 'login' ? 'Password' : 'PIN / Password'}
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                            <input
                                type="password" required
                                className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {(mode === 'login' || mode === 'school-reg') && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => navigate('/reset-password')}
                                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>
                                    {mode === 'login' && 'Admin Sign In'}
                                    {mode === 'staff-login' && 'Staff Sign In'}
                                    {mode === 'school-reg' && 'Create School'}
                                    {mode === 'student-login' && 'Access Portal'}
                                    {mode === 'parent-login' && (showOtpInput ? 'Verify & Login' : 'Send Code')}
                                </span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                    {/* Mode switching buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setMode('login'); setError(null); }}
                            className={`p-2 rounded-lg text-xs font-bold transition-colors ${mode === 'login' ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            Admin Login
                        </button>
                        <button
                            onClick={() => { setMode('staff-login'); setError(null); }}
                            className={`p-2 rounded-lg text-xs font-bold transition-colors ${mode === 'staff-login' ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            Staff Login
                        </button>
                        <button
                            onClick={() => { setMode('student-login'); setError(null); }}
                            className={`p-2 rounded-lg text-xs font-bold transition-colors ${mode === 'student-login' ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            Student (Admission #)
                        </button>
                        <button
                            onClick={() => { setMode('parent-login'); setError(null); }}
                            className={`p-2 rounded-lg text-xs font-bold transition-colors ${mode === 'parent-login' ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            Parent (Phone/Email)
                        </button>
                        <button
                            onClick={() => { setMode('school-reg'); setError(null); }}
                            className={`col-span-2 p-2 rounded-lg text-xs font-bold transition-colors ${mode === 'school-reg' ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            Register New School
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
