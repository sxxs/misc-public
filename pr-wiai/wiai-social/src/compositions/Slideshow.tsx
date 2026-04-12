import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { BLACK } from "../styles/colors";
import { spaceMonoFamily } from "../styles/fonts";
import { PhotoFrame } from "../components/PhotoFrame";

const DEFAULT_IMAGE_DURATION = 35;

// ── End Card: Absender with two lines (main + subtitle) ────────────────────
const EndCard: React.FC<{ text: string; subtitle: string; duration: number }> = ({ text, subtitle, duration }) => {
  const frame = useCurrentFrame();
  // Instant pop-in for beat-aligned cut from slide 3
  const textOpacity = frame >= 0 ? 1 : 0;
  const subOpacity = frame >= 2 ? 1 : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: BLACK,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div
        style={{
          opacity: textOpacity,
          color: "rgba(255,255,255,0.72)",
          fontSize: 56,
          fontFamily: spaceMonoFamily,
          fontWeight: 500,
          letterSpacing: "0.04em",
          textAlign: "center",
        }}
      >
        {text}
      </div>
      <div
        style={{
          opacity: subOpacity,
          color: "rgba(255,255,255,0.36)",
          fontSize: 32,
          fontFamily: spaceMonoFamily,
          fontWeight: 400,
          letterSpacing: "0.08em",
          textAlign: "center",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

// ── Slideshow composition ───────────────────────────────────────────────────
export const Slideshow: React.FC<{ post: Post }> = ({ post }) => {
  const config = post.slideshow;
  if (!config) return null;

  const images = config.images;
  const endCard = config.endCard;
  const endCardText = endCard?.text ?? "@echt.bamberg";
  const endCardSubtitle = endCard?.subtitle ?? "WIAI · Uni Bamberg";
  const endCardDuration = endCard?.duration ?? 60;
  const showEndCard = !!endCard;

  // Build timeline: accumulate frame offsets for each image
  let frameOffset = 0;
  const imageSequences = images.map((image, i) => {
    const duration = image.duration ?? DEFAULT_IMAGE_DURATION;
    const from = frameOffset;
    frameOffset += duration;
    return (
      <Sequence key={i} from={from} durationInFrames={duration}>
        <PhotoFrame image={image} accentColor={post.accentColor} />
      </Sequence>
    );
  });

  return (
    <>
      {imageSequences}
      {showEndCard && (
        <Sequence from={frameOffset} durationInFrames={endCardDuration}>
          <EndCard text={endCardText} subtitle={endCardSubtitle} duration={endCardDuration} />
        </Sequence>
      )}
    </>
  );
};
