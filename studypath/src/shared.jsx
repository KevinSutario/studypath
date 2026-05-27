/* shared.jsx — Global state, data store, and shared utilities */

// ─── Colour map ─────────────────────────────────────────────────────────────
window.MODE_META = {
  visual:     { label: 'Visual',       color: '#7C3AED', bg: '#F3EBFF', cls: 'visual',    icon: 'Eye' },
  auditory:   { label: 'Auditory',     color: '#0EA5E9', bg: '#E0F4FE', cls: 'auditory',  icon: 'Headphones' },
  read_write: { label: 'Read / Write', color: '#10B981', bg: '#DEFAEC', cls: 'readwrite', icon: 'FileText' },
  kinesthetic:{ label: 'Kinesthetic',  color: '#F59E0B', bg: '#FFF2D6', cls: 'kines',     icon: 'Zap' },
};

window.SUBJECT_META = {
  physics: { label: 'Physics', emoji: '⚡', gradient: 'linear-gradient(135deg,#4F46E5,#7C3AED)' },
  math:    { label: 'Math',    emoji: '∑',  gradient: 'linear-gradient(135deg,#0EA5E9,#6366F1)' },
  english: { label: 'English', emoji: '✍️', gradient: 'linear-gradient(135deg,#10B981,#0EA5E9)' },
};

// ─── Seed question bank (30 questions: 3 subjects × 4 modes × ~2-3 each) ────
const Q = (subject, mode, text, options, correct, explanation, difficulty='medium') => ({
  id: `${subject}-${mode}-${Math.random().toString(36).slice(2,7)}`,
  subject, mode, text, options, correct, explanation, difficulty,
});

