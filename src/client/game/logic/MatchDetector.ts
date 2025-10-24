import { GridState, GridPosition, MatchGroup, Die } from './types';
import { CoordinateConverter } from '../../../shared/utils/CoordinateConverter';

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

          // match logic: same number or either is wild
          if (nc.number === c.number || nc.isWild || c.isWild) {
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
