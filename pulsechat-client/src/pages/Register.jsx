import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { registerApi } from '../api';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!agreed) {
      toast.error('Please agree to the Terms of Service');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await registerApi(form);
      login(data);
      toast.success(`Welcome to PulseChat, ${data.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#131314', color: '#e5e2e3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: 'Geist, sans-serif' }}>
      {/* Background Accents */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'rgba(173,198,255,0.10)', filter: 'blur(120px)', borderRadius: '9999px', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(208,188,255,0.10)', filter: 'blur(120px)', borderRadius: '9999px', zIndex: 0, pointerEvents: 'none' }}></div>

      <main style={{ width: '100%', maxWidth: '448px', padding: '32px 20px', position: 'relative', zIndex: 10 }}>
        {/* Brand Header */}
        <header style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ color: '#adc6ff', fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, lineHeight: '40px', letterSpacing: '-0.02em', color: '#e5e2e3', margin: '0 0 4px' }}>Create Account</h1>
          <p style={{ fontSize: '14px', color: '#c2c6d6', margin: 0 }}>Join our immersive digital workspace</p>
        </header>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', letterSpacing: '0.02em', fontWeight: 500, color: '#c2c6d6', paddingLeft: '4px' }}>Full Name</label>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 16px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'rgba(194,198,214,0.6)', fontSize: '20px' }}>person</span>
              <input name="name" value={form.name} onChange={handleChange} style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#e5e2e3' }} placeholder="Alex Rivers" type="text" autoComplete="name" />
            </div>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', letterSpacing: '0.02em', fontWeight: 500, color: '#c2c6d6', paddingLeft: '4px' }}>Email Address</label>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 16px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'rgba(194,198,214,0.6)', fontSize: '20px' }}>mail</span>
              <input name="email" value={form.email} onChange={handleChange} style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#e5e2e3' }} placeholder="name@example.com" type="email" autoComplete="email" />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', letterSpacing: '0.02em', fontWeight: 500, color: '#c2c6d6', paddingLeft: '4px' }}>Password</label>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 16px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'rgba(194,198,214,0.6)', fontSize: '20px' }}>lock</span>
              <input name="password" value={form.password} onChange={handleChange} style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#e5e2e3' }} placeholder="••••••••" type={showPassword ? 'text' : 'password'} autoComplete="new-password" />
              <span className="material-symbols-outlined" onClick={() => setShowPassword(!showPassword)} style={{ color: 'rgba(194,198,214,0.6)', fontSize: '20px', cursor: 'pointer' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
            </div>
          </div>

          {/* Terms */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px', marginTop: '4px' }}>
            <div onClick={() => setAgreed(!agreed)} style={{ width: '20px', height: '20px', borderRadius: '4px', border: `1px solid ${agreed ? '#adc6ff' : 'rgba(255,255,255,0.2)'}`, background: agreed ? 'rgba(173,198,255,0.15)' : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
              {agreed && <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#adc6ff', fontVariationSettings: "'FILL' 1" }}>check</span>}
            </div>
            <p style={{ fontSize: '12px', color: '#c2c6d6', margin: 0 }}>I agree to the <span style={{ color: '#adc6ff', cursor: 'pointer' }}>Terms of Service</span></p>
          </div>

          {/* Sign Up Button */}
          <button type="submit" disabled={loading} style={{ marginTop: '8px', background: loading ? 'rgba(173,198,255,0.5)' : '#adc6ff', color: '#002e6a', fontWeight: 700, fontSize: '16px', height: '56px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(173,198,255,0.3)', transition: 'all 0.3s ease', width: '100%' }}>
            {loading ? 'Creating Account...' : (<>Sign Up <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span></>)}
          </button>
        </form>

        {/* Social */}
        <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ fontSize: '12px', color: 'rgba(194,198,214,0.4)', letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
          <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
          <button style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <img alt="Google" style={{ width: '20px', height: '20px', opacity: 0.8 }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkKjQwRrTnvuPi8R7sVruw-GCClxLP5-5u10wMOEM6r23XoQXSIBQPpmEumndjE6CAun4XChYykwDsuH_m2gYmxESB-UUW-O-GG-v1GE240pf0NKtTge-53NGD9-Twf59KcD67fTGsfcjEWj5aQXnP_oJhQ5OSA9LTJlRvWZqLLOVbwyzEfhwuEFIW3EOvJHvlnDNnJAikDY9lYLJJbitTV3R_iFg4Z-_M-3CkeyufwkYQWm_m87so1_5bTDin84Br21lCAybdlIzV" />
          </button>
          <button style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ color: '#c2c6d6' }}>ios</span>
          </button>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: '32px', textAlign: 'center', paddingBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#c2c6d6', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#adc6ff', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
