import { GridState } from './types';

// Apply gravity to the grid: move cells down into empty spaces. Returns true if changed.
export function applyGravity(grid: GridState): { grid: GridState; changed: boolean } {
  const { width, height } = grid;
  let changed = false;

  // For each column, compact non-null cells downward
  for (let x = 0; x < width; x++) {
    let writeY = height - 1;
    for (let readY = height - 1; readY >= 0; readY--) {
      const row = grid.cells[readY];
      const cell = row ? row[x] : null;
      if (cell) {
        if (writeY !== readY) {
          // move
          if (!grid.cells[writeY]) grid.cells[writeY] = new Array(width).fill(null);
          grid.cells[writeY]![x] = cell;
          if (!grid.cells[readY]) grid.cells[readY] = new Array(width).fill(null);
          grid.cells[readY]![x] = null;
          changed = true;
        }
        writeY--;
      }
    }
  }

  return { grid, changed };
}
