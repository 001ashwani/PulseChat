import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await loginApi(form);
      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body text-base min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Ambient Gradient Background Elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-primary-container/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary-container/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Glassmorphic Login Card */}
      <main className="relative w-full max-w-[420px] mx-6 p-10 bg-surface/80 backdrop-blur-[12px] border border-outline-variant/20 rounded-xl shadow-lg flex flex-col gap-10 z-10 transition-transform duration-500 ease-out">
        {/* Header */}
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/20 shadow-sm">
            <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
          </div>
          <div>
            <h1 className="font-headline text-3xl text-primary tracking-tight font-semibold">Welcome Back</h1>
            <p className="font-body text-base text-on-surface-variant mt-1">Sign in to continue to PulseChat</p>
          </div>
        </header>

        {/* Login Form */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="flex flex-col gap-1 group">
            <label className="font-label text-sm text-on-surface-variant ml-2 transition-colors group-focus-within:text-primary font-medium" htmlFor="email">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors pointer-events-none" style={{ fontVariationSettings: "'FILL' 0" }}>mail</span>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                value={form.email} onChange={handleChange}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-4 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 font-body text-base placeholder-outline/60 shadow-sm"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1 group">
            <div className="flex justify-between items-center ml-2 mr-1">
              <label className="font-label text-sm text-on-surface-variant transition-colors group-focus-within:text-primary font-medium" htmlFor="password">Password</label>
              <a className="font-label text-xs text-primary hover:text-primary-dim transition-colors font-semibold" href="#">Forgot?</a>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors pointer-events-none" style={{ fontVariationSettings: "'FILL' 0" }}>lock</span>
              <input
                id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                value={form.password} onChange={handleChange}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg py-4 pl-10 pr-12 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 font-body text-base placeholder-outline/60 shadow-sm"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit" disabled={loading}
            className="w-full mt-2 py-4 px-6 rounded-lg bg-gradient-to-r from-primary to-primary-dim text-on-primary font-label text-sm font-bold shadow-md shadow-primary/20 border border-outline-variant/10 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                Signing in...
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <footer className="text-center pt-4 border-t border-outline-variant/20">
          <p className="font-label text-sm text-on-surface-variant">
            Don't have an account? <Link className="text-primary font-bold hover:text-primary-dim transition-colors" to="/register">Sign Up</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}