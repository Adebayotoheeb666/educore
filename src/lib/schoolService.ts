import { supabase } from './supabase';

/**
 * Find a school by name (case-insensitive)
 * Returns the school ID (UUID) and other details
 */
export const findSchoolByName = async (schoolName: string) => {
    try {
        const { data, error } = await supabase
            .from('schools')
            .select('id, name, address')
            .ilike('name', `%${schoolName}%`)
            .limit(5);

        if (error) {
            console.error('Error finding school:', error);
            // Return empty array on error - the caller will handle it
            // This could be due to RLS restrictions on unauthenticated access
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Exception finding school:', err);
        return [];
    }
};

/**
 * Validate that a schoolId is a valid UUID
 */
export const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

/**
 * Get school by ID
 */
export const getSchoolById = async (schoolId: string) => {
    const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

    if (error) {
        console.error('Error fetching school:', error);
        return null;
    }

    return data;
};
