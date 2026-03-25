import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { BLACK, TERMINAL_GREEN, TERMINAL_AMBER } from "../styles/colors";
import { spaceMonoFamily, spaceGroteskFamily } from "../styles/fonts";
import { scanlineGradient } from "../styles/textures";
import { TerminalText } from "../components/TerminalText";
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

// ── Act1: Prompt + blinking cursor ──────────────────────────────────────────
const TerminalAct1: React.FC<{ post: Post; color: string }> = ({ post, color }) => {
  const frame = useCurrentFrame();
  const prompt = post.terminal?.prompt ?? "$";
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  // Cursor blinks at 530ms ≈ 16 frames
  const cursorOn = frame % 16 < 8;

  return (
    <TerminalFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-start",
          padding: "140px 108px 0",
          opacity: fadeIn,
        }}
      >
        <div
          style={{
            fontFamily: spaceMonoFamily,
            fontSize: 56,
            fontWeight: 400,
            color,
            lineHeight: 1.6,
            textShadow: `0 0 20px ${color}26`,
          }}
        >
          {prompt}
          <span style={{ opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>
        </div>
      </div>
    </TerminalFrame>
  );
};

// ── Act2: Char-by-char text typing ──────────────────────────────────────────
const TerminalAct2: React.FC<{ post: Post; color: string }> = ({ post, color }) => {
  const frame = useCurrentFrame();
  const containerFadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

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
          text={post.slide2.text}
          color={color}
          startFrame={6}
          charsPerFrame={0.5}
          fontSize={56}
        />
      </div>
    </TerminalFrame>
  );
};

// ── Act3: Punchline — instant reveal, cursor stops blinking ─────────────────
const TerminalAct3: React.FC<{ post: Post; color: string }> = ({ post, color }) => {
  const frame = useCurrentFrame();
  const textFadeIn = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const subtextOpacity = interpolate(frame, [50, 66], [0, 1], { extrapolateRight: "clamp" });
  // Cursor blinks, then stops (stays solid) 20f before end = "done typing"
  const cursorOn = frame < TERMINAL_ACT3_DURATION - 20 ? frame % 16 < 8 : true;

  return (
    <TerminalFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 108px 400px",
          gap: 40,
        }}
      >
        {/* Punchline — instant, no typewriter */}
        <div
          style={{
            opacity: textFadeIn,
            fontFamily: spaceMonoFamily,
            fontSize: 56,
            fontWeight: 700,
            color,
            lineHeight: 1.6,
            textShadow: `0 0 20px ${color}26`,
            whiteSpace: "pre-wrap",
          }}
        >
          {post.slide3.text}
          <span style={{ opacity: cursorOn ? 1 : 0 }}>{"\u2588"}</span>
        </div>

        {/* Button / ÜbrigensText — smaller, dimmed */}
        {(post.slide3.button || post.slide3.übrigensText) && (
          <div
            style={{
              opacity: subtextOpacity * 0.5,
              fontFamily: spaceMonoFamily,
              fontSize: 42,
              fontWeight: 400,
              color,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {post.slide3.button || post.slide3.übrigensText}
          </div>
        )}
      </div>
    </TerminalFrame>
  );
};

// ── Terminal composition ────────────────────────────────────────────────────
export const Terminal: React.FC<{ post: Post }> = ({ post }) => {
  const color = resolveTerminalColor(post.terminal?.color);
  const act2Duration = computeTerminalAct2Duration(post.slide2.text);
  const act2Start = TERMINAL_ACT1_DURATION;
  const act3Start = act2Start + act2Duration;

  return (
    <>
      <Sequence from={0} durationInFrames={TERMINAL_ACT1_DURATION}>
        <TerminalAct1 post={post} color={color} />
      </Sequence>
      <Sequence from={act2Start} durationInFrames={act2Duration}>
        <TerminalAct2 post={post} color={color} />
      </Sequence>
      <Sequence from={act3Start} durationInFrames={TERMINAL_ACT3_DURATION}>
        <TerminalAct3 post={post} color={color} />
      </Sequence>
    </>
  );
};
