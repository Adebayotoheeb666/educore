import { supabase } from './supabase';

/**
 * Find a school by name (case-insensitive)
 * Uses edge function to bypass RLS restrictions for unauthenticated users
 * Returns the school ID (UUID) and other details
 */
export const findSchoolByName = async (schoolName: string) => {
    try {
        // Try edge function first (server-side lookup with service role)
        const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lookup-school`;

        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ schoolName })
        });

        const result = await response.json();

        if (result.schools && Array.isArray(result.schools)) {
            return result.schools;
        }

        console.warn('School lookup returned no results:', result.error);
        return [];
    } catch (err) {
        console.error('Exception in findSchoolByName:', err);
        // Fallback: try direct query (may fail due to RLS)
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('id, name, address')
                .ilike('name', `%${schoolName}%`)
                .limit(5);

            if (error) {
                console.error('Fallback query also failed:', error);
                return [];
            }

            return data || [];
        } catch (fallbackErr) {
            console.error('Fallback exception:', fallbackErr);
            return [];
        }
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
