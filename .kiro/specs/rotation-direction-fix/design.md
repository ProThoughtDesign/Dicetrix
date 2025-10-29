# Design Document

## Overview

The rotation direction fix is a straightforward UI mapping correction that ensures the visual rotation icons match their actual rotation behavior. The issue stems from a mismatch between the UI control action names and the callback mappings in the Game scene. This design outlines the minimal changes needed to correct the rotation directions without affecting any other game functionality.

## Architecture

The rotation control system consists of three main components:

1. **UI Layer (GameUI.ts)**: Defines control buttons with visual symbols and action names
2. **Input Mapping Layer (Game.ts)**: Maps UI callbacks to game rotation functions  
3. **Rotation Logic Layer (Game.ts)**: Handles the actual piece rotation mathematics

The fix requires changes only to the Input Mapping Layer, specifically correcting the callback assignments.

## Components and Interfaces

### Current Implementation Analysis

**GameUI Control Definitions:**
```typescript
// Control button data: [row, col, symbol, action]
[0, 0, '↺', 'rotateLeft'],   // Counter-clockwise symbol
[0, 2, '↻', 'rotateRight'],  // Clockwise symbol
```

**Current Input Mapping (INCORRECT):**
```typescript
// In handleControlAction method
case 'rotateLeft':
  callbacks.onRotateCounterClockwise?.(); // ↺ symbol calls counter-clockwise
case 'rotateRight':
  callbacks.onRotateClockwise?.();        // ↻ symbol calls clockwise
```

**Game Callback Registration (INCORRECT):**
```typescript
onRotateClockwise: () => this.rotatePiece(1),     // direction 1 = clockwise
onRotateCounterClockwise: () => this.rotatePiece(-1), // direction -1 = counter-clockwise
```

### Root Cause Analysis

The issue is in the `handleControlAction` method in GameUI.ts. The action names ('rotateLeft'/'rotateRight') are being mapped to the wrong callback functions:

- 'rotateLeft' action (↺ counter-clockwise symbol) incorrectly calls `onRotateCounterClockwise`
- 'rotateRight' action (↻ clockwise symbol) incorrectly calls `onRotateClockwise`

This creates the backwards behavior where the visual symbols don't match the actual rotation.

## Data Models

No data model changes are required. The rotation system uses:

- `direction: number` (1 for clockwise, -1 for counter-clockwise)
- Visual symbols: '↺' (counter-clockwise), '↻' (clockwise)
- Action strings: 'rotateLeft', 'rotateRight'

## Error Handling

The fix is low-risk as it only changes callback mappings. Existing error handling in the rotation system will continue to work:

- Wall kick collision detection
- Boundary validation
- Invalid piece state handling

## Testing Strategy

### Manual Testing Approach

1. **Visual Verification**: Click each rotation button and verify the piece rotates in the direction indicated by the icon
2. **Consistency Check**: Ensure both rotation directions work correctly with wall kicks
3. **Keyboard Controls**: Verify keyboard rotation controls still work as expected
4. **Edge Cases**: Test rotation near boundaries and with collision scenarios

### Test Scenarios

1. **Basic Rotation Test**:
   - Spawn a non-symmetric piece (like L-shape)
   - Click clockwise button (↻) → piece should rotate clockwise
   - Click counter-clockwise button (↺) → piece should rotate counter-clockwise

2. **Wall Kick Test**:
   - Position piece near wall
   - Attempt rotation that would cause collision
   - Verify wall kick behavior works correctly in both directions

3. **Keyboard Consistency**:
   - Test keyboard rotation controls
   - Ensure they match the corrected button behavior

## Implementation Plan

### Solution Approach

The fix requires swapping the callback assignments in the `handleControlAction` method:

**Corrected Input Mapping:**
```typescript
case 'rotateLeft':
  callbacks.onRotateClockwise?.();        // ↺ symbol should call clockwise
case 'rotateRight':
  callbacks.onRotateCounterClockwise?.(); // ↻ symbol should call counter-clockwise
```

Wait - this analysis reveals the symbols themselves might be backwards! Let me reconsider:

- '↺' typically represents counter-clockwise rotation
- '↻' typically represents clockwise rotation

The current mapping has:
- 'rotateLeft' with '↺' symbol calling `onRotateCounterClockwise` ✓ (correct)
- 'rotateRight' with '↻' symbol calling `onRotateClockwise` ✓ (correct)

The issue must be in the Game.ts callback registration. Let me verify the actual rotation direction in the `rotatePiece` method.

### Actual Root Cause

After reviewing the rotation matrix logic:
```typescript
if (clockwise) {
  // 90° clockwise: (x,y) -> (-y, x)
  newX = -p.y;
  newY = p.x;
} else {
  // 90° counter-clockwise: (x,y) -> (y, -x)  
  newX = p.y;
  newY = -p.x;
}
```

The rotation mathematics are correct. The issue is likely in the callback registration in Game.ts where the direction parameter is backwards.

**Current (INCORRECT) Registration:**
```typescript
onRotateClockwise: () => this.rotatePiece(1),     // Should be clockwise
onRotateCounterClockwise: () => this.rotatePiece(-1), // Should be counter-clockwise
```

But if `direction > 0` means clockwise in `rotatePiece`, then the registration is correct. The issue must be in the `rotateMatrix` call:

```typescript
const rotatedPositions = this.rotateMatrix(currentPositions, direction > 0);
```

Here, `direction > 0` evaluates to `true` for clockwise, which should be correct.

### Final Analysis

The simplest fix is to swap the callback registrations in Game.ts:

**Corrected Registration:**
```typescript
onRotateClockwise: () => this.rotatePiece(-1),     // Swap: clockwise uses -1
onRotateCounterClockwise: () => this.rotatePiece(1), // Swap: counter-clockwise uses 1
```

This maintains all existing logic while fixing the direction mismatch.

## Alternative Solutions Considered

1. **Change UI symbols**: Swap the ↺ and ↻ symbols - rejected as it would confuse users familiar with standard rotation symbols
2. **Modify rotation matrix**: Change the mathematical rotation logic - rejected as it's more complex and error-prone
3. **Update action names**: Change 'rotateLeft'/'rotateRight' to match directions - rejected as it requires more changes

The callback registration swap is the minimal, safest change that fixes the user-facing issue.
