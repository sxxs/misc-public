import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceGroteskFamily } from "../styles/fonts";
import { SlideFrame } from "../components/SlideFrame";
import { PunchlineSlide } from "../components/PunchlineSlide";

// Slide 1: question in yellow
const Act1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0 84px",
          opacity,
        }}
      >
        <div
          style={{
            color: WIAI_YELLOW,
            fontSize: 150,
            fontWeight: 700,
            lineHeight: 1.0,
            fontFamily: spaceGroteskFamily,
            whiteSpace: "pre-line",
          }}
        >
          {post.slide1.bigText}
        </div>
      </div>
    </SlideFrame>
  );
};

// Slide 2: punchline — instant reveal, no typewriter (comedy timing)
const Act2: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;
  const opacity = interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0 84px",
          opacity,
        }}
      >
        <div
          style={{
            color: WIAI_YELLOW,
            fontSize: 120,
            fontWeight: 700,
            lineHeight: 1.1,
            fontFamily: spaceGroteskFamily,
            whiteSpace: "pre-line",
          }}
        >
          {post.slide2.text}
        </div>
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

export const Witz: React.FC<{ post: Post }> = ({ post }) => (
  <>
    <Sequence from={0} durationInFrames={120}><Act1 post={post} /></Sequence>
    <Sequence from={120} durationInFrames={210}><Act2 post={post} /></Sequence>
    <Sequence from={330} durationInFrames={120}><Act3 post={post} /></Sequence>
  </>
);
