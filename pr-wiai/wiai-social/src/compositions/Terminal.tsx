import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { BLACK, TERMINAL_GREEN, TERMINAL_AMBER } from "../styles/colors";
import { spaceMonoFamily, spaceGroteskFamily } from "../styles/fonts";
import { scanlineGradient } from "../styles/textures";
import { TerminalText } from "../components/TerminalText";
import { TerminalFlow } from "../components/TerminalFlow";
import {
  TERMINAL_ACT1_DURATION,
  TERMINAL_ACT3_DURATION,
  computeTerminalAct2Duration,
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

// ── Act1: Form appears → text fades in OVER the form → form glitches away ──
const TerminalAct1: React.FC<{ post: Post; color: string }> = ({ post, color }) => {
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

// ── Act2: Char-by-char text typing (default) ──────────────────────────────
const TerminalAct2: React.FC<{ post: Post; color: string; duration: number }> = ({ post, color, duration }) => {
  const frame = useCurrentFrame();
  const containerFadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  if (post.terminal?.act2Style === "escalate") {
    return <TerminalAct2Escalate post={post} color={color} duration={duration} />;
  }

  return (
    <TerminalFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 240px 400px 108px",
          opacity: containerFadeIn,
        }}
      >
        <TerminalText
          text={post.content.act2}
          color={color}
          startFrame={6}
          charsPerFrame={post.terminal?.charsPerFrame ?? 0.5}
          fontSize={56}
        />
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
  const textFadeIn = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  // Slow cursor, stops solid 15f before end
  const cursorOn = frame < duration - 15 ? useSlowCursor(frame) : true;
  // Absender fades in early
  const absenderStart = 15;
  const absenderOpacity = interpolate(frame, [absenderStart, absenderStart + 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const { act3, aside } = post.content;

  return (
    <TerminalFrame>
      {/* Punchline — fixed pixel position, doesn't move when aside appears */}
      <div
        style={{
          position: "absolute",
          left: 108,
          right: 108,
          top: 380,
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
        {act3}
        <span style={{ opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>
      </div>

      {/* Aside — fixed position, generous gap below punchline */}
      {aside && frame >= 50 && (
        <div style={{ position: "absolute", left: 108, right: 108, top: 750 }}>
          <TerminalAsideTyped text={aside} color={color} frame={frame} startFrame={50} />
        </div>
      )}

      {/* Absender — two lines, larger font, higher position */}
      <div style={{
        position: "absolute",
        bottom: 540,
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
  const act2Dur = post.terminal?.act2Duration ?? computeTerminalAct2Duration(post.content.act2, post.terminal?.charsPerFrame);
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
