import { LedPattern } from "../components/LedWall";

// Heart sprite that pulses: normal → large → normal → small.
// Native size, positioned in upper third.
// 4-frame loop at 2fps = 2s heartbeat cycle.

// Heart shape: 11×9 base
const BASE_HEART = [
  [0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
  [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
];

function makeHeart(extraBorder: boolean): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  const spriteH = BASE_HEART.length;
  const spriteW = BASE_HEART[0].length;

  // Upper third, horizontally centered
  const offsetR = 5;
  const offsetC = Math.floor((cols - spriteW) / 2);

  for (let sr = 0; sr < spriteH; sr++) {
    for (let sc = 0; sc < spriteW; sc++) {
      if (BASE_HEART[sr][sc]) {
        const r = offsetR + sr;
        const c = offsetC + sc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          grid[r][c] = true;
        }
      }
    }
  }

  // "Beat" frame: add 1-pixel border around existing sprite LEDs
  if (extraBorder) {
    const copy = grid.map((r) => [...r]);
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (copy[r][c]) {
          grid[r - 1][c] = true;
          grid[r + 1][c] = true;
          grid[r][c - 1] = true;
          grid[r][c + 1] = true;
        }
      }
    }
  }

  return grid;
}

export const heartbeatPattern: LedPattern = {
  frames: [
    makeHeart(false), // normal
    makeHeart(true),  // expanded (beat)
    makeHeart(false), // normal
    makeHeart(false), // rest
  ],
  fps: 2,
};
