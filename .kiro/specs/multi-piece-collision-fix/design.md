# Multi-Piece Collision Fix Design Document

## Overview

This design document outlines the fix for the critical bug in the Dicetrix game's multi-piece collision detection system. The current implementation incorrectly removes all dice from an active piece when any die hits an obstacle, causing the remaining dice to disappear. The fix involves modifying the collision detection logic to selectively lock only the dice that hit obstacles while preserving the remaining dice in the active piece.

The bug is located in the `stepDrop()` method of the Game scene, specifically in the collision handling logic that processes multi-die pieces (tetrominoes).

## Architecture

### Current Problematic Flow

```
1. stepDrop() called
2. Check if entire piece can move down
3. If any die hits obstacle:
   - Mark ALL dice for locking
   - Remove ALL dice from active piece (BUG!)
   - Remaining dice disappear
```

### Fixed Flow

```
1. stepDrop() called  
2. Check each die individually for collision
3. Separate dice into two categories:
   - dicesToLock: dice that hit obstacles
   - diceToContinue: dice that can still fall
4. Lock only the dice that hit obstacles
5. Remove only locked dice from active piece
6. Continue with remaining dice in active piece
```

### Key Components Affected

1. **Game.stepDrop()**: Main collision detection method that needs modification
2. **Active Piece Management**: How dice are removed from the active piece
3. **Visual Rendering**: Ensuring locked and falling dice are rendered correctly
4. **Piece Finalization**: Determining when a piece is completely locked

## Components and Interfaces

### Modified stepDrop() Method

```typescript
private stepDrop(): void {
  Logger.log('stepDrop() called');
  if (!this.gameBoard) {
    Logger.log('ERROR: No gameBoard found');
    return;
  }

  let active = this.activePiece;
  if (!active) {
    Logger.log('No active piece, spawning new one');
    this.spawnPiece();
    return;
  }

  // If no dice remain in the piece, it's already fully locked
  if (!active.dice || active.dice.length === 0) {
    Logger.log('No unlocked dice remaining - finalizing piece');
    this.finalizePieceLocking(active);
    return;
  }

  Logger.log(`Active piece at bottom-left coordinates (${active.x}, ${active.y}) with ${active.dice.length} unlocked dice`);

  // Check each die individually for collision
  const dicesToLock: Array<{die: any, index: number, x: number, y: number}> = [];
  const diceToContinue: Array<{die: any, index: number}> = [];
  
  active.dice.forEach((die: any, index: number) => {
    const currentX = active.x + die.relativePos.x;
    const currentY = active.y + die.relativePos.y;
    const belowY = currentY + GAME_CONSTANTS.FALL_STEP; // FALL_STEP is -1, so this decreases Y
    
    Logger.log(`Die ${index} at relative (${die.relativePos.x}, ${die.relativePos.y}): current absolute (${currentX}, ${currentY}), would move to (${currentX}, ${belowY})`);
    
    // Check collision conditions for bottom-left coordinate system
    const hitBottom = belowY < GAME_CONSTANTS.GROUND_Y; // Would go below Y=0
    const outOfBounds = currentX < 0 || currentX >= this.gameBoard.state.width;
    const hitPiece = belowY >= GAME_CONSTANTS.GROUND_Y && 
                     belowY <= GAME_CONSTANTS.MAX_VALID_Y && 
                     !this.gameBoard.isEmpty(currentX, belowY);
    
    Logger.log(`Die ${index} collision check: hitBottom=${hitBottom}, outOfBounds=${outOfBounds}, hitPiece=${hitPiece}`);
    
    if (hitBottom || outOfBounds || hitPiece) {
      // This die needs to be locked at its current position
      const lockX = Math.max(0, Math.min(currentX, this.gameBoard.state.width - 1));
      const lockY = Math.max(GAME_CONSTANTS.MIN_VALID_Y, Math.min(currentY, GAME_CONSTANTS.MAX_VALID_Y));
      
      Logger.log(`Die ${index} will be locked at bottom-left position (${lockX}, ${lockY})`);
      dicesToLock.push({ die, index, x: lockX, y: lockY });
    } else {
      // This die can continue falling
      Logger.log(`Die ${index} can continue falling`);
      diceToContinue.push({ die, index });
    }
  });

  // Process dice that hit obstacles
  if (dicesToLock.length > 0) {
    Logger.log(`Locking ${dicesToLock.length} dice that hit obstacles`);
    
    // Lock each die to the grid
    dicesToLock.forEach(({ die, index, x, y }) => {
      const lockResult = this.gameBoard.lockAt({ x, y }, die);
      Logger.log(`Locked die ${index} at bottom-left (${x}, ${y}): matches=${lockResult.matches.length}`);
    });
    
    // Remove locked dice from active piece (in reverse order to maintain indices)
    const lockedIndices = dicesToLock.map(d => d.index).sort((a, b) => b - a);
    lockedIndices.forEach(index => {
      Logger.log(`Removing locked die at index ${index} from active piece`);
      active.dice.splice(index, 1);
    });
    
    Logger.log(`Removed ${dicesToLock.length} locked dice, ${active.dice.length} dice remaining in active piece`);
  }

  // Process dice that can continue falling
  if (diceToContinue.length > 0 && dicesToLock.length === 0) {
    // If no dice were locked, move the entire piece down
    active.y += GAME_CONSTANTS.FALL_STEP; // FALL_STEP is -1, so this decreases Y (moves down)
    Logger.log(`Moved entire piece down to Y=${active.y}`);
  } else if (diceToContinue.length > 0 && dicesToLock.length > 0) {
    // Some dice locked, others continue - this is the key fix!
    // The remaining dice stay in the active piece and will be processed in the next stepDrop call
    Logger.log(`Mixed collision: ${dicesToLock.length} dice locked, ${diceToContinue.length} dice continue falling`);
  }

  // Update visuals to show current state
  this.renderGameState();
  
  // Check if piece is completely locked
  if (active.dice.length === 0) {
    Logger.log('All dice now locked - finalizing piece');
    this.finalizePieceLocking(active);
  } else {
    Logger.log(`Step complete - ${active.dice.length} dice still falling`);
  }
}
```

