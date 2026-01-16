import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css'
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

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
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
