import { LedPattern } from "../components/LedWall";

// Padlock sprite — native size, positioned in upper third.
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

  const spriteW = sprite[0].length;
  // Upper third, horizontally centered
  const offsetR = 6;
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

export const lockPattern: LedPattern = {
  frames: [generate()],
};
