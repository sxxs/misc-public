import { useEffect, useRef, useState } from "react";

/*
 * ═══════════════════════════════════════════════════════════════
 *  PENDULUM WAVE — 9:16, 15s loop, with audio
 * ═══════════════════════════════════════════════════════════════
 *
 *  REMOTION PORT NOTES
 *  -------------------
 *  1. Time: replace `performance.now()` with
 *         const t = (useCurrentFrame() / useVideoConfig().fps) % LOOP_SEC;
 *
 *  2. Canvas: keep, wrapped in a ref-based useEffect that runs on
 *     each frame. Or translate to SVG <line>/<circle> with Remotion
 *     interpolate() — either works.
 *
 *  3. Audio: Web Audio doesn't run in Remotion's render pipeline.
 *     Pre-render the whole 15s tick sequence offline with
 *     OfflineAudioContext or Tone.js → export WAV → import via
 *     Remotion <Audio>. Zero-crossing times are deterministic:
 *        tick k of pendulum i = T/(4·(N_BASE+i)) + k·T/(2·(N_BASE+i))
 *
 *  4. Loop seam for audio: render 2× loop (30s), take the second
 *     15s. That way trailing decays from pre-loop state are included
 *     and looping the audio won't click at the seam.
 *
 *  5. Captions: <Sequence from={...}> with interpolate() for fades.
 *
 *  6. Drop the safe-zone overlay, the audio button, and the
 *     fullscreen container — Remotion composition handles dimensions.
 * ═══════════════════════════════════════════════════════════════
 */

const N = 16;
const LOOP_SEC = 15;
const N_BASE = 14;
const AMPLITUDE = 0.36; // ~20.6°

const CAP1_IN = 0.4;
const CAP1_OUT = 2.8;
const CAP2_IN = 11.0;
const CAP2_OUT = 13.8;

// A minor pentatonic, 16 notes.
// Index 0 = longest pendulum (lowest pitch), index 15 = shortest (highest).
const PENTATONIC = [
  220.0,  261.63, 293.66, 329.63, 392.0,
  440.0,  523.25, 587.33, 659.25, 783.99,
  880.0,  1046.5, 1174.66,1318.51,1567.98,
  1760.0,
];

// Cutoff: pendulums with L/L_max below this make no sound.
const AUDIO_L_CUTOFF = 0.28;

// ─────────────────────────────────────────────────────────────
//  Pure state function — use in Remotion unchanged
// ─────────────────────────────────────────────────────────────
function computeBobs(t, W, H) {
  const anchorY = H * 0.24;
  const spanX = W * 0.82;
  const firstX = (W - spanX) / 2;
  const dx = spanX / (N - 1);
  const L_max = H * 0.62 - anchorY;

  const bobs = new Array(N);
  for (let i = 0; i < N; i++) {
    const omega = (2 * Math.PI * (N_BASE + i)) / LOOP_SEC;
    const theta = AMPLITUDE * Math.cos(omega * t);
    const L = L_max * Math.pow(N_BASE / (N_BASE + i), 2);
    const ax = firstX + i * dx;
    bobs[i] = {
      i,
      ax,
      ay: anchorY,
      bx: ax + L * Math.sin(theta),
      by: anchorY + L * Math.cos(theta),
      theta,
      L,
      LRatio: L / L_max,
    };
  }
  return bobs;
}

