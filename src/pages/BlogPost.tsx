import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/common/PublicLayout';
import { Calendar, Clock, ArrowLeft, Share2, Twitter, Linkedin, Facebook } from 'lucide-react';

interface PostContent {
    title: string;
    date: string;
    readTime: string;
    category: string;
    image: string;
    content: React.ReactNode;
}

const BLOG_POSTS: Record<string, PostContent> = {
    'ai-nigerian-education': {
        title: "The Impact of AI on Nigerian Secondary Education",
        date: "Jan 15, 2026",
        readTime: "6 min read",
        category: "AI & Education",
        image: "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg",
        content: (
            <div className="space-y-6">
                <p className="text-xl text-gray-300 leading-relaxed italic border-l-4 border-teal-500 pl-6 py-2">
                    "Artificial Intelligence is not here to replace Nigerian teachers, but to give them the superpower of time."
                </p>
                <p>
                    Secondary education in Nigeria has long been characterized by overcrowded classrooms and overworked educators.
                    The administrative burden of manual lesson planning, grading hundreds of scripts, and tracking attendance
                    leaves little room for personalized student mentorship.
                </p>
                <h2 className="text-3xl font-bold text-white mt-12 mb-6">The Lesson Planning Revolution</h2>
                <p>
                    With the integration of Google Gemini Pro into the EduCore ecosystem, teachers can now generate
                    NERDC-aligned lesson plans in under 30 seconds. By providing context like "SS2 Mathematics,
                    Calculus introduction, focus on Nigerian curriculum standards," the AI produces a detailed
                    breakdown including objectives, instructional materials, and even class activities.
                </p>
                <p>
                    Early data from our pilot schools in Lagos and Abuja shows that teachers are saving an average
                    of **15 hours per week** on administrative tasks. This time is being redirected into
                    one-on-one student support and professional development.
                </p>
                <h2 className="text-3xl font-bold text-white mt-12 mb-6">Bridging the Resource Gap</h2>
                <p>
                    Beyond administration, AI acts as a leveling force. Students in rural areas can now access
                    the same high-quality "AI Study Assistant" as students in elite private institutions,
                    providing them with instant feedback on complex subjects like Physics and Further Mathematics.
                </p>
            </div>
        )
    },
    'securing-student-data': {
        title: "Securing Student Data in a Multi-Tenant World",
        date: "Jan 10, 2026",
        readTime: "8 min read",
        category: "Security",
        image: "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg",
        content: (
            <div className="space-y-6">
                <p>
                    In a SaaS environment where multiple schools share the same database, "leakage" is the ultimate
                    security nightmare. At EduCore, we treat data isolation not as a feature, but as a foundational
                    human right for every student.
                </p>
                <h2 className="text-3xl font-bold text-white mt-12 mb-6">The Power of Row Level Security (RLS)</h2>
                <p>
                    Unlike traditional applications that rely on application-level filtering (which is prone to
                    developer error), EduCore utilizes PostgreSQL **Row Level Security** at the database layer.
                    This ensures that every query, regardless of where it originates in the frontend, is
                    automatically scoped to the authenticated user's `school_id`.
                </p>
                <div className="bg-dark-card border border-white/5 p-8 rounded-3xl my-8">
                    <h4 className="text-teal-400 font-bold mb-4 uppercase tracking-widest text-xs">Technical Insight</h4>
                    <p className="text-sm text-gray-400">
                        Our security audit results show that 100% of our academic and financial tables are protected
                        by RLS policies. Even if a malicious actor obtained an API key, they could only ever see
                        data they are explicitly authorized to access within their specific school context.
                    </p>
                </div>
                <h2 className="text-3xl font-bold text-white mt-12 mb-6">Zero-Trust Staff Onboarding</h2>
                <p>
                    Our new secure staff invite flow removes the risk of "shadow users." Admins create restricted
                    invites that must be accepted via a verified school email, ensuring that only authorized
                    personnel can ever view sensitive student records or financial data.
                </p>
            </div>
        )
    },
    'educore-v2-gemini': {
        title: "EduCore v2.0: Integrating Google Gemini Pro",
        date: "Jan 05, 2026",
        readTime: "5 min read",
        category: "Product Update",
        image: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg",
        content: (
            <div className="space-y-6">
                <p className="text-xl text-gray-300">
                    We are thrilled to announce the official release of **EduCore v2.0**, featuring our
                    deepest integration of Artificial Intelligence to date.
                </p>
                <h2 className="text-3xl font-bold text-white mt-12 mb-6">A Smarter Exam Builder</h2>
                <p>
                    The Exam Builder has been completely reimagined. Now, teachers can upload their past
                    question papers, and the AI will analyze the difficulty distribution, check for
                    compliance with WAEC patterns, and even suggest "Smart Alternatives" for questions
                    that are statistically underperforming.
                </p>
                <h2 className="text-3xl font-bold text-white mt-12 mb-6">Real-Time Performance Insight</h2>
                <p>
                    Parents now have access to "AI Insights" in their portal. Instead of just seeing
                    a 65% in Biology, the AI provides a natural-language summary: *"Chidi is excelling
                    in Genetics but struggling with Cell Division. We recommend focusing on chapters 4-6
                    this weekend."*
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
                    <div className="p-6 bg-teal-500/5 border border-teal-500/20 rounded-2xl">
                        <div className="font-bold text-teal-400 mb-2">15 RPM Cap</div>
                        <p className="text-sm text-gray-400">Distributed DB rate limiting ensures stability.</p>
                    </div>
                    <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                        <div className="font-bold text-blue-400 mb-2">Edge Optimized</div>
                        <p className="text-sm text-gray-400">Deployed via Supabase Edge Functions for zero latency.</p>
                    </div>
                </div>
            </div>
        )
    }
};

