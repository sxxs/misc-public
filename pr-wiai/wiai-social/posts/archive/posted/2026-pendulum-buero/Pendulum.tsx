import React, { useEffect, useRef } from "react";
import { Audio, Loop, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";

// ── Pendulum wave ─────────────────────────────────────────────────────────
// 15s perfect loop. Canvas redrawn each frame from pure computeBobs(t).
// Captions + wordmark stay permanently visible → seamless loop.
//
// Physics: N pendulums, each completing (N_BASE + i) swings in LOOP_SEC.
// Audio (pre-rendered WAV from scripts/render-pendulum-audio.mjs):
//   drone A1 + detuned A1 + E2 through lowpass + LFO + 15s swell envelope,
//   plus pentatonic ticks on zero crossings. Drone peaks at sync moments.

const N = 16;
const LOOP_SEC = 15;
const N_BASE = 14;
const AMPLITUDE = 0.36;

const W = 1080;
const H = 1920;
const GHOST_STEPS = 6;
const GHOST_FRAME_STRIDE = 1.2;

function computeBobs(t: number) {
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
    };
  }
  return bobs;
}

const PendulumCanvas: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Slight navy-tinted base, not deep black
    ctx.fillStyle = "#0a0e18";
    ctx.fillRect(0, 0, W, H);

    const t = (frame / fps) % LOOP_SEC;

    // Subtle breathing background glow — peaks at sync moments (t=0, t=15)
    const pulse = 0.5 + 0.5 * Math.cos((2 * Math.PI * t) / LOOP_SEC);
    const bg = ctx.createRadialGradient(
      W / 2, H * 0.42, W * 0.1,
      W / 2, H * 0.42, W * 1.0
    );
    bg.addColorStop(0, `rgba(70, 95, 165, ${0.07 * pulse})`);
    bg.addColorStop(0.55, `rgba(45, 60, 110, ${0.04 * pulse})`);
    bg.addColorStop(1, "rgba(10, 14, 24, 0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const bobs = computeBobs(t);
    const anchorY = bobs[0].ay;
    const firstX = bobs[0].ax;
    const lastX = bobs[N - 1].ax;

    // Ceiling bar — thicker, brighter
    ctx.strokeStyle = "rgba(235, 238, 245, 0.55)";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(firstX - W * 0.03, anchorY);
    ctx.lineTo(lastX + W * 0.03, anchorY);
    ctx.stroke();

    // Ghost trail — older t-values, fading glow
    for (let g = GHOST_STEPS; g >= 1; g--) {
      const dt = (g * GHOST_FRAME_STRIDE) / fps;
      const tg = (t - dt + LOOP_SEC) % LOOP_SEC;
      const ghost = computeBobs(tg);
      const alpha = 0.08 * (1 - g / (GHOST_STEPS + 1));
      const r = Math.min(W, H) * 0.018;
      for (const b of ghost) {
        ctx.fillStyle = `rgba(255, 245, 220, ${alpha})`;
        ctx.beginPath();
        ctx.arc(b.bx, b.by, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Wave curve through bobs
    ctx.strokeStyle = "rgba(255, 245, 220, 0.1)";
    ctx.lineWidth = 1;
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
      // Anchor dot — brighter, larger
      ctx.fillStyle = "rgba(240, 240, 250, 0.8)";
      ctx.beginPath();
      ctx.arc(b.ax, b.ay, 4, 0, Math.PI * 2);
      ctx.fill();

      // String — thicker, brighter
      ctx.strokeStyle = "rgba(220, 222, 235, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.ax, b.ay);
      ctx.lineTo(b.bx, b.by);
      ctx.stroke();

      const glow = ctx.createRadialGradient(b.bx, b.by, 0, b.bx, b.by, haloR);
      glow.addColorStop(0, "rgba(255, 245, 220, 0.5)");
      glow.addColorStop(0.4, "rgba(255, 245, 220, 0.17)");
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

    // Vignette — darken edges so captions pop
    const vign = ctx.createRadialGradient(
      W / 2, H * 0.42, W * 0.3,
      W / 2, H * 0.42, W * 1.1
    );
    vign.addColorStop(0, "rgba(0,0,0,0)");
    vign.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);
  }, [frame, fps]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
};

export const Pendulum: React.FC = () => {
  return (
    <div
      style={{
        width: W,
        height: H,
        background: "#0a0e18",
        position: "relative",
        fontFamily: spaceGroteskFamily,
      }}
    >
      <PendulumCanvas />

      {/* Top caption — POV framing, tucked just above the anchor bar (y≈461) */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 108,
          right: 108,
          textAlign: "center",
          fontFamily: spaceGroteskFamily,
          fontSize: 48,
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
          letterSpacing: "-0.01em",
          textShadow: "0 4px 18px rgba(0,0,0,0.8)",
        }}
      >
        POV: Ich räume mein Büro auf.
      </div>

      {/* Punchline: "Ordnung." — big, white, emphatic */}
      <div
        style={{
          position: "absolute",
          top: 1300,
          left: 108,
          right: 108,
          textAlign: "center",
          fontFamily: spaceGroteskFamily,
          fontSize: 140,
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          textShadow: "0 6px 32px rgba(0,0,0,0.92)",
        }}
      >
        Ordnung.
      </div>

      {/* Sub-punchline — smaller, delivers the twist */}
      <div
        style={{
          position: "absolute",
          top: 1470,
          left: 108,
          right: 108,
          textAlign: "center",
          fontFamily: spaceGroteskFamily,
          fontSize: 58,
          fontWeight: 500,
          color: "rgba(255,255,255,0.78)",
          letterSpacing: "-0.01em",
          lineHeight: 1,
          textShadow: "0 4px 18px rgba(0,0,0,0.85)",
        }}
      >
        Zumindest kurz.
      </div>

      {/* Wordmark — tucked close under sub-punchline so TikTok caption bar won't overlay */}
      <div
        style={{
          position: "absolute",
          top: 1570,
          left: 108,
          right: 108,
          textAlign: "center",
          fontFamily: spaceMonoFamily,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.32)",
            letterSpacing: "0.15em",
            marginBottom: 6,
          }}
        >
          WIAI · UNI BAMBERG
        </div>
        <div
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.58)",
            letterSpacing: "0.08em",
          }}
        >
          @echt.bamberg
        </div>
      </div>

      <Loop durationInFrames={Math.round(LOOP_SEC * 30)}>
        <Audio src={staticFile("music/pendulum-ticks.wav")} volume={1.0} />
      </Loop>
    </div>
  );
};
