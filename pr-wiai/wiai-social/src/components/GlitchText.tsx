import React from "react";
import { useCurrentFrame } from "remotion";
import { spaceGroteskFamily } from "../styles/fonts";
import { GLITCH_RED, GLITCH_CYAN } from "../styles/colors";

interface Props {
  text: string;
  fontSize?: number;
  glitchStartFrame?: number;
  glitchEndFrame?: number;
  color?: string;
}

export const GlitchText: React.FC<Props> = ({
  text,
  fontSize = 168,
  glitchStartFrame = 40,
  glitchEndFrame = 50,
  color = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const isGlitching = frame >= glitchStartFrame && frame < glitchEndFrame;
  const t = frame - glitchStartFrame;

  // Deterministic pseudo-random offsets using sin with primes — no Math.random()
  const redOffsetX = isGlitching ? Math.sin(t * 7.3) * 8 - 3 : -3;
  const redOffsetY = isGlitching ? Math.sin(t * 5.7) * 4 + 2 : 2;
  const cyanOffsetX = isGlitching ? Math.sin(t * 13.1) * 6 + 3 : 3;
  const cyanOffsetY = isGlitching ? Math.sin(t * 11.3) * 3 - 1 : -1;
  const glitchOpacity = isGlitching ? 0.35 + Math.sin(t * 17) * 0.1 : 0;

  const sharedStyle: React.CSSProperties = {
    fontSize,
    fontWeight: 700,
    lineHeight: 0.95,
    fontFamily: spaceGroteskFamily,
    whiteSpace: "pre-line",
    position: "absolute",
    top: 0,
    left: 0,
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Red layer — clips to upper 40% */}
      <div
        style={{
          ...sharedStyle,
          color: GLITCH_RED,
          opacity: glitchOpacity,
          transform: `translate(${redOffsetX}px, ${redOffsetY}px)`,
          clipPath: "inset(0 0 60% 0)",
        }}
      >
        {text}
      </div>
      {/* Cyan layer — clips to lower 40% */}
      <div
        style={{
          ...sharedStyle,
          color: GLITCH_CYAN,
          opacity: glitchOpacity,
          transform: `translate(${cyanOffsetX}px, ${cyanOffsetY}px)`,
          clipPath: "inset(60% 0 0 0)",
        }}
      >
        {text}
      </div>
      {/* Main text */}
      <div style={{ ...sharedStyle, position: "relative", color }}>
        {text}
      </div>
    </div>
  );
};
