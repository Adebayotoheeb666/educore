import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const PublicFooter: React.FC = () => {
    const navigate = useNavigate();

    return (
        <footer className="py-20 bg-black/40 border-t border-white/5 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div>
                        <div className="flex items-center gap-2 font-black text-xl tracking-tighter mb-4 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-dark-bg" />
                            </div>
                            <span>EduCore</span>
                        </div>
                        <p className="text-gray-500 text-sm">The future of school administration, powered by AI.</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-sm">Features</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button onClick={() => navigate('/lessons')} className="hover:text-white transition-colors text-left">Lesson Planner</button></li>
                            <li><button onClick={() => navigate('/marking')} className="hover:text-white transition-colors text-left">Paper Scanner</button></li>
                            <li><button onClick={() => navigate('/exams')} className="hover:text-white transition-colors text-left">Exam Builder</button></li>
                            <li><button onClick={() => navigate('/analytics')} className="hover:text-white transition-colors text-left">Analytics</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-sm">Portals</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button onClick={() => navigate('/admin')} className="hover:text-white transition-colors text-left">Admin Dashboard</button></li>
                            <li><button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors text-left">Teacher Dashboard</button></li>
                            <li><button onClick={() => navigate('/portal')} className="hover:text-white transition-colors text-left">Student Portal</button></li>
                            <li><button onClick={() => navigate('/portal/parent')} className="hover:text-white transition-colors text-left">Parent Portal</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-sm">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors text-left">About Us</button></li>
                            <li><button onClick={() => navigate('/blog')} className="hover:text-white transition-colors text-left">Blog</button></li>
                            <li><button onClick={() => navigate('/contact')} className="hover:text-white transition-colors text-left">Contact</button></li>
                            <li><button onClick={() => navigate('/careers')} className="hover:text-white transition-colors text-left">Careers</button></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-gray-500 text-sm">© 2026 EduCore Systems. All rights reserved. Built for the future of education.</div>
                    <div className="flex items-center gap-6">
                        <button className="text-gray-400 hover:text-white transition-colors text-sm">Privacy</button>
                        <button className="text-gray-400 hover:text-white transition-colors text-sm">Terms</button>
                    </div>
                </div>
            </div>
        </footer>
    );
};
