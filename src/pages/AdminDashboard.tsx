import { useState, useEffect } from 'react';
import {
    Users,
    BookOpen,
    GraduationCap,
    Plus,
    Search,
    MoreVertical,
    DollarSign,
    TrendingUp,
    Download,
    X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { BulkStudentImport } from '../components/BulkStudentImport';
import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import type { ImportResult } from '../lib/bulkImportService';

export const AdminDashboard = () => {
    const { schoolId, role } = useAuth();
    const [activeTab, setActiveTab] = useState<'staff' | 'students' | 'classes' | 'subjects'>('staff');
    const [staff, setStaff] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [financials, setFinancials] = useState({ totalRevenue: 0, outstanding: 0 });
    const [loading, setLoading] = useState(true);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);

    // State for fetching
    useEffect(() => {
        if (schoolId) {
            fetchData();
        }
    }, [schoolId]);

    const handleBulkImportSuccess = (result: ImportResult) => {
        // Refresh student list
        if (result.imported > 0) {
            fetchData();
        }
    };

    const fetchData = async () => {
        if (!schoolId) return;

        setLoading(true);
        try {
            // Fetch All School Users
            const usersQ = query(collection(db, 'users'), where('schoolId', '==', schoolId));
            const usersSnap = await getDocs(usersQ);
            const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setStaff(allUsers.filter((u: any) => u.role === 'staff' || u.role === 'admin'));
            setStudents(allUsers.filter((u: any) => u.role === 'student'));

            // Fetch Classes
            const classQ = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
            const classSnap = await getDocs(classQ);
            setClasses(classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Financials
            const transQ = query(collection(db, 'financial_transactions'), where('schoolId', '==', schoolId));
            const transSnap = await getDocs(transQ);
            const total = transSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);

            // Assuming default fee of 150k per student for now
            const totalExpected = allUsers.filter((u: any) => u.role === 'student').length * 150000;
            setFinancials({
                totalRevenue: total,
                outstanding: totalExpected - total
            });
        } catch (err) {
            console.error("Error fetching school data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Placeholder for data fetching logic

    if (role !== 'admin') {
        return <div className="p-8 text-white">Access Denied: Admins Only</div>;
    }

    // Bulk Import Modal
    if (showBulkImport) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-dark-card border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-dark-card border-b border-white/10 p-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white">Bulk Import Students</h1>
                        <button
                            onClick={() => setShowBulkImport(false)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6">
                        <BulkStudentImport
                            onSuccess={handleBulkImportSuccess}
                            onClose={() => setShowBulkImport(false)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">School Management</h1>
                    <p className="text-gray-400">Manage your institution's staff, students, and curriculum.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New</span>
                        </button>
                        {showAddMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors border-b border-white/5">Single Registration</button>
                                <button
                                    onClick={() => {
                                        setShowBulkImport(true);
                                        setShowAddMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-colors flex items-center justify-between"
                                >
                                    <span>Bulk Upload</span>
                                    <Download className="w-4 h-4 text-teal-500" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Staff" value={staff.filter(u => u.role === 'staff').length} color="teal" />
                <StatCard icon={GraduationCap} label="Total Students" value={students.length} color="emerald" />
                <StatCard icon={DollarSign} label="Revenue" value={`₦${(financials.totalRevenue / 1000000).toFixed(1)}M`} color="blue" />
                <StatCard icon={TrendingUp} label="Outstanding" value={`₦${(financials.outstanding / 1000000).toFixed(1)}M`} color="red" />
            </div>

            {/* Interactive Tabs */}
            <div className="bg-dark-card border border-white/5 rounded-[32px] overflow-hidden">
                <div className="flex border-b border-white/5 bg-white/5">
                    <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} label="Staff Members" />
                    <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} label="Student List" />
                    <TabButton active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} label="Class Arms" />
                    <TabButton active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} label="Subjects" />
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-500 text-sm uppercase tracking-wider font-bold">
                                        <th className="pb-4 px-4">Name</th>
                                        <th className="pb-4 px-4">Role/ID</th>
                                        <th className="pb-4 px-4">Contact</th>
                                        <th className="pb-4 px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {activeTab === 'staff' && staff.filter(u => u.role === 'staff').map(u => (
                                        <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
                                                        {u.fullName?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-white font-medium">{u.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 font-mono text-sm">{u.staffId || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">{u.email}</td>
                                            <td className="py-4 px-4">
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'students' && students.map(u => (
                                        <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                                                        {u.fullName?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="text-white font-medium">{u.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 font-mono text-sm">{u.admissionNumber}</td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">{u.classId || 'Not Assigned'}</td>
                                            <td className="py-4 px-4">
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'classes' && classes.map(c => (
                                        <tr key={c.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                                        <BookOpen className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-white font-medium">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">{c.teacherName || 'No Form Teacher'}</td>
                                            <td className="py-4 px-4 text-gray-400 text-sm">{c.studentCount || 0} Students</td>
                                            <td className="py-4 px-4">
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTab === 'subjects' && (
                                        <tr className="text-gray-500 italic"><td colSpan={4} className="py-10 text-center">Subject management logic coming soon.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            {staff.length === 0 && (
                                <div className="text-center py-20 text-gray-500">
                                    No records found in this category.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-dark-card border border-white/5 p-6 rounded-2xl flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <div>
            <div className="text-gray-500 text-sm font-bold">{label}</div>
            <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        </div>
    </div>
);

const TabButton = ({ active, onClick, label }: any) => (
    <button
        onClick={onClick}
        className={`px-8 py-4 font-bold text-sm transition-all relative ${active ? 'text-teal-400' : 'text-gray-500 hover:text-white'
            }`}
    >
        {label}
        {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500" />}
    </button>
);
