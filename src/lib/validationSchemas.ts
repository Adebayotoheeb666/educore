/**
 * Zod validation schemas for all critical API inputs.
 * Used to validate data before sending to Supabase or Edge Functions.
 * Prevents injection attacks and data integrity issues.
 */

import { z } from "zod";

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

export const SchoolRegistrationSchema = z.object({
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain uppercase, lowercase, number, and special character"
  ),
  adminFullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  schoolName: z.string().min(2, "School name must be at least 2 characters").max(200),
  schoolAddress: z.string().min(5, "Address must be at least 5 characters").max(500),
  schoolPhone: z.string().regex(/^\+?[\d\s\-()]{10,}$/, "Invalid phone number").optional(),
  schoolEmail: z.string().email("Invalid email").optional(),
});

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Identifier required"), // admission number, staff ID, or email
  password: z.string().min(1, "Password required"),
  loginType: z.enum(["student", "staff", "admin", "parent"]),
});

export const PhoneOTPSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[\d\s\-()]{10,}$/, "Invalid phone number"),
});

export const VerifyOTPSchema = z.object({
  phoneNumber: z.string(),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});

// ============================================
// STAFF MANAGEMENT SCHEMAS
// ============================================

export const StaffCreationSchema = z.object({
  firstName: z.string().min(2, "First name required").max(100),
  lastName: z.string().min(2, "Last name required").max(100),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().regex(/^\+?[\d\s\-()]{10,}$/, "Invalid phone number").optional().or(z.literal("")),
  staffId: z.string().min(1, "Staff ID required").max(50),
  department: z.string().optional(),
  role: z.enum(["staff", "admin", "bursar"]),
});

export const StaffAssignmentSchema = z.object({
  staffId: z.string().uuid("Invalid staff ID"),
  classIds: z.array(z.string().uuid("Invalid class ID")).min(1, "At least one class required"),
  subjectIds: z.array(z.string().uuid("Invalid subject ID")).min(1, "At least one subject required"),
  startDate: z.string().datetime("Invalid date format"),
  endDate: z.string().datetime("Invalid date format").optional(),
});

// ============================================
// STUDENT MANAGEMENT SCHEMAS
// ============================================

export const StudentCreationSchema = z.object({
  firstName: z.string().min(2, "First name required").max(100),
  lastName: z.string().min(2, "Last name required").max(100),
  admissionNumber: z.string().min(1, "Admission number required").max(50).regex(/^[A-Z0-9\-_]+$/i, "Invalid admission number format"),
  dateOfBirth: z.string().date("Invalid date format"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().regex(/^\+?[\d\s\-()]{10,}$/, "Invalid phone number").optional().or(z.literal("")),
  classId: z.string().uuid("Invalid class ID"),
  parentPhoneNumbers: z.array(z.string().regex(/^\+?[\d\s\-()]{10,}$/, "Invalid phone number")).optional(),
});

export const BulkStudentImportSchema = z.object({
  file: z.instanceof(File).refine((file) => file.type === "text/csv", "File must be CSV"),
  schoolId: z.string().uuid("Invalid school ID"),
  overwrite: z.boolean().optional(),
});

export const StudentAssignmentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  classId: z.string().uuid("Invalid class ID"),
  enrollmentDate: z.string().date("Invalid date format"),
  status: z.enum(["active", "graduated", "transferred", "dropped"]),
});

// ============================================
// CLASS & SUBJECT SCHEMAS
// ============================================

export const ClassCreationSchema = z.object({
  name: z.string().min(2, "Class name required").max(100),
  level: z.string().min(1, "Level required").max(100),
  classTeacherId: z.string().uuid("Invalid class teacher ID").optional(),
  capacity: z.number().int().positive("Capacity must be positive").optional(),
});

export const SubjectCreationSchema = z.object({
  name: z.string().min(2, "Subject name required").max(100),
  code: z.string().min(1, "Subject code required").max(20),
  description: z.string().max(500).optional(),
});

// ============================================
// ACADEMIC SCHEMAS
// ============================================

export const GradeEntrySchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  classId: z.string().uuid("Invalid class ID"),
  caScore: z.number().min(0).max(100, "CA score must be between 0-100"),
  examScore: z.number().min(0).max(100, "Exam score must be between 0-100"),
  term: z.string().min(1, "Term required"),
  session: z.string().regex(/^\d{4}\/\d{4}$/, "Session format: YYYY/YYYY"),
});

