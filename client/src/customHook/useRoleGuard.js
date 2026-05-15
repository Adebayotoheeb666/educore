import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const useRoleGuard = (allowedRoles = []) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const hasRole = allowedRoles.length === 0 || (user?.role && allowedRoles.includes(user.role));

  useEffect(() => {
    if (user && !hasRole) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, hasRole, navigate]);

  return {
    hasRole,
    role: user?.role,
    isSuperAdmin: user?.role === 'super_admin',
    isPrincipal: user?.role === 'principal' || user?.role === 'school_owner',
    isTeacher: ['class_teacher', 'subject_teacher', 'vp_academics'].includes(user?.role),
    isParent: user?.role === 'parent',
    isStudent: user?.role === 'student',
    isBursar: user?.role === 'bursar',
  };
};

export default useRoleGuard;
