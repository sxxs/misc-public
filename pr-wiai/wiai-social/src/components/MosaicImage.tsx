import React, { useEffect, useRef, useState } from "react";
import { staticFile, delayRender, continueRender } from "remotion";

const WIDTH = 1080;
const HEIGHT = 1920;
const SUB_PX = 6; // base grid resolution

const GRID_W = Math.ceil(WIDTH / SUB_PX);   // 180
const GRID_H = Math.ceil(HEIGHT / SUB_PX);  // 320

// ── Bayer 4×4 ordered dither (normalized 0–1) ──────────────────────────────
const BAYER_4 = [
  [ 0/16,  8/16,  2/16, 10/16],
  [12/16,  4/16, 14/16,  6/16],
  [ 3/16, 11/16,  1/16,  9/16],
  [15/16,  7/16, 13/16,  5/16],
];

interface SubBlock { r: number; g: number; b: number; lum: number }

function precomputeGrid(data: Uint8ClampedArray): SubBlock[] {
  const grid: SubBlock[] = new Array(GRID_W * GRID_H);
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      let sumR = 0, sumG = 0, sumB = 0, n = 0;
      const pyEnd = Math.min((gy + 1) * SUB_PX, HEIGHT);
      const pxEnd = Math.min((gx + 1) * SUB_PX, WIDTH);
      for (let py = gy * SUB_PX; py < pyEnd; py++) {
        for (let px = gx * SUB_PX; px < pxEnd; px++) {
          const i = (py * WIDTH + px) * 4;
          sumR += data[i]; sumG += data[i + 1]; sumB += data[i + 2]; n++;
        }
      }
      const r = Math.round(sumR / n), g = Math.round(sumG / n), b = Math.round(sumB / n);
      grid[gy * GRID_W + gx] = { r, g, b, lum: r * 0.299 + g * 0.587 + b * 0.114 };
    }
  }
  return grid;
}

// ── Draw mosaic ─────────────────────────────────────────────────────────────
// Each cell is a solid opaque block. NO blending toward original.
// Large cells get Bayer dithering with dark/light from pre-computed sub-blocks.
function drawMosaic(
  buf: Uint8ClampedArray,
  grid: SubBlock[],
  cellSubs: number,
) {
  const cellCols = Math.ceil(GRID_W / cellSubs);
  const cellRows = Math.ceil(GRID_H / cellSubs);

  // Dither sub-pixel count per axis within a cell (visible, chunky dithering)
  // Large cells: 4×4 dither grid. Small cells: solid.
  const ditherN = cellSubs >= 6 ? 4 : cellSubs >= 3 ? 2 : 0;

  for (let cr = 0; cr < cellRows; cr++) {
    for (let cc = 0; cc < cellCols; cc++) {
      const gx0 = cc * cellSubs;
      const gy0 = cr * cellSubs;
      const gx1 = Math.min(gx0 + cellSubs, GRID_W);
      const gy1 = Math.min(gy0 + cellSubs, GRID_H);

      // Cell average + find darkest/lightest sub-block
      let sumR = 0, sumG = 0, sumB = 0, n = 0;
      let minLum = Infinity, maxLum = -Infinity;
      let dr = 0, dg = 0, db = 0;
      let lr = 0, lg = 0, lb = 0;

      for (let gy = gy0; gy < gy1; gy++) {
        for (let gx = gx0; gx < gx1; gx++) {
          const sb = grid[gy * GRID_W + gx];
          sumR += sb.r; sumG += sb.g; sumB += sb.b; n++;
          if (sb.lum < minLum) { minLum = sb.lum; dr = sb.r; dg = sb.g; db = sb.b; }
          if (sb.lum > maxLum) { maxLum = sb.lum; lr = sb.r; lg = sb.g; lb = sb.b; }
        }
      }

      const avgR = Math.round(sumR / n);
      const avgG = Math.round(sumG / n);
      const avgB = Math.round(sumB / n);
      const lumRange = maxLum - minLum;

      // Pixel bounds of this cell
      const pxLeft = gx0 * SUB_PX;
      const pyTop  = gy0 * SUB_PX;
      const cellW  = (gx1 - gx0) * SUB_PX;
      const cellH  = (gy1 - gy0) * SUB_PX;

      // No dithering: solid average color
      if (ditherN === 0 || lumRange < 20) {
        fillRect(buf, pxLeft, pyTop, cellW, cellH, avgR, avgG, avgB);
        continue;
      }

      // Dithered cell: Bayer pattern with dark/light colors
      const avgLum = avgR * 0.299 + avgG * 0.587 + avgB * 0.114;
      const range = maxLum - minLum;
      const ratio = range > 1 ? (avgLum - minLum) / range : 0.5;

      const ditherSubW = cellW / ditherN;
      const ditherSubH = cellH / ditherN;

      for (let dy = 0; dy < ditherN; dy++) {
        for (let dx = 0; dx < ditherN; dx++) {
          const threshold = BAYER_4[dy % 4][dx % 4];
          const useLight = threshold < ratio;
          const cr2 = useLight ? lr : dr;
          const cg2 = useLight ? lg : dg;
          const cb2 = useLight ? lb : db;

          const sx = pxLeft + Math.round(dx * ditherSubW);
          const sy = pyTop  + Math.round(dy * ditherSubH);
          const sw = Math.round((dx + 1) * ditherSubW) - Math.round(dx * ditherSubW);
          const sh = Math.round((dy + 1) * ditherSubH) - Math.round(dy * ditherSubH);

          fillRect(buf, sx, sy, sw, sh, cr2, cg2, cb2);
        }
      }
    }
  }
}

