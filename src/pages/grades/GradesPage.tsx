import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ACADEMIC_TERMS, CURRENT_ACADEMIC_YEAR, SUBJECTS } from '../../lib/constants';

interface Grade {
  id: string;
  student_id: string;
  class_id: string;
  subject: string;
  ca1_score: number;
  ca2_score: number;
  exam_score: number;
  score: number;
  term: string;
  academic_year: string;
  date: string;
  teacher_remark?: string;
  students?: { first_name: string; last_name: string; student_id: string };
  classes?: { name: string };
}

interface Class { id: string; name: string }
interface Student { id: string; first_name: string; last_name: string; student_id: string; class_id?: string }

const emptyForm = {
  student_id: '',
  class_id: '',
  subject: 'Mathematics',
  ca1_score: 0,
  ca2_score: 0,
  exam_score: 0,
  term: 'First Term',
  academic_year: CURRENT_ACADEMIC_YEAR,
  date: new Date().toISOString().split('T')[0],
  teacher_remark: '',
};

const getPSMSGrade = (total: number) => {
  if (total >= 70) return { grade: 'A', remark: 'Excellent', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' };
  if (total >= 60) return { grade: 'B', remark: 'Very Good', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' };
  if (total >= 50) return { grade: 'C', remark: 'Good', color: '#d97706', bg: 'rgba(217,119,6,0.1)' };
  if (total >= 40) return { grade: 'D', remark: 'Pass', color: '#ea580c', bg: 'rgba(234,88,12,0.1)' };
  return { grade: 'F', remark: 'Fail', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
};

const inputClass = "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none bg-gray-50 transition-all";
const inputStyle = { fontSize: '16px' };

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGrades();
    fetchClasses();
    fetchAllStudents();
  }, []);

  useEffect(() => {
    if (form.class_id) {
      setFilteredStudents(allStudents.filter((s) => s.class_id === form.class_id));
    } else {
      setFilteredStudents(allStudents);
    }
    if (showModal) setForm((prev) => ({ ...prev, student_id: '' }));
  }, [form.class_id, allStudents]);

  const fetchGrades = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('grades')
      .select('*, students(first_name, last_name, student_id), classes(name)')
      .order('date', { ascending: false });
    setGrades(data || []);
    setLoading(false);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('id, name').order('grade');
    setClasses(data || []);
  };

  const fetchAllStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_id, class_id')
      .eq('status', 'active')
      .order('first_name');
    setAllStudents(data || []);
    setFilteredStudents(data || []);
  };

  const openModal = () => {
    setForm(emptyForm);
    setFilteredStudents(allStudents);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    if (!form.student_id || !form.class_id || !form.subject) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.ca1_score > 20 || form.ca2_score > 20 || form.exam_score > 60) {
      setError('CA1 max is 20, CA2 max is 20, Exam max is 60.');
      return;
    }
    if (form.ca1_score < 0 || form.ca2_score < 0 || form.exam_score < 0) {
      setError('Scores cannot be negative.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const total = form.ca1_score + form.ca2_score + form.exam_score;
      const { error } = await supabase.from('grades').insert({
        student_id: form.student_id,
        class_id: form.class_id,
        subject: form.subject,
        ca1_score: form.ca1_score,
        ca2_score: form.ca2_score,
        exam_score: form.exam_score,
        score: total,
        max_score: 100,
        grade_type: 'exam',
        term: form.term,
        academic_year: form.academic_year,
        date: form.date,
        teacher_remark: form.teacher_remark || null,
      });
      if (error) throw error;
      await fetchGrades();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this grade record?')) return;
    await supabase.from('grades').delete().eq('id', id);
    await fetchGrades();
  };

  const filtered = grades.filter((g) => {
    const matchSearch = search === '' ||
      `${g.students?.first_name} ${g.students?.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      g.students?.student_id.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === '' || g.class_id === filterClass;
    const matchTerm = filterTerm === '' || g.term === filterTerm;
    const matchSubject = filterSubject === '' || g.subject === filterSubject;
    return matchSearch && matchClass && matchTerm && matchSubject;
  });

  const scores = filtered.map((g) => g.score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const topScore = scores.length > 0 ? Math.max(...scores) : 0;
  const passCount = filtered.filter((g) => g.score >= 40).length;

  const total = form.ca1_score + form.ca2_score + form.exam_score;
  const preview = getPSMSGrade(total);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Grades</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            CA1 + CA2 + Exam — PSMS grading system
          </p>
        </div>
        <button onClick={openModal}
          className="relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
          + Add Grade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: `${filtered.length}`, color: '#2c2c2c' },
          { label: 'Average Score', value: `${avgScore}/100`,    color: '#2563eb' },
          { label: 'Top Score',     value: `${topScore}/100`,    color: '#D4AF37' },
          { label: 'Passed (≥40)',  value: `${passCount}`,       color: '#16a34a' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 text-center"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Grading Scale Info */}
      <div className="rounded-2xl p-4 flex flex-wrap gap-3 items-center"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="text-xs text-gray-400 font-semibold uppercase">Grading Scale:</span>
        {[
          { label: 'A 70–100', color: '#16a34a' }, { label: 'B 60–69', color: '#2563eb' },
          { label: 'C 50–59', color: '#d97706' }, { label: 'D 40–49', color: '#ea580c' },
          { label: 'F 0–39', color: '#ef4444' },
        ].map(({ label, color }) => (
          <span key={label} className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${color}15`, color }}>{label}</span>
        ))}
        <span className="text-xs text-gray-300 ml-auto">CA1 /20 · CA2 /20 · Exam /60 = Total /100</span>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
            <input type="text" placeholder="Search student..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className={inputClass} style={{ ...inputStyle, paddingLeft: '2.2rem' }} />
          </div>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
            className={inputClass} style={inputStyle}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}
            className={inputClass} style={inputStyle}>
            <option value="">All Terms</option>
            {ACADEMIC_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
            className={inputClass} style={inputStyle}>
            <option value="">All Subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📊</p>
            <p className="font-bold text-gray-600">No grade records found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first grade record to get started</p>
            <button onClick={openModal} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
              + Add Grade
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                  {['Student', 'Class', 'Subject', 'CA1 /20', 'CA2 /20', 'Exam /60', 'Total /100', 'Grade', 'Term', 'Date', 'Remarks', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((grade, idx) => {
                  const { grade: gl, color, bg } = getPSMSGrade(grade.score);
                  return (
                    <tr key={grade.id} className="transition-colors hover:bg-amber-50/30"
                      style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}>
                            {grade.students?.first_name?.[0]}{grade.students?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {grade.students?.first_name} {grade.students?.last_name}
                            </p>
                            <p className="text-xs font-mono text-gray-400">{grade.students?.student_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                          {grade.classes?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-700">{grade.subject}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">{grade.ca1_score ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">{grade.ca2_score ?? '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">{grade.exam_score ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-black text-gray-800">{grade.score}</p>
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1">
                          <div className="h-1.5 rounded-full" style={{ width: `${grade.score}%`, background: color }}></div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-black px-3 py-1 rounded-xl"
                          style={{ background: bg, color }}>
                          {gl}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{grade.term}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-400">
                        {new Date(grade.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 max-w-[160px]">
                        {grade.teacher_remark ? (
                          <span className="truncate block" title={grade.teacher_remark}>{grade.teacher_remark}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => handleDelete(grade.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-500 hover:-translate-y-0.5 transition-all">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

            <div className="p-6 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                  📊
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Add Grade Record</h2>
                  <p className="text-gray-400 text-xs mt-0.5">CA1 + CA2 + Exam breakdown</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Filter by Class (optional)
                </label>
                <select value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  className={inputClass} style={inputStyle}>
                  <option value="">All Classes</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Student <span className="text-red-400">*</span>
                  <span className="text-gray-400 normal-case font-normal ml-1">
                    ({filteredStudents.length} available)
                  </span>
                </label>
                <select value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className={inputClass} style={inputStyle}>
                  <option value="">-- Select Student --</option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.student_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <select value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className={inputClass} style={inputStyle}>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Term</label>
                  <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className={inputClass} style={inputStyle}>
                    {ACADEMIC_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Score Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    CA1 <span className="text-gray-400 font-normal">/20</span>
                  </label>
                  <input type="number" value={form.ca1_score} min={0} max={20}
                    onChange={(e) => setForm({ ...form, ca1_score: Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    CA2 <span className="text-gray-400 font-normal">/20</span>
                  </label>
                  <input type="number" value={form.ca2_score} min={0} max={20}
                    onChange={(e) => setForm({ ...form, ca2_score: Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Exam <span className="text-gray-400 font-normal">/60</span>
                  </label>
                  <input type="number" value={form.exam_score} min={0} max={60}
                    onChange={(e) => setForm({ ...form, exam_score: Math.min(60, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className={inputClass} style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Date</label>
                <input type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputClass} style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Teacher Remarks</label>
                <textarea value={form.teacher_remark}
                  onChange={(e) => setForm({ ...form, teacher_remark: e.target.value })}
                  placeholder="Optional remarks about student performance..."
                  rows={2}
                  className={inputClass + ' resize-y'} style={inputStyle} />
              </div>

              {/* Live Grade Preview */}
              <div className="p-4 rounded-xl text-center"
                style={{ background: preview.bg, border: `1px solid ${preview.color}33` }}>
                <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wide">Grade Preview</p>
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <p className="text-4xl font-black" style={{ color: preview.color }}>{preview.grade}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: preview.color }}>{preview.remark}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">CA1: {form.ca1_score}/20</p>
                    <p className="text-xs text-gray-500">CA2: {form.ca2_score}/20</p>
                    <p className="text-xs text-gray-500">Exam: {form.exam_score}/60</p>
                    <p className="text-sm font-black mt-1" style={{ color: preview.color }}>Total: {total}/100</p>
                  </div>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2 mt-3">
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${total}%`, background: preview.color }} />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={closeModal}
                className="px-5 py-2.5 text-sm text-gray-500 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm rounded-xl transition-all disabled:opacity-60 font-bold hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                {saving ? 'Saving...' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
