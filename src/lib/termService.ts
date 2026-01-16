import { supabase } from './supabase';
import type { Term } from './types';

/**
 * Create a new academic term
 */
export const createTerm = async (
    schoolId: string,
    termData: Omit<Term, 'schoolId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    // Validate dates
    const startDate = new Date(termData.startDate);
    const endDate = new Date(termData.endDate);

    if (endDate <= startDate) {
        throw new Error('End date must be after start date');
    }

    // Check for overlapping terms
    const { data: existingTerms } = await supabase
        .from('terms')
        .select('*')
        .eq('school_id', schoolId);

    if (existingTerms) {
        for (const term of existingTerms) {
            const existingStart = new Date(term.start_date);
            const existingEnd = new Date(term.end_date);

            // Check if dates overlap
            if (
                (startDate >= existingStart && startDate <= existingEnd) ||
                (endDate >= existingStart && endDate <= existingEnd) ||
                (startDate <= existingStart && endDate >= existingEnd)
            ) {
                throw new Error(`Term dates overlap with existing term: ${term.name}`);
            }
        }
    }

    const { data: newTerm, error } = await supabase
        .from('terms')
        .insert({
            school_id: schoolId,
            name: termData.name,
            start_date: termData.startDate,
            end_date: termData.endDate,
            grade_scale: termData.gradeScale,
            is_active: termData.isActive
        })
        .select()
        .single();

    if (error) throw error;
    return newTerm.id;
};

/**
 * Update an existing term
 */
export const updateTerm = async (
    termId: string,
    updates: Partial<Omit<Term, 'schoolId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.startDate) updateData.start_date = updates.startDate;
    if (updates.endDate) updateData.end_date = updates.endDate;
    if (updates.gradeScale) updateData.grade_scale = updates.gradeScale;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('terms')
        .update(updateData)
        .eq('id', termId);

    if (error) throw error;
};

/**
 * Delete a term
 */
export const deleteTerm = async (termId: string): Promise<void> => {
    const { error } = await supabase
        .from('terms')
        .delete()
        .eq('id', termId);

    if (error) throw error;
};

/**
 * Set a term as the active term
 * Deactivates all other terms for the school
 */
export const setActiveTerm = async (schoolId: string, termId: string): Promise<void> => {
    // 1. Deactivate all terms for this school
    await supabase
        .from('terms')
        .update({ is_active: false })
        .eq('school_id', schoolId);

    // 2. Activate specific term
    await supabase
        .from('terms')
        .update({ is_active: true })
        .eq('id', termId);
};

/**
 * Get the currently active term for a school
 */
export const getActiveTerm = async (schoolId: string): Promise<(Term & { id: string }) | null> => {
    const { data, error } = await supabase
        .from('terms')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .limit(1)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        schoolId: data.school_id,
        name: data.name,
        startDate: data.start_date,
        endDate: data.end_date,
        gradeScale: data.grade_scale,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
};

/**
 * Get all terms for a school
 */
export const getAllTerms = async (schoolId: string): Promise<(Term & { id: string })[]> => {
    const { data, error } = await supabase
        .from('terms')
        .select('*')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false });

    if (error) {
        console.error('Error fetching terms:', error);
        return [];
    }

    return (data || []).map(t => ({
        id: t.id,
        schoolId: t.school_id,
        name: t.name,
        startDate: t.start_date,
        endDate: t.end_date,
        gradeScale: t.grade_scale,
        isActive: t.is_active,
        createdAt: t.created_at,
        updatedAt: t.updated_at
    }));
};

/**
 * Get a specific term by ID
 */
export const getTermById = async (termId: string): Promise<(Term & { id: string }) | null> => {
    const { data, error } = await supabase
        .from('terms')
        .select('*')
        .eq('id', termId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        schoolId: data.school_id,
        name: data.name,
        startDate: data.start_date,
        endDate: data.end_date,
        gradeScale: data.grade_scale,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
};
