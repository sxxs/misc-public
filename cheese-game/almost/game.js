// ── Almost. — Game Components ─────────────────────────────────────────────────
// React + Tailwind, loaded via Babel. Depends on challenges.js + analysis.js.

const { useState, useEffect, useRef, useCallback } = React;

// ── Local Stats ───────────────────────────────────────────────────────────────

const STATS_KEY = 'almost_stats_v1';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
  } catch { return {}; }
}

function saveRun(scores) {
  const total = scores.reduce((a, b) => a + b, 0);
  const today = todayStr();
  const stats = loadStats();

  // Streak: if last play was yesterday, increment; if today, keep; else reset to 1
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

  let streak = stats.streak || 0;
  if (stats.lastPlayDate === yStr) streak += 1;
  else if (stats.lastPlayDate === today) streak = streak; // already played today
  else streak = 1;

  const history = stats.history || [];
  // Only add if not already played today (keep best)
  const todayIdx = history.findIndex(r => r.date === today);
  if (todayIdx >= 0) {
    if (total > history[todayIdx].total) history[todayIdx] = { date: today, total, scores };
  } else {
    history.unshift({ date: today, total, scores });
    if (history.length > 30) history.pop();
  }

  const allTimeHigh = Math.max(stats.allTimeHigh || 0, total);
  const totalRuns = (stats.totalRuns || 0) + (todayIdx >= 0 ? 0 : 1);

  const next = { streak, lastPlayDate: today, history, allTimeHigh, totalRuns };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(next)); } catch {}
  return next;
}

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const R = 45, C = 2 * Math.PI * R;
  const offset = C * (1 - score / 100);
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#a3e635' : score >= 40 ? '#facc15' : '#f87171';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="#2a2a2a" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={R} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={C} strokeDashoffset={C}
          strokeLinecap="round"
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.9s ease-out, stroke 0.3s' }}
        />
      </svg>
      <span className="text-3xl font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Visualization Canvases ────────────────────────────────────────────────────

function VizCanvas({ challenge, size = 110 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.width = size; ref.current.height = size;
    drawVisualization(ref.current, challenge.visualization, challenge.vizParams);
  }, [challenge, size]);
  return <canvas ref={ref} style={{ width: size, height: size, borderRadius: 8, border: '1px solid #333' }} />;
}

function CapturedCanvas({ imageData, size = 110 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !imageData) return;
    ref.current.width = size; ref.current.height = size;
    const ctx = ref.current.getContext('2d');
    const tmp = document.createElement('canvas');
    tmp.width = 64; tmp.height = 64;
    tmp.getContext('2d').putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, size, size);
  }, [imageData, size]);
  return <canvas ref={ref} style={{ width: size, height: size, borderRadius: 8, border: '1px solid #333' }} />;
}

// ── UI Atoms ──────────────────────────────────────────────────────────────────

function AttemptPips({ total = 3, current }) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: i < current ? '#555' : '#f0f0f0',
          opacity: i < current ? 0.5 : 1
        }} />
      ))}
    </div>
  );
}

function DifficultyDots({ level }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i < level ? '#f0f0f0' : '#333'
        }} />
      ))}
    </div>
  );
}

// ── Landing Screen ────────────────────────────────────────────────────────────

