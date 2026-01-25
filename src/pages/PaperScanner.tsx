import { useState } from 'react';
import { X, Check, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../lib/gemini';
import { useAuth } from '../hooks/useAuth';


interface GradingData {
    score: number;
    total: number;
    feedback: string;
    missingKeywords: string[];
    ocrAccuracy: number;
}

export const PaperScanner = () => {
    const { schoolId, user } = useAuth();
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
        if (!user || !schoolId) {
            alert("Please sign in to save results.");
            return;
        }

        if (!grading || !studentName.trim()) {
            alert("Please enter student name.");
            return;
        }

        try {
            const aiScanData = {
                school_id: schoolId,
                student_name: studentName.trim(),
                teacher_id: user.id,
                score: grading.score,
                total: grading.total,
                feedback: grading.feedback,
                missing_keywords: grading.missingKeywords,
                ocr_accuracy: grading.ocrAccuracy,
                created_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase
                .from('ai_scan_results')
                .insert(aiScanData);

            if (insertError) throw insertError;

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

    // Results Modal
    if (!grading) {
        return null;
    }

    const percentage = (grading.score / grading.total) * 100;
    let gradeLabel = 'F';
    let gradeColor = 'bg-red-500';

    if (percentage >= 70) { gradeLabel = 'A'; gradeColor = 'bg-teal-500'; }
    else if (percentage >= 60) { gradeLabel = 'B'; gradeColor = 'bg-blue-500'; }
    else if (percentage >= 50) { gradeLabel = 'C'; gradeColor = 'bg-yellow-500'; }
    else if (percentage >= 45) { gradeLabel = 'D'; gradeColor = 'bg-orange-500'; }
    else if (percentage >= 40) { gradeLabel = 'E'; gradeColor = 'bg-orange-600'; }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">Assessment Results</h1>
                <button
                    onClick={() => {
                        setScanned(false);
                        setImagePreview('');
                        setGrading(null);
                        setStudentName('');
                    }}
                    className="text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </header>

            {/* Score Card */}
            <div className="bg-gradient-to-br from-teal-600/20 to-dark-card border border-teal-500/30 rounded-3xl p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">AI Assessment</h2>
                        <p className="text-gray-400 text-sm uppercase tracking-wide">STUDENT: {studentName}</p>
                    </div>
                    <div className={`${gradeColor} text-white px-6 py-4 rounded-xl text-center`}>
                        <div className="text-white text-[10px] font-bold uppercase mb-1">GRADE</div>
                        <div className="text-4xl font-bold">{gradeLabel}</div>
                        <div className="text-white text-[10px] font-bold mt-1">{percentage.toFixed(0)}%</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-dark-bg border border-white/5 p-4 rounded-2xl text-center">
                        <div className="text-teal-400 text-[10px] font-bold uppercase mb-1">SCORE</div>
                        <div className="text-2xl font-bold text-white">{grading.score}/{grading.total}</div>
                    </div>
                    <div className="bg-dark-bg border border-white/5 p-4 rounded-2xl text-center">
                        <div className="text-teal-400 text-[10px] font-bold uppercase mb-1">OCR ACCURACY</div>
                        <div className="text-2xl font-bold text-white">{grading.ocrAccuracy}%</div>
                    </div>
                    <div className="bg-dark-bg border border-white/5 p-4 rounded-2xl text-center">
                        <div className="text-teal-400 text-[10px] font-bold uppercase mb-1">STATUS</div>
                        <div className="text-sm font-bold text-white">Legible</div>
                    </div>
                </div>
            </div>

            {/* AI Feedback */}
            <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 bg-teal-500 rounded-sm"></div>
                    <h3 className="text-gray-300 font-bold text-sm">AI FEEDBACK</h3>
                </div>
                <p className="text-gray-300 leading-relaxed text-sm">
                    {grading.feedback}
                </p>
            </div>

            {/* Missing Keywords */}
            {grading.missingKeywords.length > 0 && (
                <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-4">
                        <span>Missing Keywords</span>
                        <span className="text-red-500">BASED ON MARKING SCHEME</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {grading.missingKeywords.slice(0, 5).map((keyword, idx) => (
                            <span key={`keyword-${keyword}`} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-xs font-bold">
                                {keyword}
                            </span>
                        ))}
                        {grading.missingKeywords.length > 5 && (
                            <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-xs font-bold">
                                +{grading.missingKeywords.length - 5} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Script Image */}
            {imagePreview && (
                <div className="bg-dark-card border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-4">Student Script</h3>
                    <img
                        src={imagePreview}
                        alt="Graded script"
                        className="w-full max-h-72 object-contain rounded-xl border border-white/10"
                    />
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={() => {
                        setScanned(false);
                        setImagePreview('');
                        setGrading(null);
                        setStudentName('');
                    }}
                    className="flex-1 bg-dark-card border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl py-3 transition-colors"
                >
                    Scan Another
                </button>
                <button
                    onClick={handleSaveResult}
                    className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
                >
                    <Check className="w-5 h-5" />
                    Save & Record Grade
                </button>
            </div>
        </div>
    )
};
