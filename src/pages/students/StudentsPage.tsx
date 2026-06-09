import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate, getStatusColor } from '../../utils';
import ReportCard from '../../components/students/ReportCard';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  class_id?: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  blood_group?: string;
  allergies?: string;
  medical_notes?: string;
  created_at: string;
  classes?: { name: string; grade: string; section: string };
}

interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
}

const emptyForm = {
  student_id: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: 'male' as 'male' | 'female',
  class_id: '',
  parent_name: '',
  parent_phone: '',
  address: '',
  enrollment_date: new Date().toISOString().split('T')[0],
  status: 'active' as 'active' | 'inactive' | 'graduated' | 'transferred',
  blood_group: '',
  allergies: '',
  medical_notes: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reportCardStudent, setReportCardStudent] = useState<Student | null>(null);

  useEffect(() => { fetchStudents(); fetchClasses(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('*, classes(name, grade, section)')
      .order('created_at', { ascending: false });
    setStudents(data || []);
    setLoading(false);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('grade');
    setClasses(data || []);
  };

  const openAddModal = async () => {
    setEditingStudent(null);
    setError('');

    const year = new Date().getFullYear();
    const prefix = `GFA-${year}-`;
    const { data } = await supabase
      .from('students')
      .select('student_id')
      .ilike('student_id', `${prefix}%`)
      .order('student_id', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0].student_id) {
      const parts = data[0].student_id.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    const newId = `${prefix}${String(nextNum).padStart(4, '0')}`;
    setForm({ ...emptyForm, student_id: newId });
    setShowModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setForm({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      class_id: student.class_id || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      address: student.address || '',
      enrollment_date: student.enrollment_date,
      status: student.status,
      blood_group: student.blood_group || '',
      allergies: student.allergies || '',
      medical_notes: student.medical_notes || '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    if (!form.student_id || !form.first_name || !form.last_name || !form.date_of_birth) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        student_id: form.student_id,
        first_name: form.first_name,
        last_name: form.last_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        class_id: form.class_id || null,
        parent_name: form.parent_name || null,
        parent_phone: form.parent_phone || null,
        address: form.address || null,
        enrollment_date: form.enrollment_date,
        status: form.status,
        blood_group: form.blood_group || null,
        allergies: form.allergies || null,
        medical_notes: form.medical_notes || null,
      };
      if (editingStudent) {
        const { error } = await supabase.from('students').update(payload).eq('id', editingStudent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('students').insert(payload);
        if (error) throw error;
      }
      await fetchStudents();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    await supabase.from('students').delete().eq('id', id);
    await fetchStudents();
  };

  const filtered = students.filter((s) => {
    const matchSearch = search === '' ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = students.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div
        className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
      >
        <div
          className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }}
        />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Students</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            {activeCount} active students enrolled
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #D4AF37, #F5C842)',
            color: '#2c2c2c',
            boxShadow: '0 4px 16px rgba(212,175,55,0.4)',
          }}
        >
          + Add Student
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: students.length, color: '#2c2c2c' },
          { label: 'Active', value: students.filter(s => s.status === 'active').length, color: '#16a34a' },
          { label: 'Graduated', value: students.filter(s => s.status === 'graduated').length, color: '#2563eb' },
          { label: 'Transferred', value: students.filter(s => s.status === 'transferred').length, color: '#d97706' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 text-center"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 flex flex-col md:flex-row gap-3"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by name or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-all bg-gray-50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-gray-50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🎓</p>
            <p className="font-bold text-gray-600">No students found</p>
            <button onClick={openAddModal}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
              + Add Student
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                  {['Student ID', 'Name', 'Gender', 'Class', 'Parent', 'Enrolled', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="transition-colors hover:bg-amber-50/30"
                    style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                  >
                    <td className="px-4 py-3.5 text-sm font-mono font-medium text-gray-500">
                      {student.student_id}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}
                        >
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {student.first_name} {student.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 capitalize">{student.gender}</td>
                    <td className="px-4 py-3.5">
                      {student.classes ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                          {student.classes.name}
                        </span>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{student.parent_name || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(student.enrollment_date)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getStatusColor(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => openEditModal(student)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:-translate-y-0.5"
                          style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                          Edit
                        </button>
                        <button onClick={() => setReportCardStudent(student)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:-translate-y-0.5"
                          style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                          Report Card
                        </button>
                        <button onClick={() => handleDelete(student.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:-translate-y-0.5 bg-red-50 text-red-500">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FIXED MODAL - Mobile Friendly */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
          >
            <div
              className="p-6 rounded-t-3xl"
              style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}
                >
                  🎓
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {editingStudent ? 'Update student information' : 'Fill in the student details below'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Student ID <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    placeholder="e.g. GFA-001"
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Gender <span className="text-red-400">*</span></label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">First Name <span className="text-red-400">*</span></label>
                  <input type="text" value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="First name"
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Last Name <span className="text-red-400">*</span></label>
                  <input type="text" value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Last name"
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Date of Birth <span className="text-red-400">*</span></label>
                  <input type="date" value={form.date_of_birth}
                    onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Class</label>
                  <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50">
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Parent / Guardian</label>
                  <input type="text" value={form.parent_name}
                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                    placeholder="Parent full name"
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Parent Phone</label>
                  <input type="text" value={form.parent_phone}
                    onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                    placeholder="+220 7XX XXXX"
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Enrollment Date</label>
                  <input type="date" value={form.enrollment_date}
                    onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
                  <select value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="graduated">Graduated</option>
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Address</label>
                <textarea value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Home address" rows={3}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50 resize-y"
                />
              </div>

              {/* Medical Information */}
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Medical Information</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Blood Group</label>
                    <select value={form.blood_group}
                      onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                      className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50">
                      <option value="">Unknown / Not specified</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Allergies</label>
                    <textarea value={form.allergies}
                      onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                      placeholder="List any known allergies (e.g. peanuts, penicillin)..."
                      rows={2}
                      className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50 resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Medical Notes</label>
                    <textarea value={form.medical_notes}
                      onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
                      placeholder="Any medical conditions, medications, or special needs..."
                      rows={2}
                      className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50 resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={closeModal}
                className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm rounded-xl transition-all disabled:opacity-60 font-bold hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                {saving ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Card Modal */}
      {reportCardStudent && (
        <ReportCard
          student={reportCardStudent}
          onClose={() => setReportCardStudent(null)}
        />
      )}
    </div>
  );
}