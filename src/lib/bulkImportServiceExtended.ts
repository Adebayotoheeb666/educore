import { supabase } from './supabase';
import { logAction } from './auditService';
import { v4 as uuidv4 } from 'uuid';

export interface StaffImportRow {
    staffId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role?: string;
    department?: string;
}

export interface ParentImportRow {
    fullName: string;
    email: string;
    phoneNumber: string;
    address?: string;
    studentIds?: string; // Comma-separated list of student admission numbers
}

export interface ClassImportRow {
    name: string;
    level: string;
    section?: string;
    academicYear?: string;
    classTeacherId?: string;
    capacity?: number;
}

export interface SubjectImportRow {
    name: string;
    code: string;
    description?: string;
    teacherId?: string;
    classLevels?: string; // Comma-separated list of class levels
}

export interface ImportResult {
    success: boolean;
    totalRows: number;
    imported: number;
    failed: number;
    errors: Array<{
        row: number;
        identifier?: string;
        error: string;
    }>;
}

// Re-export student types from the original service
export * from './bulkImportService';

/**
 * Parse CSV text and extract data
 */
export const parseCSVText = <T>(text: string, requiredFields: string[]): { headers: string[], rows: T[] } => {
    try {
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const missingFields = requiredFields.filter(field => !headers.includes(field.toLowerCase()));

        if (missingFields.length > 0) {
            throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
        }

        // Parse data rows
        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values[0] === '') continue; // Skip empty rows

            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }

        return { headers, rows };
    } catch (error) {
        throw error;
    }
};

/**
 * Parse CSV file and extract data for any entity type
 */
