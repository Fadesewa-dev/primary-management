import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate, formatCurrency } from '../../utils';

interface AttendanceSummary {
  student_id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  total_days: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

interface FeeDefaulter {
  student_id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  total_fees: number;
  total_paid: number;
  balance: number;
}

interface GradeSummary {
  student_id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  subject: string;
  score: number;
  max_score: number;
  percentage: number;
  grade: string;
  term: string;
}

interface Class {
  id: string;
  name: string;
}

const inputClass = "border-2 border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none bg-gray-50 transition-all";
const inputStyle = { fontSize: '16px' };

interface EmergencyContact {
  student_id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  parent_name: string;
  relationship: string;
  phone: string;
  phone2: string;
  can_pickup: boolean;
}

interface FeeCollectionSummary {
  class_name: string;
  total_amount: number;
  total_paid: number;
  total_balance: number;
  student_count: number;
}

const reportTypes = [
  { id: 'attendance',   label: 'Attendance Summary',    icon: '✅', color: '#16a34a' },
  { id: 'fees',         label: 'Fee Defaulters',         icon: '💳', color: '#ef4444' },
  { id: 'grades',       label: 'Academic Performance',   icon: '📊', color: '#2563eb' },
  { id: 'enrollment',   label: 'Student Enrollment',     icon: '🎓', color: '#D4AF37' },
  { id: 'emergency',    label: 'Emergency Contacts',     icon: '📞', color: '#7c3aed' },
  { id: 'fee-summary',  label: 'Fee Collection',         icon: '💰', color: '#0891b2' },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('attendance');
  const [classes, setClasses] = useState<Class[]>([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('First Term');
  const [loading, setLoading] = useState(false);

  // Report data
  const [attendanceData, setAttendanceData] = useState<AttendanceSummary[]>([]);
  const [feeData, setFeeData] = useState<FeeDefaulter[]>([]);
  const [gradeData, setGradeData] = useState<GradeSummary[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [emergencyData, setEmergencyData] = useState<EmergencyContact[]>([]);
  const [feeSummaryData, setFeeSummaryData] = useState<FeeCollectionSummary[]>([]);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { generateReport(); }, [activeReport, filterClass, filterTerm]);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('id, name').order('grade');
    setClasses(data || []);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      if (activeReport === 'attendance') await fetchAttendanceReport();
      if (activeReport === 'fees') await fetchFeeReport();
      if (activeReport === 'grades') await fetchGradeReport();
      if (activeReport === 'enrollment') await fetchEnrollmentReport();
      if (activeReport === 'emergency') await fetchEmergencyContacts();
      if (activeReport === 'fee-summary') await fetchFeeCollectionSummary();
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async () => {
    let query = supabase
      .from('attendance')
      .select('student_id, status, students(first_name, last_name, student_id, class_id, classes(name))');

    const { data } = await query;
    if (!data) return;

    // Group by student
    const grouped: Record<string, AttendanceSummary> = {};
    data.forEach((record: any) => {
      const sid = record.student_id;
      const student = record.students;
      if (!student) return;
      if (filterClass && student.class_id !== filterClass) return;

      if (!grouped[sid]) {
        grouped[sid] = {
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          class_name: student.classes?.name || '—',
          total_days: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0,
        };
      }
      grouped[sid].total_days++;
      if (record.status === 'present') grouped[sid].present++;
      if (record.status === 'absent') grouped[sid].absent++;
      if (record.status === 'late') grouped[sid].late++;
      if (record.status === 'excused') grouped[sid].excused++;
    });

    Object.values(grouped).forEach((s) => {
      s.percentage = s.total_days > 0 ? Math.round((s.present / s.total_days) * 100) : 0;
    });

    setAttendanceData(Object.values(grouped).sort((a, b) => a.class_name.localeCompare(b.class_name)));
  };

  const fetchFeeReport = async () => {
    let query = supabase
      .from('fees')
      .select('student_id, amount, paid, students(first_name, last_name, student_id, class_id, classes(name))')
      .eq('term', filterTerm);

    const { data } = await query;
    if (!data) return;

    const grouped: Record<string, FeeDefaulter> = {};
    data.forEach((record: any) => {
      const sid = record.student_id;
      const student = record.students;
      if (!student) return;
      if (filterClass && student.class_id !== filterClass) return;

      if (!grouped[sid]) {
        grouped[sid] = {
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          class_name: student.classes?.name || '—',
          total_fees: 0, total_paid: 0, balance: 0,
        };
      }
      grouped[sid].total_fees += Number(record.amount);
      grouped[sid].total_paid += Number(record.paid);
    });

    Object.values(grouped).forEach((s) => { s.balance = s.total_fees - s.total_paid; });

    setFeeData(
      Object.values(grouped)
        .filter((s) => s.balance > 0)
        .sort((a, b) => b.balance - a.balance)
    );
  };

  const fetchGradeReport = async () => {
    let query = supabase
      .from('grades')
      .select('student_id, subject, score, max_score, term, students(first_name, last_name, student_id, class_id, classes(name))')
      .eq('term', filterTerm);

    const { data } = await query;
    if (!data) return;

    const results = data
      .filter((r: any) => {
        if (!r.students) return false;
        if (filterClass && r.students.class_id !== filterClass) return false;
        return true;
      })
      .map((r: any) => {
        const pct = Math.round((r.score / r.max_score) * 100);
        let grade = 'F';
        if (pct >= 90) grade = 'A+';
        else if (pct >= 80) grade = 'A';
        else if (pct >= 70) grade = 'B';
        else if (pct >= 60) grade = 'C';
        else if (pct >= 50) grade = 'D';

        return {
          student_id: r.students.student_id,
          first_name: r.students.first_name,
          last_name: r.students.last_name,
          class_name: r.students.classes?.name || '—',
          subject: r.subject,
          score: r.score,
          max_score: r.max_score,
          percentage: pct,
          grade,
          term: r.term,
        };
      });

    setGradeData(results);
  };

  const fetchEmergencyContacts = async () => {
    const { data } = await supabase
      .from('student_parents')
      .select(`
        can_pickup,
        students(id, first_name, last_name, student_id, class_id, classes(name)),
        parents(first_name, last_name, phone, phone2, relationship)
      `);

    if (!data) return;

    const contacts: EmergencyContact[] = data
      .filter((sp: any) => sp.students && sp.parents)
      .filter((sp: any) => !filterClass || sp.students.class_id === filterClass)
      .map((sp: any) => ({
        student_id: sp.students.student_id,
        first_name: sp.students.first_name,
        last_name: sp.students.last_name,
        class_name: sp.students.classes?.name || '—',
        parent_name: `${sp.parents.first_name} ${sp.parents.last_name}`,
        relationship: sp.parents.relationship || '—',
        phone: sp.parents.phone || '—',
        phone2: sp.parents.phone2 || '—',
        can_pickup: sp.can_pickup,
      }))
      .sort((a: EmergencyContact, b: EmergencyContact) =>
        a.class_name.localeCompare(b.class_name) || a.last_name.localeCompare(b.last_name)
      );

    setEmergencyData(contacts);
  };

  const fetchFeeCollectionSummary = async () => {
    const { data: fees } = await supabase
      .from('fees')
      .select('amount, paid, term, students(class_id, classes(name))')
      .eq('term', filterTerm);

    if (!fees) return;

    const grouped: Record<string, FeeCollectionSummary> = {};
    fees.forEach((fee: any) => {
      const className = fee.students?.classes?.name || 'Unknown';
      if (filterClass && fee.students?.class_id !== filterClass) return;
      if (!grouped[className]) {
        grouped[className] = { class_name: className, total_amount: 0, total_paid: 0, total_balance: 0, student_count: 0 };
      }
      grouped[className].total_amount += Number(fee.amount);
      grouped[className].total_paid += Number(fee.paid);
    });

    Object.values(grouped).forEach((g) => { g.total_balance = g.total_amount - g.total_paid; });
    setFeeSummaryData(Object.values(grouped).sort((a, b) => a.class_name.localeCompare(b.class_name)));
  };

  const fetchEnrollmentReport = async () => {
    let query = supabase
      .from('students')
      .select('id, first_name, last_name, student_id, gender, status, enrollment_date, classes(name, grade)')
      .eq('status', 'active');

    if (filterClass) query = query.eq('class_id', filterClass);
    const { data } = await query;
    setEnrollmentData(data || []);
  };

  const gradeColor: Record<string, string> = {
    'A+': '#16a34a', 'A': '#16a34a', 'B': '#2563eb',
    'C': '#d97706', 'D': '#ea580c', 'F': '#ef4444',
  };

  const activeConfig = reportTypes.find((r) => r.id === activeReport)!;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Reports</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            Generate and view school reports
          </p>
        </div>
        <div className="relative z-10 hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
          <span className="text-2xl">📋</span>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {reportTypes.map((report) => (
          <button key={report.id} onClick={() => setActiveReport(report.id)}
            className="rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1"
            style={{
              background: activeReport === report.id
                ? 'linear-gradient(135deg, #2c2c2c, #3a3a3a)'
                : '#fff',
              boxShadow: activeReport === report.id
                ? '0 8px 24px rgba(0,0,0,0.3)'
                : '0 2px 12px rgba(0,0,0,0.06)',
              border: activeReport === report.id
                ? '1px solid #D4AF37'
                : '1px solid rgba(0,0,0,0.06)',
            }}>
            <p className="text-2xl mb-2">{report.icon}</p>
            <p className="text-xs font-bold"
              style={{ color: activeReport === report.id ? '#D4AF37' : '#374151' }}>
              {report.label}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Filter by Class</label>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
              className={`w-full ${inputClass}`} style={inputStyle}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {(activeReport === 'fees' || activeReport === 'grades') && (
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Term</label>
              <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}
                className={`w-full ${inputClass}`} style={inputStyle}>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
          )}
          <button onClick={generateReport}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>

        {/* Report Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeConfig.icon}</span>
            <div>
              <h2 className="font-black text-white">{activeConfig.label}</h2>
              <p className="text-xs text-gray-400">
                GFA · {filterClass ? classes.find(c => c.id === filterClass)?.name : 'All Classes'}
                {(activeReport === 'fees' || activeReport === 'grades') ? ` · ${filterTerm}` : ''}
              </p>
            </div>
          </div>
          <div className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>
            {activeReport === 'attendance'  && `${attendanceData.length} students`}
            {activeReport === 'fees'        && `${feeData.length} defaulters`}
            {activeReport === 'grades'      && `${gradeData.length} records`}
            {activeReport === 'enrollment'  && `${enrollmentData.length} students`}
            {activeReport === 'emergency'   && `${emergencyData.length} contacts`}
            {activeReport === 'fee-summary' && `${feeSummaryData.length} classes`}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
          </div>
        ) : (
          <div className="overflow-x-auto">

            {/* Attendance Report */}
            {activeReport === 'attendance' && (
              attendanceData.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">✅</p>
                  <p className="font-bold text-gray-600">No attendance records found</p>
                  <p className="text-sm text-gray-400 mt-1">Mark attendance first to generate this report</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Student', 'Class', 'Total Days', 'Present', 'Absent', 'Late', 'Excused', 'Rate'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendanceData.map((s, idx) => (
                      <tr key={s.student_id} className="transition-colors"
                        style={{ background: s.percentage < 75 ? 'rgba(239,68,68,0.07)' : idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}>
                              {s.first_name[0]}{s.last_name[0]}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{s.first_name} {s.last_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>{s.class_name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800">{s.total_days}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{s.present}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-500">{s.absent}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-yellow-600">{s.late}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-500">{s.excused}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full"
                                style={{ width: `${s.percentage}%`, background: s.percentage >= 75 ? '#16a34a' : s.percentage >= 50 ? '#d97706' : '#ef4444' }} />
                            </div>
                            <span className="text-xs font-bold"
                              style={{ color: s.percentage >= 75 ? '#16a34a' : s.percentage >= 50 ? '#d97706' : '#ef4444' }}>
                              {s.percentage}%
                            </span>
                            {s.percentage < 75 && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                LOW
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Fee Defaulters Report */}
            {activeReport === 'fees' && (
              feeData.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="font-bold text-gray-600">No fee defaulters!</p>
                  <p className="text-sm text-gray-400 mt-1">All students are up to date with payments</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Student', 'Class', 'Total Fees', 'Paid', 'Balance'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {feeData.map((s, idx) => (
                      <tr key={s.student_id} className="hover:bg-red-50/30 transition-colors"
                        style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}>
                              {s.first_name[0]}{s.last_name[0]}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{s.first_name} {s.last_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>{s.class_name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800">{formatCurrency(s.total_fees)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(s.total_paid)}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-black px-3 py-1 rounded-xl bg-red-50 text-red-600">
                            {formatCurrency(s.balance)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-white">Total Outstanding</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-300">
                        {formatCurrency(feeData.reduce((s, f) => s + f.total_fees, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-400">
                        {formatCurrency(feeData.reduce((s, f) => s + f.total_paid, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm font-black" style={{ color: '#D4AF37' }}>
                        {formatCurrency(feeData.reduce((s, f) => s + f.balance, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}

            {/* Grades Report */}
            {activeReport === 'grades' && (
              gradeData.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📊</p>
                  <p className="font-bold text-gray-600">No grade records found</p>
                  <p className="text-sm text-gray-400 mt-1">Add grade records first to generate this report</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Student', 'Class', 'Subject', 'Score', 'Grade', 'Term'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {gradeData.map((g, idx) => (
                      <tr key={`${g.student_id}-${g.subject}`} className="hover:bg-amber-50/30 transition-colors"
                        style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}>
                              {g.first_name[0]}{g.last_name[0]}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{g.first_name} {g.last_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>{g.class_name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{g.subject}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{g.score}/{g.max_score}</p>
                            <div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1">
                              <div className="h-1.5 rounded-full"
                                style={{ width: `${g.percentage}%`, background: gradeColor[g.grade] || '#ef4444' }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-black px-3 py-1 rounded-xl"
                            style={{ background: `${gradeColor[g.grade]}15`, color: gradeColor[g.grade] }}>
                            {g.grade} ({g.percentage}%)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{g.term}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Enrollment Report */}
            {activeReport === 'enrollment' && (
              enrollmentData.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🎓</p>
                  <p className="font-bold text-gray-600">No students found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Student ID', 'Name', 'Class', 'Gender', 'Enrolled', 'Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {enrollmentData.map((s: any, idx: number) => (
                      <tr key={s.id} className="hover:bg-amber-50/30 transition-colors"
                        style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-500">{s.student_id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}>
                              {s.first_name[0]}{s.last_name[0]}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{s.first_name} {s.last_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                            {s.classes?.name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{s.gender}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.enrollment_date)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-600 capitalize">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-white">Total Students</td>
                      <td colSpan={4} className="px-4 py-3 text-sm font-black" style={{ color: '#D4AF37' }}>
                        {enrollmentData.length} active students
                        · {enrollmentData.filter((s: any) => s.gender === 'male').length} boys
                        · {enrollmentData.filter((s: any) => s.gender === 'female').length} girls
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}

            {/* Emergency Contacts Report */}
            {activeReport === 'emergency' && (
              emergencyData.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📞</p>
                  <p className="font-bold text-gray-600">No emergency contacts found</p>
                  <p className="text-sm text-gray-400 mt-1">Link parents to students in the Parents module first</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Student', 'Class', 'Parent / Guardian', 'Relationship', 'Primary Phone', 'Secondary Phone', 'Pickup Auth'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {emergencyData.map((c, idx) => (
                      <tr key={`${c.student_id}-${c.parent_name}`}
                        className="hover:bg-purple-50/30 transition-colors"
                        style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{c.first_name} {c.last_name}</p>
                            <p className="text-xs font-mono text-gray-400">{c.student_id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>{c.class_name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">{c.parent_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 capitalize">{c.relationship}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">{c.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{c.phone2}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${c.can_pickup ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {c.can_pickup ? '✓ Yes' : '✗ No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Fee Collection Summary Report */}
            {activeReport === 'fee-summary' && (
              feeSummaryData.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">💰</p>
                  <p className="font-bold text-gray-600">No fee records found</p>
                  <p className="text-sm text-gray-400 mt-1">Add fee records to generate this summary</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Class', 'Total Fees', 'Total Collected', 'Outstanding', 'Collection Rate'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {feeSummaryData.map((row, idx) => {
                      const rate = row.total_amount > 0
                        ? Math.round((row.total_paid / row.total_amount) * 100)
                        : 0;
                      return (
                        <tr key={row.class_name} className="hover:bg-cyan-50/30 transition-colors"
                          style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>{row.class_name}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-800">{formatCurrency(row.total_amount)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(row.total_paid)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-red-500">{formatCurrency(row.total_balance)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-2">
                                <div className="h-2 rounded-full"
                                  style={{ width: `${rate}%`, background: rate >= 80 ? '#16a34a' : rate >= 50 ? '#d97706' : '#ef4444' }} />
                              </div>
                              <span className="text-xs font-bold"
                                style={{ color: rate >= 80 ? '#16a34a' : rate >= 50 ? '#d97706' : '#ef4444' }}>
                                {rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                      <td className="px-4 py-3 text-sm font-bold text-white">All Classes</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-300">
                        {formatCurrency(feeSummaryData.reduce((s, r) => s + r.total_amount, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-400">
                        {formatCurrency(feeSummaryData.reduce((s, r) => s + r.total_paid, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm font-black" style={{ color: '#D4AF37' }}>
                        {formatCurrency(feeSummaryData.reduce((s, r) => s + r.total_balance, 0))}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}

          </div>
        )}
      </div>
    </div>
  );
}
