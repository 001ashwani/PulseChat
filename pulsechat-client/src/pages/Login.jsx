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
    <div className="bg-background text-on-surface flex items-center justify-center min-h-screen relative w-full">
      {/* Ambient Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[150px] rounded-full"></div>
      </div>

      <main className="w-full max-w-[420px] px-margin-mobile relative z-10 flex flex-col items-center">
        {/* Logo & Header */}
        <div className="mb-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mb-md border border-white/20">
            <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight mb-xs">PulseChat</h1>
          <p className="font-body-md text-on-surface-variant/60">Welcome back to the sanctuary.</p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card w-full rounded-[32px] p-8 mb-lg">
          <header className="mb-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface">Sign In</h2>
            <div className="h-1 w-8 bg-primary rounded-full mt-2"></div>
          </header>

          <form className="space-y-md" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant/80 px-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[20px]">mail</span>
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  value={form.email} onChange={handleChange}
                  className="glass-input w-full h-14 pl-12 pr-4 rounded-xl font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant/30"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-xs">
              <div className="flex justify-between items-center px-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant/80" htmlFor="password">Password</label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[20px]">lock</span>
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={form.password} onChange={handleChange}
                  className="glass-input w-full h-14 pl-12 pr-12 rounded-xl font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant/30"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full h-14 bg-primary text-on-primary font-body-lg font-bold rounded-xl primary-glow active:scale-[0.98] transition-all duration-200 mt-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-lg">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span className="px-4 font-label-sm text-label-sm text-on-surface-variant/40">OR CONTINUE WITH</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <button className="glass-input h-12 rounded-xl flex items-center justify-center gap-sm hover:bg-white/10 transition-colors">
              <img alt="Google" className="w-4 h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBp7pgxGH2SKMudiZg_XqGv9BkcfhXhJGNvz4ZN8kXA_gn4zYqtOxff70J2xye6u0uS3-J4DjP7e9OPg0Eqy8TdxQcaAaUZovZPTHFSgChmzy7zwwZn192T_YdCkz7ZkGBhmcb68lVh3pcqjzCnJa5ppkkyxGXR_Dq4cZbIOzu1O2B2Ez6Pndrh46wpoUV-I8lq5gnqZTslhraOQcSL08ESocgDwO7IcU-n08DUS6t_82YuAbFY_ggh1vnsR72Mxtejz7OeSO7E3UX3"/>
              <span className="font-label-sm text-on-surface">Google</span>
            </button>
            <button className="glass-input h-12 rounded-xl flex items-center justify-center gap-sm hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">ios</span>
              <span className="font-label-sm text-on-surface">Apple</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="font-body-md text-body-md text-on-surface-variant/60">
            New to the community?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline decoration-primary/30 underline-offset-4 ml-1">Sign Up</Link>
          </p>
        </div>
      </main>

      {/* Decorative card */}
      <div className="hidden lg:block absolute bottom-12 right-12 w-64 h-64 glass-card rounded-[40px] rotate-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-md mb-md">
            <div className="w-10 h-10 rounded-full border-2 border-primary bg-surface overflow-hidden">
              <img alt="Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDn7hzXeayR2u9T2dnNJDZCSl_-GsVNOAduSWOjRtJyrlTipfmcrOCf4ERCZkGYCKyhaa-bWRd5OHy8-sUoUqlV30g4QK6GA2G41QN1jf6ANVMTLdvEDCRNeN7xqbRnqgLSx8IYcC_OPGq7eRQCZCZVDnj7oqWHjovvYafK7GGNPOjRHbwDPwse0SqBwMKCxs37MEsu_tosVJPTceQ6cvYT6-HPvB-wHJEHPkVXSTW7UIRbibyJdgRgBu8dbyJ53XPG7D6n39HzhaFY"/>
            </div>
            <div>
              <div className="w-20 h-2 bg-white/20 rounded-full mb-1"></div>
              <div className="w-12 h-2 bg-white/10 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-sm">
            <div className="w-full h-3 bg-primary/20 rounded-full"></div>
            <div className="w-4/5 h-3 bg-white/10 rounded-full"></div>
            <div className="w-2/3 h-3 bg-white/10 rounded-full"></div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>
      </div>
    </div>
  );
}
