import { useState, useEffect } from 'react';
import {
    CreditCard,
    TrendingUp,
    AlertCircle,
    Eye,
    EyeOff,
    Download,
    Filter,
    Search,
    BarChart3,
    ArrowUpRight,
    ArrowDownLeft,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TransactionSummary {
    totalRevenue: number;
    pendingAmount: number;
    completedAmount: number;
    failedAmount: number;
    transactionCount: number;
}

interface Transaction {
    id: string;
    studentId: string;
    studentName: string;
    amount: number;
    type: string;
    paymentMethod: string;
    status: 'completed' | 'pending' | 'failed';
    reference: string;
    description: string;
    createdAt: string;
}

interface DailyRevenue {
    date: string;
    amount: number;
    count: number;
}

export const PaymentTrackingDashboard = () => {
    const { schoolId } = useAuth();
    const [summary, setSummary] = useState<TransactionSummary>({
        totalRevenue: 0,
        pendingAmount: 0,
        completedAmount: 0,
        failedAmount: 0,
        transactionCount: 0,
    });

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showRevenue, setShowRevenue] = useState(true);

    // Fetch payment data
    useEffect(() => {
        const fetchPaymentData = async () => {
            if (!schoolId) return;

            setLoading(true);
            try {
                // Fetch transactions
                let query = supabase
                    .from('financial_transactions')
                    .select('*')
                    .eq('school_id', schoolId)
                    .eq('type', 'fee-payment')
                    .order('created_at', { ascending: false });

                if (dateRange.start) {
                    query = query.gte('created_at', dateRange.start);
                }
                if (dateRange.end) {
                    query = query.lte('created_at', dateRange.end);
                }

                const { data: txnData, error: txnError } = await query;
                if (txnError) throw txnError;

                // Enrich with student names
                const enrichedTransactions: Transaction[] = await Promise.all(
                    (txnData || []).map(async (txn) => {
                        const { data: student } = await supabase
                            .from('users')
                            .select('full_name')
                            .eq('id', txn.student_id)
                            .single();

                        return {
                            id: txn.id,
                            studentId: txn.student_id,
                            studentName: student?.full_name || 'Unknown',
                            amount: txn.amount,
                            type: txn.type,
                            paymentMethod: txn.payment_method,
                            status: txn.status,
                            reference: txn.reference,
                            description: txn.description,
                            createdAt: txn.created_at,
                        };
                    })
                );

                // Filter by status
                const filteredTransactions =
                    filterStatus === 'all'
                        ? enrichedTransactions
                        : enrichedTransactions.filter((t) => t.status === filterStatus);

                // Filter by search
                const searchedTransactions = filteredTransactions.filter(
                    (t) =>
                        t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.description.toLowerCase().includes(searchQuery.toLowerCase())
                );

                setTransactions(searchedTransactions);

                // Calculate summary
                const completed = enrichedTransactions.filter((t) => t.status === 'completed');
                const pending = enrichedTransactions.filter((t) => t.status === 'pending');
                const failed = enrichedTransactions.filter((t) => t.status === 'failed');

                setSummary({
                    totalRevenue: completed.reduce((sum, t) => sum + t.amount, 0),
                    completedAmount: completed.reduce((sum, t) => sum + t.amount, 0),
                    pendingAmount: pending.reduce((sum, t) => sum + t.amount, 0),
                    failedAmount: failed.reduce((sum, t) => sum + t.amount, 0),
                    transactionCount: enrichedTransactions.length,
                });

                // Calculate daily revenue
                const daily: { [key: string]: { amount: number; count: number } } = {};
                enrichedTransactions.forEach((t) => {
                    const date = new Date(t.createdAt).toISOString().split('T')[0];
                    if (!daily[date]) {
                        daily[date] = { amount: 0, count: 0 };
                    }
                    daily[date].amount += t.amount;
                    daily[date].count += 1;
                });

                const dailyData = Object.entries(daily)
                    .map(([date, data]) => ({
                        date,
                        amount: data.amount,
                        count: data.count,
                    }))
                    .sort((a, b) => a.date.localeCompare(b.date));

                setDailyRevenue(dailyData);
            } catch (error) {
                console.error('Error fetching payment data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentData();
    }, [schoolId, filterStatus, searchQuery, dateRange]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    // Export data to CSV
    const exportToCSV = () => {
        const headers = ['Date', 'Student', 'Amount', 'Method', 'Status', 'Reference'];
        const rows = transactions.map((t) => [
            new Date(t.createdAt).toLocaleDateString(),
            t.studentName,
            t.amount,
            t.paymentMethod,
            t.status,
            t.reference,
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Payment Tracking Dashboard</h1>
                <p className="text-gray-400">Monitor and analyze all school fee payments</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-dark-card border border-white/5 rounded-[24px] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Revenue</h3>
                        <button
                            onClick={() => setShowRevenue(!showRevenue)}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            {showRevenue ? (
                                <Eye className="w-4 h-4" />
                            ) : (
                                <EyeOff className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-3xl font-bold text-teal-400">
                        {showRevenue ? formatCurrency(summary.totalRevenue) : '****'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">{summary.transactionCount} transactions</p>
                </div>

                {/* Completed */}
                <div className="bg-dark-card border border-white/5 rounded-[24px] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Completed</h3>
                        <ArrowUpRight className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(summary.completedAmount)}</p>
                    <p className="text-xs text-gray-500 mt-2">Verified payments</p>
                </div>

                {/* Pending */}
                <div className="bg-dark-card border border-white/5 rounded-[24px] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending</h3>
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">{formatCurrency(summary.pendingAmount)}</p>
                    <p className="text-xs text-gray-500 mt-2">Awaiting confirmation</p>
                </div>

                {/* Failed */}
                <div className="bg-dark-card border border-white/5 rounded-[24px] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Failed</h3>
                        <ArrowDownLeft className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-3xl font-bold text-red-400">{formatCurrency(summary.failedAmount)}</p>
                    <p className="text-xs text-gray-500 mt-2">Action required</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-dark-card border border-white/5 rounded-[24px] p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-teal-400" />
                        Revenue Trend
                    </h3>
                    {dailyRevenue.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="#666" />
                                <YAxis stroke="#666" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Line type="monotone" dataKey="amount" stroke="#00b894" dot={{ fill: '#00b894' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 text-center py-20">No data available</p>
                    )}
                </div>

                {/* Payment Status Distribution */}
                <div className="bg-dark-card border border-white/5 rounded-[24px] p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-teal-400" />
                        Payment Status
                    </h3>
                    {transactions.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Completed', value: transactions.filter((t) => t.status === 'completed').length },
                                        { name: 'Pending', value: transactions.filter((t) => t.status === 'pending').length },
                                        { name: 'Failed', value: transactions.filter((t) => t.status === 'failed').length },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    <Cell fill="#00b894" />
                                    <Cell fill="#ffc107" />
                                    <Cell fill="#f44336" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 text-center py-20">No data available</p>
                    )}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-dark-card border border-white/5 rounded-[24px] p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-teal-400" />
                    Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by student, reference..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-dark-bg border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-dark-bg border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-teal-500/50"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>

                    {/* Date Range */}
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="bg-dark-bg border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-teal-500/50"
                    />

                    {/* Export Button */}
                    <button
                        onClick={exportToCSV}
                        className="bg-teal-500 text-dark-bg font-semibold py-2 px-4 rounded-lg hover:bg-teal-400 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-dark-card border border-white/5 rounded-[24px] p-6 overflow-x-auto">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-400" />
                    Recent Transactions
                </h3>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No transactions found</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Student</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Method</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((txn) => (
                                <tr key={txn.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-4 text-gray-300">
                                        {new Date(txn.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-4 text-white font-semibold">{txn.studentName}</td>
                                    <td className="py-4 px-4 text-teal-400">{formatCurrency(txn.amount)}</td>
                                    <td className="py-4 px-4 text-gray-400 capitalize">{txn.paymentMethod}</td>
                                    <td className="py-4 px-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${txn.status === 'completed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : txn.status === 'pending'
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}
                                        >
                                            {txn.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-gray-500 font-mono text-xs">{txn.reference.slice(0, 16)}...</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
