#!/usr/bin/env node
// Offline audio render for the pendulum wave.
// Mirrors work/pendulum.jsx AudioEngine deterministically and writes a mono 16-bit WAV.
// Renders 30s (2x loop) and keeps the second 15s so tick decays from the pre-loop
// tail blend into the start — seamless loop for <Audio loop>.

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../assets/music/pendulum-ticks.wav");

const SR = 44100;
const LOOP_SEC = 15;
const DOUBLE_SEC = 30;
const N_TOTAL = Math.round(SR * DOUBLE_SEC);
const LOOP_SAMPLES = Math.round(SR * LOOP_SEC);

const N = 16;
const N_BASE = 14;
const AMPLITUDE = 0.36;
const AUDIO_L_CUTOFF = 0.28;

const PENTATONIC = [
  220.0, 261.63, 293.66, 329.63, 392.0,
  440.0, 523.25, 587.33, 659.25, 783.99,
  880.0, 1046.5, 1174.66, 1318.51, 1567.98,
  1760.0,
];

const buf = new Float32Array(N_TOTAL);

// ── Drone: A1 + A1-detuned + E2 → biquad lowpass → gain ──────────
// Louder, thicker (chorus via detuned A1), with 15s-loopable swell that
// peaks at sync moments (t=0, t=15). Slow LFO adds organic wobble.
{
  const f1 = 55.0;
  const f1b = 55.3;   // detuned for chorus thickness
  const f2 = 82.41;

  // RBJ biquad lowpass: fc=260 Hz (warmer than before), Q=0.7
  const fc = 260;
  const Q = 0.7;
  const w0 = (2 * Math.PI * fc) / SR;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * Q);
  const a0 = 1 + alpha;
  const b0 = ((1 - cosw0) / 2) / a0;
  const b1 = (1 - cosw0) / a0;
  const b2 = ((1 - cosw0) / 2) / a0;
  const a1 = (-2 * cosw0) / a0;
  const a2 = (1 - alpha) / a0;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

  const lfoF = 0.09;
  const lfoAmp = 0.04;
  const droneBase = 0.26;   // louder baseline
  const swellAmp = 0.12;    // ± swell around base
  const swellPeriod = LOOP_SEC; // one full cycle per loop → seamless
  const fadeInSec = 2.5;

  for (let n = 0; n < N_TOTAL; n++) {
    const t = n / SR;
    const raw =
      Math.sin(2 * Math.PI * f1 * t) +
      Math.sin(2 * Math.PI * f1b * t) * 0.7 +
      Math.sin(2 * Math.PI * f2 * t);
    // Apply biquad
    const y = b0 * raw + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = raw; y2 = y1; y1 = y;

    const fade = Math.min(1, t / fadeInSec);
    const lfo = lfoAmp * Math.sin(2 * Math.PI * lfoF * t);
    const swell = swellAmp * Math.cos(2 * Math.PI * t / swellPeriod);
    const gain = (droneBase + swell) * fade + lfo;
    buf[n] += y * gain * 0.36; // 0.36: compensate ~2.7 peak of sum-of-three-sines
  }
}

// ── Tick voices: sine + octave, exponential decay ────────────────
//
// Schedule: each pendulum i fires a tick at zero-crossing pos→neg.
// theta(t) = AMPLITUDE * cos(omega * t) goes positive→negative at
//   omega*t = π/2 + 2πk  →  t = T/(4(N_BASE+i)) + k · T/(N_BASE+i)
function scheduleTicks() {
  const ticks = [];
  for (let i = 0; i < N; i++) {
    const LRatio = Math.pow(N_BASE / (N_BASE + i), 2);
    if (LRatio < AUDIO_L_CUTOFF) continue;

    const volume = 0.34 * Math.pow(LRatio, 1.9);
    const pitch = PENTATONIC[i];
    const period = LOOP_SEC / (N_BASE + i); // seconds per full oscillation
    const first = period / 4;

    for (let t = first; t < DOUBLE_SEC; t += period) {
      ticks.push({ t, volume, pitch });
    }
  }
  return ticks;
}

