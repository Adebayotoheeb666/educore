import { supabase } from './supabase';
import { logAction } from './auditService';
import type { UserProfile } from './types';

// Helper to generate a random password
export const generateTempPassword = (length: number = 10): string => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};

// Helper to generate Staff ID
export const generateStaffId = (schoolId: string): string => {
    // Format: STF-{SCHOOL_PREFIX}-{RANDOM}
    // Simple implementation
    const schoolPrefix = schoolId.substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    return `STF-${schoolPrefix}-${randomSuffix}`;
};

export interface CreateStaffParams {
    fullName: string;
    email: string;
    role: 'staff' | 'bursar';
    specialization?: string;
    phoneNumber?: string;
}

export const createStaffAccount = async (
    schoolId: string,
    adminId: string, // ID of admin creating the account
    data: CreateStaffParams
) => {
    const staffId = generateStaffId(schoolId);
    const tempPassword = generateTempPassword();

    // Use a random ID for the doc if we can't create Auth user yet.
    // In Supabase, usually we invite the user via email which creates the Auth user.
    // Here we simulate by inserting into users table directly with a generated ID.
    // IMPORTANT: This user won't be able to login until an Auth user with this ID exists.
    // A real implementation requires Supabase Admin API or "Invite User" flow.
    const docId = crypto.randomUUID();

    // Insert into 'users' table
    await supabase.from('users').insert({
        id: docId,
        school_id: schoolId,
        full_name: data.fullName,
        email: data.email,
        role: data.role,
        staff_id: staffId,
        phone_number: data.phoneNumber,
        assigned_subjects: data.specialization ? [data.specialization] : [], // ad-hoc mapping
        // created_at default
    });

    // Log the action
    await logAction(
        schoolId,
        adminId,
        'Admin', // We might want to pass the actual admin name
        'create',
        'staff',
        docId,
        { ...data, staffId },
        { action: 'create_staff_account' }
    );

    return {
        staffId,
        tempPassword,
        docId,
        message: "Staff account profile created. Share credentials securely."
    };
};

export const getStaffMembers = async (schoolId: string): Promise<UserProfile[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .in('role', ['staff', 'bursar', 'admin']);

    if (error) {
        console.error('Error fetching staff:', error);
        return [];
    }

    return (data || []).map(u => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        schoolId: u.school_id,
        admissionNumber: u.admission_number,
        phoneNumber: u.phone_number,
        staffId: u.staff_id,
        assignedClasses: u.assigned_classes,
        assignedSubjects: u.assigned_subjects,
        linkedStudents: u.linked_students,
        profileImage: u.profile_image,
        createdAt: u.created_at,
        updatedAt: u.updated_at
    })) as UserProfile[];
};
