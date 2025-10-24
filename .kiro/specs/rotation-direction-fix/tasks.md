# Implementation Plan

- [ ] 1. Fix rotation direction mapping in Game.ts
  - Swap the direction parameters in the rotation callback registrations
  - Change `onRotateClockwise: () => this.rotatePiece(1)` to `onRotateClockwise: () => this.rotatePiece(-1)`
  - Change `onRotateCounterClockwise: () => this.rotatePiece(-1)` to `onRotateCounterClockwise: () => this.rotatePiece(1)`
  - Ensure the fix maintains all existing rotation functionality including wall kicks
  - _Requirements: 1.1, 1.4, 2.2_

- [ ] 1.1 Create manual test to verify rotation directions
  - Test clockwise rotation button (↻) produces clockwise piece rotation
  - Test counter-clockwise rotation button (↺) produces counter-clockwise piece rotation
  - Verify wall kick behavior works correctly in both directions
  - Test keyboard rotation controls for consistency
  - _Requirements: 1.1, 1.2, 1.3, 2.3_

- [ ] 2. Validate the fix with comprehensive testing
  - Test rotation with different piece shapes (L-shape, T-shape, line pieces)
  - Verify rotation behavior near grid boundaries
  - Confirm rotation works correctly during active gameplay
  - Ensure no regression in existing rotation collision detection
  - _Requirements: 1.5, 2.4, 2.5_
