import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../../styles/fonts";
import type { DokuDualBox } from "../../types";
import { TERMINAL_RED } from "../../styles/colors";
import { resolveDokuColor, AsciiBox, crtGlow, glowPulse, dokuSafeInset } from "./common";

// Two ASCII boxes stacked vertically.
//
// matchLines mode: specific line indices in both boxes are highlighted red and
// pulse in sync (the "copied module"). All other lines are dimmed to 0.28.
// A vertical annotation label appears between the boxes after the boxes settle.
//
// Without matchLines: legacy glow-word mode (single color, glowWords pulse).
const SETTLE_FRAMES = 8;
const GLOW_DELAY = 14;
const GLOW_DUR = 32;
const SUBLINE_DELAY = 34;
const MATCH_LABEL_DELAY = 40;

const BOX_WIDTH = 28;
const FONT_SIZE = 40;
const DIM_OPACITY = 0.28;

export const DualBoxScene: React.FC<{ scene: DokuDualBox; localFrame?: number }> = ({ scene, localFrame }) => {
  const remotionFrame = useCurrentFrame();
  const frame = localFrame ?? remotionFrame;
  const color = resolveDokuColor(scene.color);

  const boxOpacity = interpolate(frame, [0, SETTLE_FRAMES], [0, 1], { extrapolateRight: "clamp" });

  const hasMatch = (scene.matchLines?.length ?? 0) > 0;

  // Pulse: slow 0.8s sine wave → 0.5..1.0 brightness multiplier
  const pulseMul = hasMatch
    ? 0.75 + 0.25 * Math.sin((frame / 30) * Math.PI * 1.6)
    : glowPulse(frame, GLOW_DELAY, GLOW_DUR);

  const matchLabelOpacity = hasMatch
    ? interpolate(frame, [MATCH_LABEL_DELAY, MATCH_LABEL_DELAY + 10], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  // Subline (legacy / non-match mode)
  const subOpacity = !hasMatch
    ? interpolate(frame, [SUBLINE_DELAY, SUBLINE_DELAY + 10], [0, 1], { extrapolateRight: "clamp" })
    : 0;
  const subTranslate = !hasMatch
    ? interpolate(frame, [SUBLINE_DELAY, SUBLINE_DELAY + 14], [32, 0], { extrapolateRight: "clamp" })
    : 0;

  const renderBox = (side: { title: string; lines: string[] }) => {
    if (hasMatch) {
      const matchSet = new Set(scene.matchLines!);
      return (
        <AsciiBox title={side.title} width={BOX_WIDTH} style="single" color={color} fontSize={FONT_SIZE} glow={0.4} padding={1}>
          {side.lines.map((line, i) => {
            const isMatch = matchSet.has(i);
            const lineColor = isMatch ? TERMINAL_RED : color;
            const opacity = isMatch ? pulseMul : DIM_OPACITY;
            return (
              <span key={i} style={{
                color: lineColor,
                opacity,
                textShadow: isMatch ? crtGlow(TERMINAL_RED, 0.8 * pulseMul) : "none",
                display: "block",
              }}>
                {" " + line}
              </span>
            );
          })}
        </AsciiBox>
      );
    }

    // Legacy: glow-word mode
    const hasGlowWords = (scene.glowWords?.length ?? 0) > 0;
    const INNER_WIDTH = BOX_WIDTH - 2;
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const renderLine = (raw: string): React.ReactNode => {
      const leaded = " " + raw;
      const trailing = Math.max(0, INNER_WIDTH - leaded.length);
      if (!hasGlowWords) return leaded + " ".repeat(trailing);
      const tokens: React.ReactNode[] = [];
      let remaining = leaded;
      let key = 0;
      const pattern = new RegExp(`(${scene.glowWords!.map(escapeRegex).join("|")})`);
      while (remaining.length > 0) {
        const m = remaining.match(pattern);
        if (!m || m.index === undefined) { tokens.push(remaining); break; }
        if (m.index > 0) tokens.push(remaining.substring(0, m.index));
        tokens.push(
          <span key={key++} style={{ color, fontWeight: 700, textShadow: crtGlow(color, 1.0 * pulseMul) }}>
            {m[0]}
          </span>
        );
        remaining = remaining.substring(m.index + m[0].length);
      }
      if (trailing > 0) tokens.push(" ".repeat(trailing));
      return <>{tokens}</>;
    };

    if (hasGlowWords) {
      return (
        <AsciiBox title={side.title} width={BOX_WIDTH} style="single" color={color} fontSize={FONT_SIZE} glow={0.6} padding={1}>
          {side.lines.map((line, i) => <span key={i}>{renderLine(line)}</span>)}
        </AsciiBox>
      );
    }
    return <AsciiBox title={side.title} width={BOX_WIDTH} style="single" color={color} fontSize={FONT_SIZE} glow={0.6} padding={1} bodyLines={side.lines} />;
  };

  return (
    <div style={{
      ...dokuSafeInset,
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      gap: 0,
      opacity: boxOpacity,
    }}>
      {renderBox(scene.left)}

      {/* Vertical annotation between the two boxes */}
      {hasMatch && scene.matchLabel && (
        <div style={{
          opacity: matchLabelOpacity,
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 0,
          padding: "6px 0",
        }}>
          <div style={{ fontFamily: spaceMonoFamily, fontSize: 28, color: TERMINAL_RED, textShadow: crtGlow(TERMINAL_RED, 0.6), letterSpacing: 2 }}>
            ▲
          </div>
          <div style={{ fontFamily: spaceMonoFamily, fontSize: 28, color: TERMINAL_RED, textShadow: crtGlow(TERMINAL_RED, 0.6), letterSpacing: 2, padding: "2px 12px" }}>
            {scene.matchLabel}
          </div>
          <div style={{ fontFamily: spaceMonoFamily, fontSize: 28, color: TERMINAL_RED, textShadow: crtGlow(TERMINAL_RED, 0.6), letterSpacing: 2 }}>
            ▼
          </div>
        </div>
      )}

      {renderBox(scene.right)}

      {/* Legacy subline */}
      {!hasMatch && scene.subline && (
        <div style={{
          marginTop: 12,
          fontFamily: spaceMonoFamily, fontSize: 44, color, fontWeight: 600,
          opacity: subOpacity,
          transform: `translateY(${subTranslate.toFixed(2)}px)`,
          textShadow: crtGlow(color, 0.75), letterSpacing: 1,
        }}>
          {scene.subline}
        </div>
      )}
    </div>
  );
};
