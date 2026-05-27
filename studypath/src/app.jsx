/* app.jsx — Root application component and demo shell router */

function DemoNav({ page, navigate, user, logout }) {
  const navItems = [
    { id:'dashboard', label:'Dashboard',  num:1, icon:'Home',     show: !!user },
    { id:'study',     label:'Study',      num:2, icon:'Book',     show: !!user },
    { id:'analytics', label:'Analytics',  num:3, icon:'BarChart', show: !!user },
    { id:'admin',     label:'Admin',      num:4, icon:'Settings', show: !!user && user.role==='admin' },
  ].filter(i => i.show);

  return (
    <nav className="demo-nav">
      <div className="demo-nav-brand">
        <div className="ll-logo-mark" />
        <span style={{ fontWeight:700, fontSize:16, letterSpacing:'-0.01em' }}>LearnLens</span>
      </div>

      {user && (
        <>
          <div className="demo-nav-label">Navigation</div>
          {navItems.map(item => {
            const Ic = Icons[item.icon];
            return (
              <button key={item.id} className={`demo-nav-item ${page === item.id ? 'is-active' : ''}`}
                onClick={() => navigate(item.id)}>
                <Ic size={17} />
                {item.label}
                <span className="demo-nav-num" style={{ marginLeft:'auto' }}>{item.num}</span>
              </button>
            );
          })}
        </>
      )}

      {user && (
        <div className="demo-footer">
          <div style={{ marginBottom:10 }}>
            <div style={{ fontWeight:600, fontSize:12, color:'var(--ink-2)' }}>{user.name}</div>
            <div style={{ fontSize:11 }}>{user.email}</div>
            {user.role === 'admin' && (
              <span style={{ display:'inline-block', marginTop:4, fontSize:10, fontWeight:700, padding:'2px 8px', background:'var(--indigo-100)', color:'var(--indigo-700)', borderRadius:999 }}>ADMIN</span>
            )}
          </div>
          <button onClick={logout}
            style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid var(--hairline)', borderRadius:'var(--r-sm)', padding:'7px 10px', cursor:'pointer', color:'var(--ink-3)', fontSize:12, width:'100%' }}>
            <Icons.LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </nav>
  );
}

function AppNav({ page, navigate, user, logout }) {
  if (!user) return null;
  const navItems = [
    { id:'dashboard', label:'Dashboard' },
    { id:'study',     label:'Study' },
    { id:'analytics', label:'Analytics' },
    ...(user.role === 'admin' ? [{ id:'admin', label:'Admin' }] : []),
  ];

  return (
    <div className="app-nav">
      <div className="ll-logo">
        <div className="ll-logo-mark" />
        LearnLens
      </div>
      <div className="nav-links">
        {navItems.map(item => (
          <button key={item.id} className={`nav-link ${page === item.id ? 'is-active' : ''}`}
            onClick={() => navigate(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <Avatar name={user.name} />
        <button onClick={logout} style={{ background:'none', border:0, cursor:'pointer', color:'var(--ink-3)', display:'flex', alignItems:'center', gap:4, fontSize:13 }}>
          <Icons.LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, page, navigate, logout } = useApp();

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'study':     return <StudyPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'admin':     return <AdminPage />;
      default:          return <DashboardPage />;
    }
  };

  return (
    <div className="demo-shell">
      <DemoNav page={page} navigate={navigate} user={user} logout={logout} />
      <div className="demo-stage">
        <AppNav page={page} navigate={navigate} user={user} logout={logout} />
        {renderPage()}
      </div>
    </div>
  );
}

// ── Mount ─────────────────────────────────────────────────────────────────────
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <AppProvider>
    <AppShell />
  </AppProvider>
);
