import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import {
  auditStaffAuthAccounts,
  bulkCreateStaffAuthAccounts,
  createStaffAuthAccount,
} from '../../lib/staffAuthSync';
import { logAction } from '../../lib/auditService';
import {
  AlertCircle,
  CheckCircle2,
  Users,
  Shield,
  Zap,
  Download,
} from 'lucide-react';

interface AuditResult {
  totalStaff: number;
  staffWithAuth: number;
  staffWithoutAuth: Array<{ id: string; name: string; email: string }>;
}

export const StaffAuthAudit = () => {
  const { user, role, loading: authLoading, schoolId } = useAuth();
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ staffName: string; error: string }>;
  } | null>(null);
  const [creatingStaffIds, setCreatingStaffIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle auth loading state first
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check authorization
  if (role?.toLowerCase() !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Perform initial audit
  useEffect(() => {
    if (!schoolId) return;

    const performAudit = async () => {
      setLoading(true);
      try {
        const result = await auditStaffAuthAccounts(schoolId);
        setAuditResult(result);
      } catch (err) {
        console.error('Audit error:', err);
      } finally {
        setLoading(false);
      }
    };

    performAudit();
  }, [schoolId]);

  const handleBulkFix = async () => {
    if (!schoolId) return;

    setErrorMessage(null);
    setFixing(true);
    try {
      const result = await bulkCreateStaffAuthAccounts(schoolId);
      setResults(result);

      // Log action
      if (user) {
        await logAction(
          schoolId || '',
          user.id,
          user.email || 'system',
          'bulk_create',
          'staff',
          'bulk',
          {},
          {
            success: result.success,
            failed: result.failed,
          }
        );
      }

      // Re-audit after fix
      setTimeout(async () => {
        const newResult = await auditStaffAuthAccounts(schoolId);
        setAuditResult(newResult);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create Auth accounts';
      setErrorMessage(message);
      console.error('Bulk fix error:', err);
    } finally {
      setFixing(false);
    }
  };

  const handleCreateSingleAuth = async (staff: AuditResult['staffWithoutAuth'][0]) => {
    if (!schoolId) return;

    setErrorMessage(null);
    setCreatingStaffIds(prev => new Set([...prev, staff.id]));
    try {
      const result = await createStaffAuthAccount(schoolId, staff.id, staff.name, staff.email);

      if (result.success) {
        // Update audit result
        setAuditResult(prev => ({
          ...prev!,
          staffWithAuth: prev!.staffWithAuth + 1,
          staffWithoutAuth: prev!.staffWithoutAuth.filter(s => s.id !== staff.id),
        }));

        // Log action
        if (user) {
          await logAction(
            schoolId || '',
            user.id,
            user.email || 'system',
            'create',
            'staff',
            staff.id,
            {},
            {
              staff_name: staff.name,
              staff_email: staff.email,
            }
          );
        }
      } else {
        setErrorMessage(result.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create Auth account';
      setErrorMessage(message);
      console.error('Create auth error:', err);
    } finally {
      setCreatingStaffIds(prev => {
        const next = new Set(prev);
        next.delete(staff.id);
        return next;
      });
    }
  };

  const compliancePercentage = auditResult
    ? Math.round((auditResult.staffWithAuth / auditResult.totalStaff) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-teal-500" />
        <h1 className="text-3xl font-bold text-white">Staff Authentication Audit</h1>
      </div>

      {/* Summary Cards */}
      {!loading && auditResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Staff */}
          <div className="bg-dark-card border border-dark-input rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Staff</p>
                <p className="text-3xl font-bold text-white mt-1">{auditResult.totalStaff}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500/30" />
            </div>
          </div>

          {/* With Auth */}
          <div className="bg-dark-card border border-dark-input rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">With Auth Account</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{auditResult.staffWithAuth}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500/30" />
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-dark-card border border-dark-input rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Compliance</p>
                <p className={`text-3xl font-bold mt-1 ${compliancePercentage === 100 ? 'text-green-500' : 'text-orange-500'
                  }`}>
                  {compliancePercentage}%
                </p>
              </div>
              <Shield className="w-10 h-10 text-teal-500/30" />
            </div>
          </div>
        </div>
      )}

      {/* Alert if not compliant */}
      {!loading && auditResult && auditResult.staffWithoutAuth.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-500 mb-1">Security Issue Detected</h3>
            <p className="text-orange-500/90 text-sm">
              {auditResult.staffWithoutAuth.length} staff member{auditResult.staffWithoutAuth.length !== 1 ? 's have' : ' has'} no Auth account.
              This prevents proper audit logging and RBAC enforcement.
            </p>
          </div>
        </div>
      )}

      {/* Bulk Fix Button */}
      {!loading && auditResult && auditResult.staffWithoutAuth.length > 0 && (
        <button
          onClick={handleBulkFix}
          disabled={fixing}
          className="flex items-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50 font-medium"
        >
          {fixing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Auth Accounts...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Bulk Create Auth Accounts
            </>
          )}
        </button>
      )}

      {/* Bulk Fix Results */}
      {results && (
        <div className={`border rounded-lg p-4 ${results.failed === 0
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-orange-500/10 border-orange-500/20'
          }`}>
          <div className="flex gap-3 mb-3">
            {results.failed === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={`font-semibold ${results.failed === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                Bulk Creation Results
              </h3>
              <p className={`text-sm mt-1 ${results.failed === 0 ? 'text-green-500/90' : 'text-orange-500/90'}`}>
                Successfully created {results.success} Auth account{results.success !== 1 ? 's' : ''}.
                {results.failed > 0 && ` ${results.failed} failed.`}
              </p>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium text-gray-300">Errors:</p>
              {results.errors.map((err, i) => (
                <div key={i} className="text-red-400 text-xs">
                  • {err.staffName}: {err.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Without Auth Table */}
      {!loading && auditResult && auditResult.staffWithoutAuth.length > 0 && (
        <div className="bg-dark-card border border-dark-input rounded-lg overflow-hidden">
          <div className="bg-dark-bg border-b border-dark-input px-6 py-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Staff Without Auth Accounts ({auditResult.staffWithoutAuth.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-input">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-input">
                {auditResult.staffWithoutAuth.map(staff => (
                  <tr key={staff.id} className="hover:bg-dark-bg/50 transition">
                    <td className="px-6 py-3 text-white">{staff.name}</td>
                    <td className="px-6 py-3 text-gray-400 text-sm">{staff.email}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleCreateSingleAuth(staff)}
                        disabled={creatingAuth || selectedStaff === staff.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 rounded transition text-sm font-medium disabled:opacity-50"
                      >
                        {selectedStaff === staff.id && creatingAuth ? (
                          <>
                            <div className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            Create Auth
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success State */}
      {!loading && auditResult && auditResult.staffWithoutAuth.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-green-500 mb-1">All Staff Authenticated</h3>
          <p className="text-green-500/90">
            All {auditResult.totalStaff} staff members have Auth accounts. Your system is compliant!
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Documentation */}
      <div className="bg-dark-card border border-dark-input rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          What This Does
        </h3>
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            <span className="text-teal-400 font-semibold">Audit:</span> Scans all staff members to identify those without Supabase Auth accounts.
          </p>
          <p>
            <span className="text-teal-400 font-semibold">Create:</span> Generates Auth accounts for staff, enabling proper audit logging and role-based access control.
          </p>
          <p>
            <span className="text-teal-400 font-semibold">Why it matters:</span> Without Auth accounts, the system cannot track who performed actions, violating audit trail requirements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffAuthAudit;
