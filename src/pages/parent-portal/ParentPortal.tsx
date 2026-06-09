import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ParentInfo {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

interface LinkedStudent {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  class_name: string;
  gender: string;
  enrollment_date: string;
}

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

interface GradeRecord {
  subject: string;
  score: number;
  max_score: number;
  grade_type: string;
  term: string;
  date: string;
}

interface FeeRecord {
  fee_type: string;
  amount: number;
  paid: number;
  status: string;
  due_date: string;
  term: string;
}

const statusColors = {
  present: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', icon: '✅' },
  absent:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: '❌' },
  late:    { color: '#d97706', bg: 'rgba(217,119,6,0.1)',  icon: '⏰' },
  excused: { color: '#2563eb', bg: 'rgba(37,99,235,0.1)',  icon: '📝' },
};

const gradeColor: Record<string, string> = {
  'A+': '#16a34a', 'A': '#16a34a', 'B': '#2563eb',
  'C': '#d97706', 'D': '#ea580c', 'F': '#ef4444',
};

const getGradeLabel = (score: number, max: number): string => {
  const pct = (score / max) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
};

const inputClass = "w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none transition-all bg-gray-50";
const inputStyle = { fontSize: '16px' };

export default function ParentPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<LinkedStudent | null>(null);
  const [activeTab, setActiveTab] = useState('attendance');

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    checkSession();
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadParentData(session.user.id);
      } else {
        setIsLoggedIn(false);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedStudent) loadStudentData(selectedStudent.id);
  }, [selectedStudent, activeTab]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadParentData(session.user.id);
    } else {
      setLoading(false);
    }
  };

  const loadParentData = async (userId: string) => {
    const { data: parent } = await supabase
      .from('parents')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (!parent) {
      setLoginError('No parent account found for this email. Please contact the school.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setParentInfo(parent);

    const { data: links } = await supabase
      .from('student_parents')
      .select('students(id, first_name, last_name, student_id, gender, enrollment_date, classes(name))')
      .eq('parent_id', parent.id);

    const linkedStudents: LinkedStudent[] = (links || []).map((link: any) => ({
      id: link.students.id,
      first_name: link.students.first_name,
      last_name: link.students.last_name,
      student_id: link.students.student_id,
      gender: link.students.gender,
      enrollment_date: link.students.enrollment_date,
      class_name: link.students.classes?.name || '—',
    }));

    setStudents(linkedStudents);
    if (linkedStudents.length > 0) setSelectedStudent(linkedStudents[0]);
    setIsLoggedIn(true);
    setLoading(false);
  };

 const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (error) throw error;
      if (data?.user) {
        await loadParentData(data.user.id);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password');
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setParentInfo(null);
    setStudents([]);
    setSelectedStudent(null);
  };

  const loadStudentData = async (studentId: string) => {
    setDataLoading(true);
    try {
      if (activeTab === 'attendance') {
        const { data } = await supabase
          .from('attendance')
          .select('date, status')
          .eq('student_id', studentId)
          .order('date', { ascending: false })
          .limit(30);
        setAttendance(data || []);
      }
      if (activeTab === 'grades') {
        const { data } = await supabase
          .from('grades')
          .select('subject, score, max_score, grade_type, term, date')
          .eq('student_id', studentId)
          .order('date', { ascending: false });
        setGrades(data || []);
      }
      if (activeTab === 'fees') {
        const { data } = await supabase
          .from('fees')
          .select('fee_type, amount, paid, status, due_date, term')
          .eq('student_id', studentId)
          .order('due_date', { ascending: false });
        setFees(data || []);
      }
    } finally {
      setDataLoading(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a, #454545)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4"
            style={{ border: '2px solid rgba(212,175,55,0.5)' }}>
            <img src="/images/gfa-logo.jpeg" alt="GFA" className="w-full h-full object-cover" />
          </div>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)' }}>
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4"
              style={{ border: '3px solid rgba(212,175,55,0.6)', boxShadow: '0 8px 32px rgba(212,175,55,0.3)' }}>
              <img src="/images/gfa-logo.jpeg" alt="GFA" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black text-white">Parent Portal</h1>
            <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>Glowing Future Academy</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl p-8" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
            <h2 className="text-xl font-black text-gray-900 mb-1">Welcome Back</h2>
            <p className="text-sm text-gray-400 mb-6">Sign in to view your child's progress</p>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className={`${inputClass} pr-12`} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loginLoading}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 mt-2"
                style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400 mt-6">
              Contact the school office if you need access
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Portal Dashboard
  const attStats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent:  attendance.filter(a => a.status === 'absent').length,
    late:    attendance.filter(a => a.status === 'late').length,
    total:   attendance.length,
  };
  const attPct = attStats.total > 0 ? Math.round((attStats.present / attStats.total) * 100) : 0;
  const totalFees = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paid, 0);
  const balance = totalFees - totalPaid;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f6fa, #eef0f5)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden"
            style={{ border: '1px solid rgba(212,175,55,0.5)' }}>
            <img src="/images/gfa-logo.jpeg" alt="GFA" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white text-sm font-black leading-tight">Parent Portal</p>
            <p className="text-xs" style={{ color: '#D4AF37' }}>
              {parentInfo?.first_name} {parentInfo?.last_name}
            </p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
          Sign Out
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">

        {/* Student Selector */}
        {students.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {students.map((s) => (
              <button key={s.id} onClick={() => setSelectedStudent(s)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={selectedStudent?.id === s.id
                  ? { background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
                  : { background: '#fff', color: '#6b7280', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
                }>
                {s.first_name}
              </button>
            ))}
          </div>
        )}

        {selectedStudent && (
          <>
            {/* Student Card */}
            <div className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                  {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-white">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h2>
                  <p className="text-sm" style={{ color: '#D4AF37' }}>{selectedStudent.class_name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedStudent.student_id}</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-lg font-black" style={{ color: attPct >= 75 ? '#4ade80' : '#fbbf24' }}>{attPct}%</p>
                  <p className="text-xs text-gray-400">Attendance</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-lg font-black text-white">{grades.length}</p>
                  <p className="text-xs text-gray-400">Assessments</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-lg font-black" style={{ color: balance > 0 ? '#f87171' : '#4ade80' }}>
                    {balance > 0 ? 'Owing' : 'Clear'}
                  </p>
                  <p className="text-xs text-gray-400">Fees</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'attendance', label: 'Attendance', icon: '✅' },
                { id: 'grades',     label: 'Grades',     icon: '📊' },
                { id: 'fees',       label: 'Fees',       icon: '💳' },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="rounded-xl py-3 text-center transition-all"
                  style={activeTab === tab.id
                    ? { background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
                    : { background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
                  }>
                  <p className="text-lg">{tab.icon}</p>
                  <p className="text-xs font-bold mt-0.5"
                    style={{ color: activeTab === tab.id ? '#D4AF37' : '#6b7280' }}>
                    {tab.label}
                  </p>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

              {dataLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
                </div>
              ) : (
                <>
                  {/* Attendance Tab */}
                  {activeTab === 'attendance' && (
                    <div>
                      <div className="p-4 border-b border-gray-100"
                        style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                        <h3 className="font-black text-white">Attendance Record</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Last 30 records</p>
                      </div>
                      {/* Summary */}
                      <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-50">
                        {[
                          { label: 'Present', value: attStats.present, color: '#16a34a' },
                          { label: 'Absent',  value: attStats.absent,  color: '#ef4444' },
                          { label: 'Late',    value: attStats.late,    color: '#d97706' },
                          { label: 'Rate',    value: `${attPct}%`,     color: attPct >= 75 ? '#16a34a' : '#d97706' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center p-2 rounded-xl bg-gray-50">
                            <p className="text-lg font-black" style={{ color }}>{value}</p>
                            <p className="text-xs text-gray-400">{label}</p>
                          </div>
                        ))}
                      </div>
                      {attendance.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                          <p className="text-3xl mb-2">📋</p>
                          <p className="text-sm">No attendance records yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {attendance.map((a, idx) => {
                            const sc = statusColors[a.status];
                            return (
                              <div key={idx} className="flex items-center justify-between px-4 py-3">
                                <p className="text-sm font-medium text-gray-700">
                                  {new Date(a.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </p>
                                <span className="text-xs px-3 py-1 rounded-full font-semibold capitalize"
                                  style={{ background: sc.bg, color: sc.color }}>
                                  {sc.icon} {a.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grades Tab */}
                  {activeTab === 'grades' && (
                    <div>
                      <div className="p-4 border-b border-gray-100"
                        style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                        <h3 className="font-black text-white">Academic Results</h3>
                        <p className="text-xs text-gray-400 mt-0.5">All assessment records</p>
                      </div>
                      {grades.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                          <p className="text-3xl mb-2">📊</p>
                          <p className="text-sm">No grade records yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {grades.map((g, idx) => {
                            const label = getGradeLabel(g.score, g.max_score);
                            const pct = Math.round((g.score / g.max_score) * 100);
                            return (
                              <div key={idx} className="px-4 py-3 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{g.subject}</p>
                                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                                    {g.grade_type} · {g.term}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black" style={{ color: gradeColor[label] }}>
                                    {label} ({pct}%)
                                  </p>
                                  <p className="text-xs text-gray-400">{g.score}/{g.max_score}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fees Tab */}
                  {activeTab === 'fees' && (
                    <div>
                      <div className="p-4 border-b border-gray-100"
                        style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                        <h3 className="font-black text-white">Fee Status</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Payment summary</p>
                      </div>
                      {/* Fee Summary */}
                      <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-50">
                        {[
                          { label: 'Total Fees', value: `D ${totalFees.toLocaleString()}`,  color: '#2c2c2c' },
                          { label: 'Paid',       value: `D ${totalPaid.toLocaleString()}`,  color: '#16a34a' },
                          { label: 'Balance',    value: `D ${balance.toLocaleString()}`,    color: balance > 0 ? '#ef4444' : '#16a34a' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center p-2 rounded-xl bg-gray-50">
                            <p className="text-sm font-black" style={{ color }}>{value}</p>
                            <p className="text-xs text-gray-400">{label}</p>
                          </div>
                        ))}
                      </div>
                      {fees.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                          <p className="text-3xl mb-2">💳</p>
                          <p className="text-sm">No fee records yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {fees.map((f, idx) => {
                            const fbal = f.amount - f.paid;
                            const isPaid = fbal <= 0;
                            return (
                              <div key={idx} className="px-4 py-3 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{f.fee_type}</p>
                                  <p className="text-xs text-gray-400">{f.term}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black" style={{ color: isPaid ? '#16a34a' : '#ef4444' }}>
                                    {isPaid ? '✓ Paid' : `D ${fbal.toLocaleString()} owing`}
                                  </p>
                                  <p className="text-xs text-gray-400">D {f.amount.toLocaleString()} total</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {students.length === 0 && (
          <div className="text-center py-16 rounded-2xl bg-white"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-5xl mb-3">👨‍👩‍👧</p>
            <p className="font-bold text-gray-600">No children linked</p>
            <p className="text-sm text-gray-400 mt-1">Please contact the school to link your children</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Glowing Future Academy · Parent Portal · 2025
        </p>
      </div>
    </div>
  );
}
