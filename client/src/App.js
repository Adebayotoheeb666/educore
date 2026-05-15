import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'; 
import { Toaster } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, clearUser } from './redux/features/auth/authSlice';
import { getMe, logoutUser } from './services/authService';
import { getAccessToken } from './utils/authSession';
import { RiNotificationLine, RiMoonLine, RiSunLine, RiQuestionLine } from 'react-icons/ri';



import Homepage from './pages/web/Home/Homepage';
import ForSchools from './pages/web/ForSchools/ForSchools';
import Resources from './pages/web/Resources/Resources';
import AboutPage from './pages/web/About/About';
import ContactPage from './pages/web/Contact/Contact';
import Blog from './pages/web/Blog/Blog';
import BlogPost from './pages/web/Blog/BlogPost';
import PrivacyPage from './pages/web/Legal/Privacy';
import NotFound from './pages/web/NotFound/NotFound';

// Auth pages (not lazy — needed immediately)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AcceptInvite from './pages/auth/AcceptInvite';

// Dashboard router
import DashboardRouter from './pages/dashboard/DashboardRouter';

import './pages/dashboard/Dashboard.css';

// Lazy-loaded app pages
const Students       = lazy(() => import('./pages/students/Students'));
const AddStudent     = lazy(() => import('./pages/students/AddStudent'));
const EditStudent    = lazy(() => import('./pages/students/EditStudent'));
const StudentDetail  = lazy(() => import('./pages/students/StudentDetail'));
const BulkImport     = lazy(() => import('./pages/students/BulkImport'));

const Teachers       = lazy(() => import('./pages/teachers/Teachers'));
const AddTeacher     = lazy(() => import('./pages/teachers/AddTeacher'));
const EditTeacher    = lazy(() => import('./pages/teachers/EditTeacher'));
const TeacherDetail  = lazy(() => import('./pages/teachers/TeacherDetail'));

const Classes        = lazy(() => import('./pages/classes/Classes'));
const ClassDetail    = lazy(() => import('./pages/classes/ClassDetail'));

const Subjects       = lazy(() => import('./pages/subjects/Subjects'));

const AttendanceMark   = lazy(() => import('./pages/attendance/AttendanceMark'));
const AttendanceReport = lazy(() => import('./pages/attendance/AttendanceReport'));

const LessonPlans        = lazy(() => import('./pages/lessonPlans/LessonPlans'));
const GenerateLessonPlan = lazy(() => import('./pages/lessonPlans/GenerateLessonPlan'));
const SchemeOfWork       = lazy(() => import('./pages/lessonPlans/SchemeOfWork'));

const Exams       = lazy(() => import('./pages/exams/Exams'));
const CreateExam  = lazy(() => import('./pages/exams/CreateExam'));
const ScoreEntry  = lazy(() => import('./pages/exams/ScoreEntry'));
const QuestionBank = lazy(() => import('./pages/exams/QuestionBank'));

const Results    = lazy(() => import('./pages/results/Results'));
const ReportCard = lazy(() => import('./pages/results/ReportCard'));
const Broadsheet = lazy(() => import('./pages/results/Broadsheet'));

const FeeSchedules  = lazy(() => import('./pages/fees/FeeSchedules'));
const FeeCollection = lazy(() => import('./pages/fees/FeeCollection'));
const FeeDefaulters = lazy(() => import('./pages/fees/FeeDefaulters'));

const Timetable         = lazy(() => import('./pages/timetable/Timetable'));
const GenerateTimetable = lazy(() => import('./pages/timetable/GenerateTimetable'));

const Library     = lazy(() => import('./pages/library/Library'));
const OverdueBooks = lazy(() => import('./pages/library/OverdueBooks'));

const Announcements      = lazy(() => import('./pages/announcements/Announcements'));
const CreateAnnouncement = lazy(() => import('./pages/announcements/CreateAnnouncement'));

const Analytics          = lazy(() => import('./pages/analytics/Analytics'));
const SubjectPerformance = lazy(() => import('./pages/analytics/SubjectPerformance'));

