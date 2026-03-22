import React from "react";
import { useCurrentFrame } from "remotion";

interface Props {
  accentColor: string;
}

const COLS = 24;
const ROWS = 48;
const CELL_W = 45;
const CELL_H = 40;
const LED_W = 38;
const LED_H = 33;

export const LedWall: React.FC<Props> = ({ accentColor }) => {
  const frame = useCurrentFrame();

  const leds: React.ReactNode[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Deterministic hash per LED — no Math.random()
      const hash = (Math.sin(row * 13.7 + col * 17.3) + 1) / 2; // 0–1

      let opacity: number;
      if (hash < 0.65) {
        // ~65% off — dim glow only
        opacity = 0.04;
      } else if (hash < 0.80) {
        // ~15% blinking — phase offset per LED, slow oscillation
        const blinkPhase = Math.sin(row * 7.11 + col * 3.17) * Math.PI;
        opacity = ((Math.sin(frame * 0.07 + blinkPhase) + 1) / 2) * 0.51 + 0.04;
      } else {
        // ~20% on — solid
        opacity = 0.72;
      }

      const x = col * CELL_W + (CELL_W - LED_W) / 2;
      const y = row * CELL_H + (CELL_H - LED_H) / 2;

      leds.push(
        <rect
          key={`${row}-${col}`}
          x={x}
          y={y}
          width={LED_W}
          height={LED_H}
          fill={accentColor}
          opacity={opacity}
        />
      );
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <filter id="led-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#led-glow)">{leds}</g>
      </svg>

      {/* Dark overlay so foreground text stays readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.45) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
