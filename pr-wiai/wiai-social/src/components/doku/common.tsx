import React from "react";
import { interpolate } from "remotion";
import { spaceMonoFamily } from "../../styles/fonts";
import {
  TERMINAL_GREEN,
  TERMINAL_AMBER,
  TERMINAL_RED,
  GLITCH_RED,
  GLITCH_CYAN,
} from "../../styles/colors";
import type { DokuColor } from "../../types";

// ── Safe zone for terminal-doku content ───────────────────────────────────
// Content stays above the lower third so that TikTok/YT caption/description
// overlays don't collide. Sides use the platform-standard 80% rule (108px).
export const DOKU_SAFE = {
  top: 170,      // extra breathing room above YT title strip
  bottom: 640,   // lower THIRD free for captions + platform UI
  left: 108,
  right: 108,
} as const;

// Helper: absolute inset style that matches the safe zone.
export const dokuSafeInset = {
  position: "absolute" as const,
  top: DOKU_SAFE.top,
  bottom: DOKU_SAFE.bottom,
  left: DOKU_SAFE.left,
  right: DOKU_SAFE.right,
};

// ── Color resolver ─────────────────────────────────────────────────────────
export function resolveDokuColor(c?: DokuColor): string {
  if (c === "amber") return TERMINAL_AMBER;
  if (c === "white") return "#ffffff";
  if (c === "red") return TERMINAL_RED;
  return TERMINAL_GREEN;
}

// CRT glow — text-shadow tuned per terminal color, inspired by Billboard neon
export function crtGlow(color: string, intensity = 1): string {
  if (intensity <= 0) return "none";
  const a = (0.55 * intensity).toFixed(2);
  const b = (0.25 * intensity).toFixed(2);
  return `0 0 8px ${color}${alphaSuffix(a)}, 0 0 24px ${color}${alphaSuffix(b)}`;
}

function alphaSuffix(a: string): string {
  // Convert 0–1 alpha → 2-digit hex (works because our colors are #RRGGBB)
  const v = Math.max(0, Math.min(255, Math.round(parseFloat(a) * 255)));
  return v.toString(16).padStart(2, "0");
}

// ── CRT flicker — short brightness dip on scene cuts ───────────────────────
// Pattern adapted from Billboard.neonTubeOn but compressed.
// Returns opacity multiplier 0..1 for `n` frames after `startFrame`.
export function crtFlicker(frame: number, startFrame: number, dur = 4): number {
  const t = frame - startFrame;
  if (t < 0 || t >= dur) return 1;
  const pattern = [0.25, 0.85, 0.55, 1];
  return pattern[t] ?? 1;
}

// ── Glow pulse — short brightness boost (e.g. for word emphasis) ───────────
// Returns 1.0..2.0 multiplier; ramps in over 8f, holds, fades over 12f.
export function glowPulse(frame: number, startFrame: number, dur = 28): number {
  const t = frame - startFrame;
  if (t < 0 || t >= dur) return 1;
  if (t < 8) return interpolate(t, [0, 8], [1, 2]);
  if (t < dur - 12) return 2;
  return interpolate(t, [dur - 12, dur], [2, 1]);
}

// ── Glitch field — chromatic shift + char scramble for `dur` frames ────────
// Use for in-place cell glitches (e.g. counter overflow, log line corruption).
const SCRAMBLE_CHARS = "▓▒░█▌▐│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼█▄▌▐▀";

export function scrambleText(seed: number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.abs(Math.floor(Math.sin((seed + i) * 91.7) * 10000)) % SCRAMBLE_CHARS.length;
    out += SCRAMBLE_CHARS[idx];
  }
  return out;
}

export interface GlitchFieldProps {
  text: string;
  frame: number;
  startFrame: number;
  durFrames?: number;     // default: 5
  color?: string;
  fontSize?: number;
  letterSpacing?: number;
}

export const GlitchField: React.FC<GlitchFieldProps> = ({
  text,
  frame,
  startFrame,
  durFrames = 5,
  color = TERMINAL_GREEN,
  fontSize = 64,
  letterSpacing = 0,
}) => {
  const t = frame - startFrame;
  const isGlitching = t >= 0 && t < durFrames;
  const display = isGlitching ? scrambleText(frame * 7, text.length) : text;
  const shiftX = isGlitching ? Math.sin(t * 13.7) * 6 : 0;
  const baseStyle: React.CSSProperties = {
    fontFamily: spaceMonoFamily,
    fontSize,
    letterSpacing,
    color,
    fontWeight: 700,
    whiteSpace: "pre",
  };
  if (!isGlitching) return <div style={{ ...baseStyle, textShadow: crtGlow(color, 0.6) }}>{display}</div>;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{ ...baseStyle, position: "absolute", inset: 0, color: GLITCH_RED, opacity: 0.45, transform: `translateX(${shiftX.toFixed(2)}px)` }}>{display}</div>
      <div style={{ ...baseStyle, position: "absolute", inset: 0, color: GLITCH_CYAN, opacity: 0.45, transform: `translateX(${(-shiftX).toFixed(2)}px)` }}>{display}</div>
      <div style={{ ...baseStyle, position: "relative", color }}>{display}</div>
    </div>
  );
};

