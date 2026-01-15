import { useState } from 'react';
import { X, Check, Zap, Upload, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../lib/gemini';

interface GradingData {
    score: number;
    total: number;
    feedback: string;
    missingKeywords: string[];
    ocrAccuracy: number;
}

export const PaperScanner = () => {
    const [scanned, setScanned] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [grading, setGrading] = useState<GradingData | null>(null);
    const [studentName, setStudentName] = useState('');
    const [markingScheme, setMarkingScheme] = useState('Standard marking scheme for secondary school exam');
    const navigate = useNavigate();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        setLoading(true);

        try {
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target?.result as string;
                setImagePreview(imageData);
                processImage(imageData);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('Failed to load image. Please try again.');
            setLoading(false);
        }
    };

    const processImage = async (imageBase64: string) => {
        try {
            // Extract base64 data without the data URL prefix
            const base64Data = imageBase64.split(',')[1] || imageBase64;

            const result = await geminiService.gradeScript(base64Data, markingScheme);
            setGrading(result);
            setScanned(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to grade script');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveResult = async () => {
        if (!auth.currentUser) {
            alert("Please sign in to save results.");
            return;
        }

        if (!grading || !studentName.trim()) {
            alert("Please enter student name.");
            return;
        }

        try {
            await addDoc(collection(db, "results"), {
                userId: auth.currentUser.uid,
                studentName: studentName,
                score: grading.score,
                total: grading.total,
                feedback: grading.feedback,
                missingKeywords: grading.missingKeywords,
                ocrAccuracy: grading.ocrAccuracy,
                createdAt: serverTimestamp()
            });
            alert("Result Recorded!");
            navigate('/analytics');
        } catch (e) {
            console.error("Error saving result: ", e);
            alert("Failed to save result.");
        }
    };

    // Initial State: Upload View
    if (!scanned) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <header className="flex items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-white">Paper Scanner & Grader</h1>
                    <span className="bg-teal-500/20 text-teal-400 text-xs font-bold px-3 py-1 rounded-full">OCR ENGINE ACTIVE</span>
                </header>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-red-400 font-bold">Error</h3>
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Image Upload Section */}
                <div className="bg-dark-card border border-white/5 rounded-3xl p-8">
                    <h2 className="text-xl font-bold text-white mb-6">Upload Student Script</h2>

                    {/* Image Preview */}
                    {imagePreview ? (
                        <div className="mb-6">
                            <img
                                src={imagePreview}
                                alt="Student script preview"
                                className="w-full max-h-96 object-contain rounded-2xl border border-white/10"
                            />
                            <button
                                onClick={() => {
                                    setImagePreview('');
                                    setScanned(false);
                                    setGrading(null);
                                }}
                                className="mt-4 text-teal-400 hover:text-teal-300 text-sm font-bold"
                            >
                                Change Image
                            </button>
                        </div>
                    ) : (
                        <label className="border border-dashed border-teal-500/30 bg-teal-500/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-teal-500/10 transition-colors mb-6">
                            <div className="w-16 h-16 bg-teal-900/50 rounded-full flex items-center justify-center mb-4 text-teal-400 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-1">Upload Script Image</h3>
                            <p className="text-gray-500 text-sm mb-6">JPG, PNG, or WEBP (MAX 10MB)</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={loading}
                                className="hidden"
                            />
                            <button className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50">
                                {loading ? 'Processing...' : 'Select Image'}
                            </button>
                        </label>
                    )}

                    {/* Student Name Input */}
                    <div className="mb-6">
                        <label className="text-gray-400 text-xs font-bold block mb-2">Student Name</label>
                        <input
                            type="text"
                            placeholder="Enter student name"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:border-teal-500/50 outline-none"
                        />
                    </div>

                    {/* Marking Scheme */}
                    <div className="mb-6">
                        <label className="text-gray-400 text-xs font-bold block mb-2">Marking Scheme (Optional)</label>
                        <textarea
                            placeholder="Paste marking scheme or leave default..."
                            value={markingScheme}
                            onChange={(e) => setMarkingScheme(e.target.value)}
                            className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 focus:border-teal-500/50 outline-none resize-none h-24"
                        />
                    </div>

                    {/* Processing indicator */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mr-3" />
                            <span className="text-teal-400 font-bold">Analyzing script with Gemini AI...</span>
                        </div>
                    )}
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
