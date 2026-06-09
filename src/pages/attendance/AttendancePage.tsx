import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note: string;
  dismissal_time?: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

const statusConfig = {
  present: { label: 'Present', color: '#16a34a', bg: 'rgba(22,163,74,0.1)', icon: '✅' },
  absent:  { label: 'Absent',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: '❌' },
  late:    { label: 'Late',    color: '#d97706', bg: 'rgba(217,119,6,0.1)',  icon: '⏰' },
  excused: { label: 'Excused', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', icon: '📝' },
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { if (selectedClass) fetchStudentsAndAttendance(); }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('grade');
    setClasses(data || []);
  };

  const fetchStudentsAndAttendance = async () => {
    setLoadingStudents(true);
    const { data: studentsData } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_id')
      .eq('class_id', selectedClass)
      .eq('status', 'active')
      .order('first_name');

    const studentsList = studentsData || [];
    setStudents(studentsList);

    // Fetch existing attendance for this date and class
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', selectedClass)
      .eq('date', selectedDate);

    // Build attendance map
    const attendanceMap: Record<string, AttendanceRecord> = {};

    // Default all to present
    studentsList.forEach((s) => {
      attendanceMap[s.id] = { student_id: s.id, status: 'present', note: '', dismissal_time: '' };
    });

    // Override with saved data
    attendanceData?.forEach((a) => {
      attendanceMap[a.student_id] = { student_id: a.student_id, status: a.status, note: a.note || '', dismissal_time: a.dismissal_time || '' };
    });

    setAttendance(attendanceMap);
    setSaved(false);
    setLoadingStudents(false);
  };

  const setStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
    setSaved(false);
  };

  const setNote = (studentId: string, note: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }));
  };

  const setDismissalTime = (studentId: string, dismissal_time: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], dismissal_time },
    }));
    setSaved(false);
  };

  const markAllDismissed = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated: Record<string, AttendanceRecord> = {};
    students.forEach((s) => {
      updated[s.id] = { ...attendance[s.id], student_id: s.id, dismissal_time: timeStr };
    });
    setAttendance(updated);
    setSaved(false);
  };

  const markAll = (status: 'present' | 'absent' | 'late' | 'excused') => {
    const updated: Record<string, AttendanceRecord> = {};
    students.forEach((s) => {
      updated[s.id] = { student_id: s.id, status, note: attendance[s.id]?.note || '' };
    });
    setAttendance(updated);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedClass || students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        class_id: selectedClass,
        date: selectedDate,
        status: attendance[s.id]?.status || 'present',
        note: attendance[s.id]?.note || null,
        dismissal_time: attendance[s.id]?.dismissal_time || null,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,date' });

      if (error) throw error;
      setSaved(true);
    } catch (err) {
      console.error('Error saving attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const summary: AttendanceSummary = {
    present: Object.values(attendance).filter((a) => a.status === 'present').length,
    absent:  Object.values(attendance).filter((a) => a.status === 'absent').length,
    late:    Object.values(attendance).filter((a) => a.status === 'late').length,
    excused: Object.values(attendance).filter((a) => a.status === 'excused').length,
  };

  const selectedClassName = classes.find((c) => c.id === selectedClass)?.name || '';

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div
        className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
      >
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Attendance</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            Mark and track daily student attendance
          </p>
        </div>
        <div
          className="relative z-10 hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          <span className="text-2xl">✅</span>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-5"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Select Class & Date</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none bg-gray-50 transition-all"
              onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; }}
              onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; }}
            >
              <option value="">-- Select a class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Date</label>
            <input type="date" value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none bg-gray-50 transition-all"
              onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; }}
              onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; }}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {selectedClass && students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((key) => (
            <div key={key} className="rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${statusConfig[key].color}22` }}>
              <p className="text-2xl mb-1">{statusConfig[key].icon}</p>
              <p className="text-2xl font-black" style={{ color: statusConfig[key].color }}>{summary[key]}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{statusConfig[key].label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Table */}
      {!selectedClass ? (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-5xl mb-3">📋</p>
          <p className="font-bold text-gray-600">Select a class to start</p>
          <p className="text-sm text-gray-400 mt-1">Choose a class and date above to mark attendance</p>
        </div>
      ) : loadingStudents ? (
        <div className="flex items-center justify-center h-48 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-5xl mb-3">🎓</p>
          <p className="font-bold text-gray-600">No students in this class</p>
          <p className="text-sm text-gray-400 mt-1">Add students to this class first</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>

          {/* Table Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
            <div>
              <h2 className="font-black text-white">{selectedClassName} — Attendance</h2>
              <p className="text-xs mt-0.5" style={{ color: '#D4AF37' }}>
                {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Mark All Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 hidden md:block">Mark all:</span>
              {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((key) => (
                <button key={key} onClick={() => markAll(key)}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5"
                  style={{ background: statusConfig[key].bg, color: statusConfig[key].color, border: `1px solid ${statusConfig[key].color}33` }}>
                  {statusConfig[key].icon}
                </button>
              ))}
              <button onClick={markAllDismissed}
                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 ml-1"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.3)' }}>
                🚪 Dismiss All
              </button>
            </div>
          </div>

          {/* Students List */}
          <div className="divide-y divide-gray-50">
            {students.map((student, idx) => {
              const record = attendance[student.id];
              const currentStatus = record?.status || 'present';
              const config = statusConfig[currentStatus];

              return (
                <div key={student.id}
                  className="p-4 flex items-center gap-4 transition-colors"
                  style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}>
                    {student.first_name[0]}{student.last_name[0]}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs font-mono text-gray-400">{student.student_id}</p>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex gap-1.5">
                    {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((key) => (
                      <button key={key} onClick={() => setStatus(student.id, key)}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                        style={currentStatus === key
                          ? { background: statusConfig[key].color, color: '#fff', boxShadow: `0 2px 8px ${statusConfig[key].color}44` }
                          : { background: '#f3f4f6', color: '#9ca3af' }
                        }>
                        {statusConfig[key].icon} <span className="hidden md:inline">{statusConfig[key].label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Status Badge */}
                  <div className="hidden lg:block w-20 text-center">
                    <span className="text-xs px-2 py-1 rounded-full font-semibold"
                      style={{ background: config.bg, color: config.color }}>
                      {config.label}
                    </span>
                  </div>

                  {/* Dismissal Time */}
                  <div className="hidden lg:flex flex-col items-center gap-0.5">
                    <span className="text-xs text-gray-400 font-medium">Dismissal</span>
                    <input
                      type="time"
                      value={record?.dismissal_time || ''}
                      onChange={(e) => setDismissalTime(student.id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-gray-50 focus:outline-none w-24"
                      style={{ fontSize: '12px', color: record?.dismissal_time ? '#7c3aed' : '#9ca3af' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between"
            style={{ background: '#fafafa' }}>
            <p className="text-sm text-gray-500">
              {students.length} students · {summary.present} present · {summary.absent} absent
            </p>
            <button onClick={handleSave} disabled={saving || saved}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{
                background: saved ? 'rgba(22,163,74,0.1)' : 'linear-gradient(135deg, #2c2c2c, #3a3a3a)',
                color: saved ? '#16a34a' : '#D4AF37',
                boxShadow: saved ? 'none' : '0 4px 16px rgba(0,0,0,0.3)',
              }}>
              {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