function LandingScreen({ onStart, onStartRandom, stats, opponentScores, opponentTotal }) {
  const today = todayStr();
  const todayRun = stats.history && stats.history.find(r => r.date === today);
  const streak = stats.streak || 0;
  const allTimeHigh = stats.allTimeHigh || 0;
  const isChallenged = opponentScores !== null;

  return (
    <div className="flex flex-col items-center justify-between h-full safe-top safe-bottom fade-up"
         style={{ padding: '2.5rem 2rem' }}>

      <div className="flex flex-col items-center gap-3 mt-6">
        <div style={{ fontSize: 64, lineHeight: 1 }}>📸</div>
        <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-2px', color: '#f0f0f0' }}>Almost.</h1>
        {!isChallenged && (
          <p style={{ color: '#888', textAlign: 'center', maxWidth: 280, lineHeight: 1.6, fontSize: 14 }}>
            Mach ein Foto. Verfehl das Ziel knapp. Versuch's nochmal.
          </p>
        )}
      </div>

      {/* Challenge banner */}
      {isChallenged && (
        <div style={{
          background: '#0f1a0f', border: '1px solid #2a4a2a', borderRadius: 14,
          padding: '16px 20px', width: '100%', maxWidth: 300, textAlign: 'center'
        }}>
          <div style={{ color: '#a3e635', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>⚔️ Du wurdest herausgefordert</div>
          <div style={{ color: '#666', fontSize: 13, lineHeight: 1.5 }}>
            Jemand hat <span style={{ color: '#f0f0f0', fontWeight: 600 }}>{opponentTotal}/500</span> geschafft.<br/>
            Kannst du das toppen?
          </div>
        </div>
      )}

      {/* Stats row */}
      {(streak > 0 || allTimeHigh > 0) && (
        <div className="flex gap-4 justify-center">
          {streak > 1 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fb923c' }}>🔥 {streak}</div>
              <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>Tage</div>
            </div>
          )}
          {allTimeHigh > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#a3e635' }}>{allTimeHigh}</div>
              <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>Rekord</div>
            </div>
          )}
        </div>
      )}

      {/* Today's result if already played */}
      {todayRun && (
        <div style={{
          background: '#111', border: '1px solid #222', borderRadius: 12,
          padding: '12px 20px', textAlign: 'center', width: '100%', maxWidth: 300
        }}>
          <div style={{ color: '#555', fontSize: 12, marginBottom: 4 }}>Heute gespielt</div>
          <div style={{ color: '#f0f0f0', fontWeight: 700, fontSize: 20 }}>
            {todayRun.total}<span style={{ color: '#444', fontSize: 14 }}>/500</span>
          </div>
          <div style={{ color: '#666', fontSize: 12, marginTop: 2, fontStyle: 'italic' }}>
            „{getRankTitle(todayRun.total)}"
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
        <p style={{ color: '#333', fontSize: 12, textAlign: 'center' }}>
          5 Aufgaben · 3 Versuche je · alles lokal
          <span style={{ color: '#2a2a2a', marginLeft: 8 }}>v{typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?'}</span>
        </p>
        <button
          onClick={onStart}
          style={{
            background: isChallenged ? '#a3e635' : '#f0f0f0',
            color: '#0a0a0a', border: 'none', borderRadius: 14,
            padding: '16px', fontSize: 18, fontWeight: 700,
            cursor: 'pointer', width: '100%', fontFamily: 'inherit'
          }}
        >
          {isChallenged ? 'Challenge annehmen ⚔️' : todayRun ? 'Daily wiederholen' : 'Daily spielen'}
        </button>
        {!isChallenged && (
          <button
            onClick={onStartRandom}
            style={{
              background: 'transparent', color: '#aaa',
              border: '1px solid #2a2a2a', borderRadius: 14,
              padding: '13px', fontSize: 15,
              cursor: 'pointer', width: '100%', fontFamily: 'inherit'
            }}
          >
            🎲 Zufälliger Run
          </button>
        )}
      </div>
    </div>
  );
}

// ── Permission Screen ─────────────────────────────────────────────────────────

function PermissionScreen({ onRetry, onUpload }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 fade-up"
         style={{ padding: '2rem' }}>
      <div style={{ fontSize: 56 }}>🚫📷</div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#f0f0f0', fontSize: 18, marginBottom: 8 }}>Kein Kamerazugriff</p>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>
          Das Spiel braucht deine Kamera.<br />
          Bitte erlaube den Zugriff in den Browsereinstellungen.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 280 }}>
        <button onClick={onRetry} style={{
          background: '#f0f0f0', color: '#0a0a0a', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', width: '100%'
        }}>
          Nochmal versuchen
        </button>
        <label style={{
          background: '#1a1a1a', color: '#aaa', border: '1px solid #333', borderRadius: 12,
          padding: '14px', fontSize: 14, cursor: 'pointer', textAlign: 'center', display: 'block'
        }}>
          Bild hochladen
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
        </label>
      </div>
    </div>
  );
}

// ── Challenge Screen ──────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 2;
const TIMER_SECONDS = 30;

