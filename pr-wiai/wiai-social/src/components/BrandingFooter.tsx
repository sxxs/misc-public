import React from "react";
import { spaceMonoFamily } from "../styles/fonts";
import { WIAI_YELLOW } from "../styles/colors";

interface Props {
  accentColor: string;
  currentSlide: 1 | 2 | 3;
}

export const BrandingFooter: React.FC<Props> = ({ accentColor, currentSlide }) => (
  <div style={{ padding: "0 60px 48px" }}>
    <div style={{ display: "flex", gap: 15, marginBottom: 30 }}>
      {([1, 2, 3] as const).map((n) => (
        <div
          key={n}
          style={{
            width: n === currentSlide ? 72 : 24,
            height: 9,
            borderRadius: 6,
            background: n === currentSlide ? accentColor : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div style={{ display: "flex", gap: 18, alignItems: "baseline" }}>
        <span
          style={{
            color: WIAI_YELLOW,
            fontSize: 39,
            fontWeight: 700,
            letterSpacing: "0.2em",
            fontFamily: spaceMonoFamily,
          }}
        >
          WIAI
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: 24,
            letterSpacing: "0.08em",
            fontFamily: spaceMonoFamily,
          }}
        >
          UNI BAMBERG
        </span>
      </div>
      <span
        style={{
          color: "rgba(255,255,255,0.15)",
          fontSize: 27,
          fontFamily: spaceMonoFamily,
        }}
      >
        @herdom
      </span>
    </div>
  </div>
);
