import { Grid } from './Grid';
import { GridState, GridPosition, Die, MatchGroup } from './types';
import { detectMatches } from './MatchDetector';
import { applyGravity } from './Gravity';

export type LockResult = {
  matches: MatchGroup[];
  cleared: GridPosition[];
  gravityApplied: boolean;
};

// GameBoard is the authoritative owner of grid contents and higher-level
// operations like locking pieces, detecting matches, clearing, and applying gravity.
export class GameBoard {
  private grid: Grid;

  constructor(width = 10, height = 20) {
    this.grid = new Grid(width, height);
  }

  // expose the underlying state for rendering/read-only purposes
  get state(): GridState {
    return this.grid.state;
  }

  get width(): number { return this.state.width; }
  get height(): number { return this.state.height; }

  isValidPosition(x: number, y: number): boolean { return this.grid.isValidPosition(x, y); }
  isEmpty(x: number, y: number): boolean { return this.grid.isEmpty(x, y); }
  getCell(pos: GridPosition): Die | null { return this.grid.getCell(pos); }

  // Add multiple pieces atomically
  addPieceAt(cells: Array<{ pos: GridPosition; die: Die }>): void {
    this.grid.addPieceAt(cells);
  }

  // Clear specific cells
  clearCells(positions: GridPosition[]): void {
    this.grid.clearCells(positions);
  }

  occupiedPositions() {
    return this.grid.occupiedPositions();
  }

  // Lock a single die into the board at pos, then run match detection and gravity.
  // Returns details about matches and cleared positions.
  lockAt(pos: GridPosition, die: Die, minMatch = 3): LockResult {
    if (!this.isValidPosition(pos.x, pos.y)) {
      return { matches: [], cleared: [], gravityApplied: false };
    }
    // Place the die
    this.grid.setCell(pos, die);

    // Detect matches
    const matches = detectMatches(this.state, minMatch);
    const toClear: GridPosition[] = [];
    for (const m of matches) {
      for (const p of m.positions) toClear.push(p);
    }

    // Clear matched cells
    if (toClear.length) this.grid.clearCells(toClear);

    // Apply gravity (compact columns)
    const gravityResult = applyGravity(this.state);

    return { matches, cleared: toClear, gravityApplied: gravityResult.changed };
  }
}

export default GameBoard;
