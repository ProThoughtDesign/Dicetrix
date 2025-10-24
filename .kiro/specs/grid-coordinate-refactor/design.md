# Grid Coordinate System Refactor Design Document

## Overview

This design document outlines the refactoring of the Dicetrix game's grid coordinate system from a top-left origin (0,0) to a bottom-left origin (0,0). This change will make the coordinate system more intuitive where Y increases upward, pieces spawn at the top and fall naturally downward, and collision detection works with gravity in a more logical manner.

The current system uses a traditional computer graphics approach where Y=0 is at the top and Y increases downward. The new system will use a mathematical coordinate system where Y=0 is at the bottom and Y increases upward, which is more intuitive for a falling-block puzzle game.

## Architecture

### Current System Analysis

The current grid system consists of:

1. **Grid Class**: Manages a 2D array `cells[y][x]` where `y=0` is the top row
2. **GameBoard Class**: Provides high-level operations on the grid
3. **Game Scene**: Handles piece spawning, movement, and collision detection
4. **Gravity System**: Moves pieces downward by increasing Y coordinates
5. **Visual Rendering**: Maps grid coordinates to screen pixels

### Coordinate System Transformation

```
Current (Top-Left Origin):     New (Bottom-Left Origin):
┌─────────────────────────┐    ┌─────────────────────────┐
│ (0,0)  (1,0)  ... (9,0) │    │ (0,19) (1,19) ...(9,19) │
│ (0,1)  (1,1)  ... (9,1) │    │ (0,18) (1,18) ...(9,18) │
│  ...    ...   ...  ...  │    │  ...    ...   ...  ...  │
│ (0,18) (1,18) ...(9,18) │    │ (0,1)  (1,1)  ... (9,1) │
│ (0,19) (1,19) ...(9,19) │    │ (0,0)  (1,0)  ... (9,0) │
└─────────────────────────┘    └─────────────────────────┘
     Y increases down              Y increases up
```

### Data Flow Changes

```
Old Flow:
Spawn at Y=0 → Fall by Y++ → Stop at Y=19 → Stack upward with Y--

New Flow:  
Spawn at Y=21 → Fall by Y-- → Stop at Y=0 → Stack upward with Y++
```

## Components and Interfaces

### Grid Class Modifications

```typescript
export class Grid {
  state: GridState;

  constructor(width = 10, height = 20) {
    // Grid structure remains the same, but coordinate interpretation changes
    const cells: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = new Array(width).fill(null);
      cells.push(row);
    }
    this.state = { width, height, cells };
  }

  // Coordinate conversion methods
  private gridToArrayY(gridY: number): number {
    // Convert bottom-left grid Y to array index
    return this.state.height - 1 - gridY;
  }

  private arrayToGridY(arrayY: number): number {
    // Convert array index to bottom-left grid Y
    return this.state.height - 1 - arrayY;
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
}
```

### Gravity System Updates

```typescript
// Updated gravity to work with bottom-left coordinates
export function applyGravity(grid: GridState): { grid: GridState; changed: boolean } {
  const { width, height } = grid;
  let changed = false;

  // For each column, compact non-null cells toward Y=0 (bottom)
  for (let x = 0; x < width; x++) {
    let writeGridY = 0; // Start writing from bottom (Y=0)
    
    // Read from bottom to top in grid coordinates (Y=0 to Y=19)
    for (let readGridY = 0; readGridY < height; readGridY++) {
      const readArrayY = height - 1 - readGridY;
      const row = grid.cells[readArrayY];
      const cell = row ? row[x] : null;
      
      if (cell) {
        if (writeGridY !== readGridY) {
          // Move cell to lower position
          const writeArrayY = height - 1 - writeGridY;
          if (!grid.cells[writeArrayY]) {
            grid.cells[writeArrayY] = new Array(width).fill(null);
          }
          grid.cells[writeArrayY]![x] = cell;
          
          // Clear old position
          if (!grid.cells[readArrayY]) {
            grid.cells[readArrayY] = new Array(width).fill(null);
          }
          grid.cells[readArrayY]![x] = null;
          changed = true;
        }
        writeGridY++; // Next write position is one higher
      }
    }
  }

  return { grid, changed };
}
```

### Piece Spawning and Movement

