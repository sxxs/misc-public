// ── Almost. — Game Components ─────────────────────────────────────────────────
// React + Tailwind, loaded via Babel. Depends on challenges.js + analysis.js.

const { useState, useEffect, useRef, useCallback } = React;

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
          strokeDasharray={C}
          strokeDashoffset={C}
          strokeLinecap="round"
          style={{
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.9s ease-out, stroke 0.3s'
          }}
        />
      </svg>
      <span className="text-3xl font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Visualization Canvas ──────────────────────────────────────────────────────

function VizCanvas({ challenge, size = 110 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.width  = size;
    ref.current.height = size;
    drawVisualization(ref.current, challenge.visualization, challenge.vizParams);
  }, [challenge, size]);
  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size, borderRadius: 8, border: '1px solid #333' }}
    />
  );
}

function CapturedCanvas({ imageData, size = 110 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !imageData) return;
    ref.current.width  = size;
    ref.current.height = size;
    const ctx = ref.current.getContext('2d');
    // Scale 64×64 imageData up to size×size
    const tmp = document.createElement('canvas');
    tmp.width = 64; tmp.height = 64;
    tmp.getContext('2d').putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, size, size);
  }, [imageData, size]);
  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size, borderRadius: 8, border: '1px solid #333' }}
    />
  );
}

// ── Attempt Pips ──────────────────────────────────────────────────────────────

function AttemptPips({ total = 3, current }) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < current ? '#555' : '#f0f0f0',
            opacity: i < current ? 0.5 : 1
          }}
        />
      ))}
    </div>
  );
}

// ── Difficulty Dots ───────────────────────────────────────────────────────────

function DifficultyDots({ level }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i < level ? '#f0f0f0' : '#333'
          }}
        />
      ))}
    </div>
  );
}

// ── Landing Screen ────────────────────────────────────────────────────────────

function LandingScreen({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-between h-full safe-top safe-bottom fade-up"
         style={{ padding: '3rem 2rem' }}>

      <div className="flex flex-col items-center gap-4 mt-8">
        <div style={{ fontSize: 72, lineHeight: 1 }}>📸</div>
        <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-2px', color: '#f0f0f0' }}>Almost.</h1>
        <p style={{ color: '#888', textAlign: 'center', maxWidth: 280, lineHeight: 1.6, fontSize: 15 }}>
          Mach ein Foto. Verfehl das Ziel knapp. Versuch's nochmal.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
        <p style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>
          5 Aufgaben · 3 Versuche je · alles lokal
        </p>
        <button
          onClick={onStart}
          style={{
            background: '#f0f0f0', color: '#0a0a0a',
            border: 'none', borderRadius: 14,
            padding: '16px 32px', fontSize: 18, fontWeight: 700,
            cursor: 'pointer', width: '100%',
            fontFamily: 'inherit'
          }}
        >
          Spielen
        </button>
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
          Das Spiel braucht deine Kamera.<br/>
          Bitte erlaube den Zugriff in den Browsereinstellungen.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 280 }}>
        <button
          onClick={onRetry}
          style={{
            background: '#f0f0f0', color: '#0a0a0a',
            border: 'none', borderRadius: 12, padding: '14px 24px',
            fontSize: 16, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', width: '100%'
          }}
        >
          Nochmal versuchen
        </button>
        <label style={{
          background: '#1a1a1a', color: '#aaa',
          border: '1px solid #333', borderRadius: 12, padding: '14px 24px',
          fontSize: 14, cursor: 'pointer', textAlign: 'center', display: 'block'
        }}>
          Bild hochladen
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
        </label>
      </div>
    </div>
  );
}

// ── Challenge Screen ──────────────────────────────────────────────────────────

