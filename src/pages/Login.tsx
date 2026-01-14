import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Sparkles, Mail, Lock, ArrowRight, User, AlertCircle } from 'lucide-react';

export const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // For signup only
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // MOCK AUTH BYPASS
            if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('user', JSON.stringify({
                    uid: 'mock-user-123',
                    email: email,
                    role: 'teacher',
                    name: name || 'Mock User'
                }));
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));
                navigate('/');
                return;
            }

            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save user profile to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: name,
                    email: email,
                    role: 'teacher', // Default role
                    createdAt: new Date().toISOString()
                });

                // Update Auth Profile
                await updateProfile(user, { displayName: name });
            }
            navigate('/'); // Redirect to dashboard on success
        } catch (err: any) {
            console.error(err);

            let message = 'Authentication failed. Please try again.';
            switch (err.code) {
                case 'auth/invalid-credential':
                    message = 'Invalid email or password. Please check your credentials.';
                    break;
                case 'auth/user-not-found':
                    message = 'No account found with this email address.';
                    break;
                case 'auth/wrong-password':
                    message = 'Incorrect password. Please try again.';
                    break;
                case 'auth/email-already-in-use':
                    message = 'An account already exists with this email address.';
                    break;
                case 'auth/weak-password':
                    message = 'Password should be at least 6 characters.';
                    break;
                case 'auth/invalid-email':
                    message = 'Please enter a valid email address.';
                    break;
                case 'auth/network-request-failed':
                    message = 'Network error. Please check your internet connection.';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many failed attempts. Please try again later.';
                    break;
                default:
                    message = err.message || 'Authentication failed. Please try again.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
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
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-gray-400">
                        {isLogin ? 'Enter your details to access your classroom' : 'Join EduGemini to start teaching smarter'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                                    placeholder="Mr. Adebayo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                            <input
                                type="email"
                                required
                                className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                                placeholder="teacher@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                            <input
                                type="password"
                                required
                                className="w-full bg-dark-bg border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-gray-400">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 text-teal-400 font-bold hover:text-teal-300 transition-colors"
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
