import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

export interface LedPattern {
  frames: boolean[][][]; // [frameIndex][row][col]; static = single-element array
  fps?: number;          // animated pattern framerate (default: 4)
}

interface Props {
  accentColor: string;
  mode?: "s1" | "s2" | "s3";
  pattern?: LedPattern;    // sprite overlay; coexists with existing hash behavior
  endFlashAtFrame?: number; // mic-drop: LEDs ramp to 1.0, overlay drops, over 6f
  enterFrames?: number;     // staggered LED power-up at scene start (each LED at hash-based offset)
  enterOverdrive?: boolean; // brief brightness overshoot at entrance (1.0→1.5→1.0 over ~12f)
  exitAtFrame?: number;     // staggered LED power-down starting at this frame (18f total, hash-based)
  scrollSpeed?: number;     // rows/sec vertical scroll — bright bands sweep upward (0 or undefined = off)
}

const COLS = 24;
const ROWS = 48;
const CELL_W = 45;
const CELL_H = 40;
const LED_W = 38;
const LED_H = 33;

// ── Scroll blocks: 9:16 "video thumbnails" drifting upward ──────────────────
// cols = rows/2 → true 9:16 on screen (cell 45×40).  S=3×6, M=4×8, L=5×10.
// All blocks travel at the same scrollSpeed.  Flick blocks accelerate 8× when
// they reach FLICK_ROW (~30 % from bottom).  Dense layout for homogeneous fill.
const VIRTUAL_ROWS = 90;
const FLICK_ROW = 34;    // trigger row (30 % from bottom of 48)
const FLICK_ACCEL = 8;

interface ScrollBlock {
  col: number; row0: number; w: number; h: number;
  flick?: boolean;
}

const SCROLL_BLOCKS: ScrollBlock[] = [
  // lane 1 — cols 0-3
  { col: 0,  row0: 2,   w: 4, h: 8 },
  { col: 1,  row0: 22,  w: 3, h: 6 },
  { col: 0,  row0: 44,  w: 4, h: 8 },
  { col: 1,  row0: 64,  w: 3, h: 6 },
  { col: 0,  row0: 80,  w: 4, h: 8 },
  // lane 2 — cols 5-9
  { col: 5,  row0: 8,   w: 5, h: 10 },
  { col: 6,  row0: 30,  w: 3, h: 6 },
  { col: 5,  row0: 50,  w: 4, h: 8 },
  { col: 6,  row0: 70,  w: 3, h: 6 },
  // lane 3 — cols 10-14
  { col: 10, row0: 0,   w: 4, h: 8 },
  { col: 11, row0: 18,  w: 3, h: 6 },
  { col: 10, row0: 36,  w: 5, h: 10, flick: true },
  { col: 11, row0: 58,  w: 3, h: 6 },
  { col: 10, row0: 76,  w: 4, h: 8 },
  // lane 4 — cols 15-19
  { col: 15, row0: 6,   w: 3, h: 6 },
  { col: 15, row0: 24,  w: 5, h: 10 },
  { col: 16, row0: 46,  w: 4, h: 8 },
  { col: 15, row0: 66,  w: 3, h: 6,  flick: true },
  { col: 16, row0: 84,  w: 4, h: 8 },
  // lane 5 — cols 20-23
  { col: 20, row0: 12,  w: 4, h: 8 },
  { col: 21, row0: 32,  w: 3, h: 6 },
  { col: 20, row0: 52,  w: 4, h: 8 },
  { col: 21, row0: 72,  w: 3, h: 6 },
];

/** Compute block top-row for a given frame (stateless, wrapping). */
function blockTopRow(blk: ScrollBlock, f: number, spd: number): number {
  const rps = spd / 30; // rows per frame
  if (!blk.flick) {
    return ((blk.row0 - f * rps) % VIRTUAL_ROWS + VIRTUAL_ROWS) % VIRTUAL_ROWS;
  }
  // Per-cycle: normal scroll until FLICK_ROW, then accelerate
  const cycleLen = VIRTUAL_ROWS / rps;
  const cf = f % cycleLen;
  const triggerCf = ((blk.row0 - FLICK_ROW) % VIRTUAL_ROWS + VIRTUAL_ROWS) % VIRTUAL_ROWS / rps;
  if (cf < triggerCf) {
    return ((blk.row0 - cf * rps) % VIRTUAL_ROWS + VIRTUAL_ROWS) % VIRTUAL_ROWS;
  }
  return FLICK_ROW - (cf - triggerCf) * rps * FLICK_ACCEL;
}

