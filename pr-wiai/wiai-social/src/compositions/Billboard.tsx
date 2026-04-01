import React from "react";
import { Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW, BLACK } from "../styles/colors";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";
import {
  BILLBOARD_ACT1_DURATION,
  BILLBOARD_ACT3_DURATION,
  computeAct2Duration,
} from "../utils/timing";
import { CaptionSequence } from "../components/CaptionSequence";

// ── Shared wrapper: solid black, left-aligned, subtle vignette ─────────────────
const BillboardFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: BLACK,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "0 240px 400px 108px",
    }}
  >
    {children}
    {/* Vignette: edges slightly darker so text isn't uniformly white */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 55% 45% at 35% 42%, transparent 0%, rgba(0,0,0,0.65) 100%)",
        pointerEvents: "none",
      }}
    />
  </div>
);

// ── Neon tube on: brief flicker — billboard was already warmed up ─────────────
function neonTubeOn(frame: number, startFrame: number): number {
  const t = frame - startFrame;
  if (t < 0) return 0;
  if (t >= 5) return 1;
  return [1, 0.35, 0.9, 0.5, 1][t]; // two visible dips, then settled
}

// ── 50Hz mains hum: subtle brightness pulse on all text ──────────────────────
function mainsHum(frame: number): number {
  return 1 - Math.abs(Math.sin(frame * 0.35)) * 0.04; // 0.96–1.0 range, slower cycle
}

// Neon glow shadow: white core + cool tint bloom
function neonGlow(intensity: number): string {
  if (intensity <= 0) return "none";
  const w = (0.55 * intensity).toFixed(2);
  const c = (0.25 * intensity).toFixed(2);
  return `0 0 12px rgba(255,255,255,${w}), 0 0 45px rgba(180,210,255,${c}), 0 0 90px rgba(180,210,255,${(0.10 * intensity).toFixed(2)})`;
}

// ── Neon glitch: subtle failing tube flicker + slight chromatic shift ────────
function neonGlitch(frame: number, startFrame: number, endFrame: number) {
  const t = frame - startFrame;
  const dur = endFrame - startFrame;
  if (t < 0 || t > dur) return { opacity: 1, offsetX: 0, filter: "none" };
  const progress = t / dur; // 0→1 = subtle→intense
  const flicker = Math.sin(frame * 17.3) * Math.sin(frame * 7.1) * progress;
  const opacity = 1 - Math.abs(flicker) * 0.2;
  const shiftX = Math.sin(frame * 13.7) * progress * 4;
  const chromR = (progress * 0.18).toFixed(2);
  const chromC = (progress * 0.14).toFixed(2);
  const filter = progress > 0.2
    ? `drop-shadow(${(shiftX * 0.8).toFixed(1)}px 0 0 rgba(255,40,40,${chromR})) ` +
      `drop-shadow(${(-shiftX * 0.6).toFixed(1)}px 0 0 rgba(40,255,255,${chromC}))`
    : "none";
  return { opacity, offsetX: shiftX, filter };
}

// ── Act1: Hook — setup line + reveal with neon tube-on effect ─────────────────
const BillboardAct1: React.FC<{ post: Post; duration: number }> = ({ post, duration }) => {
  const frame = useCurrentFrame();
  const { act1Setup, act1Reveal } = post.content;
  const hasSetup = !!act1Setup;
  const hasReveal = !!act1Reveal;
  const revealAt = post.billboard?.revealAtFrame ?? 14;

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const hum = mainsHum(frame);
  const opacity = Math.min(fadeIn, fadeOut) * hum;

  // Neon tube-on for reveal
  const tubeOn = neonTubeOn(frame, revealAt);
  const revealBase = interpolate(frame, [revealAt, revealAt + 16], [0, 1], { extrapolateRight: "clamp" });
  const revealOpacity = Math.min(revealBase > 0 ? tubeOn : 0, fadeOut) * hum;
  const glowIntensity = revealBase > 0 ? tubeOn * interpolate(frame, [revealAt, revealAt + 20], [1, 0.15], { extrapolateRight: "clamp" }) : 0;

  return (
    <BillboardFrame>
      {hasSetup && hasReveal ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 36, maxWidth: 730 }}>
          <div
            style={{
              opacity,
              color: "#ffffff",
              fontSize: 72,
              fontFamily: spaceGroteskFamily,
              fontWeight: 700,
              lineHeight: 1.2,
              whiteSpace: "pre-wrap",
            }}
          >
            {act1Setup}
          </div>
          <div
            style={{
              opacity: revealOpacity,
              color: "#ffffff",
              fontSize: 108,
              fontFamily: spaceGroteskFamily,
              fontWeight: 700,
              lineHeight: 1.15,
              whiteSpace: "pre-wrap",
              textShadow: neonGlow(glowIntensity),
            }}
          >
            {act1Reveal}
          </div>
        </div>
      ) : (
        <div
          style={{
            opacity,
            color: "#ffffff",
            fontSize: 108,
            fontFamily: spaceGroteskFamily,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 730,
            whiteSpace: "pre-wrap",
          }}
        >
          {act1Reveal || act1Setup || ""}
        </div>
      )}
    </BillboardFrame>
  );
};

