import sys

def replace_login():
    with open('pulsechat-client/src/pages/Login.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_idx = content.find('  return (')
    if start_idx == -1:
        print('Could not find return statement in Login.jsx')
        return
        
    new_return = """  return (
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
}"""
    
    new_content = content[:start_idx] + new_return
    with open('pulsechat-client/src/pages/Login.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Updated Login.jsx')

def replace_signup():
    with open('pulsechat-client/src/pages/Register.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    start_idx = content.find('  return (')
    if start_idx == -1:
        print('Could not find return statement in Register.jsx')
        return

    new_return = """  return (
    <div className="bg-background min-h-screen flex items-center justify-center relative overflow-hidden antialiased text-on-background font-body">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-tertiary/5 blur-[100px]"></div>
      </div>
      <main className="w-full max-w-md px-lg z-10 relative">
        <div className="glass-panel p-xl flex flex-col items-center">
          <div className="mb-lg flex flex-col items-center">
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
}"""

    new_content = content[:start_idx] + new_return
    with open('pulsechat-client/src/pages/Register.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Updated Register.jsx')


replace_login()
replace_signup()
