/**
 * Centralized TypeScript types for all Firestore collections.
 * This ensures schema consistency across the application.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// SCHOOL & ADMINISTRATION
// ============================================

export interface School {
  schoolId: string;
  name: string;
  address: string;
  adminUid: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface Term {
  schoolId: string;
  name: string; // e.g., "1st Term", "2nd Semester"
  startDate: string; // ISO format: YYYY-MM-DD
  endDate: string; // ISO format: YYYY-MM-DD
  gradeScale?: {
    [grade: string]: [number, number]; // e.g., A: [70, 100]
  };
  isActive: boolean;
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// ============================================
// USERS & ACCESS CONTROL
// ============================================

export interface UserProfile {
  uid: string;
  fullName: string;
  email?: string;
  role: 'admin' | 'staff' | 'student' | 'parent' | 'bursar';
  schoolId: string;
  admissionNumber?: string; // For students
  staffId?: string; // For staff
  assignedClasses?: string[]; // For staff - array of class IDs
  assignedSubjects?: string[]; // For staff - array of subject IDs
  phone?: string;
  profileImage?: string;
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface ParentStudentLink {
  schoolId: string;
  parentIds: string[]; // Array of parent UIDs
  studentId: string;
  relationship: 'Father' | 'Mother' | 'Guardian' | 'Other';
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// ============================================
// CURRICULUM
// ============================================

export interface Class {
  schoolId: string;
  name: string; // e.g., "SS1A", "Form 3B"
  level?: string; // e.g., "Secondary 1", "Form 3"
  classTeacherId?: string; // UID of class teacher
  capacity?: number;
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface Subject {
  schoolId: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface StaffAssignment {
  schoolId: string;
  staffId: string; // UID of staff member
  classId: string;
  subjectId: string;
  startDate: string; // ISO format: YYYY-MM-DD
  endDate?: string; // ISO format: YYYY-MM-DD
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface StudentClass {
  schoolId: string;
  studentId: string; // UID
  classId: string;
  enrollmentDate: string; // ISO format: YYYY-MM-DD
  status: 'active' | 'graduated' | 'transferred' | 'dropped';
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// ============================================
// ACADEMIC RECORDS
// ============================================

export interface ExamResult {
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
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}

export interface AIScanResult {
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
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface AttendanceRecord {
  schoolId: string;
  studentId: string;
  classId: string;
  teacherId: string;
  date: string; // ISO format: YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// ============================================
// INSTRUCTIONAL MATERIALS
// ============================================

export interface LessonNote {
  schoolId: string;
  staffId: string; // UID of teacher
  subject: string;
  topic: string;
  level: string;
  content: string;
  generatedBy: 'gemini' | 'manual';
  archived: boolean;
  tags?: string[];
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface ExamQuestion {
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
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// ============================================
// FINANCIAL
// ============================================

export interface FinancialTransaction {
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
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface StudentWallet {
  schoolId: string;
  studentId: string;
  balance: number;
  currency: string; // e.g., "NGN"
  lastUpdated: string | Timestamp;
  transactions?: string[]; // Array of transaction IDs
}

// ============================================
// AI & ANALYTICS
// ============================================

export interface StudentPerformanceInsight {
  schoolId: string;
  studentId: string;
  generatedAt: string | Timestamp;
  attendanceRate: number;
  averageScore: number;
  strongSubjects: string[];
  weakSubjects: string[];
  insights: string; // AI-generated text analysis
  recommendations: string[];
}

export interface ChatSession {
  schoolId: string;
  studentId: string;
  messages: Array<{
    role: 'user' | 'model';
    content: string;
    timestamp: string | Timestamp;
  }>;
  context?: string; // Student's academic context
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
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
  | ChatSession;

// Helper type for Firestore document data with ID
export type DocWithId<T> = T & { id: string };
