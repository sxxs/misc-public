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
      padding: "200px 240px 400px 108px",
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

// ── Snap nudge: quick ease-out jolt, like a panel clicking into position ─────
function snapNudge(frame: number, start: number, dur: number, px: number): number {
  if (frame < start) return 0;
  if (frame >= start + dur) return px;
  const t = (frame - start) / dur;
  return px * (1 - (1 - t) * (1 - t)); // ease-out quadratic
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
  const hum = mainsHum(frame);
  const opacity = fadeIn * hum;

  // Neon tube-on for reveal
  const tubeOn = neonTubeOn(frame, revealAt);
  const revealBase = interpolate(frame, [revealAt, revealAt + 16], [0, 1], { extrapolateRight: "clamp" });
  const revealOpacity = (revealBase > 0 ? tubeOn : 0) * hum;
  const glowIntensity = revealBase > 0 ? tubeOn * interpolate(frame, [revealAt, revealAt + 20], [1, 0.15], { extrapolateRight: "clamp" }) : 0;

  // Mechanical nudges: quick upward snaps at content events — "Zurechtrücken"
  const nudge1 = snapNudge(frame, 10, 6, -8);               // setup settles
  const nudge2 = snapNudge(frame, revealAt, 6, -10);         // reveal snaps in
  const nudge3 = snapNudge(frame, duration - 18, 5, -6);     // pre-exit tease: "pulling away"
  const drift = nudge1 + nudge2 + nudge3;

  return (
    <BillboardFrame>
      {hasSetup && hasReveal ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 36, maxWidth: 730, transform: `translateY(${drift}px)` }}>
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
            transform: `translateY(${drift}px)`,
          }}
        >
          {act1Reveal || act1Setup || ""}
        </div>
      )}
    </BillboardFrame>
  );
};

