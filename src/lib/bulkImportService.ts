import { supabase } from './supabase';
import { logAction } from './auditService';
import { v4 as uuidv4 } from 'uuid';

export interface StudentImportRow {
    admissionNumber: string;
    fullName: string;
    email?: string;
    className?: string; // Class to enroll student in
    parentPhone?: string; // Parent contact number
    parentName?: string;
    parentEmail?: string;
}

export interface ImportResult {
    success: boolean;
    totalRows: number;
    imported: number;
    failed: number;
    errors: Array<{
        row: number;
        admissionNumber?: string;
        error: string;
    }>;
}


/**
 * Parse CSV file and extract student data
 */
export const parseCSVFile = async (file: File): Promise<StudentImportRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    reject(new Error('CSV file must have at least a header and one data row'));
                    return;
                }

                // Parse header
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const requiredFields = ['admissionnumber', 'fullname'];
                const missingFields = requiredFields.filter(field => !headers.includes(field));

                if (missingFields.length > 0) {
                    reject(new Error(`Missing required columns: ${missingFields.join(', ')}`));
                    return;
                }

                // Parse data rows
                const rows: StudentImportRow[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    if (values[0] === '') continue; // Skip empty rows

                    const row: StudentImportRow = {
                        admissionNumber: values[headers.indexOf('admissionnumber')] || '',
                        fullName: values[headers.indexOf('fullname')] || '',
                        email: values[headers.indexOf('email')] || undefined,
                        className: values[headers.indexOf('class') || headers.indexOf('classname')] || undefined,
                        parentPhone: values[headers.indexOf('parentphone') || headers.indexOf('phone')] || undefined,
                        parentName: values[headers.indexOf('parentname')] || undefined,
                        parentEmail: values[headers.indexOf('parentemail')] || undefined,
                    };

                    rows.push(row);
                }

                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

/**
 * Validate parsed student data
 */