export const LedWall: React.FC<Props> = ({ accentColor, mode = "s1", pattern, endFlashAtFrame, enterFrames, enterOverdrive, exitAtFrame, scrollSpeed }) => {
  const frame = useCurrentFrame();

  // ── Pattern frame selection (animated patterns cycle at pattern.fps) ──
  const hasPattern = !!pattern;
  const patternFrame = pattern
    ? pattern.frames.length > 1
      ? Math.floor((frame / 30) * (pattern.fps ?? 4)) % pattern.frames.length
      : 0
    : -1;

  // ── Mic-drop end flash ─────────────────────────────────────
  // Over 6 frames: all LEDs → opacity 1.0, overlay → 0
  const flashProgress = endFlashAtFrame !== undefined
    ? interpolate(frame, [endFlashAtFrame, endFlashAtFrame + 6], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  // Last 3f of flash: LEDs overpowered — blur fills gaps, brightness + bloom blow out
  const overpowerProgress = endFlashAtFrame !== undefined
    ? interpolate(frame, [endFlashAtFrame + 3, endFlashAtFrame + 6], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // ── Glitch (chromatic aberration via CSS drop-shadow) ──────
  // s1: subtle — every ~90f, 7f burst, 8px shift
  // s3: intense — every ~48f, 14f burst, 22px shift
  // s2: no glitch (all-dim, movement would look wrong)
  const glitchPeriod = mode === "s3" ? 48 : 90;
  const glitchBurst  = mode === "s3" ? 14 : 7;
  const maxShift     = mode === "s3" ? 22 : 8;
  const peakAlpha    = mode === "s3" ? 0.55 : 0.28;

  const withinPeriod = frame % glitchPeriod;
  const isGlitching  = mode !== "s2" && withinPeriod < glitchBurst;
  const t            = withinPeriod;
  const progress     = isGlitching ? 1 - t / glitchBurst : 0; // fade-out across burst
  const glitchX      = isGlitching ? Math.sin(t * 11.7) * maxShift : 0;
  const glitchY      = isGlitching ? Math.sin(t * 5.1) * 3 : 0;

  // CSS drop-shadow replicates chromatic aberration: red copy shifts +X, cyan copy shifts -X
  const ra = (progress * peakAlpha).toFixed(3);
  const ca = (progress * peakAlpha * 0.85).toFixed(3);
  const glitchFilter = isGlitching
    ? `drop-shadow(${glitchX.toFixed(1)}px ${glitchY.toFixed(1)}px 0 rgba(255,40,40,${ra})) ` +
      `drop-shadow(${(-glitchX * 0.75).toFixed(1)}px ${(-glitchY).toFixed(1)}px 0 rgba(40,255,255,${ca}))`
    : "none";
  // Overpower phase: combine existing glitch with brightness boost
  const ledFilter = overpowerProgress > 0
    ? (glitchFilter !== "none" ? `${glitchFilter} ` : "") + `brightness(${(1 + overpowerProgress * 6).toFixed(2)})`
    : glitchFilter;

  // ── Entrance overdrive: LEDs briefly brighter than target, then settle ──
  const overdriveBoost = enterOverdrive
    ? interpolate(frame, [2, 5, 14], [1.0, 1.5, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const overdriveOverlayDip = enterOverdrive
    ? interpolate(frame, [2, 5, 14], [0, 0.25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  // ── Overlay darkness per mode (fades to 0 during end flash) ─
  const overlayBase = (mode === "s3" ? 0.55 : mode === "s2" ? 0.75 : 0.60) * (1 - flashProgress) * (1 - overdriveOverlayDip);
  const oc = (v: number) => Math.min(1, overlayBase * v).toFixed(2);

  // ── LED rects ─────────────────────────────────────────────
  const leds: React.ReactNode[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const n = Math.sin(row * 127.1 + col * 311.7) * 43758.5453;
      const hash = n - Math.floor(n);

      // Staggered scene-in: each LED powers up at a hash-based offset
      // hash=0 → on by frame (enterFrames*0.4), hash=1 → on by frame enterFrames
      const sceneInFactor = enterFrames
        ? Math.min(1, Math.max(0, (frame - hash * enterFrames * 0.6) / (enterFrames * 0.4)))
        : 1;
      // Staggered scene-exit: each LED powers down at a hash-based delay (18f total window)
      const exitFactor = exitAtFrame !== undefined && frame >= exitAtFrame
        ? Math.min(1, Math.max(0, 1 - (frame - exitAtFrame - hash * 10.8) / 7.2))
        : 1;

      // Pattern: sprite LEDs only visible in s1 mode (Act1 backdrop)
      const isSpriteLed = mode === "s1" && patternFrame >= 0
        && pattern!.frames[patternFrame][row]?.[col] === true;

      let opacity: number;
      if (isSpriteLed) {
        opacity = 0.45;
      } else if (hasPattern && mode === "s1") {
        opacity = 0.02;
      } else if (mode === "s3") {
        // s3: bright wall (scroll blocks add subtle variation below)
        if (hash < 0.08) {
          const phase = (Math.sin(row * 7.11 + col * 3.17) * 43758.5) % (Math.PI * 2);
          opacity = ((Math.sin(frame * 0.1 + phase) + 1) / 2) * 0.30 + 0.62;
        } else {
          opacity = 0.78;
        }
      } else if (scrollSpeed) {
        // s1 + s2 with scroll: near-black background so blocks pop
        opacity = 0.01;
      } else if (mode === "s2") {
        opacity = 0.03;
      } else {
        // s1 normal (no scroll)
        if (hash < 0.65) {
          opacity = 0.03;
        } else if (hash < 0.80) {
          const phase = (Math.sin(row * 7.11 + col * 3.17) * 43758.5) % (Math.PI * 2);
          opacity = ((Math.sin(frame * 0.08 + phase) + 1) / 2) * 0.48 + 0.04;
        } else {
          opacity = 0.55;
        }
      }

      // Scroll blocks: light up LEDs inside visible 9:16 thumbnails
      if (scrollSpeed) {
        for (const blk of SCROLL_BLOCKS) {
          let top = blockTopRow(blk, frame, scrollSpeed);
          // Unwrap: block partially above viewport wraps to high value — map back to negative
          if (top > VIRTUAL_ROWS - blk.h) top -= VIRTUAL_ROWS;
          if (top < -blk.h || top > ROWS) continue;
          if (col >= blk.col && col < blk.col + blk.w
            && row >= top && row < top + blk.h) {
            // All modes: soft clip at top edge, fade in from bottom
            const fadeOut = Math.min(1, row / 6);            // rows 0–6 dissolve
            const fadeIn  = Math.min(1, (ROWS - row) / 3);  // rows 45–48 ramp up
            if (mode === "s2") {
              opacity = (0.10 + hash * 0.05) * fadeIn * fadeOut;
            } else if (mode === "s3") {
              opacity = 0.78 + (0.10 + hash * 0.06) * fadeOut;
            } else {
              // s1
              opacity = (0.12 + hash * 0.06) * fadeOut;
            }
            break;
          }
        }
      }

      // Scroll intro: bright wall → fades to reveal boxes (~150ms = 5 frames)
      if (scrollSpeed && mode === "s1") {
        const introBlend = Math.min(1, frame / 5);
        opacity = opacity * introBlend + 0.55 * (1 - introBlend);
      }

      // End flash / scene-in / scene-exit / overdrive combined
      const finalOpacity = Math.min(1, (flashProgress > 0
        ? opacity + (1.0 - opacity) * flashProgress
        : opacity) * sceneInFactor * exitFactor * overdriveBoost);

      const x = col * CELL_W + (CELL_W - LED_W) / 2;
      const y = row * CELL_H + (CELL_H - LED_H) / 2;
      leds.push(
        <rect
          key={`${row}-${col}`}
          x={x} y={y}
          width={LED_W} height={LED_H}
          fill={accentColor}
          opacity={finalOpacity}
        />
      );
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      {/* LED SVG — glitch applied as CSS chromatic aberration (drop-shadow) */}
      <div style={{ position: "absolute", inset: 0, filter: ledFilter }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="lw-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={5 + overpowerProgress * 50} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#lw-glow)">{leds}</g>
        </svg>
      </div>

      {/* Overpower bloom — fills LED gaps, blows out to blinding yellow-white */}
      {overpowerProgress > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(255, 248, 200, ${(overpowerProgress * 0.85).toFixed(2)})`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Dark gradient overlay — weighted toward text zones */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom,
            rgba(10,10,10,${oc(0.96)}) 0%,
            rgba(10,10,10,${oc(0.83)}) 30%,
            rgba(10,10,10,${oc(1.04)}) 60%,
            rgba(10,10,10,${oc(1.17)}) 85%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
