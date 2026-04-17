import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../../styles/fonts";
import type { DokuLogCrawl } from "../../types";
import { resolveDokuColor, crtGlow, scrambleText, dokuSafeInset } from "./common";
import { TERMINAL_RED, GLITCH_RED, GLITCH_CYAN } from "../../styles/colors";

// Terminal log that reveals lines one after another.
// Each line can specify `glitchAt` (local frame) at which it scrambles for ~5f
// then is replaced with `replaceWith` (in red if `alert: true`). During the
// alert phase the WHOLE screen wackles for ~8f.
const DEFAULT_LINE_DELAY = 10;       // snappy (was 20f)
const GLITCH_DURATION = 5;
const SHAKE_DURATION = 8;
const FONT_SIZE = 46;

export const LogCrawlScene: React.FC<{ scene: DokuLogCrawl; localFrame?: number }> = ({ scene, localFrame }) => {
  const remotionFrame = useCurrentFrame();
  const frame = localFrame ?? remotionFrame;
  const baseColor = resolveDokuColor(scene.color);
  const lineDelay = scene.lineDelay ?? DEFAULT_LINE_DELAY;

  // Screen-shake: active while any line is mid-glitch
  let shakeX = 0;
  let shakeY = 0;
  for (const line of scene.lines) {
    if (line.glitchAt == null) continue;
    const t = frame - line.glitchAt;
    if (t >= 0 && t < SHAKE_DURATION) {
      const decay = 1 - t / SHAKE_DURATION;
      shakeX = Math.sin(t * 21) * 14 * decay;
      shakeY = Math.sin(t * 17) * 7 * decay;
    }
  }

  return (
    <div style={{
      ...dokuSafeInset,
      paddingTop: 40,
      transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px)`,
    }}>
      {scene.lines.map((line, i) => {
        const lineStart = i * lineDelay;
        if (frame < lineStart) return null;

        const t = frame - lineStart;
        const opacity = interpolate(t, [0, 4], [0, 1], { extrapolateRight: "clamp" });

        let display = line.text;
        let lineColor = baseColor;
        let isGlitching = false;

        if (line.glitchAt != null) {
          const gT = frame - line.glitchAt;
          if (gT >= 0 && gT < GLITCH_DURATION) {
            display = scrambleText(frame * 11, line.text.length);
            isGlitching = true;
          } else if (gT >= GLITCH_DURATION && line.replaceWith) {
            display = line.replaceWith;
            if (line.alert) lineColor = TERMINAL_RED;
          }
        }

        const baseStyle: React.CSSProperties = {
          fontFamily: spaceMonoFamily,
          fontSize: FONT_SIZE,
          fontWeight: 600,
          color: lineColor,
          opacity,
          letterSpacing: 1,
          whiteSpace: "pre",
          textShadow: crtGlow(lineColor, 0.72),
          marginBottom: 20,
          position: "relative",
        };

        if (isGlitching) {
          const sx = Math.sin(frame * 13.7) * 6;
          return (
            <div key={i} style={{ position: "relative", marginBottom: 20, height: FONT_SIZE * 1.2 }}>
              <div style={{ ...baseStyle, position: "absolute", inset: 0, marginBottom: 0, color: GLITCH_RED, opacity: 0.5, transform: `translateX(${sx.toFixed(2)}px)` }}>{display}</div>
              <div style={{ ...baseStyle, position: "absolute", inset: 0, marginBottom: 0, color: GLITCH_CYAN, opacity: 0.5, transform: `translateX(${(-sx).toFixed(2)}px)` }}>{display}</div>
              <div style={{ ...baseStyle, position: "absolute", inset: 0, marginBottom: 0 }}>{display}</div>
            </div>
          );
        }

        return <div key={i} style={baseStyle}>{display}</div>;
      })}
    </div>
  );
};