// ─────────────────────────────────────────────────────────────
//  Audio engine — replaced by pre-rendered <Audio> in Remotion
// ─────────────────────────────────────────────────────────────
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.drone = null;
    this.lastTheta = new Array(N).fill(null);
    this.started = false;
    this.muted = false;
    this.masterTarget = 0.55;
  }

  async start() {
    if (this.started) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    if (this.ctx.state === "suspended") await this.ctx.resume();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterTarget;
    this.master.connect(this.ctx.destination);

    this._startDrone();
    this.started = true;
  }

  _startDrone() {
    const now = this.ctx.currentTime;

    // A1 + E2 — open fifth, no third, so neither major nor minor
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 55.0;

    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 82.41;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    filter.Q.value = 0.7;

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.11, now + 2.0);

    // Very slow amplitude LFO — keeps drone from feeling sterile
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.09;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.035;
    lfo.connect(lfoGain).connect(droneGain.gain);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGain).connect(this.master);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    this.drone = { osc1, osc2, lfo, gain: droneGain, filter };
  }

  _playTick(pendulumIdx, volume) {
    const now = this.ctx.currentTime;
    const pitch = PENTATONIC[pendulumIdx];
    const duration = 0.55;

    // Fundamental — sine for cleanness
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = pitch;

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(volume, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Octave overtone — gives the tick a bell-like character
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = pitch * 2;
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0, now);
    osc2Gain.gain.linearRampToValueAtTime(volume * 0.28, now + 0.002);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.35);

    osc.connect(oscGain).connect(this.master);
    osc2.connect(osc2Gain).connect(this.master);

    osc.start(now);
    osc.stop(now + duration + 0.05);
    osc2.start(now);
    osc2.stop(now + duration * 0.35 + 0.05);
  }

  // Called from rAF with current bob states.
  // Triggers a tick when theta crosses zero going from + to -
  // (one tick per full oscillation, not two).
  checkCrossings(bobs) {
    if (!this.started || this.muted) return;

    for (const b of bobs) {
      const prev = this.lastTheta[b.i];
      const curr = b.theta;

      if (prev !== null && prev > 0 && curr <= 0) {
        if (b.LRatio >= AUDIO_L_CUTOFF) {
          // Quadratic volume taper — long pendulums loud, short pendulums faint
          const volume = 0.34 * Math.pow(b.LRatio, 1.9);
          this._playTick(b.i, volume);
        }
      }
      this.lastTheta[b.i] = curr;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (!this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(
      muted ? 0 : this.masterTarget,
      now + 0.25
    );
  }

  destroy() {
    if (this.ctx) {
      try { this.ctx.close(); } catch (_) {}
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  React component
// ─────────────────────────────────────────────────────────────
export default function PendulumWave() {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const cap1Ref = useRef(null);
  const cap2Ref = useRef(null);
  const engineRef = useRef(null);
  const [showSafe, setShowSafe] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  // Init audio engine (doesn't start audio — just allocates object)
  useEffect(() => {
    engineRef.current = new AudioEngine();
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = stage.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = rect.width;
      H = rect.height;
      ctx.fillStyle = "#05070c";
      ctx.fillRect(0, 0, W, H);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    let rafId;
    const start = performance.now();

    const draw = () => {
      const t = ((performance.now() - start) / 1000) % LOOP_SEC;

      // Trail fade
      ctx.fillStyle = "rgba(5, 7, 12, 0.15)";
      ctx.fillRect(0, 0, W, H);

      const bobs = computeBobs(t, W, H);
      const anchorY = bobs[0].ay;
      const firstX = bobs[0].ax;
      const lastX = bobs[N - 1].ax;

      // Ceiling bar
      ctx.strokeStyle = "rgba(230, 230, 240, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(firstX - W * 0.03, anchorY);
      ctx.lineTo(lastX + W * 0.03, anchorY);
      ctx.stroke();

      // Wave curve through bobs
      ctx.strokeStyle = "rgba(255, 245, 220, 0.09)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const b = bobs[i];
        if (i === 0) ctx.moveTo(b.bx, b.by);
        else ctx.lineTo(b.bx, b.by);
      }
      ctx.stroke();

      const haloR = Math.min(W, H) * 0.026;
      const bobR = Math.min(W, H) * 0.0085;

      for (const b of bobs) {
        ctx.fillStyle = "rgba(230, 230, 240, 0.5)";
        ctx.beginPath();
        ctx.arc(b.ax, b.ay, 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(200, 200, 220, 0.22)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(b.ax, b.ay);
        ctx.lineTo(b.bx, b.by);
        ctx.stroke();

        const glow = ctx.createRadialGradient(b.bx, b.by, 0, b.bx, b.by, haloR);
        glow.addColorStop(0, "rgba(255, 245, 220, 0.45)");
        glow.addColorStop(0.4, "rgba(255, 245, 220, 0.15)");
        glow.addColorStop(1, "rgba(255, 245, 220, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(b.bx, b.by, haloR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff5d6";
        ctx.beginPath();
        ctx.arc(b.bx, b.by, bobR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Audio tick detection
      engineRef.current?.checkCrossings(bobs);

      // Caption visibility
      cap1Ref.current?.classList.toggle(
        "visible",
        t >= CAP1_IN && t <= CAP1_OUT
      );
      cap2Ref.current?.classList.toggle(
        "visible",
        t >= CAP2_IN && t <= CAP2_OUT
      );

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  const toggleAudio = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (!engine.started) {
      await engine.start();
      setAudioOn(true);
    } else {
      const newMuted = !engine.muted;
      engine.setMuted(newMuted);
      setAudioOn(!newMuted);
    }
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .stage {
          aspect-ratio: 9 / 16;
          height: min(100vh, 100dvh);
          max-width: 100vw;
          position: relative;
          background: #05070c;
          overflow: hidden;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          container-type: inline-size;
          isolation: isolate;
        }
        .stage canvas {
          position: absolute;
          inset: 0;
          width: 100%; height: 100%;
          display: block;
          z-index: 1;
        }
        .vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at 50% 40%,
            transparent 45%, rgba(0,0,0,0.55) 100%);
          z-index: 2;
        }

        .head {
          position: absolute;
          top: 14%;
          left: 6%; right: 6%;
          text-align: center;
          z-index: 3;
          opacity: 0;
          transform: translateY(-6px);
          transition: opacity 450ms ease, transform 450ms ease;
        }
        .head.visible { opacity: 1; transform: translateY(0); }
        .title {
          font-size: 7cqw;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.025em;
          text-shadow: 0 0.3cqw 1.4cqw rgba(0, 0, 0, 0.75);
        }

        .kicker {
          position: absolute;
          top: 69%;
          left: 6%; right: 6%;
          text-align: center;
          font-size: 6.4cqw;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
          line-height: 1;
          z-index: 3;
          opacity: 0;
          transform: scale(0.94);
          transition: opacity 500ms ease, transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
          text-shadow: 0 0.4cqw 1.8cqw rgba(0, 0, 0, 0.85);
        }
        .kicker.visible { opacity: 1; transform: scale(1); }

        .safe {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 20;
        }
        .safe div {
          position: absolute;
          border: 1px dashed rgba(0, 255, 180, 0.55);
          font-size: 1.8cqw;
          color: rgba(0, 255, 180, 0.8);
          padding: 0.6cqw;
          background: rgba(0, 255, 180, 0.04);
        }
        .safe .top    { top: 0; left: 0; right: 0; height: 13%; }
        .safe .bottom { bottom: 0; left: 0; right: 0; height: 23%; }
        .safe .right  { top: 13%; bottom: 23%; right: 0; width: 12%; }

        .fixed-btn {
          position: fixed;
          top: 12px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .fixed-btn:hover { background: rgba(255,255,255,0.16); }
        .btn-audio { left: 12px; }
        .btn-safe  { right: 12px; }
        .btn-audio.on {
          background: rgba(120, 200, 255, 0.18);
          border-color: rgba(120, 200, 255, 0.45);
        }

        .hint {
          position: fixed;
          top: 48px;
          left: 12px;
          color: rgba(255,255,255,0.55);
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          z-index: 100;
          max-width: 220px;
          line-height: 1.35;
        }
      `}</style>

      <button
        className={`fixed-btn btn-audio ${audioOn ? "on" : ""}`}
        onClick={toggleAudio}
      >
        {audioOn ? "🔊" : "🔇"} {audioOn ? "Sound an" : "Sound starten"}
      </button>
      {!audioOn && (
        <div className="hint">
          Audio braucht einen Klick zum Start (Browser-Policy).
        </div>
      )}
      <button
        className="fixed-btn btn-safe"
        onClick={() => setShowSafe((v) => !v)}
      >
        Safe zones: {showSafe ? "ON" : "OFF"}
      </button>

      <div className="stage" ref={stageRef}>
        <canvas ref={canvasRef} />
        <div className="vignette" />

        <div className="head" ref={cap1Ref}>
          <div className="title">Chaos?</div>
        </div>

        <div className="kicker" ref={cap2Ref}>
          Nicht wirklich.
        </div>

        {showSafe && (
          <div className="safe">
            <div className="top">TikTok top UI (13%)</div>
            <div className="bottom">TikTok bottom UI (23%)</div>
            <div className="right">Action bar (12%)</div>
          </div>
        )}
      </div>
    </div>
  );
}