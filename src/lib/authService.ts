import { supabase } from './supabase';
import type { UserProfile } from './types';

/**
 * Maps an admission number to a virtual email for Auth
 */
export const getVirtualEmail = (schoolId: string, admissionNumber: string) => {
    // Sanitize schoolId and admissionNumber to ensure valid email format
    const cleanSchool = schoolId.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const cleanAdm = admissionNumber.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return `${cleanAdm}@${cleanSchool}.educore.app`;
};

/**
 * Registers a new school and its first admin
 */
export const registerSchool = async (adminData: any, schoolData: any) => {
    const { email, password, fullName } = adminData;
    const { name, address } = schoolData;

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { fullName, role: 'admin' } // stored in authentication metadata
        }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    const uid = authData.user.id;

    // 2. Create School Document
    const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({
            name,
            address,
            contact_email: email
        })
        .select()
        .single();

    if (schoolError) throw schoolError;

    // 3. Create Admin Profile in public.users
    const { error: profileError } = await supabase
        .from('users')
        .insert({
            id: uid,
            school_id: school.id,
            role: 'admin',
            email,
            full_name: fullName
        });

    if (profileError) throw profileError;

    return { schoolId: school.id, uid };
};

/**
 * Login with admission number (for students)
 */
export const loginWithAdmissionNumber = async (schoolId: string, admissionNumber: string, password: string) => {
    // 1. We need to find the school first to normalize the ID if needed, 
    // but assuming schoolId passed here is the database UUID or a slug.
    // For simplicity, let's assume the UI sends the correct School UUID or we do a lookup.

    // For now, constructing email with raw input. 
    // In production, you might look up the student by admission_number column via a Edge Function 
    // to get their real internal email.
    const virtualEmail = getVirtualEmail(schoolId, admissionNumber);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password
    });

    if (error) throw error;
    return data;
};

/**
 * Initiate phone login (sends OTP)
 */
export const signInWithPhone = async (phoneNumber: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber
    });

    if (error) throw error;
    return data;
};

/**
 * Confirm OTP code
 */
export const confirmPhoneOTP = async (phoneNumber: string, code: string, schoolId: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: code,
        type: 'sms'
    });

    if (error) throw error;
    const user = data.user;

    if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) {
            // Link new parent to school
            await supabase.from('users').insert({
                id: user.id,
                school_id: schoolId,
                role: 'parent',
                phone_number: phoneNumber,
                full_name: 'Parent' // Prompt to update later
            });
        }
    }

    return data;
};

/**
 * Get the current user's profile
 */
export const getCurrentUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        role: data.role,
        schoolId: data.school_id,
        admissionNumber: data.admission_number,
        phoneNumber: data.phone_number,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
};

