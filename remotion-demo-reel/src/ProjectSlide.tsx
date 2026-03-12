import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { ProjectData } from "./data";

export const ProjectSlide: React.FC<{
  project: ProjectData;
  index: number;
}> = ({ project, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animations
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const contentOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  const techDelay = (i: number) =>
    spring({
      frame: frame - 20 - i * 3,
      fps,
      config: { damping: 12 },
    });

  // Exit animation
  const exitOpacity = interpolate(frame, [100, 115], [1, 0], {
    extrapolateRight: "clamp",
  });

  // Floating emoji
  const emojiY = Math.sin(frame * 0.08) * 15;
  const emojiRotate = Math.sin(frame * 0.05) * 10;

  // Accent glow pulse
  const glowPulse = 0.4 + Math.sin(frame * 0.1) * 0.2;

  // Decorative shapes
  const shapes = Array.from({ length: 6 }, (_, i) => {
    const progress = spring({
      frame: frame - 5 - i * 4,
      fps,
      config: { damping: 20 },
    });
    return {
      x: [80, 85, 75, 90, 70, 82][i],
      y: [15, 35, 55, 70, 40, 80][i],
      size: [80, 60, 100, 50, 70, 90][i],
      rotation: frame * (0.5 + i * 0.2) * (i % 2 === 0 ? 1 : -1),
      opacity: progress * 0.08,
    };
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${project.color} 0%, ${adjustColor(project.color, 20)} 100%)`,
        overflow: "hidden",
        opacity: exitOpacity,
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${project.accentColor}${Math.round(glowPulse * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          top: -200,
          right: -200,
          filter: "blur(60px)",
        }}
      />

      {/* Decorative shapes */}
      {shapes.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            border: `2px solid ${project.accentColor}`,
            borderRadius: i % 2 === 0 ? "50%" : "4px",
            transform: `rotate(${s.rotation}deg)`,
            opacity: s.opacity,
          }}
        />
      ))}

      {/* Content container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 100px",
          height: "100%",
          transform: `translateX(${interpolate(slideIn, [0, 1], [-80, 0])}px)`,
          opacity: slideIn,
          maxWidth: "70%",
        }}
      >
        {/* Project number */}
        <div
          style={{
            fontSize: 24,
            color: project.accentColor,
            fontFamily: "monospace",
            fontWeight: 700,
            letterSpacing: 4,
            marginBottom: 16,
            opacity: contentOpacity,
          }}
        >
          {String(index + 1).padStart(2, "0")} / 06
        </div>

        {/* Emoji */}
        <div
          style={{
            fontSize: 80,
            marginBottom: 16,
            transform: `translateY(${emojiY}px) rotate(${emojiRotate}deg)`,
            display: "inline-block",
            width: "fit-content",
          }}
        >
          {project.emoji}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 90,
            fontWeight: 900,
            color: "white",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: 0,
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          {project.title}
        </h1>

        {/* Version badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
            opacity: contentOpacity,
          }}
        >
          <span
            style={{
              background: project.accentColor,
              color: "white",
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            {project.version}
          </span>
          <span
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 300,
            }}
          >
            {project.subtitle}
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 30,
            color: "rgba(255,255,255,0.75)",
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1.5,
            marginTop: 32,
            maxWidth: 900,
            opacity: contentOpacity,
            fontWeight: 300,
          }}
        >
          {project.description}
        </p>

        {/* Tech stack */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 32,
            flexWrap: "wrap",
          }}
        >
          {project.tech.map((t, i) => (
            <div
              key={t}
              style={{
                background: `${project.accentColor}20`,
                border: `1px solid ${project.accentColor}60`,
                color: project.accentColor,
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 20,
                fontFamily: "monospace",
                fontWeight: 600,
                transform: `scale(${techDelay(i)})`,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: 40,
            fontSize: 22,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "monospace",
            opacity: contentOpacity,
          }}
        >
          {project.url}
        </div>
      </div>
    </AbsoluteFill>
  );
};

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
