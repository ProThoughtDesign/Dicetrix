import { GridState, Cell, GridPosition, Die } from './types';

export class Grid {
  state: GridState;

  constructor(width = 10, height = 20) {
    const cells: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = new Array(width).fill(null);
      cells.push(row);
    }
    this.state = { width, height, cells };
  }

  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.state.width && y >= 0 && y < this.state.height;
  }

  isEmpty(x: number, y: number): boolean {
    if (!this.isValidPosition(x, y)) return false;
    const row = this.state.cells[y];
    return !!row && row[x] == null;
  }

  getCell(pos: GridPosition): Cell {
    if (!this.isValidPosition(pos.x, pos.y)) return null;
    const row = this.state.cells[pos.y];
    return row ? row[pos.x] ?? null : null;
  }

  setCell(pos: GridPosition, die: Die | null): void {
    if (!this.isValidPosition(pos.x, pos.y)) return;
    const row = this.state.cells[pos.y];
    if (!row) return;
    row[pos.x] = die;
  }

  addPieceAt(cells: Array<{ pos: GridPosition; die: Die }>): void {
    for (const item of cells) {
      if (this.isValidPosition(item.pos.x, item.pos.y)) {
        const row = this.state.cells[item.pos.y];
        if (row) row[item.pos.x] = item.die;
      }
    }
  }

  // Clear cells at positions
  clearCells(positions: GridPosition[]): void {
    for (const p of positions) {
      if (this.isValidPosition(p.x, p.y)) {
        const row = this.state.cells[p.y];
        if (row) row[p.x] = null;
      }
    }
  }

  // Convert grid to a flat list of occupied positions (for debugging/tests)
  occupiedPositions(): GridPosition[] {
    const out: GridPosition[] = [];
    for (let y = 0; y < this.state.height; y++) {
      for (let x = 0; x < this.state.width; x++) {
        const row = this.state.cells[y];
        if (row && row[x]) out.push({ x, y });
      }
    }
    return out;
  }
}
