/* dashboard.jsx — Student dashboard */

window.DashboardPage = function DashboardPage() {
  const { user, sessions, profiles, navigate } = useApp();

  // ── Streak calculation ───────────────────────────────────────────────────
  const streak = React.useMemo(() => {
    const days = new Set(sessions.map(s => s.date.slice(0, 10)));
    let count = 0;
    let d = new Date();
    while (days.has(d.toISOString().slice(0, 10))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [sessions]);

  const totalSessions = sessions.length;
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length)
    : 0;

  const recentSessions = [...sessions].reverse().slice(0, 5);

  return (
    <div className="stage-pad fade-in">
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 className="h1" style={{ marginBottom:6 }}>
            Good {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color:'var(--ink-3)', margin:0, fontSize:15 }}>
            Ready to keep learning? Your adaptive engine is{' '}
            <strong style={{ color:'var(--indigo-600)' }}>
              {Object.values(profiles).some(p => p?.isLocked) ? 'locking in your style' : 'still learning you'}
            </strong>.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display:'flex', gap:12 }}>
          {[
            { label:'Day streak', value: streak || '—', icon:'Flame', color:'#F59E0B' },
            { label:'Sessions', value: totalSessions, icon:'Book', color:'var(--indigo-500)' },
            { label:'Avg score', value: totalSessions ? `${avgScore}%` : '—', icon:'TrendingUp', color:'#10B981' },
          ].map(stat => {
            const Ic = Icons[stat.icon];
            return (
              <div key={stat.label} className="card" style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:12, minWidth:120 }}>
                <div style={{ width:36, height:36, borderRadius:10, background: stat.color + '18', display:'flex', alignItems:'center', justifyContent:'center', color:stat.color }}>
                  <Ic size={18} />
                </div>
                <div>
                  <div style={{ fontSize:20, fontWeight:800, lineHeight:1, letterSpacing:'-0.03em' }}>{stat.value}</div>
                  <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:500, marginTop:2 }}>{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20, marginBottom:40 }}>
        {['physics','math','english'].map(subject => (
          <SubjectCard key={subject} subject={subject} />
        ))}
      </div>

      {/* Recent sessions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:24, alignItems:'start' }}>
        <RecentSessions sessions={recentSessions} />
        <ModeDistribution sessions={sessions} />
      </div>
    </div>
  );
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function SubjectCard({ subject }) {
  const { profiles, navigate } = useApp();
  const meta    = SUBJECT_META[subject];
  const profile = profiles[subject] || { sessionCount: 0, dominantMode: null, isLocked: false, modeScores: {} };
  const progress = Math.min(100, (profile.sessionCount / 20) * 100);

  return (
    <div className="card" style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{
          width:52, height:52, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
          background: meta.gradient, fontSize:24, flexShrink:0,
          boxShadow:'0 8px 20px -8px rgba(79,70,229,0.4)',
        }}>
          {meta.emoji}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:17, marginBottom:4 }}>{meta.label}</div>
          <StyleStatusBadge profile={profile} />
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--ink-3)', marginBottom:6 }}>
          <span>Style detection progress</span>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:600 }}>
            {profile.sessionCount}/20
          </span>
        </div>
        <div style={{ height:6, borderRadius:999, background:'var(--indigo-50)', overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:999,
            width:`${Math.min(100, progress)}%`,
            background: profile.isLocked
              ? 'linear-gradient(90deg,#4F46E5,#7C3AED)'
              : 'linear-gradient(90deg,var(--indigo-300),var(--indigo-500))',
            transition:'width 600ms ease',
          }} />
        </div>
      </div>

      {/* Mode score bars */}
      {Object.keys(profile.modeScores || {}).length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {Object.entries(profile.modeScores).map(([mode, score]) => {
            const meta2 = MODE_META[mode];
            const pct = Math.round(score * 100);
            return (
              <div key={mode} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:76, fontSize:11, color:'var(--ink-3)', fontWeight:500 }}>{meta2?.label}</span>
                <div style={{ flex:1, height:5, borderRadius:999, background:'var(--hairline)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:meta2?.color, borderRadius:999, transition:'width 600ms ease' }} />
                </div>
                <span style={{ width:32, fontSize:11, fontFamily:'JetBrains Mono,monospace', color:'var(--ink-2)', textAlign:'right' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <button
        className="btn btn-primary"
        style={{ width:'100%', justifyContent:'center' }}
        onClick={() => navigate('study', { subject })}>
        <Icons.Play size={15} /> Start Session
      </button>
    </div>
  );
}

function RecentSessions({ sessions }) {
  return (
    <div className="card" style={{ padding:24 }}>
      <h3 className="h3" style={{ marginBottom:18 }}>Recent Sessions</h3>
      {sessions.length === 0 && (
        <p style={{ color:'var(--ink-3)', fontSize:14 }}>No sessions yet — start studying to see your history here.</p>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {sessions.map((s, i) => (
          <div key={s.id || i} style={{
            display:'flex', alignItems:'center', gap:14,
            padding:'12px 14px', borderRadius:'var(--r-md)',
            background:'var(--warm-white)', border:'1px solid var(--hairline)',
          }}>
            <div style={{
              width:40, height:40, borderRadius:12, flexShrink:0,
              background: SUBJECT_META[s.subject]?.gradient || '#6366F1',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
            }}>
              {SUBJECT_META[s.subject]?.emoji}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{SUBJECT_META[s.subject]?.label}</div>
              <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>
                {new Date(s.date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
              </div>
            </div>
            <ModePill mode={s.mode} />
            <div style={{
              fontSize:15, fontWeight:800, fontFamily:'JetBrains Mono,monospace',
              color: s.score >= 80 ? '#10B981' : s.score >= 60 ? 'var(--indigo-600)' : '#EF4444',
            }}>
              {Math.round(s.score)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModeDistribution({ sessions }) {
  const counts = { visual:0, auditory:0, read_write:0, kinesthetic:0 };
  sessions.forEach(s => { if (counts[s.mode] !== undefined) counts[s.mode]++; });
  const total = sessions.length || 1;

  return (
    <div className="card" style={{ padding:24 }}>
      <h3 className="h3" style={{ marginBottom:18 }}>Mode Exposure</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {Object.entries(counts).map(([mode, count]) => {
          const meta = MODE_META[mode];
          const pct = Math.round((count / total) * 100);
          return (
            <div key={mode}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:600, color: meta.color }}>{meta.label}</span>
                <span style={{ fontSize:13, fontFamily:'JetBrains Mono,monospace', color:'var(--ink-2)' }}>{count} sessions</span>
              </div>
              <div style={{ height:8, borderRadius:999, background:'var(--hairline)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:meta.color, borderRadius:999, transition:'width 600ms ease' }} />
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ marginTop:20, fontSize:12, color:'var(--ink-3)', lineHeight:1.6 }}>
        After 20 sessions, the adaptive engine locks in the mode where you score highest.
      </p>
    </div>
  );
}
