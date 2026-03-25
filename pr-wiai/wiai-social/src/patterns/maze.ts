import { LedPattern } from "../components/LedWall";

// 24×48 static maze pattern — corridor-style grid visible at TikTok thumbnail size.
// Walls are `true` (sprite LEDs), corridors are `false` (background LEDs).
// Pattern: 3-wide corridors separated by 1-wide walls, creating a readable grid.
function generateMaze(): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cols; c++) {
      // Wall every 4th row and 4th column, with some openings
      const isWallRow = r % 4 === 0;
      const isWallCol = c % 4 === 0;

      if (isWallRow && isWallCol) {
        // Intersection — always a wall
        row.push(true);
      } else if (isWallRow) {
        // Horizontal wall segment — open every 8th cell for corridors
        const hash = Math.sin(r * 127.1 + c * 311.7) * 43758.5453;
        const h = hash - Math.floor(hash);
        row.push(h > 0.3); // 70% wall, 30% opening
      } else if (isWallCol) {
        // Vertical wall segment — open some for passages
        const hash = Math.sin(r * 311.7 + c * 127.1) * 43758.5453;
        const h = hash - Math.floor(hash);
        row.push(h > 0.35); // 65% wall, 35% opening
      } else {
        // Corridor — not a wall
        row.push(false);
      }
    }
    grid.push(row);
  }
  return grid;
}

export const mazePattern: LedPattern = {
  frames: [generateMaze()],
};
