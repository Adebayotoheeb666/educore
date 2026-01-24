import { supabase } from './supabase';
import { logAction } from './auditService';

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
 * Generates a deterministic UUID v5-like string from a name.
 * This ensures valid UUID syntax while remaining idempotent.
 */
async function generateDeterministicUUID(name: string): Promise<string> {
    // Basic hash function to create a hex string from name
    // Using simple hashing since we just need valid UUID syntax and determinism
    const msgUint8 = new TextEncoder().encode(name);
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

        // Process students in batches
        const batchSize = 50;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);

            const usersToInsert: any[] = [];
            const parentsToInsert: any[] = [];
            const linksToInsert: any[] = [];
            const enrollmentsToInsert: any[] = [];

            for (const row of batch) {
                const admissionNum = row.admissionNumber.trim().toLowerCase();

                // Generate deterministic UIDs for the student and parent
                const studentUid = await generateDeterministicUUID(`student_${schoolId}_${admissionNum}`);
                const parentUid = await generateDeterministicUUID(`parent_${schoolId}_${admissionNum}`);

                // Student Profile
                usersToInsert.push({
                    id: studentUid,
                    full_name: row.fullName.trim(),
                    email: row.email?.trim(),
                    role: 'student',
                    school_id: schoolId,
                    admission_number: row.admissionNumber.trim()
                });

                // Parent Handling
                if (createParents && (row.parentEmail || row.parentPhone)) {

                    parentsToInsert.push({
                        id: parentUid,
                        full_name: row.parentName || `Parent of ${row.fullName}`,
                        email: row.parentEmail?.trim(),
                        phone_number: row.parentPhone?.trim(),
                        role: 'parent',
                        school_id: schoolId
                    });

                    linksToInsert.push({
                        school_id: schoolId,
                        parent_id: parentUid,
                        student_id: studentUid,
                        relationship: 'Guardian'
                    });
                }

                if (row.className) {
                    const classId = classMap.get(row.className.trim().toLowerCase());
                    if (classId) {
                        enrollmentsToInsert.push({
                            school_id: schoolId,
                            student_id: studentUid,
                            class_id: classId,
                            enrollment_date: new Date().toISOString().split('T')[0],
                            status: 'active'
                        });
                    } else {
                        result.errors.push({ row: i, error: `Class not found: ${row.className}` });
                    }
                }
            }

            // Perform Supabase Inserts (Sequential to maintain integrity if possible, or parallel)
            // Note: In a real scenario, use upsert/onConflict if re-importing is allowed.

            // 1. Insert Students
            const { error: studentError } = await supabase.from('users').upsert(usersToInsert);
            if (studentError) {
                result.failed += batch.length;
                result.errors.push({ row: i, error: `Batch student insert failed: ${studentError.message}` });
                continue;
            }

            // 2. Insert Parents
            if (parentsToInsert.length > 0) {
                const { error: parentError } = await supabase.from('users').upsert(parentsToInsert);
                if (parentError) {
                    // Log error but explicit failure not crucial if students succeeded? 
                    // Let's count as error.
                    result.errors.push({ row: i, error: `Batch parent insert failed: ${parentError.message}` });
                }
            }

            // 3. Insert Parent-Student Links
            if (linksToInsert.length > 0) {
                const { error: linkError } = await supabase.from('parent_student_links').upsert(linksToInsert, { onConflict: 'student_id,parent_id' });
                if (linkError) {
                    result.errors.push({ row: i, error: `Parent linking failed: ${linkError.message}` });
                }
            }

            // 4. Record Class Enrollments
            if (enrollmentsToInsert.length > 0) {
                const { error: enrollError } = await supabase.from('student_classes').upsert(enrollmentsToInsert, { onConflict: 'student_id,class_id' });
                if (enrollError) {
                    result.errors.push({ row: i, error: `Class enrollment failed: ${enrollError.message}` });
                }
            }

            result.imported += batch.length;
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
