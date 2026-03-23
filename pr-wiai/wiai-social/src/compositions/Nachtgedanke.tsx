import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceMonoFamily, spaceGroteskFamily } from "../styles/fonts";
import { SlideFrame } from "../components/SlideFrame";
import { TypewriterText } from "../components/TypewriterText";
import { PunchlineSlide } from "../components/PunchlineSlide";

// Minimal: just the time, no image, no glitch
const Act1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;
  const timeOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          padding: "100px 108px 0",
        }}
      >
        {post.slide1.time && (
          <div
            style={{
              opacity: timeOpacity,
              color: "rgba(255,255,255,0.35)",
              fontSize: 54,
              fontFamily: spaceMonoFamily,
              letterSpacing: "0.05em",
            }}
          >
            {post.slide1.time}
          </div>
        )}
      </div>
    </SlideFrame>
  );
};

// Typewriter text directly on black — no cutout
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
          padding: "0 108px",
          opacity: containerOpacity,
        }}
      >
        <TypewriterText
          text={post.slide2.text}
          startFrame={6}
          color="#ffffff"
          fontSize={72}
        />
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

// Nachtgedanke timing: Act1=90 frames, Act2=240 frames, Act3=120 frames
export const Nachtgedanke: React.FC<{ post: Post }> = ({ post }) => (
  <>
    <Sequence from={0} durationInFrames={90}><Act1 post={post} /></Sequence>
    <Sequence from={90} durationInFrames={240}><Act2 post={post} /></Sequence>
    <Sequence from={330} durationInFrames={120}><Act3 post={post} /></Sequence>
  </>
);
