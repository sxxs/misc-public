import React from "react";
import { Sequence, useCurrentFrame, interpolate, Img, staticFile } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceGroteskFamily } from "../styles/fonts";
import { scanlineGradient } from "../styles/textures";
import { SlideFrame } from "../components/SlideFrame";
import { GlitchText } from "../components/GlitchText";
import { DirtyCutout } from "../components/DirtyCutout";
import { TypewriterText } from "../components/TypewriterText";
import { LedWall } from "../components/LedWall";
import { PunchlineSlide } from "../components/PunchlineSlide";
import { resolvePattern } from "../patterns";

function resolveAssetPath(raw: string): string {
  return raw.replace(/^\.\/assets\//, "");
}

// ─── Animated background with chromatic aberration, grain, glitch bands ────

const GlitchBackground: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();

  // Chromatic aberration — subtle organic drift, small spikes
  const spikeActive = Math.sin(frame * 11.3) > 0.94;
  const spike = spikeActive ? 6 : 0;
  const redDx = Math.round(Math.sin(frame * 0.37) * 4 + Math.sin(frame * 2.1) * 1 + spike);
  const blueDx = Math.round(-Math.sin(frame * 0.31) * 4 - Math.sin(frame * 1.9) * 1 - spike);

  // Film grain seed — changes every frame for animated noise
  const grainSeed = frame % 64;

  // Glitch band — rare, subtle
  const bandActive = Math.sin(frame * 17.3) > 0.94;
  const bandY = Math.abs(Math.sin(frame * 3.3 + 1.2)) * 1400 + 100;
  const bandH = Math.abs(Math.sin(frame * 7.1)) * 40 + 10;
  const bandX = Math.sin(frame * 11.1) * 20;

  // Scanlines don't jitter — they only shift on true glitch frames
  const scanJitter = spikeActive ? 1 : 0;

  const filterId = `chroma-${frame}`;
  const grainId = `grain-${frame}`;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      {/* SVG filter definitions */}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <defs>
          {/* RGB channel split — red left, blue right */}
          <filter id={filterId} x="-8%" width="116%" colorInterpolationFilters="sRGB">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="r"
            />
            <feOffset in="r" dx={redDx} dy={0} result="r2" />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="g"
            />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="b"
            />
            <feOffset in="b" dx={blueDx} dy={0} result="b2" />
            <feBlend in="r2" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" />
          </filter>

          {/* Animated film grain */}
          <filter id={grainId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              seed={grainSeed}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      {/* Background image with chromatic aberration filter */}
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          filter: `url(#${filterId}) brightness(0.40) contrast(1.15) saturate(0.25)`,
        }}
      />

      {/* Film grain overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: `url(#${grainId})`,
          opacity: 0.22,
          mixBlendMode: "overlay",
          background: "#808080",
          pointerEvents: "none",
        }}
      />

      {/* Scanlines — luminosity only, no color contamination */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: scanlineGradient(0.22),
          mixBlendMode: "luminosity",
          transform: `translateY(${scanJitter}px)`,
          pointerEvents: "none",
        }}
      />

      {/* Glitch band — rare, monochrome, subtle */}
      {bandActive && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: bandY,
            height: bandH,
            background: "rgba(255,255,255,0.12)",
            mixBlendMode: "luminosity",
            transform: `translateX(${bandX}px)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Gradient — top transparent → bottom solid black for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.3) 40%, rgba(10,10,10,0.88) 68%, #0A0A0A 88%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

// ─── Act 1: Hook ─────────────────────────────────────────────────────────────

const Act1: React.FC<{ post: Post; showQuote?: boolean }> = ({ post, showQuote = false }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;

  const imgOpacity = 1;
  const smallOpacity = interpolate(frame, [14, 22], [0, 1], { extrapolateRight: "clamp" });
  const bigOpacity = interpolate(frame, [26, 36], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent} currentSlide={1}>
      {/* Full-bleed background — image or LED wall fallback */}
      {!showQuote && (
        post.slide1.image
          ? <GlitchBackground src={resolveAssetPath(post.slide1.image)} />
          : <LedWall accentColor={accent} pattern={resolvePattern(post.ledPattern)} />
      )}

      {/* Text overlay — bottom of frame, safe zone padding right+bottom */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          // Bottom 380px = TikTok safe zone (caption + audio strip)
          // Right 180px = action buttons
          padding: "0 240px 400px 108px",
          position: "relative",
          zIndex: 5,
          gap: 30,
        }}
      >
        {/* Context line */}
        {post.slide1.smallText && (
          <div
            style={{
              opacity: smallOpacity,
              color: "rgba(255,255,255,0.75)",
              fontSize: 42,
              fontFamily: spaceGroteskFamily,
              lineHeight: 1.3,
              whiteSpace: "pre-line",
            }}
          >
            {post.slide1.smallText}
          </div>
        )}

        {/* Reaction — big glitch text */}
        <div style={{ opacity: bigOpacity }}>
          <GlitchText
            text={post.slide1.bigText}
            fontSize={168}
            glitchStartFrame={38}
            glitchEndFrame={52}
          />
        </div>
      </div>

      {/* Contrarian: quoted opinion overlay */}
      {showQuote && post.slide1.smallText && (
        <div
          style={{
            position: "absolute",
            bottom: 420,
            left: 60,
            right: 240,
            zIndex: 5,
            opacity: smallOpacity,
            color: "rgba(255,255,255,0.55)",
            fontSize: 60,
            fontWeight: 700,
            fontFamily: spaceGroteskFamily,
            lineHeight: 1.2,
            borderLeft: `6px solid ${accent}`,
            paddingLeft: 36,
          }}
        >
          {`"${post.slide1.smallText}"`}
        </div>
      )}
    </SlideFrame>
  );
};

// ─── Act 2: Punchline ─────────────────────────────────────────────────────────

const Act2: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;

  const enterProgress = interpolate(frame, [2, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Two glitch moments after text has been sitting a while
  // Glitch 1: frames 110–116
  const g1Active = frame >= 110 && frame < 117;
  const g1t = frame - 110;
  const glitch1X = g1Active ? (g1t < 4 ? 18 : -(g1t - 4) * 6) : 0;

  // Glitch 2: frames 145–150 (shorter, smaller)
  const g2Active = frame >= 145 && frame < 151;
  const g2t = frame - 145;
  const glitch2X = g2Active ? (g2t < 3 ? -12 : (g2t - 3) * 4) : 0;

  const glitchX = glitch1X + glitch2X;

  return (
    <SlideFrame accentColor={accent} currentSlide={2}>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          // Keep content out of TikTok bottom/right zones
          padding: "200px 240px 200px 108px",
        }}
      >
        <DirtyCutout accentColor={accent} enterProgress={enterProgress} glitchX={glitchX}>
          <TypewriterText
            text={post.slide2.text}
            startFrame={10}
            framesPerLine={3}
          />
        </DirtyCutout>
      </div>
    </SlideFrame>
  );
};

// ─── Act 3: Punchline ────────────────────────────────────────────────────────

const Act3: React.FC<{ post: Post }> = ({ post }) => {
  const accent = post.accentColor ?? WIAI_YELLOW;
  return (
    <SlideFrame accentColor={accent}>
      <PunchlineSlide accentColor={accent} text={post.slide3.text} button={post.slide3.button} pattern={resolvePattern(post.ledPattern)} />
    </SlideFrame>
  );
};

// ─── Root composition ────────────────────────────────────────────────────────

export const Newsjacking: React.FC<{ post: Post }> = ({ post }) => (
  <>
    <Sequence from={0} durationInFrames={120}>
      <Act1 post={post} />
    </Sequence>
    <Sequence from={120} durationInFrames={210}>
      <Act2 post={post} />
    </Sequence>
    <Sequence from={330} durationInFrames={120}>
      <Act3 post={post} />
    </Sequence>
  </>
);
