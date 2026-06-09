import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ACADEMIC_TERMS } from '../../lib/constants';

interface FeeRecord {
  id: string;
  receipt_number?: string;
  fee_type: string;
  amount: number;
  paid: number;
  due_date: string;
  status: string;
  term: string;
}

interface InvoiceStudent {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  classes?: { name: string };
}

interface FeeInvoiceProps {
  student: InvoiceStudent;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  paid:    { label: 'PAID',    color: '#16a34a' },
  partial: { label: 'PARTIAL', color: '#d97706' },
  unpaid:  { label: 'UNPAID',  color: '#ef4444' },
  overdue: { label: 'OVERDUE', color: '#b91c1c' },
};

export default function FeeInvoice({ student, onClose }: FeeInvoiceProps) {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [filterTerm, setFilterTerm] = useState<string>(ACADEMIC_TERMS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchFees(); }, [filterTerm]);

  const fetchFees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('fees')
      .select('id, receipt_number, fee_type, amount, paid, due_date, status, term')
      .eq('student_id', student.id)
      .eq('term', filterTerm)
      .order('due_date');
    setFees(data || []);
    setLoading(false);
  };

  const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paid, 0);
  const totalBalance = totalAmount - totalPaid;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

        {/* Controls */}
        <div className="p-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', borderRadius: '24px 24px 0 0' }}>
          <span className="font-black text-white text-sm">Fee Invoice</span>
          <div className="flex gap-2 items-center">
            <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}
              className="text-xs border border-gray-600 bg-gray-700 text-white rounded-lg px-2 py-1.5">
              {ACADEMIC_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
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

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-4 pb-4" style={{ borderBottom: '2px solid #2c2c2c' }}>
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full overflow-hidden" style={{ border: '2px solid #2c2c2c' }}>
                <img src="/images/gfa-logo.jpeg" alt="GFA" className="w-full h-full object-cover" />
              </div>
            </div>
            <h1 className="text-base font-black text-gray-900 uppercase">Glowing Future Academy</h1>
            <p className="text-xs text-gray-400">Fee Invoice</p>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div>
              <p className="text-xs text-gray-400">Student Name</p>
              <p className="text-sm font-bold text-gray-800">{student.first_name} {student.last_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Student ID</p>
              <p className="text-sm font-mono font-bold text-gray-800">{student.student_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Class</p>
              <p className="text-sm font-bold text-gray-800">{student.classes?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Term</p>
              <p className="text-sm font-bold text-gray-800">{filterTerm}</p>
            </div>
          </div>

          {/* Fees Table */}
          {loading ? (
            <div className="text-center py-6 text-gray-400">Loading...</div>
          ) : fees.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-3xl mb-2">💰</p>
              <p>No fee records for {filterTerm}</p>
            </div>
          ) : (
            <table className="w-full mb-4" style={{ borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
              <thead>
                <tr style={{ background: '#2c2c2c' }}>
                  {['Fee Type', 'Amount', 'Paid', 'Balance', 'Due Date', 'Status'].map((h) => (
                    <th key={h} style={{
                      padding: '7px 8px', textAlign: 'left', color: '#D4AF37',
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fees.map((fee, idx) => {
                  const bal = fee.amount - fee.paid;
                  const sc = statusConfig[fee.status] || statusConfig['unpaid'];
                  return (
                    <tr key={fee.id}
                      style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '6px 8px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>{fee.fee_type}</td>
                      <td style={{ padding: '6px 8px', fontSize: '12px', color: '#1f2937' }}>D {fee.amount.toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', fontSize: '12px', color: '#16a34a' }}>D {fee.paid.toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', fontSize: '12px', fontWeight: 700, color: bal > 0 ? '#ef4444' : '#16a34a' }}>
                        D {Math.max(0, bal).toLocaleString()}
                      </td>
                      <td style={{ padding: '6px 8px', fontSize: '11px', color: '#6b7280' }}>
                        {new Date(fee.due_date).toLocaleDateString('en-GB')}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: sc.color }}>{sc.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#2c2c2c' }}>
                  <td style={{ padding: '8px', color: '#fff', fontWeight: 700, fontSize: '12px' }}>TOTAL</td>
                  <td style={{ padding: '8px', color: '#D4AF37', fontWeight: 700, fontSize: '12px' }}>D {totalAmount.toLocaleString()}</td>
                  <td style={{ padding: '8px', color: '#4ade80', fontWeight: 700, fontSize: '12px' }}>D {totalPaid.toLocaleString()}</td>
                  <td style={{ padding: '8px', fontWeight: 800, fontSize: '12px', color: totalBalance > 0 ? '#f87171' : '#4ade80' }}>
                    D {Math.max(0, totalBalance).toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}

          <p className="text-center text-xs text-gray-300 mt-2">
            Invoice Date: {new Date().toLocaleDateString('en-GB')} &middot; Glowing Future Academy
          </p>
        </div>
      </div>
    </div>
  );
}