// ── Act2: Argument — fade in, hold, fade out. Text after \n\n = delayed reveal ─
const BillboardAct2: React.FC<{ post: Post; duration: number }> = ({ post, duration }) => {
  const frame = useCurrentFrame();
  const hum = mainsHum(frame);
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Split on double newline: first part appears immediately, second part delayed
  const parts = post.content.act2.split("\n\n");
  const mainText = parts[0];
  const revealText = parts.length > 1 ? parts.slice(1).join("\n\n") : null;
  const revealAt = Math.floor(duration * 0.5);
  const revealOpacity = revealText
    ? interpolate(frame, [revealAt, revealAt + 16], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  return (
    <BillboardFrame>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 56, maxWidth: 730 }}>
        <div
          style={{
            opacity: Math.min(fadeIn, fadeOut) * hum,
            color: "#ffffff",
            fontSize: 96,
            fontFamily: spaceGroteskFamily,
            fontWeight: 700,
            lineHeight: 1.18,
            whiteSpace: "pre-wrap",
          }}
        >
          {mainText}
        </div>
        {revealText && (
          <div
            style={{
              opacity: Math.min(revealOpacity, fadeOut) * hum,
              color: "rgba(255,255,255,0.70)",
              fontSize: 72,
              fontFamily: spaceGroteskFamily,
              fontWeight: 700,
              whiteSpace: "pre-wrap",
            }}
          >
            {revealText}
          </div>
        )}
      </div>
    </BillboardFrame>
  );
};

// ── Act3: Punch — text with neon glitch, aside, footer ──────────────────────
const BillboardAct3: React.FC<{ post: Post; duration: number }> = ({ post, duration }) => {
  const frame = useCurrentFrame();
  const hum = mainsHum(frame);
  const textFadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const glowOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const asideStart = Math.min(80, duration - 90);
  const buttonOpacity = interpolate(frame, [asideStart, asideStart + 16], [0, 1], { extrapolateRight: "clamp" });
  const footerOpacity = interpolate(frame, [asideStart + 50, asideStart + 70], [0, 1], { extrapolateRight: "clamp" });

  const glowShadow = `0 0 60px rgba(250, 204, 21, ${(0.12 * glowOpacity).toFixed(3)})`;
  const { act3, aside } = post.content;

  // Neon glitch: brief window before aside appears (not too close)
  const glitchStart = Math.floor(asideStart * 0.75);
  const glitchEnd = asideStart - 14;
  const glitch = neonGlitch(frame, glitchStart, glitchEnd);

  return (
    <BillboardFrame>
      {/* Main punchline text with yellow glow + neon glitch */}
      <div
        style={{
          opacity: textFadeIn * glitch.opacity * hum,
          color: "#ffffff",
          fontSize: 108,
          fontFamily: spaceGroteskFamily,
          fontWeight: 700,
          lineHeight: 1.15,
          maxWidth: 730,
          whiteSpace: "pre-wrap",
          textShadow: glowShadow,
          transform: glitch.offsetX !== 0 ? `translateX(${glitch.offsetX.toFixed(1)}px)` : undefined,
          filter: glitch.filter !== "none" ? glitch.filter : undefined,
        }}
      >
        {act3}
      </div>

      {/* Aside — bigger, left-aligned */}
      {aside && (
        <div
          style={{
            opacity: buttonOpacity * hum,
            marginTop: 72,
            color: "rgba(255,255,255,0.70)",
            fontSize: 72,
            fontFamily: spaceGroteskFamily,
            fontWeight: 700,
            whiteSpace: "pre-wrap",
          }}
        >
          {aside}
        </div>
      )}

      {/* Footer: WIAI · Uni Bamberg · echt.bamberg — left-aligned */}
      <div
        style={{
          opacity: footerOpacity,
          marginTop: 100,
          color: "rgba(255,255,255,0.50)",
          fontSize: 34,
          fontFamily: spaceMonoFamily,
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        WIAI · Uni Bamberg · echt.bamberg
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
  const act1Duration = post.billboard?.act1Duration ?? BILLBOARD_ACT1_DURATION;
  const act3Duration = post.billboard?.act3Duration ?? BILLBOARD_ACT3_DURATION;
  const act2Duration = post.billboard?.act2Duration ?? computeAct2Duration(post.content.act2);
  const act2Start = act1Duration;
  const act3Start = act2Start + act2Duration;

  return (
    <>
      <Sequence from={0} durationInFrames={act1Duration}>
        <BillboardAct1 post={post} duration={act1Duration} />
      </Sequence>
      <Sequence from={act2Start} durationInFrames={act2Duration}>
        <BillboardAct2 post={post} duration={act2Duration} />
      </Sequence>
      <Sequence from={act3Start} durationInFrames={act3Duration}>
        <BillboardAct3 post={post} duration={act3Duration} />
      </Sequence>
    </>
  );
};
