
import { useState } from 'react';
import { X, Check, Zap } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export const PaperScanner = () => {
    const [scanned, setScanned] = useState(false);
    const navigate = useNavigate();

    const handleSaveResult = async () => {
        if (!auth.currentUser) {
            alert("Please sign in to save results.");
            return;
        }

        try {
            await addDoc(collection(db, "results"), {
                userId: auth.currentUser.uid,
                studentName: "Chinwe Egbo", // Mock name from UI
                score: 18,
                total: 20,
                feedback: "Excellent grasp of photosynthesis...",
                createdAt: serverTimestamp()
            });
            alert("Result Recorded!");
            navigate('/analytics');
        } catch (e) {
            console.error("Error saving result: ", e);
            alert("Failed to save result.");
        }
    };

    // Initial State: Camera View
    if (!scanned) {
        return (
            <div className="relative h-[80vh] bg-black rounded-3xl overflow-hidden flex flex-col items-center justify-center border border-white/10">
                <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                    <button className="bg-white/10 p-2 rounded-full"><X className="text-white w-6 h-6" /></button>
                    <div className="flex flex-col items-center">
                        <span className="text-white font-bold text-lg">Paper Scanner</span>
                        <span className="text-teal-400 text-[10px] font-bold tracking-widest uppercase">OCR ENGINE ACTIVE</span>
                    </div>
                    <button className="bg-teal-600 px-3 py-1 rounded-full text-white text-sm font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current" /> 12/40
                    </button>
                </div>

                {/* Viewfinder Overlay */}
                <div className="relative w-full max-w-lg aspect-[3/4] border-2 border-teal-500/50 rounded-lg m-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-teal-500 shadow-[0_0_20px_rgba(0,150,136,1)] animate-pulse" />
                    <img
                        src="/placeholder-script.jpg"
                        className="w-full h-full object-cover opacity-50"
                        alt="Camera Feed"
                        onError={(e) => (e.currentTarget.src = "https://placehold.co/600x800/121212/333?text=Camera+Feed")}
                    />
                </div>

                <div className="absolute bottom-10">
                    <button onClick={() => setScanned(true)} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-full"></div>
                    </button>
                </div>
            </div>
        )
    }

    // Results Modal (mimicking the bottom sheet in screenshot)
    return (
        <div className="relative h-screen bg-black/90 flex items-end justify-center p-4">
            <div className="bg-dark-card w-full max-w-lg rounded-3xl p-6 border border-white/10 animate-slide-up">
                {/* Drag handle */}
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6" />

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">AI Assessment</h2>
                        <p className="text-gray-400 text-sm uppercase tracking-wide">STUDENT: CHINWE EGBO</p>
                    </div>
                    <div className="bg-teal-900/30 border border-teal-500/20 px-4 py-3 rounded-xl text-center">
                        <div className="text-teal-500 text-[10px] font-bold uppercase mb-1">SUGGESTED SCORE</div>
                        <div className="text-3xl font-bold text-white">18<span className="text-lg text-gray-500">/20</span></div>
                        <div className="text-teal-400 text-[10px] font-bold">EXCELLENT</div>
                    </div>
                </div>

                <div className="bg-dark-bg border border-white/5 p-5 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 bg-teal-500 rounded-sm"></div>
                        <h3 className="text-gray-300 font-bold text-sm">AI FEEDBACK</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-sm">
                        Excellent grasp of photosynthesis. The student correctly identified the role of chlorophyll and sunlight. Detailed explanation of glucose production.
                    </p>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-3">
                        <span>MISSING KEYWORDS</span>
                        <span className="text-teal-500">BASED ON LESSON PLAN</span>
                    </div>
                    <div className="flex gap-2">
                        {['Stomata', 'Carbon Dioxide', '+ 1 more'].map((tag) => (
                            <span key={tag} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-xs font-bold">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 text-xs text-gray-400 mb-6 bg-dark-bg p-3 rounded-xl border border-white/5">
                    <div>
                        <span className="block font-bold">OCR ACCURACY</span>
                        <span className="text-white text-lg font-bold">98.2%</span>
                    </div>
                    <div className="border-l border-white/10 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                            <span className="uppercase">AI Synced • Local Mode</span>
                        </div>
                        <span className="text-white text-lg font-bold">Legible</span>
                    </div>
                </div>

                <button
                    onClick={handleSaveResult}
                    className="w-full bg-teal-600 hover:bg-teal-500 py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 text-lg"
                >
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-teal-600" />
                    </div>
                    Confirm & Record Grade
                </button>
            </div>
        </div>
    )
};
