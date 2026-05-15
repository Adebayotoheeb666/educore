import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import BursarDashboard from './BursarDashboard';

const DashboardRouter = () => {
  const { user } = useSelector(s => s.auth);

  if (!user) return <div className="container mt-4"><div className="spinner-border text-primary" /></div>;

  const adminRoles = ['school_owner', 'principal', 'vp_academics', 'vp_admin', 'admin_staff'];
  const teacherRoles = ['class_teacher', 'subject_teacher'];

  if (user.role === 'super_admin') return <Navigate to="/admin" replace />;
  if (adminRoles.includes(user.role)) return <AdminDashboard user={user} />;
  if (teacherRoles.includes(user.role)) return <TeacherDashboard user={user} />;
  if (user.role === 'bursar') return <BursarDashboard user={user} />;
  if (user.role === 'parent') return <Navigate to="/parent" replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;

  return <AdminDashboard user={user} />;
};

export default DashboardRouter;