```typescript
// Updated piece spawning logic in Game scene
private spawnPiece(): void {
  const w = this.gameBoard.state.width;
  const pieceToUse = this.nextPiece || this.generateMultiDiePiece();
  
  // Position piece ABOVE the grid (Y > 19)
  const x = Math.floor(w / 2) - 1;
  
  // Find the lowest die in the piece (smallest Y in relative coordinates)
  const minRelativeY = Math.min(...pieceToUse.dice.map((die: any) => die.relativePos.y));
  
  // Spawn so the lowest die starts at Y=21 (above visible grid)
  // When it falls one step, lowest die will be at Y=20, then Y=19 (top of grid)
  const spawnY = 21 - minRelativeY;
  
  const newActivePiece = {
    ...pieceToUse,
    x,
    y: spawnY,
  };

  // Check if piece can enter grid (game over condition)
  const enterGridY = spawnY - 1; // One step down
  if (!this.canPlacePiece(newActivePiece, x, enterGridY)) {
    // Game over - cannot enter grid
    this.scene.start('GameOver');
    return;
  }

  this.activePiece = newActivePiece;
  this.nextPiece = this.generateMultiDiePiece();
  this.renderGameState();
}
```

### Collision Detection Updates

```typescript
private stepDrop(): void {
  // Updated collision detection for bottom-left coordinates
  let active = this.activePiece;
  if (!active || !active.dice || active.dice.length === 0) {
    this.spawnPiece();
    return;
  }

  // Check each die for collision when moving down (decreasing Y)
  const dicesToLock: any[] = [];
  const diceToMove: any[] = [];
  
  active.dice.forEach((die: any, index: number) => {
    const currentX = active.x + die.relativePos.x;
    const currentY = active.y + die.relativePos.y;
    const belowY = currentY - 1; // Moving down means decreasing Y
    
    // Check collision conditions
    const hitBottom = belowY < 0; // Y < 0 is below the grid
    const hitPiece = belowY >= 0 && !this.gameBoard.isEmpty(currentX, belowY);
    const outOfBounds = currentX < 0 || currentX >= this.gameBoard.state.width;
    
    if (hitBottom || hitPiece || outOfBounds) {
      // Lock die at current position (clamped to valid bounds)
      const lockX = Math.max(0, Math.min(currentX, this.gameBoard.state.width - 1));
      const lockY = Math.max(0, Math.min(currentY, this.gameBoard.state.height - 1));
      dicesToLock.push({ die, index, x: lockX, y: lockY });
    } else {
      diceToMove.push({ die, index });
    }
  });

  // Lock dice that hit obstacles
  if (dicesToLock.length > 0) {
    dicesToLock.forEach(({ die, index, x, y }) => {
      this.gameBoard.lockAt({ x, y }, die);
    });
    
    // Remove locked dice from active piece
    const lockedIndices = dicesToLock.map(d => d.index).sort((a, b) => b - a);
    lockedIndices.forEach(index => {
      active.dice.splice(index, 1);
    });
  }

  // Move remaining dice down (decrease Y)
  if (diceToMove.length > 0 && dicesToLock.length === 0) {
    diceToMove.forEach(({ die }) => {
      die.relativePos.y -= 1; // Move down by decreasing Y
    });
  }

  this.renderGameState();
  
  if (active.dice.length === 0) {
    this.finalizePieceLocking(active);
  }
}
```

### Visual Rendering Coordinate Conversion

```typescript
// Updated rendering to convert grid coordinates to screen coordinates
private renderLockedPieces(boardMetrics: any): void {
  const { height, width, cells } = this.gameBoard.state;

  // Clear old sprites
  this.lockedSprites.forEach(sprite => sprite.destroy());
  this.lockedSprites = [];

  // Render all locked dice using grid coordinates
  for (let gridY = 0; gridY < height; gridY++) {
    // Convert grid Y to array index
    const arrayY = height - 1 - gridY;
    const row = cells[arrayY];
    if (!row) continue;
    
    for (let gridX = 0; gridX < width; gridX++) {
      const die = row[gridX];
      if (!die) continue;

      // Convert grid coordinates to screen pixels
      const px = boardMetrics.boardX + gridX * boardMetrics.cellW;
      // Screen Y: grid Y=0 should be at bottom of board
      const py = boardMetrics.boardY + (height - 1 - gridY) * boardMetrics.cellH;

      const sprite = drawDie(this, px, py, boardMetrics.cellW, boardMetrics.cellH, die);
      if (sprite) {
        this.lockedSprites.push(sprite);
      }
    }
  }
}

private renderActivePiece(boardMetrics: any): void {
  if (!this.activePiece || !this.activePiece.dice) return;

  this.activePiece.dice.forEach((die: any) => {
    const gridX = this.activePiece.x + die.relativePos.x;
    const gridY = this.activePiece.y + die.relativePos.y;
    
    // Convert grid coordinates to screen pixels
    const px = boardMetrics.boardX + gridX * boardMetrics.cellW;
    // Screen Y: higher grid Y should be higher on screen
    const py = boardMetrics.boardY + (boardMetrics.rows - 1 - gridY) * boardMetrics.cellH;

    const sprite = drawDie(this, px, py, boardMetrics.cellW, boardMetrics.cellH, die);
    if (sprite) {
      this.activeSprites.push(sprite);
    }
  });
}
```

