import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const PublicHeader: React.FC = () => {
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-2xl tracking-tighter cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-dark-bg" />
                    </div>
                    <span>Edu<span className="text-teal-500">Core</span></span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
                    <button onClick={() => navigate('/#features')} className="hover:text-white transition-colors">Features</button>
                    <button onClick={() => navigate('/#solutions')} className="hover:text-white transition-colors">Solutions</button>
                    <button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About</button>
                    <button onClick={() => navigate('/blog')} className="hover:text-white transition-colors">Blog</button>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/login')} className="px-6 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors">Login</button>
                    <button onClick={() => navigate('/login?mode=school-reg')} className="hidden sm:block px-6 py-2.5 bg-teal-500 text-dark-bg text-sm font-bold rounded-full hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20">Register Your School</button>
                </div>
            </div>
        </nav>
    );
};
