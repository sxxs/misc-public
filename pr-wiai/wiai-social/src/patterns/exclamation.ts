import { LedPattern } from "../components/LedWall";

// Blinking exclamation mark — provocative hooks, alarm/attention topics.
// 2 frames at 2fps = 1Hz blink (on 0.5s, off 0.5s).
function generate(): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  // Compact exclamation mark sprite: 4 wide × 16 tall
  // Bar (rows 0-9): tapers from 4 → 2 wide
  // Gap (rows 10-11)
  // Dot (rows 12-14): 4 wide
  const sprite = [
    [1, 1, 1, 1], // 0  bar
    [1, 1, 1, 1], // 1
    [1, 1, 1, 1], // 2
    [1, 1, 1, 1], // 3
    [1, 1, 1, 1], // 4
    [1, 1, 1, 1], // 5
    [1, 1, 1, 1], // 6
    [0, 1, 1, 0], // 7  taper
    [0, 1, 1, 0], // 8
    [0, 1, 1, 0], // 9
    [0, 0, 0, 0], // 10 gap
    [0, 0, 0, 0], // 11
    [0, 1, 1, 0], // 12 dot
    [0, 1, 1, 0], // 13
    [0, 1, 1, 0], // 14
  ];

  const spriteW = sprite[0].length;
  // Upper area, horizontally centered
  const offsetR = 4;
  const offsetC = Math.floor((cols - spriteW) / 2);

  for (let sr = 0; sr < sprite.length; sr++) {
    for (let sc = 0; sc < spriteW; sc++) {
      if (sprite[sr][sc]) {
        const r = offsetR + sr;
        const c = offsetC + sc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          grid[r][c] = true;
        }
      }
    }
  }

  return grid;
}

// Static empty frame (all LEDs off)
function empty(): boolean[][] {
  return Array.from({ length: 48 }, () => Array(24).fill(false));
}

export const exclamationPattern: LedPattern = {
  frames: [generate(), empty()],
  fps: 2,
};
