# Grid Size Update Design Document

## Overview

This design document outlines the process of updating the Dicetrix game's grid dimensions from 10x20 to 8x16. This change affects multiple system components including game constants, UI layout calculations, piece spawning logic, collision detection, and visual rendering. The update maintains the existing bottom-left coordinate system while adapting all calculations to work with the smaller grid dimensions.

The change reduces the playing field by 20% horizontally (10→8 columns) and 20% vertically (20→16 rows), creating a more compact game experience while preserving all existing gameplay mechanics.

## Architecture

### Current System Analysis

The current 10x20 grid system consists of:

1. **Game Constants**: Define GRID_WIDTH=10, GRID_HEIGHT=20, and derived values
2. **Grid Class**: Manages 2D array with 20 rows × 10 columns
3. **Coordinate System**: Bottom-left origin with Y=0 at bottom, Y=19 at top
4. **Spawn Logic**: Centers pieces at X=4, spawns at Y=17
5. **UI Layout**: Calculates board metrics based on 10×20 dimensions
6. **Collision Detection**: Validates positions against 10×20 boundaries

### New System Architecture

```
Current 10x20 Grid:              New 8x16 Grid:
┌─────────────────────────┐      ┌───────────────────┐
│ (0,19) (1,19) ...(9,19) │      │ (0,15) (1,15) ... │ (7,15)
│ (0,18) (1,18) ...(9,18) │      │ (0,14) (1,14) ... │ (7,14)
│  ...    ...   ...  ...  │  →   │  ...    ...   ... │  ...
│ (0,1)  (1,1)  ... (9,1) │      │ (0,1)  (1,1)  ... │ (7,1)
│ (0,0)  (1,0)  ... (9,0) │      │ (0,0)  (1,0)  ... │ (7,0)
└─────────────────────────┘      └───────────────────┘
    10 columns × 20 rows            8 columns × 16 rows
```

### Coordinate System Mapping

```
Dimension Changes:
- Width: 10 → 8 columns (X range: 0-9 → 0-7)
- Height: 20 → 16 rows (Y range: 0-19 → 0-15)
- Center X: 4 → 3 (Math.floor(width/2) - 1)
- Top Y: 19 → 15 (height - 1)
- Spawn Y: 17 → 13 (above visible grid)
```

## Components and Interfaces

### Updated Game Constants

```typescript
export const GAME_CONSTANTS = {
  // Grid dimensions - UPDATED
  GRID_WIDTH: 8,      // Changed from 10
  GRID_HEIGHT: 16,    // Changed from 20
  
  // Coordinate system boundaries - UPDATED
  GROUND_Y: 0,        // Unchanged (bottom of grid)
  TOP_Y: 15,          // Changed from 19 (height - 1)
  SPAWN_Y: 13,        // Changed from 17 (above 16-row grid)
  
  // Spawn positions - UPDATED
  SPAWN_X_CENTER: 3,  // Changed from 4 (width / 2 - 1)
  
  // Movement constants - UNCHANGED
  FALL_STEP: -1,      // Y change when falling
  RISE_STEP: 1,       // Y change when moving up
  
  // Collision detection - UPDATED
  MIN_VALID_Y: 0,     // Unchanged
  MAX_VALID_Y: 15,    // Changed from 19 (height - 1)
  
  // Visual rendering - UNCHANGED
  SCREEN_ORIGIN_BOTTOM: true,
} as const;
```

### Updated Spawn Position Calculations

```typescript
export const SPAWN_POSITIONS = {
  /**
   * Calculate spawn Y position for 8x16 grid
   * Pieces spawn at Y=13 so lowest die starts above visible grid
   */
  calculateSpawnY: (minRelativeY: number): number => {
    return GAME_CONSTANTS.SPAWN_Y - minRelativeY; // 13 - minRelativeY
  },
  
  /**
   * Get default spawn position for 8x16 grid
   */
  getDefaultSpawn: (): { x: number; y: number } => ({
    x: GAME_CONSTANTS.SPAWN_X_CENTER, // X = 3 (center of 8 columns)
    y: GAME_CONSTANTS.SPAWN_Y         // Y = 13 (above 16 rows)
  }),
} as const;
```

