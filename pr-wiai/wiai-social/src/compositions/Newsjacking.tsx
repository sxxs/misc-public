import React from "react";
import { Sequence, useCurrentFrame, interpolate, Img, staticFile } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";
import { halftonePatternUri, scanlineGradient } from "../styles/textures";
import { SlideFrame } from "../components/SlideFrame";
import { GlitchText } from "../components/GlitchText";
import { DirtyCutout } from "../components/DirtyCutout";
import { TypewriterText } from "../components/TypewriterText";
import { CtaSlide } from "../components/CtaSlide";

function resolveAssetPath(raw: string): string {
  return raw.replace(/^\.\/assets\//, "");
}

const Act1: React.FC<{ post: Post; showQuote?: boolean }> = ({ post, showQuote = false }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;

  const imgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const tagOpacity = interpolate(frame, [8, 16], [0, 1], { extrapolateRight: "clamp" });
  const smallOpacity = interpolate(frame, [18, 26], [0, 1], { extrapolateRight: "clamp" });
  const bigOpacity = interpolate(frame, [32, 42], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent} currentSlide={1}>
      {/* Full-bleed screenshot background */}
      {!showQuote && post.slide1.image && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            opacity: imgOpacity,
          }}
        >
          <Img
            src={staticFile(resolveAssetPath(post.slide1.image))}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              filter: "contrast(1.05) brightness(0.65) saturate(0.8)",
            }}
          />
          {/* Heavy halftone overlay for pop-art treatment */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: halftonePatternUri("white", 0.18, 5),
              backgroundSize: "5px 5px",
              mixBlendMode: "overlay",
              pointerEvents: "none",
            }}
          />
          {/* Scanlines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: scanlineGradient(0.18),
              pointerEvents: "none",
            }}
          />
          {/* Gradient: transparent top → solid black bottom — text readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.92) 75%, #0A0A0A 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Text content — sits over the background */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 60px 60px",
          position: "relative",
          zIndex: 5,
          gap: 36,
        }}
      >
        {/* Category tag */}
        {post.category && (
          <div
            style={{
              opacity: tagOpacity,
              color: accent,
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "0.15em",
              fontFamily: spaceMonoFamily,
            }}
          >
            ■ {post.category}
          </div>
        )}

        {/* Contrarian: big quoted opinion */}
        {showQuote && post.slide1.smallText && (
          <div
            style={{
              opacity: smallOpacity,
              color: "rgba(255,255,255,0.55)",
              fontSize: 60,
              fontWeight: 700,
              fontFamily: spaceGroteskFamily,
              lineHeight: 1.2,
              whiteSpace: "pre-line",
              borderLeft: `6px solid ${accent}`,
              paddingLeft: 36,
            }}
          >
            {`"${post.slide1.smallText}"`}
          </div>
        )}

        {/* Context line (newsjacking) */}
        {!showQuote && post.slide1.smallText && (
          <div
            style={{
              opacity: smallOpacity,
              color: "rgba(255,255,255,0.7)",
              fontSize: 45,
              fontFamily: spaceGroteskFamily,
              lineHeight: 1.3,
            }}
          >
            {post.slide1.smallText}
          </div>
        )}

        {/* bigText reaction with glitch */}
        <div style={{ opacity: bigOpacity }}>
          <GlitchText
            text={post.slide1.bigText}
            fontSize={168}
            glitchStartFrame={40}
            glitchEndFrame={52}
          />
        </div>
      </div>
    </SlideFrame>
  );
};

const Act2: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;
  const enterProgress = interpolate(frame, [2, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SlideFrame accentColor={accent} currentSlide={2}>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0 60px",
        }}
      >
        <DirtyCutout accentColor={accent} enterProgress={enterProgress}>
          <TypewriterText text={post.slide2.text} startFrame={10} />
        </DirtyCutout>
      </div>
    </SlideFrame>
  );
};

const Act3: React.FC<{ post: Post }> = ({ post }) => {
  const accent = post.accentColor ?? WIAI_YELLOW;
  return (
    <SlideFrame accentColor={accent} currentSlide={3}>
      <CtaSlide accentColor={accent} url={post.slide3.url} subtext={post.slide3.subtext} />
    </SlideFrame>
  );
};

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
