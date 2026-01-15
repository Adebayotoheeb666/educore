import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { registerSchool, loginWithAdmissionNumber } from '../lib/authService';
import { Sparkles, Mail, Lock, ArrowRight, User, AlertCircle, Building2, UserCircle2 } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'school-reg' | 'student-login';

export const Login = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [schoolAddress, setSchoolAddress] = useState('');
    const [schoolId, setSchoolId] = useState('');
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else if (mode === 'school-reg') {
                await registerSchool(
                    { email, password, fullName: name },
                    { name: schoolName, address: schoolAddress }
                );
            } else if (mode === 'student-login') {
                if (!schoolId || !admissionNumber || !password) {
                    throw new Error("Please fill in all fields (School ID, Admission Number, and PIN)");
                }
                await loginWithAdmissionNumber(schoolId, admissionNumber, password);
            }
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                        {mode === 'login' && 'Welcome Back'}
                        {mode === 'school-reg' && 'Register School'}
                        {mode === 'student-login' && 'Student Portal'}
                    </h1>
                    <p className="text-gray-400">
                        {mode === 'login' && 'Enter your details to access your classroom'}
                        {mode === 'school-reg' && 'Set up your school on Educore'}
                        {mode === 'student-login' && 'Login with your Admission ID'}
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

                    {mode === 'student-login' && (
                        <>
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
                                    />
                                </div>
                            </div>
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
                        </>
                    )}

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
                            {mode === 'student-login' ? 'PIN / Password' : 'Password'}
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
                                    {mode === 'login' && 'Sign In'}
                                    {mode === 'school-reg' && 'Create School'}
                                    {mode === 'student-login' && 'Access Portal'}
                                </span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                    <button
                        onClick={() => setMode(mode === 'login' ? 'student-login' : 'login')}
                        className="w-full text-center text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        {mode === 'login' ? 'Are you a Student/Parent? Login here' : 'Back to Staff/Admin Login'}
                    </button>
                    <button
                        onClick={() => setMode(mode === 'school-reg' ? 'login' : 'school-reg')}
                        className="w-full text-center text-teal-400 font-bold hover:text-teal-300 transition-colors text-sm"
                    >
                        {mode === 'school-reg' ? 'Already have a school account?' : 'Register your School on Educore'}
                    </button>
                </div>
            </div>
        </div>
    );
};
