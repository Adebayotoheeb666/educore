import React from 'react';
import { PublicLayout } from '../components/common/PublicLayout';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Blog: React.FC = () => {
    const posts = [
        {
            title: "The Impact of AI on Nigerian Secondary Education",
            excerpt: "How automated lesson planning is saving teachers 15+ hours a week.",
            date: "Jan 15, 2026",
            readTime: "6 min read",
            category: "AI & Education",
            image: "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg",
            slug: "ai-nigerian-education"
        },
        {
            title: "Securing Student Data in a Multi-Tenant World",
            excerpt: "A deep dive into our Row Level Security implementation and data isolation strategies.",
            date: "Jan 10, 2026",
            readTime: "8 min read",
            category: "Security",
            image: "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg",
            slug: "securing-student-data"
        },
        {
            title: "EduCore v2.0: Integrating Google Gemini Pro",
            excerpt: "Bringing world-class intelligence to paper marks and performance analysis.",
            date: "Jan 05, 2026",
            readTime: "5 min read",
            category: "Product Update",
            image: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg",
            slug: "educore-v2-gemini"
        }
    ];

    return (
        <PublicLayout>
            <div className="pt-40 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h1 className="text-5xl font-black mb-6">EduCore <span className="text-teal-500">Insights</span></h1>
                        <p className="text-xl text-gray-400">Exploring the intersection of modern technology and African education.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        {posts.map((post, index) => (
                            <Link key={index} to={`/blog/${post.slug}`} className="group cursor-pointer">
                                <div className="relative aspect-[16/10] rounded-3xl overflow-hidden mb-6 border border-white/5 bg-dark-card transition-all group-hover:border-teal-500/30">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-teal-500 text-dark-bg text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                        {post.category}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-gray-500 text-xs mb-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{post.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{post.readTime}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">{post.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">{post.excerpt}</p>
                                <div className="flex items-center gap-2 text-teal-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                                    Read Article <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="p-12 bg-gradient-to-br from-teal-500/10 to-blue-500/5 border border-teal-500/20 rounded-[40px] text-center">
                        <h2 className="text-3xl font-black mb-4">Stay ahead of the curve.</h2>
                        <p className="text-gray-400 mb-8">Join 500+ school administrators receiving our weekly edtech insights.</p>
                        <div className="max-w-md mx-auto flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your work email"
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-teal-500/50"
                            />
                            <button className="bg-teal-500 text-dark-bg font-black px-8 py-4 rounded-2xl hover:bg-teal-400 transition-colors">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};
