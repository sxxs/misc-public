import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceGroteskFamily } from "../styles/fonts";
import { SlideFrame } from "../components/SlideFrame";
import { GlitchText } from "../components/GlitchText";
import { DirtyCutout } from "../components/DirtyCutout";
import { TypewriterText } from "../components/TypewriterText";
import { LedWall } from "../components/LedWall";
import { PunchlineSlide } from "../components/PunchlineSlide";

// Slide1: big reaction + setup quote below, LED wall backdrop
const Act1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;

  const bigOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const quoteOpacity = interpolate(frame, [18, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      <LedWall accentColor={accent} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 240px 420px 60px",
          gap: 40,
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Setup quote — plain, no decorative bar */}
        {post.slide1.smallText && (
          <div
            style={{
              opacity: quoteOpacity,
              color: "rgba(255,255,255,0.55)",
              fontSize: 60,
              fontWeight: 700,
              fontFamily: spaceGroteskFamily,
              lineHeight: 1.2,
              whiteSpace: "pre-line",
            }}
          >
            {`„${post.slide1.smallText}"`}
          </div>
        )}

        {/* Contrarian reaction — big */}
        <div style={{ opacity: bigOpacity }}>
          <GlitchText
            text={post.slide1.bigText}
            fontSize={210}
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
    <SlideFrame accentColor={accent}>
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
    <SlideFrame accentColor={accent}>
      <PunchlineSlide accentColor={accent} text={post.slide3.text} button={post.slide3.button} />
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
