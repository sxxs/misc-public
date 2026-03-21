import React from "react";
import { spaceGroteskFamily } from "../styles/fonts";

interface Props {
  accentColor: string;
  enterProgress: number; // 0→1 drives entrance animation
  children: React.ReactNode;
}

export const DirtyCutout: React.FC<Props> = ({ accentColor, enterProgress, children }) => {
  const translateX = (1 - enterProgress) * 120;
  const rotation = 0.8 - enterProgress * 0.4; // 0.8deg → 0.4deg

  return (
    <div
      style={{
        position: "relative",
        transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
        width: "100%",
      }}
    >
      {/* Accent color offset shadow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: accentColor,
          transform: "translate(21px, 21px) rotate(0.6deg)",
          clipPath:
            "polygon(1% 2%, 98.5% 0%, 100% 3.5%, 98% 96.5%, 99.5% 99%, 2.5% 100%, 0% 97%, 0.5% 3%)",
        }}
      />
      {/* Cream cutout block */}
      <div
        style={{
          position: "relative",
          background: "#F0EDE8",
          padding: "96px 78px",
          clipPath:
            "polygon(0.5% 1%, 98% 0%, 99.5% 2%, 99% 97.5%, 97.5% 99.5%, 1.5% 99%, 0% 97%, 0.5% 2.5%)",
        }}
      >
        <div
          style={{
            color: "#0A0A0A",
            fontSize: 78,
            fontWeight: 700,
            lineHeight: 1.18,
            letterSpacing: "-0.01em",
            fontFamily: spaceGroteskFamily,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