### Grid Class Updates

```typescript
export class Grid {
  state: GridState;
  private coordinateConverter: CoordinateConverter;

  constructor(width = GAME_CONSTANTS.GRID_WIDTH, height = GAME_CONSTANTS.GRID_HEIGHT) {
    // Grid structure: 16 rows × 8 columns
    const cells: Cell[][] = [];
    for (let y = 0; y < height; y++) { // 0 to 15
      const row: Cell[] = new Array(width).fill(null); // 8 columns
      cells.push(row);
    }
    this.state = { width, height, cells };
    this.coordinateConverter = new CoordinateConverter(height); // height = 16
  }

  isValidPosition(x: number, y: number): boolean {
    // Validate against 8x16 boundaries
    return x >= 0 && x < this.state.width && y >= 0 && y < this.state.height;
    // x: 0-7, y: 0-15
  }

  // Coordinate conversion methods remain the same but work with height=16
  private gridToArrayY(gridY: number): number {
    return this.state.height - 1 - gridY; // 15 - gridY
  }

  private arrayToGridY(arrayY: number): number {
    return this.state.height - 1 - arrayY; // 15 - arrayY
  }
}
```

### GameBoard Constructor Update

```typescript
export default class GameBoard {
  private grid: Grid;

  constructor(
    width = GAME_CONSTANTS.GRID_WIDTH,    // Default: 8
    height = GAME_CONSTANTS.GRID_HEIGHT   // Default: 16
  ) {
    this.grid = new Grid(width, height);
  }

  get state(): GridState {
    return this.grid.state; // Returns 8x16 grid state
  }
}
```

### Coordinate Converter Updates

```typescript
export class CoordinateConverter {
  constructor(private gridHeight: number) {} // gridHeight = 16

  gridToArrayY(gridY: number): number {
    return this.gridHeight - 1 - gridY; // 15 - gridY
  }

  arrayToGridY(arrayY: number): number {
    return this.gridHeight - 1 - arrayY; // 15 - arrayY
  }

  gridToScreen(gridX: number, gridY: number, boardMetrics: any): { x: number; y: number } {
    return {
      x: boardMetrics.boardX + gridX * boardMetrics.cellW,
      // Screen Y calculation for 16-row grid
      y: boardMetrics.boardY + (boardMetrics.rows - 1 - gridY) * boardMetrics.cellH
    };
  }
}
```

### Spawn Logic Updates

```typescript
private spawnPiece(): void {
  const w = this.gameBoard.state.width; // w = 8
  const pieceToUse = this.nextPiece || this.generateMultiDiePiece();
  
  // Center position for 8-column grid
  const x = GAME_CONSTANTS.SPAWN_X_CENTER; // x = 3
  
  // Find lowest die in piece
  const minRelativeY = Math.min(...pieceToUse.dice.map((die: any) => die.relativePos.y));
  
  // Spawn above 16-row grid: Y=13 for bottom piece
  const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY); // 13 - minRelativeY
  
  const newActivePiece = {
    ...pieceToUse,
    x, // x = 3
    y: spawnY, // y = 13 - minRelativeY
  };

  // Test if piece can enter 16-row grid
  const enterGridY = spawnY - 1; // Move down one step
  if (!this.canPlacePiece(newActivePiece, x, enterGridY)) {
    // Game over - cannot enter 8x16 grid
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
  // Process each die for collision in 8x16 grid
  active.dice.forEach((die: any, index: number) => {
    const currentX = active.x + die.relativePos.x;
    const currentY = active.y + die.relativePos.y;
    const belowY = currentY - 1; // Moving down
    
    // Collision checks for 8x16 grid
    const hitBottom = belowY < GAME_CONSTANTS.GROUND_Y; // belowY < 0
    const hitPiece = belowY >= 0 && !this.gameBoard.isEmpty(currentX, belowY);
    const outOfBounds = currentX < 0 || currentX >= GAME_CONSTANTS.GRID_WIDTH; // currentX >= 8
    
    if (hitBottom || hitPiece || outOfBounds) {
      // Lock die within 8x16 boundaries
      const lockX = Math.max(0, Math.min(currentX, GAME_CONSTANTS.GRID_WIDTH - 1)); // 0-7
      const lockY = Math.max(0, Math.min(currentY, GAME_CONSTANTS.GRID_HEIGHT - 1)); // 0-15
      dicesToLock.push({ die, index, x: lockX, y: lockY });
    } else {
      diceToMove.push({ die, index });
    }
  });
}
```

