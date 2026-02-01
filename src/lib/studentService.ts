import { supabase } from './supabase';
import { logAction } from './auditService';
import { getVirtualEmail } from './authService';

export interface CreateStudentParams {
    fullName: string;
    email?: string;  // Made optional as we'll use virtual email if not provided
    phoneNumber?: string;
    admissionNumber?: string;
    classId?: string;
    parentEmails?: string[]; // Optional parent emails to link
}

/**
 * Generate a deterministic UUID from student data
 */
async function generateDeterministicUUID(schoolId: string, admissionNumber: string): Promise<string> {
    const input = `student_${schoolId}_${admissionNumber.toLowerCase()}`;
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
 * Generate a unique admission number
 */
function generateAdmissionNumber(schoolId: string): string {
    const schoolPrefix = schoolId.substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `ADM-${schoolPrefix}-${randomSuffix}`;
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
 * Link student to parents by email
 */
async function linkStudentToParents(schoolId: string, studentId: string, parentEmails: string[]) {
    if (!parentEmails || parentEmails.length === 0) return;
    
    // Get parent IDs from emails
    const { data: parents, error } = await supabase
        .from('users')
        .select('id')
        .in('email', parentEmails)
        .eq('school_id', schoolId)
        .eq('role', 'parent');

    if (error) {
        console.error('Error fetching parents:', error);
        throw new Error('Failed to link student to parents');
    }

    if (parents.length === 0) return;

    // Create parent-student links
    const links = parents.map(parent => ({
        school_id: schoolId,
        parent_id: parent.id,
        student_id: studentId,
        relationship: 'parent'
    }));

    const { error: linkError } = await supabase
        .from('parent_student_links')
        .upsert(links, { onConflict: 'parent_id,student_id' });

    if (linkError) {
        console.error('Error creating parent-student links:', linkError);
        throw new Error('Failed to link student to parents');
    }
}

/**
 * Create a student account with auth user
 */
export interface CreateStudentAccountResult {
    admissionNumber: string;
    studentId: string;
    docId: string;
    message: string;
    warning?: string;
    tempPassword?: string;
}

export async function createStudentAccount(
    schoolId: string,
    adminId: string,
    data: CreateStudentParams
): Promise<CreateStudentAccountResult> {
    const admissionNumber = data.admissionNumber || generateAdmissionNumber(schoolId);
    const email = data.email || getVirtualEmail(schoolId, admissionNumber);
    const tempPassword = generateTemporaryPassword();
    
    try {
        // 1. Generate deterministic student ID
        const studentId = await generateDeterministicUUID(schoolId, admissionNumber);

        // 2. Prepare user data for the RPC call
        const userData = {
            id: studentId,
            email: email,
            password: tempPassword,
            user_metadata: {
                full_name: data.fullName,
                role: 'student',
                schoolId: schoolId,
                admission_number: admissionNumber,
                phone_number: data.phoneNumber || null
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

        // 4. Assign to class if specified
        if (data.classId) {
            await assignStudentToClass(schoolId, studentId, data.classId);
        }

        // 5. Link to parents if provided
        if (data.parentEmails && data.parentEmails.length > 0) {
            await linkStudentToParents(schoolId, studentId, data.parentEmails);
        }

        // 6. Log the action
        await logAction(
            schoolId, 
            adminId, 
            'System', // User name - in a real app, you might want to fetch this from the admin user
            'create', 
            'student',
            studentId,
            {
                admissionNumber,
                fullName: data.fullName,
                email: email
            },
            { 
                timestamp: new Date().toISOString(),
                admissionNumber
            }
        );

        const result: CreateStudentAccountResult = {
            admissionNumber: admissionNumber,
            studentId: userData.id,
            docId: userData.id,
            message: `Student account created successfully. Login with email: ${email} and temporary password.`,
            tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined
        };

        return result;
    } catch (err) {
        console.error('Error creating student:', err);
        throw err;
    }
};

/**
 * Helper function to assign a student to a class
 */
async function assignStudentToClass(schoolId: string, studentId: string, classId: string) {
    const { error: classError } = await supabase
        .from('student_classes')
        .upsert({
            student_id: studentId,
            class_id: classId,
            school_id: schoolId,
            enrollment_date: new Date().toISOString().split('T')[0],
            status: 'active'
        }, { onConflict: 'student_id,class_id' });

    if (classError) {
        console.error('Failed to assign student to class:', classError);
        throw new Error(`Failed to assign student to class: ${classError.message}`);
    }
}
