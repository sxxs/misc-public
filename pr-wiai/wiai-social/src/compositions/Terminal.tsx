import React, { useMemo } from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { BLACK, TERMINAL_GREEN, TERMINAL_AMBER } from "../styles/colors";
import { spaceMonoFamily, spaceGroteskFamily } from "../styles/fonts";
import { scanlineGradient } from "../styles/textures";
import { TerminalFlow } from "../components/TerminalFlow";
import {
  TERMINAL_ACT1_DURATION,
  TERMINAL_ACT3_DURATION,
  buildTypingSchedule,
  scheduleFrames,
  TypingAction,
} from "../utils/timing";

// ── Color resolver ──────────────────────────────────────────────────────────
function resolveTerminalColor(color?: "green" | "amber" | "white"): string {
  if (color === "amber") return TERMINAL_AMBER;
  if (color === "white") return "#ffffff";
  return TERMINAL_GREEN; // default
}

// ── Shared wrapper: solid black + subtle scanlines ──────────────────────────
const TerminalFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, background: BLACK }}>
    {children}
    {/* CRT scanlines — very subtle */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: scanlineGradient(0.06),
        pointerEvents: "none",
      }}
    />
  </div>
);

// ── PDF form flash — stylized document shape that glitches away ─────────────
const PdfFormFlash: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  // Form visible: fade in 0–3, hold until 36, glitch out 36–44
  const opacity = interpolate(frame, [0, 3, 36, 44], [0, 0.85, 0.85, 0], { extrapolateRight: "clamp" });
  if (opacity <= 0) return null;
  // Glitch ramps up as form disappears
  const glitch = interpolate(frame, [34, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gx = Math.sin(frame * 19.3) * glitch * 60;
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      paddingTop: 80,
      opacity,
      transform: `translateX(${gx.toFixed(1)}px)`,
      filter: glitch > 0.1
        ? `drop-shadow(${(gx * 0.5).toFixed(1)}px 0 0 rgba(255,40,40,0.6)) drop-shadow(${(-gx * 0.4).toFixed(1)}px 0 0 rgba(40,255,255,0.5))`
        : "none",
    }}>
      {/* Stylized document */}
      <div style={{
        width: 380, height: 500,
        border: `3px solid ${color}`,
        borderRadius: 6,
        padding: "40px 32px",
        display: "flex", flexDirection: "column", gap: 28,
        boxShadow: `0 0 40px ${color}22, inset 0 0 20px ${color}08`,
      }}>
        {/* Header bar */}
        <div style={{ width: "60%", height: 22, background: color, borderRadius: 3, opacity: 0.8 }} />
        {/* Form field lines */}
        {[0.9, 0.75, 0.85, 0.5, 0.7].map((w, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ width: `${w * 40}%`, height: 10, background: `${color}55`, borderRadius: 2 }} />
            <div style={{ width: `${w * 100}%`, height: 3, background: `${color}33`, borderRadius: 1 }} />
          </div>
        ))}
        {/* Checkbox row */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 8 }}>
          <div style={{ width: 22, height: 22, border: `2px solid ${color}88`, borderRadius: 3 }} />
          <div style={{ width: "50%", height: 10, background: `${color}44`, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
};

// ── Slow cursor — ~1s cycle (30f) ──────────────────────────────────────────
const useSlowCursor = (frame: number) => frame % 30 < 15;

// ── Act1: Line-by-line mode — lines pop in sequentially, left-aligned ──────
// Supports pause markers: "|" pauses for lineByLineDelay frames,
// "|30" pauses for exactly 30 frames. Use to control reveal timing.
// Lines starting with "+" appear at the same time as the previous line (grouping).
// Lines starting with "~" type out character by character (2 frames/char).
const TYPING_FRAMES_PER_CHAR = 2;

const TerminalAct1LineByLine: React.FC<{ post: Post; color: string }> = ({ post, color }) => {
  const frame = useCurrentFrame();
  const text = post.content.act1Setup ?? "$";
  const delay = post.terminal?.lineByLineDelay ?? 16;

  // Split by \n, build entries with cumulative timing
  const rawLines = text.split("\n");

  let cumFrame = 0;
  let lastAppearAt = 0;
  const entries = rawLines.map((line) => {
    const trimmed = line.trim();
    const pauseMatch = trimmed.match(/^\|(\d+)?$/);

    if (pauseMatch) {
      // Pause marker: |30 = 30 frames, | = default delay
      const pauseDur = pauseMatch[1] ? parseInt(pauseMatch[1], 10) : delay;
      cumFrame += pauseDur;
      return { text: "", isBlank: false, isPause: true, isTyped: false, appearAt: -1 };
    }

    const isBlank = trimmed === "";
    if (isBlank) {
      return { text: line, isBlank: true, isPause: false, isTyped: false, appearAt: -1 };
    }

    // + prefix: appear at same time as previous content line (grouping)
    const isGrouped = trimmed.startsWith("+");
    if (isGrouped) {
      const gText = line.replace(/^\+/, "");
      return { text: gText, isBlank: false, isPause: false, isTyped: false, appearAt: lastAppearAt };
    }

    // ~ prefix: type out character by character
    const isTyped = trimmed.startsWith("~");
    if (isTyped) {
      const tText = line.replace(/^~/, "");
      const typingDur = tText.length * TYPING_FRAMES_PER_CHAR;
      const appearAt = cumFrame;
      lastAppearAt = appearAt;
      cumFrame += typingDur;
      return { text: tText, isBlank: false, isPause: false, isTyped: true, appearAt };
    }

    const appearAt = cumFrame;
    lastAppearAt = appearAt;
    cumFrame += delay;
    return { text: line, isBlank: false, isPause: false, isTyped: false, appearAt };
  });

  const cursorOn = useSlowCursor(frame);
  // Find the last visible content entry (by array index) for cursor placement
  let latestVisibleIdx = -1;
  for (let idx = 0; idx < entries.length; idx++) {
    const e = entries[idx];
    if (!e.isBlank && !e.isPause && frame >= e.appearAt) latestVisibleIdx = idx;
  }

  return (
    <TerminalFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "300px 108px 400px 108px",
        }}
      >
        {entries.map((entry, i) => {
          if (entry.isPause) return null;

          if (entry.isBlank) {
            // Blank line = spacer, visible only when next content line is visible
            const nextContent = entries.find((e, j) => j > i && !e.isBlank && !e.isPause);
            if (nextContent && frame < nextContent.appearAt) return null;
            return <div key={i} style={{ height: 46 }} />;
          }

          // Not yet visible
          if (frame < entry.appearAt) return null;

          const localFrame = frame - entry.appearAt;
          const isPrompt = !entry.isTyped && entry.appearAt === 0 && entry.text.startsWith(">");
          const isAlert = entry.text.startsWith("!");
          const rawText = isAlert ? entry.text.slice(1) : entry.text;

          // Typed lines: reveal characters progressively
          const displayText = entry.isTyped
            ? rawText.substring(0, Math.min(rawText.length, Math.floor(localFrame / TYPING_FRAMES_PER_CHAR)))
            : rawText;

          // Pop-in flash (only for non-typed lines)
          const flash = entry.isTyped ? 1 : interpolate(localFrame, [0, 2, 6], [1.3, 1.1, 1], { extrapolateRight: "clamp" });

          // Alert lines: red, pulsing glow
          const alertColor = "#EF4444";
          const alertPulse = isAlert
            ? 0.7 + 0.3 * Math.sin(frame * 0.2)
            : 1;
          const lineColor = isAlert ? alertColor : color;
          const lineGlow = isAlert
            ? `0 0 ${Math.round(30 + 15 * Math.sin(frame * 0.2))}px ${alertColor}80`
            : `0 0 ${Math.round(20 * flash)}px ${color}50`;

          return (
            <div
              key={i}
              style={{
                fontFamily: spaceMonoFamily,
                fontSize: isPrompt ? 50 : 62,
                fontWeight: isPrompt ? 400 : 700,
                color: lineColor,
                lineHeight: 1.5,
                opacity: isPrompt ? 0.6 : Math.min(1, flash) * alertPulse,
                textShadow: lineGlow,
                whiteSpace: "pre-wrap",
              }}
            >
              {displayText}
              {i === latestVisibleIdx && (
                <span style={{ color, opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>
              )}
            </div>
          );
        })}
      </div>
    </TerminalFrame>
  );
};

// ── Act1: Form appears → text fades in OVER the form → form glitches away ──
const TerminalAct1: React.FC<{ post: Post; color: string }> = ({ post, color }) => {
  // Line-by-line mode: delegate to dedicated component
  if (post.terminal?.act1Style === "lineByLine") {
    return <TerminalAct1LineByLine post={post} color={color} />;
  }

  const frame = useCurrentFrame();
  const prompt = post.content.act1Setup ?? "$";
  const hasFlash = post.terminal?.hookFlash === "pdf-form";
  // Text appears at frame 10 while form is still visible (form glitches at 36–44)
  const textDelay = hasFlash ? 10 : 0;
  const fadeIn = interpolate(frame, [textDelay, textDelay + 5], [0, 1], { extrapolateRight: "clamp" });
  const cursorOn = hasFlash ? false : useSlowCursor(frame); // no cursor on hook

  // Text glitch on entrance
  const textGlitch = hasFlash
    ? interpolate(frame, [textDelay, textDelay + 2, textDelay + 8], [0.7, 0.5, 0], { extrapolateRight: "clamp" })
    : 0;
  const tgx = Math.sin(frame * 23.1) * textGlitch * 40;

  return (
    <TerminalFrame>
      {/* Form — centered slightly below mid, z:1, appears first */}
      {hasFlash && <PdfFormFlash frame={frame} color={color} />}

      {/* Text — centered above form, z:2, fades in while form still visible */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 780,
          opacity: fadeIn,
          zIndex: 2,
          ...(textGlitch > 0.01 ? {
            filter: `drop-shadow(${tgx.toFixed(1)}px 0 0 rgba(255,40,40,${(textGlitch * 0.7).toFixed(2)})) drop-shadow(${(-tgx * 0.6).toFixed(1)}px 0 0 rgba(40,255,255,${(textGlitch * 0.6).toFixed(2)}))`,
          } : {}),
        }}
      >
        <div
          style={{
            fontFamily: spaceMonoFamily,
            fontSize: 64,
            fontWeight: 700,
            color,
            lineHeight: 1.5,
            textShadow: `0 0 30px ${color}40`,
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}
        >
          {prompt}
          {cursorOn !== false && <span style={{ opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>}
        </div>
      </div>
    </TerminalFrame>
  );
};

// ── Accelerating typing: starts slow, speeds up, stops abruptly ────────────
function accelTypingChars(textLength: number, localFrame: number, typingFrames: number): number {
  if (localFrame <= 0) return 0;
  if (localFrame >= typingFrames) return textLength;
  // Quadratic easing (accelerates): progress = (t/T)^1.8
  const t = localFrame / typingFrames;
  return Math.min(textLength, Math.floor(textLength * Math.pow(t, 1.8)));
}

// ── Act2: Escalate mode — staircase with accelerating typing ───────────────
const TerminalAct2Escalate: React.FC<{ post: Post; color: string; duration: number }> = ({ post, color, duration }) => {
  const frame = useCurrentFrame();
  const paragraphs = post.content.act2.split("\n\n");
  const n = paragraphs.length;
  const perParagraph = Math.floor(duration / n);

  // Staircase layout: growing gaps, accounting for text wrapping
  const startY = 280;
  const containerWidth = 792; // 1080 - 108 (left) - 180 (right)

  const yPositions: number[] = [];
  let cumY = startY;
  for (let i = 0; i < n; i++) {
    yPositions.push(cumY);
    const t = n > 1 ? i / (n - 1) : 1;
    const fs = 48 + t * 20;
    const charWidth = fs * 0.6; // monospace char width estimate
    // Count actual rendered lines: explicit \n + word-wrap overflow
    const explicitLines = paragraphs[i] ? paragraphs[i].split("\n") : [""];
    let totalLines = 0;
    for (const line of explicitLines) {
      const lineWidth = line.length * charWidth;
      totalLines += Math.max(1, Math.ceil(lineWidth / containerWidth));
    }
    const textHeight = totalLines * fs * 1.4;
    const gap = 55 + 12 * i; // growing whitespace
    cumY += textHeight + gap;
  }

  return (
    <TerminalFrame>
      <div style={{ position: "absolute", inset: 0, padding: "0 108px 0" }}>
        {paragraphs.map((text, i) => {
          const appearFrame = i * perParagraph;
          if (frame < appearFrame) return null;
          const localFrame = frame - appearFrame;

          // Escalation: size 48→68, opacity 0.55→1.0
          const t = n > 1 ? i / (n - 1) : 1;
          const fontSize = Math.round(48 + t * 20);
          const colorOpacity = 0.55 + t * 0.45;
          const glowStrength = Math.round(12 + t * 28);

          // Accelerating typing: uses ~65% of slot for typing, rest is hold
          const plainChars = text.replace(/\n/g, "").length;
          const typingFrames = Math.floor(perParagraph * 0.65);
          const visibleCount = accelTypingChars(plainChars, localFrame, typingFrames);

          // Map visible non-newline count back to string slice
          let nonNl = 0;
          let sliceEnd = 0;
          for (let c = 0; c < text.length; c++) {
            if (text[c] !== "\n") nonNl++;
            if (nonNl > visibleCount) break;
            sliceEnd = c + 1;
          }
          const visibleText = text.slice(0, sliceEnd);
          const allRevealed = visibleCount >= plainChars;
          const cursorOn = allRevealed ? true : useSlowCursor(frame);

          // Subtle flash on typing completion — brief brightness boost
          const justFinished = allRevealed && localFrame < typingFrames + 6;
          const flashBright = justFinished
            ? interpolate(localFrame, [typingFrames, typingFrames + 2, typingFrames + 6], [0, 0.25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
            : 0;
          const flashOpacity = Math.min(1, colorOpacity + flashBright);

          return (
            <div key={i} style={{
              position: "absolute",
              top: yPositions[i],
              left: 108,
              right: 180,
              opacity: flashOpacity,
            }}>
              <div style={{
                fontFamily: spaceMonoFamily,
                fontSize,
                fontWeight: 700,
                color,
                lineHeight: 1.4,
                textShadow: `0 0 ${glowStrength}px ${color}40`,
                whiteSpace: "pre-wrap",
              }}>
                {visibleText}
                {/* Show cursor only on the currently typing paragraph */}
                {i === Math.min(Math.floor(frame / perParagraph), n - 1) && (
                  <span style={{ opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </TerminalFrame>
  );
};

// ── Replay a typing schedule up to `elapsed` frames → visible text ────────
function replayTypingSchedule(actions: TypingAction[], elapsed: number): { text: string; done: boolean } {
  let text = "";
  let t = 0;
  for (const a of actions) {
    if (t >= elapsed) return { text, done: false };
    switch (a.t) {
      case "c":
        if (t + a.dur > elapsed) { text += a.ch; return { text, done: false }; }
        text += a.ch;
        t += a.dur;
        break;
      case "w":
        if (t + a.dur > elapsed) { text += a.ch; return { text, done: false }; }
        text += a.ch;
        t += a.dur;
        break;
      case "b":
        text = text.slice(0, -1);
        if (t + a.dur > elapsed) return { text, done: false };
        t += a.dur;
        break;
      case "p":
        if (t + a.dur > elapsed) return { text, done: false };
        t += a.dur;
        break;
    }
  }
  return { text, done: true };
}

// ── Act2: Typing with typos + irregular speed (default) ──────────────────
const TerminalAct2: React.FC<{ post: Post; color: string; duration: number }> = ({ post, color, duration }) => {
  const frame = useCurrentFrame();
  const containerFadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  if (post.terminal?.act2Style === "escalate") {
    return <TerminalAct2Escalate post={post} color={color} duration={duration} />;
  }

  const schedule = useMemo(
    () => buildTypingSchedule(post.content.act2, 73, 5.0),
    [post.content.act2],
  );
  const startFrame = 6;
  const { text: visibleText, done } = replayTypingSchedule(schedule, Math.max(0, frame - startFrame));
  const cursorOn = done ? true : frame % 16 < 8;

  return (
    <TerminalFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 200px 300px 108px",
          opacity: containerFadeIn,
        }}
      >
        <div
          style={{
            fontFamily: spaceMonoFamily,
            fontSize: 62,
            fontWeight: 400,
            color,
            lineHeight: 1.6,
            letterSpacing: "-0.01em",
            whiteSpace: "pre-wrap",
            textShadow: `0 0 20px ${color}26`,
          }}
        >
          {visibleText}
          <span style={{ opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>
        </div>
      </div>
    </TerminalFrame>
  );
};

// ── Aside: spaced caps typewriter with hyphenation ─────────────────────────
const TerminalAsideTyped: React.FC<{ text: string; color: string; frame: number; startFrame: number }> = ({ text, color, frame, startFrame }) => {
  const elapsed = frame - startFrame;
  if (elapsed < 0) return null;
  // "Digitalisierung." → line1: "DIGITALI-", line2: "SIERUNG ."
  const upper = text.toUpperCase().replace(/\.$/, "");
  const breakAt = 8;
  const line1Chars = upper.slice(0, breakAt).split("");
  const line2Chars = upper.slice(breakAt).split("");
  // Total chars to type: line1 + hyphen + line2 + dot = all display chars
  const allChars = [...line1Chars, " -", ...line2Chars, ".", ".", "."];
  const totalChars = allChars.length;

  // Fast irregular typing: 1-2 frames per char
  let frameAccum = 0;
  let revealed = 0;
  for (let i = 0; i < totalChars; i++) {
    const delay = (i * 7 + 3) % 4 < 1 ? 2 : 1; // mostly 1f, occasional 2f
    frameAccum += delay;
    if (frameAccum > elapsed) break;
    revealed = i + 1;
  }

  // Build display: line1 chars spaced, then hyphen, then newline, then line2 chars spaced, then dot
  const line1Visible = Math.min(line1Chars.length, revealed);
  const hyphenVisible = revealed > line1Chars.length;
  const line2Start = line1Chars.length + 1; // after " -"
  const line2Visible = Math.max(0, Math.min(line2Chars.length, revealed - line2Start));
  const dotsStart = line2Start + line2Chars.length;
  const dotsRevealed = Math.max(0, Math.min(3, revealed - dotsStart));

  const line1Str = line1Chars.slice(0, line1Visible).join(" ");
  const line2Str = line2Chars.slice(0, line2Visible).join(" ");
  const dotsStr = ".".repeat(dotsRevealed);

  return (
    <div style={{
      fontFamily: spaceMonoFamily,
      fontSize: 42,
      fontWeight: 700,
      color,
      opacity: 0.75,
      letterSpacing: "0.08em",
      lineHeight: 1.5,
      textShadow: `0 0 12px ${color}20`,
      whiteSpace: "pre-wrap",
    }}>
      {line1Str}{hyphenVisible ? " -" : ""}
      {line2Visible > 0 && "\n" + line2Str}
      {dotsRevealed > 0 ? " " + dotsStr : ""}
    </div>
  );
};

// ── Act3: Punchline — instant reveal, cursor stops, absender fades in ───────
const TerminalAct3: React.FC<{ post: Post; color: string; duration: number }> = ({ post, color, duration }) => {
  const frame = useCurrentFrame();
  const act3Top = post.terminal?.act3Top ?? 280;
  const absenderBottom = post.terminal?.absenderBottom ?? 520;
  const textFadeIn = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  // Slow cursor, stops solid 15f before end
  const cursorOn = frame < duration - 15 ? useSlowCursor(frame) : true;
  // Absender fades in early
  const absenderStart = 15;
  const absenderOpacity = interpolate(frame, [absenderStart, absenderStart + 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const { act3, aside } = post.content;

  return (
    <TerminalFrame>
      {/* Punchline — split by \n\n: first part instant, second part delayed */}
      {(() => {
        const parts = act3.split("\n\n");
        const part1 = parts[0];
        const part2 = parts.length > 1 ? parts.slice(1).join("\n\n") : null;
        const part2Delay = 40;
        const part2Opacity = part2
          ? interpolate(frame, [part2Delay, part2Delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 0;
        // Cursor on latest visible part
        const showCursorOnPart2 = part2 && frame >= part2Delay;

        return (
          <>
            <div
              style={{
                position: "absolute",
                left: 108,
                right: 108,
                top: act3Top,
                opacity: textFadeIn,
                fontFamily: spaceMonoFamily,
                fontSize: 62,
                fontWeight: 700,
                color,
                lineHeight: 1.6,
                textShadow: `0 0 20px ${color}26`,
                whiteSpace: "pre-wrap",
              }}
            >
              {part1}
              {!showCursorOnPart2 && (
                <span style={{ opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>
              )}
            </div>
            {part2 && (
              <div
                style={{
                  position: "absolute",
                  left: 108,
                  right: 108,
                  top: act3Top + 340,
                  opacity: part2Opacity,
                  fontFamily: spaceMonoFamily,
                  fontSize: 62,
                  fontWeight: 700,
                  color,
                  lineHeight: 1.6,
                  textShadow: `0 0 20px ${color}26`,
                  whiteSpace: "pre-wrap",
                }}
              >
                {part2}
                {showCursorOnPart2 && (
                  <span style={{ opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* Aside — below punchline, fade in */}
      {aside && frame >= 60 && (
        <div style={{
          position: "absolute",
          left: 108,
          right: 108,
          top: act3Top + 700,
          opacity: interpolate(frame, [80, 95], [0, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          fontFamily: spaceMonoFamily,
          fontSize: 52,
          fontWeight: 700,
          color,
          lineHeight: 1.5,
          textShadow: `0 0 12px ${color}20`,
          whiteSpace: "pre-wrap",
        }}>
          {aside}
        </div>
      )}

      {/* Absender — two lines, larger font */}
      <div style={{
        position: "absolute",
        bottom: absenderBottom,
        left: 108,
        opacity: absenderOpacity * 0.6,
        fontFamily: spaceMonoFamily,
        fontSize: 36,
        fontWeight: 400,
        color,
        lineHeight: 1.5,
        letterSpacing: "0.06em",
        whiteSpace: "pre-wrap",
        textShadow: `0 0 15px ${color}25`,
      }}>
        {"WIAI · Uni Bamberg\necht.bamberg"}
      </div>
    </TerminalFrame>
  );
};

// ── Terminal composition ────────────────────────────────────────────────────
export const Terminal: React.FC<{ post: Post }> = ({ post }) => {
  const color = resolveTerminalColor(post.terminal?.color);

  // Flow mode: continuous text with embedded pauses
  if (post.terminal?.mode === "flow" && post.terminal.blocks) {
    return (
      <TerminalFrame>
        <TerminalFlow
          blocks={post.terminal.blocks}
          baseColor={color}
          prompt={post.content.act1Setup ?? "$"}
        />
      </TerminalFrame>
    );
  }

  // Classic mode: 3-act structure (with per-post overrides)
  const act1Dur = post.terminal?.act1Duration ?? TERMINAL_ACT1_DURATION;
  const act2Dur = post.terminal?.act2Duration ?? (scheduleFrames(buildTypingSchedule(post.content.act2, 73, 5.0)) + 6 + 35);
  const act3Dur = post.terminal?.act3Duration ?? TERMINAL_ACT3_DURATION;
  const act2Start = act1Dur;
  const act3Start = act2Start + act2Dur;

  return (
    <>
      <Sequence from={0} durationInFrames={act1Dur}>
        <TerminalAct1 post={post} color={color} />
      </Sequence>
      <Sequence from={act2Start} durationInFrames={act2Dur}>
        <TerminalAct2 post={post} color={color} duration={act2Dur} />
      </Sequence>
      <Sequence from={act3Start} durationInFrames={act3Dur}>
        <TerminalAct3 post={post} color={color} duration={act3Dur} />
      </Sequence>
    </>
  );
};
