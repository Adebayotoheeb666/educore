import { useState, useEffect } from 'react';
import { z } from 'zod';
import {
    Wallet,
    TrendingUp,
    History,
    Loader,
    AlertCircle,
    CheckCircle,
    ArrowDown,
    ArrowUp,
    DollarSign,
    CreditCard,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getWalletBalance, fundWallet, getWalletTransactions } from '../../lib/walletService';
import type { WalletTransaction } from '../../lib/walletService';
import type { DocWithId } from '../../lib/types';

// Zod Schema for wallet funding
const walletFundingSchema = z.object({
    amount: z.number().positive('Amount must be greater than 0').min(1000, 'Minimum amount is ₦1,000'),
    paymentMethod: z.enum(['card', 'bank_transfer']),
});

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export const FundParentWallet = () => {
    const { user, schoolId, profile } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Amount, 2: Payment, 3: Processing, 4: Success
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
    const [transactions, setTransactions] = useState<DocWithId<WalletTransaction>[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successAmount, setSuccessAmount] = useState(0);

    // Fetch wallet balance and transactions
    useEffect(() => {
        const fetchWalletData = async () => {
            if (!user || !schoolId) return;

            try {
                // Get balance
                const walletBalance = await getWalletBalance(schoolId, user.id);
                if (walletBalance !== null) {
                    setBalance(walletBalance);
                }

                // Get transactions
                const txns = await getWalletTransactions(schoolId, user.id);
                setTransactions(txns);
            } catch (err) {
                console.error('Error fetching wallet data:', err);
            }
        };

        fetchWalletData();
    }, [user, schoolId]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    // Handle quick amount selection
    const selectQuickAmount = (quickAmount: number) => {
        setAmount(quickAmount.toString());
        setError(null);
    };

    // Validate and proceed to payment
    const handleProceedToPayment = () => {
        const validationResult = walletFundingSchema.safeParse({
            amount: parseFloat(amount),
            paymentMethod,
        });

        if (!validationResult.success) {
            setError(validationResult.error.issues[0].message);
            return;
        }

        setStep(2);
        setError(null);
    };

    // Process payment
    const handlePayment = async () => {
        if (!user || !schoolId || !profile) {
            setError('Session expired. Please login again.');
            return;
        }

        const fundingAmount = parseFloat(amount);

        setLoading(true);
        setError(null);

        try {
            // Get session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Session expired. Please login again.');
                return;
            }

            // Step 1: Create payment intent via edge function
            const createIntentResponse = await supabase.functions.invoke('create-payment-intent', {
                body: {
                    amount: fundingAmount * 100, // Convert to kobo
                    currency: 'ngn',
                    studentId: user.id,
                    studentName: profile.fullName,
                    schoolId: schoolId,
                    schoolName: profile.schoolId?.toString() || 'School',
                    feeDescription: `Wallet Funding - ₦${fundingAmount.toLocaleString()}`,
                    metadata: {
                        type: 'wallet-funding',
                        parentId: user.id,
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

            // Step 2: Process payment (in production, use Stripe Payment Element)
            // For now, simulate successful payment after 2 seconds
            setStep(3);

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 3: Fund the wallet
            const fundResult = await fundWallet(
                schoolId,
                user.id,
                fundingAmount,
                paymentIntentId,
                paymentMethod
            );

            if (!fundResult.success) {
                throw new Error(fundResult.error || 'Failed to fund wallet');
            }

            // Update balance
            if (fundResult.wallet) {
                setBalance(fundResult.wallet.balance);
                setSuccessAmount(fundingAmount);
            }

            // Fetch updated transactions
            const txns = await getWalletTransactions(schoolId, user.id);
            setTransactions(txns);

            setStep(4);

        } catch (err) {
            console.error('Payment error:', err);
            setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-teal-500/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <Wallet className="w-8 h-8 text-teal-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Parent Wallet</h1>
                <p className="text-gray-400">Fund your wallet to pay school fees easily</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-200">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Funding Form */}
                <div className="lg:col-span-2">
                    <div className="bg-dark-card border border-white/5 rounded-[32px] p-8">
                        {/* Step 1: Select Amount */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Enter Amount to Fund
                                    </label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                                        <input
                                            type="number"
                                            className="w-full bg-dark-bg border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                                            placeholder="Enter amount (e.g., 50000)"
                                            value={amount}
                                            onChange={(e) => {
                                                setAmount(e.target.value);
                                                setError(null);
                                            }}
                                            min="1000"
                                            step="1000"
                                        />
                                    </div>
                                </div>

                                {/* Quick Amount Buttons */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Quick Select
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {QUICK_AMOUNTS.map((quickAmount) => (
                                            <button
                                                key={quickAmount}
                                                onClick={() => selectQuickAmount(quickAmount)}
                                                className={`p-3 rounded-lg font-semibold transition-all text-sm ${amount === quickAmount.toString()
                                                        ? 'bg-teal-500 text-dark-bg'
                                                        : 'bg-white/5 text-white hover:bg-white/10'
                                                    }`}
                                            >
                                                ₦{(quickAmount / 1000).toFixed(0)}K
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'card', label: 'Card', icon: CreditCard },
                                            { id: 'bank_transfer', label: 'Bank Transfer', icon: TrendingUp },
                                        ].map(({ id, label, icon: Icon }) => (
                                            <button
                                                key={id}
                                                onClick={() => setPaymentMethod(id as typeof paymentMethod)}
                                                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${paymentMethod === id
                                                        ? 'border-teal-500 bg-teal-500/10'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Proceed Button */}
                                <button
                                    onClick={handleProceedToPayment}
                                    disabled={!amount || loading}
                                    className="w-full bg-teal-500 text-dark-bg font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Proceed to Payment
                                </button>
                            </div>
                        )}

                        {/* Step 2: Review & Confirm */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-sm text-gray-400 mb-2">Funding Amount</p>
                                    <p className="text-4xl font-bold text-teal-400">{formatCurrency(parseFloat(amount))}</p>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-sm text-gray-400 mb-2">Payment Method</p>
                                    <p className="text-lg font-semibold text-white capitalize">{paymentMethod === 'card' ? 'Credit/Debit Card' : 'Bank Transfer'}</p>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-200">Your funds will be available immediately after payment confirmation.</p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                        className="flex-1 bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="flex-1 bg-teal-500 text-dark-bg font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                                        Confirm & Pay
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Processing */}
                        {step === 3 && (
                            <div className="text-center space-y-6 py-12">
                                <div className="w-16 h-16 bg-teal-500/10 rounded-full mx-auto flex items-center justify-center animate-pulse">
                                    <Loader className="w-8 h-8 text-teal-400 animate-spin" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
                                    <p className="text-gray-400">Please wait while we process your payment...</p>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Success */}
                        {step === 4 && (
                            <div className="text-center space-y-6 py-12">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full mx-auto flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Wallet Funded Successfully!</h2>
                                    <p className="text-gray-400">Your wallet has been credited with {formatCurrency(successAmount)}</p>
                                </div>

                                <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
                                    <p className="text-sm text-gray-300 mb-2">New Balance</p>
                                    <p className="text-3xl font-bold text-green-400">{formatCurrency(balance)}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setAmount('');
                                        setError(null);
                                    }}
                                    className="w-full bg-teal-500 text-dark-bg font-bold py-4 rounded-xl hover:bg-teal-400 transition-colors"
                                >
                                    Fund More
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Balance & Info */}
                <div className="space-y-6">
                    {/* Wallet Balance */}
                    <div className="bg-dark-card border border-white/5 rounded-[32px] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white">Wallet Balance</h3>
                            <Wallet className="w-5 h-5 text-teal-400" />
                        </div>
                        <p className="text-3xl font-bold text-teal-400 mb-4">{formatCurrency(balance)}</p>
                        <p className="text-sm text-gray-400">Available to pay school fees</p>
                    </div>

                    {/* Benefits */}
                    <div className="bg-dark-card border border-white/5 rounded-[32px] p-6">
                        <h3 className="font-bold text-white mb-4">Benefits</h3>
                        <ul className="space-y-3 text-sm">
                            {[
                                'Pay fees instantly',
                                'No card required',
                                'Secure & safe',
                                'Track all transactions',
                                'Manage multiple students',
                            ].map((benefit, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recent Transactions Preview */}
                    {transactions.length > 0 && (
                        <div className="bg-dark-card border border-white/5 rounded-[32px] p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Recent Activity
                            </h3>
                            <div className="space-y-3">
                                {transactions.slice(0, 3).map((txn) => (
                                    <div key={txn.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            {txn.type === 'credit' ? (
                                                <ArrowDown className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <ArrowUp className="w-4 h-4 text-red-400" />
                                            )}
                                            <div>
                                                <p className="text-sm text-gray-300">{txn.description}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(txn.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={`font-semibold ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                                            {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
