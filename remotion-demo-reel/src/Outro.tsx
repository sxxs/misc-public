import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12 } });
  const urlOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Converging particles
  const particles = Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * Math.PI * 2;
    const startRadius = 600;
    const radius = interpolate(frame, [0, 60], [startRadius, 50 + (i % 3) * 20], {
      extrapolateRight: "clamp",
    });
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const opacity = interpolate(frame, [0, 30], [0, 0.8], {
      extrapolateRight: "clamp",
    });
    return { x, y, opacity, color: i % 3 === 0 ? "#e94560" : i % 3 === 1 ? "#58a6ff" : "#a855f7" };
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Particles converging */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            width: 4,
            height: 4,
            borderRadius: "50%",
            backgroundColor: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 10px ${p.color}`,
          }}
        />
      ))}

      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: "center",
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 60, marginBottom: 20 }}>🚀</div>
        <h1
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "white",
            fontFamily: "system-ui, sans-serif",
            margin: 0,
            letterSpacing: -2,
          }}
        >
          Open Source
        </h1>
        <div
          style={{
            width: 300,
            height: 3,
            background: "linear-gradient(90deg, #e94560, #58a6ff, #a855f7)",
            margin: "24px auto",
            borderRadius: 2,
          }}
        />
        <p
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.6)",
            fontFamily: "monospace",
            opacity: urlOpacity,
            letterSpacing: 1,
          }}
        >
          github.com/sxxs/misc-public
        </p>
      </div>
    </AbsoluteFill>
  );
};