### Collision Detection Logic

The key improvement is in how we categorize dice:

```typescript
// OLD (BUGGY) APPROACH:
// Check if entire piece can move, if not, lock ALL dice

// NEW (FIXED) APPROACH:
const dicesToLock: Array<{die: any, index: number, x: number, y: number}> = [];
const diceToContinue: Array<{die: any, index: number}> = [];

active.dice.forEach((die: any, index: number) => {
  // Check each die individually
  if (hasCollision(die)) {
    dicesToLock.push({die, index, lockX, lockY});
  } else {
    diceToContinue.push({die, index});
  }
});
```

### Safe Array Modification

When removing locked dice from the active piece, we must remove them in reverse index order to avoid shifting indices:

```typescript
// Remove locked dice from active piece (in reverse order to maintain indices)
const lockedIndices = dicesToLock.map(d => d.index).sort((a, b) => b - a);
lockedIndices.forEach(index => {
  Logger.log(`Removing locked die at index ${index} from active piece`);
  active.dice.splice(index, 1);
});
```

### Movement Logic Update

The movement logic needs to handle three scenarios:

1. **No collisions**: Move entire piece down as a unit
2. **All collisions**: Lock all dice and finalize piece  
3. **Mixed collisions**: Lock some dice, keep others in active piece (KEY FIX)

```typescript
if (diceToContinue.length > 0 && dicesToLock.length === 0) {
  // Scenario 1: No collisions - move entire piece
  active.y += GAME_CONSTANTS.FALL_STEP;
} else if (diceToContinue.length > 0 && dicesToLock.length > 0) {
  // Scenario 3: Mixed - some lock, others continue (THIS WAS MISSING!)
  // Remaining dice stay in active piece for next stepDrop call
} 
// Scenario 2: All locked - handled by checking active.dice.length === 0
```

## Data Models

### Enhanced Collision Result Structure

```typescript
interface CollisionResult {
  die: any;
  index: number;
  hasCollision: boolean;
  lockPosition?: {x: number, y: number};
}

interface StepDropResult {
  dicesToLock: Array<{die: any, index: number, x: number, y: number}>;
  diceToContinue: Array<{die: any, index: number}>;
  pieceMovement: 'none' | 'down' | 'mixed';
}
```

### Active Piece State Management

```typescript
interface ActivePieceState {
  x: number;
  y: number;
  dice: Array<Die>;
  rotation: number;
  
  // Helper methods
  getRemainingDiceCount(): number;
  isCompletelyLocked(): boolean;
  removeDiceByIndices(indices: number[]): void;
}
```

## Error Handling

### Boundary Validation

```typescript
private validateLockPosition(x: number, y: number): {x: number, y: number} {
  return {
    x: Math.max(0, Math.min(x, this.gameBoard.state.width - 1)),
    y: Math.max(GAME_CONSTANTS.MIN_VALID_Y, Math.min(y, GAME_CONSTANTS.MAX_VALID_Y))
  };
}
```

### Array Modification Safety

```typescript
private safeRemoveDiceByIndices(activePiece: any, indices: number[]): void {
  // Sort indices in descending order to avoid index shifting issues
  const sortedIndices = [...indices].sort((a, b) => b - a);
  
  // Validate all indices are within bounds
  const maxIndex = activePiece.dice.length - 1;
  const validIndices = sortedIndices.filter(index => index >= 0 && index <= maxIndex);
  
  if (validIndices.length !== sortedIndices.length) {
    Logger.log(`WARNING: Some indices out of bounds. Valid: ${validIndices.length}, Total: ${sortedIndices.length}`);
  }
  
  // Remove dice in reverse order
  validIndices.forEach(index => {
    Logger.log(`Removing die at index ${index}`);
    activePiece.dice.splice(index, 1);
  });
}
```

### State Consistency Checks

