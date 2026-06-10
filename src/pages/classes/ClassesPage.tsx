import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAcademicYear } from '../../hooks/useAcademicYear';

interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  teacher_id?: string;
  academic_year: string;
  capacity: number;
  created_at: string;
  teachers?: { first_name: string; last_name: string };
  student_count?: number;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  staff_id: string;
}

interface GradeLevel { id: string; name: string; level_order: number }
interface ClassSection { id: string; name: string }

const emptyForm = {
  grade: '',
  section: '',
  teacher_id: '',
  academic_year: '',
  capacity: 35,
};

export default function ClassesPage() {
  const { currentYear } = useAcademicYear();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchClasses(); fetchTeachers(); fetchGradeLevels(); fetchSections(); }, []);

  const fetchClasses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('classes')
      .select('*, teachers(first_name, last_name)')
      .order('grade', { ascending: true });

    if (data) {
      const classesWithCounts = await Promise.all(
        data.map(async (cls) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id)
            .eq('status', 'active');
          return { ...cls, student_count: count || 0 };
        })
      );
      setClasses(classesWithCounts);
    }
    setLoading(false);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('teachers')
      .select('id, first_name, last_name, staff_id')
      .eq('status', 'active')
      .order('first_name');
    setTeachers(data || []);
  };

  const fetchGradeLevels = async () => {
    const { data } = await supabase.from('grade_levels').select('id, name, level_order').order('level_order');
    setGradeLevels(data || []);
  };

  const fetchSections = async () => {
    const { data } = await supabase.from('class_sections').select('id, name').order('name');
    setSections(data || []);
  };

  const openAddModal = () => {
    setEditingClass(null);
    setForm({
      ...emptyForm,
      grade: gradeLevels[0]?.name || '',
      section: sections[0]?.name || '',
      academic_year: currentYear,
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (cls: Class) => {
    setEditingClass(cls);
    setForm({
      grade: cls.grade,
      section: cls.section,
      teacher_id: cls.teacher_id || '',
      academic_year: cls.academic_year,
      capacity: cls.capacity,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: `${form.grade}${form.section}`,
        grade: form.grade,
        section: form.section,
        teacher_id: form.teacher_id || null,
        academic_year: form.academic_year,
        capacity: form.capacity,
      };
      if (editingClass) {
        const { error } = await supabase.from('classes').update(payload).eq('id', editingClass.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('classes').insert(payload);
        if (error) throw error;
      }
      await fetchClasses();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    await supabase.from('classes').delete().eq('id', id);
    await fetchClasses();
  };

  const filtered = classes.filter((c) =>
    search === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.grade.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);

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
          <h1 className="text-2xl font-black text-white">Classes</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            {classes.length} classes · {totalStudents} students enrolled
          </p>
        </div>
        <button onClick={openAddModal}
          className="relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
          + Add Class
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Classes', value: classes.length, color: '#2c2c2c' },
          { label: 'Total Students', value: totalStudents, color: '#16a34a' },
          { label: 'Total Capacity', value: totalCapacity, color: '#2563eb' },
          { label: 'Available Seats', value: totalCapacity - totalStudents, color: '#D4AF37' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 text-center"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="rounded-2xl p-4"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
          <input type="text" placeholder="Search classes..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-all bg-gray-50"
          />
        </div>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-5xl mb-3">📚</p>
          <p className="font-bold text-gray-600">No classes found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first class to get started</p>
          <button onClick={openAddModal} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
            + Add Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cls) => {
            const occupancy = cls.capacity > 0 ? Math.round(((cls.student_count || 0) / cls.capacity) * 100) : 0;
            const occupancyColor = occupancy >= 90 ? '#ef4444' : occupancy >= 70 ? '#d97706' : '#16a34a';

            return (
              <div
                key={cls.id}
                className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1"
                style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                    style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}
                  >
                    {cls.section}
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-semibold"
                    style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}
                  >
                    {cls.academic_year}
                  </span>
                </div>

                <h3 className="text-lg font-black text-gray-900">{cls.name}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{cls.grade} — Section {cls.section}</p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Class Teacher:</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {cls.teachers
                      ? `${cls.teachers.first_name} ${cls.teachers.last_name}`
                      : 'Not assigned'}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-gray-400">Students</span>
                    <span className="text-xs font-bold" style={{ color: occupancyColor }}>
                      {cls.student_count}/{cls.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${occupancy}%`, background: `linear-gradient(90deg, ${occupancyColor}, ${occupancyColor}88)` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{cls.capacity - (cls.student_count || 0)} seats available</p>
                </div>

                <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100">
                  <button onClick={() => openEditModal(cls)}
                    className="flex-1 text-xs py-2 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cls.id)}
                    className="flex-1 text-xs py-2 rounded-xl font-semibold transition-all hover:-translate-y-0.5 bg-red-50 text-red-500">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FIXED MODAL - Mobile Friendly */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

            <div className="p-6 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                  📚
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{editingClass ? 'Edit Class' : 'Add New Class'}</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Configure class details below</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Grade</label>
                  <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                    style={{ fontSize: '16px' }}>
                    {gradeLevels.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Section</label>
                  <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                    style={{ fontSize: '16px' }}>
                    {sections.map((s) => <option key={s.id} value={s.name}>Section {s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Class Teacher</label>
                <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50">
                  <option value="">Select teacher (optional)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.staff_id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Academic Year</label>
                  <input type="text" value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    placeholder="2024-2025"
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Capacity</label>
                  <input type="number" value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 35 })}
                    min={1} max={100}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-3.5 text-base focus:outline-none bg-gray-50"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <p className="text-xs text-gray-400 mb-1">Class Name Preview</p>
                <p className="text-2xl font-black" style={{ color: '#2c2c2c' }}>
                  {form.grade}{form.section}
                </p>
                <p className="text-xs text-gray-400 mt-1">{form.academic_year} · Capacity: {form.capacity}</p>
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
                {saving ? 'Saving...' : editingClass ? 'Update Class' : 'Add Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}