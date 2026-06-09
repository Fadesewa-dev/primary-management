import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate, getStatusColor } from '../../utils';

interface Teacher {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  subjects: string[];
  qualification?: string;
  hire_date: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  is_active: boolean;
}

const emptyForm = {
  staff_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  subjects: [] as string[],
  qualification: '',
  hire_date: new Date().toISOString().split('T')[0],
  status: 'active' as 'active' | 'inactive',
};

const inputClass = "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none bg-gray-50 transition-all";
const inputStyle = { fontSize: '16px' };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchTeachers(); fetchSubjects(); }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
    setTeachers(data || []);
    setLoading(false);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setSubjects(data || []);
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setForm({
      staff_id: teacher.staff_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      phone: teacher.phone || '',
      subjects: teacher.subjects || [],
      qualification: teacher.qualification || '',
      hire_date: teacher.hire_date,
      status: teacher.status,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    setForm(emptyForm);
    setError('');
  };

  const toggleSubject = (subject: string) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleSave = async () => {
    if (!form.staff_id || !form.first_name || !form.last_name || !form.email) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        staff_id: form.staff_id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        subjects: form.subjects,
        qualification: form.qualification || null,
        hire_date: form.hire_date,
        status: form.status,
      };
      if (editingTeacher) {
        const { error } = await supabase.from('teachers').update(payload).eq('id', editingTeacher.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teachers').insert(payload);
        if (error) throw error;
      }
      await fetchTeachers();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    await supabase.from('teachers').delete().eq('id', id);
    await fetchTeachers();
  };

  const filtered = teachers.filter((t) => {
    const matchSearch = search === '' ||
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      t.staff_id.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Teachers</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            {teachers.filter((t) => t.status === 'active').length} active staff members
          </p>
        </div>
        <button onClick={openAddModal}
          className="relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
          + Add Teacher
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Staff',  value: teachers.length,                                    color: '#2c2c2c' },
          { label: 'Active',       value: teachers.filter(t => t.status === 'active').length,  color: '#16a34a' },
          { label: 'Inactive',     value: teachers.filter(t => t.status === 'inactive').length,color: '#d97706' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 text-center"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
            <input type="text" placeholder="Search by name, staff ID or email..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className={inputClass} style={{ ...inputStyle, paddingLeft: '2.2rem' }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border-2 border-gray-100 rounded-xl px-4 py-2.5 focus:outline-none bg-gray-50"
            style={inputStyle}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
            <p className="text-5xl mb-3">👩‍🏫</p>
            <p className="font-bold text-gray-600">No teachers found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first teacher to get started</p>
            <button onClick={openAddModal} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
              + Add Teacher
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                  {['Staff ID', 'Name', 'Email', 'Subjects', 'Qualification', 'Hired', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((teacher, idx) => (
                  <tr key={teacher.id} className="transition-colors hover:bg-amber-50/30"
                    style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td className="px-4 py-3.5 text-sm font-mono font-medium text-gray-500">{teacher.staff_id}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                          {teacher.first_name[0]}{teacher.last_name[0]}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {teacher.first_name} {teacher.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{teacher.email}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects?.slice(0, 2).map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>{s}</span>
                        ))}
                        {teacher.subjects?.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            +{teacher.subjects.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{teacher.qualification || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(teacher.hire_date)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getStatusColor(teacher.status)}`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(teacher)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:-translate-y-0.5"
                          style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>Edit</button>
                        <button onClick={() => handleDelete(teacher.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-500 hover:-translate-y-0.5 transition-all">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

            <div className="p-6 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                  📋
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {editingTeacher ? 'Update teacher information' : 'Fill in the teacher details below'}
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
                    Staff ID <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.staff_id}
                    onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                    placeholder="e.g. GFA-T001"
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
                  <select value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                    className={inputClass} style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="First name"
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Last name"
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="teacher@school.gm"
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Phone</label>
                  <input type="text" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+220 7XX XXXX"
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Qualification</label>
                  <input type="text" value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    placeholder="e.g. B.Ed, Diploma"
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Hire Date</label>
                  <input type="date" value={form.hire_date}
                    onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                    className={inputClass} style={inputStyle} />
                </div>
              </div>

              {/* Dynamic Subjects from Supabase */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Subjects Taught
                  </label>
                  <span className="text-xs text-gray-400">
                    {form.subjects.length} selected · {subjects.length} available
                  </span>
                </div>

                {subjects.length === 0 ? (
                  <div className="p-4 rounded-xl text-center text-sm text-gray-400 bg-gray-50 border-2 border-gray-100">
                    No subjects found. Add subjects in Settings.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-50 border-2 border-gray-100 max-h-40 overflow-y-auto">
                    {subjects.map((subject) => (
                      <button key={subject.id} type="button"
                        onClick={() => toggleSubject(subject.name)}
                        className="text-xs px-3 py-1.5 rounded-full border-2 transition-all font-medium"
                        style={form.subjects.includes(subject.name)
                          ? { background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', borderColor: '#2c2c2c' }
                          : { background: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }
                        }>
                        {subject.name}
                      </button>
                    ))}
                  </div>
                )}

                {form.subjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.subjects.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(212,175,55,0.15)', color: '#B8860B' }}>
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                )}
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
                {saving ? 'Saving...' : editingTeacher ? 'Update Teacher' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
