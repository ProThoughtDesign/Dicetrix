import { GridState } from './types';
import { CoordinateConverter } from '../../../shared/utils/CoordinateConverter';

// Apply gravity to the grid: move cells down into empty spaces. Returns true if changed.
export function applyGravity(grid: GridState): { grid: GridState; changed: boolean } {
  const { width, height } = grid;
  const converter = new CoordinateConverter(height);
  let changed = false;

  // For each column, compact non-null cells toward Y=0 (bottom)
  for (let x = 0; x < width; x++) {
    let writeGridY = 0; // Start writing at bottom (Y=0)
    
    // Read from bottom to top in grid coordinates (Y=0 to Y=height-1)
    for (let readGridY = 0; readGridY < height; readGridY++) {
      const readArrayY = converter.gridToArrayY(readGridY);
      const row = grid.cells[readArrayY];
      const cell = row ? row[x] : null;
      
      if (cell) {
        const writeArrayY = converter.gridToArrayY(writeGridY);
        
        if (writeGridY !== readGridY) {
          // Move cell to lower position
          if (!grid.cells[writeArrayY]) grid.cells[writeArrayY] = new Array(width).fill(null);
          grid.cells[writeArrayY]![x] = cell;
          if (!grid.cells[readArrayY]) grid.cells[readArrayY] = new Array(width).fill(null);
          grid.cells[readArrayY]![x] = null;
          changed = true;
        }
        writeGridY++; // Move to next higher position for writing
      }
    }
  }

  return { grid, changed };
}

// Apply individual die gravity: each die falls one step if there's empty space below
export function applyIndividualGravity(grid: GridState): { grid: GridState; changed: boolean } {
  const { width, height } = grid;
  const converter = new CoordinateConverter(height);
  let changed = false;

  // Check each die from bottom to top in grid coordinates, left to right
  // Start from Y=1 (second row from bottom) and go up to Y=height-1 (top)
  for (let gridY = 1; gridY < height; gridY++) {
    for (let x = 0; x < width; x++) {
      const currentArrayY = converter.gridToArrayY(gridY);
      const currentRow = grid.cells[currentArrayY];
      const die = currentRow ? currentRow[x] : null;
      
      if (die) {
        // Check if there's empty space below (gridY - 1)
        const belowGridY = gridY - 1;
        const belowArrayY = converter.gridToArrayY(belowGridY);
        const belowRow = grid.cells[belowArrayY];
        const spaceBelow = belowRow ? belowRow[x] : null;
        
        if (!spaceBelow) {
          // Move die down one cell (decrease Y coordinate)
          if (!grid.cells[belowArrayY]) {
            grid.cells[belowArrayY] = new Array(width).fill(null);
          }
          grid.cells[belowArrayY]![x] = die;
          
          if (!grid.cells[currentArrayY]) {
            grid.cells[currentArrayY] = new Array(width).fill(null);
          }
          grid.cells[currentArrayY]![x] = null;
          
          changed = true;
        }
      }
    }
  }

  return { grid, changed };
}
