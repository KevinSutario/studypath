/* login.jsx — Login & Signup page */

window.LoginPage = function LoginPage() {
  const { login } = useApp();
  const [tab, setTab] = React.useState('login');
  const [form, setForm] = React.useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (tab === 'signup' && form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Demo: any creds work; if email contains "admin" → admin role
      const role = form.email.includes('admin') ? 'admin' : 'student';
      login({ name: form.name || form.email.split('@')[0], email: form.email, role });
    }, 700);
  };

  const Field = ({ label, id, type = 'text', value, onChange, error, placeholder }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{label}</label>
      <input
        id={id} type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--r-md)',
          border: `1.5px solid ${error ? '#EF4444' : 'var(--hairline)'}`,
          fontSize: 14,
          color: 'var(--ink)',
          background: error ? '#FEF2F2' : 'var(--paper)',
          outline: 'none',
          transition: 'border-color 150ms',
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = 'var(--indigo-400)'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#EF4444' : 'var(--hairline)'; }}
      />
      {error && <span style={{ fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icons.AlertCircle size={12} /> {error}
      </span>}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--warm-white)',
    }}>
      {/* Left panel */}
      <div style={{
        background: 'linear-gradient(150deg, #1E1B4B 0%, #4F46E5 60%, #7C3AED 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 48px',
        gap: 40,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'rgba(99,102,241,0.25)', top:-100, right:-100, filter:'blur(60px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(124,58,237,0.2)', bottom:-80, left:-60, filter:'blur(50px)', pointerEvents:'none' }} />

        <div className="fade-in" style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom: 24 }}>
            <div className="ll-logo-mark" style={{ width:52, height:52, borderRadius:16 }} />
          </div>
          <h1 style={{ color: 'white', fontSize: 36, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em' }}>
            LearnLens
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, margin: 0, maxWidth: 320, lineHeight: 1.6 }}>
            Adaptive study sessions that learn how you learn — and get better every time.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display:'flex', flexDirection:'column', gap:16, zIndex:1, width:'100%', maxWidth:320 }}>
          {[
            { icon: 'Eye',       color:'#7C3AED', label:'Visual mode', desc:'Diagrams & graphs' },
            { icon: 'Headphones',color:'#0EA5E9', label:'Auditory mode', desc:'Scenarios & verbal reasoning' },
            { icon: 'FileText',  color:'#10B981', label:'Read/Write mode', desc:'Definitions & analysis' },
            { icon: 'Zap',       color:'#F59E0B', label:'Kinesthetic mode', desc:'Calculations & experiments' },
          ].map(f => {
            const Ic = Icons[f.icon];
            return (
              <div key={f.label} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:'rgba(255,255,255,0.08)', borderRadius:12, backdropFilter:'blur(10px)' }}>
                <div style={{ width:36, height:36, borderRadius:10, background: f.color + '33', display:'flex', alignItems:'center', justifyContent:'center', color: f.color, flexShrink:0 }}>
                  <Ic size={18} />
                </div>
                <div>
                  <div style={{ color:'white', fontWeight:600, fontSize:13 }}>{f.label}</div>
                  <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'60px 48px' }}>
        <div style={{ width:'100%', maxWidth:400 }} className="fade-in">
          {/* Tab toggle */}
          <div style={{ display:'flex', gap:0, background:'var(--indigo-50)', borderRadius:'var(--r-pill)', padding:4, marginBottom:36 }}>
            {['login','signup'].map(t => (
              <button key={t} onClick={() => { setTab(t); setErrors({}); }}
                style={{
                  flex:1, padding:'10px 20px', borderRadius:'var(--r-pill)', border:0,
                  fontWeight:600, fontSize:14,
                  background: tab === t ? 'var(--paper)' : 'transparent',
                  color: tab === t ? 'var(--indigo-700)' : 'var(--ink-3)',
                  boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                  transition:'all 200ms',
                }}>
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.02em', margin:'0 0 6px' }}>
            {tab === 'login' ? 'Welcome back' : 'Get started'}
          </h2>
          <p style={{ color:'var(--ink-3)', fontSize:14, margin:'0 0 28px' }}>
            {tab === 'login' ? 'Sign in to continue your study journey' : 'Create your account — it takes 30 seconds'}
          </p>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {tab === 'signup' && (
              <Field label="Full name" id="name" value={form.name} onChange={set('name')}
                placeholder="Alex Johnson" error={errors.name} />
            )}
            <Field label="Email" id="email" type="email" value={form.email} onChange={set('email')}
              placeholder="you@example.com" error={errors.email} />
            <Field label="Password" id="password" type="password" value={form.password} onChange={set('password')}
              placeholder="Minimum 8 characters" error={errors.password} />

            {tab === 'login' && (
              <div style={{ fontSize:12, color:'var(--ink-3)', background:'var(--indigo-50)', borderRadius:'var(--r-sm)', padding:'10px 14px' }}>
                💡 Demo: any email/password works. Use <strong>admin@</strong> for admin access.
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ marginTop:4, padding:'14px', fontSize:15, justifyContent:'center' }}
              disabled={loading}>
              {loading
                ? <><Icons.RefreshCw size={16} style={{ animation:'spin 1s linear infinite' }} /> Checking…</>
                : tab === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:'var(--ink-3)' }}>
            {tab === 'login' ? 'No account? ' : 'Already have one? '}
            <button onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setErrors({}); }}
              style={{ color:'var(--indigo-600)', fontWeight:600, background:'none', border:0, cursor:'pointer', padding:0 }}>
              {tab === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="linear-gradient(150deg"] { display: none !important; }
        }
      `}</style>
    </div>
  );
};
