import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const Transition: React.FC<{
  color: string;
}> = ({ color }) => {
  const frame = useCurrentFrame();

  // Wipe transition with multiple bars
  const bars = Array.from({ length: 8 }, (_, i) => {
    const delay = i * 1.5;
    const progress = interpolate(frame, [delay, delay + 10, 15 + delay, 25 + delay], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return progress;
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {bars.map((progress, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: `${(i / 8) * 100}%`,
            width: `${progress * 100}%`,
            height: `${100 / 8 + 1}%`,
            backgroundColor: color,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
