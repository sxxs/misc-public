import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceGroteskFamily } from "../styles/fonts";
import { SlideFrame } from "../components/SlideFrame";
import { GlitchText } from "../components/GlitchText";
import { DirtyCutout } from "../components/DirtyCutout";
import { TypewriterText } from "../components/TypewriterText";
import { CtaSlide } from "../components/CtaSlide";

// Slide1: shows a quoted opinion/claim instead of a screenshot
const Act1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;

  const quoteOpacity = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" });
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
          gap: 72,
        }}
      >
        {/* The common opinion being challenged */}
        {post.slide1.smallText && (
          <div
            style={{
              opacity: quoteOpacity,
              color: "rgba(255,255,255,0.45)",
              fontSize: 54,
              fontWeight: 700,
              fontFamily: spaceGroteskFamily,
              lineHeight: 1.25,
              whiteSpace: "pre-line",
              borderLeft: `6px solid ${accent}`,
              paddingLeft: 36,
            }}
          >
            {`"${post.slide1.smallText}"`}
          </div>
        )}

        {/* Contrarian reaction with glitch */}
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
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 60px" }}>
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

export const Contrarian: React.FC<{ post: Post }> = ({ post }) => (
  <>
    <Sequence from={0} durationInFrames={120}><Act1 post={post} /></Sequence>
    <Sequence from={120} durationInFrames={210}><Act2 post={post} /></Sequence>
    <Sequence from={330} durationInFrames={120}><Act3 post={post} /></Sequence>
  </>
);
