/* admin.jsx — Admin panel */

window.AdminPage = function AdminPage() {
  const { user } = useApp();
  const [tab, setTab] = React.useState('questions');
  const [questions, setQuestions] = React.useState([...QUESTION_BANK]);
  const [search, setSearch] = React.useState('');
  const [filterSubject, setFilterSubject] = React.useState('all');
  const [filterMode, setFilterMode] = React.useState('all');
  const [showCreate, setShowCreate] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState(null);

  if (user?.role !== 'admin') {
    return (
      <div className="stage-pad" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:20, textAlign:'center' }}>
        <Icons.Lock size={48} style={{ color:'var(--ink-3)' }} />
        <h2 className="h2">Admin access required</h2>
        <p style={{ color:'var(--ink-3)' }}>Sign in with an admin account to access this panel.</p>
      </div>
    );
  }

  const filtered = questions.filter(q => {
    const matchSearch = search === '' || q.text.toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === 'all' || q.subject === filterSubject;
    const matchMode = filterMode === 'all' || q.mode === filterMode;
    return matchSearch && matchSubject && matchMode;
  });

  const addQuestion = (q) => {
    setQuestions(prev => [{ ...q, id:`custom-${Date.now()}` }, ...prev]);
    setShowCreate(false);
  };

  const deleteQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="stage-pad fade-in">
      <div style={{ marginBottom:28 }}>
        <h1 className="h1" style={{ marginBottom:6 }}>Admin Panel</h1>
        <p style={{ color:'var(--ink-3)', margin:0 }}>Manage the question bank and student learning profiles.</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, background:'var(--indigo-50)', padding:4, borderRadius:'var(--r-pill)', marginBottom:28, width:'fit-content' }}>
        {[
          { id:'questions', label:'Question Bank', icon:'Book' },
          { id:'students',  label:'Students',      icon:'User' },
        ].map(t => {
          const Ic = Icons[t.icon];
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'8px 20px', borderRadius:'var(--r-pill)', border:0, cursor:'pointer',
                fontWeight:600, fontSize:13,
                background: tab === t.id ? 'var(--paper)' : 'transparent',
                color: tab === t.id ? 'var(--indigo-700)' : 'var(--ink-3)',
                boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
              }}>
              <Ic size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Questions tab ───────────────────────────────────────────────── */}
      {tab === 'questions' && (
        <div>
          {/* Toolbar */}
          <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <Icons.Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-3)' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search questions…"
                style={{ width:'100%', padding:'10px 14px 10px 38px', borderRadius:'var(--r-pill)', border:'1px solid var(--hairline)', fontSize:14, outline:'none' }}
              />
            </div>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'var(--r-pill)', border:'1px solid var(--hairline)', fontSize:13, color:'var(--ink)', background:'var(--paper)', cursor:'pointer' }}>
              <option value="all">All subjects</option>
              {['physics','math','english'].map(s => <option key={s} value={s}>{SUBJECT_META[s].label}</option>)}
            </select>
            <select value={filterMode} onChange={e => setFilterMode(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'var(--r-pill)', border:'1px solid var(--hairline)', fontSize:13, color:'var(--ink)', background:'var(--paper)', cursor:'pointer' }}>
              <option value="all">All modes</option>
              {Object.entries(MODE_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button className="btn btn-primary" style={{ gap:8, whiteSpace:'nowrap' }} onClick={() => setShowCreate(true)}>
              <Icons.Plus size={16} /> New question
            </button>
          </div>

          {/* Count */}
          <div style={{ fontSize:13, color:'var(--ink-3)', marginBottom:14 }}>
            Showing {filtered.length} of {questions.length} questions
          </div>

          {/* Table */}
          <div className="card" style={{ overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--hairline)', background:'var(--warm-white)' }}>
                  {['Subject','Mode','Question','Difficulty',''].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, fontSize:12, color:'var(--ink-3)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 40).map((q, i) => (
                  <tr key={q.id} style={{ borderBottom:'1px solid var(--hairline)', background: i%2===0 ? 'var(--paper)' : 'var(--warm-white)', transition:'background 100ms' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--indigo-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = i%2===0 ? 'var(--paper)' : 'var(--warm-white)'}>
                    <td style={{ padding:'12px 16px', whiteSpace:'nowrap' }}>
                      <span style={{ fontSize:16 }}>{SUBJECT_META[q.subject]?.emoji}</span>
                      {' '}{SUBJECT_META[q.subject]?.label}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <ModePill mode={q.mode} />
                    </td>
                    <td style={{ padding:'12px 16px', maxWidth:320 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--ink)' }}>
                        {q.text}
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', whiteSpace:'nowrap' }}>
                      <span style={{
                        fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:999,
                        background: q.difficulty==='easy'?'#DCFCE7':q.difficulty==='hard'?'#FEE2E2':'#FEF9C3',
                        color: q.difficulty==='easy'?'#166534':q.difficulty==='hard'?'#991B1B':'#854D0E',
                      }}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <button onClick={() => setDeleteId(q.id)}
                        style={{ padding:'6px 10px', borderRadius:'var(--r-sm)', border:'1px solid var(--hairline)', background:'var(--paper)', color:'#EF4444', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12 }}>
                        <Icons.Trash size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding:'40px', textAlign:'center', color:'var(--ink-3)' }}>
                <Icons.Search size={32} style={{ opacity:0.3, marginBottom:12 }} />
                <p>No questions match your filters.</p>
              </div>
            )}
            {filtered.length > 40 && (
              <div style={{ padding:'12px 16px', textAlign:'center', fontSize:13, color:'var(--ink-3)', borderTop:'1px solid var(--hairline)' }}>
                Showing first 40. Use filters to narrow down.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Students tab ──────────────────────────────────────────────────── */}
      {tab === 'students' && <StudentsTab />}

      {/* ── Create question modal ──────────────────────────────────────────── */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onAdd={addQuestion} />
      )}

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }} onClick={() => setDeleteId(null)}>
          <div className="card fade-in" style={{ padding:32, maxWidth:380, width:'100%', margin:20 }} onClick={e => e.stopPropagation()}>
            <h3 className="h3" style={{ marginBottom:12 }}>Delete question?</h3>
            <p style={{ color:'var(--ink-3)', fontSize:14, marginBottom:24 }}>This action cannot be undone. The question will be permanently removed from the bank.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn" style={{ flex:1, background:'#EF4444', color:'white', justifyContent:'center' }} onClick={() => deleteQuestion(deleteId)}>
                <Icons.Trash size={15} /> Delete
              </button>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }} onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function StudentsTab() {
  const { sessions, profiles } = useApp();
  // Demo student list derived from sessions
  const demoStudents = [
    { id: 's1', name: 'Alex Johnson',  email: 'alex@example.com',  role:'student' },
    { id: 's2', name: 'Jamie Liu',     email: 'jamie@example.com', role:'student' },
    { id: 's3', name: 'Priya Sharma',  email: 'priya@example.com', role:'student' },
  ];

  return (
    <div>
      <div className="card" style={{ overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--hairline)', background:'var(--warm-white)' }}>
              {['Student','Physics','Math','English','Actions'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, fontSize:12, color:'var(--ink-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {demoStudents.map((student, i) => (
              <tr key={student.id} style={{ borderBottom:'1px solid var(--hairline)', background: i%2===0?'var(--paper)':'var(--warm-white)' }}>
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar name={student.name} />
                    <div>
                      <div style={{ fontWeight:600 }}>{student.name}</div>
                      <div style={{ fontSize:11, color:'var(--ink-3)' }}>{student.email}</div>
                    </div>
                  </div>
                </td>
                {['physics','math','english'].map(subj => {
                  const p = profiles[subj];
                  return (
                    <td key={subj} style={{ padding:'14px 16px' }}>
                      <StyleStatusBadge profile={p ? { ...p, sessionCount: Math.min(p.sessionCount, 22) } : null} />
                    </td>
                  );
                })}
                <td style={{ padding:'14px 16px' }}>
                  <button className="btn btn-ghost" style={{ padding:'6px 14px', fontSize:12 }}>
                    <Icons.Edit size={13} /> Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop:16, fontSize:12, color:'var(--ink-3)' }}>
        In the full implementation, this table is populated from the /api/admin/students endpoint.
      </p>
    </div>
  );
}

function CreateModal({ onClose, onAdd }) {
  const [form, setForm] = React.useState({
    subject: 'physics',
    mode: 'visual',
    difficulty: 'medium',
    text: '',
    options: ['','','',''],
    correct: '',
    explanation: '',
  });
  const [error, setError] = React.useState('');

  const setOpt = (i, val) => setForm(f => {
    const opts = [...f.options]; opts[i] = val;
    return { ...f, options: opts };
  });

  const submit = () => {
    if (!form.text.trim()) return setError('Question text is required');
    if (form.options.some(o => !o.trim())) return setError('All 4 answer options are required');
    if (!form.correct.trim()) return setError('Please enter the correct answer');
    if (!form.options.includes(form.correct)) return setError('Correct answer must match one of the options exactly');
    if (!form.explanation.trim()) return setError('Explanation is required');
    setError('');
    onAdd({ ...form, options: form.options });
  };

  const inputStyle = { padding:'10px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--hairline)', fontSize:14, width:'100%', fontFamily:'inherit' };
  const labelStyle = { fontSize:12, fontWeight:600, color:'var(--ink-2)', marginBottom:6, display:'block' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(30,27,75,0.45)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:200, overflowY:'auto', padding:'40px 20px' }} onClick={onClose}>
      <div className="card fade-in" style={{ padding:32, maxWidth:560, width:'100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 className="h3">Create question</h3>
          <button onClick={onClose} style={{ background:'none', border:0, cursor:'pointer', color:'var(--ink-3)' }}>
            <Icons.X size={20} />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Subject / Mode / Difficulty */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              { label:'Subject', key:'subject', opts:['physics','math','english'].map(s=>({ v:s, l:SUBJECT_META[s].label })) },
              { label:'Mode',    key:'mode',    opts:Object.entries(MODE_META).map(([k,v])=>({ v:k, l:v.label })) },
              { label:'Difficulty', key:'difficulty', opts:['easy','medium','hard'].map(d=>({ v:d, l:d })) },
            ].map(({ label, key, opts }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ ...inputStyle, cursor:'pointer' }}>
                  {opts.map(o => <option key={o.v} value={o.v} style={{ textTransform:'capitalize' }}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Question text */}
          <div>
            <label style={labelStyle}>Question text</label>
            <textarea value={form.text} onChange={e => setForm(f=>({...f,text:e.target.value}))} rows={3}
              placeholder="Write the full question here…"
              style={{ ...inputStyle, resize:'vertical', lineHeight:1.5 }} />
          </div>

          {/* Options */}
          <div>
            <label style={labelStyle}>Answer options (A–D)</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {form.options.map((opt, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:'var(--indigo-50)', color:'var(--indigo-600)', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'JetBrains Mono,monospace' }}>
                    {String.fromCharCode(65+i)}
                  </div>
                  <input value={opt} onChange={e => setOpt(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65+i)}`} style={{ ...inputStyle, margin:0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Correct answer */}
          <div>
            <label style={labelStyle}>Correct answer (must match an option exactly)</label>
            <input value={form.correct} onChange={e => setForm(f=>({...f,correct:e.target.value}))}
              placeholder="Paste the correct option text here"
              style={inputStyle} />
          </div>

          {/* Explanation */}
          <div>
            <label style={labelStyle}>Explanation</label>
            <textarea value={form.explanation} onChange={e => setForm(f=>({...f,explanation:e.target.value}))} rows={2}
              placeholder="Brief explanation shown after the answer is revealed…"
              style={{ ...inputStyle, resize:'vertical', lineHeight:1.5 }} />
          </div>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#EF4444', fontSize:13, background:'#FEF2F2', padding:'10px 14px', borderRadius:'var(--r-sm)' }}>
              <Icons.AlertCircle size={14} /> {error}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={submit}>
              <Icons.Plus size={15} /> Add question
            </button>
            <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