### UI Layout Calculations

```typescript
// Board metrics calculation for 8x16 grid
private calculateBoardMetrics(): BoardMetrics {
  const { leftColumnWidth, screenHeight, padding } = this.layout;
  
  // Available space for 8x16 grid
  const availableWidth = leftColumnWidth - padding * 2;
  const availableHeight = screenHeight - headerHeight - padding * 3;
  
  // Calculate cell size to fit 8x16 grid
  const cellWByWidth = Math.floor(availableWidth / GAME_CONSTANTS.GRID_WIDTH); // / 8
  const cellHByHeight = Math.floor(availableHeight / GAME_CONSTANTS.GRID_HEIGHT); // / 16
  
  // Use smaller dimension to ensure grid fits
  const cellSize = Math.min(cellWByWidth, cellHByHeight);
  
  return {
    cellW: cellSize,
    cellH: cellSize,
    boardW: cellSize * GAME_CONSTANTS.GRID_WIDTH,  // * 8
    boardH: cellSize * GAME_CONSTANTS.GRID_HEIGHT, // * 16
    cols: GAME_CONSTANTS.GRID_WIDTH,  // 8
    rows: GAME_CONSTANTS.GRID_HEIGHT, // 16
    boardX: padding + Math.floor((availableWidth - cellSize * 8) / 2),
    boardY: headerHeight + padding + Math.floor((availableHeight - cellSize * 16) / 2),
  };
}
```

### Visual Rendering Updates

```typescript
private renderLockedPieces(boardMetrics: any): void {
  const { height, width, cells } = this.gameBoard.state; // height=16, width=8

  // Render all locked dice in 8x16 grid
  for (let gridY = 0; gridY < height; gridY++) { // 0 to 15
    const arrayY = this.coordinateConverter.gridToArrayY(gridY); // 15-gridY
    const row = cells[arrayY];
    if (!row) continue;
    
    for (let gridX = 0; gridX < width; gridX++) { // 0 to 7
      const die = row[gridX];
      if (!die) continue;

      // Convert 8x16 grid coordinates to screen pixels
      const screenPos = this.coordinateConverter.gridToScreen(gridX, gridY, boardMetrics);
      
      const sprite = drawDie(
        this,
        screenPos.x,
        screenPos.y,
        boardMetrics.cellW,
        boardMetrics.cellH,
        die
      );
      
      if (sprite) {
        this.lockedSprites.push(sprite);
      }
    }
  }
}
```

## Data Models

### Updated Grid State Interface

```typescript
interface GridState {
  width: number;   // 8 columns
  height: number;  // 16 rows
  cells: Cell[][]; // 16 arrays of 8 cells each
}

interface BoardMetrics {
  cellW: number;
  cellH: number;
  boardW: number;  // cellW * 8
  boardH: number;  // cellH * 16
  boardX: number;
  boardY: number;
  cols: number;    // 8
  rows: number;    // 16
}
```

### Boundary Validation Updates

