import { LedPattern } from "../components/LedWall";

// Heart sprite that pulses: normal → large → normal → small.
// 4-frame loop at 2fps = 2s heartbeat cycle.
function makeHeart(scale: number): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  // Heart shape: 12×10
  const sprite = [
    [0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
  ];

  const spriteH = sprite.length;
  const spriteW = sprite[0].length;
  const scaledH = Math.round(spriteH * scale);
  const scaledW = Math.round(spriteW * scale);
  const offsetR = Math.floor((rows - scaledH) / 2);
  const offsetC = Math.floor((cols - scaledW) / 2);

  for (let r = 0; r < scaledH; r++) {
    for (let c = 0; c < scaledW; c++) {
      const sr = Math.floor((r / scaledH) * spriteH);
      const sc = Math.floor((c / scaledW) * spriteW);
      if (sprite[sr]?.[sc]) {
        const gr = offsetR + r;
        const gc = offsetC + c;
        if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) {
          grid[gr][gc] = true;
        }
      }
    }
  }

  return grid;
}

export const heartbeatPattern: LedPattern = {
  frames: [
    makeHeart(2.0), // normal
    makeHeart(2.4), // expanded (beat)
    makeHeart(2.0), // normal
    makeHeart(1.7), // contracted
  ],
  fps: 2, // 2 beats per second = 120 BPM feel
};