// ── ASCII box — single or double frame around its children ─────────────────
// Box characters are rendered as text inside the box for authentic CRT feel.
// `width` = column width in monospace chars (0 = auto from children).
export interface AsciiBoxProps {
  title?: string;                    // optional title in top border (no decoration — box adds dashes)
  width: number;                     // total width in CHARACTERS (incl. borders)
  height?: number;                   // total height in LINES (incl. borders); default = autosize
  style?: "single" | "double";       // default: "single"
  color?: string;                    // text & border color
  fontSize?: number;                 // default: 28
  glow?: number;                     // 0..1; default: 0.7
  padding?: number;                  // inner padding in lines (default: 1)
  bodyLines?: string[];              // text-only body (recommended — guarantees border alignment)
  // For rich content (e.g. <span> with inline highlights), you can pass children. Each child is
  // rendered as ONE row, and you must size it yourself; box borders won't auto-align around it.
  children?: React.ReactNode;
}

// AsciiBox renders using CSS borders, NOT Unicode box-drawing chars.
// Reason: in Space Mono, glyphs like `─│┌` are visibly narrower than letters,
// so a mix of border-chars and body-text can't line up. CSS borders give us a
// pixel-perfect rectangle whose right edge stays fixed regardless of content.
// We keep the title "─── TITLE ───" look by overlaying a title label that sits
// on top of the top border, with a black background chip.
export const AsciiBox: React.FC<AsciiBoxProps> = ({
  title,
  width,
  height,
  style = "single",
  color = TERMINAL_GREEN,
  fontSize = 28,
  glow = 0.7,
  padding = 1,
  bodyLines,
  children,
}) => {
  const innerWidth = Math.max(2, width - 2); // chars reserved for body text
  const borderWidth = style === "double" ? 6 : 3;
  const lineHeightPx = Math.round(fontSize * 1.2);
  const charPx = fontSize * 0.6; // Space Mono ≈ 0.6×fontSize

  // Physical box dimensions
  const boxWidthPx = width * charPx;
  const innerHorizontalPadding = charPx; // 1-char gutter each side

  const baseStyle: React.CSSProperties = {
    fontFamily: spaceMonoFamily,
    fontSize,
    color,
    fontWeight: 600,
    lineHeight: `${lineHeightPx}px`,
    whiteSpace: "pre",
  };

  const useStrings = bodyLines !== undefined;
  const stringLines = bodyLines ?? [];
  const reactLines = useStrings ? [] : React.Children.toArray(children);
  const bodyLineCountValue = useStrings ? stringLines.length : reactLines.length;

  const targetBodyLines = height ? Math.max(0, height - 2 - padding * 2) : bodyLineCountValue;
  const fillerCount = Math.max(0, targetBodyLines - bodyLineCountValue);

  const blankLines = Array.from({ length: padding }, (_, i) => (
    <div key={`pad-${i}`} style={{ ...baseStyle, height: lineHeightPx }} />
  ));
  const fillerLines = Array.from({ length: fillerCount }, (_, i) => (
    <div key={`fill-${i}`} style={{ ...baseStyle, height: lineHeightPx }} />
  ));

  return (
    <div style={{
      position: "relative",
      display: "inline-block",
      width: boxWidthPx,
      border: `${borderWidth}px solid ${color}`,
      boxShadow: glow > 0
        ? `0 0 ${Math.round(16 * glow)}px ${hexWithAlpha(color, 0.35 * glow)}`
        : undefined,
    }}>
      {/* Title chip that sits over the top border */}
      {title && (
        <div style={{
          position: "absolute",
          top: -Math.round(fontSize * 0.65),
          left: charPx * 2,
          paddingLeft: Math.round(charPx * 0.4),
          paddingRight: Math.round(charPx * 0.4),
          background: "#0A0A0A",
          color,
          fontFamily: spaceMonoFamily,
          fontSize,
          fontWeight: 700,
          letterSpacing: 1,
          textShadow: crtGlow(color, glow),
          lineHeight: 1,
          whiteSpace: "pre",
        }}>
          {title}
        </div>
      )}
      <div style={{
        padding: `${lineHeightPx * padding}px ${innerHorizontalPadding}px`,
      }}>
        {blankLines.length > 0 && null /* padding already applied via padding prop on container */}
        {useStrings
          ? stringLines.map((line, i) => (
              <div key={`s-${i}`} style={{ ...baseStyle, textShadow: crtGlow(color, glow) }}>
                {padToWidth(line, innerWidth)}
              </div>
            ))
          : reactLines.map((node, i) => (
              <div key={`r-${i}`} style={{ ...baseStyle, textShadow: crtGlow(color, glow) }}>
                {node}
              </div>
            ))
        }
        {fillerLines}
      </div>
    </div>
  );
};

// Convert "#RRGGBB" + alpha 0..1 → "rgba(r,g,b,a)"
function hexWithAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return `rgba(0,255,65,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Pad / truncate a string to fill `width` columns (monospace assumption).
// Always enforces ONE leading space so body text never kisses the `│` border.
// If the caller already prefixed with a space, we don't double-pad.
function padToWidth(s: string, width: number): string {
  const padded = s.length === 0 || s.startsWith(" ") ? s : " " + s;
  if (padded.length >= width) return padded.substring(0, width);
  return padded + " ".repeat(width - padded.length);
}

// ── Slow cursor blink (1 cycle = 30f, 50% duty) ────────────────────────────
export function useSlowCursor(frame: number): boolean {
  return frame % 30 < 15;
}
