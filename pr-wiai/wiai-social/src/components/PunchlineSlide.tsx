import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";
import { TypewriterText } from "./TypewriterText";
import { LedWall } from "./LedWall";

interface Props {
  accentColor: string;
  text: string;
  button?: string;
}

export const PunchlineSlide: React.FC<Props> = ({ accentColor, text, button }) => {
  const frame = useCurrentFrame();

  const containerOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  // Subtext appears after main punchline has landed, stays for rest of slide
  const subtextOpacity = interpolate(frame, [52, 68], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* LED wall backdrop */}
      <LedWall accentColor={accentColor} />

      {/* Main content — safe zone: right 240px, bottom 380px */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 240px 400px 84px",
          gap: 44,
          zIndex: 5,
          opacity: containerOpacity,
        }}
      >
        {/* S3 punchline */}
        <TypewriterText
          text={text}
          fontSize={84}
          startFrame={5}
          framesPerLine={4}
          color="#ffffff"
        />

        {/* Optional follow-up subtext — same font, smaller, dimmed, not a button */}
        {button && (
          <div
            style={{
              opacity: subtextOpacity,
              color: "rgba(255,255,255,0.50)",
              fontSize: 48,
              fontFamily: spaceGroteskFamily,
              fontWeight: 700,
              lineHeight: 1.35,
              whiteSpace: "pre-line",
            }}
          >
            {button}
          </div>
        )}
      </div>

      {/* Absender — bottom-left, legible against LED wall */}
      <div
        style={{
          position: "absolute",
          bottom: 400,
          left: 84,
          zIndex: 6,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(10,10,10,0.60)",
            padding: "8px 18px",
            color: "rgba(255,255,255,0.65)",
            fontSize: 30,
            fontFamily: spaceMonoFamily,
            fontWeight: 400,
            letterSpacing: "0.06em",
          }}
        >
          WIAI · Uni Bamberg · @herdom.bamberg
        </div>
      </div>
    </div>
  );
};
