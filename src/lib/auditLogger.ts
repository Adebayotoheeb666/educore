/**
 * AUDIT LOGGING SERVICE
 * ====================================
 * Logs all sensitive operations for compliance and security.
 * Used by components and Edge Functions to track user actions.
 *
 * Benefits:
 * ✅ Compliance tracking (GDPR, FERPA)
 * ✅ Security incident investigation
 * ✅ User activity monitoring
 * ✅ Data integrity verification
 * ✅ Admin oversight
 */

import { supabase } from './supabase';
import type { AuditLog } from './types';

interface AuditLogParams {
  userId: string;
  userEmail?: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'access';
  resourceType: 'student' | 'staff' | 'result' | 'attendance' | 'financial' | 'term' | 'class' | 'subject' | 'parent' | 'lesson' | 'message';
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  schoolId: string;
}

/**
 * Log an action to audit trail
 */
export async function logAuditAction(params: AuditLogParams): Promise<void> {
  try {
    // Get user agent and IP address
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'server';
    const ipAddress = await getClientIP();

    const auditLog = {
      user_id: params.userId,
      user_email: params.userEmail,
      user_name: params.userName,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      changes: params.changes || {},
      metadata: params.metadata || {},
      school_id: params.schoolId,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase.from('audit_logs').insert(auditLog);

    if (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit logging failure shouldn't block operations
    }
  } catch (error) {
    console.error('Error in audit logging:', error);
    // Silently fail - don't disrupt user experience
  }
}

/**
 * Get client IP address (works in browser)
 */
async function getClientIP(): Promise<string> {
  try {
    // Try to get IP from our own API (would need to be set up)
    // For now, return 'unknown' - in production, use a proper IP service
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Log student creation
 */
export async function logStudentCreated(params: {
  schoolId: string;
  userId: string;
  userName: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'create',
    resourceType: 'student',
    resourceId: params.studentId,
    schoolId: params.schoolId,
    metadata: {
      studentName: params.studentName,
      admissionNumber: params.admissionNumber,
    },
  });
}

/**
 * Log staff creation
 */
export async function logStaffCreated(params: {
  schoolId: string;
  userId: string;
  userName: string;
  staffId: string;
  staffName: string;
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'create',
    resourceType: 'staff',
    resourceId: params.staffId,
    schoolId: params.schoolId,
    metadata: {
      staffName: params.staffName,
    },
  });
}

/**
 * Log grade entry
 */
export async function logGradeEntered(params: {
  schoolId: string;
  userId: string;
  userName: string;
  resultId: string;
  studentId: string;
  subjectId: string;
  caScore: number;
  examScore: number;
  totalScore: number;
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'create',
    resourceType: 'result',
    resourceId: params.resultId,
    schoolId: params.schoolId,
    changes: {
      caScore: params.caScore,
      examScore: params.examScore,
      totalScore: params.totalScore,
    },
    metadata: {
      studentId: params.studentId,
      subjectId: params.subjectId,
    },
  });
}

/**
 * Log grade update
 */
export async function logGradeUpdated(params: {
  schoolId: string;
  userId: string;
  userName: string;
  resultId: string;
  before: { caScore: number; examScore: number; totalScore: number };
  after: { caScore: number; examScore: number; totalScore: number };
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'update',
    resourceType: 'result',
    resourceId: params.resultId,
    schoolId: params.schoolId,
    changes: {
      caScore: { before: params.before.caScore, after: params.after.caScore },
      examScore: { before: params.before.examScore, after: params.after.examScore },
      totalScore: { before: params.before.totalScore, after: params.after.totalScore },
    },
  });
}

/**
 * Log attendance entry
 */
export async function logAttendanceMarked(params: {
  schoolId: string;
  userId: string;
  userName: string;
  attendanceId: string;
  studentId: string;
  status: string;
  date: string;
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'create',
    resourceType: 'attendance',
    resourceId: params.attendanceId,
    schoolId: params.schoolId,
    metadata: {
      studentId: params.studentId,
      status: params.status,
      date: params.date,
    },
  });
}

/**
 * Log student data export
 */
export async function logStudentDataExport(params: {
  schoolId: string;
  userId: string;
  userName: string;
  studentId: string;
  exportType: 'report-card' | 'transcript' | 'attendance' | 'results';
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'export',
    resourceType: 'student',
    resourceId: params.studentId,
    schoolId: params.schoolId,
    metadata: {
      exportType: params.exportType,
    },
  });
}

/**
 * Log bulk import
 */
