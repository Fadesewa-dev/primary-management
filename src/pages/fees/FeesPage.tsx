import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ACADEMIC_TERMS, CURRENT_ACADEMIC_YEAR } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../utils';
import FeeReceipt from '../../components/fees/FeeReceipt';
import FeeInvoice from '../../components/fees/FeeInvoice';

interface Fee {
  id: string;
  student_id: string;
  receipt_number?: string;
  fee_type: string;
  amount: number;
  paid: number;
  due_date: string;
  paid_date?: string;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  term: string;
  academic_year: string;
  students?: {
    first_name: string;
    last_name: string;
    student_id: string;
    class_id?: string;
    classes?: { name: string };
  };
}

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  class_id?: string;
}

const emptyForm = {
  student_id: '',
  class_id: '',
  fee_type: 'Tuition Fee',
  amount: 0,
  paid: 0,
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  term: 'First Term',
  academic_year: CURRENT_ACADEMIC_YEAR,
};

const feeTypes = [
  'Tuition Fee', 'Registration Fee', 'Uniform Fee', 'Books Fee',
  'Transportation Fee', 'Exam Fee', 'Lunch Fee', 'Other',
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'PAID',    color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  partial: { label: 'PARTIAL', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  unpaid:  { label: 'UNPAID',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  overdue: { label: 'OVERDUE', color: '#b91c1c', bg: 'rgba(185,28,28,0.12)' },
};

// Fix mobile zoom — all inputs must have font-size >= 16px
const inputClass = "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none bg-gray-50 transition-all";
const inputStyle = { fontSize: '16px' };

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFeeType, setFilterFeeType] = useState('');
  const [search, setSearch] = useState('');
  const [receiptFee, setReceiptFee] = useState<Fee | null>(null);
  const [invoiceStudent, setInvoiceStudent] = useState<{ id: string; student_id: string; first_name: string; last_name: string; classes?: { name: string } } | null>(null);

  useEffect(() => {
    fetchFees();
    fetchClasses();
    fetchAllStudents();
  }, []);

  // When class changes in form, filter students
  useEffect(() => {
    if (form.class_id) {
      setFilteredStudents(allStudents.filter((s) => s.class_id === form.class_id));
    } else {
      setFilteredStudents(allStudents);
    }
    // Reset student selection when class changes
    if (!editingFee) {
      setForm((prev) => ({ ...prev, student_id: '' }));
    }
  }, [form.class_id, allStudents]);

  const fetchFees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('fees')
      .select('*, students(first_name, last_name, student_id, class_id, classes(name))')
      .order('due_date', { ascending: true });
    setFees(data || []);
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

  const openModal = (fee?: Fee) => {
    if (fee) {
      setEditingFee(fee);
      const classId = fee.students?.class_id || '';
      setForm({
        student_id: fee.student_id,
        class_id: classId,
        fee_type: fee.fee_type,
        amount: fee.amount,
        paid: fee.paid,
        due_date: fee.due_date,
        term: fee.term,
        academic_year: fee.academic_year,
      });
      if (classId) {
        setFilteredStudents(allStudents.filter((s) => s.class_id === classId));
      }
    } else {
      setEditingFee(null);
      setForm(emptyForm);
      setFilteredStudents(allStudents);
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFee(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    if (!form.student_id || form.amount <= 0) {
      setError('Please select a student and enter a valid amount.');
      return;
    }
    setSaving(true);
    setError('');

    const computedStatus =
      form.paid >= form.amount ? 'paid' : form.paid > 0 ? 'partial' : 'unpaid';

    const payload: any = {
      student_id: form.student_id,
      fee_type: form.fee_type,
      amount: form.amount,
      paid: form.paid,
      due_date: form.due_date,
      term: form.term,
      academic_year: form.academic_year,
      status: computedStatus,
      paid_date: form.paid >= form.amount ? new Date().toISOString().split('T')[0] : null,
    };

    try {
      if (editingFee) {
        const { error } = await supabase.from('fees').update(payload).eq('id', editingFee.id);
        if (error) throw error;
      } else {
        // Auto-generate receipt number
        const year = new Date().getFullYear();
        const prefix = `RCP-${year}-`;
        const { data: lastFee } = await supabase
          .from('fees')
          .select('receipt_number')
          .ilike('receipt_number', `${prefix}%`)
          .order('receipt_number', { ascending: false })
          .limit(1);

        let nextNum = 1;
        if (lastFee && lastFee.length > 0 && lastFee[0].receipt_number) {
          const parts = lastFee[0].receipt_number.split('-');
          const lastNum = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        payload.receipt_number = `${prefix}${String(nextNum).padStart(5, '0')}`;

        const { error } = await supabase.from('fees').insert(payload);
        if (error) throw error;
      }
      await fetchFees();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save fee record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee record?')) return;
    await supabase.from('fees').delete().eq('id', id);
    await fetchFees();
  };

  const getEffectiveStatus = (fee: Fee) => {
    if (fee.status === 'paid') return 'paid';
    if (new Date(fee.due_date) < new Date() && fee.paid < fee.amount) return 'overdue';
    return fee.status;
  };

  const filtered = fees.filter((fee) => {
    const fullName = `${fee.students?.first_name} ${fee.students?.last_name}`.toLowerCase();
    const matchSearch = search === '' ||
      fullName.includes(search.toLowerCase()) ||
      fee.students?.student_id.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === '' || fee.students?.class_id === filterClass;
    const matchTerm = filterTerm === '' || fee.term === filterTerm;
    const matchStatus = filterStatus === '' || getEffectiveStatus(fee) === filterStatus;
    const matchFeeType = filterFeeType === '' || fee.fee_type === filterFeeType;
    return matchSearch && matchClass && matchTerm && matchStatus && matchFeeType;
  });

  const totalAmount = filtered.reduce((s, f) => s + f.amount, 0);
  const totalPaid = filtered.reduce((s, f) => s + f.paid, 0);
  const totalOutstanding = totalAmount - totalPaid;
  const overdueCount = filtered.filter((f) => getEffectiveStatus(f) === 'overdue').length;

  const balance = form.amount - form.paid;
  const previewStatus = form.paid >= form.amount && form.amount > 0 ? 'paid' : form.paid > 0 ? 'partial' : 'unpaid';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">School Fees</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            Manage student fees, payments and balances
          </p>
        </div>
        <button onClick={() => openModal()}
          className="relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
          + Add Fee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Fees',   value: formatCurrency(totalAmount),      color: '#2c2c2c' },
          { label: 'Total Paid',   value: formatCurrency(totalPaid),        color: '#16a34a' },
          { label: 'Outstanding',  value: formatCurrency(totalOutstanding),  color: '#ef4444' },
          { label: 'Overdue',      value: `${overdueCount} records`,        color: '#b91c1c' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 text-center"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="text-lg font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
          <select value={filterFeeType} onChange={(e) => setFilterFeeType(e.target.value)}
            className={inputClass} style={inputStyle}>
            <option value="">All Fee Types</option>
            {feeTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className={inputClass} style={inputStyle}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
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
            <p className="text-5xl mb-3">💰</p>
            <p className="font-bold text-gray-600">No fee records found</p>
            <button onClick={() => openModal()} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
              + Add First Fee Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                  {['Student', 'Receipt #', 'Fee Type', 'Amount', 'Paid', 'Balance', 'Due Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((fee, idx) => {
                  const bal = fee.amount - fee.paid;
                  const es = getEffectiveStatus(fee);
                  const sc = statusConfig[es];
                  return (
                    <tr key={fee.id} className="hover:bg-amber-50/30 transition-colors"
                      style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)', color: '#D4AF37' }}>
                            {fee.students?.first_name?.[0]}{fee.students?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {fee.students?.first_name} {fee.students?.last_name}
                            </p>
                            <p className="text-xs font-mono text-gray-400">{fee.students?.student_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-gray-500">
                          {fee.receipt_number || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-700">{fee.fee_type}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-gray-800">{formatCurrency(fee.amount)}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-green-600">{formatCurrency(fee.paid)}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-red-500">{formatCurrency(bal)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{formatDate(fee.due_date)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{fee.term}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => openModal(fee)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all hover:-translate-y-0.5"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>Edit</button>
                          <button onClick={() => setReceiptFee(fee)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all hover:-translate-y-0.5"
                            style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>Receipt</button>
                          <button onClick={() => setInvoiceStudent({
                            id: fee.student_id,
                            student_id: fee.students?.student_id || '',
                            first_name: fee.students?.first_name || '',
                            last_name: fee.students?.last_name || '',
                            classes: fee.students?.classes,
                          })}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all hover:-translate-y-0.5"
                            style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>Invoice</button>
                          <button onClick={() => handleDelete(fee.id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-50 text-red-500 hover:-translate-y-0.5 transition-all">Delete</button>
                        </div>
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                  💰
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {editingFee ? 'Update Fee Record' : 'Add Fee Record'}
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5">Fill in fee and payment details</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              {/* Class selector */}
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

              {/* Student selector */}
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

              {/* Fee Type */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Fee Type</label>
                <select value={form.fee_type} onChange={(e) => setForm({ ...form, fee_type: e.target.value })}
                  className={inputClass} style={inputStyle}>
                  {feeTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Amount & Paid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Total Amount (D)</label>
                  <input type="number" value={form.amount} min={0}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Amount Paid (D)</label>
                  <input type="number" value={form.paid} min={0} max={form.amount}
                    onChange={(e) => setForm({ ...form, paid: parseFloat(e.target.value) || 0 })}
                    className={inputClass} style={inputStyle} />
                </div>
              </div>

              {/* Due Date & Term */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Due Date</label>
                  <input type="date" value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Term</label>
                  <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className={inputClass} style={inputStyle}>
                    {ACADEMIC_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Live Preview */}
              {form.amount > 0 && (
                <div className="p-4 rounded-xl"
                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wide">Payment Summary</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-bold text-gray-800">{formatCurrency(form.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-bold text-green-600">{formatCurrency(form.paid)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-500">Balance</span>
                    <span className="font-bold text-red-500">{formatCurrency(balance < 0 ? 0 : balance)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((form.paid / form.amount) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #D4AF37, #F5C842)',
                      }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {Math.min(Math.round((form.paid / form.amount) * 100), 100)}% paid
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: statusConfig[previewStatus].bg, color: statusConfig[previewStatus].color }}>
                      {statusConfig[previewStatus].label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={closeModal}
                className="px-5 py-2.5 text-sm text-gray-500 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm rounded-xl transition-all disabled:opacity-60 font-bold hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                {saving ? 'Saving...' : editingFee ? 'Update Fee' : 'Save Fee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Receipt Modal */}
      {receiptFee && (
        <FeeReceipt fee={receiptFee} onClose={() => setReceiptFee(null)} />
      )}

      {/* Fee Invoice Modal */}
      {invoiceStudent && (
        <FeeInvoice student={invoiceStudent} onClose={() => setInvoiceStudent(null)} />
      )}
    </div>
  );
}