export const parseCSVFileGeneric = async <T>(file: File, requiredFields: string[]): Promise<{ headers: string[], rows: T[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const result = parseCSVText<T>(text, requiredFields);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

/**
 * Validate staff import rows
 */
const validateStaffRows = (rows: any[]): { valid: StaffImportRow[], errors: Array<{ row: number, error: string }> } => {
    const valid: StaffImportRow[] = [];
    const errors: Array<{ row: number, error: string }> = [];

    rows.forEach((row, index) => {
        const rowNum = index + 2; // +2 for header + 1-based indexing

        if (!row.staffid?.trim()) {
            errors.push({ row: rowNum, error: 'StaffID is required' });
            return;
        }
        if (!row.fullname?.trim()) {
            errors.push({ row: rowNum, error: 'FullName is required' });
            return;
        }
        if (!row.email?.trim()) {
            errors.push({ row: rowNum, error: 'Email is required' });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email.trim())) {
            errors.push({ row: rowNum, error: `Invalid email format: ${row.email}` });
            return;
        }

        valid.push({
            staffId: row.staffid.trim(),
            fullName: row.fullname.trim(),
            email: row.email.trim().toLowerCase(),
            phoneNumber: row.phonenumber?.trim(),
            role: row.role?.trim() || 'teacher',
            department: row.department?.trim()
        });
    });

    return { valid, errors };
};

/**
 * Validate parent import rows
 */
const validateParentRows = (rows: any[]): { valid: ParentImportRow[], errors: Array<{ row: number, error: string }> } => {
    const valid: ParentImportRow[] = [];
    const errors: Array<{ row: number, error: string }> = [];

    rows.forEach((row, index) => {
        const rowNum = index + 2;

        if (!row.fullname?.trim()) {
            errors.push({ row: rowNum, error: 'FullName is required' });
            return;
        }
        if (!row.email?.trim()) {
            errors.push({ row: rowNum, error: 'Email is required' });
            return;
        }
        if (!row.phonenumber?.trim()) {
            errors.push({ row: rowNum, error: 'PhoneNumber is required' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email.trim())) {
            errors.push({ row: rowNum, error: `Invalid email format: ${row.email}` });
            return;
        }

        valid.push({
            fullName: row.fullname.trim(),
            email: row.email.trim().toLowerCase(),
            phoneNumber: row.phonenumber.trim(),
            address: row.address?.trim(),
            studentIds: row.studentids?.trim()
        });
    });

    return { valid, errors };
};

/**
 * Validate class import rows
 */
const validateClassRows = (rows: any[]): { valid: ClassImportRow[], errors: Array<{ row: number, error: string }> } => {
    const valid: ClassImportRow[] = [];
    const errors: Array<{ row: number, error: string }> = [];

    rows.forEach((row, index) => {
        const rowNum = index + 2;

        if (!row.name?.trim()) {
            errors.push({ row: rowNum, error: 'Name is required' });
            return;
        }
        if (!row.level?.trim()) {
            errors.push({ row: rowNum, error: 'Level is required' });
            return;
        }

        valid.push({
            name: row.name.trim(),
            level: row.level.trim(),
            section: row.section?.trim(),
            academicYear: row.academicyear?.trim(),
            classTeacherId: row.classteacherid?.trim(),
            capacity: row.capacity ? parseInt(row.capacity) : undefined
        });
    });

    return { valid, errors };
};

/**
 * Validate subject import rows
 */
const validateSubjectRows = (rows: any[]): { valid: SubjectImportRow[], errors: Array<{ row: number, error: string }> } => {
    const valid: SubjectImportRow[] = [];
    const errors: Array<{ row: number, error: string }> = [];

    rows.forEach((row, index) => {
        const rowNum = index + 2;

        if (!row.name?.trim()) {
            errors.push({ row: rowNum, error: 'Name is required' });
            return;
        }
        if (!row.code?.trim()) {
            errors.push({ row: rowNum, error: 'Code is required' });
            return;
        }

        valid.push({
            name: row.name.trim(),
            code: row.code.trim(),
            description: row.description?.trim(),
            teacherId: row.teacherid?.trim(),
            classLevels: row.classlevels?.trim()
        });
    });

    return { valid, errors };
};

/**
 * Bulk import staff members
 */
export const bulkImportStaff = async (
    csvText: string,
    schoolId: string,
    currentUserId?: string,
    currentUserName?: string
): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        totalRows: 0,
        imported: 0,
        failed: 0,
        errors: []
    };

    try {
        // Parse CSV
        const { rows: parsedRows } = parseCSVText<any>(
            csvText,
            ['staffid', 'fullname', 'email']
        );

        result.totalRows = parsedRows.length;

        // Validate rows
        const { valid, errors: validationErrors } = validateStaffRows(parsedRows);
        result.errors = validationErrors;
        result.failed = validationErrors.length;

        if (valid.length === 0) {
            result.success = false;
            return result;
        }

        // Process in batches
        const batchSize = 50;

        for (let i = 0; i < valid.length; i += batchSize) {
            const batch = valid.slice(i, i + batchSize);
            const usersToInsert: any[] = [];

            for (const row of batch) {
                const staffId = row.staffId.toLowerCase();
                const userId = `staff_${schoolId}_${staffId}`;

                usersToInsert.push({
                    id: userId,
                    staff_id: staffId,
                    full_name: row.fullName,
                    email: row.email,
                    phone_number: row.phoneNumber,
                    role: row.role,
                    department: row.department,
                    school_id: schoolId
                });
            }

            // Insert batch
            const { error } = await supabase
                .from('users')
                .upsert(usersToInsert, { onConflict: 'email,staff_id' });

            if (error) {
                result.failed += batch.length;
                result.errors.push({
                    row: i + 2,
                    error: `Failed to import batch: ${error.message}`
                });
            } else {
                result.imported += batch.length;
            }
        }

        result.success = result.failed === validationErrors.length; // Only validation errors

        // Log the import
        if (currentUserId && currentUserName) {
            await logAction(
                schoolId,
                currentUserId,
                currentUserName,
                'import',
                'staff',
                undefined,
                undefined,
                {
                    totalRows: result.totalRows,
                    imported: result.imported,
                    failed: result.failed
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
 * Bulk import parents
 */
export const bulkImportParents = async (
    csvText: string,
    schoolId: string,
    currentUserId?: string,
    currentUserName?: string
): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        totalRows: 0,
        imported: 0,
        failed: 0,
        errors: []
    };

    try {
        // Parse CSV
        const { rows: parsedRows } = parseCSVText<any>(
            csvText,
            ['fullname', 'email', 'phonenumber']
        );

        result.totalRows = parsedRows.length;

        // Validate rows
        const { valid, errors: validationErrors } = validateParentRows(parsedRows);
        result.errors = validationErrors;
        result.failed = validationErrors.length;

        if (valid.length === 0) {
            result.success = false;
            return result;
        }

        // Get all students for linking
        const { data: students } = await supabase
            .from('users')
            .select('id, admission_number')
            .eq('school_id', schoolId)
            .eq('role', 'student');

        const studentMap = new Map(students?.map(s => [s.admission_number?.toLowerCase(), s.id]) || []);

        // Process in batches
        const batchSize = 50;

        for (let i = 0; i < valid.length; i += batchSize) {
            const batch = valid.slice(i, i + batchSize);
            const parentsToInsert: any[] = [];
            const linksToInsert: any[] = [];

            for (const row of batch) {
                const parentId = `parent_${uuidv4()}`;

                parentsToInsert.push({
                    id: parentId,
                    full_name: row.fullName,
                    email: row.email,
                    phone_number: row.phoneNumber,
                    address: row.address,
                    role: 'parent',
                    school_id: schoolId
                });

                // Handle student links if provided
                if (row.studentIds) {
                    const studentIds = row.studentIds.split(',').map(id => id.trim().toLowerCase());
                    for (const studentId of studentIds) {
                        const studentUid = studentMap.get(studentId);
                        if (studentUid) {
                            linksToInsert.push({
                                school_id: schoolId,
                                parent_id: parentId,
                                student_id: studentUid,
                                relationship: 'Guardian'
                            });
                        }
                    }
                }
            }

            // Insert parents
            const { error: parentError } = await supabase
                .from('users')
                .upsert(parentsToInsert, { onConflict: 'email' });

            if (parentError) {
                result.failed += batch.length;
                result.errors.push({
                    row: i + 2,
                    error: `Failed to import parents: ${parentError.message}`
                });
                continue;
            }

            // Insert parent-student links if any
            if (linksToInsert.length > 0) {
                await supabase
                    .from('parent_student_links')
                    .upsert(linksToInsert, { onConflict: 'parent_id,student_id' });
            }

            result.imported += batch.length;
        }

        result.success = result.failed === validationErrors.length;

        // Log the import
        if (currentUserId && currentUserName) {
            await logAction(
                schoolId,
                currentUserId,
                currentUserName,
                'import',
                'parent',
                undefined,
                undefined,
                {
                    totalRows: result.totalRows,
                    imported: result.imported,
                    failed: result.failed
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
 * Bulk import classes
 */
export const bulkImportClasses = async (
    csvText: string,
    schoolId: string,
    currentUserId?: string,
    currentUserName?: string
): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        totalRows: 0,
        imported: 0,
        failed: 0,
        errors: []
    };

    try {
        // Parse CSV
        const { rows: parsedRows } = parseCSVText<any>(
            csvText,
            ['name', 'level']
        );

        result.totalRows = parsedRows.length;

        // Validate rows
        const { valid, errors: validationErrors } = validateClassRows(parsedRows);
        result.errors = validationErrors;
        result.failed = validationErrors.length;

        if (valid.length === 0) {
            result.success = false;
            return result;
        }

        // Get all staff for class teacher mapping
        const { data: staff } = await supabase
            .from('users')
            .select('id, staff_id')
            .eq('school_id', schoolId)
            .in('role', ['teacher', 'admin']);

        const staffMap = new Map(staff?.map(s => [s.staff_id?.toLowerCase(), s.id]) || []);

        // Process in batches
        const batchSize = 50;
        const classesToInsert: any[] = [];

        for (let i = 0; i < valid.length; i++) {
            const row = valid[i];

            // Map class teacher ID if provided
            let classTeacherId = null;
            if (row.classTeacherId) {
                classTeacherId = staffMap.get(row.classTeacherId.toLowerCase());
                if (!classTeacherId) {
                    result.failed++;
                    result.errors.push({
                        row: i + 2,
                        identifier: row.name,
                        error: `Class teacher not found: ${row.classTeacherId}`
                    });
                    continue;
                }
            }

            classesToInsert.push({
                id: `class_${uuidv4()}`,
                name: row.name,
                level: row.level,
                section: row.section,
                academic_year: row.academicYear,
                class_teacher_id: classTeacherId,
                capacity: row.capacity,
                school_id: schoolId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }

        // Insert classes in batches
        for (let i = 0; i < classesToInsert.length; i += batchSize) {
            const batch = classesToInsert.slice(i, i + batchSize);
            const { error } = await supabase
                .from('classes')
                .upsert(batch, { onConflict: 'name,level,school_id' });

            if (error) {
                result.failed += batch.length;
                result.errors.push({
                    row: i + 2,
                    error: `Failed to import classes: ${error.message}`
                });
            } else {
                result.imported += batch.length;
            }
        }

        result.success = result.failed === validationErrors.length;

        // Log the import
        if (currentUserId && currentUserName) {
            await logAction(
                schoolId,
                currentUserId,
                currentUserName,
                'import',
                'class',
                undefined,
                undefined,
                {
                    totalRows: result.totalRows,
                    imported: result.imported,
                    failed: result.failed
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
 * Bulk import subjects
 */
export const bulkImportSubjects = async (
    csvText: string,
    schoolId: string,
    currentUserId?: string,
    currentUserName?: string
): Promise<ImportResult> => {
    const result: ImportResult = {
        success: false,
        totalRows: 0,
        imported: 0,
        failed: 0,
        errors: []
    };

    try {
        // Parse CSV
        const { rows: parsedRows } = parseCSVText<any>(
            csvText,
            ['name', 'code']
        );

        result.totalRows = parsedRows.length;

        // Validate rows
        const { valid, errors: validationErrors } = validateSubjectRows(parsedRows);
        result.errors = validationErrors;
        result.failed = validationErrors.length;

        if (valid.length === 0) {
            result.success = false;
            return result;
        }

        // Get all teachers for subject teacher mapping
        const { data: teachers } = await supabase
            .from('users')
            .select('id, staff_id')
            .eq('school_id', schoolId)
            .eq('role', 'teacher');

        const teacherMap = new Map(teachers?.map(t => [t.staff_id?.toLowerCase(), t.id]) || []);

        // Process in batches
        const batchSize = 50;
        const subjectsToInsert: any[] = [];

        for (let i = 0; i < valid.length; i++) {
            const row = valid[i];

            // Map teacher ID if provided
            let teacherId = null;
            if (row.teacherId) {
                teacherId = teacherMap.get(row.teacherId.toLowerCase());
                if (!teacherId) {
                    result.failed++;
                    result.errors.push({
                        row: i + 2,
                        identifier: row.name,
                        error: `Teacher not found: ${row.teacherId}`
                    });
                    continue;
                }
            }

            subjectsToInsert.push({
                id: `subject_${uuidv4()}`,
                name: row.name,
                code: row.code.toUpperCase(),
                description: row.description,
                teacher_id: teacherId,
                class_levels: row.classLevels?.split(',').map(l => l.trim()).filter(Boolean) || [],
                school_id: schoolId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }

        // Insert subjects in batches
        for (let i = 0; i < subjectsToInsert.length; i += batchSize) {
            const batch = subjectsToInsert.slice(i, i + batchSize);
            const { error } = await supabase
                .from('subjects')
                .upsert(batch, { onConflict: 'code,school_id' });

            if (error) {
                result.failed += batch.length;
                result.errors.push({
                    row: i + 2,
                    error: `Failed to import subjects: ${error.message}`
                });
            } else {
                result.imported += batch.length;
            }
        }

        result.success = result.failed === validationErrors.length;

        // Log the import
        if (currentUserId && currentUserName) {
            await logAction(
                schoolId,
                currentUserId,
                currentUserName,
                'import',
                'subject',
                undefined,
                undefined,
                {
                    totalRows: result.totalRows,
                    imported: result.imported,
                    failed: result.failed
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
 * Generate CSV template for staff import
 */
export const generateStaffCSVTemplate = (): string => {
    const headers = [
        'StaffID',
        'FullName',
        'Email',
        'PhoneNumber',
        'Role',
        'Department'
    ];

    const sampleData = [
        ['STF001', 'John Doe', 'john.doe@school.edu', '+1234567890', 'teacher', 'Mathematics'],
        ['STF002', 'Jane Smith', 'jane.smith@school.edu', '+1234567891', 'teacher', 'Science'],
        ['STF003', 'Admin User', 'admin@school.edu', '+1234567892', 'admin', 'Administration']
    ];

    return [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
};

/**
 * Generate CSV template for parents import
 */
export const generateParentCSVTemplate = (): string => {
    const headers = [
        'FullName',
        'Email',
        'PhoneNumber',
        'Address',
        'StudentIds'
    ];

    const sampleData = [
        ['John Parent', 'parent1@example.com', '+1234567890', '123 Main St', 'STU001,STU002'],
        ['Jane Guardian', 'parent2@example.com', '+1234567891', '456 Oak Ave', 'STU003']
    ];

    return [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
};

/**
 * Generate CSV template for classes import
 */
export const generateClassCSVTemplate = (): string => {
    const headers = [
        'Name',
        'Level',
        'Section',
        'AcademicYear',
        'ClassTeacherId',
        'Capacity'
    ];

    const sampleData = [
        ['A', 'Grade 1', 'A', '2023-2024', 'STF001', '30'],
        ['B', 'Grade 1', 'B', '2023-2024', 'STF002', '25'],
        ['A', 'Grade 2', '', '2023-2024', 'STF003', '28']
    ];

    return [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
};

/**
 * Generate CSV template for subjects import
 */
export const generateSubjectCSVTemplate = (): string => {
    const headers = [
        'Name',
        'Code',
        'Description',
        'TeacherId',
        'ClassLevels'
    ];

    const sampleData = [
        ['Mathematics', 'MATH101', 'Basic Mathematics', 'STF001', 'Grade 1,Grade 2,Grade 3'],
        ['Science', 'SCI101', 'Basic Science', 'STF002', 'Grade 1,Grade 2'],
        ['English', 'ENG101', 'English Language', 'STF003', 'Grade 1,Grade 2,Grade 3']
    ];

    const notes = [
        '# Subject Import Template',
        '# Required fields: Name, Code',
        '# Optional fields: Description, TeacherId (Staff ID), ClassLevels',
        '# TeacherId must match an existing teacher\'s StaffID',
        '# ClassLevels: comma-separated list of grades this subject applies to',
        '# Code: Use unique subject codes like MATH101, SCI101, ENG101, etc.',
        '# Do not modify or delete this header row',
        ''
    ];

    return [...notes, headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
};

/**
 * Download CSV template for a specific entity type
 */
export const downloadCSVTemplate = (type: 'staff' | 'parent' | 'class' | 'subject' | 'student') => {
    let csv = '';
    let filename = '';

    switch (type) {
        case 'staff':
            csv = generateStaffCSVTemplate();
            filename = 'staff-import-template.csv';
            break;
        case 'parent':
            csv = generateParentCSVTemplate();
            filename = 'parent-import-template.csv';
            break;
        case 'class':
            csv = generateClassCSVTemplate();
            filename = 'class-import-template.csv';
            break;
        case 'subject':
            csv = generateSubjectCSVTemplate();
            filename = 'subject-import-template.csv';
            break;
        case 'student':
        default:
            // Generate student template directly
            const studentHeaders = [
                'AdmissionNumber',
                'FullName',
                'Email',
                'Class',
                'ParentPhone',
                'ParentName',
                'ParentEmail'
            ];
            const studentSampleData = [
                ['STU001', 'John Doe', 'john@example.com', 'SS1A', '+1234567890', 'Parent Name', 'parent@example.com'],
                ['STU002', 'Jane Smith', 'jane@example.com', 'SS1B', '+1234567891', 'Parent Name', 'parent2@example.com']
            ];
            csv = [studentHeaders.join(','), ...studentSampleData.map(row => row.join(','))].join('\n');
            filename = 'student-import-template.csv';
            break;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
};
