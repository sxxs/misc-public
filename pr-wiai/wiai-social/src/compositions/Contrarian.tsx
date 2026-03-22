import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceGroteskFamily } from "../styles/fonts";
import { computeAct2Duration } from "../utils/timing";
import { SlideFrame } from "../components/SlideFrame";
import { GlitchText } from "../components/GlitchText";
import { DirtyCutout } from "../components/DirtyCutout";
import { TypewriterText } from "../components/TypewriterText";
import { LedWall } from "../components/LedWall";
import { PunchlineSlide } from "../components/PunchlineSlide";

// Slide1: quote fades in immediately (eye-catcher), Aha. time-offset below
const Act1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;

  // Quote appears right away — this is what draws the eye
  const quoteOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  // Aha. enters later, punchline moment
  const bigOpacity = interpolate(frame, [28, 42], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      <LedWall accentColor={accent} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          // Shift content slightly above vertical center by adding more bottom padding
          padding: "180px 240px 500px 60px",
          gap: 44,
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Setup quote — big and bold, this lands first */}
        {post.slide1.smallText && (
          <div
            style={{
              opacity: quoteOpacity,
              color: "rgba(255,255,255,0.80)",
              fontSize: 72,
              fontWeight: 700,
              fontFamily: spaceGroteskFamily,
              lineHeight: 1.2,
              whiteSpace: "pre-line",
            }}
          >
            {`„${post.slide1.smallText}"`}
          </div>
        )}

        {/* Contrarian reaction — even bigger, time-offset */}
        <div style={{ opacity: bigOpacity }}>
          <GlitchText
            text={post.slide1.bigText}
            fontSize={240}
            glitchStartFrame={46}
            glitchEndFrame={58}
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

export const Contrarian: React.FC<{ post: Post }> = ({ post }) => {
  const act2Duration = computeAct2Duration(post.slide2.text);
  const act3Start = 120 + act2Duration;
  return (
    <>
      <Sequence from={0} durationInFrames={120}><Act1 post={post} /></Sequence>
      <Sequence from={120} durationInFrames={act2Duration}><Act2 post={post} /></Sequence>
      <Sequence from={act3Start} durationInFrames={120}><Act3 post={post} /></Sequence>
    </>
  );
};
