import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    date: any;
    category: string;
    status: 'completed' | 'pending';
    recordedBy?: string;
}

export const FullAccountExplore = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        income: 0,
        expenses: 0,
        balance: 0
    });

    useEffect(() => {
        const fetchTransactions = async () => {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error("Error fetching transactions:", error);
            } else if (data) {
                updateStateWithTransactions(data);
            }
            setLoading(false);
        };

        const updateStateWithTransactions = (data: any[]) => {
            const mappedData = data.map(tx => ({
                id: tx.id,
                amount: tx.amount,
                type: tx.type,
                description: tx.description,
                date: tx.created_at,
                category: tx.category,
                status: tx.status
            })) as Transaction[];

            setTransactions(mappedData);

            // Calculate Stats
            const inc = mappedData.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
            const exp = mappedData.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

            setStats({
                income: inc,
                expenses: exp,
                balance: inc - exp
            });
        };

        fetchTransactions();

        // Real-time subscription
        const channel = supabase
            .channel('financial_transactions_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, () => {
                fetchTransactions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Financial Overview</h1>
                    <p className="text-gray-400">Track school income, expenses, and budget</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-dark-card border border-white/10 rounded-xl text-white font-medium flex items-center gap-2 hover:bg-white/5 transition-colors">
                        <Calendar className="w-4 h-4" />
                        <span>This Month</span>
                    </button>
                    <button className="px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl font-medium flex items-center gap-2 hover:bg-teal-500/20 transition-colors">
                        <Download className="w-4 h-4" />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-dark-card border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
                            <DollarSign className="w-6 h-6 text-teal-400" />
                        </div>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Net Balance</p>
                        <h3 className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.balance)}</h3>
                        <div className="flex items-center gap-2 text-teal-400 text-sm font-medium bg-teal-400/10 w-fit px-2 py-1 rounded-lg">
                            <TrendingUp className="w-4 h-4" />
                            <span>+12.5% from last month</span>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-card border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                            <ArrowDownRight className="w-6 h-6 text-emerald-400" />
                        </div>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total Income</p>
                        <h3 className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.income)}</h3>
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-400/10 w-fit px-2 py-1 rounded-lg">
                            <ArrowUpRight className="w-4 h-4" />
                            <span>+8.2% vs target</span>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-card border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                            <ArrowUpRight className="w-6 h-6 text-red-400" />
                        </div>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total Expenses</p>
                        <h3 className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.expenses)}</h3>
                        <div className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-400/10 w-fit px-2 py-1 rounded-lg">
                            <TrendingDown className="w-4 h-4" />
                            <span>-2.4% vs last month</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-dark-card border border-white/5 rounded-[32px] p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
                    <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <Filter className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 text-left">
                                <th className="pb-4 pl-4 text-gray-500 font-bold text-sm uppercase tracking-wider">Transaction</th>
                                <th className="pb-4 text-gray-500 font-bold text-sm uppercase tracking-wider">Category</th>
                                <th className="pb-4 text-gray-500 font-bold text-sm uppercase tracking-wider">Date</th>
                                <th className="pb-4 text-gray-500 font-bold text-sm uppercase tracking-wider">Status</th>
                                <th className="pb-4 pr-4 text-right text-gray-500 font-bold text-sm uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">
                                        No transactions yet.
                                    </td>
                                </tr>
                            )}
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 pl-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                                }`}>
                                                {tx.type === 'income' ? (
                                                    <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                                                ) : (
                                                    <ArrowUpRight className="w-5 h-5 text-red-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{tx.description}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">{tx.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-300 text-sm font-medium">
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td className="py-4 text-gray-400 text-sm">
                                        {tx.date ? new Date(tx.date).toLocaleDateString() : 'Just now'}
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tx.status === 'completed'
                                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className={`py-4 pr-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'
                                        }`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