const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ParentResults   = lazy(() => import('./pages/parent/ParentResults'));
const ParentFees      = lazy(() => import('./pages/parent/ParentFees'));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentResults   = lazy(() => import('./pages/student/StudentResults'));
const StudentExams     = lazy(() => import('./pages/student/StudentExams'));

const AttendanceHistory  = lazy(() => import('./pages/attendance/AttendanceHistory'));
const GenerateQuestions  = lazy(() => import('./pages/exams/GenerateQuestions'));
const AcademicCalendar   = lazy(() => import('./pages/timetable/AcademicCalendar'));
const BorrowReturn       = lazy(() => import('./pages/library/BorrowReturn'));
const PaymentHistory     = lazy(() => import('./pages/fees/PaymentHistory'));
const TeacherEffectiveness = lazy(() => import('./pages/analytics/TeacherEffectiveness'));
const EMISReport         = lazy(() => import('./pages/analytics/EMISReport'));
const SuperAdmin         = lazy(() => import('./pages/admin/SuperAdmin'));
const SchoolDetail       = lazy(() => import('./pages/admin/SchoolDetail'));

const Notifications = lazy(() => import('./pages/notifications/Notifications'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const AdminProfileSetup = lazy(() => import('./pages/admin/AdminProfileSetup'));

// ─── Role helpers ────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['school_owner', 'principal', 'vp_academics', 'vp_admin', 'admin_staff', 'super_admin'];
const TEACHER_ROLES = ['class_teacher', 'subject_teacher'];
const STAFF_ROLES = [...ADMIN_ROLES, ...TEACHER_ROLES, 'bursar', 'librarian'];

// ─── Guards ──────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(s => s.auth);
  if (!isAuthenticated && !getAccessToken()) return <Navigate to="/login" replace />;
  return children;
};

const RoleRoute = ({ allowed, children }) => {
  const { user } = useSelector(s => s.auth);
  if (!user) return <PageSpinner />;
  if (!allowed.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── Spinner ─────────────────────────────────────────────────────────────────
const PageSpinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
    <div className="spinner-border text-primary" role="status" />
  </div>
);

// ─── Sidebar nav config ──────────────────────────────────────────────────────
const navConfig = [
  { label: 'Dashboard',    path: '/dashboard',              icon: '🏠', roles: STAFF_ROLES },
  { label: 'Students',     path: '/students',               icon: '👨‍🎓', roles: ADMIN_ROLES },
  { label: 'Teachers',     path: '/teachers',               icon: '👩‍🏫', roles: ADMIN_ROLES },
  { label: 'Classes',      path: '/classes',                icon: '🏫', roles: ADMIN_ROLES },
  { label: 'Subjects',     path: '/subjects',               icon: '📚', roles: ADMIN_ROLES },
  { label: 'Attendance',   path: '/attendance',             icon: '✅', roles: [...ADMIN_ROLES, ...TEACHER_ROLES] },
  { label: 'Lesson Plans', path: '/lesson-plans',           icon: '📝', roles: [...ADMIN_ROLES, ...TEACHER_ROLES] },
  { label: 'Exams',        path: '/exams',                  icon: '📋', roles: [...ADMIN_ROLES, ...TEACHER_ROLES] },
  { label: 'Results',      path: '/results',                icon: '📊', roles: [...ADMIN_ROLES, ...TEACHER_ROLES] },
  { label: 'Broadsheet',   path: '/broadsheet',             icon: '📄', roles: ADMIN_ROLES },
  { label: 'Fee Schedules',path: '/fees/schedules',         icon: '💰', roles: [...ADMIN_ROLES, 'bursar'] },
  { label: 'Collections',  path: '/fees/collection',        icon: '🧾', roles: [...ADMIN_ROLES, 'bursar'] },
  { label: 'Defaulters',   path: '/fees/defaulters',        icon: '⚠️',  roles: [...ADMIN_ROLES, 'bursar'] },
  { label: 'Timetable',    path: '/timetable',              icon: '🗓️',  roles: STAFF_ROLES },
  { label: 'Library',      path: '/library',                icon: '📖', roles: [...ADMIN_ROLES, 'librarian'] },
  { label: 'Announcements',path: '/announcements',          icon: '📢', roles: STAFF_ROLES },
  { label: 'Analytics',    path: '/analytics',              icon: '📈', roles: ADMIN_ROLES },
];

const parentNav = [
  { label: 'Dashboard',   path: '/parent',         icon: '🏠' },
  { label: 'Results',     path: '/parent/results', icon: '📊' },
  { label: 'Fees',        path: '/parent/fees',    icon: '💰' },
  { label: 'Timetable',   path: '/timetable',      icon: '🗓️' },
  { label: 'Announcements', path: '/announcements', icon: '📢' },
];

const studentNav = [
  { label: 'Dashboard',     path: '/student',              icon: '🏠' },
  { label: 'My Results',    path: '/student/results',      icon: '📊' },
  { label: 'Timetable',     path: '/timetable',            icon: '🗓️' },
  { label: 'Announcements', path: '/announcements',        icon: '📢' },
];

// ─── App Layout ──────────────────────────────────────────────────────────────
const AppLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(s => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogout = async () => {
    await logoutUser();
    dispatch(clearUser());
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];
    if (user.role === 'parent') return parentNav;
    if (user.role === 'student') return studentNav;
    return navConfig.filter(n => n.roles.includes(user.role));
  };

  const getPageTitle = () => {
    const isAdmin = user && ADMIN_ROLES.includes(user.role);
    const allNav = [
      ...navConfig, 
      ...parentNav, 
      ...studentNav, 
      { label: 'Profile', path: isAdmin ? '/profile-setup' : '/profile' }, 
      { label: 'Notifications', path: '/notifications' }
    ];
    const match = allNav.find(n => location.pathname === n.path || location.pathname.startsWith(n.path + '/'));
    return match ? match.label : 'Overview';
  };

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

  return (
    <div className="dashboard-wrapper d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className={`sidebar-premium ${sidebarOpen ? 'd-flex' : 'd-none d-md-flex'}`}>
        <Link to="/" className="sidebar-logo-area" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="sidebar-logo-icon">🎓</div>
            <div className="sidebar-logo-text">
              <h2>EduCore AI</h2>
              <p>Admin Portal</p>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-light d-md-none ms-auto" 
            onClick={(e) => {
              e.preventDefault();
              setSidebarOpen(false);
            }}
            style={{ borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </Link>

        <nav className="sidebar-nav">
          {getNavItems().map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-ai-insights">
            <span>✨</span> AI Insights
          </button>
          <button className="btn-signout" onClick={handleLogout}>
            <span className="btn-signout-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: 0, minWidth: 0 }}>
        {/* Top Bar */}
        <header className="topbar-premium">
          <button className="btn btn-sm btn-outline-secondary d-md-none me-3" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="topbar-title d-none d-lg-block">{getPageTitle()}</div>
          
          <div className="topbar-search">
            <span className="topbar-search-icon">🔍</span>
            <input type="text" placeholder="Search students, staff, records..." />
          </div>

          <div className="topbar-actions">
            <Link 
              to="/notifications" 
              className="topbar-icon-btn" 
              style={{ textDecoration: 'none' }}
              title="Notifications"
            >
              <RiNotificationLine size={24} />
              <span className="notification-dot"></span>
            </Link>
            <button
              className="topbar-icon-btn"
              onClick={() => setDarkMode(d => !d)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <RiSunLine size={24} /> : <RiMoonLine size={24} />}
            </button>
            <div className="topbar-icon-btn" title="Help & Support">
              <RiQuestionLine size={24} />
            </div>
            
            <Link to={ADMIN_ROLES.includes(user?.role) ? "/profile-setup" : "/profile"} className="user-profile-btn" style={{ textDecoration: 'none' }}>
              <div className="user-info-text d-none d-md-block">
                <h4>{displayName}</h4>
                <p>{user?.role?.replace('_', ' ').toUpperCase() || 'USER'}</p>
              </div>
              <div className="user-avatar">
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${displayName}&background=random`} alt="Avatar" />
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow-1 dashboard-main">
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .flex-grow-1.d-flex.flex-column { margin-left: 260px !important; }
        }
      `}</style>
    </div>
  );
};

// ─── Auth initialiser ────────────────────────────────────────────────────────
const AuthInit = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !user) {
      getMe().then(data => {
        if (data) dispatch(setUser(data));
        else dispatch(clearUser());
      }).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return <PageSpinner />;
  return children;
};

// ─── Routes ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <AuthInit>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/for-schools" element={<ForSchools />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />

          {/* Protected app */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

            {/* Dashboard — role-based redirect handled inside DashboardRouter */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile-setup" element={<RoleRoute allowed={ADMIN_ROLES}><AdminProfileSetup /></RoleRoute>} />

            {/* Students */}
            <Route path="/students" element={<RoleRoute allowed={ADMIN_ROLES}><Students /></RoleRoute>} />
            <Route path="/students/add" element={<RoleRoute allowed={ADMIN_ROLES}><AddStudent /></RoleRoute>} />
            <Route path="/students/bulk-import" element={<RoleRoute allowed={ADMIN_ROLES}><BulkImport /></RoleRoute>} />
            <Route path="/students/:id/edit" element={<RoleRoute allowed={ADMIN_ROLES}><EditStudent /></RoleRoute>} />
            <Route path="/students/:id" element={<RoleRoute allowed={ADMIN_ROLES}><StudentDetail /></RoleRoute>} />

            {/* Teachers */}
            <Route path="/teachers" element={<RoleRoute allowed={ADMIN_ROLES}><Teachers /></RoleRoute>} />
            <Route path="/teachers/add" element={<RoleRoute allowed={ADMIN_ROLES}><AddTeacher /></RoleRoute>} />
            <Route path="/teachers/:id/edit" element={<RoleRoute allowed={ADMIN_ROLES}><EditTeacher /></RoleRoute>} />
            <Route path="/teachers/:id" element={<RoleRoute allowed={ADMIN_ROLES}><TeacherDetail /></RoleRoute>} />

            {/* Classes */}
            <Route path="/classes" element={<RoleRoute allowed={ADMIN_ROLES}><Classes /></RoleRoute>} />
            <Route path="/classes/:id" element={<RoleRoute allowed={ADMIN_ROLES}><ClassDetail /></RoleRoute>} />

            {/* Subjects */}
            <Route path="/subjects" element={<RoleRoute allowed={ADMIN_ROLES}><Subjects /></RoleRoute>} />

            {/* Attendance */}
            <Route path="/attendance" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><AttendanceMark /></RoleRoute>} />
            <Route path="/attendance/report" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><AttendanceReport /></RoleRoute>} />

            {/* Lesson Plans */}
            <Route path="/lesson-plans" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><LessonPlans /></RoleRoute>} />
            <Route path="/lesson-plans/generate" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><GenerateLessonPlan /></RoleRoute>} />
            <Route path="/lesson-plans/scheme" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><SchemeOfWork /></RoleRoute>} />

            {/* Exams */}
            <Route path="/exams" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><Exams /></RoleRoute>} />
            <Route path="/exams/create" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><CreateExam /></RoleRoute>} />
            <Route path="/exams/:id/scores" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><ScoreEntry /></RoleRoute>} />
            <Route path="/exams/question-bank" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><QuestionBank /></RoleRoute>} />

            {/* Results */}
            <Route path="/results" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><Results /></RoleRoute>} />
            <Route path="/results/:studentId" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><ReportCard /></RoleRoute>} />
            <Route path="/broadsheet" element={<RoleRoute allowed={ADMIN_ROLES}><Broadsheet /></RoleRoute>} />

            {/* Fees */}
            <Route path="/fees/schedules" element={<RoleRoute allowed={[...ADMIN_ROLES, 'bursar']}><FeeSchedules /></RoleRoute>} />
            <Route path="/fees/collection" element={<RoleRoute allowed={[...ADMIN_ROLES, 'bursar']}><FeeCollection /></RoleRoute>} />
            <Route path="/fees/defaulters" element={<RoleRoute allowed={[...ADMIN_ROLES, 'bursar']}><FeeDefaulters /></RoleRoute>} />

            {/* Timetable */}
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/timetable/generate" element={<RoleRoute allowed={ADMIN_ROLES}><GenerateTimetable /></RoleRoute>} />

            {/* Library */}
            <Route path="/library" element={<RoleRoute allowed={[...ADMIN_ROLES, 'librarian']}><Library /></RoleRoute>} />
            <Route path="/library/overdue" element={<RoleRoute allowed={[...ADMIN_ROLES, 'librarian']}><OverdueBooks /></RoleRoute>} />

            {/* Announcements */}
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/announcements/create" element={<RoleRoute allowed={ADMIN_ROLES}><CreateAnnouncement /></RoleRoute>} />

            {/* Analytics */}
            <Route path="/analytics" element={<RoleRoute allowed={ADMIN_ROLES}><Analytics /></RoleRoute>} />
            <Route path="/analytics/subjects" element={<RoleRoute allowed={ADMIN_ROLES}><SubjectPerformance /></RoleRoute>} />

            {/* Parent portal */}
            <Route path="/parent" element={<RoleRoute allowed={['parent']}><ParentDashboard /></RoleRoute>} />
            <Route path="/parent/results" element={<RoleRoute allowed={['parent']}><ParentResults /></RoleRoute>} />
            <Route path="/parent/fees" element={<RoleRoute allowed={['parent']}><ParentFees /></RoleRoute>} />

            {/* Student portal */}
            <Route path="/student" element={<RoleRoute allowed={['student']}><StudentDashboard /></RoleRoute>} />
            <Route path="/student/results" element={<RoleRoute allowed={['student']}><StudentResults /></RoleRoute>} />
            <Route path="/student/exams" element={<RoleRoute allowed={['student']}><StudentExams /></RoleRoute>} />

            {/* Attendance history */}
            <Route path="/attendance/history" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES, 'parent', 'student']}><AttendanceHistory /></RoleRoute>} />

            {/* AI question generation */}
            <Route path="/exams/generate-questions" element={<RoleRoute allowed={[...ADMIN_ROLES, ...TEACHER_ROLES]}><GenerateQuestions /></RoleRoute>} />

            {/* Academic calendar */}
            <Route path="/calendar" element={<AcademicCalendar />} />

            {/* Library borrow/return */}
            <Route path="/library/borrow-return" element={<RoleRoute allowed={[...ADMIN_ROLES, 'librarian']}><BorrowReturn /></RoleRoute>} />

            {/* Fee payment history */}
            <Route path="/fees/history" element={<RoleRoute allowed={[...ADMIN_ROLES, 'bursar', 'parent', 'student']}><PaymentHistory /></RoleRoute>} />

            {/* Analytics — extended */}
            <Route path="/analytics/teacher-effectiveness" element={<RoleRoute allowed={ADMIN_ROLES}><TeacherEffectiveness /></RoleRoute>} />
            <Route path="/analytics/emis" element={<RoleRoute allowed={ADMIN_ROLES}><EMISReport /></RoleRoute>} />

            {/* Super admin panel */}
            <Route path="/admin/schools" element={<RoleRoute allowed={['super_admin']}><SuperAdmin /></RoleRoute>} />
            <Route path="/admin/schools/:id" element={<RoleRoute allowed={['super_admin']}><SchoolDetail /></RoleRoute>} />

            {/* Notifications */}
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthInit>
    </BrowserRouter>
  );
}

export default App;
