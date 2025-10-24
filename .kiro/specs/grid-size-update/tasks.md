# Implementation Plan

- [x] 1. Update game constants for 8x16 grid dimensions


  - Update GRID_WIDTH from 10 to 8 in GameConstants.ts
  - Update GRID_HEIGHT from 20 to 16 in GameConstants.ts
  - Update TOP_Y from 19 to 15 (height - 1)
  - Update SPAWN_Y from 17 to 13 (above 16-row grid)
  - Update SPAWN_X_CENTER from 4 to 3 (width / 2 - 1)
  - Update MAX_VALID_Y from 19 to 15 (height - 1)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Update duplicate constants in game-modes.ts ✅ COMPLETED

  - ✅ Update GRID_WIDTH from 10 to 8 in game-modes.ts
  - ✅ Update GRID_HEIGHT from 20 to 16 in game-modes.ts
  - ✅ Ensure consistency between GameConstants.ts and game-modes.ts
  - _Requirements: 3.1, 3.2_

- [x] 3. Update Grid class constructor defaults ✅ COMPLETED

  - ✅ Change default width parameter from 10 to 8 in Grid.ts constructor
  - ✅ Change default height parameter from 20 to 16 in Grid.ts constructor
  - ✅ Verify coordinate converter initialization uses new height (16)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Update GameBoard class constructor defaults ✅ COMPLETED

  - ✅ Verify GameBoard constructor uses GAME_CONSTANTS for default dimensions
  - ✅ Ensure GameBoard creates 8x16 grid by default
  - ✅ Test that GameBoard.state returns correct 8x16 dimensions
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 5. Update collision detection and boundary validation ✅ COMPLETED

  - ✅ Verify GridBoundaryValidator works with 8x16 boundaries
  - ✅ Update collision detection in stepDrop method for 8-column width checks
  - ✅ Ensure pieces cannot move beyond X=7 (8th column boundary)
  - ✅ Verify bottom collision detection works with 16-row height
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Update spawn position calculations

  - Verify SPAWN_POSITIONS.calculateSpawnY works with new SPAWN_Y (13)
  - Test that pieces spawn at correct center position (X=3) for 8-column grid
  - Ensure spawned pieces fit within 8-column width boundaries
  - Verify game over detection works when pieces cannot enter 16-row grid
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 7. Update UI board metrics calculations

  - Modify calculateBoardMetrics to use 8x16 dimensions for layout calculations
  - Update cell size calculations to fit 8 columns and 16 rows in available space
  - Ensure board positioning centers the 8x16 grid properly on screen
  - Verify boardW and boardH calculations use correct grid dimensions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8. Update visual rendering for 8x16 grid

  - Verify renderLockedPieces iterates correctly over 8x16 grid (0-7 X, 0-15 Y)
  - Ensure renderActivePiece positions sprites within 8x16 boundaries
  - Update coordinate conversion to work with 16-row height in screen calculations
  - Test that all visual elements display correctly for 8x16 grid
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 9. Update match detection and game logic systems

  - Verify MatchDetector works correctly with 8x16 grid boundaries
  - Ensure gravity system applies correctly within 16-row height limits
  - Update cascade handling to work properly in 8x16 grid space
  - Test that piece rotation respects 8x16 boundaries
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Update all test files for 8x16 expectations

  - Update GameConstants.test.ts to expect GRID_WIDTH=8 and GRID_HEIGHT=16
  - Update GridBoundaryValidator.test.ts to use 8x16 dimensions in tests
  - Update CoordinateConverter.test.ts to use gridHeight=16
  - Modify any other test files that reference 10x20 dimensions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 11. Add comprehensive integration tests for 8x16 grid

  - Write tests for piece spawning in 8-column grid
  - Create tests for collision detection with 8x16 boundaries
  - Add tests for UI layout calculations with new grid dimensions
  - Write tests for complete game flow with 8x16 grid
  - _Requirements: 7.4, 7.5_

- [ ] 12. Validate and test complete 8x16 grid system
  - Run full game session to verify all systems work with 8x16 grid
  - Test piece spawning, movement, collision, and stacking in new dimensions
  - Verify visual rendering displays correct 8x16 grid layout
  - Ensure game balance and playability with smaller grid size
  - Test edge cases: boundary collisions, spawn failures, full grid scenarios
  - _Requirements: 1.5, 2.5, 4.5, 5.5, 6.5_
