import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";
import { computeAct3Duration } from "../utils/timing";
import { TypewriterText } from "./TypewriterText";
import { LedWall } from "./LedWall";

interface Props {
  accentColor: string;
  text: string;
  button?: string;           // comedian's tag — no label, shown dimmed
  übrigensText?: string;     // aside with "ÜBRIGENS…" label — alternative to button
  url?: string;              // optional CTA URL below button/übrigensText
  showAbsender?: boolean;
  totalDuration?: number;    // Act3 sequence length; if omitted, computed from text
  subtextStartFrame?: number;  // local frame when button/übrigensText fades in (default 52)
  absenderStartFrame?: number; // local frame when absender fades in (default 82)
}

export const PunchlineSlide: React.FC<Props> = ({
  accentColor, text, button, übrigensText, url, showAbsender = true, totalDuration,
  subtextStartFrame = 52, absenderStartFrame = 82,
}) => {
  const frame = useCurrentFrame();

  // Timing anchored to sequence end — works for any totalDuration
  const dur = totalDuration ?? computeAct3Duration(text, button, übrigensText);
  const flashStart  = dur - 12; // LEDs start ramping; text starts fading
  const glitchStart = dur - 16; // glitch begins 4f before flash

  const containerOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  // Button + URL appear after main punchline has landed
  const subtextOpacity = interpolate(frame, [subtextStartFrame, subtextStartFrame + 16], [0, 1], { extrapolateRight: "clamp" });
  // Absender fades in last, slowly — doesn't compete with main content
  const absenderOpacity = interpolate(frame, [absenderStartFrame, absenderStartFrame + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Mic drop: text wrapper fades out over 6f as LEDs flash
  const endFadeOut = interpolate(frame, [flashStart, flashStart + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Glitch-dissolve: chromatic smear + lateral shift; starts before fade so boxes break apart visibly
  const glitchProgress = interpolate(frame, [glitchStart, flashStart + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gx = Math.sin(frame * 17.3) * glitchProgress * 90;
  const gy = Math.sin(frame * 7.1)  * glitchProgress * 10;
  const txShift = Math.sin(frame * 13.7) * glitchProgress * 22;
  const textGlitchFilter = glitchProgress > 0.01
    ? `drop-shadow(${gx.toFixed(1)}px ${gy.toFixed(1)}px 0 rgba(255,30,30,${(glitchProgress * 0.95).toFixed(2)})) ` +
      `drop-shadow(${(-gx * 0.7).toFixed(1)}px ${(-gy).toFixed(1)}px 0 rgba(30,255,255,${(glitchProgress * 0.80).toFixed(2)}))`
    : "none";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* LED wall backdrop — S3 mode: all bright, intense glitch, mic-drop flash at end */}
      <LedWall accentColor={accentColor} mode="s3" endFlashAtFrame={flashStart} enterFrames={18} />

      {/* Text wrapper — zIndex:10 keeps it above LedWall (z:1) even when filter creates a stacking context */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: endFadeOut,
        zIndex: 10,
        ...(glitchProgress > 0.01 ? { filter: textGlitchFilter, transform: `translateX(${txShift.toFixed(1)}px)` } : {}),
      }}>

        {/* Main content — safe zone: right 240px, bottom 400px */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 240px 400px 84px",
            gap: 120,
            zIndex: 5,
            opacity: containerOpacity,
          }}
        >
          {/* S3 punchline — per-line bounding boxes, content-width */}
          <TypewriterText
            text={text}
            fontSize={84}
            startFrame={5}
            framesPerLine={4}
            color="#ffffff"
            lineBackground="rgba(10,10,10,0.95)"
          />

          {/* Button / ÜbrigensText / URL — fade in together after punchline lands */}
          {(button || übrigensText || url) && (
            <div style={{ opacity: subtextOpacity, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
              {/* Variant A: plain button text (no label) */}
              {button && button.split("\n").map((line, i) => (
                <div key={i} style={{
                  background: "rgba(10,10,10,0.95)",
                  padding: "7px 24px 9px",
                  color: "rgba(255,255,255,0.80)",
                  fontSize: 48,
                  fontFamily: spaceGroteskFamily,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  width: "fit-content",
                  maxWidth: 756,
                  whiteSpace: "pre-wrap",
                }}>
                  {line}
                </div>
              ))}
              {/* Variant B: "ÜBRIGENS…" label + text below */}
              {übrigensText && (
                <>
                  <div style={{
                    background: "rgba(10,10,10,0.95)",
                    padding: "6px 20px 7px",
                    color: accentColor,
                    fontSize: 30,
                    fontFamily: spaceMonoFamily,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    width: "fit-content",
                  }}>
                    ÜBRIGENS…
                  </div>
                  {übrigensText.split("\n").map((line, i) => (
                    <div key={i} style={{
                      background: "rgba(10,10,10,0.95)",
                      padding: "7px 24px 9px",
                      color: "rgba(255,255,255,0.80)",
                      fontSize: 48,
                      fontFamily: spaceGroteskFamily,
                      fontWeight: 700,
                      lineHeight: 1.35,
                      width: "fit-content",
                      maxWidth: 756,
                      whiteSpace: "pre-wrap",
                    }}>
                      {line}
                    </div>
                  ))}
                </>
              )}
              {url && (
                <div style={{
                  marginTop: button ? 14 : 0,
                  background: "rgba(10,10,10,0.90)",
                  padding: "6px 20px 8px",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 34,
                  fontFamily: spaceMonoFamily,
                  fontWeight: 400,
                  letterSpacing: "0.04em",
                  width: "fit-content",
                }}>
                  {url}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Absender — fades in last, slowly, so it doesn't compete with main text */}
        {showAbsender && (
          <div style={{
            position: "absolute",
            bottom: 400,
            left: 84,
            zIndex: 6,
            pointerEvents: "none",
            opacity: absenderOpacity,
          }}>
            <div style={{
              display: "inline-block",
              background: "rgba(10,10,10,0.95)",
              padding: "8px 18px",
              color: "rgba(255,255,255,0.80)",
              fontSize: 30,
              fontFamily: spaceMonoFamily,
              fontWeight: 400,
              letterSpacing: "0.06em",
            }}>
              WIAI · Uni Bamberg · @herdom.bamberg
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
