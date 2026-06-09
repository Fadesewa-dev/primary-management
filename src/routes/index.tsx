import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '../components/layout/MainLayout';

const Loader = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
  </div>
);

const LoginPage      = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage  = lazy(() => import('../pages/dashboard/DashboardPage'));
const StudentsPage   = lazy(() => import('../pages/students/StudentsPage'));
const TeachersPage   = lazy(() => import('../pages/teachers/TeachersPage'));
const ClassesPage    = lazy(() => import('../pages/classes/ClassesPage'));
const AttendancePage = lazy(() => import('../pages/attendance/AttendancePage'));
const GradesPage     = lazy(() => import('../pages/grades/GradesPage'));
const FeesPage       = lazy(() => import('../pages/fees/FeesPage'));
const LibraryPage    = lazy(() => import('../pages/library/LibraryPage'));
const EventsPage     = lazy(() => import('../pages/events/EventsPage'));
const ReportsPage    = lazy(() => import('../pages/reports/ReportsPage'));
const SettingsPage   = lazy(() => import('../pages/settings/SettingsPage'));
const ParentsPage    = lazy(() => import('../pages/parents/ParentsPage'));
const ParentPortal = lazy(() => import('../pages/parent-portal/ParentPortal'));
const PickupLogPage = lazy(() => import('../pages/pickup-log/PickupLogPage'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Suspense fallback={<Loader />}><LoginPage /></Suspense>,
  },
  
  {
    path: '/parent-portal',
    element: <Suspense fallback={<Loader />}><ParentPortal /></Suspense>,
  },

  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true,        element: <Suspense fallback={<Loader />}><DashboardPage /></Suspense>  },
      { path: 'students',   element: <Suspense fallback={<Loader />}><StudentsPage /></Suspense>   },
      { path: 'teachers',   element: <Suspense fallback={<Loader />}><TeachersPage /></Suspense>   },
      { path: 'classes',    element: <Suspense fallback={<Loader />}><ClassesPage /></Suspense>    },
      { path: 'attendance', element: <Suspense fallback={<Loader />}><AttendancePage /></Suspense> },
      { path: 'grades',     element: <Suspense fallback={<Loader />}><GradesPage /></Suspense>     },
      { path: 'fees',       element: <Suspense fallback={<Loader />}><FeesPage /></Suspense>       },
      { path: 'library',    element: <Suspense fallback={<Loader />}><LibraryPage /></Suspense>    },
      { path: 'events',     element: <Suspense fallback={<Loader />}><EventsPage /></Suspense>     },
      { path: 'reports',    element: <Suspense fallback={<Loader />}><ReportsPage /></Suspense>    },
      { path: 'settings',   element: <Suspense fallback={<Loader />}><SettingsPage /></Suspense>   },
      { path: 'parents',     element: <Suspense fallback={<Loader />}><ParentsPage /></Suspense> },
      { path: 'pickup-log', element: <Suspense fallback={<Loader />}><PickupLogPage /></Suspense> },
      { path: '*',          element: <Navigate to="/" replace /> },
    ],
  },
]);