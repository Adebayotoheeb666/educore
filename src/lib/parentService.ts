import { supabase } from './supabase';

export interface CreateParentParams {
    fullName: string;
    email?: string;
    phoneNumber?: string;
}

/**
 * Generate a deterministic UUID from parent data
 */
async function generateDeterministicUUID(schoolId: string, phoneNumber: string, email?: string): Promise<string> {
    const identifier = email || phoneNumber || `parent_${schoolId}_${Date.now()}`;
    const input = `parent_${schoolId}_${identifier.toLowerCase()}`;
    const msgUint8 = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Format as UUID: 8-4-4-4-12
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32)
    ].join('-');
}

/**
 * Create a parent account
 * Uses upsert to comply with RLS policies
 */
export const createParentAccount = async (
    schoolId: string,
    data: CreateParentParams
): Promise<{ parentId: string; message: string }> => {
    try {
        // Generate deterministic parent ID
        const parentId = await generateDeterministicUUID(schoolId, data.phoneNumber || '', data.email);

        // Use upsert instead of insert to comply with RLS policy
        const { data: userData, error: userError } = await supabase
            .from('users')
            .upsert({
                id: parentId,
                school_id: schoolId,
                email: data.email,
                full_name: data.fullName,
                role: 'parent',
                phone_number: data.phoneNumber,
            }, { onConflict: 'id' })
            .select()
            .single();

        if (userError) {
            console.error('Parent creation error:', userError);
            throw new Error(`Failed to create parent account: ${userError.message}`);
        }

        if (!userData) {
            throw new Error('Parent creation returned no data');
        }

        return {
            parentId: userData.id,
            message: `Parent profile created successfully`,
        };
    } catch (err) {
        console.error('Error creating parent:', err);
        throw err;
    }
};
