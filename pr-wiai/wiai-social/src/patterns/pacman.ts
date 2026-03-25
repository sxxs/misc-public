import { LedPattern } from "../components/LedWall";

// Pac-Man with dots — 2 frames: mouth open / mouth closed.
// Sprite centered in 24×48 grid, 2x scale.
function makeFrame(mouthOpen: boolean): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  // Pac-Man body: 13×13 circle-ish shape
  const open = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  ];

  const closed = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  ];

  const sprite = mouthOpen ? open : closed;

  // Place Pac-Man in upper-left area (not dead center — leave room for dots)
  const offsetR = 14;
  const offsetC = 1;

  for (let sr = 0; sr < sprite.length; sr++) {
    for (let sc = 0; sc < sprite[0].length; sc++) {
      if (sprite[sr][sc]) {
        grid[offsetR + sr][offsetC + sc] = true;
      }
    }
  }

  // Dot trail — 3 dots to the right of Pac-Man
  const dotRow = offsetR + 6; // mouth level
  const dotPositions = [16, 19, 22];
  for (const dc of dotPositions) {
    if (dc < cols) {
      grid[dotRow][dc] = true;
      grid[dotRow + 1][dc] = true;
      grid[dotRow][dc + 1] = true;
      grid[dotRow + 1][dc + 1] = true;
    }
  }

  return grid;
}

export const pacmanPattern: LedPattern = {
  frames: [makeFrame(true), makeFrame(false)],
  fps: 3, // chomp chomp
};
