import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../../styles/fonts";
import type { DokuAftermath } from "../../types";
import { resolveDokuColor, crtGlow, dokuSafeInset } from "./common";

// Quiet aftermath screen — text appears with NO motion, no cursor, minimal glow.
// The intentional flatness creates emotional contrast after the glitch chaos.
const APPEAR_DURATION = 8;
const LINE_DELAY = 12;
const FONT_SIZE = 62;

export const AftermathScene: React.FC<{ scene: DokuAftermath; localFrame?: number }> = ({ scene, localFrame }) => {
  const remotionFrame = useCurrentFrame();
  const frame = localFrame ?? remotionFrame;
  const color = resolveDokuColor(scene.color);

  return (
    <div style={{
      ...dokuSafeInset,
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "flex-start",
      gap: 30,
    }}>
      {scene.lines.map((line, i) => {
        const start = i * LINE_DELAY;
        if (frame < start) return null;
        const opacity = interpolate(frame - start, [0, APPEAR_DURATION], [0, 1], {
          extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{
            fontFamily: spaceMonoFamily,
            fontSize: FONT_SIZE,
            color,
            fontWeight: 600,
            opacity,
            letterSpacing: 1,
            whiteSpace: "pre",
            textShadow: crtGlow(color, 0.45),
          }}>
            {line}
          </div>
        );
      })}
    </div>
  );
};
