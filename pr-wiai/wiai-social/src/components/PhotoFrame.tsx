import React from "react";
import { useCurrentFrame, staticFile, Img, interpolate } from "remotion";
import { SlideshowImage, SlideshowEffect } from "../types";
import { WIAI_YELLOW } from "../styles/colors";
import { spaceGroteskFamily } from "../styles/fonts";
import { MosaicImage } from "./MosaicImage";

const WIDTH = 1080;
const HEIGHT = 1920;

const MOSAIC_MAX_BLOCK = 200;
const MOSAIC_MIN_BLOCK = 6;

function normalizeEffects(
  effect?: SlideshowEffect | SlideshowEffect[],
): SlideshowEffect[] {
  if (!effect) return ["drift"];
  return Array.isArray(effect) ? effect : [effect];
}

// Effect progress 0→1 with 3-phase timing:
//   [0, hold)              → 0        (hold at start state)
//   [hold, hold+fxDur)     → 0→1      (effect animates)
//   [hold+fxDur, duration) → 1        (hold at end state, image visible)
// If effectDuration is omitted, effect spans all remaining frames after hold.
function useEffectProgress(duration: number, hold: number, effectDuration?: number): number {
  const frame = useCurrentFrame();
  if (frame < hold) return 0;
  const fxDur = effectDuration ?? (duration - hold);
  if (fxDur <= 0) return 1;
  return Math.min(1, (frame - hold) / fxDur);
}

// ── Mosaic block size ───────────────────────────────────────────────────────
// Returns null when effect is done → PhotoFrame renders clean <Img> instead
function getMosaicBlockSize(effects: SlideshowEffect[], progress: number): number | null {
  for (const fx of effects) {
    if (fx === "depixelate" || fx === "depixelate-blur") {
      if (progress >= 1) return null; // done → show clean image
      return MOSAIC_MAX_BLOCK - progress * (MOSAIC_MAX_BLOCK - MOSAIC_MIN_BLOCK);
    }
    if (fx === "pixelate" || fx === "pixelate-blur") {
      if (progress <= 0) return null; // not started → show clean image
      return MOSAIC_MIN_BLOCK + progress * (MOSAIC_MAX_BLOCK - MOSAIC_MIN_BLOCK);
    }
  }
  return null;
}

// ── Mosaic blur: softens block edges, scales with block size ────────────────
function getMosaicBlur(effects: SlideshowEffect[], blockSize: number | null): number {
  if (blockSize === null) return 0;
  const hasBlur = effects.some((fx) => fx === "depixelate-blur" || fx === "pixelate-blur");
  if (!hasBlur) return 0;
  // Linear: 200px blocks → 30px blur, 6px blocks → 0 blur
  return Math.max(0, ((blockSize - MOSAIC_MIN_BLOCK) / (MOSAIC_MAX_BLOCK - MOSAIC_MIN_BLOCK)) * 30);
}

// ── Drift: minimal zoom 1-2% ────────────────────────────────────────────────
function getDriftTransform(effects: SlideshowEffect[], progress: number): string {
  if (effects.includes("drift")) return `scale(${1 + progress * 0.02})`;
  return "";
}

// ── Autofocus: fast rack-focus with overshoot ───────────────────────────────
// Happens in ~30 frames (~1s) regardless of total duration.
// Steep: blurry → snap sharp → small bounce → done.
function getAutofocusBlur(frame: number): number {
  // Phase 1 (frame 0-4): very blurry
  if (frame <= 4) return 30;
  // Phase 2 (frame 5-14): rapid focus — steep exponential drop
  if (frame <= 14) {
    const t = (frame - 4) / 10; // 0→1
    return 30 * Math.pow(1 - t, 3); // cubic ease-out: 30→0 fast
  }
  // Phase 3 (frame 15-20): overshoot bounce — briefly goes back to ~6px
  if (frame <= 20) {
    const t = (frame - 14) / 6;
    return 6 * Math.sin(t * Math.PI); // 0→6→0 arc
  }
  // Phase 4 (frame 21-26): tiny second bounce
  if (frame <= 26) {
    const t = (frame - 20) / 6;
    return 2 * Math.sin(t * Math.PI); // 0→2→0
  }
  // Done: sharp
  return 0;
}

// ── Scanline saturate/desaturate/tint ───────────────────────────────────────
// Splits the image into horizontal bands. Each band transitions at its own
// staggered time with slight jitter, creating a "scanning" wave effect.
const SCANLINE_COUNT = 24;

function hasScanlineEffect(effects: SlideshowEffect[]): boolean {
  return effects.some((e) => e === "saturate" || e === "desaturate" || e === "tint");
}

