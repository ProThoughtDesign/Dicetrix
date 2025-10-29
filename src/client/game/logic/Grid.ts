import { GridState, Cell, GridPosition, Die } from './types';
import { CoordinateConverter } from '../../../shared/utils/CoordinateConverter';

export class Grid {
  state: GridState;
  private coordinateConverter: CoordinateConverter;

  constructor(width = 8, height = 16) {
    const cells: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = new Array(width).fill(null);
      cells.push(row);
    }
    this.state = { width, height, cells };
    this.coordinateConverter = new CoordinateConverter(height);
  }

  /**
   * Convert grid Y coordinate (bottom-left origin) to array index (top-left origin)
   * @param gridY Y coordinate in grid system (0 = bottom, height-1 = top)
   * @returns Array index (0 = top row, height-1 = bottom row)
   */
  private gridToArrayY(gridY: number): number {
    return this.coordinateConverter.gridToArrayY(gridY);
  }

  /**
   * Convert array index (top-left origin) to grid Y coordinate (bottom-left origin)
   * @param arrayY Array index (0 = top row, height-1 = bottom row)
   * @returns Y coordinate in grid system (0 = bottom, height-1 = top)
   */
  private arrayToGridY(arrayY: number): number {
    return this.coordinateConverter.arrayToGridY(arrayY);
  }

  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.state.width && y >= 0 && y < this.state.height;
  }

  isEmpty(x: number, y: number): boolean {
    if (!this.isValidPosition(x, y)) return false;
    const arrayY = this.gridToArrayY(y);
    const row = this.state.cells[arrayY];
    return !!row && row[x] == null;
  }

  getCell(pos: GridPosition): Cell {
    if (!this.isValidPosition(pos.x, pos.y)) return null;
    const arrayY = this.gridToArrayY(pos.y);
    const row = this.state.cells[arrayY];
    return row ? row[pos.x] ?? null : null;
  }

  setCell(pos: GridPosition, die: Die | null): void {
    if (!this.isValidPosition(pos.x, pos.y)) return;
    const arrayY = this.gridToArrayY(pos.y);
    const row = this.state.cells[arrayY];
    if (!row) return;
    row[pos.x] = die;
  }

  addPieceAt(cells: Array<{ pos: GridPosition; die: Die }>): void {
    for (const item of cells) {
      if (this.isValidPosition(item.pos.x, item.pos.y)) {
        const arrayY = this.gridToArrayY(item.pos.y);
        const row = this.state.cells[arrayY];
        if (row) row[item.pos.x] = item.die;
      }
    }
  }

  // Clear cells at positions
  clearCells(positions: GridPosition[]): void {
    for (const p of positions) {
      if (this.isValidPosition(p.x, p.y)) {
        const arrayY = this.gridToArrayY(p.y);
        const row = this.state.cells[arrayY];
        if (row) row[p.x] = null;
      }
    }
  }

  // Convert grid to a flat list of occupied positions (for debugging/tests)
  occupiedPositions(): GridPosition[] {
    const out: GridPosition[] = [];
    for (let arrayY = 0; arrayY < this.state.height; arrayY++) {
      for (let x = 0; x < this.state.width; x++) {
        const row = this.state.cells[arrayY];
        if (row && row[x]) {
          const gridY = this.arrayToGridY(arrayY);
          out.push({ x, y: gridY });
        }
      }
    }
    return out;
  }
}
