import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  OffthreadVideo,
  Freeze,
  staticFile,
  Audio,
} from "remotion";
import { Post } from "../types";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";
import { WIAI_YELLOW, GLITCH_RED, GLITCH_CYAN } from "../styles/colors";
import { SAFE } from "../styles/safeZones";

const VIDEO_SRC = "media/apocalypse/city.mp4";
const ACT1_END = 90;         // end of Act1 in absolute frames (3s @ 30fps)
const VIDEO_FADE_START = 75;  // begin fade before Act1 ends
const VIDEO_FADE_END = 300;   // finish just past Act2 end (Act3 starts at 270)

// Stutter: hold the video for 2 frames every 18-frame cycle during Act1,
// plus an extra hold near the very end of Act1 that leads into the Freeze.
// After ACT1_END the effective frame is clamped to ACT1_END - 1 (the freeze).
function stutterFrame(frame: number): number {
  if (frame >= ACT1_END) return ACT1_END - 1;
  const period = 18;
  const pos = frame % period;
  // Hold (skip back) for 2 frames every cycle — feels like a dropped frame / tape glitch
  if (pos < 2) return Math.max(0, Math.floor(frame / period) * period - 1);
  return frame;
}

// ── Background video: slow playback, stutter + freeze + long fadeout ─────────
const ApocalypseVideoLayer: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [VIDEO_FADE_START, VIDEO_FADE_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (opacity <= 0.001) return null;

  // Multi-layered glitch: frequent small shifts + occasional hard bursts
  const smallShift = Math.sin(frame * 1.9) * 2 + Math.sin(frame * 5.3) * 1.5;
  const hardBurst = Math.floor(frame / 28) % 3 === 0 && frame % 28 < 3;
  const burstShift = hardBurst ? Math.sin(frame * 40) * 22 : 0;
  const shiftX = smallShift + burstShift;

  // Vertical micro-jitter every 12 frames (tape roll)
  const jitterY = frame % 12 === 0 ? Math.sin(frame * 0.7) * 4 : 0;

  // Subtle zoom-in on the frozen image
  const scale = frame < ACT1_END ? 1 : 1 + (frame - ACT1_END) * 0.00045;

  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${shiftX}px, ${jitterY}px) scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        <Freeze frame={stutterFrame(frame)}>
          <OffthreadVideo
            src={staticFile(VIDEO_SRC)}
            playbackRate={0.45}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Freeze>
      </div>
      {/* Vertical darkening gradient — top heavier than bottom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.55) 20%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.35) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ── Film grain via animated SVG noise ─────────────────────────────────────────
const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.22 }) => {
  const frame = useCurrentFrame();
  // Rotate seed every frame to animate grain
  const seed = (frame % 6) + 1;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='854'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2 -1'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.7'/></svg>`;
  const uri = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: uri,
        backgroundSize: "cover",
        mixBlendMode: "overlay",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

// ── Scanlines ────────────────────────────────────────────────────────────────
const Scanlines: React.FC<{ opacity?: number }> = ({ opacity = 0.35 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)",
      mixBlendMode: "multiply",
      opacity,
      pointerEvents: "none",
    }}
  />
);

// ── Shared background stack (video + grain + scanlines + vignette) ───────────
const BgStack: React.FC<{ grainOpacity?: number; scanOpacity?: number; vignette?: boolean }> = ({
  grainOpacity = 0.22,
  scanOpacity = 0.35,
  vignette = true,
}) => {
  const frame = useCurrentFrame();
  const vOp = interpolate(frame, [VIDEO_FADE_START, VIDEO_FADE_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <AbsoluteFill style={{ background: "#050302" }} />
      <ApocalypseVideoLayer />
      <FilmGrain opacity={grainOpacity * Math.max(vOp, 0.3)} />
      <Scanlines opacity={scanOpacity * Math.max(vOp, 0.3)} />
      {vignette && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 100% 110% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
};

// ── Act1: OMG blink + glitched hook ──────────────────────────────────────────
const Act1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const t = frame;

  const textOp = interpolate(t, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const redX = Math.sin(t * 7.3) * 10 - 4;
  const redY = Math.sin(t * 5.7) * 5 + 2;
  const cyanX = Math.sin(t * 13.1) * 8 + 4;
  const cyanY = Math.sin(t * 11.3) * 4 - 1;
  const glitchAmt = interpolate(t, [0, 10], [0, 0.55], { extrapolateRight: "clamp" });

  const burst = Math.floor(t / 22) % 3 === 0 && t % 22 < 3 ? Math.sin(t * 40) * 12 : 0;

  const omgVisible = t >= 12 && Math.floor(t / 5) % 2 === 0;
  const omgScale = interpolate(t, [12, 20], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sharedText: React.CSSProperties = {
    fontSize: 136,
    fontFamily: spaceGroteskFamily,
    fontWeight: 700,
    lineHeight: 1.0,
    textAlign: "center",
    whiteSpace: "pre-line",
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: `0 ${SAFE.left}px`,
  };

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: textOp,
          transform: `translateX(${burst}px)`,
        }}
      >
        <div
          style={{
            ...sharedText,
            color: GLITCH_RED,
            opacity: glitchAmt,
            transform: `translate(${redX}px, ${redY}px)`,
            mixBlendMode: "screen",
          }}
        >
          {post.content.act1Setup}
        </div>
        <div
          style={{
            ...sharedText,
            color: GLITCH_CYAN,
            opacity: glitchAmt,
            transform: `translate(${cyanX}px, ${cyanY}px)`,
            mixBlendMode: "screen",
          }}
        >
          {post.content.act1Setup}
        </div>
        <div
          style={{
            ...sharedText,
            color: "#ffffff",
            textShadow:
              "0 0 24px rgba(0,0,0,0.9), 0 0 48px rgba(0,0,0,0.7), 3px 3px 0 rgba(0,0,0,0.6)",
          }}
        >
          {post.content.act1Setup}
        </div>
      </div>
      {omgVisible && (
        <div
          style={{
            position: "absolute",
            top: 220,
            right: 70,
            transform: `rotate(-8deg) scale(${omgScale})`,
            transformOrigin: "center",
          }}
        >
          <div
            style={{
              fontSize: 180,
              fontFamily: spaceGroteskFamily,
              fontWeight: 700,
              fontStyle: "italic",
              color: "#FF2020",
              textShadow:
                "0 0 30px #FF2020, 0 0 60px #FF4040, 4px 4px 0 #000, -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000",
              letterSpacing: "-0.03em",
            }}
          >
            *OMG*
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── Act2: "Macht nichts." → second line with explicit break before "bestehen" ─
const Act2: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();

  // Split act2 on first sentence boundary
  const parts = (post.content.act2 || "").split(/\.\s+/);
  const first = (parts[0] || "") + (parts.length > 1 ? "." : "");
  const second = parts.slice(1).join(". ");

  // Force a break AFTER "bestehen" in the second line
  const secondLined = second.replace(/bestehen\s+/, "bestehen\n");

  const firstOp = interpolate(frame, [0, 10, 55, 65], [0, 1, 1, 0.25], {
    extrapolateRight: "clamp",
  });
  const secondOp = interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${SAFE.left}px`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 168,
            fontFamily: spaceGroteskFamily,
            fontWeight: 700,
            color: "#ffffff",
            opacity: firstOp,
            lineHeight: 1.0,
            marginBottom: 48,
            textShadow: "0 0 18px rgba(0,0,0,0.7)",
          }}
        >
          {first}
        </div>
        <div
          style={{
            fontSize: 82,
            fontFamily: spaceGroteskFamily,
            fontWeight: 700,
            color: "rgba(255,255,255,0.95)",
            opacity: secondOp,
            lineHeight: 1.12,
            whiteSpace: "pre-line",
            textShadow: "0 0 14px rgba(0,0,0,0.7)",
          }}
        >
          {secondLined}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Act3: meditation + button + footer below button ──────────────────────────
const Act3: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const textOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const textY = interpolate(frame, [0, 22], [30, 0], { extrapolateRight: "clamp" });
  const buttonOp = interpolate(frame, [110, 128], [0, 1], { extrapolateRight: "clamp" });
  const buttonY = interpolate(frame, [110, 132], [20, 0], { extrapolateRight: "clamp" });
  const footerOp = interpolate(frame, [130, 150], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Single group — text + button + footer — center at 40% of video height
          (10% above the geometric middle). Tight spacing between button and footer. */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: SAFE.left,
          right: SAFE.right,
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            fontSize: 104,
            fontFamily: spaceGroteskFamily,
            fontWeight: 700,
            color: "#ffffff",
            opacity: textOp,
            transform: `translateY(${textY}px)`,
            lineHeight: 1.08,
            textAlign: "left",
            textShadow: "0 0 18px rgba(0,0,0,0.6)",
            marginBottom: 88,
          }}
        >
          Der Mensch <span style={{ color: WIAI_YELLOW }}>werden</span>,<br />
          der sie<br />
          besteht,<br />
          <span style={{ color: "rgba(255,255,255,0.55)" }}>nicht.</span>
        </div>

        {post.content.aside && (
          <div
            style={{
              opacity: buttonOp,
              transform: `translateY(${buttonY}px)`,
              display: "inline-flex",
              padding: "24px 40px",
              background: WIAI_YELLOW,
              color: "#0A0604",
              fontSize: 44,
              fontFamily: spaceMonoFamily,
              fontWeight: 700,
              letterSpacing: "0.02em",
              borderRadius: 4,
              boxShadow: "0 6px 30px rgba(250,204,21,0.25)",
              marginBottom: 36,
            }}
          >
            {post.content.aside}
          </div>
        )}

        <div
          style={{
            opacity: footerOp,
            fontFamily: spaceMonoFamily,
            color: "rgba(255,255,255,0.4)",
            fontSize: 39,
            fontWeight: 400,
            letterSpacing: "0.08em",
            lineHeight: 1.2,
          }}
        >
          <div>WIAI · UNI BAMBERG</div>
          <div>echt.bamberg</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ApocalypseBillboard: React.FC<{ post: Post }> = ({ post }) => (
  <AbsoluteFill>
    {/* Background stack sits at top level so useCurrentFrame reads absolute time */}
    <BgStack />
    <Sequence from={0} durationInFrames={90}>
      <Act1 post={post} />
    </Sequence>
    <Sequence from={90} durationInFrames={180}>
      <Act2 post={post} />
    </Sequence>
    <Sequence from={270} durationInFrames={180}>
      <Act3 post={post} />
    </Sequence>

    {/* Tension-riser: builds through Act1, peaks near Act1→Act2 cut */}
    <Sequence from={15} durationInFrames={95}>
      <Audio src={staticFile("music/riser.mp3")} volume={0.85} />
    </Sequence>
    {/* Swoosh: punctuates the exact cut moment */}
    <Sequence from={87} durationInFrames={30}>
      <Audio src={staticFile("music/swoosh.mp3")} volume={0.75} />
    </Sequence>
  </AbsoluteFill>
);
