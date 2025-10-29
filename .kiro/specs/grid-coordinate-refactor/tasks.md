# Implementation Plan

- [x] 1. Create coordinate conversion utilities and constants

  - Create CoordinateConverter class with grid-to-array and array-to-grid conversion methods
  - Add GridBoundaryValidator class for position validation and clamping
  - Define GAME_CONSTANTS with spawn positions and grid boundaries
  - Add comprehensive unit tests for coordinate conversion logic
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Refactor Grid class for bottom-left coordinate system

  - Add private coordinate conversion methods (gridToArrayY, arrayToGridY) to Grid class
  - Update isEmpty method to use coordinate conversion before accessing cells array
  - Modify getCell method to convert grid coordinates to array indices
  - Update setCell method to handle bottom-left coordinate system
  - Ensure addPieceAt and clearCells methods work with new coordinate system
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 3. Update gravity system for bottom-left coordinates

  - Refactor applyGravity function to compact cells toward Y=0 (bottom) instead of bottom array indices
  - Update applyIndividualGravity to move dice downward by decreasing Y coordinates
  - Modify gravity logic to read from bottom to top in grid coordinates (Y=0 to Y=19)
  - Ensure gravity writes to lower Y positions when compacting columns
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

-

- [x] 4. Refactor piece spawning system

  - Update spawnPiece method to position pieces above grid at Y=21
  - Calculate spawn Y position based on lowest die in piece (spawnY = 21 - minRelativeY)
  - Modify game over detection to check if pieces can enter grid from Y=21 to Y=20
  - Ensure spawned pieces have their lowest die starting above the visible grid
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 5. Update collision detection and piece movement

  - Refactor stepDrop method to check for collision when Y decreases (falling down)
  - Update collision conditions: hitBottom when belowY < 0, pieces stop at Y=0
  - Modify piece movement logic so falling pieces decrease Y coordinates
  - Update individual die collision detection to work with bottom-left system
  - Ensure pieces lock at correct positions when hitting bottom or other pieces
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Update piece movement controls

  - Modify movePiece method to handle downward movement as Y decrease
  - Update hardDrop method to find lowest valid Y position (decreasing Y)
  - Ensure left/right movement (X coordinates) remains unchanged
  - Update canPlacePiece validation to work with new coordinate system
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Refactor visual rendering system

  - Update renderLockedPieces to convert grid coordinates to screen pixels
  - Modify renderActivePiece to use coordinate conversion for sprite positioning
  - Update screen coordinate calculation: screenY = boardY + (height - 1 - gridY) \* cellH
  - Ensure grid Y=0 renders at bottom of screen and Y=19 at top
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Update UI coordinate conversion

  - Modify screenToGrid method in GameUI to convert screen touches to bottom-left coordinates
  - Update board touch handling to work with new coordinate system
  - Ensure grid lines and visual elements align with logical coordinate system
  - Update any debug displays or coordinate logging to use new system
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 9. Update match detection and clearing systems

  - Verify MatchDetector works correctly with coordinate conversion in Grid class
  - Ensure match clearing uses proper grid coordinates when calling clearCells
  - Update any position-based logic in size effects to work with bottom-left coordinates
  - Test cascade detection after gravity with new coordinate system
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 10. Update piece rotation system

  - Verify piece rotation works correctly with new coordinate system
  - Ensure rotated pieces maintain proper positioning relative to bottom-left origin
  - Update rotation collision detection to work with new coordinate system
  - Test piece rotation near boundaries with bottom-left coordinates
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 11. Create comprehensive test suite for coordinate system

  - Write unit tests for CoordinateConverter class methods
  - Create integration tests for piece spawning and falling behavior
  - Add tests for collision detection with bottom-left coordinates
  - Write visual rendering tests to verify screen coordinate conversion
  - Test edge cases: spawning, stacking, boundary conditions
  - _Requirements: 1.5, 2.5, 3.5, 4.5, 5.5, 6.5_

- [x] 12. Validate and debug coordinate system integration

  - Run full game session to verify all systems work together
  - Test piece spawning, falling, collision, and stacking behavior
  - Verify visual rendering matches logical coordinate system
  - Debug any coordinate misalignment issues
  - Ensure game over detection works correctly with new spawn positions
  - _Requirements: 1.5, 2.5, 3.5, 4.5, 5.5, 6.5_
