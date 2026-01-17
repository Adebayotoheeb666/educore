import React from 'react';
import { PublicLayout } from '../components/common/PublicLayout';
import { Briefcase, MapPin, ArrowRight } from 'lucide-react';

export const Careers: React.FC = () => {
    const roles = [
        {
            title: "Senior Full-Stack Engineer",
            department: "Engineering",
            location: "Remote / Lagos",
            type: "Full-time"
        },
        {
            title: "AI Product Manager",
            department: "Product",
            location: "Remote",
            type: "Full-time"
        },
        {
            title: "Educational Consultant",
            department: "Sales & Support",
            location: "Abuja / Port Harcourt",
            type: "Full-time"
        }
    ];

    return (
        <PublicLayout>
            <div className="pt-40 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center mb-32">
                        <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
                            Build the <br />
                            <span className="text-teal-500">Future of Learning.</span>
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed mb-10">
                            We're a team of engineers, educators, and designers dedicated to solving the
                            toughest problems in school administration. Join us in building the AI
                            operating system for schools worldwide.
                        </p>
                        <div className="flex justify-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                                100% Remote Friendly
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                                Growth Mindset
                            </div>
                        </div>
                    </div>

                    <div className="mb-32">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-3xl font-black">Open Positions</h2>
                            <div className="text-sm font-bold text-teal-400 bg-teal-500/10 px-4 py-2 rounded-full border border-teal-500/20">
                                {roles.length} Roles Active
                            </div>
                        </div>

                        <div className="space-y-4">
                            {roles.map((role, index) => (
                                <div key={index} className="p-8 bg-dark-card border border-white/5 rounded-[32px] hover:border-teal-500/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer">
                                    <div>
                                        <div className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">{role.department}</div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{role.title}</h3>
                                        <div className="flex items-center gap-4 text-gray-500 text-sm">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {role.location}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" />
                                                {role.type}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="bg-white/5 group-hover:bg-teal-500 group-hover:text-dark-bg p-4 rounded-2xl transition-all">
                                        <ArrowRight className="w-6 h-6" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <BenefitItem
                            title="Ownership Culture"
                            description="We believe in small, elite teams where every person owns their outcomes."
                        />
                        <BenefitItem
                            title="Health & Wellness"
                            description="Comprehensive health coverage for you and your immediate family."
                        />
                        <BenefitItem
                            title="Continuous Learning"
                            description="Annual budget for books, courses, and educational conferences."
                        />
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

const BenefitItem = ({ title, description }: any) => (
    <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[40px] hover:border-teal-500/20 transition-all">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
);