```typescript
class GridBoundaryValidator {
  static validatePosition(x: number, y: number): boolean {
    return x >= 0 && x < GAME_CONSTANTS.GRID_WIDTH &&  // x < 8
           y >= 0 && y < GAME_CONSTANTS.GRID_HEIGHT;    // y < 16
  }

  static clampPosition(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(x, GAME_CONSTANTS.GRID_WIDTH - 1)),  // 0-7
      y: Math.max(0, Math.min(y, GAME_CONSTANTS.GRID_HEIGHT - 1))  // 0-15
    };
  }

  static validateSpawnPosition(pieceY: number, minRelativeY: number): boolean {
    const lowestDieY = pieceY + minRelativeY;
    return lowestDieY >= GAME_CONSTANTS.SPAWN_Y; // >= 13
  }
}
```

## Error Handling

### Boundary Validation for 8x16 Grid

```typescript
class SafeGridOperations {
  static validateGridAccess(x: number, y: number): boolean {
    if (x < 0 || x >= GAME_CONSTANTS.GRID_WIDTH) {
      console.warn(`Invalid grid X coordinate: ${x}, must be 0-7`);
      return false;
    }
    if (y < 0 || y >= GAME_CONSTANTS.GRID_HEIGHT) {
      console.warn(`Invalid grid Y coordinate: ${y}, must be 0-15`);
      return false;
    }
    return true;
  }

  static clampToGrid(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(x, 7)), // Clamp to 0-7
      y: Math.max(0, Math.min(y, 15)) // Clamp to 0-15
    };
  }
}
```

### Spawn Position Validation

```typescript
class SpawnValidator {
  static validateSpawnBounds(x: number, y: number, piece: any): boolean {
    // Check if all dice in piece fit within 8x16 grid when spawned
    for (const die of piece.dice) {
      const absX = x + die.relativePos.x;
      const absY = y + die.relativePos.y;
      
      if (absX < 0 || absX >= GAME_CONSTANTS.GRID_WIDTH) {
        console.warn(`Piece extends outside 8-column grid at X=${absX}`);
        return false;
      }
      
      if (absY < 0) {
        console.warn(`Piece extends below grid at Y=${absY}`);
        return false;
      }
    }
    return true;
  }
}
```

## Testing Strategy

### Unit Tests for 8x16 Grid

```typescript
describe('8x16 Grid System', () => {
  test('should create 8x16 grid correctly', () => {
    const grid = new Grid();
    expect(grid.state.width).toBe(8);
    expect(grid.state.height).toBe(16);
    expect(grid.state.cells.length).toBe(16); // 16 rows
    expect(grid.state.cells[0].length).toBe(8); // 8 columns
  });

  test('should validate 8x16 boundaries correctly', () => {
    const grid = new Grid();
    
    // Valid positions
    expect(grid.isValidPosition(0, 0)).toBe(true);   // Bottom-left
    expect(grid.isValidPosition(7, 15)).toBe(true);  // Top-right
    expect(grid.isValidPosition(3, 8)).toBe(true);   // Center
    
    // Invalid positions
    expect(grid.isValidPosition(8, 0)).toBe(false);  // X too high
    expect(grid.isValidPosition(0, 16)).toBe(false); // Y too high
    expect(grid.isValidPosition(-1, 0)).toBe(false); // X too low
    expect(grid.isValidPosition(0, -1)).toBe(false); // Y too low
  });

  test('should calculate spawn positions for 8-column grid', () => {
    expect(GAME_CONSTANTS.SPAWN_X_CENTER).toBe(3);
    expect(GAME_CONSTANTS.GRID_WIDTH).toBe(8);
    expect(GAME_CONSTANTS.GRID_HEIGHT).toBe(16);
    expect(GAME_CONSTANTS.TOP_Y).toBe(15);
    expect(GAME_CONSTANTS.SPAWN_Y).toBe(13);
  });
});
```

### Integration Tests for Game Flow

