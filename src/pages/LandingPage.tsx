import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    ShieldCheck,
    Users,
    Zap,
    Globe,
    ArrowRight,
    School,
    HeartPulse
} from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-dark-bg text-white selection:bg-teal-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
                        <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-dark-bg" />
                        </div>
                        <span>Edu<span className="text-teal-500">Gemini</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="px-6 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors">Login</button>
                        <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-white text-dark-bg text-sm font-bold rounded-full hover:bg-teal-400 transition-all transform hover:scale-105 active:scale-95">Register School</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-bold mb-8 animate-fade-in">
                            <Zap className="w-4 h-4" />
                            <span>v2.0 powered by Google Gemini AI</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                            The Future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-500">School Admin.</span>
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl">
                            The most advanced multi-tenant educational ecosystem. Integrated AI lesson planning,
                            smart paper marking, and real-time student performance analytics for modern schools.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-10 py-5 bg-teal-500 hover:bg-teal-400 text-dark-bg text-lg font-black rounded-2xl transition-all shadow-2xl shadow-teal-500/20 flex items-center justify-center gap-3 group">
                                <span>Get Started Now</span>
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="w-full sm:w-auto px-10 py-5 border border-white/10 hover:bg-white/5 text-lg font-bold rounded-2xl transition-all">
                                Request Demo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Animated Background Elements */}
                <div className="absolute top-0 right-0 w-[60%] h-full pointer-events-none">
                    <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-teal-500/20 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full animate-pulse delay-1000" />
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl font-black mb-4">Everything your school needs, supercharged by AI.</h2>
                        <p className="text-gray-400">EduGemini replaces 10+ fragmented tools with one cohesive ecosystem.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Zap}
                            title="AI Lesson Planner"
                            description="Generate NERDC and WAEC aligned lesson notes in seconds using Google Gemini Pro integration."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Smart Script Scanner"
                            description="OCR technology to scan handwritten scripts and provide AI-driven grading and feedback instantly."
                        />
                        <FeatureCard
                            icon={Globe}
                            title="Multi-Tenant Isolation"
                            description="Each school operates in a secure, isolated environment with custom branding and data privacy."
                        />
                        <FeatureCard
                            icon={School}
                            title="Institutional Overview"
                            description="Real-time dashboards for Admins to track attendance, financials, and academic performance."
                        />
                        <FeatureCard
                            icon={Users}
                            title="Teacher Portals"
                            description="Personalized feeds for teachers to manage classes, record grades, and take digital attendance."
                        />
                        <FeatureCard
                            icon={HeartPulse}
                            title="Parent Engagement"
                            description="Direct access for parents to track their child's live attendance, grades, and fee payments."
                        />
                    </div>
                </div>
            </section>

            {/* Content Stats */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-5xl font-black text-teal-400 mb-2">500+</div>
                        <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Registered Schools</div>
                    </div>
                    <div>
                        <div className="text-5xl font-black text-emerald-400 mb-2">10k+</div>
                        <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Active Teachers</div>
                    </div>
                    <div>
                        <div className="text-5xl font-black text-blue-400 mb-2">250k+</div>
                        <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Students Tracked</div>
                    </div>
                    <div>
                        <div className="text-5xl font-black text-purple-400 mb-2">1M+</div>
                        <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">AI Notes Generated</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 bg-dark-bg">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
                        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-dark-bg" />
                        </div>
                        <span>EduGemini</span>
                    </div>
                    <div className="text-gray-500 text-sm">© 2026 EduGemini Systems. All rights reserved. Built for the future of education.</div>
                    <div className="flex items-center gap-6">
                        <button className="text-gray-400 hover:text-white transition-colors">Privacy</button>
                        <button className="text-gray-400 hover:text-white transition-colors">Terms</button>
                        <button className="text-gray-400 hover:text-white transition-colors text-sm font-bold bg-white/5 px-4 py-2 rounded-full">Contact Support</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description }: any) => (
    <div className="p-8 bg-dark-card border border-white/5 rounded-[32px] hover:border-teal-500/30 transition-all group">
        <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Icon className="w-7 h-7 text-teal-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
);
