interface Fee {
  id: string;
  receipt_number?: string;
  fee_type: string;
  amount: number;
  paid: number;
  due_date: string;
  paid_date?: string;
  status: string;
  term: string;
  academic_year: string;
  students?: {
    first_name: string;
    last_name: string;
    student_id: string;
    classes?: { name: string };
  };
}

interface FeeReceiptProps {
  fee: Fee;
  onClose: () => void;
}

export default function FeeReceipt({ fee, onClose }: FeeReceiptProps) {
  const balance = fee.amount - fee.paid;
  const receiptDate = fee.paid_date
    ? new Date(fee.paid_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

        {/* Controls */}
        <div className="p-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', borderRadius: '24px 24px 0 0' }}>
          <span className="font-black text-white text-sm">Fee Receipt</span>
          <div className="flex gap-2">
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
          <div className="text-center mb-5 pb-4" style={{ borderBottom: '2px dashed #d1d5db' }}>
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full overflow-hidden" style={{ border: '2px solid #2c2c2c' }}>
                <img src="/images/gfa-logo.jpeg" alt="GFA" className="w-full h-full object-cover" />
              </div>
            </div>
            <h1 className="text-base font-black text-gray-900 uppercase">Glowing Future Academy</h1>
            <p className="text-xs text-gray-400">Official Payment Receipt</p>
            <div className="mt-3 inline-block px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <p className="text-base font-black font-mono" style={{ color: '#B8860B' }}>
                {fee.receipt_number || 'RECEIPT'}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-5">
            {[
              { label: 'Student Name', value: `${fee.students?.first_name || ''} ${fee.students?.last_name || ''}` },
              { label: 'Student ID', value: fee.students?.student_id || '—', mono: true },
              { label: 'Class', value: fee.students?.classes?.name || '—' },
              { label: 'Fee Type', value: fee.fee_type },
              { label: 'Term', value: `${fee.term} · ${fee.academic_year}` },
              { label: 'Receipt Date', value: receiptDate },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">{label}</span>
                <span className={`font-bold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Payment Breakdown */}
          <div className="p-4 rounded-xl mb-5" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-bold text-gray-800">D {fee.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-bold text-green-600">D {fee.paid.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-700">Balance Outstanding</span>
                <span style={{ color: balance > 0 ? '#ef4444' : '#16a34a' }}>
                  D {Math.max(0, balance).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-5">
            <span className="px-4 py-1.5 rounded-full text-sm font-bold"
              style={{
                background: fee.status === 'paid' ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)',
                color: fee.status === 'paid' ? '#16a34a' : '#d97706',
              }}>
              {fee.status === 'paid' ? '✓ FULLY PAID' : 'PARTIALLY PAID'}
            </span>
          </div>

          {/* Signatures */}
          <div className="pt-4" style={{ borderTop: '2px dashed #d1d5db' }}>
            <div className="flex justify-between">
              <div>
                <div style={{ borderBottom: '1px solid #9ca3af', width: '130px', height: '32px' }}></div>
                <p className="text-xs text-gray-400 mt-1">Cashier Signature</p>
              </div>
              <div>
                <div style={{ borderBottom: '1px solid #9ca3af', width: '130px', height: '32px' }}></div>
                <p className="text-xs text-gray-400 mt-1">Official Stamp</p>
              </div>
            </div>
            <p className="text-center text-xs text-gray-300 mt-4">
              This is an official receipt — Glowing Future Academy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
