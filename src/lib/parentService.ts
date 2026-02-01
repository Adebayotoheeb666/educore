import { supabase } from './supabase';
import { logAction } from './auditService';
// getVirtualEmail is not used in this file

export interface CreateParentParams {
    fullName: string;
    email: string;
    phoneNumber?: string;
    parentId?: string;
    studentAdmissionNumbers?: string[]; // To link to existing students
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
 * Generate a temporary password
 */
function generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Create a parent account with auth user
 */
export interface CreateParentAccountResult {
    parentId: string;
    docId: string;
    email: string;
    message: string;
    warning?: string;
    tempPassword?: string;
}

export async function createParentAccount(
    schoolId: string,
    adminId: string,
    data: CreateParentParams
): Promise<CreateParentAccountResult> {
    const parentId = data.parentId || generateParentId(schoolId);
    const tempPassword = generateTemporaryPassword();
    
    try {
        // 1. Generate deterministic parent UUID
        const userId = await generateDeterministicUUID(schoolId, parentId);

        // 2. Prepare user data for the RPC call
        const userData = {
            id: userId,
            email: data.email,
            password: tempPassword,
            user_metadata: {
                full_name: data.fullName,
                role: 'parent',
                schoolId: schoolId,
                parent_guardian_id: parentId,
                phone_number: data.phoneNumber || null,
                admission_number: parentId // For backward compatibility
            }
        };

        // 3. Call the RPC function to create the user
        const { data: createdUser, error: rpcError } = await supabase.rpc('create_user_with_profile', {
            user_data: JSON.stringify(userData)
        });

        if (rpcError) {
            console.error('User creation failed:', rpcError);
            throw new Error(`Failed to create user: ${rpcError.message}`);
        }

        if (!createdUser) {
            throw new Error('User creation returned no data');
        }

        // 3. Link to students if provided
        if (data.studentAdmissionNumbers && data.studentAdmissionNumbers.length > 0) {
            await linkParentToStudents(schoolId, userId, data.studentAdmissionNumbers);
        }

        // 4. Log the action
        await logAction(
            schoolId, 
            adminId, 
            'System', // User name - in a real app, you might want to fetch this from the admin user
            'create', 
            'parent',
            userId,
            {
                parentId,
                fullName: data.fullName,
                email: data.email
            },
            { 
                timestamp: new Date().toISOString(),
                studentAdmissionNumbers: data.studentAdmissionNumbers
            }
        );

        const result: CreateParentAccountResult = {
            parentId: parentId,
            docId: userId,
            email: data.email,
            message: `Parent account created successfully. Login with email: ${data.email} and temporary password.`,
            tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined
        };

        return result;
    } catch (err) {
        console.error('Error creating parent:', err);
        throw err;
    }
};

/**
 * Link parent to students by admission numbers
 */
async function linkParentToStudents(schoolId: string, parentId: string, admissionNumbers: string[]) {
    // Get student IDs from admission numbers
    const { data: students, error } = await supabase
        .from('users')
        .select('id')
        .in('admission_number', admissionNumbers)
        .eq('school_id', schoolId)
        .eq('role', 'student');

    if (error) {
        console.error('Error fetching students:', error);
        throw new Error('Failed to link parent to students');
    }

    // Create parent-student links
    const links = students.map(student => ({
        school_id: schoolId,
        parent_id: parentId,
        student_id: student.id,
        relationship: 'parent'
    }));

    const { error: linkError } = await supabase
        .from('parent_student_links')
        .upsert(links, { onConflict: 'parent_id,student_id' });

    if (linkError) {
        console.error('Error creating parent-student links:', linkError);
        throw new Error('Failed to link parent to students');
    }
}

/**
 * Export generateParentId for use in other components
 */
export { generateParentId };
