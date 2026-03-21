import React from "react";
import { Img, staticFile } from "remotion";
import { halftonePatternUri, scanlineGradient } from "../styles/textures";

interface Props {
  src: string; // path relative to publicDir (assets/)
  style?: React.CSSProperties;
}

export const HalftoneImage: React.FC<Props> = ({ src, style }) => (
  <div style={{ position: "relative", overflow: "hidden", ...style }}>
    <Img
      src={staticFile(src)}
      style={{ width: "100%", display: "block", filter: "contrast(1.1) brightness(0.85)" }}
    />
    {/* Halftone dot overlay */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: halftonePatternUri("white", 0.12, 6),
        backgroundSize: "6px 6px",
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
    {/* Scanline overlay */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: scanlineGradient(0.12),
        pointerEvents: "none",
      }}
    />
  </div>
);
