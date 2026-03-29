import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { BillboardCaption } from "../types";
import { BLACK } from "../styles/colors";
import { spaceGroteskFamily } from "../styles/fonts";

const CAPTION_DEFAULT_HOLD = 25;
const FLASH_OUT_FRAMES = 6;

// Variable font size based on word count — short phrases get plakativ treatment
function captionFontSize(text: string): number {
  const words = text.trim().split(/\s+/).length;
  if (words <= 2) return 120;
  if (words <= 4) return 80;
  return 60;
}

// Cutout style: black text on white bounding box, newspaper-clipping look
const CutoutCaption: React.FC<{ text: string; fontSize: number }> = ({ text, fontSize }) => (
  <div
    style={{
      display: "inline-block",
      background: "#F0EDE8",
      padding: `${fontSize * 0.3}px ${fontSize * 0.5}px`,
      clipPath:
        "polygon(0.5% 1%, 98% 0%, 99.5% 2%, 99% 97.5%, 97.5% 99.5%, 1.5% 99%, 0% 97%, 0.5% 2.5%)",
      transform: `rotate(${-0.4 + Math.random() * 0}deg)`, // deterministic slight tilt
    }}
  >
    <div
      style={{
        color: "#0A0A0A",
        fontSize,
        fontWeight: 700,
        lineHeight: 1.15,
        fontFamily: spaceGroteskFamily,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  </div>
);

// White style: white text on black (standard)
const WhiteCaption: React.FC<{ text: string; fontSize: number }> = ({ text, fontSize }) => (
  <div
    style={{
      color: "#ffffff",
      fontSize,
      fontWeight: 700,
      lineHeight: 1.15,
      fontFamily: spaceGroteskFamily,
      textAlign: "center",
      maxWidth: 900,
    }}
  >
    {text}
  </div>
);

export const CaptionSequence: React.FC<{ captions: BillboardCaption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();

  // Calculate total duration for flash-out timing
  const totalCaptionFrames = captions.reduce(
    (sum, c) => sum + (c.hold ?? CAPTION_DEFAULT_HOLD),
    0,
  );
  const totalDuration = totalCaptionFrames + FLASH_OUT_FRAMES;

  // Flash-out: white overlay at the very end
  const flashPhase = frame - totalCaptionFrames;

  // Find which caption is active at current frame
  let accumulated = 0;
  let activeIndex = -1;
  for (let i = 0; i < captions.length; i++) {
    const hold = captions[i].hold ?? CAPTION_DEFAULT_HOLD;
    if (frame >= accumulated && frame < accumulated + hold) {
      activeIndex = i;
      break;
    }
    accumulated += hold;
  }

  const activeCaption = activeIndex >= 0 ? captions[activeIndex] : null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: BLACK,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 108px 400px 108px",
      }}
    >
      {/* Active caption — hard cut, no fade */}
      {activeCaption && (() => {
        const fontSize = captionFontSize(activeCaption.text);
        const style = activeCaption.style ?? "white";
        return style === "cutout" ? (
          <CutoutCaption text={activeCaption.text} fontSize={fontSize} />
        ) : (
          <WhiteCaption text={activeCaption.text} fontSize={fontSize} />
        );
      })()}

      {/* Flash-out: white overlay fading to black */}
      {flashPhase >= 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#ffffff",
            opacity: interpolate(flashPhase, [0, FLASH_OUT_FRAMES], [1, 0], {
              extrapolateRight: "clamp",
            }),
          }}
        />
      )}

      {/* Footer: @herdom.bamberg */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255,255,255,0.25)",
          fontSize: 28,
          fontFamily: "Space Mono, monospace",
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        @herdom.bamberg
      </div>
    </div>
  );
};