function getScanlineFilter(effect: SlideshowEffect, localProgress: number): string {
  // Hard snap: band is either "before" or "after", tiny transition zone
  const raw = Math.max(0, Math.min(1, localProgress));
  const p = raw < 0.5 ? 0 : Math.min(1, (raw - 0.5) / 0.08);
  switch (effect) {
    case "desaturate": return `saturate(${p})`;
    case "saturate":   return `saturate(${1 - p * 0.85})`;
    case "tint":       return `sepia(${1 - p}) saturate(${1 + (1 - p) * 2}) hue-rotate(${(1 - p) * 15}deg) brightness(${0.85 + p * 0.15})`;
    default: return "none";
  }
}

// How close is this band to its transition edge? 0 = far away, 1 = right at it
function scanlineEdgeIntensity(rawProgress: number): number {
  const dist = Math.abs(rawProgress - 0.5);
  return Math.max(0, 1 - dist * 8); // peaks at 0.5, falls to 0 at 0.375 and 0.625
}

const ScanlineEffect: React.FC<{
  src: string;
  effects: SlideshowEffect[];
  progress: number;
  transform: string;
}> = ({ src, effects, progress, transform }) => {
  const scanFx = effects.find(
    (e) => e === "saturate" || e === "desaturate" || e === "tint",
  )!;

  const bandH = HEIGHT / SCANLINE_COUNT;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", transform, transformOrigin: "center center" }}>
      {Array.from({ length: SCANLINE_COUNT }).map((_, i) => {
        const jitter = (Math.sin(i * 127.1 + 311.7) * 43758.5453 % 1) * 0.35;
        const bandProgress = (progress * 2.0 - (i / SCANLINE_COUNT) * 1.2 + jitter);
        const raw = Math.max(0, Math.min(1, bandProgress));
        const filter = getScanlineFilter(scanFx, bandProgress);

        // Bright scan line at the wave front
        const edgeGlow = scanlineEdgeIntensity(raw);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: i * bandH,
              width: WIDTH,
              height: Math.ceil(bandH) + 1,
              overflow: "hidden",
            }}
          >
            {/* Image band with filter */}
            <div style={{ position: "absolute", inset: 0, filter }}>
              <Img
                src={staticFile(src)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: -(i * bandH),
                  width: WIDTH,
                  height: HEIGHT,
                  objectFit: "cover",
                }}
              />
            </div>
            {/* Scan line highlight at wave front */}
            {edgeGlow > 0.01 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: WIDTH,
                  height: 3,
                  background: "#ffffff",
                  opacity: edgeGlow * 0.7,
                  boxShadow: `0 0 12px 4px rgba(255,255,255,${(edgeGlow * 0.5).toFixed(2)})`,
                  zIndex: 1,
                }}
              />
            )}
            {/* Brief brightness flash on the whole band at transition */}
            {edgeGlow > 0.01 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#ffffff",
                  opacity: edgeGlow * 0.12,
                  zIndex: 1,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Block Reveal ────────────────────────────────────────────────────────────
const BlockReveal: React.FC<{
  src: string;
  progress: number;
}> = ({ src, progress }) => {
  const cols = 6;
  const rows = 10;
  const cellW = WIDTH / cols;
  const cellH = HEIGHT / rows;
  const totalCells = cols * rows;
  const revealedCount = Math.floor(progress * totalCells);

  const order = React.useMemo(() => {
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    indices.sort((a, b) => {
      const ha = Math.sin(a * 127.1 + 311.7) * 43758.5453 % 1;
      const hb = Math.sin(b * 127.1 + 311.7) * 43758.5453 % 1;
      return ha - hb;
    });
    return indices;
  }, [totalCells]);

  const revealedSet = new Set(order.slice(0, revealedCount));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <MosaicImage src={src} minBlockSize={MOSAIC_MAX_BLOCK} />
      {Array.from({ length: totalCells }).map((_, idx) => {
        if (!revealedSet.has(idx)) return null;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: col * cellW, top: row * cellH,
              width: cellW, height: cellH, overflow: "hidden",
            }}
          >
            <Img
              src={staticFile(src)}
              style={{
                position: "absolute",
                left: -(col * cellW), top: -(row * cellH),
                width: WIDTH, height: HEIGHT, objectFit: "cover",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ── Pixel Strips ────────────────────────────────────────────────────────────
const PixelStrips: React.FC<{
  src: string;
  direction: "h" | "v";
  progress: number;
}> = ({ src, direction, progress }) => {
  const stripCount = 8;

  // At progress=1 all strips must be fully clear
  if (progress >= 1) {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <Img
          src={staticFile(src)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {Array.from({ length: stripCount }).map((_, i) => {
        // Each strip gets staggered progress; all finish by progress=0.95
        const stagger = i / stripCount * 0.5; // 0..0.5 spread
        const stripProgress = Math.max(0, Math.min(1, (progress - stagger) / (0.95 - stagger)));
        if (stripProgress >= 1) return null; // strip fully clear
        const blockSize = MOSAIC_MAX_BLOCK - stripProgress * (MOSAIC_MAX_BLOCK - MOSAIC_MIN_BLOCK);
        const stripSize = direction === "h" ? HEIGHT / stripCount : WIDTH / stripCount;
        const clipRect = direction === "h"
          ? `inset(${i * stripSize}px 0 ${HEIGHT - (i + 1) * stripSize}px 0)`
          : `inset(0 ${WIDTH - (i + 1) * stripSize}px 0 ${i * stripSize}px)`;
        return (
          <div key={i} style={{ position: "absolute", inset: 0, clipPath: clipRect }}>
            <MosaicImage src={src} minBlockSize={blockSize} />
          </div>
        );
      })}
    </div>
  );
};

// ── Text overlay ────────────────────────────────────────────────────────────
const TextOverlay: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "180px 108px 400px", zIndex: 10,
    }}>
      <div style={{
        opacity, color: "#ffffff", fontSize: 72, fontWeight: 700,
        fontFamily: spaceGroteskFamily, lineHeight: 1.2, textAlign: "center",
        textShadow: "0 4px 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)",
        maxWidth: 900, whiteSpace: "pre-wrap",
      }}>
        {text}
      </div>
    </div>
  );
};

// ── Beat transition — punchy entrance for fast cuts ─────────────────────────
// White flash + zoom snap in the first few frames. For 0.5s beat-synced cuts.
const BeatOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  // Subtle flash: half-white → gone in 2 frames
  const flashOpacity = interpolate(frame, [0, 2], [0.4, 0], { extrapolateRight: "clamp" });

  return (
    <>
      {flashOpacity > 0.01 && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 20,
            background: "#ffffff",
            opacity: flashOpacity,
          }}
        />
      )}
    </>
  );
};

