
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CreditCard,
    Search,
    Wallet,
    AlertCircle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { logAction } from '../../lib/auditService';

// Zod Schema
const fundWalletSchema = z.object({
    amount: z.number().min(100, "Minimum amount is ₦100").positive("Amount must be positive"),
    studentId: z.string().min(1, "Please select a student first")
});

type FundWalletForm = z.infer<typeof fundWalletSchema>;

export const FundParentWallet = () => {
    const { schoolId, user, profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FundWalletForm>({
        resolver: zodResolver(fundWalletSchema),
        defaultValues: {
            amount: undefined
        }
    });

    // Mock search function
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // In real app, query Firestore for students
        if (searchQuery.length > 3) {
            const student = {
                id: 'student-123',
                name: 'John Doe',
                class: 'SS2 Science',
                walletBalance: 25000,
                parentName: 'Mr. Doe',
                parentId: 'parent-456'
            };
            setSelectedStudent(student);
            setValue('studentId', student.id); // Register student selection
        }
    };

    const onSubmit = async (data: FundWalletForm) => {
        if (!selectedStudent || !schoolId || !user || !profile) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "financial_transactions"), {
                amount: data.amount,
                type: 'income',
                category: 'Wallet Funding',
                description: `Wallet funding for ${selectedStudent.name}`,
                date: serverTimestamp(),
                status: 'completed',
                studentId: selectedStudent.id,
                parentId: selectedStudent.parentId,
                schoolId
            });

            // Log wallet funding action
            try {
                await logAction(
                    schoolId,
                    user.uid,
                    profile.fullName || 'Unknown User',
                    'create',
                    'financial',
                    selectedStudent.id,
                    undefined,
                    {
                        amount: data.amount,
                        category: 'Wallet Funding',
                        studentName: selectedStudent.name
                    }
                );
            } catch (error) {
                console.error('Failed to log wallet funding:', error);
            }

            alert('Wallet funded successfully!');
            reset();
            setSelectedStudent(null);
            setSearchQuery('');
        } catch (err) {
            console.error(err);
            alert('Failed to fund wallet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-20">
            <div className="text-center">
                <div className="w-16 h-16 bg-teal-500/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <Wallet className="w-8 h-8 text-teal-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Fund Wallet</h1>
                <p className="text-gray-400">Add funds to a student or parent wallet</p>
            </div>

            <div className="bg-dark-card border border-white/5 rounded-[32px] p-8">
                {!selectedStudent ? (
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Search Student</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full bg-dark-bg border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                                    placeholder="Enter admission number or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-teal-500/10 text-teal-400 rounded-lg text-sm font-bold hover:bg-teal-500/20 transition-colors"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8">
                        {/* Student Profile Card */}
                        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-dark-bg font-bold text-lg">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold">{selectedStudent.name}</h3>
                                <p className="text-sm text-gray-400">{selectedStudent.class} • {selectedStudent.parentName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Balance</p>
                                <p className="text-emerald-400 font-bold">₦{selectedStudent.walletBalance.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => { setSelectedStudent(null); reset(); }}
                                className="ml-4 text-red-400 text-sm font-bold hover:underline"
                            >
                                Change
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Amount to Fund</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold group-focus-within:text-teal-400">₦</span>
                                    <input
                                        type="number"
                                        {...register('amount', { valueAsNumber: true })}
                                        className={`w-full bg-dark-bg border rounded-xl py-4 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none transition-all font-mono text-lg ${errors.amount ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50'}`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="text-red-400 text-sm flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.amount.message}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Process Funding</span>
                                        <CreditCard className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
