import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../../styles/fonts";
import type { DokuIntCounter } from "../../types";
import { TERMINAL_GREEN, TERMINAL_RED, GLITCH_RED, GLITCH_CYAN } from "../../styles/colors";
import { AsciiBox, crtGlow, scrambleText, dokuSafeInset } from "./common";

// Int16-Counter scene.
//
// Timeline (local frames):
//   0 .. SETTLE       — box appears, counter starts at startValue (slow)
//   SETTLE .. peakAt  — counter eases from startValue → peakValue (slow-to-fast)
//   peakAt .. flipAt  — counter holds at peakValue (the "Pause bei 32 767")
//   flipAt            — HARD CUT: value → overflowValue, color → red, glitch begins
//   flipAt .. flipAt+GLITCH_DUR — chromatic glitch over the whole box
//   flipAt+GLITCH_DUR .. end    — red box, value held, postOverflowExtras visible
//
// Layout: uniform monospace font in the box. Drama comes from color flip,
// glitch scramble, and chromatic-shift ghost layers — NOT from font-size jumps.
const SETTLE = 8;
const GLITCH_DUR = 6;
const POST_GLITCH_HOLD = 8;

const BOX_WIDTH = 28;
const FONT_SIZE = 48;

export const IntCounterScene: React.FC<{ scene: DokuIntCounter; localFrame?: number }> = ({ scene, localFrame }) => {
  const remotionFrame = useCurrentFrame();
  const frame = localFrame ?? remotionFrame;
  const totalDur = scene.durationFrames;
  const pauseAtPeak = scene.pauseAtPeak ?? 8;

  // Reserve frames for the post-overflow phase (extras visible, extras read-time)
  const POST_RESERVED = 50 + (scene.postOverflowExtras?.length ?? 0) * 8;

  // Layout: peakAt = end of count-up; flipAt = peakAt + pause
  const flipAt = Math.max(SETTLE + 30, totalDur - POST_RESERVED);
  const peakAt = Math.max(SETTLE + 20, flipAt - pauseAtPeak);

  // Compute current value
  let value: number;
  let postOverflow = false;

  if (frame < SETTLE) {
    value = scene.startValue;
  } else if (frame < peakAt) {
    const progress = (frame - SETTLE) / Math.max(1, peakAt - SETTLE);
    const eased = scene.countSpeed === "linear" ? progress : Math.pow(progress, 2.2);
    value = Math.floor(scene.startValue + (scene.peakValue - scene.startValue) * eased);
    if (value > scene.peakValue) value = scene.peakValue;
  } else if (frame < flipAt) {
    value = scene.peakValue;
  } else {
    value = scene.overflowValue;
    postOverflow = true;
  }

  const color = postOverflow ? TERMINAL_RED : TERMINAL_GREEN;
  const boxOpacity = interpolate(frame, [0, SETTLE], [0, 1], { extrapolateRight: "clamp" });

  // Glitch window after flip
  const glitchT = frame - flipAt;
  const isGlitching = glitchT >= 0 && glitchT < GLITCH_DUR;

  // Post-overflow extras fade in line by line
  const extrasStartFrame = flipAt + GLITCH_DUR + POST_GLITCH_HOLD;

  // Format value with German thousand separator (32.767 / -32.768)
  // During glitch: scramble the value text
  const formattedValue = formatInt(value);
  const valueDisplay = isGlitching
    ? scrambleText(frame * 13, formattedValue.length)
    : formattedValue;

  // Build box body — uniform width, no per-line size variation.
  // AsciiBox automatically prepends a leading space (padToWidth); we keep lines plain.
  const wertLine = `WERT: ${valueDisplay}`;
  const lines: string[] = [
    "",
    "FORMAT: INT16 (SIGNED)",
    "MAX:    32.767",
    "",
    wertLine,
    "",
  ];
  if (postOverflow && scene.postOverflowExtras) {
    scene.postOverflowExtras.forEach((extra, i) => {
      const extraStart = extrasStartFrame + i * 10;
      lines.push(frame >= extraStart ? extra : "");
    });
  }
  lines.push("");

  return (
    <div style={{
      ...dokuSafeInset,
      display: "flex", justifyContent: "center", alignItems: "center",
      opacity: boxOpacity,
    }}>
      <BoxLayer
        title={scene.boxTitle}
        color={color}
        glitchSeed={isGlitching ? frame : 0}
        isGlitching={isGlitching}
        bodyLines={lines}
      />
    </div>
  );
};

// Box wrapper that adds a chromatic-shift glitch overlay during overflow.
const BoxLayer: React.FC<{
  title: string;
  color: string;
  isGlitching: boolean;
  glitchSeed: number;
  bodyLines: string[];
}> = ({ title, color, isGlitching, glitchSeed, bodyLines }) => {
  const sx = isGlitching ? Math.sin(glitchSeed * 13.7) * 7 : 0;

  const renderBox = (overrideColor?: string, dx = 0, opa = 1, blend?: "screen") => (
    <div style={{
      position: blend ? "absolute" : "relative",
      inset: blend ? 0 : undefined,
      transform: dx ? `translateX(${dx.toFixed(2)}px)` : undefined,
      opacity: opa,
      mixBlendMode: blend,
      pointerEvents: "none",
    }}>
      <AsciiBox
        title={title}
        width={BOX_WIDTH}
        style="single"
        color={overrideColor ?? color}
        fontSize={FONT_SIZE}
        glow={isGlitching ? 1.2 : 0.85}
        padding={1}
        bodyLines={bodyLines}
      />
    </div>
  );

  if (!isGlitching) return renderBox();
  return (
    <div style={{ position: "relative" }}>
      {renderBox(GLITCH_RED, sx, 0.55, "screen")}
      {renderBox(GLITCH_CYAN, -sx, 0.55, "screen")}
      {renderBox()}
    </div>
  );
};

// Format Int16 with German thousand separator
function formatInt(n: number): string {
  const abs = Math.abs(n);
  const groups: string[] = [];
  let s = String(abs);
  while (s.length > 3) {
    groups.unshift(s.slice(-3));
    s = s.slice(0, -3);
  }
  groups.unshift(s);
  return (n < 0 ? "-" : "") + groups.join(".");
}