window.QUESTION_BANK = [
  // ── PHYSICS ─────────────────────────────────────────────────────────────
  // visual
  Q('physics','visual',
    'A velocity-time graph shows a horizontal line at 8 m/s for 5 seconds. What is the acceleration?',
    ['0 m/s²','1.6 m/s²','8 m/s²','40 m/s²'], '0 m/s²',
    'A horizontal line means constant velocity — no change — so acceleration = 0 m/s².'),
  Q('physics','visual',
    'A force-extension graph has a gradient of 50 N/m. What force produces a 0.3 m extension?',
    ['0.006 N','15 N','50.3 N','150 N'], '15 N',
    'F = kx = 50 × 0.3 = 15 N (Hooke\'s Law).'),
  Q('physics','visual',
    'A wave diagram shows 3 complete cycles in 6 m. What is the wavelength?',
    ['0.5 m','2 m','3 m','18 m'], '2 m',
    'Wavelength = total distance ÷ number of cycles = 6 ÷ 3 = 2 m.'),

  // auditory
  Q('physics','auditory',
    'You clap your hands and hear an echo 0.4 seconds later. The speed of sound is 340 m/s. How far away is the wall?',
    ['34 m','68 m','136 m','170 m'], '68 m',
    'Sound travels to the wall and back: total distance = 340 × 0.4 = 136 m, so the wall is 68 m away.'),
  Q('physics','auditory',
    'A car horn sounds higher as the car approaches you. What phenomenon causes this?',
    ['Reflection','Refraction','Doppler Effect','Interference'], 'Doppler Effect',
    'The Doppler Effect describes the change in observed frequency when the source is moving relative to the observer.'),
  Q('physics','auditory',
    'You push a 10 kg crate with 50 N; friction opposes with 20 N. What is the acceleration?',
    ['2 m/s²','3 m/s²','5 m/s²','7 m/s²'], '3 m/s²',
    'Net force = 50 − 20 = 30 N. a = F/m = 30/10 = 3 m/s².'),

  // read_write
  Q('physics','read_write',
    'Newton\'s First Law states that an object remains at rest or in uniform motion unless acted upon by an external force. What is this property called?',
    ['Momentum','Inertia','Gravity','Friction'], 'Inertia',
    'The tendency of an object to resist changes to its state of motion is called inertia.'),
  Q('physics','read_write',
    'Define work done. A force of 40 N moves an object 5 m in the direction of the force. Calculate the work done.',
    ['8 J','45 J','200 J','2000 J'], '200 J',
    'Work = Force × Distance = 40 × 5 = 200 J.'),
  Q('physics','read_write',
    'The principle of conservation of energy states that energy cannot be created or destroyed. When a car brakes to a halt, the kinetic energy is primarily converted into:',
    ['Sound energy only','Light energy','Thermal (heat) energy','Potential energy'], 'Thermal (heat) energy',
    'Friction in the brake pads converts kinetic energy into thermal energy.'),

  // kinesthetic
  Q('physics','kinesthetic',
    'A 5 kg mass accelerates from 2 m/s to 8 m/s in 3 seconds. Calculate the net force.',
    ['2 N','5 N','10 N','30 N'], '10 N',
    'a = (8−2)/3 = 2 m/s². F = ma = 5 × 2 = 10 N.'),
  Q('physics','kinesthetic',
    'A wave has frequency 50 Hz and wavelength 3 m. Calculate its wave speed.',
    ['17 m/s','53 m/s','150 m/s','1500 m/s'], '150 m/s',
    'v = fλ = 50 × 3 = 150 m/s.'),
  Q('physics','kinesthetic',
    'You lift a 20 kg box 1.5 m in 3 seconds. Calculate your power output. (g = 10 m/s²)',
    ['10 W','33 W','100 W','300 W'], '100 W',
    'Work = mgh = 20 × 10 × 1.5 = 300 J. Power = Work/time = 300/3 = 100 W.'),

  // ── MATH ────────────────────────────────────────────────────────────────
  // visual
  Q('math','visual',
    'A graph shows y = x². At which x-values does it intersect the line y = 4?',
    ['x = 2 only','x = ±2','x = ±4','x = 4 only'], 'x = ±2',
    'Set x² = 4 → x = ±2. Both are on the parabola.'),
  Q('math','visual',
    'A Venn diagram has: A only = 5, A∩B = 3, B only = 4, neither = 8. If total = 20, find P(A∪B).',
    ['0.4','0.5','0.6','0.7'], '0.6',
    'A∪B = 5 + 3 + 4 = 12. P(A∪B) = 12/20 = 0.6.'),
  Q('math','visual',
    'A right triangle has legs 6 and 8. What is the hypotenuse?',
    ['7','10','12','14'], '10',
    'By the Pythagorean theorem: √(6² + 8²) = √(36 + 64) = √100 = 10.'),

  // auditory
  Q('math','auditory',
    'If I triple x and add 4, I get 19. What is x?',
    ['3','5','6','7'], '5',
    '3x + 4 = 19 → 3x = 15 → x = 5.'),
  Q('math','auditory',
    'The sum of three consecutive integers is 48. What are they?',
    ['14, 15, 16','15, 16, 17','16, 17, 18','12, 16, 20'], '15, 16, 17',
    'Let n, n+1, n+2. Then 3n+3=48 → n=15. The integers are 15, 16, 17.'),
  Q('math','auditory',
    'Two dice are rolled. What is the probability that their sum is 7?',
    ['1/12','1/9','1/6','1/5'], '1/6',
    'Favourable outcomes: (1,6)(2,5)(3,4)(4,3)(5,2)(6,1) = 6. Total outcomes = 36. P = 6/36 = 1/6.'),

  // read_write
  Q('math','read_write',
    'Solve using the quadratic formula: 2x² − 5x − 3 = 0',
    ['x = 3 or x = −0.5','x = −3 or x = 0.5','x = 3 or x = 0.5','x = 1 or x = −3'], 'x = 3 or x = −0.5',
    'Discriminant = 25 + 24 = 49. x = (5 ± 7) / 4. So x = 3 or x = −1/2.'),
  Q('math','read_write',
    'Expand and simplify: (2x + 3)(x − 4)',
    ['2x² − 5x − 12','2x² + 5x − 12','2x² − 5x + 12','2x² − 8x − 12'], '2x² − 5x − 12',
    '2x·x + 2x·(−4) + 3·x + 3·(−4) = 2x² − 8x + 3x − 12 = 2x² − 5x − 12.'),
  Q('math','read_write',
    'What is the equation of the line through (1, 2) and (3, 8)?',
    ['y = 2x','y = 3x − 1','y = 3x + 1','y = 2x + 3'], 'y = 3x − 1',
    'Gradient = (8−2)/(3−1) = 3. Using y − 2 = 3(x − 1): y = 3x − 1.'),

  // kinesthetic
  Q('math','kinesthetic',
    'Evaluate: ∫₀² (3x² + 2x) dx',
    ['8','10','12','14'], '12',
    '[x³ + x²]₀² = (8 + 4) − 0 = 12.'),
  Q('math','kinesthetic',
    'Differentiate y = 4x³ − 3x² + 7 and find the gradient at x = 2.',
    ['18','24','36','48'], '36',
    'dy/dx = 12x² − 6x. At x=2: 12(4) − 6(2) = 48 − 12 = 36.'),
  Q('math','kinesthetic',
    'A circle has area 154 cm² (π ≈ 3.14). Find its radius to 1 d.p.',
    ['5.5 cm','7.0 cm','8.3 cm','12.4 cm'], '7.0 cm',
    'A = πr² → r² = 154/3.14 ≈ 49 → r ≈ 7.0 cm.'),

  // ── ENGLISH ─────────────────────────────────────────────────────────────
  // visual
  Q('english','visual',
    'A word web links "enormous" to "huge", "vast", "mammoth". What part of speech are these words?',
    ['Nouns','Verbs','Adjectives','Adverbs'], 'Adjectives',
    'All four words describe nouns (size), making them adjectives.'),
  Q('english','visual',
    'A sentence is annotated: subject underlined, verb circled, object boxed. In "The cat chased the mouse" — what is the object?',
    ['The cat','chased','The mouse','the'], 'The mouse',
    'The object receives the action of the verb. "The mouse" is what was chased.'),
  Q('english','visual',
    'A punctuation poster shows two sentences: "Its raining." and "The dog lost its bone." Which is correctly punctuated?',
    ['Its raining.','The dog lost its bone.','Both are correct','Neither is correct'], 'The dog lost its bone.',
    '"Its" is the possessive pronoun (no apostrophe). "It\'s" = "it is" requires an apostrophe.'),

  // auditory
  Q('english','auditory',
    'Spot the grammatical error: "She don\'t like homework."',
    ['She','don\'t','like','homework'], 'don\'t',
    'The correct form is "doesn\'t" (third-person singular). "She doesn\'t like homework."'),
  Q('english','auditory',
    'What literary device is used in: "The wind howled through the trees"?',
    ['Simile','Metaphor','Personification','Alliteration'], 'Personification',
    'Giving the wind the human quality of howling is personification.'),
  Q('english','auditory',
    'What is the difference between a simile and a metaphor?',
    ['A simile uses "like" or "as"; a metaphor is a direct comparison','A metaphor uses "like"; a simile is direct','They are identical','Only similes use figurative language'], 'A simile uses "like" or "as"; a metaphor is a direct comparison',
    'Example simile: "brave as a lion". Metaphor: "He is a lion in battle."'),

  // read_write
  Q('english','read_write',
    'Identify the author\'s tone: "The policy is not only misguided but recklessly dangerous."',
    ['Neutral','Admiring','Critical / hostile','Humorous'], 'Critical / hostile',
    'Words like "misguided" and "recklessly dangerous" signal strong disapproval — a critical tone.'),
  Q('english','read_write',
    'What is the correct use of "affect" vs "effect"? Choose the sentence that uses both correctly.',
    ['"The effect affected her.','The affect effected change.','Stress can affect health; the effects were severe.','Affect and effect mean the same thing.'], 'Stress can affect health; the effects were severe.',
    '"Affect" is usually a verb (to influence); "effect" is usually a noun (the result).'),
  Q('english','read_write',
    'Identify the rhetorical device: "Ask not what your country can do for you — ask what you can do for your country."',
    ['Alliteration','Anaphora','Antithesis / Chiasmus','Hyperbole'], 'Antithesis / Chiasmus',
    'The sentence reverses the two clauses (chiasmus) and contrasts opposing ideas (antithesis).'),

  // kinesthetic
  Q('english','kinesthetic',
    'Rewrite in the passive voice: "The chef cooked the meal."',
    ['The meal was cooking by the chef.','The meal was cooked by the chef.','The meal has cooked by the chef.','The chef was cooked the meal.'], 'The meal was cooked by the chef.',
    'Passive voice: Object + "was/were" + past participle + "by" + agent.'),
  Q('english','kinesthetic',
    'Which expanded version of "She studied." contains a subordinate clause?',
    ['She studied hard.','She studied and passed.','Although she was tired, she studied because the exam was the next day.','She studied, she passed.'], 'Although she was tired, she studied because the exam was the next day.',
    '"Although she was tired" and "because the exam was the next day" are both subordinate clauses.'),
  Q('english','kinesthetic',
    'Which sentence is correctly punctuated?',
    ['however its not always the case','However its not always the case.','However, it\'s not always the case.','However it\'s not always the case'], 'However, it\'s not always the case.',
    '"However" as a sentence opener needs a comma after it. "it\'s" = "it is" needs an apostrophe.'),
];