export async function logBulkImport(params: {
  schoolId: string;
  userId: string;
  userName: string;
  importType: 'students' | 'staff' | 'results' | 'attendance';
  recordCount: number;
  successCount: number;
  failureCount: number;
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'import',
    resourceType: 'student', // Generic, could be any type
    schoolId: params.schoolId,
    metadata: {
      importType: params.importType,
      recordCount: params.recordCount,
      successCount: params.successCount,
      failureCount: params.failureCount,
    },
  });
}

/**
 * Log financial transaction
 */
export async function logFinancialTransaction(params: {
  schoolId: string;
  userId: string;
  userName: string;
  transactionId: string;
  studentId: string;
  type: 'fee-payment' | 'refund' | 'wallet-funding';
  amount: number;
  status: string;
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'create',
    resourceType: 'financial',
    resourceId: params.transactionId,
    schoolId: params.schoolId,
    metadata: {
      studentId: params.studentId,
      type: params.type,
      amount: params.amount,
      status: params.status,
    },
  });
}

/**
 * Log parent-teacher messaging
 */
export async function logParentTeacherMessage(params: {
  schoolId: string;
  userId: string;
  userName: string;
  messageId: string;
  senderId: string;
  receiverId: string;
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'create',
    resourceType: 'message',
    resourceId: params.messageId,
    schoolId: params.schoolId,
    metadata: {
      senderId: params.senderId,
      receiverId: params.receiverId,
    },
  });
}

/**
 * Log user login
 */
export async function logUserLogin(params: {
  schoolId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  role: string;
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    action: 'login',
    resourceType: 'student', // Generic
    schoolId: params.schoolId,
    metadata: {
      role: params.role,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log user logout
 */
export async function logUserLogout(params: {
  schoolId: string;
  userId: string;
  userName: string;
}): Promise<void> {
  await logAuditAction({
    userId: params.userId,
    userName: params.userName,
    action: 'logout',
    resourceType: 'student', // Generic
    schoolId: params.schoolId,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Get audit logs for a school (admin only)
 */
export async function getSchoolAuditLogs(params: {
  schoolId: string;
  userId: string;
  limit?: number;
  offset?: number;
  filters?: {
    action?: string;
    resourceType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('school_id', params.schoolId)
      .order('timestamp', { ascending: false });

    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    if (params.filters?.action) {
      query = query.eq('action', params.filters.action);
    }
    if (params.filters?.resourceType) {
      query = query.eq('resource_type', params.filters.resourceType);
    }
    if (params.filters?.dateFrom) {
      query = query.gte('timestamp', params.filters.dateFrom);
    }
    if (params.filters?.dateTo) {
      query = query.lte('timestamp', params.filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return (data || []).map((log: any) => ({
      id: log.id,
      schoolId: log.school_id,
      userId: log.user_id,
      userEmail: log.user_email,
      userName: log.user_name,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      changes: log.changes,
      metadata: log.metadata,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      timestamp: log.timestamp,
    }));
  } catch (error) {
    console.error('Error in getSchoolAuditLogs:', error);
    return [];
  }
}

/**
 * Get action statistics for a school
 */
export async function getAuditStatistics(schoolId: string): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  topUsers: Array<{ name: string; count: number }>;
  lastAction: AuditLog | null;
}> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('school_id', schoolId)
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) {
      throw error;
    }

    const logs = (data as any[]) || [];
    const actionsByType: Record<string, number> = {};
    const userActions: Record<string, number> = {};

    logs.forEach((log: any) => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      userActions[log.user_name] = (userActions[log.user_name] || 0) + 1;
    });

    const topUsers = Object.entries(userActions)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const lastLog = logs[0];

    return {
      totalActions: logs.length,
      actionsByType,
      topUsers,
      lastAction: lastLog ? {
        id: lastLog.id,
        schoolId: lastLog.school_id,
        userId: lastLog.user_id,
        userEmail: lastLog.user_email,
        userName: lastLog.user_name,
        action: lastLog.action,
        resourceType: lastLog.resource_type,
        resourceId: lastLog.resource_id,
        changes: lastLog.changes,
        metadata: lastLog.metadata,
        ipAddress: lastLog.ip_address,
        userAgent: lastLog.user_agent,
        timestamp: lastLog.timestamp,
      } : null,
    };
  } catch (error) {
    console.error('Error in getAuditStatistics:', error);
    return {
      totalActions: 0,
      actionsByType: {},
      topUsers: [],
      lastAction: null,
    };
  }
}
