import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '../components/layout/MainLayout';

const Loader = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
      style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
  </div>
);

const LandingPage    = lazy(() => import('../pages/landing/LandingPage'));
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
const ParentPortal   = lazy(() => import('../pages/parent-portal/ParentPortal'));
const PickupLogPage  = lazy(() => import('../pages/pickup-log/PickupLogPage'));

const wrap = (Page: React.ComponentType) => (
  <Suspense fallback={<Loader />}><Page /></Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: wrap(LandingPage),
  },
  {
    path: '/login',
    element: wrap(LoginPage),
  },
  {
    path: '/parent-portal',
    element: wrap(ParentPortal),
  },
  {
    path: '/dashboard',
    element: <MainLayout />,
    children: [
      { index: true,        element: wrap(DashboardPage)  },
      { path: 'students',   element: wrap(StudentsPage)   },
      { path: 'teachers',   element: wrap(TeachersPage)   },
      { path: 'classes',    element: wrap(ClassesPage)    },
      { path: 'attendance', element: wrap(AttendancePage) },
      { path: 'grades',     element: wrap(GradesPage)     },
      { path: 'fees',       element: wrap(FeesPage)       },
      { path: 'library',    element: wrap(LibraryPage)    },
      { path: 'events',     element: wrap(EventsPage)     },
      { path: 'reports',    element: wrap(ReportsPage)    },
      { path: 'settings',   element: wrap(SettingsPage)   },
      { path: 'parents',    element: wrap(ParentsPage)    },
      { path: 'pickup-log', element: wrap(PickupLogPage)  },
      { path: '*',          element: <Navigate to="/dashboard" replace /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
