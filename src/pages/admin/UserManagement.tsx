import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { adminResetUserPassword } from '../../lib/passwordResetService';
import { logAction } from '../../lib/auditService';
import { syncStaffIdFromMetadata } from '../../lib/staffService';
import { Users, Lock, Search, Eye, EyeOff, CheckCircle, AlertCircle, Mail, Zap } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'staff' | 'student' | 'parent' | 'bursar';
  staff_id: string | null;
  created_at: string;
}

export const UserManagement = () => {
  const { user, role, loading: authLoading, schoolId } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [showFixStaffIdModal, setShowFixStaffIdModal] = useState(false);
  const [fixingStaffId, setFixingStaffId] = useState(false);
  const [fixStatus, setFixStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // All hooks must come before any conditional returns
  // Fetch all users in school
  useEffect(() => {
    if (!schoolId) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, role, staff_id, created_at')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [schoolId]);

  // Filter users based on search
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(u =>
      u.full_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Check password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength('weak');
      return;
    }

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[@$!%*?&]/.test(newPassword)) strength++;

    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 3) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [newPassword]);

  const handleResetPassword = async () => {
    if (!selectedUser || !user) return;

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setResetStatus({
        type: 'error',
        message: 'Please enter and confirm the new password'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetStatus({
        type: 'error',
        message: 'Passwords do not match'
      });
      return;
    }

    if (newPassword.length < 8) {
      setResetStatus({
        type: 'error',
        message: 'Password must be at least 8 characters'
      });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      setResetStatus({
        type: 'error',
        message: 'Password must contain uppercase, lowercase, number, and special character'
      });
      return;
    }

    setResetting(true);
    setResetStatus(null);

    try {
      const result = await adminResetUserPassword(user.email || '', selectedUser.id, newPassword);

      // Log the action
      await logAction('PASSWORD_RESET', 'user', selectedUser.id, {
        target_user: selectedUser.email,
        target_name: selectedUser.full_name,
      });

      setResetStatus({
        type: 'success',
        message: result.message
      });

      // Reset form
      setTimeout(() => {
        setShowResetModal(false);
        setSelectedUser(null);
        setNewPassword('');
        setConfirmPassword('');
        setResetStatus(null);
      }, 2000);
    } catch (err) {
      console.error('Reset error:', err);
      setResetStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to reset password'
      });
    } finally {
      setResetting(false);
    }
  };

  const handleFixStaffId = async () => {
    if (!selectedUser || !user) return;

    setFixingStaffId(true);
    setFixStatus(null);

    try {
      // Get the auth user to extract the mappedId from metadata
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(selectedUser.id);

      if (authError || !authData.user) {
        throw new Error('Could not retrieve auth user information');
      }

      const mappedId = authData.user.user_metadata?.mappedId;

      if (!mappedId) {
        setFixStatus({
          type: 'error',
          message: 'No mapped staff ID found in auth metadata'
        });
        return;
      }

      // Call the sync function
      const result = await syncStaffIdFromMetadata(selectedUser.id, mappedId);

      if (!result.success) {
        setFixStatus({
          type: 'error',
          message: result.message || 'Failed to sync staff ID'
        });
        return;
      }

      // Log the action
      await logAction('STAFF_ID_SYNCED', 'user', selectedUser.id, {
        target_user: selectedUser.email,
        target_name: selectedUser.full_name,
        staff_id: mappedId
      });

      setFixStatus({
        type: 'success',
        message: `Staff ID synced successfully: ${mappedId}`
      });

      // Refresh users list
      setTimeout(() => {
        setShowFixStaffIdModal(false);
        setSelectedUser(null);
        setFixStatus(null);
        if (schoolId) {
          const fetchUsers = async () => {
            const { data, error } = await supabase
              .from('users')
              .select('id, full_name, email, role, staff_id, created_at')
              .eq('school_id', schoolId)
              .order('created_at', { ascending: false });

            if (!error) {
              setUsers(data || []);
              setFilteredUsers(data || []);
            }
          };
          fetchUsers();
        }
      }, 2000);
    } catch (err) {
      console.error('Fix staff ID error:', err);
      setFixStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fix staff ID'
      });
    } finally {
      setFixingStaffId(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-500';
      case 'bursar':
        return 'bg-blue-500/10 text-blue-500';
      case 'staff':
        return 'bg-purple-500/10 text-purple-500';
      case 'student':
        return 'bg-green-500/10 text-green-500';
      case 'parent':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  // Handle loading state
  if (authLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Handle access denied
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-teal-500" />
        <h1 className="text-3xl font-bold text-white">User Management</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-2 bg-dark-card text-white rounded-lg border border-dark-input focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-dark-card rounded-lg border border-dark-input overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-input">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Staff ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-input">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-dark-bg/50 transition">
                    <td className="px-6 py-3 text-white">{u.full_name}</td>
                    <td className="px-6 py-3 text-gray-400">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {u.staff_id ? (
                        <span className="text-teal-400 font-mono">{u.staff_id}</span>
                      ) : (
                        <span className="text-red-400 text-xs font-semibold">NOT SET</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        {!u.staff_id && (u.role === 'staff' || u.role === 'bursar') && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowFixStaffIdModal(true);
                              setFixStatus(null);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded transition text-sm font-medium"
                            title="Sync staff ID from auth metadata"
                          >
                            <Zap className="w-4 h-4" />
                            Fix ID
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowResetModal(true);
                            setResetStatus(null);
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 rounded transition text-sm font-medium"
                        >
                          <Lock className="w-4 h-4" />
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fix Staff ID Modal */}
      {showFixStaffIdModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-dark-input rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-2">Fix Staff ID</h2>
            <p className="text-gray-400 mb-6">
              Sync staff ID for <span className="font-semibold text-teal-400">{selectedUser.full_name}</span> ({selectedUser.email})
            </p>

            {fixStatus && (
              <div className={`mb-4 p-4 rounded-lg flex gap-3 ${
                fixStatus.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {fixStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <p className={fixStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}>
                  {fixStatus.message}
                </p>
              </div>
            )}

            <div className="bg-dark-bg p-4 rounded-lg mb-6 text-sm text-gray-300">
              <p className="mb-2">This will sync the staff ID from the user's authentication metadata:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
                <li>Extract mappedId from auth user metadata</li>
                <li>Update the staff_id field in the users table</li>
                <li>Staff assignments will then be visible to the user</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFixStaffIdModal(false);
                  setSelectedUser(null);
                  setFixStatus(null);
                }}
                disabled={fixingStaffId}
                className="flex-1 px-4 py-2 bg-dark-bg text-gray-300 hover:bg-dark-input rounded transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFixStaffId}
                disabled={fixingStaffId}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {fixingStaffId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Fix Staff ID
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card border border-dark-input rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400 mb-6">
              Reset password for <span className="font-semibold text-teal-400">{selectedUser.full_name}</span> ({selectedUser.email})
            </p>

            {resetStatus && (
              <div className={`mb-4 p-4 rounded-lg flex gap-3 ${
                resetStatus.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {resetStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <p className={resetStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}>
                  {resetStatus.message}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-2 bg-dark-bg text-white rounded border border-dark-input focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {newPassword && (
                  <p className={`text-xs mt-1 font-medium ${
                    passwordStrength === 'weak' ? 'text-red-500' :
                    passwordStrength === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    Strength: {passwordStrength}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2 bg-dark-bg text-white rounded border border-dark-input focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-dark-bg p-3 rounded text-xs text-gray-400 space-y-1">
                <p className="font-semibold text-gray-300 mb-2">Password must contain:</p>
                <p>• At least 8 characters</p>
                <p>• Uppercase letter (A-Z)</p>
                <p>• Lowercase letter (a-z)</p>
                <p>• Number (0-9)</p>
                <p>• Special character (@$!%*?&)</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                  setResetStatus(null);
                }}
                disabled={resetting}
                className="flex-1 px-4 py-2 bg-dark-bg text-gray-300 hover:bg-dark-input rounded transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting || !newPassword || !confirmPassword}
                className="flex-1 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Reset Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
