import { GridState, GridPosition, MatchGroup, Die } from './types';
import { CoordinateConverter } from '../../../shared/utils/CoordinateConverter';
import { BlackDieManager, type GameBoard as BlackDieGameBoard } from '../../../shared/utils/BlackDieManager';

export function detectMatches(grid: GridState, minMatch = 3): MatchGroup[] {
  const converter = new CoordinateConverter(grid.height);
  const visited: boolean[][] = [];
  for (let y = 0; y < grid.height; y++) visited[y] = new Array(grid.width).fill(false);

  const matches: MatchGroup[] = [];

  for (let y = 0; y < grid.height; y++) {
    if (!visited[y]) visited[y] = new Array(grid.width).fill(false);
    const row = grid.cells[y];
    if (!row) continue;
    for (let x = 0; x < grid.width; x++) {
  if (visited[y]![x]) continue;
  const cell = row[x];
  if (!cell) { visited[y]![x] = true; continue; }

      // flood-fill same-number (wilds match any number but we'll consider wild included)
      const group: GridPosition[] = [];
  const stack: GridPosition[] = [{ x, y }];
  visited[y]![x] = true;

      while (stack.length) {
        const p = stack.pop()!;
  const crow = grid.cells[p.y];
  if (!crow) continue;
  const c = crow[p.x];
  if (!c) continue;
        // Convert array coordinates to grid coordinates for the result
        const gridY = converter.arrayToGridY(p.y);
        group.push({ x: p.x, y: gridY });

        const neighbors = [
          { x: p.x - 1, y: p.y },
          { x: p.x + 1, y: p.y },
          { x: p.x, y: p.y - 1 },
          { x: p.x, y: p.y + 1 }
        ];
        for (const n of neighbors) {
          if (n.x < 0 || n.x >= grid.width || n.y < 0 || n.y >= grid.height) continue;
          const nrow = grid.cells[n.y];
          if (!nrow) continue;
          if (!visited[n.y]) visited[n.y] = new Array(grid.width).fill(false);
          if (visited[n.y]![n.x]) continue;
          const nc = nrow[n.x];
          if (!nc) { visited[n.y]![n.x] = true; continue; }

          // Enhanced match logic: same number, wild dice, or Black Die wild matching
          const canMatch = nc.number === c.number || 
                          nc.isWild || 
                          c.isWild ||
                          (BlackDieManager.isBlackDie(nc) && BlackDieManager.canMatchWith(nc, c.number)) ||
                          (BlackDieManager.isBlackDie(c) && BlackDieManager.canMatchWith(c, nc.number));
          
          if (canMatch) {
            visited[n.y]![n.x] = true;
            stack.push(n);
          }
        }
      }

      if (group.length >= minMatch) {
        // compute color counts
        const colors: Record<string, number> = {};
        for (const p of group) {
          // Convert grid coordinates back to array coordinates to access the cell
          const arrayY = converter.gridToArrayY(p.y);
          const r = grid.cells[arrayY];
          if (!r) continue;
          const d = r[p.x] as Die | null;
          if (!d) continue;
          colors[d.color] = (colors[d.color] || 0) + 1;
        }
        // matchedNumber: pick the number of the starting cell (representative)
        // convert starting array coords x,y -> grid coords used in `group` were already converted, but we still have `cell` above
        // find a representative number from one of the group's positions
        let matchedNumber: number | undefined = undefined;
        for (const p of group) {
          const arrayY = converter.gridToArrayY(p.y);
          const r = grid.cells[arrayY];
          if (!r) continue;
          const d = r[p.x] as Die | null;
          if (d && typeof d.number === 'number') {
            matchedNumber = d.number;
            break;
          }
        }

        const match: MatchGroup = { positions: group, size: group.length, colors };
        if (matchedNumber !== undefined) (match as any).matchedNumber = matchedNumber;
        matches.push(match);
      }
    }
  }

  return matches;
}

/**
 * Adapter class to bridge GameBoard with BlackDieManager interface
 */
class GameBoardAdapter implements BlackDieGameBoard {
  constructor(private gameBoard: any) {}

  get state() {
    return this.gameBoard.state;
  }

  getCell(pos: GridPosition) {
    return this.gameBoard.getCell(pos);
  }

  lockCell(pos: GridPosition, die: any): void {
    this.gameBoard.lockCell(pos, die);
  }

  isValidPosition(x: number, y: number): boolean {
    return this.gameBoard.isValidPosition(x, y);
  }
}

/**
 * Enhanced match detection that includes Black Die area conversion effects
 * @param grid The game grid state
 * @param gameBoard Game board interface for area conversion (optional)
 * @param minMatch Minimum match size (default: 3)
 * @returns Array of match groups with area conversion effects applied
 */
export function detectMatchesWithBlackDieEffects(
  grid: GridState, 
  gameBoard?: any, 
  minMatch = 3
): MatchGroup[] {
  // First detect all matches using standard logic
  const matches = detectMatches(grid, minMatch);
  
  // If no game board provided, return matches without area conversion
  if (!gameBoard || matches.length === 0) {
    return matches;
  }

  // Create adapter for BlackDieManager interface
  const adapter = new GameBoardAdapter(gameBoard);

  // Process each match to trigger Black Die area conversion effects
  for (const match of matches) {
    const blackDiePositions = findBlackDiceInMatch(match, grid);
    
    // Trigger area conversion for each Black Die in the match
    for (const blackDiePos of blackDiePositions) {
      try {
        BlackDieManager.triggerAreaConversion(blackDiePos, adapter);
      } catch (error) {
        console.warn(`Failed to trigger area conversion at position (${blackDiePos.x}, ${blackDiePos.y}):`, error);
      }
    }
  }

  return matches;
}

/**
 * Finds all Black Die positions within a match group
 * @param match The match group to search
 * @param grid The game grid state
 * @returns Array of positions containing Black Dice
 */
function findBlackDiceInMatch(match: MatchGroup, grid: GridState): GridPosition[] {
  const converter = new CoordinateConverter(grid.height);
  const blackDiePositions: GridPosition[] = [];

  for (const pos of match.positions) {
    // Convert grid coordinates back to array coordinates
    const arrayY = converter.gridToArrayY(pos.y);
    const row = grid.cells[arrayY];
    if (!row) continue;
    
    const die = row[pos.x] as Die | null;
    if (die && BlackDieManager.isBlackDie(die)) {
      blackDiePositions.push(pos);
    }
  }

  return blackDiePositions;
}
