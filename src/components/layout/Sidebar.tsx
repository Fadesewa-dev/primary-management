import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type SidebarProps = {
  setSidebarOpen?: (open: boolean) => void;
};

const navItems = [
  { to: '/',           label: 'Dashboard',  emoji: '🏠' },
  { to: '/students',   label: 'Students',   emoji: '🎓' },
  { to: '/teachers',   label: 'Teachers',   emoji: '📋' },
  { to: '/classes',    label: 'Classes',    emoji: '📚' },
  { to: '/attendance', label: 'Attendance', emoji: '✅' },
  { to: '/grades',     label: 'Grades',     emoji: '📊' },
  { to: '/parents',     label: 'Parents',     emoji: '👨‍👩‍👧' },
  { to: '/pickup-log', label: 'Pickup Log',  emoji: '🚗' },
  { to: '/fees',       label: 'Fees',        emoji: '💳' },
  { to: '/library',    label: 'Library',    emoji: '📖' },
  { to: '/events',     label: 'Events',     emoji: '📅' },
  { to: '/reports',    label: 'Reports',    emoji: '📋' },
  { to: '/settings',   label: 'Settings',   emoji: '⚙️'  },
];

export default function Sidebar({ setSidebarOpen }: SidebarProps) {
  const { user, logout } = useAuth();

  const handleNavClick = () => {
    // Close sidebar on mobile after clicking a link
    if (setSidebarOpen && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside
      className="w-64 flex flex-col flex-shrink-0 h-full"
      style={{
        background: 'linear-gradient(180deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Logo Area */}
      <div
        className="p-5 flex flex-col items-center text-center border-b"
        style={{ borderColor: 'rgba(212,175,55,0.25)' }}
      >
        <div
          className="w-16 h-16 rounded-full overflow-hidden mb-3"
          style={{
            boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
            border: '2px solid rgba(212,175,55,0.6)',
            background: '#fff',
          }}
        >
          <img src="/images/gfa-logo.jpeg" alt="GFA Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-white font-bold text-xs leading-tight">
          Glowing Future Academy
        </h1>
        <p className="text-xs mt-1 font-medium italic" style={{ color: '#D4AF37' }}>
          Glow With Pride
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="text-xs font-semibold uppercase tracking-widest px-3 mb-3"
          style={{ color: 'rgba(212,175,55,0.5)' }}
        >
          Main Menu
        </p>
        {navItems.map(({ to, label, emoji }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                    borderLeft: '3px solid #D4AF37',
                    color: '#F5C842',
                  }
                : {}
            }
          >
            <span className="text-base w-6 text-center">{emoji}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)', color: '#2c2c2c' }}
          >
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.email || 'Admin'}</p>
            <p className="text-xs" style={{ color: '#D4AF37' }}>Administrator</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-xs py-2 rounded-lg font-medium transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220,38,38,0.2)';
            e.currentTarget.style.color = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}