/* analytics.jsx — Analytics page with pure SVG charts */

window.AnalyticsPage = function AnalyticsPage() {
  const { sessions } = useApp();
  const [subject, setSubject] = React.useState('all');

  const filtered = subject === 'all' ? sessions : sessions.filter(s => s.subject === subject);

  // ── Aggregated data ──────────────────────────────────────────────────────
  const scoreByMode = React.useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      if (!map[s.mode]) map[s.mode] = [];
      map[s.mode].push(s.score);
    });
    return Object.fromEntries(Object.entries(map).map(([m, arr]) => [m, Math.round(arr.reduce((a,b)=>a+b,0)/arr.length)]));
  }, [filtered]);

  const scoreOverTime = React.useMemo(() => {
    return [...filtered]
      .sort((a,b) => new Date(a.date) - new Date(b.date))
      .slice(-20)
      .map((s, i) => ({ i, score: s.score, mode: s.mode, date: s.date }));
  }, [filtered]);

  const confidenceTrend = React.useMemo(() => {
    return [...filtered]
      .sort((a,b) => new Date(a.date) - new Date(b.date))
      .slice(-20)
      .map((s, i) => ({ i, val: s.avgConfidence }));
  }, [filtered]);

  const avgTimeByMode = React.useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      if (!s.answers) return;
      const avg = s.answers.reduce((a,b) => a + (b.timeSpentSeconds||30), 0) / s.answers.length;
      if (!map[s.mode]) map[s.mode] = [];
      map[s.mode].push(avg);
    });
    return Object.fromEntries(Object.entries(map).map(([m, arr]) => [m, Math.round(arr.reduce((a,b)=>a+b,0)/arr.length)]));
  }, [filtered]);

  const totalSessions = filtered.length;
  const avgScore = totalSessions ? Math.round(filtered.reduce((a,s) => a+s.score,0)/totalSessions) : 0;
  const avgConf  = totalSessions ? (filtered.reduce((a,s) => a+(s.avgConfidence||3),0)/totalSessions).toFixed(1) : '-';

  return (
    <div className="stage-pad fade-in">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 className="h1" style={{ marginBottom:6 }}>Analytics</h1>
          <p style={{ color:'var(--ink-3)', margin:0 }}>Track your performance across subjects and learning modes.</p>
        </div>
        {/* Subject filter */}
        <div style={{ display:'flex', gap:6, background:'var(--indigo-50)', padding:4, borderRadius:'var(--r-pill)' }}>
          {['all','physics','math','english'].map(s => (
            <button key={s} onClick={() => setSubject(s)}
              style={{
                padding:'8px 16px', borderRadius:'var(--r-pill)', border:0, cursor:'pointer',
                fontWeight:600, fontSize:13,
                background: subject === s ? 'var(--paper)' : 'transparent',
                color: subject === s ? 'var(--indigo-700)' : 'var(--ink-3)',
                boxShadow: subject === s ? 'var(--shadow-sm)' : 'none',
                textTransform:'capitalize',
              }}>
              {s === 'all' ? 'All subjects' : SUBJECT_META[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:32 }}>
        {[
          { label:'Sessions', value: totalSessions, icon:'Book', color:'var(--indigo-500)' },
          { label:'Avg Score', value: totalSessions ? `${avgScore}%` : '—', icon:'TrendingUp', color:'#10B981' },
          { label:'Avg Confidence', value: `${avgConf}/5`, icon:'Star', color:'#F59E0B' },
          { label:'Best Mode', value: Object.entries(scoreByMode).sort((a,b)=>b[1]-a[1])[0]?.[0] ? MODE_META[Object.entries(scoreByMode).sort((a,b)=>b[1]-a[1])[0][0]]?.label : '—', icon:'Award', color:'#7C3AED' },
        ].map(kpi => {
          const Ic = Icons[kpi.icon];
          return (
            <div key={kpi.label} className="card" style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40,height:40,borderRadius:12,background:kpi.color+'18',display:'flex',alignItems:'center',justifyContent:'center',color:kpi.color,flexShrink:0 }}>
                <Ic size={20} />
              </div>
              <div>
                <div style={{ fontSize:22,fontWeight:800,letterSpacing:'-0.03em',lineHeight:1 }}>{kpi.value}</div>
                <div style={{ fontSize:11,color:'var(--ink-3)',fontWeight:500,marginTop:3 }}>{kpi.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <ChartCard title="Score over time" subtitle="Last 20 sessions">
          <LineChart data={scoreOverTime} yKey="score" yMax={100} yLabel="Score %" colorKey="mode" />
        </ChartCard>
        <ChartCard title="Confidence trend" subtitle="Avg confidence rating (1–5)">
          <LineChart data={confidenceTrend} yKey="val" yMax={5} yLabel="Confidence" color="#F59E0B" />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <ChartCard title="Avg score by mode" subtitle="Higher is better">
          <BarChart data={scoreByMode} max={100} suffix="%" />
        </ChartCard>
        <ChartCard title="Avg time per question" subtitle="Seconds per question by mode">
          <BarChart data={avgTimeByMode} max={60} suffix="s" />
        </ChartCard>
      </div>

      {totalSessions === 0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--ink-3)' }}>
          <Icons.BarChart size={48} style={{ opacity:0.3, marginBottom:16 }} />
          <p>No sessions yet for this filter. Start studying to see your analytics!</p>
        </div>
      )}
    </div>
  );
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card" style={{ padding:24 }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:15 }}>{title}</div>
        <div style={{ fontSize:12, color:'var(--ink-3)' }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function LineChart({ data, yKey, yMax, yLabel, color, colorKey }) {
  const W = 480, H = 180, PAD = { top:10, right:10, bottom:30, left:40 };
  const IW = W - PAD.left - PAD.right;
  const IH = H - PAD.top  - PAD.bottom;

  if (!data || data.length < 2) {
    return <div style={{ height:H, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-3)', fontSize:13 }}>Not enough data</div>;
  }

  const xs = data.map((_, i) => PAD.left + (i / (data.length - 1)) * IW);
  const ys = data.map(d => PAD.top + IH - (Math.min(d[yKey], yMax) / yMax) * IH);

  const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const areaPoints = `${xs[0]},${PAD.top + IH} ${points} ${xs[xs.length-1]},${PAD.top + IH}`;

  const getColor = (d) => {
    if (color) return color;
    return MODE_META[d[colorKey]]?.color || '#6366F1';
  };

  const yGrids = [0, 25, 50, 75, 100].filter(v => v <= yMax);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', overflow:'visible' }}>
      {/* Grid lines */}
      {yGrids.map(v => {
        const y = PAD.top + IH - (v / yMax) * IH;
        return (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--hairline)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#8783A8">{v}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <defs>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color || '#6366F1'} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color || '#6366F1'} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#areaGrad)" />

      {/* Line */}
      <polyline points={points} fill="none" stroke={color || '#6366F1'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {data.map((d, i) => (
        <circle key={i} cx={xs[i]} cy={ys[i]} r={4} fill={getColor(d)} stroke="white" strokeWidth={2} />
      ))}

      {/* X-axis */}
      <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + IH} y2={PAD.top + IH} stroke="var(--hairline)" strokeWidth={1} />
    </svg>
  );
}

function BarChart({ data, max, suffix = '' }) {
  const H = 180, barH = 28, gap = 12;
  const modes = ['visual','auditory','read_write','kinesthetic'];
  const entries = modes.map(m => ({ mode: m, val: data[m] || 0 }));
  const totalH = entries.length * (barH + gap);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:gap }}>
      {entries.map(({ mode, val }) => {
        const meta = MODE_META[mode];
        const pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
        return (
          <div key={mode}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
              <span style={{ fontWeight:600, color:meta.color }}>{meta.label}</span>
              <span style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--ink-2)', fontWeight:600 }}>{val > 0 ? `${val}${suffix}` : '—'}</span>
            </div>
            <div style={{ height:barH, borderRadius:8, background:'var(--hairline)', overflow:'hidden', position:'relative' }}>
              <div style={{
                position:'absolute', left:0, top:0, bottom:0,
                width:`${pct}%`,
                background:meta.color,
                borderRadius:8,
                transition:'width 700ms cubic-bezier(.4,0,.2,1)',
                opacity: val > 0 ? 1 : 0.2,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
