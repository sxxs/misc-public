import { LedPattern } from "../components/LedWall";

// Eye sprite — blinks occasionally (3 frames: open, half-closed, closed).
// For surveillance / tracking / "ich sehe dich" topics.
function makeFrame(state: "open" | "half" | "closed"): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  const open = [
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0],
    [1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1],
    [1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
  ];

  const half = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const closed = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const sprite = state === "open" ? open : state === "half" ? half : closed;

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

// Blink cycle: open × 12 frames, half × 1, closed × 1, half × 1, open × 12...
// At fps=4: each frame = 0.25s, so 12 open = 3s, blink = 0.75s
export const eyePattern: LedPattern = {
  frames: [
    ...Array(12).fill(null).map(() => makeFrame("open")),
    makeFrame("half"),
    makeFrame("closed"),
    makeFrame("half"),
  ],
  fps: 4,
};
