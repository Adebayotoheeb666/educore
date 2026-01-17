import React from 'react';
import { PublicLayout } from '../components/common/PublicLayout';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const Contact: React.FC = () => {
    return (
        <PublicLayout>
            <div className="pt-40 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                        <div>
                            <h1 className="text-6xl font-black mb-8">Get in <span className="text-teal-500">touch.</span></h1>
                            <p className="text-xl text-gray-400 leading-relaxed mb-12">
                                Whether you're a school looking to modernize or a partner interested in our technology,
                                we're here to help you transform education.
                            </p>

                            <div className="space-y-8">
                                <ContactInfo
                                    icon={Mail}
                                    label="Email us at"
                                    value="hello@educore.systems"
                                />
                                <ContactInfo
                                    icon={Phone}
                                    label="Call our team"
                                    value="+234 (0) 800 EDU CORE"
                                />
                                <ContactInfo
                                    icon={MapPin}
                                    label="Visit our office"
                                    value="Tech Hub, Victoria Island, Lagos"
                                />
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[40px]">
                            <form className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Full Name</label>
                                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-teal-500/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">School Name</label>
                                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-teal-500/50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Work Email</label>
                                    <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-teal-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">How can we help?</label>
                                    <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-teal-500/50" />
                                </div>
                                <button className="w-full bg-teal-500 text-dark-bg font-black py-5 rounded-2xl hover:bg-teal-400 transition-all flex items-center justify-center gap-3">
                                    <span>Send Message</span>
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

const ContactInfo = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center gap-6 group">
        <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-teal-400" />
        </div>
        <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</div>
            <div className="text-lg font-bold text-white">{value}</div>
        </div>
    </div>
);
