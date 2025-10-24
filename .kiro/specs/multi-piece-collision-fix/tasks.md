# Implementation Plan

- [x] 1. Refactor stepDrop collision detection logic

  - Replace the current "all or nothing" collision approach with individual die collision checking
  - Create separate arrays for dicesToLock and diceToContinue to categorize dice based on collision status
  - Implement per-die collision detection that checks hitBottom, outOfBounds, and hitPiece conditions
  - Update collision logging to show which specific dice hit obstacles and which can continue falling
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 2. Implement selective die locking and removal

  - Modify the die locking logic to only lock dice that actually hit obstacles
  - Implement safe array modification by removing locked dice in reverse index order
  - Update the active piece dice array to only remove the dice that were locked
  - Add validation to ensure dice indices are valid before removal
  - _Requirements: 1.1, 1.2, 1.4, 3.2, 4.1_

- [x] 3. Fix piece movement logic for mixed collision scenarios

  - Update movement logic to handle three scenarios: no collisions, all collisions, and mixed collisions
  - Ensure that when some dice lock and others continue, the remaining dice stay in the active piece
  - Remove the buggy line that clears all dice from active piece when any collision occurs
  - Add proper handling for the case where some dice lock but others can continue falling
  - _Requirements: 1.3, 1.4, 4.3, 4.4_

- [x] 4. Enhance collision detection logging and debugging

  - Add detailed logging for each die's collision status during stepDrop processing
  - Include position information (current and attempted) in collision detection logs
  - Log the number of dice being locked vs continuing for each stepDrop call
  - Add validation logging to track active piece state changes
  - _Requirements: 3.1, 3.3, 5.4_

- [x] 5. Add boundary validation and error handling

  - Implement coordinate clamping for lock positions to ensure dice lock within valid grid bounds
  - Add validation for active piece state consistency after dice removal
  - Include error handling for edge cases like empty dice arrays or invalid indices
  - Add safety checks to prevent array modification errors during dice removal
  - _Requirements: 2.4, 2.5, 3.4, 4.2_

- [x] 6. Create unit tests for collision detection logic


  - Write tests for individual die collision detection with various obstacle scenarios
  - Test selective dice locking with multi-die pieces in different configurations
  - Create tests for safe array modification when removing locked dice
  - Add tests for mixed collision scenarios where some dice lock and others continue
  - _Requirements: 1.5, 3.5, 4.5_

- [ ] 7. Add integration tests for multi-piece game flow

  - Test complete game flow with L-shaped and T-shaped pieces hitting obstacles
  - Verify that remaining dice continue falling after partial locking occurs
  - Test edge cases like all dice locking simultaneously or no dice locking
  - Validate that piece finalization occurs correctly when all dice are eventually locked
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 8. Verify visual rendering consistency

  - Ensure that locked dice appear in locked sprites and falling dice appear in active sprites
  - Update renderGameState calls to reflect the new collision detection behavior
  - Validate that visual representation matches the logical game state after collision events
  - Test that no dice are rendered twice or disappear during collision processing
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 9. Test edge cases and validate fix completeness

  - Test single-die pieces to ensure they still work correctly with the new logic
  - Verify game over detection still works when pieces cannot spawn
  - Test pieces with dice at different heights to ensure independent collision detection
  - Validate that the fix works correctly with the bottom-left coordinate system
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10. Performance validation and cleanup

  - Verify that the collision detection changes don't impact game performance
  - Clean up any temporary logging or debug code added during implementation
  - Ensure memory usage remains consistent with no dice object leaks
  - Validate that the fix integrates properly with existing game systems
  - _Requirements: 3.4, 5.5_