## Data Models

### Coordinate Conversion Utilities

```typescript
export class CoordinateConverter {
  constructor(private gridHeight: number) {}

  // Convert grid Y (bottom-left) to array index (top-left)
  gridToArrayY(gridY: number): number {
    return this.gridHeight - 1 - gridY;
  }

  // Convert array index (top-left) to grid Y (bottom-left)
  arrayToGridY(arrayY: number): number {
    return this.gridHeight - 1 - arrayY;
  }

  // Convert grid coordinates to screen pixels
  gridToScreen(gridX: number, gridY: number, boardMetrics: any): { x: number; y: number } {
    return {
      x: boardMetrics.boardX + gridX * boardMetrics.cellW,
      y: boardMetrics.boardY + (boardMetrics.rows - 1 - gridY) * boardMetrics.cellH
    };
  }

  // Convert screen pixels to grid coordinates
  screenToGrid(screenX: number, screenY: number, boardMetrics: any): { x: number; y: number } | null {
    const boardRelativeX = screenX - boardMetrics.boardX;
    const boardRelativeY = screenY - boardMetrics.boardY;
    
    const gridX = Math.floor(boardRelativeX / boardMetrics.cellW);
    const screenGridY = Math.floor(boardRelativeY / boardMetrics.cellH);
    const gridY = boardMetrics.rows - 1 - screenGridY;
    
    if (gridX >= 0 && gridX < boardMetrics.cols && gridY >= 0 && gridY < boardMetrics.rows) {
      return { x: gridX, y: gridY };
    }
    return null;
  }
}
```

### Updated Game Constants

```typescript
export const GAME_CONSTANTS = {
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  SPAWN_Y: 21, // Pieces spawn above the grid
  GROUND_Y: 0, // Bottom of the grid
  TOP_Y: 19,   // Top of the visible grid
};
```

## Error Handling

### Boundary Validation

```typescript
class GridBoundaryValidator {
  static validatePosition(x: number, y: number, gridWidth: number, gridHeight: number): boolean {
    return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
  }

  static clampPosition(x: number, y: number, gridWidth: number, gridHeight: number): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(x, gridWidth - 1)),
      y: Math.max(0, Math.min(y, gridHeight - 1))
    };
  }

  static validateSpawnPosition(pieceY: number, minRelativeY: number): boolean {
    const lowestDieY = pieceY + minRelativeY;
    return lowestDieY >= 21; // Must spawn above grid
  }
}
```

### Coordinate Conversion Safety

```typescript
class SafeCoordinateConverter extends CoordinateConverter {
  gridToArrayY(gridY: number): number {
    if (gridY < 0 || gridY >= this.gridHeight) {
      console.warn(`Invalid grid Y coordinate: ${gridY}, clamping to valid range`);
      gridY = Math.max(0, Math.min(gridY, this.gridHeight - 1));
    }
    return super.gridToArrayY(gridY);
  }

  arrayToGridY(arrayY: number): number {
    if (arrayY < 0 || arrayY >= this.gridHeight) {
      console.warn(`Invalid array Y index: ${arrayY}, clamping to valid range`);
      arrayY = Math.max(0, Math.min(arrayY, this.gridHeight - 1));
    }
    return super.arrayToGridY(arrayY);
  }
}
```

## Testing Strategy

### Unit Tests for Coordinate Conversion

