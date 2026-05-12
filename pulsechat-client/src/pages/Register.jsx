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
    <div className="bg-background min-h-screen flex items-center justify-center relative overflow-hidden antialiased text-on-background font-body">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-tertiary/5 blur-[100px]"></div>
      </div>
      <main className="w-full max-w-[420px] px-6 z-10 relative">
        <div className="glass-panel p-8 flex flex-col items-center w-full">
          <div className="mb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-xl shadow-lg mb-sm border border-outline-variant/10 bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
            </div>
            <h1 className="font-headline text-[32px] font-semibold text-primary text-center tracking-tight">PulseChat</h1>
            <p className="font-body text-base text-on-surface-variant text-center mt-1">Join the network.</p>
          </div>
          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1 group">
              <label className="font-label text-sm text-on-surface-variant block transition-colors group-focus-within:text-primary font-medium" htmlFor="fullname">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors pointer-events-none">person</span>
                <input
                  id="fullname" name="name" value={form.name} onChange={handleChange}
                  className="input-field pl-10" placeholder="Jane Doe" required type="text"
                />
              </div>
            </div>
            <div className="space-y-1 group">
              <label className="font-label text-sm text-on-surface-variant block transition-colors group-focus-within:text-primary font-medium" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors pointer-events-none">mail</span>
                <input
                  id="email" name="email" value={form.email} onChange={handleChange}
                  className="input-field pl-10" placeholder="jane@example.com" required type="email"
                />
              </div>
            </div>
            <div className="space-y-1 group">
              <label className="font-label text-sm text-on-surface-variant block transition-colors group-focus-within:text-primary font-medium" htmlFor="password">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors pointer-events-none">lock</span>
                <input
                  id="password" name="password" value={form.password} onChange={handleChange}
                  className="input-field pl-10 pr-10" placeholder="••••••••" required type={showPassword ? 'text' : 'password'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            
            {/* Terms */}
            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    className="peer appearance-none w-5 h-5 bg-surface-container-low border border-outline-variant rounded text-primary focus:ring-primary focus:ring-offset-0 focus:border-primary transition-all duration-200 checked:bg-primary checked:border-primary cursor-pointer" type="checkbox"
                  />
                  <span className="material-symbols-outlined absolute text-on-primary text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <span className="font-label text-sm text-on-surface-variant group-hover:text-on-surface transition-colors select-none">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a>
                </span>
              </label>
            </div>

            <div className="pt-4">
              <button disabled={loading} className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed" type="submit">
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
          <div className="mt-8 text-center border-t border-outline-variant/20 pt-4 w-full">
            <p className="font-body text-base text-on-surface-variant">
              Already have an account? <Link className="btn-ghost ml-1" to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}