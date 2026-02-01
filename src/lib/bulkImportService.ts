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

                // Generate UUIDs for the student and parent
                const studentUid = uuidv4();
                const parentUid = uuidv4();

                // Student Profile
                usersToInsert.push({
                    id: studentUid,
                    original_student_id: `student_${schoolId}_${admissionNum}`,
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
                        original_parent_id: `parent_${schoolId}_${row.parentEmail?.toLowerCase().replace(/[^a-z0-9]/g, '') || admissionNum}`,
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
                // Process enrollments one by one to handle potential duplicates
                for (const enrollment of enrollmentsToInsert) {
                    try {
                        // Check if enrollment already exists
                        const { data: existing, error: checkError } = await supabase
                            .from('student_classes')
                            .select('id')
                            .eq('student_id', enrollment.student_id)
                            .eq('class_id', enrollment.class_id)
                            .maybeSingle();

                        if (checkError) throw checkError;

                        if (existing) {
                            // Update existing enrollment
                            const { error: updateError } = await supabase
                                .from('student_classes')
                                .update({
                                    status: enrollment.status,
                                    enrollment_date: enrollment.enrollment_date,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', existing.id);

                            if (updateError) throw updateError;
                        } else {
                            // Insert new enrollment
                            const { error: insertError } = await supabase
                                .from('student_classes')
                                .insert([enrollment]);

                            if (insertError) throw insertError;
                        }
                    } catch (error) {
                        result.errors.push({ 
                            row: i, 
                            error: `Class enrollment failed for student ${enrollment.student_id}: ${error instanceof Error ? error.message : 'Unknown error'}` 
                        });
                        console.error('Enrollment error:', error);
                    }
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
