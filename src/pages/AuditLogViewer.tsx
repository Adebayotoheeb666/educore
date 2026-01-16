import { useState, useEffect } from 'react';
import { Search, Download, Calendar, User, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getAuditLogs, downloadAuditLogsCSV } from '../lib/auditService';
import type { AuditLog } from '../lib/auditService';

export const AuditLogViewer = () => {
    const { schoolId, role } = useAuth();
    const [logs, setLogs] = useState<(AuditLog & { id: string })[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<(AuditLog & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState<string>('');
    const [filterResourceType, setFilterResourceType] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (schoolId) {
            loadLogs();
        }
    }, [schoolId]);

    useEffect(() => {
        applyFilters();
    }, [logs, searchTerm, filterAction, filterResourceType, startDate, endDate]);

    const loadLogs = async () => {
        if (!schoolId) return;

        setLoading(true);
        try {
            const fetchedLogs = await getAuditLogs(schoolId, { limit: 500 });
            setLogs(fetchedLogs);
        } catch (err) {
            console.error('Failed to load audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...logs];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(log =>
                log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.resourceId?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Action filter
        if (filterAction) {
            filtered = filtered.filter(log => log.action === filterAction);
        }

        // Resource type filter
        if (filterResourceType) {
            filtered = filtered.filter(log => log.resourceType === filterResourceType);
        }

        // Date range filter
        if (startDate || endDate) {
            filtered = filtered.filter(log => {
                const timestamp = log.timestamp as any;
                const logDate = timestamp instanceof Date
                    ? timestamp
                    : new Date(timestamp);

                if (startDate && logDate < new Date(startDate)) return false;
                if (endDate && logDate > new Date(endDate + 'T23:59:59')) return false;
                return true;
            });
        }

        setFilteredLogs(filtered);
    };

    const handleExport = () => {
        const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        downloadAuditLogsCSV(filteredLogs, filename);
    };

    const formatTimestamp = (timestamp: string | Date | any) => {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        return date.toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'create': return 'text-teal-400 bg-teal-500/10';
            case 'update': return 'text-blue-400 bg-blue-500/10';
            case 'delete': return 'text-red-400 bg-red-500/10';
            case 'login': return 'text-emerald-400 bg-emerald-500/10';
            case 'logout': return 'text-gray-400 bg-gray-500/10';
            case 'export': return 'text-purple-400 bg-purple-500/10';
            case 'import': return 'text-orange-400 bg-orange-500/10';
            default: return 'text-gray-400 bg-gray-500/10';
        }
    };

    if (role !== 'admin') {
        return <div className="p-8 text-white">Access Denied: Admins Only</div>;
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
                <p className="text-gray-400 mt-2">View all system activities and changes</p>
            </header>

            {/* Filters */}
            <div className="bg-dark-card border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by user, email, or resource ID..."
                                className="w-full pl-10 pr-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Action Filter */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Action
                        </label>
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none text-sm"
                        >
                            <option value="">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="export">Export</option>
                            <option value="import">Import</option>
                        </select>
                    </div>

                    {/* Resource Type Filter */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Resource Type
                        </label>
                        <select
                            value={filterResourceType}
                            onChange={(e) => setFilterResourceType(e.target.value)}
                            className="w-full px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none text-sm"
                        >
                            <option value="">All Types</option>
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                            <option value="result">Result</option>
                            <option value="attendance">Attendance</option>
                            <option value="financial">Financial</option>
                            <option value="term">Term</option>
                            <option value="class">Class</option>
                            <option value="subject">Subject</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2 bg-dark-input border border-white/10 rounded-lg text-white focus:border-teal-500 focus:outline-none text-sm"
                        />
                    </div>

                    {/* Export Button */}
                    <div className="lg:col-span-2 flex items-end">
                        <button
                            onClick={handleExport}
                            disabled={filteredLogs.length === 0}
                            className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export to CSV ({filteredLogs.length} logs)
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Logs Found</h3>
                        <p className="text-gray-400">
                            {logs.length === 0
                                ? 'No audit logs have been recorded yet'
                                : 'No logs match your current filters'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-gray-400 font-bold">Timestamp</th>
                                    <th className="px-6 py-4 text-left text-gray-400 font-bold">User</th>
                                    <th className="px-6 py-4 text-left text-gray-400 font-bold">Action</th>
                                    <th className="px-6 py-4 text-left text-gray-400 font-bold">Resource</th>
                                    <th className="px-6 py-4 text-left text-gray-400 font-bold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {formatTimestamp(log.timestamp)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <div>
                                                    <div className="text-white font-medium">{log.userName}</div>
                                                    {log.userEmail && (
                                                        <div className="text-xs text-gray-500">{log.userEmail}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{log.resourceType}</div>
                                            {log.resourceId && (
                                                <div className="text-xs text-gray-500 font-mono">{log.resourceId}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 max-w-xs truncate">
                                            {log.changes && Object.keys(log.changes).length > 0 ? (
                                                <span className="text-xs">
                                                    {Object.keys(log.changes).join(', ')} changed
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Results Count */}
            {!loading && filteredLogs.length > 0 && (
                <div className="text-center text-sm text-gray-400">
                    Showing {filteredLogs.length} of {logs.length} total logs
                </div>
            )}
        </div>
    );
};