```typescript
describe('8x16 Game Flow', () => {
  test('should spawn pieces correctly in 8x16 grid', () => {
    const game = new TestGameScene();
    game.spawnPiece();
    
    const activePiece = game.getActivePiece();
    expect(activePiece.x).toBe(3); // Center of 8 columns
    
    // Check that all dice fit within 8-column width
    activePiece.dice.forEach(die => {
      const absX = activePiece.x + die.relativePos.x;
      expect(absX).toBeGreaterThanOrEqual(0);
      expect(absX).toBeLessThan(8);
    });
  });

  test('should handle collision detection in 8x16 boundaries', () => {
    const gameBoard = new GameBoard();
    
    // Test boundary collisions
    expect(gameBoard.isEmpty(7, 0)).toBe(true);  // Right edge valid
    expect(gameBoard.isEmpty(8, 0)).toBe(false); // Beyond right edge
    expect(gameBoard.isEmpty(0, 15)).toBe(true); // Top edge valid
    expect(gameBoard.isEmpty(0, 16)).toBe(false); // Beyond top edge
  });
});
```

### Visual Rendering Tests

```typescript
describe('8x16 Visual Rendering', () => {
  test('should calculate board metrics for 8x16 grid', () => {
    const ui = new TestGameUI();
    const metrics = ui.calculateBoardMetrics();
    
    expect(metrics.cols).toBe(8);
    expect(metrics.rows).toBe(16);
    expect(metrics.boardW).toBe(metrics.cellW * 8);
    expect(metrics.boardH).toBe(metrics.cellH * 16);
  });

  test('should render all positions in 8x16 grid', () => {
    const converter = new CoordinateConverter(16);
    
    // Test corner positions
    const bottomLeft = converter.gridToScreen(0, 0, mockBoardMetrics);
    const topRight = converter.gridToScreen(7, 15, mockBoardMetrics);
    
    expect(bottomLeft.x).toBeDefined();
    expect(bottomLeft.y).toBeDefined();
    expect(topRight.x).toBeDefined();
    expect(topRight.y).toBeDefined();
  });
});
```

## Migration Strategy

### Phase 1: Update Constants and Core Classes
1. Update GAME_CONSTANTS to use 8x16 dimensions
2. Verify Grid class works with new dimensions
3. Update GameBoard constructor defaults
4. Run unit tests for core grid operations

### Phase 2: Update Spawn and Movement Logic
1. Update spawn position calculations for 8-column grid
2. Modify collision detection for 8x16 boundaries
3. Update piece movement validation
4. Test piece spawning and basic movement

### Phase 3: Update UI and Rendering
1. Update board metrics calculations for 8x16 display
2. Modify visual rendering for new grid size
3. Update coordinate conversion for screen positioning
4. Test visual alignment and grid display

### Phase 4: Update Game Logic Systems
1. Update match detection for 8x16 grid
2. Modify gravity system for 16-row height
3. Update cascade handling for new dimensions
4. Test complete game flow with 8x16 grid

### Phase 5: Update Tests and Validation
1. Update all test files to use 8x16 expectations
2. Add new boundary validation tests
3. Update integration tests for new grid size
4. Perform comprehensive testing of all systems

## Performance Considerations

### Memory Usage Reduction
- Grid array size reduces from 200 cells (10×20) to 128 cells (8×16)
- 36% reduction in memory usage for grid storage
- Faster iteration over grid cells due to smaller size

### Rendering Performance
- Fewer sprites to render (128 vs 200 maximum locked pieces)
- Smaller screen area needed for grid display
- Improved performance on mobile devices with limited screen space

### Gameplay Balance
- Smaller playing field may require adjustment to piece generation frequency
- Consider if piece complexity should be reduced for 8x16 grid
- Monitor game difficulty with reduced playing space

This design provides a comprehensive approach to updating the grid size while maintaining all existing functionality and ensuring the game works correctly with the new 8x16 dimensions.
