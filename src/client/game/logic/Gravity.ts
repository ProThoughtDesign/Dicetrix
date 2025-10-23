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

// Apply individual die gravity: each die falls one step if there's empty space below
export function applyIndividualGravity(grid: GridState): { grid: GridState; changed: boolean } {
  const { width, height } = grid;
  let changed = false;

  // Check each die from bottom to top, left to right
  for (let y = height - 2; y >= 0; y--) { // Start from second-to-bottom row
    for (let x = 0; x < width; x++) {
      const currentRow = grid.cells[y];
      const die = currentRow ? currentRow[x] : null;
      
      if (die) {
        // Check if there's empty space below
        const belowRow = grid.cells[y + 1];
        const spaceBelow = belowRow ? belowRow[x] : null;
        
        if (!spaceBelow) {
          // Move die down one cell
          if (!grid.cells[y + 1]) {
            grid.cells[y + 1] = new Array(width).fill(null);
          }
          grid.cells[y + 1]![x] = die;
          
          if (!grid.cells[y]) {
            grid.cells[y] = new Array(width).fill(null);
          }
          grid.cells[y]![x] = null;
          
          changed = true;
        }
      }
    }
  }

  return { grid, changed };
}
