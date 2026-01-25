import { useState } from 'react';
import { z } from 'zod';
import {
    ShoppingBag,
    Search,
    CheckCircle,
    Download,
    AlertCircle,
    Loader
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { sendFeeNotification } from '../../lib/notificationService';

// Stripe Elements
// const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY'; // Will be set via env

// Zod Schema for Payment Validation
const paymentDetailsSchema = z.object({
    studentId: z.string().min(1, "Student is required"),
    selectedFees: z.array(z.string()).min(1, "Please select at least one fee to pay"),
    totalAmount: z.number().positive("Total amount must be greater than zero")
});

interface StudentFee {
    id: string;
    name: string;
    amount: number;
    required: boolean;
}

interface StudentInfo {
    id: string;
    name: string;
    class: string;
    admissionNo: string;
    email?: string;
}

export const PayForStudents = () => {
    const { schoolId, profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [step, setStep] = useState(1); // 1: Search, 2: Select Fees, 3: Payment, 4: Success
    const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
    const [selectedFees, setSelectedFees] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<StudentInfo[]>([]);

    // Available fees (would be fetched from database in production)
    const availableFees: StudentFee[] = [
        { id: 'tuition-term1', name: 'Tuition Fee (1st Term)', amount: 150000, required: true },
        { id: 'uniform', name: 'School Uniform Set', amount: 25000, required: false },
        { id: 'books', name: 'Textbooks & Materials', amount: 45000, required: true },
        { id: 'transport', name: 'School Bus (Monthly)', amount: 20000, required: false },
        { id: 'sport-wear', name: 'Sport Wear', amount: 10000, required: false },
    ];

    // Search for student
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.length < 2) {
            setError('Please enter at least 2 characters');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: queryError } = await supabase
                .from('users')
                .select('id, full_name, admission_number')
                .eq('school_id', schoolId)
                .eq('role', 'student')
                .or(`admission_number.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                .limit(10);

            if (queryError) throw queryError;

            if (!data || data.length === 0) {
                setError('No students found');
                setSearchResults([]);
                return;
            }

            // Format results (in production, would fetch class info)
            const results: StudentInfo[] = data.map(student => ({
                id: student.id,
                name: student.full_name,
                class: 'Class N/A', // Would fetch from student_classes
                admissionNo: student.admission_number,
            }));

            setSearchResults(results);
            if (results.length === 1) {
                setSelectedStudent(results[0]);
                setStep(2);
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to search students');
        } finally {
            setLoading(false);
        }
    };

    // Select student from results
    const selectStudent = (student: StudentInfo) => {
        setSelectedStudent(student);
        setSearchQuery('');
        setSearchResults([]);
        setStep(2);
        setError(null);
    };

    // Toggle fee selection
    const toggleFee = (feeId: string) => {
        if (selectedFees.includes(feeId)) {
            setSelectedFees(selectedFees.filter(id => id !== feeId));
        } else {
            setSelectedFees([...selectedFees, feeId]);
        }
        setError(null);
    };

    // Calculate total amount
    const totalAmount = availableFees
        .filter(fee => selectedFees.includes(fee.id))
        .reduce((sum, fee) => sum + fee.amount, 0);

    // Proceed to payment
    const handleProceedToPayment = () => {
        const validationResult = paymentDetailsSchema.safeParse({
            studentId: selectedStudent?.id,
            selectedFees: selectedFees,
            totalAmount: totalAmount
        });

        if (!validationResult.success) {
            setError(validationResult.error.issues[0].message);
            return;
        }

        setStep(3);
        setError(null);
    };

    // Process payment with Stripe
    const handlePayment = async () => {
        if (!selectedStudent || totalAmount <= 0) {
            setError('Invalid payment details');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get user's session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Session expired. Please login again.');
                return;
            }

            // Step 1: Create payment intent via edge function
            const createIntentResponse = await supabase.functions.invoke('create-payment-intent', {
                body: {
                    amount: totalAmount * 100, // Convert to kobo
                    currency: 'ngn',
                    studentId: selectedStudent.id,
                    studentName: selectedStudent.name,
                    schoolId: schoolId,
                    schoolName: profile?.schoolId || 'School',
                    feeDescription: `School Fees - ${selectedFees.map(id => availableFees.find(f => f.id === id)?.name).join(', ')}`,
                    metadata: {
                        studentAdmissionNumber: selectedStudent.admissionNo,
                        feeIds: selectedFees.join(','),
                    },
                },
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (createIntentResponse.error) {
                throw new Error(createIntentResponse.error.message);
            }

            const { paymentIntentId } = createIntentResponse.data;

            // Step 2: Initialize Stripe (would use @stripe/react-stripe-js in production)
            // For now, we'll store the payment intent and show instructions

            // Step 3: Record transaction in database
            const { error: insertError } = await supabase
                .from('financial_transactions')
                .insert({
                    school_id: schoolId,
                    student_id: selectedStudent.id,
                    type: 'fee-payment',
                    amount: totalAmount,
                    reference: paymentIntentId,
                    payment_method: 'card',
                    description: `School Fees - ${selectedFees.length} item(s)`,
                    status: 'pending',
                });

            if (insertError) throw insertError;

            // Step 4: Send notification to parent (if available)
            const { data: parentLinks } = await supabase
                .from('parent_student_links')
                .select('parent_id')
                .eq('student_id', selectedStudent.id)
                .limit(1); // Get first parent link

            if (parentLinks && parentLinks.length > 0) {
                const parentId = parentLinks[0].parent_id;
                const { data: parentProfile } = await supabase
                    .from('users')
                    .select('email, full_name')
                    .eq('id', parentId)
                    .single();

                if (parentProfile?.email) {
                    await sendFeeNotification(
                        schoolId || '',
                        selectedStudent.id,
                        selectedStudent.name,
                        parentProfile.email,
                        parentProfile.full_name,
                        totalAmount,
                        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
                        profile?.schoolId ? profile.schoolId.toString() : undefined
                    );
                }
            }

            // Step 5: In production, redirect to Stripe checkout
            // For now, show success with payment instructions
            setStep(4);

        } catch (err) {
            console.error('Payment error:', err);
            setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Format currency
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
                <h1 className="text-3xl font-bold text-white mb-2">Pay School Fees</h1>
                <p className="text-gray-400">Secure online payment for school fees</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-200">{error}</p>
                </div>
            )}

            <div className="bg-dark-card border border-white/5 rounded-[32px] p-8 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 relative z-10">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-teal-500 text-dark-bg' : 'bg-white/10 text-gray-500'
                                }`}>
                                {s}
                            </div>
                            <span className={`text-sm font-medium hidden md:block ${step >= s ? 'text-white' : 'text-gray-500'
                                }`}>
                                {s === 1 ? 'Select' : s === 2 ? 'Fees' : s === 3 ? 'Payment' : 'Done'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Search Student */}
                {step === 1 && (
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Find Student</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full bg-dark-bg border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                                    placeholder="Enter admission number or student name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="bg-dark-bg rounded-xl border border-white/10 p-4 space-y-2">
                                {searchResults.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => selectStudent(student)}
                                        className="w-full text-left p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <p className="font-semibold text-white">{student.name}</p>
                                        <p className="text-sm text-gray-400">{student.admissionNo}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-500 text-dark-bg font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                            Continue
                        </button>
                    </form>
                )}

                {/* Step 2: Select Fees */}
                {step === 2 && selectedStudent && (
                    <div className="space-y-6">
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-1">Selected Student</p>
                            <p className="text-xl font-bold text-white">{selectedStudent.name}</p>
                            <p className="text-sm text-gray-400">{selectedStudent.admissionNo}</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Fees to Pay</label>
                            {availableFees.map((fee) => (
                                <div
                                    key={fee.id}
                                    onClick={() => toggleFee(fee.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedFees.includes(fee.id)
                                        ? 'border-teal-500 bg-teal-500/10'
                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">{fee.name}</p>
                                            {fee.required && <p className="text-xs text-red-400 mt-1">Required</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-white">{formatCurrency(fee.amount)}</p>
                                            <div className={`w-5 h-5 rounded border-2 mt-2 flex items-center justify-center transition-all ${selectedFees.includes(fee.id)
                                                ? 'bg-teal-500 border-teal-500'
                                                : 'border-white/20'
                                                }`}>
                                                {selectedFees.includes(fee.id) && <CheckCircle className="w-5 h-5 text-dark-bg" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedFees.length > 0 && (
                            <div className="bg-teal-500/10 border border-teal-500/50 rounded-xl p-4">
                                <p className="text-sm text-gray-300 mb-2">Total Amount Due</p>
                                <p className="text-3xl font-bold text-teal-400">{formatCurrency(totalAmount)}</p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setSelectedStudent(null);
                                    setSelectedFees([]);
                                }}
                                className="flex-1 bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleProceedToPayment}
                                disabled={selectedFees.length === 0}
                                className="flex-1 bg-teal-500 text-dark-bg font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Proceed to Payment
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && selectedStudent && (
                    <div className="space-y-6">
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-3">Order Summary</p>
                            <div className="space-y-2 pb-4 border-b border-white/10">
                                <p className="text-white"><span className="text-gray-400">Student:</span> {selectedStudent.name}</p>
                                <p className="text-white"><span className="text-gray-400">Items:</span> {selectedFees.length} fee(s)</p>
                                <p className="text-white"><span className="text-gray-400">Amount:</span> {formatCurrency(totalAmount)}</p>
                            </div>
                            <div className="pt-4">
                                <p className="text-2xl font-bold text-teal-400">{formatCurrency(totalAmount)}</p>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-200">You will be redirected to Stripe to complete the payment securely.</p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="flex-1 bg-teal-500 text-dark-bg font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                                Pay {formatCurrency(totalAmount)}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full mx-auto flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Payment Request Submitted</h2>
                            <p className="text-gray-400">Your payment request has been created and sent to Stripe for processing. You will receive a confirmation email shortly.</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-sm text-gray-400 mb-2">Student</p>
                            <p className="font-bold text-white">{selectedStudent?.name}</p>
                            <p className="text-2xl font-bold text-teal-400 mt-4">{formatCurrency(totalAmount)}</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setSelectedStudent(null);
                                    setSelectedFees([]);
                                    setSearchQuery('');
                                }}
                                className="flex-1 bg-teal-500 text-dark-bg font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors"
                            >
                                Make Another Payment
                            </button>
                            <button
                                onClick={() => window.location.href = '/admin/dashboard'}
                                className="flex-1 bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download Receipt
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