export const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const post = slug ? BLOG_POSTS[slug] : null;

    if (!post) {
        return (
            <PublicLayout>
                <div className="pt-40 pb-40 text-center">
                    <h1 className="text-4xl font-black mb-4">Post Not Found</h1>
                    <button onClick={() => navigate('/blog')} className="text-teal-500 font-bold hover:underline">
                        Back to Blog
                    </button>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <div className="pt-40 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    {/* Breadcrumbs / Back */}
                    <button
                        onClick={() => navigate('/blog')}
                        className="flex items-center gap-2 text-gray-500 hover:text-teal-400 transition-colors mb-12 font-bold uppercase tracking-widest text-xs group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Insights
                    </button>

                    {/* Header */}
                    <div className="mb-12">
                        <div className="bg-teal-500 text-dark-bg text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block mb-6">
                            {post.category}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-8 leading-[1.1]">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-8 text-gray-500 text-sm border-b border-white/5 pb-8">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{post.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{post.readTime}</span>
                            </div>
                            <div className="flex items-center gap-4 ml-auto">
                                <span className="text-xs uppercase tracking-widest font-black">Share:</span>
                                <div className="flex gap-3">
                                    <button className="hover:text-teal-400 transition-colors"><Twitter className="w-4 h-4" /></button>
                                    <button className="hover:text-teal-400 transition-colors"><Linkedin className="w-4 h-4" /></button>
                                    <button className="hover:text-teal-400 transition-colors"><Facebook className="w-4 h-4" /></button>
                                    <button className="hover:text-teal-400 transition-colors"><Share2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature Image */}
                    <div className="aspect-[21/9] rounded-[40px] overflow-hidden mb-16 border border-white/5">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover opacity-80" />
                    </div>

                    {/* Content */}
                    <article className="prose prose-invert prose-teal max-w-none text-gray-400 text-lg leading-relaxed">
                        {post.content}
                    </article>

                    {/* Newsletter Footer */}
                    <div className="mt-24 p-12 bg-dark-card border border-white/5 rounded-[40px] relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-md">
                                <h3 className="text-2xl font-black text-white mb-2">Never miss an update.</h3>
                                <p className="text-gray-500">Subscribe to get our latest insights on AI and education delivered to your inbox.</p>
                            </div>
                            <div className="flex w-full md:w-auto gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter email"
                                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-teal-500/50"
                                />
                                <button className="bg-white text-dark-bg font-black px-8 py-4 rounded-2xl hover:bg-teal-400 transition-colors">
                                    Join
                                </button>
                            </div>
                        </div>
                        {/* Decorative Gradient */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full" />
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};