function ChallengeScreen({ challenge, challengeIndex, attemptNumber, onCapture, onUpload }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(s => {
      stream = s;
      streamRef.current = s;
      const v = videoRef.current;
      if (v) {
        v.srcObject = s;
        v.setAttribute('playsinline', '');
        v.setAttribute('autoplay', '');
        v.muted = true;
        v.play().then(() => setReady(true)).catch(() => setReady(true));
      }
    }).catch(() => onCapture(null)); // null signals permission error

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (!ready || capturing) return;
    setCapturing(true);
    const imageData = captureAndDownscale(videoRef.current);
    setTimeout(() => {
      onCapture(imageData);
      setCapturing(false);
    }, 80);
  }, [ready, capturing, onCapture]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      {/* Camera feed */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* Top bar */}
      <div className="safe-top" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '1rem 1.25rem',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div style={{ color: '#aaa', fontSize: 12 }}>
              Aufgabe {challengeIndex + 1} / 5
            </div>
            <DifficultyDots level={challenge.difficulty} />
          </div>
          <AttemptPips total={3} current={attemptNumber} />
        </div>

        <div style={{ marginTop: 12 }}>
          <p style={{ color: '#f0f0f0', fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
            {challenge.prompt}
          </p>
          {challenge.hint && (
            <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
              {challenge.hint}
            </p>
          )}
        </div>
      </div>

      {/* Bottom: capture button + upload */}
      <div className="safe-bottom" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'
      }}>
        {/* Upload fallback */}
        <label style={{ cursor: 'pointer', opacity: 0.7 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>🖼️</div>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUpload} />
        </label>

        {/* Shutter */}
        <button
          onClick={handleCapture}
          disabled={!ready || capturing}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: capturing ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
            border: '4px solid white',
            cursor: ready ? 'pointer' : 'default',
            transition: 'transform 0.1s, background 0.15s',
            transform: capturing ? 'scale(0.9)' : 'scale(1)'
          }}
        />

        <div style={{ width: 44 }} /> {/* spacer to balance upload icon */}
      </div>

      {/* Not-ready overlay */}
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)'
        }}>
          <div className="pulse" style={{ color: '#888', fontSize: 14 }}>Kamera wird gestartet…</div>
        </div>
      )}
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────────────────────────────

