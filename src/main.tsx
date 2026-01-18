import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from "@sentry/react";
import './index.css'
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { initSentry } from './lib/sentry';

// Initialize Sentry error monitoring
initSentry();

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const LessonGenerator = lazy(() => import('./pages/LessonGenerator').then(module => ({ default: module.LessonGenerator })));
const ExamBuilder = lazy(() => import('./pages/ExamBuilder').then(module => ({ default: module.ExamBuilder })));
const PaperScanner = lazy(() => import('./pages/PaperScanner').then(module => ({ default: module.PaperScanner })));
const Analytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const FullAccountExplore = lazy(() => import('./pages/financial/FullAccountExplore').then(module => ({ default: module.FullAccountExplore })));
const FundParentWallet = lazy(() => import('./pages/financial/FundParentWallet').then(module => ({ default: module.FundParentWallet })));
const PayForStudents = lazy(() => import('./pages/financial/PayForStudents').then(module => ({ default: module.PayForStudents })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AttendanceTracking = lazy(() => import('./pages/AttendanceTracking').then(module => ({ default: module.AttendanceTracking })));
const GradeEntry = lazy(() => import('./pages/GradeEntry').then(module => ({ default: module.GradeEntry })));
const ClassManager = lazy(() => import('./pages/ClassManager').then(module => ({ default: module.ClassManager })));
const StudentPortal = lazy(() => import('./pages/StudentPortal').then(module => ({ default: module.StudentPortal })));
const StudentAttendance = lazy(() => import('./pages/StudentAttendance.tsx').then(module => ({ default: module.StudentAttendance })));
const StudentResults = lazy(() => import('./pages/StudentResults.tsx').then(module => ({ default: module.StudentResults })));
const ParentPortal = lazy(() => import('./pages/ParentPortal').then(module => ({ default: module.ParentPortal })));
const PasswordReset = lazy(() => import('./pages/PasswordReset').then(module => ({ default: module.PasswordReset })));
const TermManagement = lazy(() => import('./pages/TermManagement').then(module => ({ default: module.TermManagement })));
const AuditLogViewer = lazy(() => import('./pages/AuditLogViewer').then(module => ({ default: module.AuditLogViewer })));
const StudentAssignment = lazy(() => import('./pages/StudentAssignment').then(module => ({ default: module.StudentAssignment })));
const UserManagement = lazy(() => import('./pages/admin/UserManagement').then(module => ({ default: module.UserManagement })));
const StaffAuthAudit = lazy(() => import('./pages/admin/StaffAuthAudit').then(module => ({ default: module.StaffAuthAudit })));
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const Blog = lazy(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));
const Careers = lazy(() => import('./pages/Careers').then(module => ({ default: module.Careers })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(module => ({ default: module.BlogPost })));

const LoadingSpinner = () => (
  <div className="min-h-screen bg-dark-bg flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Suspense fallback={<LoadingSpinner />}><LandingPage /></Suspense>,
  },
  {
    path: "/login",
    element: <Suspense fallback={<LoadingSpinner />}><Login /></Suspense>,
  },
  {
    path: "/reset-password",
    element: <Suspense fallback={<LoadingSpinner />}><PasswordReset /></Suspense>,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/class-manager",
    element: <ProtectedRoute allowedRoles={['admin', 'staff']}><Layout><Suspense fallback={<LoadingSpinner />}><ClassManager /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/lessons",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingSpinner />}><LessonGenerator /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/exams",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingSpinner />}><ExamBuilder /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/marking",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingSpinner />}><PaperScanner /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/analytics",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingSpinner />}><Analytics /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/settings",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingSpinner />}><Settings /></Suspense></Layout></ProtectedRoute>,
  },
  // Financial Module Routes
  {
    path: "/financial",
    element: <ProtectedRoute allowedRoles={['admin', 'bursar']}><Layout><Suspense fallback={<LoadingSpinner />}><FullAccountExplore /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/financial/fund-wallet",
    element: <ProtectedRoute allowedRoles={['admin', 'bursar']}><Layout><Suspense fallback={<LoadingSpinner />}><FundParentWallet /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/financial/pay-fees",
    element: <ProtectedRoute allowedRoles={['admin', 'bursar', 'parent']}><Layout><Suspense fallback={<LoadingSpinner />}><PayForStudents /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={['admin']}><Layout><Suspense fallback={<LoadingSpinner />}><AdminDashboard /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/attendance",
    element: <ProtectedRoute allowedRoles={['admin', 'staff']}><Layout><Suspense fallback={<LoadingSpinner />}><AttendanceTracking /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/grades",
    element: <ProtectedRoute allowedRoles={['admin', 'staff']}><Layout><Suspense fallback={<LoadingSpinner />}><GradeEntry /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/students/assign",
    element: <ProtectedRoute allowedRoles={['admin', 'staff']}><Layout><Suspense fallback={<LoadingSpinner />}><StudentAssignment /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/portal",
    element: <ProtectedRoute allowedRoles={['student', 'parent']}><Layout><Suspense fallback={<LoadingSpinner />}><StudentPortal /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/portal/attendance",
    element: <ProtectedRoute allowedRoles={['student', 'parent']}><Layout><Suspense fallback={<LoadingSpinner />}><StudentAttendance /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/portal/results",
    element: <ProtectedRoute allowedRoles={['student', 'parent']}><Layout><Suspense fallback={<LoadingSpinner />}><StudentResults /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/portal/parent",
    element: <ProtectedRoute allowedRoles={['parent']}><Layout><Suspense fallback={<LoadingSpinner />}><ParentPortal /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/admin/terms",
    element: <ProtectedRoute allowedRoles={['admin']}><Layout><Suspense fallback={<LoadingSpinner />}><TermManagement /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/admin/audit-logs",
    element: <ProtectedRoute allowedRoles={['admin']}><Layout><Suspense fallback={<LoadingSpinner />}><AuditLogViewer /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/admin/users",
    element: <ProtectedRoute allowedRoles={['admin']}><Layout><Suspense fallback={<LoadingSpinner />}><UserManagement /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/admin/staff-auth",
    element: <ProtectedRoute allowedRoles={['admin']}><Layout><Suspense fallback={<LoadingSpinner />}><StaffAuthAudit /></Suspense></Layout></ProtectedRoute>,
  },
  {
    path: "/about",
    element: <Suspense fallback={<LoadingSpinner />}><About /></Suspense>,
  },
  {
    path: "/blog",
    element: <Suspense fallback={<LoadingSpinner />}><Blog /></Suspense>,
  },
  {
    path: "/contact",
    element: <Suspense fallback={<LoadingSpinner />}><Contact /></Suspense>,
  },
  {
    path: "/careers",
    element: <Suspense fallback={<LoadingSpinner />}><Careers /></Suspense>,
  },
  {
    path: "/blog/:slug",
    element: <Suspense fallback={<LoadingSpinner />}><BlogPost /></Suspense>,
  },
]);

// Error boundary fallback UI
const ErrorFallback = () => (
  <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
    <div className="bg-dark-card border border-red-500/20 rounded-lg p-8 max-w-md text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-red-500 mb-2">Something Went Wrong</h1>
      <p className="text-gray-400 mb-6">
        We've been notified about this issue and our team is looking into it.
      </p>
      <button
        onClick={() => window.location.href = '/'}
        className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition font-medium"
      >
        Go to Home
      </button>
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<ErrorFallback />} showDialog={true}>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
