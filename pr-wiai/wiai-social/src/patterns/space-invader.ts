import { LedPattern } from "../components/LedWall";

// Classic Space Invader sprite — 11×8 centered in the 24×48 grid.
// Two frames: arms down / arms up (classic animation).
function makeFrame(armsUp: boolean): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  // Sprite data (11 wide × 8 tall), 1 = LED on
  const sprite = armsUp
    ? [
        [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
        [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
      ]
    : [
        [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
        [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      ];

  // Center sprite in grid — scale 2x for visibility
  const scale = 2;
  const spriteH = sprite.length * scale;
  const spriteW = sprite[0].length * scale;
  const offsetR = Math.floor((rows - spriteH) / 2);
  const offsetC = Math.floor((cols - spriteW) / 2);

  for (let sr = 0; sr < sprite.length; sr++) {
    for (let sc = 0; sc < sprite[0].length; sc++) {
      if (sprite[sr][sc]) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const r = offsetR + sr * scale + dy;
            const c = offsetC + sc * scale + dx;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
              grid[r][c] = true;
            }
          }
        }
      }
    }
  }

  return grid;
}

export const spaceInvaderPattern: LedPattern = {
  frames: [makeFrame(false), makeFrame(true)],
  fps: 2, // slow retro toggle
};
