/* study.jsx — Active study session */

window.StudyPage = function StudyPage() {
  const { studySubject, getNextMode, getQuestions, completeSession, navigate } = useApp();

  const [phase, setPhase]         = React.useState('intro');   // intro | question | summary
  const [mode, setMode]           = React.useState(null);
  const [questions, setQuestions] = React.useState([]);
  const [qIndex, setQIndex]       = React.useState(0);
  const [answers, setAnswers]     = React.useState([]);        // per-question results
  const [selected, setSelected]   = React.useState(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const [confidence, setConfidence] = React.useState(3);
  const [startTime, setStartTime] = React.useState(null);

  const startSession = () => {
    const m  = getNextMode(studySubject);
    const qs = getQuestions(studySubject, m, 10);
    setMode(m);
    setQuestions(qs);
    setQIndex(0);
    setAnswers([]);
    setSelected(null);
    setConfirmed(false);
    setConfidence(3);
    setStartTime(Date.now());
    setPhase('question');
  };

  const confirmAnswer = () => {
    if (!selected) return;
    setConfirmed(true);
  };

  const nextQuestion = () => {
    const q = questions[qIndex];
    const isCorrect = selected === q.correct;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const newAnswers = [...answers, { questionId: q.id, selected, isCorrect, timeSpentSeconds: timeSpent, confidenceRating: confidence }];
    setAnswers(newAnswers);

    if (qIndex + 1 >= questions.length) {
      // End of session
      const score = Math.round((newAnswers.filter(a => a.isCorrect).length / newAnswers.length) * 100);
      const avgConf = newAnswers.reduce((s, a) => s + a.confidenceRating, 0) / newAnswers.length;
      const revisitCount = 0; // simplified
      completeSession({
        id: `session-${Date.now()}`,
        subject: studySubject,
        mode,
        score,
        avgConfidence: avgConf,
        revisitCount,
        answers: newAnswers,
      });
      setAnswers(newAnswers);
      setPhase('summary');
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
      setConfirmed(false);
      setConfidence(3);
      setStartTime(Date.now());
    }
  };

  const meta = SUBJECT_META[studySubject];

  // ── Intro ──────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="stage-pad fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh' }}>
        <div className="card" style={{ maxWidth:480, width:'100%', padding:40, textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>{meta.emoji}</div>
          <h2 className="h2" style={{ marginBottom:8 }}>{meta.label}</h2>
          <p style={{ color:'var(--ink-3)', marginBottom:24, lineHeight:1.6 }}>
            The adaptive engine will assign your learning mode for this session based on your history.
            You'll answer 10 questions and rate your confidence after each one.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:28, flexWrap:'wrap' }}>
            {['visual','auditory','read_write','kinesthetic'].map(m => (
              <ModePill key={m} mode={m} />
            ))}
          </div>
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px' }} onClick={startSession}>
            <Icons.Play size={16} /> Begin Session
          </button>
          <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginTop:10 }} onClick={() => navigate('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Summary ────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const score = Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100);
    return (
      <div className="stage-pad fade-in" style={{ maxWidth:640, margin:'0 auto' }}>
        <div className="card" style={{ padding:40 }}>
          {/* Score ring */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <ScoreRing score={score} />
            <div style={{ fontSize:14, color:'var(--ink-3)', marginTop:8 }}>
              {answers.filter(a => a.isCorrect).length}/{answers.length} correct
            </div>
            <div style={{ marginTop:12 }}>
              <ModePill mode={mode} size="lg" />
            </div>
          </div>

          {/* Per-question breakdown */}
          <h3 className="h3" style={{ marginBottom:16 }}>Question breakdown</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:28 }}>
            {questions.map((q, i) => {
              const ans = answers[i];
              if (!ans) return null;
              return (
                <div key={q.id} style={{
                  display:'flex', alignItems:'flex-start', gap:12,
                  padding:'12px 14px', borderRadius:'var(--r-md)',
                  background: ans.isCorrect ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${ans.isCorrect ? '#BBF7D0' : '#FECACA'}`,
                }}>
                  <div style={{ flexShrink:0, marginTop:2 }}>
                    {ans.isCorrect
                      ? <div style={{ width:20,height:20,borderRadius:'50%',background:'#10B981',display:'flex',alignItems:'center',justifyContent:'center' }}><Icons.Check size={12} style={{ color:'white' }} /></div>
                      : <div style={{ width:20,height:20,borderRadius:'50%',background:'#EF4444',display:'flex',alignItems:'center',justifyContent:'center' }}><Icons.X size={12} style={{ color:'white' }} /></div>
                    }
                  </div>
                  <div style={{ flex:1, fontSize:13 }}>
                    <div style={{ fontWeight:600, marginBottom:4, lineHeight:1.4 }}>{q.text.slice(0,80)}{q.text.length>80?'…':''}</div>
                    {!ans.isCorrect && (
                      <div style={{ color:'#6B7280' }}>Correct: <strong>{q.correct}</strong></div>
                    )}
                    <div style={{ color:'#6B7280', marginTop:2 }}>Confidence: {'★'.repeat(ans.confidenceRating)}{'☆'.repeat(5-ans.confidenceRating)} · {ans.timeSpentSeconds}s</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display:'flex', gap:12 }}>
            <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={startSession}>
              <Icons.RefreshCw size={15} /> Another session
            </button>
            <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }} onClick={() => navigate('dashboard')}>
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active question ────────────────────────────────────────────────────
  const q = questions[qIndex];
  if (!q) return null;
  const modeMeta = MODE_META[mode];

  return (
    <div className="stage-pad fade-in" style={{ maxWidth:700, margin:'0 auto' }}>
      {/* Session header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>{meta.emoji}</span>
          <span style={{ fontWeight:700 }}>{meta.label}</span>
          <ModePill mode={mode} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--ink-3)' }}>
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:'var(--indigo-600)' }}>
            {qIndex + 1}
          </span>
          <span>/ {questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:4, borderRadius:999, background:'var(--hairline)', marginBottom:28, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${((qIndex) / questions.length) * 100}%`, background:'linear-gradient(90deg,var(--indigo-400),var(--indigo-600))', borderRadius:999, transition:'width 400ms ease' }} />
      </div>

      {/* Question card */}
      <div className="card" style={{ padding:32, marginBottom:20 }} key={q.id}>
        {/* Mode hint */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, padding:'10px 14px', background:modeMeta?.bg, borderRadius:'var(--r-md)' }}>
          <span style={{ fontSize:13, fontWeight:600, color:modeMeta?.color }}>
            {mode === 'visual' && '📊 Read the diagram or graph described below'}
            {mode === 'auditory' && '🔊 Imagine hearing this scenario explained aloud'}
            {mode === 'read_write' && '📝 Refer to the definition or text extract'}
            {mode === 'kinesthetic' && '🧪 Work through the calculation step by step'}
          </span>
        </div>

        <p style={{ fontSize:17, fontWeight:600, lineHeight:1.6, marginBottom:28, color:'var(--ink)' }}>
          {q.text}
        </p>

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {q.options.map(opt => {
            const isSelected = selected === opt;
            const isCorrect  = confirmed && opt === q.correct;
            const isWrong    = confirmed && isSelected && opt !== q.correct;
            return (
              <button key={opt}
                onClick={() => { if (!confirmed) setSelected(opt); }}
                style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'14px 18px', borderRadius:'var(--r-md)', border:'1.5px solid',
                  textAlign:'left', background:'var(--paper)', cursor: confirmed ? 'default' : 'pointer',
                  fontWeight:500, fontSize:15, transition:'all 160ms',
                  borderColor: isCorrect ? '#10B981' : isWrong ? '#EF4444' : isSelected ? 'var(--indigo-400)' : 'var(--hairline)',
                  background: isCorrect ? '#F0FDF4' : isWrong ? '#FEF2F2' : isSelected ? 'var(--indigo-50)' : 'var(--paper)',
                  color: isCorrect ? '#065F46' : isWrong ? '#991B1B' : isSelected ? 'var(--indigo-800)' : 'var(--ink)',
                }}>
                <div style={{
                  width:28, height:28, borderRadius:8, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: isCorrect ? '#10B981' : isWrong ? '#EF4444' : isSelected ? 'var(--indigo-500)' : 'var(--indigo-50)',
                  color: isCorrect || isWrong || isSelected ? 'white' : 'var(--indigo-400)',
                  fontWeight:700, fontSize:12, fontFamily:'JetBrains Mono,monospace',
                }}>
                  {isCorrect ? <Icons.Check size={14} /> : isWrong ? <Icons.X size={14} /> : opt.slice(0,1).toUpperCase()}
                </div>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {confirmed && (
          <div style={{ marginTop:20, padding:'16px 18px', borderRadius:'var(--r-md)', background:'var(--indigo-50)', border:'1px solid var(--indigo-100)' }} className="fade-in">
            <div style={{ fontSize:13, fontWeight:700, color:'var(--indigo-700)', marginBottom:6 }}>Explanation</div>
            <p style={{ margin:0, fontSize:14, color:'var(--ink-2)', lineHeight:1.6 }}>{q.explanation}</p>
          </div>
        )}
      </div>

      {/* Confidence slider */}
      {confirmed && (
        <div className="card fade-in" style={{ padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:14, fontWeight:600 }}>How confident did you feel?</span>
            <span style={{ fontSize:18 }}>{'★'.repeat(confidence)}{'☆'.repeat(5-confidence)}</span>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            {[1,2,3,4,5].map(v => (
              <button key={v} onClick={() => setConfidence(v)}
                style={{
                  flex:1, padding:'10px 0', borderRadius:'var(--r-sm)', border:'1.5px solid',
                  fontWeight:700, fontSize:14, cursor:'pointer',
                  borderColor: confidence === v ? 'var(--indigo-500)' : 'var(--hairline)',
                  background: confidence === v ? 'var(--indigo-600)' : 'var(--paper)',
                  color: confidence === v ? 'white' : 'var(--ink-2)',
                  transition:'all 150ms',
                }}>
                {v}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--ink-3)', marginTop:6 }}>
            <span>Not confident</span><span>Very confident</span>
          </div>
        </div>
      )}

      {/* Action button */}
      {!confirmed
        ? <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px', opacity: selected ? 1 : 0.5 }} onClick={confirmAnswer} disabled={!selected}>
            Check Answer
          </button>
        : <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px' }} onClick={nextQuestion}>
            {qIndex + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
          </button>
      }
    </div>
  );
};

function ScoreRing({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#4F46E5' : '#EF4444';
  return (
    <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx={65} cy={65} r={r} fill="none" stroke="var(--hairline)" strokeWidth={10} />
        <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 65 65)"
          style={{ transition:'stroke-dashoffset 800ms ease' }} />
        <text x={65} y={70} textAnchor="middle" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={800} fontSize={28} fill={color}>{score}</text>
        <text x={65} y={86} textAnchor="middle" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={500} fontSize={12} fill="#8783A8">/ 100</text>
      </svg>
      <div style={{ fontSize:16, fontWeight:700, color }}>
        {score >= 80 ? '🎉 Excellent!' : score >= 60 ? '👍 Good job' : '💪 Keep practising'}
      </div>
    </div>
  );
}
