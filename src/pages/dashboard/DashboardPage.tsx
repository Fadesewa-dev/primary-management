import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils';

interface Stats {
  students: number;
  teachers: number;
  classes: number;
  totalFees: number;
  collectedFees: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  event_type: string;
}

interface RecentStudent {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  created_at: string;
}

const eventTypeColor: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700',
  sports: 'bg-green-100 text-green-700',
  cultural: 'bg-purple-100 text-purple-700',
  holiday: 'bg-red-100 text-red-700',
  meeting: 'bg-yellow-100 text-yellow-700',
};

const quickActions = [
  { label: 'Add Student',      emoji: '🎓', to: '/students'   },
  { label: 'Add Teacher',      emoji: '📋', to: '/teachers'   },
  { label: 'Mark Attendance',  emoji: '✅', to: '/attendance' },
  { label: 'Record Payment',   emoji: '💳', to: '/fees'       },
];

const statCards = (stats: Stats, feePercentage: number) => [
  {
    label: 'Total Students',
    value: stats.students,
    emoji: '🎓',
    tag: 'Active',
    tagColor: '#16a34a',
    tagBg: 'rgba(22,163,74,0.1)',
    prefix: '',
  },
  {
    label: 'Total Teachers',
    value: stats.teachers,
    emoji: '📋',
    tag: 'Active',
    tagColor: '#16a34a',
    tagBg: 'rgba(22,163,74,0.1)',
    prefix: '',
  },
  {
    label: 'Total Classes',
    value: stats.classes,
    emoji: '📚',
    tag: '2024-25',
    tagColor: '#2563eb',
    tagBg: 'rgba(37,99,235,0.1)',
    prefix: '',
  },
  {
    label: 'Fees Collected',
    value: stats.collectedFees.toLocaleString(),
    emoji: '💳',
    tag: `${feePercentage}%`,
    tagColor: '#D4AF37',
    tagBg: 'rgba(212,175,55,0.1)',
    prefix: 'D ',
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    students: 0, teachers: 0, classes: 0, totalFees: 0, collectedFees: 0,
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        { count: studentCount },
        { count: teacherCount },
        { count: classCount },
        { data: feesData },
        { data: eventsData },
        { data: recentStudentsData },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('fees').select('amount, paid'),
        supabase.from('events').select('*').gte('date', new Date().toISOString().split('T')[0]).order('date').limit(5),
        supabase.from('students').select('id, first_name, last_name, student_id, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalFees = feesData?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const collectedFees = feesData?.reduce((sum, f) => sum + Number(f.paid), 0) || 0;

      setStats({ students: studentCount || 0, teachers: teacherCount || 0, classes: classCount || 0, totalFees, collectedFees });
      setEvents(eventsData || []);
      setRecentStudents(recentStudentsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const feePercentage = stats.totalFees > 0 ? Math.round((stats.collectedFees / stats.totalFees) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Hero Banner */}
      <div
        className="rounded-2xl p-8 flex items-center justify-between overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Background glow */}
        <div
          className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }}
        />
        <div
          className="absolute left-1/2 bottom-0 w-48 h-48 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(-50%, 50%)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
              style={{ border: '2px solid rgba(212,175,55,0.6)', boxShadow: '0 0 16px rgba(212,175,55,0.3)' }}
            >
              <img src="/images/gfa-logo.jpeg" alt="GFA" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Welcome to G.F.A Portal</h1>
              <p className="text-sm font-medium italic" style={{ color: '#D4AF37' }}>
                Glowing Future Academy — Glow With Pride
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(212,175,55,0.6)' }}>
            Academic Year 2024 — 2025 · First Term
          </p>
        </div>

        <div
          className="hidden md:flex flex-col items-center justify-center w-20 h-20 rounded-2xl relative z-10"
          style={{
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
          }}
        >
          <span className="text-3xl">🏫</span>
          <span className="text-xs mt-1" style={{ color: '#D4AF37' }}>GFA</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards(stats, feePercentage).map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1"
            style={{
              background: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(212,175,55,0.1)' }}
              >
                {card.emoji}
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ color: card.tagColor, background: card.tagBg }}
              >
                {card.tag}
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900">
              {card.prefix}{card.value}
            </p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Fee Progress */}
      {stats.totalFees > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800">Fee Collection Progress</h2>
              <p className="text-xs text-gray-400 mt-0.5">Academic Year 2024-2025</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">D {stats.collectedFees.toLocaleString()}</p>
              <p className="text-xs text-gray-400">of D {stats.totalFees.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${feePercentage}%`,
                background: 'linear-gradient(90deg, #D4AF37, #F5C842)',
                boxShadow: '0 2px 8px rgba(212,175,55,0.4)',
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">Collected: {feePercentage}%</span>
            <span className="text-xs text-red-400 font-medium">
              Outstanding: D {(stats.totalFees - stats.collectedFees).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Events + Recent Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Upcoming Events */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800">Upcoming Events</h2>
            <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>
              {events.length} upcoming
            </span>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-10 text-gray-300">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm text-gray-400">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50"
                  style={{ border: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <div
                    className="text-center rounded-xl p-2 min-w-12 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)' }}
                  >
                    <p className="text-xs font-medium text-gray-300">
                      {new Date(event.date).toLocaleDateString('en-GB', { month: 'short' })}
                    </p>
                    <p className="text-lg font-black text-white leading-none">
                      {new Date(event.date).getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{event.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${eventTypeColor[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                      {event.event_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Students */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800">Recent Students</h2>
            <a href="/students" className="text-xs font-medium hover:underline" style={{ color: '#D4AF37' }}>
              View all
            </a>
          </div>
          {recentStudents.length === 0 ? (
            <div className="text-center py-10 text-gray-300">
              <p className="text-4xl mb-2">🎓</p>
              <p className="text-sm text-gray-400">No students added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50"
                  style={{ border: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}
                  >
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{student.student_id}</p>
                  </div>
                  <p className="text-xs text-gray-300 flex-shrink-0">{formatDate(student.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
      >
        <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <a
              key={action.to}
              href={action.to}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-1 text-center group"
              style={{
                background: 'linear-gradient(135deg, #f8f8f8, #f0f0f0)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05))';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(212,175,55,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #f8f8f8, #f0f0f0)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.06)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <span className="text-3xl">{action.emoji}</span>
              <span className="text-xs font-semibold text-gray-600">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
