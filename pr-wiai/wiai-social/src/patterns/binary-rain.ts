import { LedPattern } from "../components/LedWall";

// Matrix-style binary rain — columns of LEDs fall at different speeds.
// 16-frame loop at 6fps = ~2.7s cycle.
function generateFrames(): boolean[][][] {
  const rows = 48;
  const cols = 24;
  const numFrames = 16;
  const frames: boolean[][][] = [];

  // Each column has a deterministic speed and start offset
  const colSpeed: number[] = [];
  const colOffset: number[] = [];
  const colLength: number[] = []; // how many LEDs in the "tail"
  for (let c = 0; c < cols; c++) {
    const h1 = Math.sin(c * 127.1) * 43758.5453;
    const h2 = Math.sin(c * 311.7) * 43758.5453;
    const h3 = Math.sin(c * 73.3) * 43758.5453;
    colSpeed[c] = 2 + Math.floor((h1 - Math.floor(h1)) * 4); // 2-5 rows per frame
    colOffset[c] = Math.floor((h2 - Math.floor(h2)) * rows); // start position
    colLength[c] = 4 + Math.floor((h3 - Math.floor(h3)) * 8); // tail 4-11 LEDs
  }

  for (let f = 0; f < numFrames; f++) {
    const grid: boolean[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(false)
    );

    for (let c = 0; c < cols; c++) {
      const head = (colOffset[c] + f * colSpeed[c]) % (rows + colLength[c]);
      for (let t = 0; t < colLength[c]; t++) {
        const r = head - t;
        if (r >= 0 && r < rows) {
          grid[r][c] = true;
        }
      }
    }

    frames.push(grid);
  }

  return frames;
}

export const binaryRainPattern: LedPattern = {
  frames: generateFrames(),
  fps: 6,
};
