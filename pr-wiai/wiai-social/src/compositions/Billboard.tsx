import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW, BLACK } from "../styles/colors";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";
import {
  BILLBOARD_ACT1_DURATION,
  BILLBOARD_ACT3_DURATION,
  computeAct2Duration,
} from "../utils/timing";
import { CaptionSequence } from "../components/CaptionSequence";

// ── Shared wrapper: solid black, no halftone, no corner clusters ────────────
const BillboardFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: BLACK,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "0 240px 400px 108px",
    }}
  >
    {children}
  </div>
);

// ── Act1: Hook — big text fade in, hold, fade out ───────────────────────────
const BillboardAct1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const text = post.slide1.bigText || post.slide1.smallText || "";
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    frame,
    [BILLBOARD_ACT1_DURATION - 8, BILLBOARD_ACT1_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <BillboardFrame>
      <div
        style={{
          opacity: Math.min(fadeIn, fadeOut),
          color: "#ffffff",
          fontSize: 108,
          fontFamily: spaceGroteskFamily,
          fontWeight: 700,
          lineHeight: 1.15,
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        {text}
      </div>
    </BillboardFrame>
  );
};

// ── Act2: Argument — fade in, hold, fade out ────────────────────────────────
const BillboardAct2: React.FC<{ post: Post; duration: number }> = ({ post, duration }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <BillboardFrame>
      <div
        style={{
          opacity: Math.min(fadeIn, fadeOut),
          color: "#ffffff",
          fontSize: 96,
          fontFamily: spaceGroteskFamily,
          fontWeight: 700,
          lineHeight: 1.18,
          textAlign: "center",
          maxWidth: 900,
          whiteSpace: "pre-wrap",
        }}
      >
        {post.slide2.text}
      </div>
    </BillboardFrame>
  );
};

// ── Act3: Punch — text + delayed yellow glow, optional button, footer ───────
const BillboardAct3: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const textFadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  // Yellow glow fades in 10f after text
  const glowOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const buttonOpacity = interpolate(frame, [60, 76], [0, 1], { extrapolateRight: "clamp" });

  const glowShadow = `0 0 60px rgba(250, 204, 21, ${(0.12 * glowOpacity).toFixed(3)})`;

  return (
    <BillboardFrame>
      {/* Main punchline text with yellow glow */}
      <div
        style={{
          opacity: textFadeIn,
          color: "#ffffff",
          fontSize: 108,
          fontFamily: spaceGroteskFamily,
          fontWeight: 700,
          lineHeight: 1.15,
          textAlign: "center",
          maxWidth: 900,
          textShadow: glowShadow,
        }}
      >
        {post.slide3.text}
      </div>

      {/* Button / ÜbrigensText */}
      {(post.slide3.button || post.slide3.übrigensText) && (
        <div
          style={{
            opacity: buttonOpacity,
            marginTop: 48,
            color: "rgba(255,255,255,0.60)",
            fontSize: 48,
            fontFamily: spaceGroteskFamily,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 800,
            whiteSpace: "pre-wrap",
          }}
        >
          {post.slide3.button || post.slide3.übrigensText}
        </div>
      )}

      {/* Footer: @herdom.bamberg — always visible, bottom-anchored */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255,255,255,0.25)",
          fontSize: 28,
          fontFamily: spaceMonoFamily,
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        @herdom.bamberg
      </div>
    </BillboardFrame>
  );
};

// ── Billboard composition ───────────────────────────────────────────────────
export const Billboard: React.FC<{ post: Post }> = ({ post }) => {
  // Captions mode: rapid-cut lyric-video style
  if (post.billboard?.mode === "captions" && post.billboard.captions) {
    return <CaptionSequence captions={post.billboard.captions} />;
  }

  // Classic mode: 3-act fade-in
  const act2Duration = computeAct2Duration(post.slide2.text);
  const act2Start = BILLBOARD_ACT1_DURATION;
  const act3Start = act2Start + act2Duration;

  return (
    <>
      <Sequence from={0} durationInFrames={BILLBOARD_ACT1_DURATION}>
        <BillboardAct1 post={post} />
      </Sequence>
      <Sequence from={act2Start} durationInFrames={act2Duration}>
        <BillboardAct2 post={post} duration={act2Duration} />
      </Sequence>
      <Sequence from={act3Start} durationInFrames={BILLBOARD_ACT3_DURATION}>
        <BillboardAct3 post={post} />
      </Sequence>
    </>
  );
};
