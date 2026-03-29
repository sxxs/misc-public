import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { BLACK } from "../styles/colors";
import { spaceMonoFamily } from "../styles/fonts";
import { PhotoFrame } from "../components/PhotoFrame";

const DEFAULT_IMAGE_DURATION = 35;

// ── End Card: last image pixelates → watermark on blurred BG ────────────────
const EndCard: React.FC<{ text: string; duration: number }> = ({ text, duration }) => {
  const frame = useCurrentFrame();
  const textOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: BLACK,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity: textOpacity,
          color: "rgba(255,255,255,0.40)",
          fontSize: 42,
          fontFamily: spaceMonoFamily,
          fontWeight: 400,
          letterSpacing: "0.06em",
          textAlign: "center",
        }}
      >
        {text}
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
  const endCardText = endCard?.text ?? "@herdom.bamberg";
  const endCardDuration = endCard?.duration ?? 60;

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
      <Sequence from={frameOffset} durationInFrames={endCardDuration}>
        <EndCard text={endCardText} duration={endCardDuration} />
      </Sequence>
    </>
  );
};
