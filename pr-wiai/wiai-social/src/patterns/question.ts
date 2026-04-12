import { LedPattern } from "../components/LedWall";

// Blinking question mark — provocative hooks, "merkste selber" posts.
// 2 frames at 2fps = 1Hz blink (on 0.5s, off 0.5s).
function generate(): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  // Question mark sprite: 6 wide × 15 tall
  const sprite = [
    [0, 1, 1, 1, 1, 0], // 0  top curve
    [1, 1, 1, 1, 1, 1], // 1  full bar
    [1, 1, 0, 0, 1, 1], // 2  sides
    [0, 0, 0, 0, 1, 1], // 3  right side
    [0, 0, 0, 1, 1, 0], // 4  curve inward
    [0, 0, 1, 1, 0, 0], // 5  stem
    [0, 0, 1, 1, 0, 0], // 6  stem
    [0, 0, 1, 1, 0, 0], // 7  stem
    [0, 0, 0, 0, 0, 0], // 8  gap
    [0, 0, 0, 0, 0, 0], // 9  gap
    [0, 0, 1, 1, 0, 0], // 10 dot
    [0, 0, 1, 1, 0, 0], // 11 dot
    [0, 0, 1, 1, 0, 0], // 12 dot
  ];

  const spriteW = sprite[0].length;
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

function empty(): boolean[][] {
  return Array.from({ length: 48 }, () => Array(24).fill(false));
}

export const questionPattern: LedPattern = {
  frames: [generate(), empty()],
  fps: 2,
};