```typescript
private validateActiveePieceState(activePiece: any): boolean {
  if (!activePiece) return false;
  if (!activePiece.dice || !Array.isArray(activePiece.dice)) return false;
  
  // Check for duplicate dice IDs
  const diceIds = activePiece.dice.map((die: any) => die.id);
  const uniqueIds = new Set(diceIds);
  if (diceIds.length !== uniqueIds.size) {
    Logger.log('ERROR: Duplicate dice IDs detected in active piece');
    return false;
  }
  
  return true;
}
```

## Testing Strategy

### Unit Tests for Collision Detection

```typescript
describe('Multi-Piece Collision Detection', () => {
  test('should lock only dice that hit obstacles', () => {
    const mockPiece = createMockMultiPiece([
      {x: 0, y: 1}, // Will hit bottom
      {x: 1, y: 2}, // Can continue falling
      {x: 2, y: 1}  // Will hit existing piece
    ]);
    
    const result = processCollisions(mockPiece, mockGameBoard);
    
    expect(result.dicesToLock).toHaveLength(2);
    expect(result.diceToContinue).toHaveLength(1);
  });

  test('should remove locked dice from active piece correctly', () => {
    const activePiece = createMockActivePiece(4); // 4 dice
    const indicesToRemove = [0, 2]; // Remove first and third dice
    
    safeRemoveDiceByIndices(activePiece, indicesToRemove);
    
    expect(activePiece.dice).toHaveLength(2);
    // Verify correct dice remain (originally at indices 1 and 3)
  });

  test('should handle all dice locking simultaneously', () => {
    const mockPiece = createMockMultiPiece([
      {x: 0, y: 0}, // All at bottom
      {x: 1, y: 0},
      {x: 2, y: 0}
    ]);
    
    const result = processCollisions(mockPiece, mockGameBoard);
    
    expect(result.dicesToLock).toHaveLength(3);
    expect(result.diceToContinue).toHaveLength(0);
  });
});
```

### Integration Tests for Game Flow

```typescript
describe('Multi-Piece Game Flow', () => {
  test('should continue game after partial piece locking', () => {
    const game = new TestGameScene();
    const multiPiece = createLShapePiece(); // L-shape with 3 dice
    
    game.setActivePiece(multiPiece);
    
    // Simulate bottom die hitting obstacle
    game.stepDrop(); // First die locks
    
    expect(game.getActivePiece().dice).toHaveLength(2); // 2 dice remain
    expect(game.getLockedDiceCount()).toBe(1); // 1 die locked
    
    // Continue dropping
    game.stepDrop(); // Second die locks
    
    expect(game.getActivePiece().dice).toHaveLength(1); // 1 die remains
    expect(game.getLockedDiceCount()).toBe(2); // 2 dice locked
    
    // Final drop
    game.stepDrop(); // Last die locks, piece finalizes
    
    expect(game.getActivePiece()).toBeDefined(); // New piece spawned
    expect(game.getLockedDiceCount()).toBe(3); // All 3 dice locked
  });
});
```

### Visual Rendering Tests

```typescript
describe('Visual Rendering During Collision', () => {
  test('should render locked and falling dice correctly', () => {
    const game = new TestGameScene();
    const multiPiece = createTestMultiPiece();
    
    game.setActivePiece(multiPiece);
    game.stepDrop(); // Partial locking occurs
    
    const renderState = game.captureRenderState();
    
    // Verify locked dice appear in locked sprites
    expect(renderState.lockedSprites.length).toBeGreaterThan(0);
    
    // Verify remaining dice appear in active sprites
    expect(renderState.activeSprites.length).toBe(game.getActivePiece().dice.length);
    
    // Verify no dice are rendered twice
    const totalRenderedDice = renderState.lockedSprites.length + renderState.activeSprites.length;
    expect(totalRenderedDice).toBe(multiPiece.dice.length);
  });
});
```

## Performance Considerations

### Collision Detection Optimization

- Individual die collision checks add minimal overhead compared to the existing piece-level checks
- The fix actually reduces unnecessary operations by avoiding premature piece finalization
- Array modification is optimized by removing elements in reverse order

### Memory Management

- No additional memory overhead - we're just changing the logic flow
- Proper cleanup of locked dice prevents memory leaks
- Visual sprite management remains unchanged

### Rendering Performance

- Rendering updates occur at the same frequency as before
- The fix ensures more accurate visual representation, potentially reducing visual glitches
- No impact on frame rate or rendering performance

## Migration Strategy

### Implementation Steps

1. **Backup Current Implementation**: Ensure we can rollback if needed
2. **Modify stepDrop() Method**: Implement the new collision detection logic
3. **Add Safety Validations**: Include boundary checks and array modification safety
4. **Update Logging**: Enhance logging for better debugging of collision events
5. **Test Edge Cases**: Verify behavior with single dice, all-collision, and no-collision scenarios

### Rollback Plan

If issues arise, the fix can be easily reverted by restoring the original stepDrop() method. The change is localized to a single method and doesn't affect the broader game architecture.

### Validation Criteria

- Multi-piece collision works correctly in all scenarios
- Visual rendering accurately reflects game state
- No performance degradation
- Existing single-die pieces continue to work
- Game over detection still functions properly

This design provides a comprehensive fix for the multi-piece collision bug while maintaining the existing game architecture and ensuring robust error handling and testing coverage.