export const AttendanceRecordSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  classId: z.string().uuid("Invalid class ID"),
  date: z.string().date("Invalid date format"),
  status: z.enum(["present", "absent", "late", "excused"]),
  remarks: z.string().max(500).optional(),
});

export const BulkAttendanceSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  date: z.string().date("Invalid date format"),
  records: z.array(
    z.object({
      studentId: z.string().uuid("Invalid student ID"),
      status: z.enum(["present", "absent", "late", "excused"]),
    })
  ),
});

// ============================================
// AI/GEMINI SCHEMAS
// ============================================

export const LessonGenerationSchema = z.object({
  topic: z.string().min(2, "Topic required").max(200),
  subject: z.string().min(1, "Subject required").max(100),
  level: z.string().min(1, "Level required").max(100),
  personalization: z.enum(["advanced", "standard", "support"]).optional(),
  translation: z.boolean().optional(),
  waecFocus: z.boolean().optional(),
});

export const QuestionGenerationSchema = z.object({
  context: z.string().min(10, "Context must be at least 10 characters").max(5000),
  count: z.number().int().min(1).max(50).default(10),
  mcqRatio: z.number().min(0).max(1).default(0.6),
  difficultyLevel: z.number().min(0).max(100).default(50),
});

export const ScriptGradingSchema = z.object({
  imageBase64: z.string().regex(/^data:image\//, "Must be a valid base64 image"),
  markingScheme: z.string().min(10, "Marking scheme required").max(2000),
  studentName: z.string().optional(),
});

export const StudyAssistantChatSchema = z.object({
  message: z.string().min(1, "Message required").max(1000),
  history: z.array(
    z.object({
      role: z.enum(["user", "model"]),
      content: z.string(),
    })
  ).optional(),
  studentContext: z.string().max(500).optional(),
});

// ============================================
// FINANCIAL SCHEMAS
// ============================================

export const FeePaymentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description required").max(200),
  paymentMethod: z.enum(["card", "bank_transfer", "wallet"]),
  reference: z.string().optional(),
});

export const WalletFundingSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description required").max(200),
});

// ============================================
// TERM MANAGEMENT SCHEMAS
// ============================================

export const TermCreationSchema = z.object({
  name: z.string().min(2, "Term name required").max(100),
  startDate: z.string().date("Invalid start date"),
  endDate: z.string().date("Invalid end date"),
  gradeScale: z.record(z.array(z.number()).length(2)).optional(),
});

export const TermUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// PARENT LINKING SCHEMAS
// ============================================

export const ParentStudentLinkSchema = z.object({
  parentPhoneNumbers: z.array(z.string().regex(/^\+?[\d\s\-()]{10,}$/, "Invalid phone number")),
  studentId: z.string().uuid("Invalid student ID"),
  relationship: z.enum(["Father", "Mother", "Guardian", "Other"]),
});

// ============================================
// NOTIFICATION & MESSAGE SCHEMAS
// ============================================

export const NotificationSchema = z.object({
  title: z.string().min(1, "Title required").max(100),
  message: z.string().min(1, "Message required").max(1000),
  type: z.enum(["info", "success", "warning", "error"]),
  recipientIds: z.array(z.string().uuid("Invalid user ID")).optional(),
});

export const MessageSchema = z.object({
  recipientId: z.string().uuid("Invalid recipient ID"),
  subject: z.string().min(1, "Subject required").max(200),
  message: z.string().min(1, "Message required").max(5000),
  attachmentUrl: z.string().url("Invalid URL").optional(),
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Safely parse and validate data against a schema.
 * Returns { success: true, data } or { success: false, errors }
 */
export async function validateInput<T>(schema: z.ZodSchema, data: unknown): Promise<
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> }
> {
  try {
    const result = await schema.parseAsync(data);
    return { success: true, data: result as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: "Validation failed" } };
  }
}

/**
 * Throw error if validation fails (for non-optional flows)
 */
export function parseInput<T>(schema: z.ZodSchema, data: unknown): T {
  return schema.parse(data) as T;
}
