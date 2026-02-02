import { supabase, supabaseUrl } from './supabase';
import { logAction } from './auditService';
import { v4 as uuidv4 } from 'uuid';

export interface StaffImportRow {
    staffId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role?: string;
}

export interface ParentImportRow {
    parentId?: string; // Optional parent ID, will be generated if not provided
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
            role: row.role?.trim() || 'teacher'
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
            parentId: row.parentid?.trim(),
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

        // Process staff one by one to create auth accounts and profiles
        for (let i = 0; i < valid.length; i++) {
            const row = valid[i];
            const staffId = row.staffId.toLowerCase();
            const tempPassword = generateTempPassword();
            const userId = uuidv4();

            try {
                // 1. Create auth user and profile via edge function (has service role)
                const response = await fetch(
                    `${supabaseUrl}/functions/v1/create-bulk-users`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: row.email,
                            password: tempPassword,
                            user_metadata: {
                                full_name: row.fullName,
                                role: row.role || 'staff',
                                school_id: schoolId,
                                staff_id: staffId
                            }
                        })
                    }
                );

                if (!response.ok && response.status === 0) {
                    // Network error or CORS issue
                    throw new Error('Network error or CORS issue - unable to reach server. Please check your connection.');
                }

                const responseData = await response.json();

                if (!response.ok) {
                    result.failed++;
                    result.errors.push({
                        row: i + 2,
                        identifier: row.staffId,
                        error: `Failed to create staff account: ${responseData.error}`
                    });
                } else if (responseData.id) {
                    result.imported++;
                } else {
                    result.failed++;
                    result.errors.push({
                        row: i + 2,
                        identifier: row.staffId,
                        error: 'Failed to create staff account: Unknown error'
                    });
                }
            } catch (error) {
                result.failed++;
                result.errors.push({
                    row: i + 2,
                    identifier: row.staffId,
                    error: `Error creating staff account: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
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

        // Process parents one by one to create auth accounts and profiles
        for (let i = 0; i < valid.length; i++) {
            const row = valid[i];
            const tempPassword = generateTempPassword();

            try {
                // 1. Create auth user and profile via edge function (has service role)
                const response = await fetch(
                    `${supabaseUrl}/functions/v1/create-bulk-users`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: row.email,
                            password: tempPassword,
                            user_metadata: {
                                full_name: row.fullName,
                                role: 'parent',
                                school_id: schoolId
                            }
                        })
                    }
                );

                const responseData = await response.json();

                if (!response.ok) {
                    result.failed++;
                    result.errors.push({
                        row: i + 2,
                        error: `Failed to create parent account: ${responseData.error}`
                    });
                    continue;
                }

                if (!responseData.id) {
                    result.failed++;
                    result.errors.push({
                        row: i + 2,
                        error: 'Failed to create parent account: Unknown error'
                    });
                    continue;
                }

                const parentId = responseData.id;

                // 2. Link to students if provided
                if (row.studentIds) {
                    const studentIds = row.studentIds.split(',').map(id => id.trim().toLowerCase());
                    for (const studentId of studentIds) {
                        const studentUid = studentMap.get(studentId);
                        if (studentUid) {
                            await supabase
                                .from('parent_student_links')
                                .upsert({
                                    school_id: schoolId,
                                    parent_id: parentId,
                                    student_id: studentUid,
                                    relationship: 'Guardian'
                                }, { onConflict: 'parent_id,student_id' });
                        }
                    }
                }

                result.imported++;
            } catch (error) {
                result.failed++;
                result.errors.push({
                    row: i + 2,
                    error: `Error creating parent account: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
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
        // Note: Using direct query in findTeacherId instead of preloading

        // Teacher lookup functionality removed as it's not used in the current implementation

        // Process in batches
        const batchSize = 50;
        const classesToInsert: any[] = [];

        for (let i = 0; i < valid.length; i++) {
            const row = valid[i];

            // Only include fields that exist in the database schema
            const classData = {
                id: uuidv4(),
                name: row.name,
                level: row.level || null, // level is nullable
                school_id: schoolId,
                teacher_id: null, // teacher_id is nullable
                created_at: new Date().toISOString()
            };
            
            console.log('Class data to be inserted:', JSON.stringify(classData, null, 2));

            classesToInsert.push(classData);
        }

        // Insert classes in batches
        for (let i = 0; i < classesToInsert.length; i += batchSize) {
            const batch = classesToInsert.slice(i, i + batchSize);
            // No need to check for teachers since we're not using class_teacher_id

            try {
                // Insert classes one by one to handle potential schema mismatches
                let successCount = 0;
                
                for (const [index, classItem] of batch.entries()) {
                    try {
                        // First, check if a class with the same name and school already exists
                        const { data: existingClass } = await supabase
                            .from('classes')
                            .select('id')
                            .eq('name', classItem.name)
                            .eq('school_id', classItem.school_id)
                            .single();

                        if (existingClass) {
                            console.log(`Class ${classItem.name} already exists, skipping...`);
                            result.imported++; // Count as imported since it already exists
                            continue;
                        }

                        // If it doesn't exist, insert the new class
                        const { error: classError } = await supabase
                            .from('classes')
                            .insert([{
                                id: classItem.id,
                                name: classItem.name,
                                level: classItem.level,
                                school_id: classItem.school_id,
                                teacher_id: null,
                                created_at: new Date().toISOString()
                            }]);
                            
                        if (classError) {
                            console.error('Insert failed:', classError);
                            throw classError;
                        }
                        
                        successCount++;
                    } catch (error) {
                        console.error('Error inserting class:', error);
                        result.errors.push({
                            row: i + index + 2, // +2 for 1-based row and header row
                            error: `Failed to import class ${classItem.name}: ${error instanceof Error ? error.message : String(error)}`
                        });
                    }
                }
                
                result.imported += successCount;
                result.failed += (batch.length - successCount);
                
            } catch (error) {
                console.error('Unexpected error during class import:', error);
                result.failed += batch.length;
                result.errors.push({
                    row: i + 2,
                    error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
                });
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

        // Get all teachers for subject teacher mapping with more fields for flexible matching
        const { data: teachers } = await supabase
            .from('users')
            .select('id, staff_id, email, full_name')
            .eq('school_id', schoolId)
            .eq('role', 'teacher');

        // Create a map with multiple lookup keys (staff_id, email, name)
        const teacherMap = new Map();
        teachers?.forEach(teacher => {
            if (teacher.staff_id) teacherMap.set(teacher.staff_id.toLowerCase(), teacher.id);
            if (teacher.email) teacherMap.set(teacher.email.toLowerCase(), teacher.id);
            if (teacher.full_name) teacherMap.set(teacher.full_name.toLowerCase(), teacher.id);
        });

        const subjectsToInsert: any[] = [];

        for (let i = 0; i < valid.length; i++) {
            const row = valid[i];

            // Map teacher ID if provided, but don't fail if not found
            let teacherId = null;
            if (row.teacherId) {
                teacherId = teacherMap.get(row.teacherId.trim().toLowerCase());
                if (!teacherId) {
                    // Don't fail, just log a warning
                    console.warn(`Teacher not found: ${row.teacherId}. Subject will be imported without a teacher.`);
                }
            }

            // Create subject data with only the fields that exist in the database
            const subjectData: any = {
                id: uuidv4(),
                name: row.name,
                code: row.code.toUpperCase(),
                school_id: schoolId,
                created_at: new Date().toISOString()
            };
            
            // Log but don't store description since the column doesn't exist
            if (row.description) {
                console.log(`Note: Description not stored for ${row.name}: ${row.description}`);
            }
            
            // Only add teacher_id if we found a valid teacher
            if (teacherId) {
                subjectData.teacher_id = teacherId;
            }
            
            // Store class levels in a separate table if needed
            // This is a placeholder for future implementation
            if (row.classLevels) {
                console.log(`Note: Class levels specified but not stored: ${row.classLevels}`);
            }
            
            subjectsToInsert.push(subjectData);
        }

        // Insert subjects one by one to handle potential duplicates
        for (let i = 0; i < subjectsToInsert.length; i++) {
            const subject = subjectsToInsert[i];
            
            try {
                // First check if subject with same code and school exists
                const { data: existing } = await supabase
                    .from('subjects')
                    .select('id')
                    .eq('code', subject.code)
                    .eq('school_id', subject.school_id)
                    .single();
                
                if (existing) {
                    // Subject exists, update it
                    const { error } = await supabase
                        .from('subjects')
                        .update({
                            name: subject.name,
                            teacher_id: subject.teacher_id,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existing.id);
                    
                    if (error) throw error;
                } else {
                    // Subject doesn't exist, insert it
                    const { error } = await supabase
                        .from('subjects')
                        .insert([subject]);
                    
                    if (error) throw error;
                }
                
                result.imported++;
            } catch (error) {
                result.failed++;
                result.errors.push({
                    row: i + 2,
                    error: `Failed to import subject ${subject.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
                console.error('Error importing subject:', error);
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
        'Role'
    ];

    const sampleData = [
        ['STF001', 'John Doe', 'john.doe@school.edu', '+1234567890', 'teacher'],
        ['STF002', 'Jane Smith', 'jane.smith@school.edu', '+1234567891', 'teacher'],
        ['STF003', 'Admin User', 'admin@school.edu', '+1234567892', 'admin']
    ];

    return [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
};

/**
 * Generate CSV template for parents import
 */
export const generateParentCSVTemplate = (): string => {
    const headers = [
        'parentId',  // Optional: Will be auto-generated if not provided
        'fullName',
        'email',
        'phoneNumber',
        'address',
        'studentIds'  // Comma-separated list of student admission numbers
    ];

    const rows = [
        ['PAR001', 'John Doe', 'john.doe@example.com', '+1234567890', '123 Main St', 'STU001,STU002'],
        ['', 'Jane Smith', 'jane.smith@example.com', '+1987654321', '456 Oak Ave', 'STU003']  // Empty parentId will be auto-generated
    ];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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
        'TeacherId'
    ];

    const sampleData = [
        ['Mathematics', 'MATH101', 'STF001'],
        ['Science', 'SCI101', 'STF002'],
        ['English', 'ENG101', 'STF003']
    ];

    return [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
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
