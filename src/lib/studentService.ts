import { supabase } from './supabase';

export interface CreateStudentParams {
    fullName: string;
    email: string;
    phoneNumber?: string;
    admissionNumber?: string;
    classId?: string;
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
 * Create a student account
 * Uses upsert to comply with RLS policies (bulk import uses the same pattern)
 */
export const createStudentAccount = async (
    schoolId: string,
    data: CreateStudentParams
): Promise<{ admissionNumber: string; studentId: string; message: string }> => {
    const admissionNumber = data.admissionNumber || generateAdmissionNumber(schoolId);

    try {
        // Generate deterministic student ID to match RLS expectations
        const studentId = await generateDeterministicUUID(schoolId, admissionNumber);

        // Use upsert instead of insert to comply with RLS policy
        // This matches the pattern used in bulkImportService
        const { data: userData, error: userError } = await supabase
            .from('users')
            .upsert({
                id: studentId,
                school_id: schoolId,
                email: data.email,
                full_name: data.fullName,
                role: 'student',
                admission_number: admissionNumber,
                phone_number: data.phoneNumber,
            }, { onConflict: 'id' })
            .select()
            .single();

        if (userError) {
            console.error('Student creation error:', userError);
            throw new Error(`Failed to create student account: ${userError.message}`);
        }

        if (!userData) {
            throw new Error('Student creation returned no data');
        }

        // If classId is provided, assign student to class
        if (data.classId) {
            const { error: classError } = await supabase
                .from('student_classes')
                .upsert({
                    student_id: userData.id,
                    class_id: data.classId,
                    school_id: schoolId,
                    enrollment_date: new Date().toISOString().split('T')[0],
                    status: 'active'
                }, { onConflict: 'student_id,class_id' });

            if (classError) {
                console.warn('Failed to assign student to class:', classError);
            }
        }

        return {
            admissionNumber,
            studentId: userData.id,
            message: `Student profile created successfully with admission number: ${admissionNumber}`,
        };
    } catch (err) {
        console.error('Error creating student:', err);
        throw err;
    }
};
