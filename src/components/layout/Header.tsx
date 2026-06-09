import { useAuth } from '../../contexts/AuthContext';

type HeaderProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Hamburger Menu - Mobile Only */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden w-10 h-10 flex items-center justify-center text-2xl text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Left - Page greeting */}
      <div className="flex-1 md:flex-none md:ml-0 ml-3">
        <p className="text-gray-800 font-semibold text-sm">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <p className="text-xs text-gray-400">Academic Year 2025 — 2026</p>
      </div>

      {/* Right - User Info */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100"
          title="Notifications"
        >
          <span className="text-gray-500 text-lg">🔔</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 hidden md:block"></div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-800">Administrator</p>
            <p className="text-xs text-gray-400 truncate max-w-32">{user?.email}</p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
              color: '#D4AF37',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}