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
        console.log('[AuthContext] Starting profile fetch for:', userId);

        try {
            console.log('[AuthContext] Attempting to fetch profile from database');
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

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

            // Profile record doesn't exist or error occurred - use fallback
            console.warn('[AuthContext] Profile record not found or error:', error?.message);
            const userMetadata = user.user_metadata || {};

            // Extract schoolId from metadata
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
        } catch (err) {
            console.error('[AuthContext] Profile fetch exception:', err);
            // Last resort fallback
            const userMetadata = user.user_metadata || {};
            let schoolId = userMetadata.schoolId || userMetadata.school_id || 'pending-setup';

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
        } finally {
            setLoading(false);
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
