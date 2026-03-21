import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { spaceMonoFamily } from "../styles/fonts";
import { WIAI_YELLOW } from "../styles/colors";

interface Props {
  accentColor: string;
  url: string;
  subtext?: string;
  minimal?: boolean; // for Nachtgedanke: no "LINK IN BIO" label
}

export const CtaSlide: React.FC<Props> = ({ accentColor, url, subtext, minimal = false }) => {
  const frame = useCurrentFrame();

  const linkInBioOpacity = interpolate(frame, [2, 10], [0, 1], { extrapolateRight: "clamp" });
  const urlBoxOpacity = interpolate(frame, [10, 18], [0, 1], { extrapolateRight: "clamp" });
  const subtextOpacity = interpolate(frame, [20, 28], [0, 1], { extrapolateRight: "clamp" });
  const pulseScale = interpolate(frame, [90, 95, 100], [1, 1.05, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 84px",
        gap: 72,
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
              marginBottom: 18,
            }}
          >
            LINK IN BIO
          </div>
          <div style={{ width: 144, height: 6, background: accentColor }} />
        </div>
      )}

      {/* URL box */}
      <div
        style={{
          opacity: minimal ? subtextOpacity : urlBoxOpacity,
          background: "rgba(255,255,255,0.04)",
          border: `3px solid ${accentColor}`,
          padding: "54px 60px",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 45,
            fontWeight: 700,
            wordBreak: "break-all",
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
            fontSize: 39,
            lineHeight: 1.55,
            whiteSpace: "pre-line",
            fontFamily: spaceMonoFamily,
          }}
        >
          {subtext}
        </div>
      )}

      {/* WIAI logo pulse */}
      <div style={{ transform: `scale(${pulseScale})`, transformOrigin: "left center" }}>
        <span
          style={{
            color: WIAI_YELLOW,
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "0.2em",
            fontFamily: spaceMonoFamily,
            opacity: minimal ? 0.6 : 1,
          }}
        >
          WIAI
        </span>
      </div>
    </div>
  );
};
