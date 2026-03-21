import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";
import { SlideFrame } from "../components/SlideFrame";
import { GlitchText } from "../components/GlitchText";
import { HalftoneImage } from "../components/HalftoneImage";
import { DirtyCutout } from "../components/DirtyCutout";
import { TypewriterText } from "../components/TypewriterText";
import { CtaSlide } from "../components/CtaSlide";

function resolveAssetPath(raw: string): string {
  return raw.replace(/^\.\/assets\//, "");
}

const Act1: React.FC<{ post: Post; showQuote?: boolean }> = ({ post, showQuote = false }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;

  const tagOpacity = interpolate(frame, [5, 10], [0, 1], { extrapolateRight: "clamp" });
  const imgTranslateY = interpolate(frame, [10, 18], [60, 0], { extrapolateRight: "clamp" });
  const imgOpacity = interpolate(frame, [10, 18], [0, 1], { extrapolateRight: "clamp" });
  const smallOpacity = interpolate(frame, [15, 22], [0, 1], { extrapolateRight: "clamp" });
  const bigOpacity = interpolate(frame, [35, 45], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent} currentSlide={1}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 60px",
          gap: 60,
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
            {post.category}
          </div>
        )}

        {/* Screenshot image — newsjacking only */}
        {!showQuote && post.slide1.image && (
          <div
            style={{
              opacity: imgOpacity,
              transform: `translateY(${imgTranslateY}px)`,
              maxHeight: 480,
              overflow: "hidden",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <HalftoneImage src={resolveAssetPath(post.slide1.image)} />
          </div>
        )}

        {/* Contrarian: big quoted text instead of image */}
        {showQuote && post.slide1.image && (
          <div
            style={{
              opacity: imgOpacity,
              color: "rgba(255,255,255,0.55)",
              fontSize: 60,
              fontWeight: 700,
              fontFamily: spaceGroteskFamily,
              lineHeight: 1.2,
              whiteSpace: "pre-line",
            }}
          >
            {`"${post.slide1.image}"`}
          </div>
        )}

        {/* smallText context line */}
        {post.slide1.smallText && (
          <div
            style={{
              opacity: smallOpacity,
              color: "rgba(255,255,255,0.6)",
              fontSize: 45,
              fontFamily: spaceGroteskFamily,
              lineHeight: 1.3,
            }}
          >
            {post.slide1.smallText}
          </div>
        )}

        {/* bigText with glitch */}
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
