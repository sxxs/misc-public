import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../styles/fonts";

interface Props {
  accentColor: string;
  url: string;
  subtext?: string;
  minimal?: boolean;
}

export const CtaSlide: React.FC<Props> = ({ accentColor, url, subtext, minimal = false }) => {
  const frame = useCurrentFrame();

  const linkInBioOpacity = interpolate(frame, [2, 10], [0, 1], { extrapolateRight: "clamp" });
  const urlBoxOpacity    = interpolate(frame, [10, 18], [0, 1], { extrapolateRight: "clamp" });
  const subtextOpacity   = interpolate(frame, [20, 28], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        // Safe zone: right 180px (action buttons), bottom 350px (caption)
        padding: "0 240px 360px 108px",
        gap: 60,
      }}
    >
      {/* LINK IN BIO */}
      {!minimal && (
        <div style={{ opacity: linkInBioOpacity }}>
          <div
            style={{
              color: accentColor,
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: "0.15em",
              fontFamily: spaceMonoFamily,
              marginBottom: 14,
            }}
          >
            LINK IN BIO
          </div>
          <div style={{ width: 120, height: 5, background: accentColor }} />
        </div>
      )}

      {/* URL box */}
      <div
        style={{
          opacity: minimal ? subtextOpacity : urlBoxOpacity,
          background: "rgba(255,255,255,0.04)",
          border: `3px solid ${accentColor}`,
          padding: "48px 54px",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 36,
            fontWeight: 700,
            wordBreak: "break-word",
            lineHeight: 1.4,
            fontFamily: spaceMonoFamily,
          }}
        >
          {url}
        </div>
      </div>

      {/* Subtext */}
      {subtext && (
        <div
          style={{
            opacity: subtextOpacity,
            color: "rgba(255,255,255,0.45)",
            fontSize: 36,
            lineHeight: 1.55,
            whiteSpace: "pre-line",
            fontFamily: spaceMonoFamily,
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
};
