import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css'
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const LessonGenerator = lazy(() => import('./pages/LessonGenerator').then(module => ({ default: module.LessonGenerator })));
const ExamBuilder = lazy(() => import('./pages/ExamBuilder').then(module => ({ default: module.ExamBuilder })));
const PaperScanner = lazy(() => import('./pages/PaperScanner').then(module => ({ default: module.PaperScanner })));
const Analytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const FullAccountExplore = lazy(() => import('./pages/financial/FullAccountExplore').then(module => ({ default: module.FullAccountExplore })));
const FundParentWallet = lazy(() => import('./pages/financial/FundParentWallet').then(module => ({ default: module.FundParentWallet })));
const PayForStudents = lazy(() => import('./pages/financial/PayForStudents').then(module => ({ default: module.PayForStudents })));

const LoadingSpinner = () => (
  <div className="min-h-screen bg-dark-bg flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Suspense fallback={<LoadingSpinner />}><Login /></Suspense>,
  },
  {
    path: "/",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense></Layout></ProtectedRoute>,
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
    element: <ProtectedRoute allowedRoles={['admin', 'bursar']}><Layout><Suspense fallback={<LoadingSpinner />}><PayForStudents /></Suspense></Layout></ProtectedRoute>,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
