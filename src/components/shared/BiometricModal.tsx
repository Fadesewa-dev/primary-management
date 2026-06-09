interface BiometricModalProps {
  message: string;
  onClose: () => void;
}

export default function BiometricModal({ message, onClose }: BiometricModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm text-center overflow-hidden"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

        {/* Header */}
        <div className="p-6 relative" style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
            Phase 2
          </span>

          {/* Fingerprint icon with pulse ring */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: 'rgba(212,175,55,0.4)' }} />
            <div className="absolute inset-2 rounded-full opacity-30"
              style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)' }} />
            <span className="relative text-5xl select-none">🫆</span>
          </div>

          <p className="text-white font-black text-lg mt-3">Biometric Feature</p>
          <p className="text-xs mt-1" style={{ color: '#D4AF37' }}>Fingerprint Recognition</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl"
            style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
          </div>

          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-xs text-gray-400 font-medium">Planned for Phase 2 release</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
