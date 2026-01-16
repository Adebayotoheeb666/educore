import { supabase } from './supabase';
import type { AuditLog } from './types';

/**
 * Log an action to the audit trail
 */
export const logAction = async (
    schoolId: string,
    userId: string,
    userName: string,
    action: AuditLog['action'],
    resourceType: AuditLog['resourceType'],
    resourceId?: string,
    changes?: Record<string, any>,
    metadata?: Record<string, any>
): Promise<void> => {
    try {
        await supabase.from('audit_logs').insert({
            school_id: schoolId,
            user_id: userId,
            user_name: userName,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            changes,
            metadata,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString() // or let DB handle it if column is created_at
        });
    } catch (error) {
        // Don't throw errors for audit logging failures
        // Just log to console
        console.error('Failed to log audit action:', error);
    }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (
    schoolId: string,
    filters?: {
        userId?: string;
        action?: AuditLog['action'];
        resourceType?: AuditLog['resourceType'];
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }
): Promise<(AuditLog & { id: string })[]> => {
    let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('school_id', schoolId)
        .order('timestamp', { ascending: false });

    if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
    }

    if (filters?.action) {
        query = query.eq('action', filters.action);
    }

    if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
    }

    if (filters?.limit) {
        query = query.limit(filters.limit);
    } else {
        query = query.limit(100); // Default limit
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }

    let logs = (data || []).map(doc => ({
        id: doc.id,
        schoolId: doc.school_id,
        userId: doc.user_id,
        userName: doc.user_name,
        userEmail: doc.user_email,
        action: doc.action,
        resourceType: doc.resource_type,
        resourceId: doc.resource_id,
        changes: doc.changes,
        metadata: doc.metadata,
        ipAddress: doc.ip_address,
        userAgent: doc.user_agent,
        timestamp: doc.timestamp
    })) as (AuditLog & { id: string })[];

    // Filter by date range
    if (filters?.startDate || filters?.endDate) {
        logs = logs.filter(log => {
            const logDate = new Date(log.timestamp);

            if (filters.startDate && logDate < filters.startDate) return false;
            if (filters.endDate && logDate > filters.endDate) return false;
            return true;
        });
    }

    return logs;
};

/**
 * Export audit logs to CSV format
 */
export const exportAuditLogsToCSV = (logs: (AuditLog & { id: string })[]): string => {
    const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Changes'];
    const rows = logs.map(log => {
        const timestamp = new Date(log.timestamp).toISOString();

        const changes = log.changes ? JSON.stringify(log.changes) : '';

        return [
            timestamp,
            log.userName,
            log.action,
            log.resourceType,
            log.resourceId || '',
            changes
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
};

/**
 * Download audit logs as CSV file
 */
export const downloadAuditLogsCSV = (logs: (AuditLog & { id: string })[], filename: string = 'audit-logs.csv'): void => {
    const csv = exportAuditLogsToCSV(logs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
};
