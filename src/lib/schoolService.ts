import { supabase } from './supabase';

/**
 * Find a school by name (case-insensitive)
 * Uses edge function to bypass RLS restrictions for unauthenticated users
 * Returns the school ID (UUID) and other details
 */
export const findSchoolByName = async (schoolName: string) => {
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lookup-school`;

    try {
        console.log('[findSchoolByName] Attempting edge function lookup for:', schoolName);

        // Try edge function first (server-side lookup with service role)
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ schoolName })
        });

        if (!response.ok) {
            console.warn(`[findSchoolByName] Edge function returned ${response.status}, trying fallback...`);
            throw new Error(`Edge function returned ${response.status}`);
        }

        const result = await response.json();

        if (result.schools && Array.isArray(result.schools) && result.schools.length > 0) {
            console.log('[findSchoolByName] Found schools via edge function:', result.schools.length);
            return result.schools;
        }

        console.warn('[findSchoolByName] School lookup returned no results via edge function');
        return [];
    } catch (err) {
        // Edge function failed - try direct query as fallback
        console.warn('[findSchoolByName] Edge function failed, using database fallback:',
            err instanceof Error ? err.message : String(err));

        try {
            console.log('[findSchoolByName] Attempting direct database query...');
            const { data, error } = await supabase
                .from('schools')
                .select('id, name, address')
                .ilike('name', `%${schoolName}%`)
                .limit(5);

            if (error) {
                console.error('[findSchoolByName] Fallback query failed:', error.message);
                // Return empty array instead of throwing - allow graceful degradation
                return [];
            }

            if (data && data.length > 0) {
                console.log('[findSchoolByName] Found schools via database fallback:', data.length);
                return data;
            }

            console.log('[findSchoolByName] No schools found in database');
            return [];
        } catch (fallbackErr) {
            console.error('[findSchoolByName] Fallback exception:',
                fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr));
            // Return empty array instead of throwing
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
