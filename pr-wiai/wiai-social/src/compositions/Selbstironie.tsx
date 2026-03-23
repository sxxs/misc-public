import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceMonoFamily } from "../styles/fonts";
import { SlideFrame } from "../components/SlideFrame";
import { TypewriterText } from "../components/TypewriterText";
import { PunchlineSlide } from "../components/PunchlineSlide";

// Like Nachtgedanke but with optional label instead of time
const Act1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;
  const labelOpacity = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", padding: "90px 84px 0" }}>
        {post.slide1.label && (
          <div
            style={{
              opacity: labelOpacity,
              color: "rgba(255,255,255,0.4)",
              fontSize: 36,
              fontFamily: spaceMonoFamily,
              letterSpacing: "0.15em",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {post.slide1.label}
          </div>
        )}
      </div>
    </SlideFrame>
  );
};

const Act2: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;
  const containerOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0 84px",
          opacity: containerOpacity,
        }}
      >
        <TypewriterText text={post.slide2.text} startFrame={6} color="#ffffff" fontSize={72} />
      </div>
    </SlideFrame>
  );
};

const Act3: React.FC<{ post: Post }> = ({ post }) => {
  const accent = post.accentColor ?? WIAI_YELLOW;
  return (
    <SlideFrame accentColor={accent}>
      <PunchlineSlide accentColor={accent} text={post.slide3.text} button={post.slide3.button} showAbsender={post.isAd} />
    </SlideFrame>
  );
};

export const Selbstironie: React.FC<{ post: Post }> = ({ post }) => (
  <>
    <Sequence from={0} durationInFrames={90}><Act1 post={post} /></Sequence>
    <Sequence from={90} durationInFrames={240}><Act2 post={post} /></Sequence>
    <Sequence from={330} durationInFrames={120}><Act3 post={post} /></Sequence>
  </>
);
