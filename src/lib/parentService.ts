import { supabase } from './supabase';

export interface CreateParentParams {
    fullName: string;
    email: string;
    phoneNumber?: string;
    parentId?: string;
}

/**
 * Generate a unique parent ID
 */
function generateParentId(schoolId: string): string {
    const schoolPrefix = schoolId.substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PAR-${schoolPrefix}-${randomSuffix}`;
}

/**
 * Generate a deterministic UUID from parent data
 */
async function generateDeterministicUUID(schoolId: string, parentId: string): Promise<string> {
    const input = `parent_${schoolId}_${parentId.toLowerCase()}`;
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
): Promise<{ parentId: string; parentUid: string; message: string }> => {
    const parentId = data.parentId || generateParentId(schoolId);

    try {
        // Generate deterministic parent ID (using admission_number field to store parent_id)
        const parentUid = await generateDeterministicUUID(schoolId, parentId);

        // Use upsert instead of insert to comply with RLS policy
        const { data: userData, error: userError } = await supabase
            .from('users')
            .upsert({
                id: parentUid,
                school_id: schoolId,
                email: data.email,
                full_name: data.fullName,
                role: 'parent',
                admission_number: parentId, // Store parent ID in admission_number field for virtual email generation
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
            parentId,
            parentUid: userData.id,
            message: `Parent profile created successfully with parent ID: ${parentId}`,
        };
    } catch (err) {
        console.error('Error creating parent:', err);
        throw err;
    }
};

/**
 * Export generateParentId for use in other components
 */
export { generateParentId };