function ChallengeScreen({ challenge, challengeIndex, attemptNumber, onCapture, onUpload }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(s => {
      stream = s;
      const v = videoRef.current;
      if (v) {
        v.srcObject = s;
        v.setAttribute('playsinline', '');
        v.setAttribute('autoplay', '');
        v.muted = true;
        v.play().then(() => setReady(true)).catch(() => setReady(true));
      }
    }).catch(() => onCapture(null, 0));
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);

  // Start countdown when camera is ready
  useEffect(() => {
    if (!ready) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [ready]);

  // Auto-capture on timeout
  useEffect(() => {
    if (timeLeft === 0 && ready && !doneRef.current && videoRef.current) {
      doneRef.current = true;
      const imageData = captureAndDownscale(videoRef.current);
      onCapture(imageData, 15);
    }
  }, [timeLeft, ready]);

  // Penalty tiers: 0–9s left = 10pts, 10–19s = 5pts, 20–30s = 0pts
  const penalty = timeLeft >= 20 ? 0 : timeLeft >= 10 ? 5 : 10;
  const timerColor = timeLeft >= 20 ? '#4ade80' : timeLeft >= 10 ? '#facc15' : '#f87171';

  const handleCapture = useCallback(() => {
    if (!ready || capturing || doneRef.current) return;
    doneRef.current = true;
    clearInterval(timerRef.current);
    setCapturing(true);
    const imageData = captureAndDownscale(videoRef.current);
    setTimeout(() => { onCapture(imageData, penalty); setCapturing(false); }, 80);
  }, [ready, capturing, onCapture, penalty]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      <video ref={videoRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Top bar */}
      <div className="safe-top" style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem 1.25rem',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div style={{ color: '#aaa', fontSize: 12 }}>Aufgabe {challengeIndex + 1} / 5</div>
            <DifficultyDots level={challenge.difficulty} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div style={{ color: timerColor, fontSize: 20, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {timeLeft}s
            </div>
            {penalty > 0 && (
              <div style={{ color: '#f87171', fontSize: 11 }}>–{penalty} Strafe</div>
            )}
            <AttemptPips total={MAX_ATTEMPTS} current={attemptNumber} />
          </div>
        </div>
        <p style={{ color: '#f0f0f0', fontSize: 20, fontWeight: 600, lineHeight: 1.3, marginTop: 10 }}>
          {challenge.prompt}
        </p>
        {challenge.hint && (
          <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>{challenge.hint}</p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="safe-bottom" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'
      }}>
        <label style={{ cursor: 'pointer', opacity: 0.7 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>🖼️</div>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
        </label>

        <button onClick={handleCapture} disabled={!ready || capturing} style={{
          width: 72, height: 72, borderRadius: '50%',
          background: capturing ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
          border: '4px solid white', cursor: ready ? 'pointer' : 'default',
          transition: 'transform 0.1s, background 0.15s',
          transform: capturing ? 'scale(0.9)' : 'scale(1)'
        }} />

        <div style={{ width: 44 }} />
      </div>

      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
          <div className="pulse" style={{ color: '#888', fontSize: 14 }}>Kamera wird gestartet…</div>
        </div>
      )}
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────────────────────────────

function ResultScreen({ challenge, result, attemptNumber, isLast, onRetry, onNext }) {
  const { score, comment, diagnosis, capturedImageData } = result;
  const canRetry = attemptNumber < MAX_ATTEMPTS;

  return (
    <div className="flex flex-col h-full safe-top safe-bottom fade-up"
         style={{ padding: '1.5rem', overflowY: 'auto' }}>
      <div className="flex flex-col items-center gap-3 mt-4">
        <ScoreRing score={score} />
        <p style={{ color: '#f0f0f0', fontSize: 16, fontWeight: 500, textAlign: 'center', maxWidth: 280, lineHeight: 1.5, fontStyle: 'italic' }}>
          „{comment}"
        </p>
        <p style={{ color: '#555', fontSize: 13 }}>{diagnosis}</p>
      </div>

      <div className="flex gap-4 justify-center mt-6">
        <div className="flex flex-col items-center gap-1">
          <VizCanvas challenge={challenge} size={110} />
          <span style={{ color: '#555', fontSize: 11 }}>Ziel</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CapturedCanvas imageData={capturedImageData} size={110} />
          <span style={{ color: '#555', fontSize: 11 }}>Dein Foto</span>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <AttemptPips total={MAX_ATTEMPTS} current={attemptNumber} />
      </div>

      <div className="flex flex-col gap-3 mt-auto pt-6">
        {canRetry && (
          <button onClick={onRetry} style={{
            background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #333', borderRadius: 12,
            padding: '14px', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', width: '100%'
          }}>
            Nochmal ({MAX_ATTEMPTS - attemptNumber} übrig)
          </button>
        )}
        <button onClick={onNext} style={{
          background: '#f0f0f0', color: '#0a0a0a', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 16, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', width: '100%'
        }}>
          {isLast ? 'Ergebnis ansehen' : 'Weiter →'}
        </button>
      </div>
    </div>
  );
}

// ── Summary Screen ────────────────────────────────────────────────────────────

function SummaryScreen({ challenges, scores, seed, stats, onPlayAgain, onHome }) {
  const total = scores.reduce((a, b) => a + b, 0);
  const rank = getRankTitle(total);
  const isNewHigh = total > 0 && total >= (stats.allTimeHigh || 0);

  const shareText = () => {
    const bars = scores.map(s => {
      const filled = Math.round(s / 10);
      return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${s}`;
    }).join('\n');
    return `Almost. – ${rank}\n${total}/500\n\n${bars}\n\n${window.location.origin + window.location.pathname}?s=${encodeSeed(seed)}`;
  };

  const challengeUrl = `${window.location.origin + window.location.pathname}?s=${encodeSeed(seed)}`;

  const handleShare = async () => {
    const text = shareText();
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      alert('Ergebnis kopiert!');
    } catch { alert(text); }
  };

  const handleChallenge = async () => {
    const vsParam = encodeScores(scores);
    const challengeUrlWithScores = `${window.location.origin + window.location.pathname}?s=${encodeSeed(seed)}&vs=${vsParam}`;
    const msg = `Kannst du das besser? Ich hab ${total}/500 – „${rank}". ${challengeUrlWithScores}`;
    if (navigator.share) {
      try { await navigator.share({ text: msg }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(msg);
      alert('Challenge-Link kopiert!');
    } catch { alert(msg); }
  };

  const color = (s) => s >= 90 ? '#22c55e' : s >= 70 ? '#a3e635' : s >= 40 ? '#facc15' : '#f87171';

  return (
    <div className="flex flex-col h-full safe-top safe-bottom fade-up"
         style={{ padding: '1.5rem', overflowY: 'auto' }}>

      <div className="flex flex-col items-center gap-2 mt-6">
        <div style={{ fontSize: 44 }}>{isNewHigh ? '🏆' : '🎯'}</div>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1px', color: '#f0f0f0' }}>
          {total}<span style={{ color: '#444', fontSize: 22 }}>/500</span>
        </h2>
        {isNewHigh && stats.allTimeHigh > 0 && (
          <div style={{ color: '#fb923c', fontSize: 13, fontWeight: 600 }}>↑ Neuer Rekord!</div>
        )}
        <p style={{ color: '#888', fontSize: 14, fontStyle: 'italic' }}>„{rank}"</p>
        {(stats.streak || 0) > 1 && (
          <div style={{ color: '#fb923c', fontSize: 13 }}>🔥 {stats.streak} Tage am Stück</div>
        )}
      </div>

      {/* Per-challenge scores */}
      <div className="flex flex-col gap-2 mt-6">
        {challenges.map((c, i) => (
          <div key={c.id} className="flex items-center justify-between"
               style={{ background: '#111', borderRadius: 10, padding: '10px 14px', border: '1px solid #222' }}>
            <div>
              <div style={{ color: '#f0f0f0', fontSize: 14, fontWeight: 500 }}>{c.title}</div>
              <div className="flex gap-1 mt-1"><DifficultyDots level={c.difficulty} /></div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: color(scores[i]) }}>{scores[i]}</div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 mt-6 pb-4">
        <button onClick={handleShare} style={{
          background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #333', borderRadius: 12,
          padding: '13px', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', width: '100%'
        }}>
          Ergebnis teilen 📤
        </button>
        <button onClick={handleChallenge} style={{
          background: '#1a1a1a', color: '#a3e635', border: '1px solid #2a3a1a', borderRadius: 12,
          padding: '13px', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', width: '100%'
        }}>
          Freund herausfordern ⚔️
        </button>
        <button onClick={onPlayAgain} style={{
          background: '#f0f0f0', color: '#0a0a0a', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 16, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', width: '100%'
        }}>
          Nochmal spielen
        </button>
        <button onClick={onHome} style={{
          background: 'transparent', color: '#444', border: 'none',
          padding: '8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          Startseite
        </button>
      </div>
    </div>
  );
}

// ── VS Comparison Screen ──────────────────────────────────────────────────────

function VSScreen({ challenges, myScores, theirScores, seed, onRematch, onPlayAgain, onHome }) {
  const myTotal    = myScores.reduce((a, b) => a + b, 0);
  const theirTotal = theirScores.reduce((a, b) => a + b, 0);
  const iWon = myTotal > theirTotal;
  const tied = myTotal === theirTotal;
  const vsComment = getVSComment(myTotal, theirTotal);

  const handleRematch = async () => {
    const url = `${window.location.origin}${window.location.pathname}?s=${encodeSeed(seed)}&vs=${encodeScores(myScores)}`;
    const msg = `Revanche! Ich hab ${myTotal}/500 — kannst du das toppen? ${url}`;
    if (navigator.share) { try { await navigator.share({ text: msg }); return; } catch {} }
    try { await navigator.clipboard.writeText(msg); alert('Revanche-Link kopiert!'); } catch { alert(msg); }
  };

  const color = (s) => s >= 90 ? '#22c55e' : s >= 70 ? '#a3e635' : s >= 40 ? '#facc15' : '#f87171';

  return (
    <div className="flex flex-col h-full safe-top safe-bottom fade-up"
         style={{ padding: '1.5rem', overflowY: 'auto' }}>

      <div className="flex flex-col items-center gap-2 mt-4">
        <div style={{ fontSize: 40 }}>{tied ? '🤝' : iWon ? '🏆' : '💀'}</div>
        <div className="flex items-center gap-4">
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#555', fontSize: 11, marginBottom: 2 }}>Sie/Er</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: !iWon && !tied ? '#22c55e' : '#f87171' }}>{theirTotal}</div>
          </div>
          <div style={{ color: '#444', fontSize: 20 }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#555', fontSize: 11, marginBottom: 2 }}>Du</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: iWon ? '#22c55e' : tied ? '#facc15' : '#f87171' }}>{myTotal}</div>
          </div>
        </div>
        <p style={{ color: '#777', fontSize: 13, fontStyle: 'italic', textAlign: 'center', maxWidth: 280 }}>
          „{vsComment}"
        </p>
      </div>

      {/* Per-challenge comparison */}
      <div className="flex flex-col gap-2 mt-6">
        {challenges.map((c, i) => {
          const mine = myScores[i], theirs = theirScores[i];
          const mineWon = mine >= theirs;
          return (
            <div key={c.id} style={{ background: '#111', borderRadius: 10, padding: '10px 14px', border: '1px solid #222' }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{c.title}</div>
              <div className="flex items-center gap-2">
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: !mineWon ? '#22c55e' : '#555' }}>{theirs}</span>
                </div>
                <div style={{ color: '#333', fontSize: 11, padding: '0 6px' }}>vs</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: mineWon ? color(mine) : '#555' }}>{mine}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 mt-6 pb-4">
        <button onClick={handleRematch} style={{
          background: '#1a1a2a', color: '#a3e635', border: '1px solid #2a3a1a', borderRadius: 12,
          padding: '13px', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', width: '100%'
        }}>
          Revanche schicken ⚔️
        </button>
        <button onClick={onPlayAgain} style={{
          background: '#f0f0f0', color: '#0a0a0a', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%'
        }}>
          Neues Spiel
        </button>
        <button onClick={onHome} style={{
          background: 'transparent', color: '#444', border: 'none',
          padding: '8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          Startseite
        </button>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [phase, setPhase] = useState('landing');
  const [challenges, setChallenges] = useState([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [scores, setScores] = useState([0, 0, 0, 0, 0]);
  const [seed, setSeed] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [stats, setStats] = useState(() => loadStats());
  const [opponentScores, setOpponentScores] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s') ? decodeSeed(params.get('s')) : getDailySeed();
    setSeed(s);
    setChallenges(selectChallenges(s));
    const vs = params.get('vs');
    if (vs) setOpponentScores(decodeScores(vs));
  }, []);

  const startRun = (customSeed) => {
    const s = customSeed !== undefined ? customSeed : getDailySeed();
    setSeed(s);
    setChallenges(selectChallenges(s));
    setChallengeIndex(0);
    setAttemptNumber(0);
    setScores([0, 0, 0, 0, 0]);
    setLastResult(null);
    setOpponentScores(null);
    setPhase('challenge');
  };

  const startRandomRun = () => {
    const s = (Math.random() * 0xffffffff) >>> 0;
    startRun(s);
  };

  const handleCapture = (imageData, penalty = 0) => {
    if (imageData === null) { setPhase('permission'); return; }
    const challenge = challenges[challengeIndex];
    const rawScore = scoreChallenge(imageData, challenge);
    const score = Math.max(0, rawScore - penalty);
    const comment = getComment(challenge, score, attemptNumber);
    const diagnosis = getDiagnosis(imageData, challenge)
      + (penalty > 0 ? ` · −${penalty} Zeitstrafe` : '');
    setScores(prev => {
      const next = [...prev];
      next[challengeIndex] = Math.max(next[challengeIndex], score);
      return next;
    });
    setAttemptNumber(prev => prev + 1);
    setLastResult({ score, comment, diagnosis, capturedImageData: imageData });
    setPhase('result');
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx2 = canvas.getContext('2d');
      ctx2.drawImage(img, 0, 0, 64, 64);
      handleCapture(ctx2.getImageData(0, 0, 64, 64));
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  const handleNext = () => {
    const nextIndex = challengeIndex + 1;
    if (nextIndex >= challenges.length) {
      const finalScores = [...scores];
      if (lastResult) finalScores[challengeIndex] = Math.max(finalScores[challengeIndex], lastResult.score);
      const newStats = saveRun(finalScores);
      setStats(newStats);
      const url = new URL(window.location.href);
      url.searchParams.set('s', encodeSeed(seed));
      url.searchParams.set('sc', encodeScores(finalScores));
      window.history.replaceState({}, '', url.toString());
      setScores(finalScores);
      setPhase(opponentScores ? 'versus' : 'summary');
    } else {
      setChallengeIndex(nextIndex);
      setAttemptNumber(0);
      setLastResult(null);
      setPhase('challenge');
    }
  };

  if (!challenges.length) return null;
  const challenge = challenges[challengeIndex] || challenges[0];

  const opponentTotal = opponentScores ? opponentScores.reduce((a, b) => a + b, 0) : 0;

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0a', position: 'relative' }}>
      {phase === 'landing' && (
        <LandingScreen
          onStart={startRun}
          onStartRandom={startRandomRun}
          stats={stats}
          opponentScores={opponentScores}
          opponentTotal={opponentTotal}
        />
      )}
      {phase === 'permission' && (
        <PermissionScreen onRetry={() => setPhase('challenge')} onUpload={handleUpload} />
      )}
      {phase === 'challenge' && (
        <ChallengeScreen
          key={`${challengeIndex}-${attemptNumber}`}
          challenge={challenge}
          challengeIndex={challengeIndex}
          attemptNumber={attemptNumber}
          onCapture={handleCapture}
          onUpload={handleUpload}
        />
      )}
      {phase === 'result' && lastResult && (
        <ResultScreen
          challenge={challenge}
          result={lastResult}
          attemptNumber={attemptNumber}
          isLast={challengeIndex >= challenges.length - 1}
          onRetry={() => setPhase('challenge')}
          onNext={handleNext}
        />
      )}
      {phase === 'summary' && (
        <SummaryScreen
          challenges={challenges}
          scores={scores}
          seed={seed}
          stats={stats}
          onPlayAgain={startRun}
          onHome={() => setPhase('landing')}
        />
      )}
      {phase === 'versus' && opponentScores && (
        <VSScreen
          challenges={challenges}
          myScores={scores}
          theirScores={opponentScores}
          seed={seed}
          onRematch={() => {}}
          onPlayAgain={startRun}
          onHome={() => setPhase('landing')}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
