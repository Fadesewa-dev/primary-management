import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  classes?: { name: string };
}

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  relationship?: string;
  is_authorized_pickup: boolean;
}

interface PickupLog {
  id: string;
  student_id: string;
  parent_id?: string;
  pickup_datetime: string;
  verification_method: string;
  verified_by?: string;
  override_pin_used: boolean;
  notes?: string;
  students?: { first_name: string; last_name: string; student_id: string };
  parents?: { first_name: string; last_name: string; phone?: string; relationship?: string };
}

const inputClass = "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none bg-gray-50 transition-all";
const inputStyle = { fontSize: '16px' };

const emptyForm = {
  student_id: '',
  parent_id: '',
  verification_method: 'Manual',
  verified_by: '',
  override_pin_used: false,
  notes: '',
};

export default function PickupLogPage() {
  const [logs, setLogs] = useState<PickupLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentParents, setStudentParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchLogs();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (form.student_id) {
      fetchStudentParents(form.student_id);
    } else {
      setStudentParents([]);
      setForm((prev) => ({ ...prev, parent_id: '' }));
    }
  }, [form.student_id]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pickup_log')
      .select('*, students(first_name, last_name, student_id), parents(first_name, last_name, phone, relationship)')
      .order('pickup_datetime', { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_id, classes(name)')
      .eq('status', 'active')
      .order('first_name');
    setStudents(data || []);
  };

  const fetchStudentParents = async (studentId: string) => {
    const { data } = await supabase
      .from('student_parents')
      .select('parents(id, first_name, last_name, phone, relationship, is_authorized_pickup)')
      .eq('student_id', studentId);

    if (data) {
      const parentList = data
        .map((sp: any) => sp.parents)
        .filter(Boolean) as Parent[];
      setStudentParents(parentList);
    }
  };

  const openModal = () => {
    setForm(emptyForm);
    setStudentParents([]);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.student_id) {
      setError('Please select a student.');
      return;
    }
    if (!form.verified_by.trim()) {
      setError('Please enter the name of the staff member verifying the pickup.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { error } = await supabase.from('pickup_log').insert({
        student_id: form.student_id,
        parent_id: form.parent_id || null,
        pickup_datetime: new Date().toISOString(),
        verification_method: form.verification_method,
        verified_by: form.verified_by.trim(),
        override_pin_used: form.override_pin_used,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
      await fetchLogs();
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to log pickup.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toDateString();
  const todayCount = logs.filter((l) => new Date(l.pickup_datetime).toDateString() === today).length;
  const overrideCount = logs.filter((l) => l.override_pin_used).length;

  const filteredLogs = search
    ? logs.filter((l) => {
        const name = `${l.students?.first_name} ${l.students?.last_name}`.toLowerCase();
        return name.includes(search.toLowerCase()) ||
          l.students?.student_id.toLowerCase().includes(search.toLowerCase());
      })
    : logs;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Pickup Log</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            Track student pickups for safety and audit
          </p>
        </div>
        <button onClick={openModal}
          className="relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
          + Log Pickup
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Logs',       value: logs.length,  color: '#2c2c2c' },
          { label: "Today's Pickups",  value: todayCount,   color: '#16a34a' },
          { label: 'Override Used',    value: overrideCount, color: '#ef4444' },
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
          <input type="text" placeholder="Search by student name or ID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className={inputClass} style={{ ...inputStyle, paddingLeft: '2.2rem' }} />
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🚗</p>
            <p className="font-bold text-gray-600">No pickup records yet</p>
            <p className="text-sm text-gray-400 mt-1">Log a pickup to start tracking</p>
            <button onClick={openModal} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
              + Log First Pickup
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                  {['Student', 'Parent / Guardian', 'Date & Time', 'Method', 'Verified By', 'Notes'].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-amber-50/30 transition-colors"
                    style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}>
                          {log.students?.first_name?.[0]}{log.students?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {log.students?.first_name} {log.students?.last_name}
                          </p>
                          <p className="text-xs font-mono text-gray-400">{log.students?.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {log.parents ? (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {log.parents.first_name} {log.parents.last_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {log.parents.relationship && `${log.parents.relationship} · `}{log.parents.phone}
                          </p>
                        </div>
                      ) : <span className="text-sm text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">
                      {new Date(log.pickup_datetime).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: log.override_pin_used ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)',
                          color: log.override_pin_used ? '#ef4444' : '#16a34a',
                        }}>
                        {log.override_pin_used ? '⚠️ Override' : log.verification_method}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{log.verified_by || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-400 max-w-xs truncate">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Pickup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

            <div className="p-6 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                  🚗
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Log Student Pickup</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Record a parent pickup with timestamp</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Student <span className="text-red-400">*</span>
                </label>
                <select value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value, parent_id: '' })}
                  className={inputClass} style={inputStyle}>
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.student_id}){s.classes?.name ? ` · ${s.classes.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Parent / Guardian
                  {studentParents.length > 0 && (
                    <span className="text-gray-400 normal-case font-normal ml-1">
                      ({studentParents.length} linked)
                    </span>
                  )}
                </label>
                <select value={form.parent_id}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                  className={inputClass} style={inputStyle}
                  disabled={!form.student_id}>
                  <option value="">-- Select Parent --</option>
                  {studentParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}{p.relationship ? ` (${p.relationship})` : ''}
                      {!p.is_authorized_pickup ? ' ⚠️ Not authorized' : ''}
                    </option>
                  ))}
                </select>
                {form.student_id && studentParents.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No linked parents found for this student.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Verification Method
                  </label>
                  <select value={form.verification_method}
                    onChange={(e) => setForm({ ...form, verification_method: e.target.value })}
                    className={inputClass} style={inputStyle}>
                    <option value="Manual">Manual</option>
                    <option value="Override">Override</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Verified By <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.verified_by}
                    onChange={(e) => setForm({ ...form, verified_by: e.target.value })}
                    placeholder="Staff member name"
                    className={inputClass} style={inputStyle} />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: form.override_pin_used ? 'rgba(239,68,68,0.05)' : '#f9fafb',
                  border: `1px solid ${form.override_pin_used ? '#fca5a5' : '#e5e7eb'}`,
                }}>
                <input type="checkbox" id="override-check"
                  checked={form.override_pin_used}
                  onChange={(e) => setForm({ ...form, override_pin_used: e.target.checked })}
                  className="w-4 h-4 accent-red-500" />
                <label htmlFor="override-check" className="text-sm font-medium text-gray-700">
                  Emergency override PIN was used
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Notes (optional)
                </label>
                <textarea value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2} className={inputClass} style={inputStyle} />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm text-gray-500 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm rounded-xl transition-all disabled:opacity-60 font-bold hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                {saving ? 'Logging...' : 'Log Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
