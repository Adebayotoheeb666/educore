/**
 * Centralized TypeScript types for all Supabase tables.
 * This ensures schema consistency across the application.
 */

// ============================================
// SCHOOL & ADMINISTRATION
// ============================================

export interface School {
  id: string; // Changed from schoolId to look consistent, or keep schoolId if that's the DB column? usage suggests schoolId usually refers to the ID of the school. In Supabase usually 'id'. keeping consistency with previous usage: schoolId might be safer for now, but usually Supabase uses 'id'. existing code might rely on 'schoolId'. I will check usage later. Let's keep schoolId for now but be aware. Actually `registerSchool` in authService uses `school.id`.
  // Wait, `authService.ts` does: `const { data: school ... } = ... .from('schools')...`. The result `school` has `id`.
  // So likely the interface should have `id`.
  // However, looking at the code, it uses `schoolId` in many places as a foreign key. 
  // For the School *object* itself, it likely has `id`.
  // The interface 'School' here seems to represent the document/row.
  // I will assume for now we keep the property names as they were unless they are strictly `uid` -> `id` for users.
  schoolId: string;
  name: string;
  address: string;
  adminUid: string; // This should probably be adminId
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Term {
  id?: string;
  schoolId: string;
  name: string; // e.g., "1st Term", "2nd Semester"
  startDate: string; // ISO format: YYYY-MM-DD
  endDate: string; // ISO format: YYYY-MM-DD
  gradeScale?: {
    [grade: string]: [number, number]; // e.g., A: [70, 100]
  };
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// USERS & ACCESS CONTROL
// ============================================

export interface UserProfile {
  id: string; // Changed from uid
  fullName: string;
  email?: string;
  role: 'admin' | 'staff' | 'student' | 'parent' | 'bursar';
  schoolId: string;
  admissionNumber?: string; // For students
  staffId?: string; // For staff
  assignedClasses?: string[]; // For staff - array of class IDs
  assignedSubjects?: string[]; // For staff - array of subject IDs
  phoneNumber?: string;
  profileImage?: string;
  linkedStudents?: string[]; // Added this as per conversation history and error in ParentPortal
  createdAt: string;
  updatedAt?: string;
}

export interface ParentStudentLink {
  id?: string;
  schoolId: string;
  parentIds: string[]; // Array of parent UIDs
  studentId: string;
  relationship: 'Father' | 'Mother' | 'Guardian' | 'Other';
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// CURRICULUM
// ============================================

export interface Class {
  id?: string;
  schoolId: string;
  name: string; // e.g., "SS1A", "Form 3B"
  level?: string; // e.g., "Secondary 1", "Form 3"
  classTeacherId?: string; // UID of class teacher
  capacity?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Subject {
  id?: string;
  schoolId: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StaffAssignment {
  id?: string;
  schoolId: string;
  staffId: string; // UID of staff member
  classId: string;
  subjectId: string;
  startDate: string; // ISO format: YYYY-MM-DD
  endDate?: string; // ISO format: YYYY-MM-DD
  createdAt: string;
  updatedAt?: string;
}

export interface StudentClass {
  id?: string;
  schoolId: string;
  studentId: string; // UID
  classId: string;
  enrollmentDate: string; // ISO format: YYYY-MM-DD
  status: 'active' | 'graduated' | 'transferred' | 'dropped';
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// ACADEMIC RECORDS
// ============================================

export interface ExamResult {
  id?: string;
  schoolId: string;
  studentId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  term: string;
  session: string; // e.g., "2025/2026"
  caScore: number; // Continuous Assessment
  examScore: number;
  totalScore: number;
  grade?: string; // Computed grade: A, B, C, etc.
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIScanResult {
  id?: string;
  schoolId: string;
  studentId?: string; // Optional - may not be identified from scan
  studentName: string; // Name written on script or entered manually
  classId?: string;
  subjectId?: string;
  teacherId: string; // UID of staff who uploaded
  score: number;
  total: number;
  feedback: string;
  missingKeywords: string[];
  ocrAccuracy: number; // 0-1 confidence score
  scriptUrl?: string; // URL to stored script image
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id?: string;
  schoolId: string;
  studentId: string;
  classId: string;
  teacherId: string;
  date: string; // ISO format: YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// INSTRUCTIONAL MATERIALS
// ============================================

export interface LessonNote {
  id?: string;
  schoolId: string;
  staffId: string; // UID of teacher
  subject: string;
  topic: string;
  level: string;
  content: string;
  generatedBy: 'gemini' | 'manual';
  archived: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ExamQuestion {
  id?: string;
  schoolId: string;
  staffId: string;
  topic?: string;
  subject?: string;
  questionText: string;
  questionType: 'mcq' | 'essay' | 'short-answer';
  options?: string[]; // For MCQ
  correctAnswer?: string | number; // Index for MCQ or text for others
  difficultyLevel: 'easy' | 'medium' | 'hard';
  marks?: number;
  generatedBy: 'gemini' | 'manual';
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// FINANCIAL
// ============================================

export interface FinancialTransaction {
  id?: string;
  schoolId: string;
  type: 'fee-payment' | 'refund' | 'wallet-funding' | 'expense';
  amount: number;
  currency: string; // e.g., "NGN"
  description: string;
  category?: string; // e.g., "School Fees", "Wallet Funding"
  studentId?: string;
  parentId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string; // Transaction reference/ID
  paymentMethod?: string; // e.g., "card", "bank_transfer"
  approvedBy?: string; // UID of approver
  items?: Array<{
    description: string;
    amount: number;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentWallet {
  id?: string;
  schoolId: string;
  studentId: string;
  balance: number;
  currency: string; // e.g., "NGN"
  lastUpdated: string;
  transactions?: string[]; // Array of transaction IDs
}

// ============================================
// AI & ANALYTICS
// ============================================

export interface StudentPerformanceInsight {
  id?: string;
  schoolId: string;
  studentId: string;
  generatedAt: string;
  attendanceRate: number;
  averageScore: number;
  strongSubjects: string[];
  weakSubjects: string[];
  insights: string; // AI-generated text analysis
  recommendations: string[];
}

export interface ChatSession {
  id?: string;
  schoolId: string;
  studentId: string;
  messages: Array<{
    role: 'user' | 'model';
    content: string;
    timestamp: string;
  }>;
  context?: string; // Student's academic context
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// TYPE UTILITIES
// ============================================

export type FirestoreDocument =
  | School
  | Term
  | UserProfile
  | ParentStudentLink
  | Class
  | Subject
  | StaffAssignment
  | StudentClass
  | ExamResult
  | AIScanResult
  | AttendanceRecord
  | LessonNote
  | ExamQuestion
  | FinancialTransaction
  | StudentWallet
  | StudentPerformanceInsight
  | ChatSession
  | AuditLog
  | Notification;

export interface Notification {
  id?: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  read: boolean;
  createdAt: string;
}

// Helper type for document data with ID (Supabase returns object with id usually, so this might be redundant or just T)
export type DocWithId<T> = T & { id: string };

// ============================================
// AUDIT LOGGING
// ============================================

export interface AuditLog {
  id?: string;
  schoolId: string;
  userId: string;
  userEmail?: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import';
  resourceType: 'student' | 'staff' | 'result' | 'attendance' | 'financial' | 'term' | 'class' | 'subject' | 'parent';
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
