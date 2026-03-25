import { LedPattern } from "../components/LedWall";

// Real maze generated via recursive backtracker (depth-first search).
// Walls are sprite LEDs (bright), corridors are background LEDs (dark).
//
// Grid layout: each maze cell = 2×2 corridor pixels, separated by 1px walls.
// Cell grid: 11 wide × 23 tall → LED grid: 23×47, padded to 24×48.

const CELLS_W = 11;
const CELLS_H = 23;
const GRID_W = CELLS_W * 2 + 1; // 23
const GRID_H = CELLS_H * 2 + 1; // 47

// Deterministic pseudo-random: returns 0..1 for a given seed
function hash(seed: number): number {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// Shuffle array in-place using deterministic hashing
function deterministicShuffle<T>(arr: T[], seed: number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(hash(seed + i * 7.13) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateMaze(): boolean[][] {
  // Start with all walls (true = wall/sprite LED)
  const maze: boolean[][] = Array.from({ length: GRID_H }, () =>
    Array(GRID_W).fill(true)
  );

  // Track visited cells
  const visited: boolean[][] = Array.from({ length: CELLS_H }, () =>
    Array(CELLS_W).fill(false)
  );

  // Cell (cx, cy) → grid position (2*cx+1, 2*cy+1)
  const cellToGrid = (cx: number, cy: number) => ({
    gx: cx * 2 + 1,
    gy: cy * 2 + 1,
  });

  // Carve a cell: set its 2×2 block to false (corridor)
  // Actually each cell is 1×1 in the maze grid (odd positions)
  const carveCell = (cx: number, cy: number) => {
    const { gx, gy } = cellToGrid(cx, cy);
    maze[gy][gx] = false;
  };

  // Remove wall between two adjacent cells
  const removeWall = (cx1: number, cy1: number, cx2: number, cy2: number) => {
    const wallGx = cx1 * 2 + 1 + (cx2 - cx1);
    const wallGy = cy1 * 2 + 1 + (cy2 - cy1);
    maze[wallGy][wallGx] = false;
  };

  // Directions: [dx, dy]
  const dirs: [number, number][] = [
    [0, -1], // up
    [1, 0],  // right
    [0, 1],  // down
    [-1, 0], // left
  ];

  // Recursive backtracker (iterative with explicit stack for determinism)
  const stack: [number, number][] = [];
  let seedCounter = 0;

  // Start at top-left
  const startX = 0;
  const startY = 0;
  visited[startY][startX] = true;
  carveCell(startX, startY);
  stack.push([startX, startY]);

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];

    // Find unvisited neighbors
    const neighbors: [number, number][] = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < CELLS_W && ny >= 0 && ny < CELLS_H && !visited[ny][nx]) {
        neighbors.push([nx, ny]);
      }
    }

    if (neighbors.length === 0) {
      stack.pop(); // backtrack
    } else {
      // Pick a random neighbor (deterministic)
      deterministicShuffle(neighbors, seedCounter++);
      const [nx, ny] = neighbors[0];
      visited[ny][nx] = true;
      removeWall(cx, cy, nx, ny);
      carveCell(nx, ny);
      stack.push([nx, ny]);
    }
  }

  // Pad to 24×48: add 1 extra column (wall) and 1 extra row (wall)
  const padded: boolean[][] = [];
  for (let r = 0; r < 48; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < 24; c++) {
      if (r < GRID_H && c < GRID_W) {
        row.push(maze[r][c]);
      } else {
        row.push(true); // padding = wall
      }
    }
    padded.push(row);
  }

  return padded;
}

export const mazePattern: LedPattern = {
  frames: [generateMaze()],
};
