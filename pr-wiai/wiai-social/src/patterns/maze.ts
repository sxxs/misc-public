import { LedPattern } from "../components/LedWall";

// 24×48 maze pattern — clean corridors with solid walls.
// Walls are `true` (sprite LEDs), corridors are `false` (background LEDs).
function generateMaze(): boolean[][] {
  const rows = 48;
  const cols = 24;
  const grid: boolean[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cols; c++) {
      // Solid wall grid: 1-wide walls every 5 cells
      const isWallRow = r % 5 === 0;
      const isWallCol = c % 5 === 0;

      if (isWallRow || isWallCol) {
        // Default: wall is on
        // Create openings only in specific places for the maze feel
        if (isWallRow && !isWallCol) {
          // Horizontal wall — create one opening per segment
          const segment = Math.floor(c / 5);
          const hash = Math.sin(r * 127.1 + segment * 311.7) * 43758.5453;
          const h = hash - Math.floor(hash);
          // Opening at 2 specific positions per segment (deterministic)
          const posInSegment = c % 5;
          const openAt = Math.floor(h * 4) + 1; // 1-4
          row.push(posInSegment !== openAt);
        } else if (isWallCol && !isWallRow) {
          // Vertical wall — create one opening per segment
          const segment = Math.floor(r / 5);
          const hash = Math.sin(segment * 311.7 + c * 127.1) * 43758.5453;
          const h = hash - Math.floor(hash);
          const posInSegment = r % 5;
          const openAt = Math.floor(h * 4) + 1; // 1-4
          row.push(posInSegment !== openAt);
        } else {
          // Intersection — always solid
          row.push(true);
        }
      } else {
        // Corridor — always off
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
