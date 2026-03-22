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
  const buttonOpacity = interpolate(frame, [45, 58], [0, 1], { extrapolateRight: "clamp" });

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
          padding: "0 240px 380px 84px",
          gap: 48,
          zIndex: 5,
          opacity: containerOpacity,
        }}
      >
        {/* S3 punchline text */}
        <TypewriterText
          text={text}
          fontSize={78}
          startFrame={5}
          framesPerLine={3}
          color="#ffffff"
        />

        {/* Optional button — dimmed follow-up beat */}
        {button && (
          <div
            style={{
              opacity: buttonOpacity,
              color: "rgba(255,255,255,0.45)",
              fontSize: 42,
              fontFamily: spaceMonoFamily,
              fontWeight: 400,
              lineHeight: 1.4,
              whiteSpace: "pre-line",
            }}
          >
            {button}
          </div>
        )}
      </div>

      {/* Absender — subtle, bottom-left, inside safe zone */}
      <div
        style={{
          position: "absolute",
          bottom: 390,
          left: 84,
          zIndex: 6,
          color: "rgba(255,255,255,0.28)",
          fontSize: 28,
          fontFamily: spaceMonoFamily,
          fontWeight: 400,
          letterSpacing: "0.06em",
          pointerEvents: "none",
        }}
      >
        WIAI · Uni Bamberg · @herdom.bamberg
      </div>
    </div>
  );
};
