import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && role && !allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase())) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-2">Access Denied</h1>
                    <p className="text-gray-400 mb-4">You do not have permission to view this page.</p>
                    <Navigate to="/" replace />
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
