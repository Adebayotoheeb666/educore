import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/types';
import { setUserContext } from '../lib/sentry';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    role: string | undefined;
    schoolId: string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchingRef = React.useRef(false);

    const fetchProfile = async (userId: string, user: User) => {
        if (fetchingRef.current) {
            console.log('[AuthContext] Already fetching profile, skipping...');
            return;
        }
        fetchingRef.current = true;

        const FETCH_TIMEOUT = 4000; // 4 seconds max wait
        let timeoutId: NodeJS.Timeout | null = null;
        let timedOut = false;

        try {
            console.log('[AuthContext] Attempting to fetch profile from database');

            // Wrap the fetch with a timeout
            const fetchPromise = supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    timedOut = true;
                    reject(new Error('Profile fetch timeout'));
                }, FETCH_TIMEOUT);
            });

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (timeoutId) clearTimeout(timeoutId);

            if (data) {
                console.log('[AuthContext] Profile fetched successfully:', data.role);
                // Successfully fetched from database
                const mappedProfile: UserProfile = {
                    id: data.id,
                    email: data.email,
                    role: data.role,
                    schoolId: data.school_id,
                    fullName: data.full_name,
                    admissionNumber: data.admission_number,
                    phoneNumber: data.phone_number,
                    staffId: data.staff_id,
                    assignedClasses: data.assigned_classes,
                    assignedSubjects: data.assigned_subjects,
                    linkedStudents: data.linked_students,
                    profileImage: data.profile_image,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at
                };

                setProfile(mappedProfile);
                setUserContext(
                    data.id,
                    data.email || 'unknown@school.app',
                    data.school_id || 'unknown-school',
                    data.role || 'unknown'
                );
                setLoading(false);
                fetchingRef.current = false;
                return;
            }

            // No data or error - use fallback
            console.warn('[AuthContext] Using fallback profile, timeout:', timedOut, 'error:', error?.message);
            useFallbackProfile(userId, user);
        } catch (err) {
            console.warn('[AuthContext] Profile fetch failed, using fallback:', err instanceof Error ? err.message : err);
            if (timeoutId) clearTimeout(timeoutId);
            useFallbackProfile(userId, user);
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    };

    const useFallbackProfile = (userId: string, user: User) => {
        const userMetadata = user.user_metadata || {};
        let schoolId = userMetadata.schoolId || userMetadata.school_id || '';

        if (!schoolId) {
            console.warn('[AuthContext] No schoolId in metadata, using pending-setup');
            schoolId = 'pending-setup';
        }

        const fallbackProfile: UserProfile = {
            id: userId,
            email: user.email || '',
            role: userMetadata.role || 'authenticated',
            schoolId: schoolId,
            fullName: userMetadata.fullName || '',
            admissionNumber: userMetadata.admissionNumber || '',
            phoneNumber: userMetadata.phone || '',
            staffId: userMetadata.staffId || '',
            assignedClasses: [],
            assignedSubjects: [],
            linkedStudents: [],
            profileImage: userMetadata.profileImage || null,
            createdAt: user.created_at || new Date().toISOString(),
            updatedAt: user.updated_at || new Date().toISOString()
        };

        setProfile(fallbackProfile);
        setUserContext(
            userId,
            user.email || 'unknown@school.app',
            schoolId,
            userMetadata.role || 'authenticated'
        );
    };

    useEffect(() => {
        // We only use onAuthStateChange as it handles the initial session (INITIAL_SESSION event)
        // and all subsequent changes. This prevents double-fetching on mount.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                await fetchProfile(currentUser.id, currentUser);
            } else {
                setProfile(null);
                setLoading(false);
                fetchingRef.current = false;
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = React.useMemo(() => ({
        user,
        profile,
        loading,
        role: (profile?.role || user?.user_metadata?.role)?.toLowerCase(),
        schoolId: profile?.schoolId || user?.user_metadata?.schoolId
    }), [user, profile, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
