import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12 } });
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineWidth = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, mass: 0.5 },
  });

  // Particle effect
  const particles = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * Math.PI * 2;
    const radius = interpolate(frame, [0, 60], [0, 400 + (i % 3) * 100], {
      extrapolateRight: "clamp",
    });
    const x = Math.cos(angle + frame * 0.02) * radius;
    const y = Math.sin(angle + frame * 0.02) * radius;
    const opacity = interpolate(frame, [0, 20, 80, 100], [0, 0.6, 0.6, 0], {
      extrapolateRight: "clamp",
    });
    return { x, y, opacity, size: 2 + (i % 4) };
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
      {/* Animated grid background */}
      <div
        style={{
          position: "absolute",
          width: "200%",
          height: "200%",
          top: "-50%",
          left: "-50%",
          backgroundImage: `
            linear-gradient(rgba(100,100,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,100,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: `perspective(500px) rotateX(60deg) translateY(${frame * 2}px)`,
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: i % 2 === 0 ? "#e94560" : "#58a6ff",
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Title */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          textAlign: "center",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: 120,
            fontWeight: 900,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "white",
            margin: 0,
            letterSpacing: -4,
            textShadow: "0 0 60px rgba(233,69,96,0.5), 0 0 120px rgba(88,166,255,0.3)",
          }}
        >
          misc-public
        </h1>

        {/* Animated line */}
        <div
          style={{
            width: `${lineWidth * 400}px`,
            height: 3,
            background: "linear-gradient(90deg, #e94560, #58a6ff, #a855f7)",
            margin: "20px auto",
            borderRadius: 2,
          }}
        />

        <p
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 300,
            opacity: subtitleOpacity,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          Web Projects &amp; Games
        </p>
      </div>
    </AbsoluteFill>
  );
};
