import { supabase } from './supabase';

export interface CreateStudentParams {
    fullName: string;
    email: string;
    phoneNumber?: string;
    admissionNumber?: string;
    classId?: string;
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
 */
export const createStudentAccount = async (
    schoolId: string,
    data: CreateStudentParams
): Promise<{ admissionNumber: string; studentId: string; message: string }> => {
    const admissionNumber = data.admissionNumber || generateAdmissionNumber(schoolId);

    try {
        // Create student profile directly in database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                school_id: schoolId,
                email: data.email,
                full_name: data.fullName,
                role: 'student',
                admission_number: admissionNumber,
                phone_number: data.phoneNumber,
            })
            .select()
            .single();

        if (userError) {
            console.error('Student creation error:', userError);
            throw new Error(`Failed to create student account: ${userError.message}`);
        }

        // If classId is provided, assign student to class
        if (data.classId) {
            const { error: classError } = await supabase
                .from('student_classes')
                .insert({
                    student_id: userData.id,
                    class_id: data.classId,
                    school_id: schoolId,
                    enrollment_date: new Date().toISOString(),
                });

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
