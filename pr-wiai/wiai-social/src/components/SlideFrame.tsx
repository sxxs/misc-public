import React from "react";
import { AbsoluteFill } from "remotion";
import { halftonePatternUri } from "../styles/textures";
import { BrandingFooter } from "./BrandingFooter";

interface Props {
  accentColor: string;
  currentSlide: 1 | 2 | 3;
  children: React.ReactNode;
}

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
    {/* Content slot */}
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
    {/* Footer */}
    <div style={{ position: "relative", zIndex: 5 }}>
      <BrandingFooter accentColor={accentColor} currentSlide={currentSlide} />
    </div>
  </AbsoluteFill>
);
