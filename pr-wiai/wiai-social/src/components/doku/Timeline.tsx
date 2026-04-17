import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../../styles/fonts";
import type { DokuTimeline } from "../../types";
import { TERMINAL_RED } from "../../styles/colors";
import { resolveDokuColor, AsciiBox, crtGlow, scrambleText, dokuSafeInset } from "./common";

// Vertical timeline: optional header box → connecting │ line → entries.
//
// Animation sequence (all local frames):
//   0..HEADER_SETTLE      header box fades in
//   ENTRY_START           first entry snaps in
//   ENTRY_START+SETTLE    connector line draws down (one │ per LINE_STEP frames)
//   after connector done  connectorLabel fades in beside the line
//   after label           next entry snaps in
//   entry.glitchAt        that entry glitches to glitchTo, flips red
const HEADER_SETTLE = 10;
const ENTRY_SETTLE = 6;
const LINE_STEP = 5;         // frames per │ character drawn
const CONNECTOR_CHARS = 4;   // number of │ rows in the connector
const LABEL_DELAY = 6;       // frames after connector is done before label appears
const BOX_WIDTH = 26;
const FONT_SIZE = 44;
const TIME_COL_WIDTH = 6;    // chars for the time column, e.g. "T+37  "

export const TimelineScene: React.FC<{ scene: DokuTimeline; localFrame?: number }> = ({ scene, localFrame }) => {
  const remotionFrame = useCurrentFrame();
  const frame = localFrame ?? remotionFrame;
  const color = resolveDokuColor(scene.color);

  const headerOpacity = scene.header
    ? interpolate(frame, [0, HEADER_SETTLE], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  const entryStart = scene.header ? HEADER_SETTLE + 8 : 4;

  // Calculate when each inter-entry connector finishes
  // and when the next entry appears
  const entryTimings: number[] = [];
  let cursor = entryStart;
  for (let i = 0; i < scene.entries.length; i++) {
    entryTimings.push(cursor);
    cursor += ENTRY_SETTLE + CONNECTOR_CHARS * LINE_STEP + LABEL_DELAY + ENTRY_SETTLE;
  }

  const connectorStartFor = (i: number) => entryTimings[i] + ENTRY_SETTLE;
  const labelStartFor = (i: number) => connectorStartFor(i) + CONNECTOR_CHARS * LINE_STEP + LABEL_DELAY;
  const nextEntryStart = (i: number) => labelStartFor(i) + ENTRY_SETTLE;

  return (
    <div style={{
      ...dokuSafeInset,
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "flex-start",
      gap: 0,
    }}>
      {/* Header box */}
      {scene.header && (
        <div style={{ opacity: headerOpacity, marginBottom: 28 }}>
          <AsciiBox
            title=""
            width={BOX_WIDTH}
            style="single"
            color={color}
            fontSize={FONT_SIZE - 4}
            glow={0.5}
            padding={1}
            bodyLines={scene.header}
          />
        </div>
      )}

      {/* Timeline entries with connectors */}
      {scene.entries.map((entry, i) => {
        const appearAt = i === 0 ? entryStart : nextEntryStart(i - 1);
        if (frame < appearAt) return null;

        const isAlert = entry.alert ?? false;
        const hasGlitch = entry.glitchTo !== undefined && entry.glitchAt !== undefined;
        const glitchHit = hasGlitch && frame >= entry.glitchAt!;
        const glitchWindow = hasGlitch && frame >= entry.glitchAt! && frame < entry.glitchAt! + 6;
        const entryColor = (isAlert && glitchHit) ? TERMINAL_RED : color;

        let labelText = glitchHit ? entry.glitchTo! : entry.label;
        if (glitchWindow) labelText = scrambleText(frame * 19 + i * 37, labelText.length);

        const entryOpacity = interpolate(frame - appearAt, [0, ENTRY_SETTLE], [0, 1], { extrapolateRight: "clamp" });

        // Connector below this entry (not for last entry)
        const hasConnector = i < scene.entries.length - 1;
        const connStart = connectorStartFor(i);
        const charsVisible = hasConnector
          ? Math.min(CONNECTOR_CHARS, Math.max(0, Math.floor((frame - connStart) / LINE_STEP)))
          : 0;
        const labelOpacity = hasConnector && scene.connectorLabel
          ? interpolate(frame - labelStartFor(i), [0, 8], [0, 1], { extrapolateRight: "clamp" })
          : 0;

        return (
          <React.Fragment key={i}>
            {/* Entry row: TIME  ────  LABEL */}
            <div style={{
              display: "flex", flexDirection: "row", alignItems: "baseline",
              gap: 0, opacity: entryOpacity,
            }}>
              <span style={{
                fontFamily: spaceMonoFamily,
                fontSize: FONT_SIZE,
                color: entryColor,
                fontWeight: 700,
                letterSpacing: 1,
                whiteSpace: "pre",
                textShadow: crtGlow(entryColor, (isAlert && glitchHit) ? 1.0 : 0.6),
                minWidth: `${TIME_COL_WIDTH}ch`,
              }}>
                {entry.time}
              </span>
              <span style={{
                fontFamily: spaceMonoFamily,
                fontSize: FONT_SIZE - 2,
                color: entryColor,
                fontWeight: 600,
                letterSpacing: 1,
                whiteSpace: "pre",
                textShadow: crtGlow(entryColor, (isAlert && glitchHit) ? 0.9 : 0.5),
              }}>
                {"  " + labelText}
              </span>
            </div>

            {/* Vertical connector to next entry */}
            {hasConnector && (
              <div style={{
                display: "flex", flexDirection: "row", alignItems: "flex-start",
                marginLeft: `${Math.floor(TIME_COL_WIDTH * 0.5)}ch`,
                gap: 0,
              }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {Array.from({ length: charsVisible }).map((_, ci) => (
                    <span key={ci} style={{
                      fontFamily: spaceMonoFamily,
                      fontSize: FONT_SIZE,
                      color,
                      lineHeight: 1.15,
                      textShadow: crtGlow(color, 0.4),
                    }}>│</span>
                  ))}
                </div>
                {scene.connectorLabel && charsVisible >= CONNECTOR_CHARS && (
                  <span style={{
                    fontFamily: spaceMonoFamily,
                    fontSize: Math.round(FONT_SIZE * 0.65),
                    color,
                    opacity: labelOpacity,
                    marginLeft: 16,
                    marginTop: `${Math.round(FONT_SIZE * 0.5)}px`,
                    textShadow: crtGlow(color, 0.3),
                    letterSpacing: 2,
                    whiteSpace: "pre",
                  }}>
                    {scene.connectorLabel}
                  </span>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