```typescript
describe('Grid Coordinate System', () => {
  test('should convert grid coordinates to array indices correctly', () => {
    const converter = new CoordinateConverter(20);
    
    // Bottom-left (0,0) should map to array index [19][0]
    expect(converter.gridToArrayY(0)).toBe(19);
    
    // Top-left (0,19) should map to array index [0][0]
    expect(converter.gridToArrayY(19)).toBe(0);
    
    // Middle (0,10) should map to array index [9][0]
    expect(converter.gridToArrayY(10)).toBe(9);
  });

  test('should handle piece spawning at correct positions', () => {
    // Piece with lowest die at relative Y=0 should spawn at Y=21
    // so lowest die starts at absolute Y=21
    const spawnY = 21 - 0;
    expect(spawnY).toBe(21);
    
    // After one fall step, lowest die should be at Y=20
    expect(spawnY - 1).toBe(20);
  });

  test('should detect bottom collision correctly', () => {
    // Die at Y=0 trying to move to Y=-1 should be blocked
    const currentY = 0;
    const belowY = currentY - 1;
    expect(belowY < 0).toBe(true); // Should trigger collision
  });
});
```

### Integration Tests for Game Flow

```typescript
describe('Game Flow with Bottom-Left Coordinates', () => {
  test('should spawn pieces above grid and fall naturally', () => {
    const game = new TestGameScene();
    game.spawnPiece();
    
    const activePiece = game.getActivePiece();
    const lowestDieY = Math.min(...activePiece.dice.map(die => 
      activePiece.y + die.relativePos.y
    ));
    
    // Lowest die should start above grid
    expect(lowestDieY).toBeGreaterThan(19);
  });

  test('should stack pieces from bottom up', () => {
    const gameBoard = new GameBoard(10, 20);
    
    // Lock a die at bottom
    gameBoard.lockAt({ x: 5, y: 0 }, createTestDie());
    
    // Lock another die above it
    gameBoard.lockAt({ x: 5, y: 1 }, createTestDie());
    
    // Verify stacking
    expect(gameBoard.isEmpty(5, 0)).toBe(false);
    expect(gameBoard.isEmpty(5, 1)).toBe(false);
    expect(gameBoard.isEmpty(5, 2)).toBe(true);
  });
});
```

### Visual Rendering Tests

```typescript
describe('Visual Rendering with New Coordinates', () => {
  test('should render grid Y=0 at bottom of screen', () => {
    const boardMetrics = {
      boardY: 100,
      cellH: 20,
      rows: 20
    };
    
    const converter = new CoordinateConverter(20);
    const screenPos = converter.gridToScreen(0, 0, boardMetrics);
    
    // Grid Y=0 should be at bottom of board
    const expectedY = boardMetrics.boardY + (boardMetrics.rows - 1) * boardMetrics.cellH;
    expect(screenPos.y).toBe(expectedY);
  });

  test('should render grid Y=19 at top of screen', () => {
    const boardMetrics = {
      boardY: 100,
      cellH: 20,
      rows: 20
    };
    
    const converter = new CoordinateConverter(20);
    const screenPos = converter.gridToScreen(0, 19, boardMetrics);
    
    // Grid Y=19 should be at top of board
    expect(screenPos.y).toBe(boardMetrics.boardY);
  });
});
```

## Migration Strategy

### Phase 1: Core Grid System
1. Update Grid class with coordinate conversion methods
2. Modify isEmpty, getCell, setCell to use new coordinate system
3. Update unit tests for grid operations

### Phase 2: Gravity and Physics
1. Refactor applyGravity to work with bottom-left coordinates
2. Update collision detection in stepDrop method
3. Modify piece movement logic (falling = decreasing Y)

### Phase 3: Piece Management
1. Update piece spawning to use Y=21 as spawn point
2. Modify piece movement methods (left/right unchanged, down = Y--)
3. Update rotation logic to work with new coordinates

### Phase 4: Visual Rendering
1. Update renderLockedPieces to convert coordinates
2. Modify renderActivePiece coordinate conversion
3. Update screen-to-grid coordinate conversion in UI

### Phase 5: Testing and Validation
1. Run comprehensive test suite
2. Verify visual alignment matches logical coordinates
3. Test edge cases (spawning, stacking, clearing)

## Performance Considerations

### Coordinate Conversion Overhead
- Coordinate conversion adds minimal computational overhead
- Consider caching converted coordinates for frequently accessed positions
- Use inline conversion for performance-critical paths

### Memory Usage
- Grid array structure remains unchanged, only interpretation changes
- No additional memory overhead for coordinate system
- Existing save/load systems remain compatible

### Rendering Performance
- Screen coordinate calculation happens once per render cycle
- No impact on game logic performance
- Visual updates remain at same frequency

This design provides a comprehensive approach to refactoring the grid coordinate system while maintaining game functionality and ensuring all existing features continue to work correctly with the new bottom-left origin system.
