import React from "react";
import { AbsoluteFill } from "remotion";
import { halftonePatternUri } from "../styles/textures";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceMonoFamily } from "../styles/fonts";

interface Props {
  accentColor: string;
  currentSlide: 1 | 2 | 3;
  children: React.ReactNode;
}

// TikTok/Instagram safe zones (1080×1920):
//   Top ~150px: progress bar + icons
//   Bottom ~350px: username, caption, audio strip
//   Right ~180px: action buttons (like, comment, share)
// → watermark at top-left, content padded away from bottom/right

export const SlideFrame: React.FC<Props> = ({ accentColor, currentSlide, children }) => (
  <AbsoluteFill
    style={{
      background: "#0A0A0A",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}
  >
    {/* Halftone dot background */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: halftonePatternUri("white", 0.04, 10),
        backgroundSize: "10px 10px",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
    {/* Bottom-right corner dot cluster */}
    <div
      style={{
        position: "absolute",
        bottom: -200,
        right: -200,
        width: 700,
        height: 700,
        backgroundImage: `radial-gradient(circle, ${accentColor}08 1px, transparent 1px)`,
        backgroundSize: "14px 14px",
        zIndex: 0,
        borderRadius: "50%",
        pointerEvents: "none",
      }}
    />
    {/* Top-left corner dot cluster */}
    <div
      style={{
        position: "absolute",
        top: -160,
        left: -160,
        width: 500,
        height: 500,
        backgroundImage: `radial-gradient(circle, ${accentColor}05 1px, transparent 1px)`,
        backgroundSize: "8px 8px",
        zIndex: 0,
        borderRadius: "50%",
        pointerEvents: "none",
      }}
    />

    {/* Content slot — full height, children handle their own safe-zone padding */}
    <div
      style={{
        flex: 1,
        position: "relative",
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>

    {/* Minimal watermark — top-left, inside safe zone (below progress bar) */}
    <div
      style={{
        position: "absolute",
        top: 160,
        left: 54,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      {/* Slide indicator dots */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {([1, 2, 3] as const).map((n) => (
          <div
            key={n}
            style={{
              width: n === currentSlide ? 30 : 8,
              height: 4,
              borderRadius: 2,
              background: n === currentSlide ? accentColor : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
      {/* WIAI label — small, subtle */}
      <span
        style={{
          color: WIAI_YELLOW,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "0.2em",
          fontFamily: spaceMonoFamily,
          opacity: 0.7,
        }}
      >
        WIAI
      </span>
    </div>
  </AbsoluteFill>
);