// ── Act2: Argument — beats mode or \n\n fallback ────────────────────────────
// Beats mode: explicit per-element timing, size, and style via billboard.beats.
// Fallback: split on \n\n — section 1 immediate, section 2 delayed (45%),
// section 3 late heckle in accent color (78%).
const BillboardAct2: React.FC<{ post: Post; duration: number }> = ({ post, duration }) => {
  const frame = useCurrentFrame();
  const hum = mainsHum(frame);
  const accent = post.accentColor ?? WIAI_YELLOW;

  // ── Beats mode: explicit control ──────────────────────────────────────────
  if (post.billboard?.beats) {
    // Nudges tied to beat appearances + pre-exit tease
    const beats = post.billboard.beats;
    let drift = 0;
    for (let i = 0; i < beats.length; i++) {
      drift += snapNudge(frame, beats[i].at + 3, 6, -6); // each beat nudges up slightly
    }
    drift += snapNudge(frame, duration - 18, 5, -5); // pre-exit tease
    return (
      <BillboardFrame>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 36, maxWidth: 730, transform: `translateY(${drift}px)` }}>
          {post.billboard.beats.map((beat, i) => {
            const beatOpacity = interpolate(frame, [beat.at, beat.at + 10], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            const isHeckle = beat.style === "heckle";
            const isDim = beat.style === "dim";
            const fontSize = beat.size ?? (isHeckle ? 54 : isDim ? 72 : 96);
            return (
              <div
                key={i}
                style={{
                  opacity: beatOpacity * hum,
                  color: isHeckle ? accent : isDim ? "rgba(255,255,255,0.70)" : "#ffffff",
                  fontSize,
                  fontFamily: isHeckle ? spaceMonoFamily : spaceGroteskFamily,
                  fontWeight: isHeckle ? 400 : 700,
                  lineHeight: 1.18,
                  whiteSpace: "pre-wrap",
                  ...(isHeckle ? { letterSpacing: "0.02em" } : {}),
                }}
              >
                {beat.text}
              </div>
            );
          })}
        </div>
      </BillboardFrame>
    );
  }

  // ── Fallback: \n\n splitting ──────────────────────────────────────────────
  const parts = post.content.act2.split("\n\n");
  const mainText = parts[0];
  const revealText = parts.length > 1 ? parts[1] : null;
  const heckleText = parts.length > 2 ? parts.slice(2).join("\n") : null;

  const revealAt = Math.floor(duration * 0.45);
  const revealOpacity = revealText
    ? interpolate(frame, [revealAt, revealAt + 12], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  const heckleAt = Math.floor(duration * 0.78);
  const heckleOpacity = heckleText
    ? interpolate(frame, [heckleAt, heckleAt + 10], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  return (
    <BillboardFrame>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 56, maxWidth: 730 }}>
        <div
          style={{
            opacity: hum,
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
              opacity: revealOpacity * hum,
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
        {heckleText && (
          <div
            style={{
              opacity: heckleOpacity * hum,
              color: accent,
              fontSize: 54,
              fontFamily: spaceMonoFamily,
              fontWeight: 400,
              whiteSpace: "pre-wrap",
              letterSpacing: "0.02em",
            }}
          >
            {heckleText}
          </div>
        )}
      </div>
    </BillboardFrame>
  );
};

// ── Act3: Punch — breathing glow, drift, aside + footer simultaneous ────────
const BillboardAct3: React.FC<{ post: Post; duration: number }> = ({ post, duration }) => {
  const frame = useCurrentFrame();
  const hum = mainsHum(frame);
  const glowOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const asideStart = Math.floor(duration * 0.4);
  const buttonOpacity = interpolate(frame, [asideStart, asideStart + 16], [0, 1], { extrapolateRight: "clamp" });
  // Footer fades in simultaneously with aside (slightly longer ramp)
  const footerOpacity = interpolate(frame, [asideStart, asideStart + 20], [0, 1], { extrapolateRight: "clamp" });

  // Breathing glow: visible pulse on the yellow shadow
  const glowPulse = 0.18 + Math.sin(frame * 0.1) * 0.10;
  const glowShadow = `0 0 60px rgba(250, 204, 21, ${(glowPulse * glowOpacity).toFixed(3)})`;
  const { act3, aside } = post.content;

  // Subtle upward drift — visual interest during hold
  const drift = interpolate(frame, [10, duration], [0, -12], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Neon glitch: brief window before aside appears
  const glitchStart = Math.max(10, Math.floor(asideStart * 0.5));
  const glitchEnd = Math.max(glitchStart + 8, asideStart - 8);
  const glitch = neonGlitch(frame, glitchStart, glitchEnd);

  return (
    <BillboardFrame>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        transform: `translateY(${drift}px)`,
      }}>
        {/* Main punchline text with breathing glow + neon glitch */}
        <div
          style={{
            opacity: glitch.opacity * hum,
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

        {/* Aside — left-aligned */}
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

        {/* Footer: WIAI · Uni Bamberg · echt.bamberg */}
        <div
          style={{
            opacity: footerOpacity,
            marginTop: aside ? 36 : 100,
            color: "rgba(255,255,255,0.50)",
            fontSize: 34,
            fontFamily: spaceMonoFamily,
            fontWeight: 400,
            letterSpacing: "0.04em",
            whiteSpace: "pre-wrap",
          }}
        >
          {"WIAI · Uni Bamberg\necht.bamberg"}
        </div>
      </div>
    </BillboardFrame>
  );
};

// ── Billboard scroll transition ─────────────────────────────────────────────
// Mechanical billboard feel: panels scroll vertically between acts.
// Old text pushes up and out, new text enters from below — continuous motion,
// no dead zone where the screen goes black.
const SCROLL_FRAMES = 12; // ~0.4s — deliberate mechanical scroll

function scrollEase(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

const BillboardScrollPanel: React.FC<{
  children: React.ReactNode;
  scrollIn?: boolean;
  scrollOut?: boolean;
  duration: number;
}> = ({ children, scrollIn, scrollOut, duration }) => {
  const frame = useCurrentFrame();
  let y = 0;
  if (scrollIn && frame < SCROLL_FRAMES) {
    const t = interpolate(frame, [0, SCROLL_FRAMES], [0, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    y = (1 - scrollEase(t)) * 1920;
  }
  if (scrollOut && frame >= duration - SCROLL_FRAMES) {
    const t = interpolate(frame, [duration - SCROLL_FRAMES, duration], [0, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    y = -scrollEase(t) * 1920;
  }
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      transform: y !== 0 ? `translateY(${y}px)` : undefined,
    }}>
      {children}
    </div>
  );
};

// ── Billboard composition ───────────────────────────────────────────────────
export const Billboard: React.FC<{ post: Post }> = ({ post }) => {
  // Captions mode: rapid-cut lyric-video style
  if (post.billboard?.mode === "captions" && post.billboard.captions) {
    return <CaptionSequence captions={post.billboard.captions} />;
  }

  // Classic mode: 3-act with scroll transitions between acts
  const act1Duration = post.billboard?.act1Duration ?? BILLBOARD_ACT1_DURATION;
  const act3Duration = post.billboard?.act3Duration ?? BILLBOARD_ACT3_DURATION;
  const act2Duration = post.billboard?.act2Duration ?? computeAct2Duration(post.content.act2);
  const act2Start = act1Duration;
  const act3Start = act2Start + act2Duration;

  // Sequences overlap by SCROLL_FRAMES so both panels are on-screen during scroll.
  // Panels touch seamlessly: outgoing y + incoming y = 1920 at every frame.
  const act1Dur = act1Duration + SCROLL_FRAMES;
  const act2Dur = act2Duration + SCROLL_FRAMES;

  return (
    <>
      <Sequence from={0} durationInFrames={act1Dur}>
        <BillboardScrollPanel scrollOut duration={act1Dur}>
          <BillboardAct1 post={post} duration={act1Duration} />
        </BillboardScrollPanel>
      </Sequence>
      <Sequence from={act2Start} durationInFrames={act2Dur}>
        <BillboardScrollPanel scrollIn scrollOut duration={act2Dur}>
          <BillboardAct2 post={post} duration={act2Duration} />
        </BillboardScrollPanel>
      </Sequence>
      <Sequence from={act3Start} durationInFrames={act3Duration}>
        <BillboardScrollPanel scrollIn duration={act3Duration}>
          <BillboardAct3 post={post} duration={act3Duration} />
        </BillboardScrollPanel>
      </Sequence>
    </>
  );
};
