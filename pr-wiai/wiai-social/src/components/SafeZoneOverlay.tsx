import React from "react";
import { getRemotionEnvironment } from "remotion";
import { SAFE } from "../styles/safeZones";

// Studio-only debug overlay — invisible during render
export const SafeZoneOverlay: React.FC = () => {
  if (getRemotionEnvironment().isRendering) return null;

  const zone = { position: "absolute" as const, pointerEvents: "none" as const };
  const red = "rgba(255,40,40,0.12)";
  const orange = "rgba(255,160,0,0.08)";
  const dashRed = "2px dashed rgba(255,40,40,0.45)";
  const dashOrange = "2px dashed rgba(255,160,0,0.35)";

  return (
    <div style={{ ...zone, inset: 0, zIndex: 9999 }}>
      {/* Top — YouTube title overlay */}
      <div style={{ ...zone, top: 0, left: 0, right: 0, height: SAFE.top,
        background: red, borderBottom: dashRed }} />
      {/* Bottom — TikTok UI */}
      <div style={{ ...zone, bottom: 0, left: 0, right: 0, height: SAFE.bottom,
        background: red, borderTop: dashRed }} />
      {/* Left — 80% width rule */}
      <div style={{ ...zone, top: SAFE.top, bottom: SAFE.bottom, left: 0, width: SAFE.left,
        background: orange, borderRight: dashOrange }} />
      {/* Right — 80% width rule */}
      <div style={{ ...zone, top: SAFE.top, bottom: SAFE.bottom, right: 0, width: SAFE.right,
        background: orange, borderLeft: dashOrange }} />
    </div>
  );
};
