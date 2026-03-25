import { LedPattern } from "../components/LedWall";

// Padlock sprite — centered in 24×48 grid, 2x scale.
// Static pattern for IT security / privacy topics.
function generate(): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  // Lock sprite: 10×12 (shackle 6 wide on top, body 10 wide below)
  const sprite = [
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

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

export const lockPattern: LedPattern = {
  frames: [generate()],
};