// Fast pixel-buffer rectangle fill
function fillRect(
  buf: Uint8ClampedArray,
  x: number, y: number, w: number, h: number,
  r: number, g: number, b: number,
) {
  const x1 = Math.max(0, x);
  const y1 = Math.max(0, y);
  const x2 = Math.min(WIDTH, x + w);
  const y2 = Math.min(HEIGHT, y + h);
  for (let py = y1; py < y2; py++) {
    const rowOff = py * WIDTH * 4;
    for (let px = x1; px < x2; px++) {
      const i = rowOff + px * 4;
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  }
}

// ── React component ─────────────────────────────────────────────────────────
export const MosaicImage: React.FC<{
  src: string;
  minBlockSize: number;
  cssFilter?: string;
}> = ({ src, minBlockSize, cssFilter }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const [handle] = useState(() => delayRender("Loading mosaic image"));
  const [grid, setGrid] = useState<SubBlock[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) {
        const c = document.createElement("canvas");
        c.width = WIDTH; c.height = HEIGHT;
        const ctx = c.getContext("2d")!;
        // Simulate objectFit:"cover" — maintain aspect ratio, crop to fill
        const imgR = img.naturalWidth / img.naturalHeight;
        const canR = WIDTH / HEIGHT;
        let sx: number, sy: number, sw: number, sh: number;
        if (imgR > canR) {
          // Image wider than canvas — crop sides
          sh = img.naturalHeight;
          sw = sh * canR;
          sx = (img.naturalWidth - sw) / 2;
          sy = 0;
        } else {
          // Image taller than canvas — crop top/bottom
          sw = img.naturalWidth;
          sh = sw / canR;
          sx = 0;
          sy = (img.naturalHeight - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT);
        setGrid(precomputeGrid(ctx.getImageData(0, 0, WIDTH, HEIGHT).data));
      }
      continueRender(handle);
    };
    img.onerror = () => continueRender(handle);
    img.src = staticFile(src);
    return () => { cancelled = true; };
  }, [src, handle]);

  const cellSubs = Math.max(1, Math.round(minBlockSize / SUB_PX));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!imageDataRef.current) imageDataRef.current = ctx.createImageData(WIDTH, HEIGHT);
    drawMosaic(imageDataRef.current.data, grid, cellSubs);
    ctx.putImageData(imageDataRef.current, 0, 0);
  }, [grid, cellSubs]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: cssFilter || "none" }}>
      <canvas
        ref={canvasRef}
        width={WIDTH} height={HEIGHT}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
};
