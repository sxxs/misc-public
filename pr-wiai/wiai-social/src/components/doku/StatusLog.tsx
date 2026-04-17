import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../../styles/fonts";
import type { DokuStatusLog } from "../../types";
import { resolveDokuColor, crtGlow, glowPulse, dokuSafeInset } from "./common";

// Status-block: typed-out KEY: VALUE rows, top-anchored inside the safe zone.
// Entries appear sequentially (entryDelay frames apart) and each types char-by-char.
// Glowing entries pulse once after the value has finished typing.
const ENTRY_DELAY = 8;               // snappy reveal (was 18f)
const TYPE_FRAMES_PER_CHAR = 1;      // 2x faster typing
const FONT_SIZE = 46;

export const StatusLogScene: React.FC<{ scene: DokuStatusLog; localFrame?: number }> = ({ scene, localFrame }) => {
  const remotionFrame = useCurrentFrame();
  const frame = localFrame ?? remotionFrame;
  const color = resolveDokuColor(scene.color);

  // Align label widths so values line up in a column
  const labelWidth = scene.entries.reduce((m, e) => Math.max(m, e.label.length), 0);

  return (
    <div style={{
      ...dokuSafeInset,
      display: "flex", flexDirection: "column",
      justifyContent: "flex-start", alignItems: "flex-start",
      paddingTop: 40,
    }}>
      {scene.entries.map((entry, i) => {
        const start = i * ENTRY_DELAY;
        if (frame < start) return null;
        const t = frame - start;

        const fullLine = entry.label.padEnd(labelWidth, " ") + ": " + entry.value;
        const visibleChars = Math.min(fullLine.length, Math.floor(t / TYPE_FRAMES_PER_CHAR));
        const display = fullLine.substring(0, visibleChars);

        const valueStartChar = labelWidth + 2;
        const valueDoneAt = start + (valueStartChar + entry.value.length) * TYPE_FRAMES_PER_CHAR;
        const glowMul = entry.glow && frame > valueDoneAt + 4 ? glowPulse(frame, valueDoneAt + 4, 40) : 1;
        const opacity = interpolate(t, [0, 4], [0, 1], { extrapolateRight: "clamp" });

        return (
          <div key={i} style={{
            fontFamily: spaceMonoFamily,
            fontSize: FONT_SIZE,
            color,
            fontWeight: 600,
            opacity,
            letterSpacing: 1,
            whiteSpace: "pre",
            textShadow: crtGlow(color, 0.65 * glowMul),
            marginBottom: 18,
          }}>
            {display}
          </div>
        );
      })}
    </div>
  );
};
