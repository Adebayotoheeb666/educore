import { useState } from 'react';
import { z } from 'zod';
import {
    ShoppingBag,
    Search,
    CheckCircle,
    Share2,
    Download,
    AlertCircle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Zod Schema for Payment Validation
const paymentDetailsSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    selectedFees: z.array(z.string()).min(1, "Please select at least one fee to pay"),
    totalAmount: z.number().positive("Total amount must be greater than zero")
});

export const PayForStudents = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [step, setStep] = useState(1); // 1: Search, 2: Select Fees, 3: Success
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedFees, setSelectedFees] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Mock Fees Data
    const availableFees = [
        { id: 'tuition-term1', name: 'Tuition Fee (1st Term)', amount: 150000, required: true },
        { id: 'uniform', name: 'School Uniform Set', amount: 25000, required: false },
        { id: 'books', name: 'Textbooks & Materials', amount: 45000, required: true },
        { id: 'transport', name: 'School Bus (Monthly)', amount: 20000, required: false },
        { id: 'sport-wear', name: 'Sport Wear', amount: 10000, required: false },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.length > 2) {
            setSelectedStudent({
                id: 'student-123',
                name: 'John Doe',
                class: 'SS2 Science',
                admissionNo: 'EDU/2023/042'
            });
            setStep(2);
            setError(null);
        }
    };

    const toggleFee = (feeId: string) => {
        if (selectedFees.includes(feeId)) {
            setSelectedFees(selectedFees.filter(id => id !== feeId));
        } else {
            setSelectedFees([...selectedFees, feeId]);
        }
        setError(null);
    };

    const totalAmount = availableFees
        .filter(fee => selectedFees.includes(fee.id))
        .reduce((sum, fee) => sum + fee.amount, 0);

    const handlePayment = async () => {
        setError(null);

        // Validate with Zod
        const validationResult = paymentDetailsSchema.safeParse({
            studentId: selectedStudent?.id,
            selectedFees: selectedFees,
            totalAmount: totalAmount
        });

        if (!validationResult.success) {
            setError(validationResult.error.issues[0].message);
            return;
        }

        try {
            await addDoc(collection(db, "financial_transactions"), {
                amount: totalAmount,
                type: 'income',
                category: 'School Fees',
                description: `Fees payment for ${selectedStudent.name}`,
                items: selectedFees,
                date: serverTimestamp(),
                status: 'completed',
                studentId: selectedStudent.id
            });
            setStep(3);
        } catch (err) {
            console.error(err);
            alert("Payment failed");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto pb-20">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-teal-500/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-teal-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Pay Fees</h1>
                <p className="text-gray-400">Process school fee payments for students</p>
            </div>

            <div className="bg-dark-card border border-white/5 rounded-[32px] p-8 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 relative z-10">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-teal-500 text-dark-bg' : 'bg-white/10 text-gray-500'
                                }`}>
                                {s}
                            </div>
                            <span className={`text-sm font-medium hidden md:block ${step >= s ? 'text-white' : 'text-gray-500'
                                }`}>
                                {s === 1 ? 'Select Student' : s === 2 ? 'Choose Items' : 'Confirmation'}
                            </span>
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Find Student</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full bg-dark-bg border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                                    placeholder="Enter admission number (e.g. EDU/2023/...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-teal-500 text-dark-bg font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors">
                            Continue
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="space-y-8">
                        <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold">{selectedStudent.name}</h3>
                                <p className="text-sm text-gray-400">{selectedStudent.admissionNo}</p>
                            </div>
                            <span className="text-teal-400 font-bold">{selectedStudent.class}</span>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {availableFees.map((fee) => (
                                <label key={fee.id} className={`block p-4 rounded-xl border cursor-pointer transition-all ${selectedFees.includes(fee.id)
                                    ? 'bg-teal-500/10 border-teal-500/50'
                                    : 'bg-dark-bg border-white/5 hover:bg-white/5'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedFees.includes(fee.id)
                                                ? 'bg-teal-500 border-teal-500'
                                                : 'border-gray-500'
                                                }`}>
                                                {selectedFees.includes(fee.id) && <CheckCircle className="w-4 h-4 text-dark-bg" />}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{fee.name}</p>
                                                {fee.required && <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Required</span>}
                                            </div>
                                        </div>
                                        <span className="text-gray-300 font-bold">{formatCurrency(fee.amount)}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedFees.includes(fee.id)}
                                        onChange={() => toggleFee(fee.id)}
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-gray-400 font-medium">Total Amount</span>
                                <span className="text-3xl font-bold text-white">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setStep(1)} className="py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={handlePayment}
                                    className="bg-teal-500 text-dark-bg font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors"
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                        <p className="text-gray-400 max-w-sm mx-auto mb-8">
                            We've processed the payment of <span className="text-white font-bold">{formatCurrency(totalAmount)}</span> for <span className="text-white font-bold">{selectedStudent.name}</span>.
                        </p>

                        <div className="flex flex-col gap-3 max-w-xs mx-auto">
                            <button className="flex items-center justify-center gap-2 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors">
                                <Download className="w-4 h-4" />
                                Download Receipt
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-transparent text-gray-400 font-bold py-3 rounded-xl hover:text-white transition-colors">
                                <Share2 className="w-4 h-4" />
                                Share Receipt
                            </button>
                            <button onClick={() => { setStep(1); setSearchQuery(''); setSelectedStudent(null); setSelectedFees([]); }} className="mt-4 text-teal-400 hover:text-teal-300 font-bold">
                                Process New Payment
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