export const validateStudentData = (rows: StudentImportRow[]): { valid: boolean; errors: Array<{ row: number; error: string }> } => {
    const errors: Array<{ row: number; error: string }> = [];
    const seenAdmissionNumbers = new Set<string>();

    rows.forEach((row, index) => {
        const rowNum = index + 2; // +2 because header is row 1

        // Check admission number
        if (!row.admissionNumber) {
            errors.push({ row: rowNum, error: 'Admission number is required' });
            return;
        }

        if (row.admissionNumber.length < 3) {
            errors.push({ row: rowNum, error: 'Admission number must be at least 3 characters' });
        }

        if (seenAdmissionNumbers.has(row.admissionNumber)) {
            errors.push({ row: rowNum, error: 'Duplicate admission number in file' });
        }
        seenAdmissionNumbers.add(row.admissionNumber);

        // Check full name
        if (!row.fullName || row.fullName.length < 2) {
            errors.push({ row: rowNum, error: 'Full name is required (min 2 characters)' });
        }

        // Check email format if provided
        if (row.email && !row.email.includes('@')) {
            errors.push({ row: rowNum, error: 'Invalid email format' });
        }

        // Check parent phone format if provided
        if (row.parentPhone && row.parentPhone.length < 10) {
            errors.push({ row: rowNum, error: 'Parent phone number too short' });
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Generate a temporary password
 */
const generateTempPassword = (): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    const all = uppercase + lowercase + numbers;
    for (let i = 0; i < 8; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Import students in bulk into Supabase
 */
export const bulkImportStudents = async (
    rows: StudentImportRow[],
    schoolId: string,
    createParents: boolean = false,
    currentUserId?: string,
    currentUserName?: string
): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        totalRows: rows.length,
        imported: 0,
        failed: 0,
        errors: []
    };

    // Validate data first
    const validation = validateStudentData(rows);
    if (!validation.valid) {
        result.errors = validation.errors;
        return result;
    }

    try {
        // 0. Fetch classes for this school to map names to IDs
        const { data: classesData } = await supabase
            .from('classes')
            .select('id, name')
            .eq('school_id', schoolId);

        const classMap = new Map<string, string>();
        if (classesData) {
            classesData.forEach(c => classMap.set(c.name.toLowerCase().trim(), c.id));
        }

        // Process students one by one to create auth accounts and profiles
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const admissionNum = row.admissionNumber.trim().toLowerCase();
            const tempPassword = generateTempPassword();

            try {
                // 1. Create student auth user and profile via edge function
                const studentEmail = row.email || `student_${admissionNum}@${schoolId}.educore.app`;
                const studentResponse = await fetch(
                    `${supabase.supabaseUrl}/functions/v1/create-bulk-users`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
                        },
                        body: JSON.stringify({
                            email: studentEmail,
                            password: tempPassword,
                            user_metadata: {
                                full_name: row.fullName,
                                role: 'student',
                                school_id: schoolId
                            }
                        })
                    }
                );

                const studentResponseData = await studentResponse.json();

                if (!studentResponse.ok) {
                    result.failed++;
                    result.errors.push({
                        row: i + 2,
                        admissionNumber: row.admissionNumber,
                        error: `Failed to create student account: ${studentResponseData.error}`
                    });
                    continue;
                }

                if (!studentResponseData.id) {
                    result.failed++;
                    result.errors.push({
                        row: i + 2,
                        admissionNumber: row.admissionNumber,
                        error: 'Failed to create student account: Unknown error'
                    });
                    continue;
                }

                const studentId = studentResponseData.id;

                // Update student profile with admission number
                await supabase
                    .from('users')
                    .update({ admission_number: row.admissionNumber.trim() })
                    .eq('id', studentId);

                // 2. Create parent if requested
                if (createParents && (row.parentEmail || row.parentPhone)) {
                    const parentTempPassword = generateTempPassword();
                    const parentEmail = row.parentEmail || `parent_${admissionNum}@${schoolId}.educore.app`;

                    const parentResponse = await fetch(
                        `${supabase.supabaseUrl}/functions/v1/create-bulk-users`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
                            },
                            body: JSON.stringify({
                                email: parentEmail,
                                password: parentTempPassword,
                                user_metadata: {
                                    full_name: row.parentName || `Parent of ${row.fullName}`,
                                    role: 'parent',
                                    school_id: schoolId
                                }
                            })
                        }
                    );

                    const parentResponseData = await parentResponse.json();

                    if (parentResponse.ok && parentResponseData.id) {
                        const parentId = parentResponseData.id;

                        // Link parent to student
                        await supabase
                            .from('parent_student_links')
                            .upsert({
                                school_id: schoolId,
                                parent_id: parentId,
                                student_id: studentId,
                                relationship: 'Guardian'
                            }, { onConflict: 'parent_id,student_id' });
                    }
                }

                // 4. Record class enrollment if provided
                if (row.className) {
                    const classId = classMap.get(row.className.trim().toLowerCase());
                    if (classId) {
                        try {
                            // Check if enrollment already exists
                            const { data: existing } = await supabase
                                .from('student_classes')
                                .select('id')
                                .eq('student_id', studentId)
                                .eq('class_id', classId)
                                .maybeSingle();

                            if (existing) {
                                // Update existing enrollment
                                await supabase
                                    .from('student_classes')
                                    .update({
                                        status: 'active',
                                        enrollment_date: new Date().toISOString().split('T')[0],
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', existing.id);
                            } else {
                                // Insert new enrollment
                                await supabase
                                    .from('student_classes')
                                    .insert([{
                                        school_id: schoolId,
                                        student_id: studentId,
                                        class_id: classId,
                                        enrollment_date: new Date().toISOString().split('T')[0],
                                        status: 'active'
                                    }]);
                            }
                        } catch (enrollError) {
                            result.errors.push({
                                row: i + 2,
                                admissionNumber: row.admissionNumber,
                                error: `Class enrollment failed: ${enrollError instanceof Error ? enrollError.message : 'Unknown error'}`
                            });
                        }
                    } else {
                        result.errors.push({
                            row: i + 2,
                            admissionNumber: row.admissionNumber,
                            error: `Class not found: ${row.className}`
                        });
                    }
                }

                result.imported++;
            } catch (error) {
                result.failed++;
                result.errors.push({
                    row: i + 2,
                    admissionNumber: row.admissionNumber,
                    error: `Error creating student: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }

        result.success = result.failed === 0;

        // Log the bulk import action
        if (currentUserId && currentUserName) {
            await logAction(
                schoolId,
                currentUserId,
                currentUserName,
                'import',
                'student',
                undefined,
                undefined,
                {
                    totalRows: result.totalRows,
                    imported: result.imported,
                    failed: result.failed,
                    createParents
                }
            );
        }

        return result;
    } catch (error) {
        result.success = false;
        result.errors.push({
            row: 0,
            error: `Bulk import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        return result;
    }
};


/**
 * Generate CSV template for students
 */
export const generateStudentCSVTemplate = (): string => {
    const headers = [
        'AdmissionNumber',
        'FullName',
        'Email',
        'Class',
        'ParentPhone',
        'ParentName',
        'ParentEmail'
    ];

    const sampleData = [
        ['ADM001', 'John Doe', 'john@example.com', 'SS1A', '+234 810 123 4567', 'Mr. Doe', 'dad@example.com'],
        ['ADM002', 'Jane Smith', 'jane@example.com', 'SS1A', '+234 810 234 5678', 'Mrs. Smith', 'mom@example.com'],
        ['ADM003', 'Peter Johnson', 'peter@example.com', 'SS1B', '+234 810 345 6789', 'Mr. Johnson', 'father@example.com']
    ];

    const rows = [
        headers.join(','),
        ...sampleData.map(row => row.join(','))
    ];

    return rows.join('\n');
};

/**
 * Download CSV template
 */
export const downloadCSVTemplate = () => {
    const csv = generateStudentCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-import-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
};
