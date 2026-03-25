import React from "react";
import { useCurrentFrame } from "remotion";
import { spaceMonoFamily } from "../styles/fonts";

interface Props {
  text: string;
  color: string;
  startFrame?: number;
  charsPerFrame?: number; // default 0.5 = 2 frames per char
  fontSize?: number;
}

// Deterministic per-char delay: every 8th char (offset 5) takes an extra frame.
// Uses a running sum instead of per-char random to stay frame-deterministic.
function getVisibleChars(
  textLength: number,
  localFrame: number,
  startFrame: number,
  charsPerFrame: number
): number {
  if (localFrame < startFrame) return 0;
  const elapsed = localFrame - startFrame;
  // Base: charsPerFrame chars per frame, with occasional slowdown
  let frameAccum = 0;
  for (let i = 0; i < textLength; i++) {
    const delay = 1 / charsPerFrame; // base frames per char
    const extra = i % 8 === 5 ? 1 : 0; // occasional 3-frame char
    frameAccum += delay + extra;
    if (frameAccum > elapsed) return i;
  }
  return textLength;
}

export const TerminalText: React.FC<Props> = ({
  text,
  color,
  startFrame = 0,
  charsPerFrame = 0.5,
  fontSize = 56,
}) => {
  const frame = useCurrentFrame();

  // Strip newlines for char-counting, but preserve them for display
  const chars = text.split("");
  const totalNonNewline = chars.filter((c) => c !== "\n").length;
  const visibleCount = getVisibleChars(totalNonNewline, frame, startFrame, charsPerFrame);

  // Map visibleCount (non-newline chars) back to string index
  let nonNewlinesSeen = 0;
  let sliceEnd = 0;
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] !== "\n") nonNewlinesSeen++;
    if (nonNewlinesSeen > visibleCount) break;
    sliceEnd = i + 1;
  }

  const visibleText = text.slice(0, sliceEnd);
  const allRevealed = visibleCount >= totalNonNewline;

  // Cursor: blinks while typing, stays solid when done
  const cursorOn = allRevealed ? true : frame % 16 < 8;

  return (
    <div
      style={{
        fontFamily: spaceMonoFamily,
        fontSize,
        fontWeight: 400,
        color,
        lineHeight: 1.6,
        letterSpacing: "-0.01em",
        whiteSpace: "pre-wrap",
        textShadow: `0 0 20px ${color}26`, // subtle glow at ~15% opacity
      }}
    >
      {visibleText}
      <span style={{ opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>
    </div>
  );
};
