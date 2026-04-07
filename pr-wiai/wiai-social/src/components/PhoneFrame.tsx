import React from "react";
import { spaceMonoFamily } from "../styles/fonts";

interface Props {
  time: string;
  batteryPercent?: number;
  glowIntensity: number; // 0–1, animated by parent
  nudgeY?: number;
  blinkColon?: boolean;
  colonVisible?: boolean;
  children?: React.ReactNode;
}

// ── Phone dimensions (inside 1080×1920 canvas) ─────────────────────────────
const PHONE_W = 480;
const PHONE_H = 920;
const BORDER_RADIUS = 44;
const DISPLAY_COLOR = "#F5F0E8";
const STATUS_BAR_H = 48;

// ── Inline SVG icons ────────────────────────────────────────────────────────

const WifiIcon: React.FC = () => (
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
    <path d="M9 12.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" fill="#555" />
    <path d="M5.5 10.5a5 5 0 0 1 7 0" stroke="#555" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M3 7.5a8.5 8.5 0 0 1 12 0" stroke="#555" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M0.5 4.5a12 12 0 0 1 17 0" stroke="#555" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

const BatteryIcon: React.FC<{ percent: number }> = ({ percent }) => {
  const fillW = Math.max(1, (16 * percent) / 100);
  const fillColor = percent <= 20 ? "#E55" : "#555";
  return (
    <svg width="24" height="12" viewBox="0 0 24 12">
      <rect x="0.5" y="0.5" width="20" height="11" rx="2" ry="2" fill="none" stroke="#555" strokeWidth="1" />
      <rect x="21" y="3" width="2.5" height="6" rx="1" fill="#555" />
      <rect x="2" y="2" width={fillW} height="8" rx="1" fill={fillColor} />
    </svg>
  );
};

// ── Wireframe Google search page — bold, clearly readable ───────────────────
const L1 = "rgba(0,0,0,0.18)"; // light lines
const L2 = "rgba(0,0,0,0.28)"; // darker titles/bars

const WireframeSearchPage: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
    {/* Search bar */}
    <div
      style={{
        height: 38,
        borderRadius: 19,
        border: `2px solid ${L2}`,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 8,
        marginBottom: 16,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="5.5" cy="5.5" r="4.5" stroke={L2} strokeWidth="1.5" />
        <line x1="9" y1="9" x2="13" y2="13" stroke={L2} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{ height: 8, width: "65%", background: L2, borderRadius: 4 }} />
    </div>

    {/* Search results — 5 results, bolder */}
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ height: 6, width: `${30 + i * 7}%`, background: L1, borderRadius: 3 }} />
        <div style={{ height: 10, width: `${55 + i * 6}%`, background: L2, borderRadius: 3 }} />
        <div style={{ height: 6, width: "92%", background: L1, borderRadius: 3 }} />
        <div style={{ height: 6, width: `${65 + i * 5}%`, background: L1, borderRadius: 3 }} />
        {i <= 3 && <div style={{ height: 6, width: `${50 + i * 8}%`, background: L1, borderRadius: 3 }} />}
      </div>
    ))}
  </div>
);

export const PhoneFrame: React.FC<Props> = ({
  time,
  batteryPercent = 15,
  glowIntensity,
  nudgeY = 0,
  blinkColon,
  colonVisible = true,
  children,
}) => {
  const glowAlpha = (0.25 * glowIntensity).toFixed(3);
  const ambientAlpha = (0.10 * glowIntensity).toFixed(3);

  return (
    <div
      style={{
        position: "relative",
        width: PHONE_W,
        height: PHONE_H,
        transform: `translateY(${nudgeY}px)`,
      }}
    >
      {/* ── Ambient glow ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: -140,
          borderRadius: BORDER_RADIUS + 140,
          background: `radial-gradient(ellipse at center, rgba(245,240,232,${ambientAlpha}), transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Side buttons ─────────────────────────────────────────────── */}
      <div style={{ position: "absolute", right: -4, top: 200, width: 4, height: 44, background: "rgba(80,80,80,0.6)", borderRadius: 2 }} />
      <div style={{ position: "absolute", left: -4, top: 180, width: 4, height: 30, background: "rgba(80,80,80,0.6)", borderRadius: 2 }} />
      <div style={{ position: "absolute", left: -4, top: 220, width: 4, height: 30, background: "rgba(80,80,80,0.6)", borderRadius: 2 }} />

      {/* ── Phone body ───────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          width: PHONE_W,
          height: PHONE_H,
          borderRadius: BORDER_RADIUS,
          background: DISPLAY_COLOR,
          border: "2px solid rgba(60,60,60,0.5)",
          boxShadow: `0 0 100px 30px rgba(245,240,232,${glowAlpha})`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Status bar ───────────────────────────────────────────── */}
        <div
          style={{
            height: STATUS_BAR_H,
            padding: "10px 22px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: spaceMonoFamily,
              fontSize: 22,
              fontWeight: 700,
              color: "#333",
              letterSpacing: "0.02em",
            }}
          >
            {blinkColon
              ? time.split(":").map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span style={{ opacity: colonVisible ? 1 : 0 }}>:</span>
                    )}
                  </React.Fragment>
                ))
              : time}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <WifiIcon />
            <BatteryIcon percent={batteryPercent} />
          </div>
        </div>

        {/* ── Display content ──────────────────────────────────────── */}
        <div style={{ flex: 1, padding: "14px 22px", overflow: "hidden" }}>
          {children ?? <WireframeSearchPage />}
        </div>
      </div>
    </div>
  );
};