// ─── App-wide reactive state ─────────────────────────────────────────────────
const { useState, useEffect, useCallback, createContext, useContext, useRef } = React;

const AppContext = createContext(null);

window.useApp = () => useContext(AppContext);

window.AppProvider = function AppProvider({ children }) {
  const [user, setUser] = useState(null);           // null = logged out
  const [page, setPage] = useState('login');         // login | dashboard | study | analytics | admin
  const [studySubject, setStudySubject] = useState('physics');
  const [sessions, setSessions] = useState([]);      // completed sessions
  const [profiles, setProfiles] = useState({});      // { [subject]: LearningStyleProfile }

  // ── Seed some demo sessions so charts/dashboard aren't empty ────────────
  useEffect(() => {
    if (sessions.length > 0) return;
    const demoSessions = [];
    const subjects = ['physics','math','english'];
    const modes = ['visual','auditory','read_write','kinesthetic'];
    const now = Date.now();
    for (let i = 0; i < 22; i++) {
      const subject = subjects[i % 3];
      const mode    = modes[i % 4];
      demoSessions.push({
        id: `demo-${i}`,
        subject,
        mode,
        score: 50 + Math.round(Math.random() * 50),
        avgConfidence: 2 + Math.round(Math.random() * 3),
        revisitCount: Math.round(Math.random() * 2),
        date: new Date(now - (22 - i) * 86400000 * 0.7).toISOString(),
        answers: Array.from({ length: 10 }, (_, j) => ({
          correct: Math.random() > 0.4,
          timeSpentSeconds: 15 + Math.round(Math.random() * 45),
          confidenceRating: 2 + Math.round(Math.random() * 3),
        })),
      });
    }
    setSessions(demoSessions);
  }, []);

  // ── Derive learning profiles from sessions ───────────────────────────────
  useEffect(() => {
    const newProfiles = {};
    ['physics','math','english'].forEach(subject => {
      const subSessions = sessions.filter(s => s.subject === subject);
      const count = subSessions.length;
      const modeScores = {};
      ['visual','auditory','read_write','kinesthetic'].forEach(mode => {
        const ms = subSessions.filter(s => s.mode === mode);
        if (!ms.length) { modeScores[mode] = 0; return; }
        const accuracy    = ms.reduce((a,s) => a + s.score, 0) / ms.length / 100;
        const confidence  = (ms.reduce((a,s) => a + s.avgConfidence, 0) / ms.length - 1) / 4;
        const revisit     = ms.reduce((a,s) => a + s.revisitCount, 0) / ms.length;
        const lowRevisit  = Math.max(0, 1 - revisit / 5);
        modeScores[mode]  = accuracy * 0.5 + 0.2 * 0.5 + confidence * 0.2 + lowRevisit * 0.1;
      });
      const sorted = Object.entries(modeScores).sort((a,b) => b[1]-a[1]);
      const [dominant, domScore] = sorted[0];
      const [,secondScore]       = sorted[1] || [,0];
      const isLocked = count >= 20 && domScore >= secondScore * 1.2;
      newProfiles[subject] = {
        subject,
        sessionCount: count,
        dominantMode: count >= 20 ? dominant : null,
        isLocked,
        modeScores,
      };
    });
    setProfiles(newProfiles);
  }, [sessions]);

  // ── Adaptive engine: get next mode ───────────────────────────────────────
  const getNextMode = useCallback((subject) => {
    const profile = profiles[subject];
    if (!profile) return 'visual';
    const modes = ['visual','auditory','read_write','kinesthetic'];
    if (profile.isLocked && profile.dominantMode) {
      if (profile.sessionCount > 0 && profile.sessionCount % 10 === 0) {
        const others = modes.filter(m => m !== profile.dominantMode);
        return others[Math.floor(Math.random() * others.length)];
      }
      return profile.dominantMode;
    }
    if (profile.sessionCount < 20) return modes[profile.sessionCount % 4];
    return profile.dominantMode || modes[0];
  }, [profiles]);

  // ── Get questions for a session ───────────────────────────────────────────
  const getQuestions = useCallback((subject, mode, count = 10) => {
    const pool = QUESTION_BANK.filter(q => q.subject === subject && q.mode === mode);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    // if not enough, pad with any from subject
    if (shuffled.length < count) {
      const extras = QUESTION_BANK.filter(q => q.subject === subject && q.mode !== mode)
        .sort(() => Math.random() - 0.5)
        .slice(0, count - shuffled.length);
      return [...shuffled, ...extras].slice(0, count);
    }
    return shuffled.slice(0, count);
  }, []);

  // ── Complete a session ────────────────────────────────────────────────────
  const completeSession = useCallback((sessionData) => {
    setSessions(prev => [...prev, { ...sessionData, date: new Date().toISOString() }]);
  }, []);

  const navigate = useCallback((p, extra = {}) => {
    if (extra.subject) setStudySubject(extra.subject);
    setPage(p);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    setPage('dashboard');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPage('login');
  }, []);

  return (
    <AppContext.Provider value={{
      user, page, studySubject,
      sessions, profiles,
      login, logout, navigate,
      getNextMode, getQuestions, completeSession,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// ─── Shared UI components ────────────────────────────────────────────────────

window.ModePill = function ModePill({ mode, size = 'sm' }) {
  const meta = MODE_META[mode];
  if (!meta) return null;
  const IconComp = Icons[meta.icon];
  return (
    <span className={`pill ${meta.cls}`} style={size === 'lg' ? { fontSize: 14, padding: '7px 14px' } : {}}>
      <span className="dot" />
      {meta.label}
    </span>
  );
};

window.StyleStatusBadge = function StyleStatusBadge({ profile }) {
  if (!profile) return null;
  const { sessionCount, dominantMode, isLocked } = profile;
  if (isLocked && dominantMode) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'#4338CA', background:'#EEF2FF', padding:'5px 11px', borderRadius:999 }}>
        <Icons.Lock size={12} /> Locked · {MODE_META[dominantMode]?.label}
      </span>
    );
  }
  if (sessionCount >= 20 && dominantMode) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'#0369A1', background:'#E0F2FE', padding:'5px 11px', borderRadius:999 }}>
        <Icons.TrendingUp size={12} /> Converging · {MODE_META[dominantMode]?.label}
      </span>
    );
  }
  const remaining = Math.max(0, 20 - sessionCount);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'#6B7280', background:'#F3F4F6', padding:'5px 11px', borderRadius:999 }}>
      <Icons.RefreshCw size={12} /> Detecting · {remaining} left
    </span>
  );
};

window.Avatar = function Avatar({ name = '?' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className="avatar">{initials}</div>;
};
