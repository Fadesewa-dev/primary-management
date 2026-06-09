import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
//import { formatDate } from '../../utils';

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  phone2?: string;
  relationship?: string;
  occupation?: string;
  address?: string;
  national_id?: string;
  is_authorized_pickup: boolean;
  created_at: string;
  student_parents?: {
    is_primary_contact: boolean;
    can_pickup: boolean;
    students: {
      first_name: string;
      last_name: string;
      student_id: string;
      classes?: { name: string };
    };
  }[];
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  class_id?: string;
  classes?: { name: string };
}

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  phone2: '',
  relationship: 'Father',
  occupation: '',
  address: '',
  national_id: '',
  is_authorized_pickup: true,
};

const inputClass = "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none bg-gray-50 transition-all";
const inputStyle = { fontSize: '16px' };

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Link student to parent
  const [linkParentId, setLinkParentId] = useState('');
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkIsPrimary, setLinkIsPrimary] = useState(true);
  const [linkCanPickup, setLinkCanPickup] = useState(true);
  const [linkSaving, setLinkSaving] = useState(false);

  useEffect(() => { fetchParents(); fetchStudents(); }, []);

  const fetchParents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('parents')
      .select(`
        *,
        student_parents(
          is_primary_contact,
          can_pickup,
          students(first_name, last_name, student_id, classes(name))
        )
      `)
      .order('created_at', { ascending: false });
    setParents(data || []);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_id, class_id, classes(name)')
      .eq('status', 'active')
      .order('first_name');
      setStudents((data as any) || []);
  };

  const openAddModal = () => {
    setEditingParent(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (parent: Parent) => {
    setEditingParent(parent);
    setForm({
      first_name: parent.first_name,
      last_name: parent.last_name,
      email: parent.email || '',
      phone: parent.phone || '',
      phone2: parent.phone2 || '',
      relationship: parent.relationship || 'Father',
      occupation: parent.occupation || '',
      address: parent.address || '',
      national_id: parent.national_id || '',
      is_authorized_pickup: parent.is_authorized_pickup,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingParent(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.phone) {
      setError('First name, last name and phone are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone,
        phone2: form.phone2 || null,
        relationship: form.relationship || null,
        occupation: form.occupation || null,
        address: form.address || null,
        national_id: form.national_id || null,
        is_authorized_pickup: form.is_authorized_pickup,
      };
      if (editingParent) {
        const { error } = await supabase.from('parents').update(payload).eq('id', editingParent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('parents').insert(payload);
        if (error) throw error;
      }
      await fetchParents();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this parent record?')) return;
    await supabase.from('parents').delete().eq('id', id);
    await fetchParents();
  };

  const openLinkModal = (parentId: string) => {
    setLinkParentId(parentId);
    setLinkStudentId('');
    setLinkIsPrimary(true);
    setLinkCanPickup(true);
    setShowLinkModal(true);
  };

  const handleLink = async () => {
    if (!linkStudentId) return;
    setLinkSaving(true);
    try {
      // Check if already linked
      const { data: existing } = await supabase
        .from('student_parents')
        .select('id')
        .eq('student_id', linkStudentId)
        .eq('parent_id', linkParentId);

      if (existing && existing.length > 0) {
        alert('This student is already linked to this parent!');
        setLinkSaving(false);
        return;
      }

      await supabase.from('student_parents').insert({
        student_id: linkStudentId,
        parent_id: linkParentId,
        is_primary_contact: linkIsPrimary,
        can_pickup: linkCanPickup,
      });
      await fetchParents();
      setShowLinkModal(false);
    } finally {
      setLinkSaving(false);
    }
  };

  const unlinkStudent = async (parentId: string, studentId: string) => {
    if (!confirm('Remove this student link?')) return;
    await supabase.from('student_parents')
      .delete()
      .eq('parent_id', parentId)
      .eq('student_id', studentId);
    await fetchParents();
  };

  const filtered = parents.filter((p) =>
    search === '' ||
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Parents & Guardians</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            {parents.length} registered parents/guardians
          </p>
        </div>
        <button onClick={openAddModal}
          className="relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
          + Add Parent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Parents',    value: parents.length,                                                   color: '#2c2c2c' },
          { label: 'Authorized Pickup',value: parents.filter(p => p.is_authorized_pickup).length,               color: '#16a34a' },
          { label: 'Linked to Students', value: parents.filter(p => p.student_parents && p.student_parents.length > 0).length, color: '#2563eb' },
          { label: 'Not Linked',       value: parents.filter(p => !p.student_parents || p.student_parents.length === 0).length, color: '#d97706' },
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
          <input type="text" placeholder="Search by name, phone or email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className={inputClass} style={{ ...inputStyle, paddingLeft: '2.2rem' }}
            onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
            onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
          />
        </div>
      </div>

      {/* Parents Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48 rounded-2xl bg-white">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-5xl mb-3">👨‍👩‍👧</p>
          <p className="font-bold text-gray-600">No parents found</p>
          <p className="text-sm text-gray-400 mt-1">Add parent/guardian records to get started</p>
          <button onClick={openAddModal} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
            + Add Parent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((parent) => (
            <div key={parent.id} className="rounded-2xl p-5 transition-all hover:-translate-y-1"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>

              {/* Parent Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37' }}>
                  {parent.first_name[0]}{parent.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-gray-900">
                      {parent.first_name} {parent.last_name}
                    </h3>
                    {parent.relationship && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                        {parent.relationship}
                      </span>
                    )}
                    {parent.is_authorized_pickup && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-600">
                        ✓ Pickup
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{parent.phone}</p>
                  {parent.email && <p className="text-xs text-gray-400">{parent.email}</p>}
                </div>
              </div>

              {/* Linked Students */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Linked Children ({parent.student_parents?.length || 0})
                  </p>
                  <button onClick={() => openLinkModal(parent.id)}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                    style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                    + Link Student
                  </button>
                </div>

                {!parent.student_parents || parent.student_parents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No students linked yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {parent.student_parents.map((sp: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg"
                        style={{ background: '#f9fafb', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black"
                            style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}>
                            {sp.students?.first_name?.[0]}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">
                              {sp.students?.first_name} {sp.students?.last_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {sp.students?.classes?.name || '—'}
                              {sp.is_primary_contact && ' · Primary Contact'}
                              {sp.can_pickup && ' · Can Pickup'}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => unlinkStudent(parent.id, sp.students?.id || '')}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEditModal(parent)}
                  className="flex-1 text-xs py-2 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                  style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(parent.id)}
                  className="flex-1 text-xs py-2 rounded-xl font-semibold bg-red-50 text-red-500 hover:-translate-y-0.5 transition-all">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Parent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

            <div className="p-6 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                  👨‍👩‍👧
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {editingParent ? 'Edit Parent/Guardian' : 'Add Parent/Guardian'}
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5">Fill in the parent details below</p>
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
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="First name" className={inputClass} style={inputStyle}
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
                    placeholder="Last name" className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Phone <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+220 7XX XXXX" className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Phone 2</label>
                  <input type="text" value={form.phone2}
                    onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                    placeholder="Alternative number" className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="parent@email.com" className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Relationship</label>
                  <select value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                    className={inputClass} style={inputStyle}>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Occupation</label>
                  <input type="text" value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    placeholder="e.g. Teacher, Trader" className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">National ID</label>
                  <input type="text" value={form.national_id}
                    onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                    placeholder="ID number" className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Address</label>
                <textarea value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Home address" rows={2}
                  className={inputClass} style={{ ...inputStyle, resize: 'none' }}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>

              {/* Authorized Pickup Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: form.is_authorized_pickup ? 'rgba(22,163,74,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${form.is_authorized_pickup ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <div>
                  <p className="text-sm font-bold text-gray-800">Authorized for Pickup</p>
                  <p className="text-xs text-gray-500 mt-0.5">Can this person pick up the child from school?</p>
                </div>
                <button onClick={() => setForm({ ...form, is_authorized_pickup: !form.is_authorized_pickup })}
                  className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: form.is_authorized_pickup ? '#16a34a' : '#d1d5db' }}>
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
                    style={{ left: form.is_authorized_pickup ? '26px' : '2px' }} />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={closeModal}
                className="px-5 py-2.5 text-sm text-gray-500 border-2 border-gray-100 rounded-xl hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm rounded-xl transition-all disabled:opacity-60 font-bold hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                {saving ? 'Saving...' : editingParent ? 'Update Parent' : 'Add Parent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Student Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

            <div className="p-6 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                  🔗
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Link Student to Parent</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Connect a student to this parent/guardian</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Select Student
                </label>
                <select value={linkStudentId} onChange={(e) => setLinkStudentId(e.target.value)}
                  className={inputClass} style={inputStyle}>
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.student_id}) — {s.classes?.name || 'No class'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Primary Contact</p>
                    <p className="text-xs text-gray-400">First person to call in emergencies</p>
                  </div>
                  <button onClick={() => setLinkIsPrimary(!linkIsPrimary)}
                    className="w-11 h-6 rounded-full transition-all relative"
                    style={{ background: linkIsPrimary ? '#16a34a' : '#d1d5db' }}>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
                      style={{ left: linkIsPrimary ? '24px' : '4px' }} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Can Pick Up</p>
                    <p className="text-xs text-gray-400">Authorized to collect student from school</p>
                  </div>
                  <button onClick={() => setLinkCanPickup(!linkCanPickup)}
                    className="w-11 h-6 rounded-full transition-all relative"
                    style={{ background: linkCanPickup ? '#16a34a' : '#d1d5db' }}>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
                      style={{ left: linkCanPickup ? '24px' : '4px' }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={() => setShowLinkModal(false)}
                className="px-5 py-2.5 text-sm text-gray-500 border-2 border-gray-100 rounded-xl hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button onClick={handleLink} disabled={linkSaving || !linkStudentId}
                className="px-6 py-2.5 text-sm rounded-xl transition-all disabled:opacity-60 font-bold"
                style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37' }}>
                {linkSaving ? 'Linking...' : 'Link Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