function ResultScreen({ challenge, result, attemptNumber, isLast, onRetry, onNext }) {
  const { score, comment, diagnosis, capturedImageData } = result;
  const isLastAttempt = attemptNumber >= 3;
  const canRetry = !isLastAttempt;

  return (
    <div className="flex flex-col h-full safe-top safe-bottom fade-up"
         style={{ padding: '1.5rem', overflowY: 'auto' }}>

      {/* Score */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <ScoreRing score={score} />
        <p style={{
          color: '#f0f0f0', fontSize: 17, fontWeight: 500,
          textAlign: 'center', maxWidth: 280, lineHeight: 1.5, fontStyle: 'italic'
        }}>
          „{comment}"
        </p>
        <p style={{ color: '#555', fontSize: 13 }}>{diagnosis}</p>
      </div>

      {/* Before/After */}
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

      {/* Attempt info */}
      <div className="flex justify-center mt-4">
        <AttemptPips total={3} current={attemptNumber} />
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 mt-auto pt-6">
        {canRetry && (
          <button
            onClick={onRetry}
            style={{
              background: '#1a1a1a', color: '#f0f0f0',
              border: '1px solid #333', borderRadius: 12,
              padding: '14px', fontSize: 16, cursor: 'pointer',
              fontFamily: 'inherit', width: '100%'
            }}
          >
            Nochmal ({3 - attemptNumber} übrig)
          </button>
        )}
        <button
          onClick={onNext}
          style={{
            background: '#f0f0f0', color: '#0a0a0a',
            border: 'none', borderRadius: 12,
            padding: '14px', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', width: '100%'
          }}
        >
          {isLast ? 'Ergebnis ansehen' : 'Weiter →'}
        </button>
      </div>
    </div>
  );
}

// ── Summary Screen ────────────────────────────────────────────────────────────

function SummaryScreen({ challenges, scores, seed, onPlayAgain }) {
  const total = scores.reduce((a, b) => a + b, 0);
  const rank = getRankTitle(total);

  const shareText = () => {
    const bars = scores.map(s => {
      const filled = Math.round(s / 10);
      return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${s}`;
    }).join('\n');
    return `Almost. – ${rank}\n${total}/500\n\n${bars}\n\n${window.location.href}`;
  };

  const handleShare = async () => {
    const text = shareText();
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      alert('Ergebnis kopiert!');
    } catch {
      alert(shareText());
    }
  };

  const color = (s) => s >= 90 ? '#22c55e' : s >= 70 ? '#a3e635' : s >= 40 ? '#facc15' : '#f87171';

  return (
    <div className="flex flex-col h-full safe-top safe-bottom fade-up"
         style={{ padding: '1.5rem', overflowY: 'auto' }}>

      {/* Header */}
      <div className="flex flex-col items-center gap-2 mt-6">
        <div style={{ fontSize: 48 }}>🎯</div>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1px', color: '#f0f0f0' }}>
          {total}<span style={{ color: '#444', fontSize: 22 }}>/500</span>
        </h2>
        <p style={{ color: '#888', fontSize: 15, fontStyle: 'italic' }}>„{rank}"</p>
      </div>

      {/* Per-challenge scores */}
      <div className="flex flex-col gap-2 mt-8">
        {challenges.map((c, i) => (
          <div key={c.id} className="flex items-center justify-between"
               style={{
                 background: '#111', borderRadius: 10, padding: '10px 14px',
                 border: '1px solid #222'
               }}>
            <div>
              <div style={{ color: '#f0f0f0', fontSize: 14, fontWeight: 500 }}>{c.title}</div>
              <div className="flex gap-1 mt-1">
                <DifficultyDots level={c.difficulty} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: color(scores[i]) }}>
              {scores[i]}
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 mt-8">
        <button
          onClick={handleShare}
          style={{
            background: '#1a1a1a', color: '#f0f0f0',
            border: '1px solid #333', borderRadius: 12,
            padding: '14px', fontSize: 16, cursor: 'pointer',
            fontFamily: 'inherit', width: '100%'
          }}
        >
          Ergebnis teilen 📤
        </button>
        <button
          onClick={onPlayAgain}
          style={{
            background: '#f0f0f0', color: '#0a0a0a',
            border: 'none', borderRadius: 12,
            padding: '14px', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', width: '100%'
          }}
        >
          Nochmal spielen
        </button>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [phase, setPhase] = useState('landing');   // landing|challenge|result|summary
  const [challenges, setChallenges] = useState([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(0); // attempts used so far
  const [scores, setScores] = useState([0, 0, 0, 0, 0]);
  const [seed, setSeed] = useState(0);
  const [lastResult, setLastResult] = useState(null);

  // Read seed from URL or use daily
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s') ? decodeSeed(params.get('s')) : getDailySeed();
    setSeed(s);
    setChallenges(selectChallenges(s));
  }, []);

  const startRun = () => {
    const s = getDailySeed();
    setSeed(s);
    setChallenges(selectChallenges(s));
    setChallengeIndex(0);
    setAttemptNumber(0);
    setScores([0, 0, 0, 0, 0]);
    setLastResult(null);
    setPhase('challenge');
  };

  const handleCapture = (imageData) => {
    if (imageData === null) {
      setPhase('permission');
      return;
    }
    const challenge = challenges[challengeIndex];
    const score = scoreChallenge(imageData, challenge);
    const attempt = attemptNumber; // 0-based index of this attempt
    const comment = getComment(challenge, score, attempt);
    const diagnosis = getDiagnosis(imageData, challenge);

    // Update best score
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
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 64, 64);
      const imageData = ctx.getImageData(0, 0, 64, 64);
      handleCapture(imageData);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  const handleRetry = () => {
    setPhase('challenge');
  };

  const handleNext = () => {
    const nextIndex = challengeIndex + 1;
    if (nextIndex >= challenges.length) {
      // Build share URL
      const sc = scores.map(s => s.toString(36).padStart(2, '0')).join('');
      const url = new URL(window.location.href);
      url.searchParams.set('s', encodeSeed(seed));
      url.searchParams.set('sc', sc);
      window.history.replaceState({}, '', url.toString());
      setPhase('summary');
    } else {
      setChallengeIndex(nextIndex);
      setAttemptNumber(0);
      setLastResult(null);
      setPhase('challenge');
    }
  };

  if (!challenges.length) return null;

  const challenge = challenges[challengeIndex] || challenges[0];

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0a', position: 'relative' }}>
      {phase === 'landing' && (
        <LandingScreen onStart={startRun} />
      )}
      {phase === 'permission' && (
        <PermissionScreen
          onRetry={() => setPhase('challenge')}
          onUpload={handleUpload}
        />
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
          onRetry={handleRetry}
          onNext={handleNext}
        />
      )}
      {phase === 'summary' && (
        <SummaryScreen
          challenges={challenges}
          scores={scores}
          seed={seed}
          onPlayAgain={startRun}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
