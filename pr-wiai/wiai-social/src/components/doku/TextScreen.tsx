import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../../styles/fonts";
import type { DokuTextScreen } from "../../types";
import { resolveDokuColor, crtGlow, useSlowCursor, dokuSafeInset, DOKU_SAFE, scrambleText } from "./common";

// Text screen with multiple layout/animation modes.
//
// enter modes:
//   instant     — all lines appear at frame 0 (or at perLineReveal[i])
//   slide-left  — lines slide in from right, staggered by appearDelay
//   typed       — classic typewriter, char-by-char
//
// Per-line overrides:
//   perLineReveal[i]  — explicit appear frame (instant mode only)
//   emphasisLines[i]  — larger font + brighter
//   subtitleLines[i]  — smaller font + dimmed (for labels like "TRUE STORY")
//
// glitchBeforeEnd: N — in the last N frames, emphasisLines get a brief CRT scramble
const FRAMES_PER_CHAR = 1;
const SLIDE_DURATION = 6;

export const TextScreenScene: React.FC<{ scene: DokuTextScreen; localFrame?: number }> = ({ scene, localFrame }) => {
  const remotionFrame = useCurrentFrame();
  const frame = localFrame ?? remotionFrame;
  const color = resolveDokuColor(scene.color);
  const enter = scene.enter ?? "instant";
  const delay = scene.appearDelay ?? 8;
  const align = scene.align ?? "center";
  const cursor = useSlowCursor(frame);

  // Per-line appear frame: perLineReveal takes priority, else stagger by delay
  const lineStarts = scene.lines.map((_, i) => scene.perLineReveal?.[i] ?? i * delay);

  // For typed mode: which line is currently being typed?
  const activeTypedLine = (() => {
    if (enter !== "typed") return -1;
    let last = -1;
    for (let i = 0; i < scene.lines.length; i++) {
      if (frame < lineStarts[i]) break;
      last = i;
      const t = frame - lineStarts[i];
      const chars = Math.min(scene.lines[i].length, Math.floor(t / FRAMES_PER_CHAR));
      if (chars < scene.lines[i].length) return i;
    }
    return last;
  })();

  // Glitch window near end of scene
  const glitchDur = scene.glitchBeforeEnd ?? 0;
  const glitchStart = scene.durationFrames - glitchDur;
  const isGlitching = glitchDur > 0 && frame >= glitchStart;
  const glitchT = isGlitching ? frame - glitchStart : 0;

  // Auto-shrink: base font scaled to longest non-subtitle line
  const usableWidth = 1080 - DOKU_SAFE.left - DOKU_SAFE.right;
  const contentLines = scene.lines.filter((_, i) => !scene.subtitleLines?.includes(i) && scene.lines[i] !== "");
  const maxChars = Math.max(1, ...contentLines.map(l => l.length));
  const baseFontSize = Math.min(80, Math.floor(usableWidth / (maxChars * 0.6)));
  const emphasisFontSize = Math.min(112, Math.floor(usableWidth / (maxChars * 0.6)));
  const subtitleFontSize = Math.round(baseFontSize * 0.55);

  const fsForLine = (i: number) => {
    if (scene.subtitleLines?.includes(i)) return subtitleFontSize;
    if (scene.emphasisLines?.includes(i)) return emphasisFontSize;
    return baseFontSize;
  };

  return (
    <div style={{
      ...dokuSafeInset,
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: align === "left" ? "flex-start" : "center",
      gap: 24,
    }}>
      {scene.lines.map((line, i) => {
        if (line === "") return <div key={i} style={{ height: baseFontSize * 0.5 }} />;
        const start = lineStarts[i];
        if (frame < start) return null;
        const t = frame - start;

        let display = line;
        let opacity = scene.subtitleLines?.includes(i) ? 0.45 : 1;
        let translateX = 0;

        if (enter === "slide-left") {
          translateX = interpolate(t, [0, SLIDE_DURATION], [120, 0], { extrapolateRight: "clamp" });
          opacity = interpolate(t, [0, SLIDE_DURATION], [0, 1], { extrapolateRight: "clamp" });
          if (scene.subtitleLines?.includes(i)) opacity *= 0.45;
        } else if (enter === "typed") {
          const chars = Math.min(line.length, Math.floor(t / FRAMES_PER_CHAR));
          display = line.substring(0, chars);
        } else if (enter === "instant") {
          // Fade in quickly (3f) from perLineReveal start
          opacity = interpolate(t, [0, 3], [0, scene.subtitleLines?.includes(i) ? 0.45 : 1], { extrapolateRight: "clamp" });
        }

        // Glitch on emphasisLines near end
        const isEmph = scene.emphasisLines?.includes(i);
        if (isGlitching && isEmph) {
          display = scrambleText(frame * 17 + i * 31, line.length);
          opacity = 0.7 + 0.3 * Math.sin(glitchT * 2.1);
        }

        const isActiveTyped = enter === "typed" && i === activeTypedLine;
        const lastTypedDone =
          enter === "typed" &&
          activeTypedLine === scene.lines.length - 1 &&
          frame - lineStarts[activeTypedLine] >= scene.lines[activeTypedLine].length * FRAMES_PER_CHAR;
        const showCursor = enter === "typed"
          ? (isActiveTyped && (lastTypedDone ? cursor : true))
          : false;

        return (
          <div key={i} style={{
            fontFamily: spaceMonoFamily,
            fontSize: fsForLine(i),
            color,
            fontWeight: scene.subtitleLines?.includes(i) ? 400 : 700,
            opacity,
            transform: `translateX(${translateX.toFixed(2)}px)`,
            textShadow: isEmph && !isGlitching
              ? crtGlow(color, 0.9)
              : crtGlow(color, scene.subtitleLines?.includes(i) ? 0.3 : 0.7),
            letterSpacing: 1,
            whiteSpace: "pre",
            textAlign: align === "left" ? "left" : "center",
          }}>
            {display}{showCursor ? "▋" : ""}
          </div>
        );
      })}
    </div>
  );
};