function addTick(startT, volume, pitch) {
  const startSample = Math.round(startT * SR);
  const fundamentalDur = 0.55;
  const octaveDur = 0.55 * 0.35;
  const attackSec = 0.002;
  const attackSamples = Math.max(1, Math.round(attackSec * SR));
  const fundSamples = Math.round(fundamentalDur * SR);
  const octSamples = Math.round(octaveDur * SR);
  const totalSamples = Math.max(fundSamples, octSamples);
  // exponentialRampToValueAtTime mirrors: v(t) = start * (end/start)^(t/dur)
  const endGain = 0.0001;

  for (let k = 0; k < totalSamples; k++) {
    const n = startSample + k;
    if (n >= N_TOTAL) break;

    let env1 = 0;
    if (k < attackSamples) {
      env1 = volume * (k / attackSamples);
    } else if (k < fundSamples) {
      const prog = (k - attackSamples) / (fundSamples - attackSamples);
      env1 = volume * Math.pow(endGain / volume, prog);
    }

    let env2 = 0;
    if (k < attackSamples && k < octSamples) {
      env2 = (volume * 0.28) * (k / attackSamples);
    } else if (k < octSamples) {
      const prog = (k - attackSamples) / (octSamples - attackSamples);
      env2 = (volume * 0.28) * Math.pow(endGain / (volume * 0.28 + 1e-12), prog);
    }

    const tloc = k / SR;
    const s1 = Math.sin(2 * Math.PI * pitch * tloc) * env1;
    const s2 = Math.sin(2 * Math.PI * (pitch * 2) * tloc) * env2;
    buf[n] += s1 + s2;
  }
}

const ticks = scheduleTicks();
console.log(`ticks scheduled: ${ticks.length}`);
for (const { t, volume, pitch } of ticks) {
  addTick(t, volume, pitch);
}

// ── Extract second loop (samples [LOOP_SAMPLES, 2*LOOP_SAMPLES)) ─
const loopBuf = new Float32Array(LOOP_SAMPLES);
for (let i = 0; i < LOOP_SAMPLES; i++) loopBuf[i] = buf[LOOP_SAMPLES + i];

// ── Peak / normalize (soft) ──────────────────────────────────────
let peak = 0;
for (let i = 0; i < LOOP_SAMPLES; i++) {
  const a = Math.abs(loopBuf[i]);
  if (a > peak) peak = a;
}
console.log(`peak: ${peak.toFixed(3)}`);
const master = 0.9;
const scale = peak > 0 ? Math.min(1, master / peak) : 1;
console.log(`gain scale: ${scale.toFixed(3)}`);

// ── Write WAV: mono, 16-bit PCM @ 44100 ──────────────────────────
const dataBytes = LOOP_SAMPLES * 2;
const wav = Buffer.alloc(44 + dataBytes);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + dataBytes, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);       // PCM chunk size
wav.writeUInt16LE(1, 20);         // PCM format
wav.writeUInt16LE(1, 22);         // channels = 1
wav.writeUInt32LE(SR, 24);
wav.writeUInt32LE(SR * 2, 28);    // byte rate
wav.writeUInt16LE(2, 32);         // block align
wav.writeUInt16LE(16, 34);        // bits/sample
wav.write("data", 36);
wav.writeUInt32LE(dataBytes, 40);

for (let i = 0; i < LOOP_SAMPLES; i++) {
  let v = loopBuf[i] * scale;
  if (v > 1) v = 1; else if (v < -1) v = -1;
  wav.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
}

writeFileSync(OUT, wav);
console.log(`wrote ${OUT} (${(dataBytes / 1024).toFixed(1)} KB, ${LOOP_SEC}s)`);
