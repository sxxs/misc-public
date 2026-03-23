import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { SlideFrame } from "../components/SlideFrame";
import { GlitchText } from "../components/GlitchText";
import { HalftoneImage } from "../components/HalftoneImage";
import { DirtyCutout } from "../components/DirtyCutout";
import { TypewriterText } from "../components/TypewriterText";
import { PunchlineSlide } from "../components/PunchlineSlide";

function resolveAssetPath(raw: string): string {
  return raw.replace(/^\.\/assets\//, "");
}

// Fact hook: big keyword/number, optional background image at 15% opacity
const Act1: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const accent = post.accentColor ?? WIAI_YELLOW;
  const bigOpacity = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SlideFrame accentColor={accent}>
      {/* Optional background image at low opacity */}
      {post.slide1.image && (
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, zIndex: 1 }}>
          <HalftoneImage src={resolveAssetPath(post.slide1.image)} style={{ height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 60px",
          gap: 54,
          position: "relative",
          zIndex: 5,
          opacity: bigOpacity,
        }}
      >
        <GlitchText
          text={post.slide1.bigText}
          fontSize={180}
          glitchStartFrame={40}
          glitchEndFrame={52}
          color={accent}
        />
        {post.slide1.smallText && (
          <div
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 48,
              lineHeight: 1.3,
            }}
          >
            {post.slide1.smallText}
          </div>
        )}
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

export const WusstestDu: React.FC<{ post: Post }> = ({ post }) => (
  <>
    <Sequence from={0} durationInFrames={120}><Act1 post={post} /></Sequence>
    <Sequence from={120} durationInFrames={210}><Act2 post={post} /></Sequence>
    <Sequence from={330} durationInFrames={120}><Act3 post={post} /></Sequence>
  </>
);
