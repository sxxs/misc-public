import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Post } from "../types";
import { spaceGroteskFamily, spaceMonoFamily } from "../styles/fonts";
import { PhoneFrame } from "../components/PhoneFrame";

// ── Nachtgedanke: Phone backdrop + text overlays + inverted punchline ───────
export const Nachtgedanke: React.FC<{ post: Post }> = ({ post }) => {
  const frame = useCurrentFrame();
  const config = post.nachtgedanke!;

  // ── Phase 1: Phone entrance + hard-cut zoom to time ───────────────────
  //  0→10:  phone fades in from black (totale — full phone visible)
  // 10:     HARD CUT — instant jump to extreme close-up on "02:47"
  // 10→13:  slight overshoot zoom (8.0 → 8.8, 3f)
  // 13→18:  settle back (8.8 → 8.2, 5f easeOut)
  // 10→18:  simultaneous blur 6px → 0 (camera focuses)
  // 18→40:  hold on time, colon blinks, #overthinking
  // 40→44:  snap back to 1.0 (fast)
  // 44→60:  phone dims to backdrop

  const phoneOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Hard-cut zoom: instant jump at frame 10, then overshoot + settle
  let phoneZoom: number;
  if (frame < 10) {
    phoneZoom = 1.0;
  } else if (frame < 13) {
    // Overshoot: 8.0 → 8.8 in 3 frames
    phoneZoom = interpolate(frame, [10, 13], [8.0, 8.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (frame < 18) {
    // Settle: 8.8 → 8.2 in 5 frames
    phoneZoom = interpolate(frame, [13, 18], [8.8, 8.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (frame < 55) {
    phoneZoom = 8.2; // hold on time (longer)
  } else if (frame < 59) {
    // Snap back to totale
    phoneZoom = interpolate(frame, [55, 59], [8.2, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else {
    phoneZoom = 1.0;
  }

  // Camera-focus blur: appears on hard cut, resolves quickly
  const blurPx = frame < 10 ? 0 : interpolate(frame, [10, 18], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phone dims after zoom-out → backdrop at 25%
  const phoneDim = interpolate(frame, [59, 75], [1.0, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phone fades OUT at punchline
  const blocks = config.blocks;
  const lastBlock = blocks[blocks.length - 1];
  const punchlineStart = lastBlock ? lastBlock.at + lastBlock.hold + 5 : 80;
  const phoneFadeOut = interpolate(frame, [punchlineStart - 10, punchlineStart + 5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow
  const glowBuildUp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const glowPulse = 0.75 + 0.25 * Math.sin((frame * Math.PI * 2) / 120);
  const glowIntensity = frame < 15 ? glowBuildUp : glowPulse;

  // Blinking colon (45f = 1.5s cycle)
  const colonVisible = frame % 45 < 23;

  // ── #overthinking overlay (during zoomed-on-time hold) ────────────────
  const overthinkingOpacity = interpolate(frame, [22, 28, 52, 56], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Text blocks ───────────────────────────────────────────────────────
  let activeBlockIdx = -1;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (frame >= b.at && frame < b.at + b.hold) {
      activeBlockIdx = i;
    }
  }

  // ── Punchline — everything appears together ───────────────────────────
  const punchlineOpacity = interpolate(
    frame, [punchlineStart, punchlineStart + 12], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: "#000000" }}>
      {/* ── Phone backdrop ───────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 150,
          opacity: phoneOpacity * phoneDim * phoneFadeOut,
          transform: `scale(${phoneZoom.toFixed(4)})`,
          filter: blurPx > 0.1 ? `blur(${blurPx.toFixed(1)}px)` : "none",
          // Origin: time text in status bar (top-left area of phone)
          // Phone centered at ~540, ~810. Time at ~(540 - 240 + 22), ~(810 - 460 + 10)
          // ≈ 322, 360 → in % of 1080×1920: ~30%, ~19%
          transformOrigin: "30% 19%",
        }}
      >
        <PhoneFrame
          time={config.time}
          batteryPercent={config.batteryPercent}
          glowIntensity={glowIntensity}
          blinkColon
          colonVisible={colonVisible}
        />
      </div>

      {/* ── #overthinking during zoom ────────────────────────────────── */}
      {overthinkingOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: 240,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: overthinkingOpacity,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 56,
              fontFamily: spaceGroteskFamily,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            #overthinking
          </span>
        </div>
      )}

      {/* ── Text block overlays ──────────────────────────────────────── */}
      {activeBlockIdx >= 0 && (() => {
        const b = blocks[activeBlockIdx];
        const localFrame = frame - b.at;
        const blockOpacity = interpolate(localFrame, [0, 6], [0, 1], {
          extrapolateRight: "clamp",
        });
        return (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              padding: "200px 180px 400px 108px",
            }}
          >
            <div
              style={{
                opacity: blockOpacity,
                background: "rgba(0,0,0,0.88)",
                padding: "32px 40px",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 62,
                  fontFamily: spaceGroteskFamily,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  whiteSpace: "pre-wrap",
                }}
              >
                {b.text}
              </div>
              {b.italicText && (
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 62,
                    fontFamily: spaceGroteskFamily,
                    fontWeight: 700,
                    fontStyle: "italic",
                    lineHeight: 1.3,
                    whiteSpace: "pre-wrap",
                    marginTop: 24,
                  }}
                >
                  {b.italicText}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── End card — punchline + aside + absender, all together ─────── */}
      {frame >= punchlineStart && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "200px 140px 400px 108px",
            gap: 20,
            opacity: punchlineOpacity,
          }}
        >
          {/* Punchline — white box, black text */}
          <div
            style={{
              background: "#ffffff",
              padding: "28px 36px",
              borderRadius: 8,
              alignSelf: "flex-start",
            }}
          >
            <div
              style={{
                color: "#0A0A0A",
                fontSize: 76,
                fontFamily: spaceGroteskFamily,
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: "pre-wrap",
              }}
            >
              {post.content.act3}
            </div>
          </div>

          {/* Aside — white box, slightly transparent */}
          {post.content.aside && (
            <div
              style={{
                background: "#ffffff",
                padding: "20px 32px",
                borderRadius: 8,
                alignSelf: "flex-start",
              }}
            >
              <div
                style={{
                  color: "#0A0A0A",
                  fontSize: 52,
                  fontFamily: spaceGroteskFamily,
                  fontWeight: 700,
                  whiteSpace: "pre-wrap",
                }}
              >
                {post.content.aside}
              </div>
            </div>
          )}

          {/* Absender — black box, white text, prominent */}
          <div
            style={{
              background: "rgba(0,0,0,0.85)",
              padding: "16px 28px",
              borderRadius: 8,
              alignSelf: "flex-start",
              marginTop: 8,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 38,
                fontFamily: spaceMonoFamily,
                fontWeight: 700,
                letterSpacing: "0.03em",
                whiteSpace: "pre-wrap",
              }}
            >
              {"WIAI \u00B7 Uni Bamberg\necht.bamberg"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
