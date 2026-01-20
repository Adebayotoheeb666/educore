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
        if (fetchingRef.current) {
            console.log('[AuthContext] Already fetching profile, skipping...');
            return;
        }
        fetchingRef.current = true;
        console.log('[AuthContext] Starting profile fetch for:', userId);

        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('[AuthContext] Profile fetch timed out after 10s');
                setLoading(false);
                fetchingRef.current = false;
            }
        }, 10000);

        try {
            console.log('[AuthContext] Executing Supabase query for:', userId);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[AuthContext] Error fetching profile:', error);
                setProfile(null);
                setLoading(false); // Immediate resolution on error
            } else if (data) {
                console.log('[AuthContext] Profile fetched successfully:', data.role);
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
                setLoading(false); // Success
            }
        } catch (err) {
            console.error('[AuthContext] Unexpected error fetching profile:', err);
            setLoading(false);
        } finally {
            clearTimeout(timeoutId);
            fetchingRef.current = false;
            console.log('[AuthContext] Profile fetch complete');
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
        role: profile?.role,
        schoolId: profile?.schoolId
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
