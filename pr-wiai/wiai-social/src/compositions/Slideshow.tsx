import React from "react";
import { Sequence, useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { BLACK } from "../styles/colors";
import { spaceMonoFamily, spaceGroteskFamily } from "../styles/fonts";
import { PhotoFrame } from "../components/PhotoFrame";

const DEFAULT_IMAGE_DURATION = 35;

// ── End Card: punchline + aside + WIAI absender ─────────────────────────────
const EndCard: React.FC<{ text: string; aside?: string; duration: number }> = ({ text, aside, duration }) => {
  const frame = useCurrentFrame();
  const textOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const asideOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const absenderOpacity = interpolate(frame, [35, 60], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0, background: BLACK }}>
      {/* Content block: punchline + aside in one flow, upper half */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start",
        paddingTop: 480,
      }}>
        {/* Punchline — newspaper cutout */}
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 10,
          opacity: textOpacity,
        }}>
          {text.split("\n").map((line, i) => (
            <span key={i} style={{
              display: "inline-block",
              background: "#fff",
              color: "#000",
              padding: "12px 28px 14px",
              fontSize: 72,
              fontWeight: 700,
              fontFamily: spaceGroteskFamily,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}>
              {line}
            </span>
          ))}
        </div>

        {/* Aside — larger, brighter, below punchline */}
        {aside && (
          <div style={{
            marginTop: 64,
            textAlign: "center",
            color: "rgba(255,255,255,0.68)",
            fontSize: 42,
            fontFamily: spaceGroteskFamily,
            fontWeight: 400,
            letterSpacing: "0.01em",
            padding: "0 140px",
            whiteSpace: "pre-line",
            opacity: asideOpacity,
          }}>
            {aside}
          </div>
        )}
      </div>

      {/* WIAI Absender — bottom left, standard style */}
      <div style={{
        position: "absolute", bottom: 748, left: 108,
        display: "flex", flexDirection: "column", gap: 0,
        opacity: absenderOpacity,
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(10,10,10,0.95)",
          padding: "8px 18px 6px",
          color: "rgba(255,255,255,0.80)",
          fontSize: 36,
          fontFamily: spaceMonoFamily,
          fontWeight: 400,
          letterSpacing: "0.06em",
        }}>
          WIAI · Uni Bamberg
        </div>
        <div style={{
          display: "inline-block",
          background: "rgba(10,10,10,0.95)",
          padding: "6px 18px 8px",
          color: "rgba(255,255,255,0.80)",
          fontSize: 36,
          fontFamily: spaceMonoFamily,
          fontWeight: 400,
          letterSpacing: "0.06em",
        }}>
          @echt.bamberg
        </div>
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
          <EndCard text={endCardText} aside={endCard?.aside} duration={endCardDuration} />
        </Sequence>
      )}
    </>
  );
};
