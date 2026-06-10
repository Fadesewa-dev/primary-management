import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: 'linear-gradient(135deg, #2c2c2c 0%, #3d3d3d 40%, #4a4a4a 100%)',
      }}
    >
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden">

        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(-30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(30%, 30%)' }}
        />

        {/* Real GFA Logo */}
        <div
          className="w-48 h-48 rounded-full overflow-hidden mb-8"
          style={{
            boxShadow: '0 8px 40px rgba(212,175,55,0.4)',
            border: '3px solid rgba(212,175,55,0.5)',
            background: '#fff',
          }}
        >
          <img src="/images/gfa-logo.jpeg" alt="GFA Logo" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-4xl font-black text-white text-center leading-tight">
          Glowing Future<br />
          <span style={{ color: '#D4AF37' }}>Academy</span>
        </h1>

        <p className="text-white/60 text-center mt-4 text-lg italic">"Strong, Resilient & Bright"</p>

        <div
          className="mt-4 px-6 py-3 rounded-full text-sm font-semibold"
          style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          Glow With Pride
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          {[{ label: 'Students', value: '500+' }, { label: 'Teachers', value: '30+' }, { label: 'Classes', value: '18' }].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-black" style={{ color: '#D4AF37' }}>{value}</p>
              <p className="text-white/50 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-96 flex items-center justify-center p-8">
        <div
          className="w-full max-w-sm rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3"
              style={{ border: '2px solid rgba(212,175,55,0.5)', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}
            >
              <img src="/images/gfa-logo.jpeg" alt="GFA Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="font-black text-gray-900 text-sm">Glowing Future Academy</h2>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome Back</h2>
          <p className="text-gray-400 text-sm mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.gm" required
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all bg-gray-50"
                onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all bg-gray-50 pr-12"
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 mt-2"
              style={{
                background: loading ? '#ccc' : 'linear-gradient(135deg, #2c2c2c, #4a4a4a)',
                color: '#D4AF37',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(44,44,44,0.4)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In to GFA'}
            </button>
          </form>

          <div className="mt-8 pt-6 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400">Glowing Future Academy Management System</p>
            <p className="text-xs text-gray-400 mt-1">© 2026 GFA · All rights reserved | Built by Fade</p>
          </div>
        </div>
      </div>
    </div>
  );
}