// Gentle zoom snap: 1.03 → 1.0 in 4 frames
function getBeatScale(frame: number): number {
  if (frame >= 4) return 1;
  return 1.03 - (frame / 4) * 0.03;
}

// ── PhotoFrame — main export ────────────────────────────────────────────────
export const PhotoFrame: React.FC<{
  image: SlideshowImage;
  accentColor?: string;
}> = ({ image, accentColor = WIAI_YELLOW }) => {
  const duration = image.duration ?? 35;
  const hold = image.hold ?? 0;
  const progress = useEffectProgress(duration, hold, image.effectDuration);
  const effects = normalizeEffects(image.effect);
  const mosaicBlock = getMosaicBlockSize(effects, progress);
  const mosaicBlur = getMosaicBlur(effects, mosaicBlock);
  const transform = getDriftTransform(effects, progress);

  const hasPixelStrips = effects.includes("pixel-strips");
  const hasBlockReveal = effects.includes("block-reveal");
  const hasMosaic = mosaicBlock !== null;
  const hasScanlines = hasScanlineEffect(effects);
  const hasAutofocus = effects.includes("autofocus");
  const hasBeat = effects.includes("beat");

  const frame = useCurrentFrame();
  const autofocusBlur = hasAutofocus ? getAutofocusBlur(frame) : 0;
  const totalBlur = autofocusBlur + mosaicBlur;
  const blurFilter = totalBlur > 0.1 ? `blur(${totalBlur.toFixed(1)}px)` : "";

  // Beat zoom scale
  const beatScale = hasBeat ? getBeatScale(frame) : 1;
  const beatTransform = beatScale !== 1 ? `scale(${beatScale})` : "";

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0A0A0A" }}>
      <div style={{
        position: "absolute", inset: 0,
        transform: beatTransform || undefined,
        transformOrigin: "center center",
      }}>
        {hasBlockReveal ? (
          <BlockReveal src={image.src} progress={progress} />
        ) : hasPixelStrips ? (
          <PixelStrips src={image.src} direction={image.direction ?? "h"} progress={progress} />
        ) : hasMosaic ? (
          <MosaicImage src={image.src} minBlockSize={mosaicBlock} cssFilter={blurFilter} />
        ) : hasScanlines ? (
          <ScanlineEffect src={image.src} effects={effects} progress={progress} transform={transform} />
        ) : (
          <div style={{
            position: "absolute", inset: 0, overflow: "hidden",
            filter: blurFilter, transform, transformOrigin: "center center",
          }}>
            <Img
              src={staticFile(image.src)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
      </div>

      {hasBeat && <BeatOverlay />}
      {image.text && <TextOverlay text={image.text} />}
    </div>
  );
};
