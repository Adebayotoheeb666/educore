import React from 'react';
import { PublicLayout } from '../components/common/PublicLayout';
import { ShieldCheck, Target, Users, Zap, Sparkles } from 'lucide-react';

export const About: React.FC = () => {
    return (
        <PublicLayout>
            <div className="pt-40 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Hero */}
                    <div className="max-w-3xl mb-20 animate-fade-in">
                        <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
                            Modernizing <br />
                            <span className="text-teal-500">Education.</span>
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            EduCore started with a simple belief: school administration shouldn't be a burden.
                            We've built a multi-tenant AI ecosystem that empowers teachers, engages students,
                            and provides parents with unprecedented clarity.
                        </p>
                    </div>

                    {/* Mission/Vision */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
                        <div className="p-10 bg-dark-card border border-white/5 rounded-[40px] hover:border-teal-500/20 transition-all group">
                            <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Target className="w-8 h-8 text-teal-400" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                            <p className="text-gray-400 leading-relaxed">
                                To provide schools across Africa and beyond with elite-level administrative tools
                                powered by artificial intelligence, ensuring every child receives the data-driven
                                support they deserve.
                            </p>
                        </div>
                        <div className="p-10 bg-dark-card border border-white/5 rounded-[40px] hover:border-teal-500/20 transition-all group">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="w-8 h-8 text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                            <p className="text-gray-400 leading-relaxed">
                                A world where educational bureaucracy is automated, allowing educators to focus
                                entirely on what matters most: teaching and inspiring the next generation.
                            </p>
                        </div>
                    </div>

                    {/* Core Values */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">Our Core Values</h2>
                        <p className="text-gray-400">The principles that drive every line of code we write.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ValueItem
                            icon={ShieldCheck}
                            title="Security First"
                            description="Deeply embedded RLS policies and multi-tenant isolation ensure school data remains private."
                        />
                        <ValueItem
                            icon={Users}
                            title="Stakeholder Centric"
                            description="Built with every user in mind—from the tech-savvy admin to the first-time parent user."
                        />
                        <ValueItem
                            icon={Sparkles}
                            title="AI Excellence"
                            description="Leveraging Google Gemini to bring enterprise-level intelligence to classroom management."
                        />
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

const ValueItem = ({ icon: Icon, title, description }: any) => (
    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl text-center">
        <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto">
            <Icon className="w-6 h-6 text-teal-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
);
