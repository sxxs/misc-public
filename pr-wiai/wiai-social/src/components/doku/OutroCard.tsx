import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../../styles/fonts";
import type { DokuOutroCard } from "../../types";
import { resolveDokuColor, crtGlow, useSlowCursor, dokuSafeInset } from "./common";

// Closing brand card. Keeps the terminal aesthetic (no heavy logos / icons).
// Layout:
//   ┌ "> " prompt on a line above the title for rhythm continuity
//   │ @echt.bamberg     (big, green, glowing)
//   │ WIAI · UNI BAMBERG (smaller, dimmer)
//   └ blinking cursor
const FONT_SIZE_TITLE = 80;
const FONT_SIZE_SUB = 40;

export const OutroCardScene: React.FC<{ scene: DokuOutroCard; localFrame?: number }> = ({ scene, localFrame }) => {
  const remotionFrame = useCurrentFrame();
  const frame = localFrame ?? remotionFrame;
  const color = resolveDokuColor(scene.color);
  const cursor = useSlowCursor(frame);

  // Fade in title fast, subtitle a bit later
  const titleOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [8, 16], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{
      ...dokuSafeInset,
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      gap: 20,
    }}>
      <div style={{
        fontFamily: spaceMonoFamily,
        fontSize: FONT_SIZE_TITLE,
        color,
        fontWeight: 700,
        opacity: titleOpacity,
        letterSpacing: 2,
        whiteSpace: "pre",
        textShadow: crtGlow(color, 0.9),
      }}>
        {scene.title}{cursor ? "▋" : " "}
      </div>
      {scene.subtitle && (
        <div style={{
          fontFamily: spaceMonoFamily,
          fontSize: FONT_SIZE_SUB,
          color,
          fontWeight: 500,
          opacity: subOpacity * 0.78,
          letterSpacing: 3,
          whiteSpace: "pre",
          textShadow: crtGlow(color, 0.5),
          marginTop: 8,
        }}>
          {scene.subtitle}
        </div>
      )}
    </div>
  );
};
