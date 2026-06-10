import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ACADEMIC_TERMS } from '../../lib/constants';
import { useAcademicYear } from '../../hooks/useAcademicYear';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  classes?: { name: string; grade?: string };
}

interface GradeRecord {
  subject: string;
  ca1_score: number;
  ca2_score: number;
  exam_score: number;
  score: number;
}

interface ReportCardProps {
  student: Student;
  onClose: () => void;
}

const getPSMSGrade = (total: number) => {
  if (total >= 70) return { grade: 'A', remark: 'Excellent', color: '#16a34a' };
  if (total >= 60) return { grade: 'B', remark: 'Very Good', color: '#2563eb' };
  if (total >= 50) return { grade: 'C', remark: 'Good', color: '#d97706' };
  if (total >= 40) return { grade: 'D', remark: 'Pass', color: '#ea580c' };
  return { grade: 'F', remark: 'Fail', color: '#ef4444' };
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function ReportCard({ student, onClose }: ReportCardProps) {
  const [term, setTerm] = useState<string>(ACADEMIC_TERMS[0]);
  const [academicYear, setAcademicYear] = useState('');
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [attendance, setAttendance] = useState({ total: 0, present: 0 });
  const [position, setPosition] = useState('—');
  const [loading, setLoading] = useState(false);

  const { currentYear, allYears } = useAcademicYear();

  useEffect(() => {
    if (currentYear && !academicYear) setAcademicYear(currentYear);
  }, [currentYear]);

  useEffect(() => { if (academicYear) fetchReportData(); }, [term, academicYear]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: gradeData } = await supabase
        .from('grades')
        .select('subject, ca1_score, ca2_score, exam_score, score')
        .eq('student_id', student.id)
        .eq('term', term)
        .eq('academic_year', academicYear);

      setGrades(gradeData || []);

      const { data: attData } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', student.id);

      if (attData) {
        setAttendance({
          total: attData.length,
          present: attData.filter((a: any) => a.status === 'present').length,
        });
      }

      // Class position calculation
      const { data: studentRow } = await supabase
        .from('students')
        .select('class_id')
        .eq('id', student.id)
        .single();

      if (studentRow?.class_id && gradeData && gradeData.length > 0) {
        const { data: classmates } = await supabase
          .from('students')
          .select('id')
          .eq('class_id', studentRow.class_id);

        if (classmates) {
          const ids = classmates.map((s: any) => s.id);
          const { data: classGrades } = await supabase
            .from('grades')
            .select('student_id, score')
            .in('student_id', ids)
            .eq('term', term)
            .eq('academic_year', academicYear);

          if (classGrades) {
            const totals: Record<string, number> = {};
            classGrades.forEach((g: any) => {
              totals[g.student_id] = (totals[g.student_id] || 0) + (g.score || 0);
            });
            const myTotal = totals[student.id] || 0;
            const ranked = Object.values(totals).sort((a, b) => b - a);
            const pos = ranked.indexOf(myTotal) + 1;
            setPosition(`${ordinal(pos)} of ${ranked.length}`);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const avgScore = grades.length > 0
    ? Math.round(grades.reduce((s, g) => s + (g.score || 0), 0) / grades.length)
    : 0;
  const avgCA1 = grades.length > 0 ? Math.round(grades.reduce((s, g) => s + (g.ca1_score || 0), 0) / grades.length) : 0;
  const avgCA2 = grades.length > 0 ? Math.round(grades.reduce((s, g) => s + (g.ca2_score || 0), 0) / grades.length) : 0;
  const avgExam = grades.length > 0 ? Math.round(grades.reduce((s, g) => s + (g.exam_score || 0), 0) / grades.length) : 0;
  const overallGrade = getPSMSGrade(avgScore);
  const attPct = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[95vh] overflow-y-auto"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

        {/* Controls — hidden when printing */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div>
              <h2 className="font-black text-white text-sm">Student Report Card</h2>
              <p className="text-gray-400 text-xs">{student.first_name} {student.last_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={term} onChange={(e) => setTerm(e.target.value)}
              className="text-xs border border-gray-600 bg-gray-700 text-white rounded-lg px-2 py-1.5">
              {ACADEMIC_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
              className="text-xs border border-gray-600 bg-gray-700 text-white rounded-lg px-2 py-1.5">
              {allYears.length > 0
                ? allYears.map((y) => (
                    <option key={y.id} value={y.year_name}>{y.year_name}</option>
                  ))
                : academicYear
                  ? <option value={academicYear}>{academicYear}</option>
                  : null
              }
            </select>
            <button onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
              🖨️ Print
            </button>
            <button onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs bg-gray-700 text-gray-300 hover:bg-gray-600">
              Close
            </button>
          </div>
        </div>

        {/* Printable Report */}
        <div className="p-8">

          {/* School Header */}
          <div className="text-center mb-6 pb-4" style={{ borderBottom: '3px double #2c2c2c' }}>
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid #2c2c2c' }}>
                <img src="/images/gfa-logo.jpeg" alt="GFA" className="w-full h-full object-cover" />
              </div>
            </div>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-wide">Glowing Future Academy</h1>
            <p className="text-sm text-gray-500 italic">Glow With Pride</p>
            <h2 className="text-base font-black mt-3 uppercase tracking-widest" style={{ color: '#B8860B' }}>
              Student Report Card
            </h2>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              {term} &middot; Academic Year {academicYear}
            </p>
          </div>

          {/* Student Details */}
          <div className="grid grid-cols-2 gap-3 mb-5 p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Full Name</p>
              <p className="font-bold text-gray-800">{student.first_name} {student.last_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Student ID</p>
              <p className="font-bold text-gray-800 font-mono">{student.student_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Class</p>
              <p className="font-bold text-gray-800">{student.classes?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Gender</p>
              <p className="font-bold text-gray-800 capitalize">{student.gender}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
              Loading report data...
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">📊</p>
              <p className="font-semibold">No grade records found for {term} {academicYear}</p>
              <p className="text-sm mt-1">Add grades to generate the report card</p>
            </div>
          ) : (
            <>
              {/* Grades Table */}
              <table className="w-full mb-5" style={{ borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                <thead>
                  <tr style={{ background: '#2c2c2c' }}>
                    {['Subject', 'CA1 /20', 'CA2 /20', 'Exam /60', 'Total /100', 'Grade', 'Remark'].map((h) => (
                      <th key={h} style={{
                        padding: '8px 10px', textAlign: 'left', color: '#D4AF37',
                        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g, idx) => {
                    const total = g.score || (g.ca1_score + g.ca2_score + g.exam_score);
                    const { grade, remark, color } = getPSMSGrade(total);
                    return (
                      <tr key={g.subject}
                        style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '7px 10px', fontSize: '13px', fontWeight: 600, color: '#374151', borderRight: '1px solid #e5e7eb' }}>{g.subject}</td>
                        <td style={{ padding: '7px 10px', fontSize: '13px', color: '#374151', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>{g.ca1_score ?? '—'}</td>
                        <td style={{ padding: '7px 10px', fontSize: '13px', color: '#374151', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>{g.ca2_score ?? '—'}</td>
                        <td style={{ padding: '7px 10px', fontSize: '13px', color: '#374151', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>{g.exam_score ?? '—'}</td>
                        <td style={{ padding: '7px 10px', fontSize: '13px', fontWeight: 700, color: '#1f2937', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>{total}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color }}>{grade}</span>
                        </td>
                        <td style={{ padding: '7px 10px', fontSize: '12px', color }}>{remark}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f3f4f6', borderTop: '2px solid #2c2c2c' }}>
                    <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 700, color: '#374151' }}>AVERAGE</td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>{avgCA1}</td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>{avgCA2}</td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>{avgExam}</td>
                    <td style={{ padding: '8px 10px', fontSize: '14px', fontWeight: 800, color: overallGrade.color, textAlign: 'center' }}>{avgScore}</td>
                    <td style={{ padding: '8px 10px', fontSize: '14px', fontWeight: 800, color: overallGrade.color, textAlign: 'center' }}>{overallGrade.grade}</td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', color: overallGrade.color }}>{overallGrade.remark}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Class Position', value: position, color: '#2c2c2c' },
                  { label: 'Average Score', value: `${avgScore}%`, color: overallGrade.color },
                  { label: 'Attendance', value: `${attPct}%`, sub: `${attendance.present}/${attendance.total} days`, color: attPct >= 75 ? '#16a34a' : '#ef4444' },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="p-3 rounded-xl text-center"
                    style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-1">{label}</p>
                    <p className="text-lg font-black" style={{ color }}>{value}</p>
                    {sub && <p className="text-xs text-gray-400">{sub}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Grading Scale */}
          <div className="mb-5 p-3 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Grading Scale</p>
            <div className="flex flex-wrap gap-4">
              {[
                { range: '70–100', grade: 'A', remark: 'Excellent', color: '#16a34a' },
                { range: '60–69', grade: 'B', remark: 'Very Good', color: '#2563eb' },
                { range: '50–59', grade: 'C', remark: 'Good', color: '#d97706' },
                { range: '40–49', grade: 'D', remark: 'Pass', color: '#ea580c' },
                { range: '0–39', grade: 'F', remark: 'Fail', color: '#ef4444' },
              ].map((s) => (
                <span key={s.grade} className="text-xs" style={{ color: s.color }}>
                  <strong>{s.grade}</strong> ({s.range}) — {s.remark}
                </span>
              ))}
            </div>
          </div>

          {/* Signature Area */}
          <div className="grid grid-cols-2 gap-8 mt-6">
            <div>
              <div style={{ borderBottom: '1px solid #374151', height: '36px' }}></div>
              <p className="text-xs text-gray-400 mt-1">Class Teacher's Signature &amp; Date</p>
            </div>
            <div>
              <div style={{ borderBottom: '1px solid #374151', height: '36px' }}></div>
              <p className="text-xs text-gray-400 mt-1">Principal's Signature &amp; Date</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-400 font-semibold mb-1">Teacher's Remark:</p>
            <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', height: '48px' }}></div>
          </div>

          <p className="text-center text-xs text-gray-300 mt-6">
            GFA Primary School Management System &middot; Generated {new Date().toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>
    </div>
  );
}
