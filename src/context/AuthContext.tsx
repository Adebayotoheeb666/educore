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

    const fetchProfile = async (userId: string) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        const timeoutDuration = 7000;

        const timeoutId = setTimeout(() => {
            console.warn(`[AuthContext] Profile fetch timed out after ${timeoutDuration}ms. Using metadata fallback.`);
            setLoading(false);
            fetchingRef.current = false;
        }, timeoutDuration);

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[AuthContext] Error fetching profile:', error);
                setProfile(null);
                setLoading(false);
            } else if (data) {
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
                setUserContext(data.id, data.email || '', data.school_id || '', data.role || '');
                setLoading(false);
            }
        } catch (err: any) {
            console.error('[AuthContext] Unexpected fetch error:', err);
            setLoading(false);
        } finally {
            clearTimeout(timeoutId);
            fetchingRef.current = false;
        }
    };

    useEffect(() => {
        // We only use onAuthStateChange as it handles the initial session (INITIAL_SESSION event)
        // and all subsequent changes. This prevents double-fetching on mount.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                await fetchProfile(currentUser.id);
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
