import { useNavigate } from 'react-router-dom';
import { PublicFooter } from '../components/common/PublicFooter';
import {
    Sparkles,
    ShieldCheck,
    Users,
    Zap,
    Globe,
    ArrowRight,
    School,
    HeartPulse,
    CheckCircle,
    BarChart3,
    BookOpen,
    Layers,
    Target,
    Award,
    Clock,
    Lock
} from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-dark-bg text-white selection:bg-teal-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-2xl tracking-tighter cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-dark-bg" />
                        </div>
                        <span>Edu<span className="text-teal-500">Core</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
                        <a href="#howitworks" className="hover:text-white transition-colors">How It Works</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="px-6 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors">Login</button>
                        <button onClick={() => navigate('/login?mode=school-reg')} className="px-6 py-2.5 bg-teal-500 text-dark-bg text-sm font-bold rounded-full hover:bg-teal-400 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/20">Register Your School</button>
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
                        <p className="text-gray-400">EduCore replaces 10+ fragmented tools with one cohesive ecosystem.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Zap}
                            title="AI Lesson Planner"
                            description="Generate NERDC and WAEC aligned lesson notes in seconds using Google Gemini Pro integration."
                            onClick={() => navigate('/lessons')}
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Smart Script Scanner"
                            description="OCR technology to scan handwritten scripts and provide AI-driven grading and feedback instantly."
                            onClick={() => navigate('/marking')}
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
                            onClick={() => navigate('/admin')}
                        />
                        <FeatureCard
                            icon={Users}
                            title="Teacher Portals"
                            description="Personalized feeds for teachers to manage classes, record grades, and take digital attendance."
                            onClick={() => navigate('/dashboard')}
                        />
                        <FeatureCard
                            icon={HeartPulse}
                            title="Parent Engagement"
                            description="Direct access for parents to track their child's live attendance, grades, and fee payments."
                            onClick={() => navigate('/portal/parent')}
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

            {/* Solutions Section */}
            <section id="solutions" className="py-20 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl font-black mb-4">Solutions for Every Role</h2>
                        <p className="text-gray-400">Tailored features for administrators, teachers, students, and parents.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Admin Solution */}
                        <SolutionCard
                            icon={Target}
                            title="Administrators"
                            description="Manage the entire institution with real-time insights into financials, attendance, and academic performance."
                            features={[
                                "Institutional Dashboard",
                                "Financial Tracking",
                                "Attendance Management",
                                "Academic Analytics",
                                "Staff Assignment"
                            ]}
                            onClick={() => navigate('/admin')}
                            image="https://images.pexels.com/photos/7648027/pexels-photo-7648027.jpeg"
                        />

                        {/* Teacher Solution */}
                        <SolutionCard
                            icon={BookOpen}
                            title="Teachers"
                            description="Streamline lesson planning, grading, and class management with AI-powered assistance."
                            features={[
                                "AI Lesson Generator",
                                "Smart Paper Marking",
                                "Class Performance Tracking",
                                "Grade Management",
                                "Student Feedback"
                            ]}
                            onClick={() => navigate('/dashboard')}
                            image="https://images.pexels.com/photos/6684373/pexels-photo-6684373.jpeg"
                        />

                        {/* Student Solution */}
                        <SolutionCard
                            icon={Award}
                            title="Students"
                            description="Track your academic progress, attendance, and access learning resources in one unified portal."
                            features={[
                                "Performance Dashboard",
                                "Attendance Tracking",
                                "Grade Insights",
                                "Study Resources",
                                "Result History"
                            ]}
                            onClick={() => navigate('/portal')}
                            image="https://images.pexels.com/photos/5212687/pexels-photo-5212687.jpeg"
                        />

                        {/* Parent Solution */}
                        <SolutionCard
                            icon={HeartPulse}
                            title="Parents"
                            description="Stay connected with your child's progress through real-time updates and comprehensive analytics."
                            features={[
                                "Child Performance Tracking",
                                "Attendance Updates",
                                "Grade Notifications",
                                "Fee Management",
                                "Teacher Communication"
                            ]}
                            onClick={() => navigate('/portal/parent')}
                            image="https://images.pexels.com/photos/97080/pexels-photo-97080.jpeg"
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="howitworks" className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl font-black mb-4">How EduCore Works</h2>
                        <p className="text-gray-400">A seamless integration of AI and education management in four simple steps.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <ProcessStep
                            number="1"
                            title="Register Your School"
                            description="Set up your institutional profile and configure your schools custom settings and branding."
                            icon={School}
                        />
                        <ProcessStep
                            number="2"
                            title="Onboard Users"
                            description="Add administrators, teachers, students, and parents to your secure multi-tenant environment."
                            icon={Users}
                        />
                        <ProcessStep
                            number="3"
                            title="Leverage AI Tools"
                            description="Use AI-powered lesson planning, exam building, and paper marking to enhance productivity."
                            icon={Zap}
                        />
                        <ProcessStep
                            number="4"
                            title="Track & Analyze"
                            description="Monitor performance with real-time analytics dashboards and generate insights for improvement."
                            icon={BarChart3}
                        />
                    </div>
                </div>
            </section>

            {/* Key Capabilities Section */}
            <section className="py-20 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl font-black mb-4">Powerful Capabilities</h2>
                        <p className="text-gray-400">Enterprise-grade features built for educational institutions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <CapabilityItem
                            icon={Zap}
                            title="AI-Powered Lessons"
                            description="Generate comprehensive lesson notes aligned with NERDC and WAEC standards in seconds."
                        />
                        <CapabilityItem
                            icon={ShieldCheck}
                            title="Smart Grading"
                            description="OCR-based paper scanning with instant AI-driven assessment and feedback generation."
                        />
                        <CapabilityItem
                            icon={BarChart3}
                            title="Performance Analytics"
                            description="Real-time dashboards showing student performance trends and predictive insights."
                        />
                        <CapabilityItem
                            icon={Lock}
                            title="Data Security"
                            description="Enterprise-grade security with multi-tenant isolation and complete data privacy."
                        />
                        <CapabilityItem
                            icon={Clock}
                            title="Attendance Tracking"
                            description="Digital attendance system with real-time updates and automated parent notifications."
                        />
                        <CapabilityItem
                            icon={Layers}
                            title="Financial Management"
                            description="Track school finances, manage fees, process payments, and monitor wallet systems."
                        />
                    </div>
                </div>
            </section>

            {/* Integration Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl font-black mb-4">Seamless Integration</h2>
                        <p className="text-gray-400">EduCore integrates with industry-leading services and technologies.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <IntegrationBadge name="Google Gemini AI" description="Advanced AI for lesson planning and content generation" />
                        <IntegrationBadge name="Supabase" description="Secure cloud database for all institutional data" />
                        <IntegrationBadge name="PDF Processing" description="Advanced document scanning and OCR technology" />
                        <IntegrationBadge name="Real-Time Updates" description="WebSocket-based live data synchronization" />
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-4xl font-black mb-4">Trusted by Schools</h2>
                        <p className="text-gray-400">See how schools are transforming education with EduCore.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <TestimonialCard
                            name="Mr. Adebayo Okonkwo"
                            role="School Administrator"
                            school="Excellence Academy Lagos"
                            quote="EduCore has revolutionized how we manage our school. The AI lesson planner alone saves our teachers hours every week."
                        />
                        <TestimonialCard
                            name="Mrs. Chioma Nwankwo"
                            role="Head of Department"
                            school="Grace High School"
                            quote="The smart paper marking feature is incredible. We now give instant feedback to students instead of waiting days."
                        />
                        <TestimonialCard
                            name="Mr. Tunde Johnson"
                            role="Head Teacher"
                            school="Future Leaders Academy"
                            quote="Our parents love the portal. They can see their childrens progress in real-time, which has improved engagement significantly."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-blue-500/10 border border-teal-500/20 rounded-[32px] p-12 md:p-20 text-center">
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Transform Your School?</h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Join 500+ schools using EduCore to revolutionize education management and enhance student outcomes.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-10 py-5 bg-teal-500 hover:bg-teal-400 text-dark-bg text-lg font-black rounded-2xl transition-all shadow-2xl shadow-teal-500/20">
                                Get Started Free
                            </button>
                            <button className="w-full sm:w-auto px-10 py-5 border border-teal-500/30 hover:bg-teal-500/5 text-lg font-bold rounded-2xl transition-all">
                                Schedule Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <PublicFooter />
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description, onClick }: any) => (
    <div onClick={onClick} className="p-8 bg-dark-card border border-white/5 rounded-[32px] hover:border-teal-500/30 transition-all group cursor-pointer hover:shadow-lg hover:shadow-teal-500/10">
        <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Icon className="w-7 h-7 text-teal-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
);

const SolutionCard = ({ icon: Icon, title, description, features, onClick, image }: any) => (
    <div onClick={onClick} className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden hover:border-teal-500/30 transition-all group cursor-pointer">
        <div className="h-48 overflow-hidden bg-dark-bg">
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">{title}</h3>
            </div>
            <p className="text-gray-400 mb-6">{description}</p>
            <div className="space-y-2">
                {features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ProcessStep = ({ number, title, description, icon: Icon }: any) => (
    <div className="text-center">
        <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <Icon className="w-8 h-8 text-dark-bg" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-xs font-black text-dark-bg">{number}</div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
);

const CapabilityItem = ({ icon: Icon, title, description }: any) => (
    <div className="p-6 bg-dark-card border border-white/5 rounded-2xl hover:border-teal-500/30 transition-all group">
        <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-teal-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
);

const IntegrationBadge = ({ name, description }: any) => (
    <div className="p-6 bg-dark-card border border-white/5 rounded-2xl hover:border-teal-500/30 transition-all">
        <div className="text-lg font-bold text-white mb-2">{name}</div>
        <p className="text-gray-400 text-sm">{description}</p>
    </div>
);

const TestimonialCard = ({ name, role, school, quote }: any) => (
    <div className="p-8 bg-dark-card border border-white/5 rounded-[32px]">
        <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
                <span key={i} className="text-teal-400">★</span>
            ))}
        </div>
        <p className="text-gray-300 leading-relaxed mb-6 italic">"{quote}"</p>
        <div>
            <div className="font-bold text-white">{name}</div>
            <div className="text-teal-400 text-sm">{role}</div>
            <div className="text-gray-500 text-sm">{school}</div>
        </div>
    </div>
);
