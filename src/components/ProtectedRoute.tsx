import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // MOCK AUTH BYPASS
        // Debug Log
        console.log("Auth Check - Env: ", import.meta.env.VITE_USE_MOCK_AUTH);

        if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
            const isAuth = localStorage.getItem('isAuthenticated');
            console.log("Mock Auth State: ", isAuth);
            if (isAuth) {
                const mockUser = JSON.parse(localStorage.getItem('user') || '{}');
                setUser(mockUser);
                setAuthorized(true); // Mock users are always authorized for now
            } else {
                setUser(null);
            }
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);

                // If roles are specified, check user role from Firestore
                if (allowedRoles && allowedRoles.length > 0) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            if (allowedRoles.includes(userData.role)) {
                                setAuthorized(true);
                            } else {
                                setAuthorized(false);
                            }
                        } else {
                            // User has no role doc? Deny access if roles required
                            setAuthorized(false);
                        }
                    } catch (err) {
                        console.error("Error fetching user role:", err);
                        setAuthorized(false);
                    }
                } else {
                    // No roles required, just need to be logged in
                    setAuthorized(true);
                }
            } else {
                setUser(null);
                setAuthorized(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [allowedRoles]);

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

    if (!authorized && allowedRoles) {
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
