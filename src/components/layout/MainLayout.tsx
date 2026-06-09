import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState } from 'react';

export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #F5C842)',
              color: '#1a1a2e',
              boxShadow: '0 0 40px rgba(212,175,55,0.4)',
            }}
          >
            GFA
          </div>
          <div
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}
          ></div>
          <p className="text-white/60 text-sm mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{
            background: 'linear-gradient(135deg, #f5f6fa 0%, #eef0f5 100%)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}