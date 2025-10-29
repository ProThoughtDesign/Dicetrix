# Implementation Plan

- [x] 1. Create BackgroundBouncer utility class

  - Create new file `src/client/game/utils/BackgroundBouncer.ts` with logical point system
  - Implement bounding box calculation and collision detection logic
  - Add frame-rate independent movement calculations using delta time
  - Include proper TypeScript interfaces and type definitions
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 3.1, 3.2_

- [x] 2. Implement collision detection and bouncing logic

  - Add boundary collision detection for all four edges of bounding box
  - Implement velocity reversal when logical point hits boundaries
  - Add position clamping to prevent boundary penetration
  - Handle corner collision cases where both velocities reverse
  - _Requirements: 1.3, 2.5, 3.1_

- [x] 3. Add sprite positioning calculations

  - Implement method to calculate background sprite position from logical point
  - Offset sprite position by half width and half height as specified
  - Ensure sprite remains properly centered relative to logical point
  - _Requirements: 1.5, 2.3_

- [x] 4. Integrate BackgroundBouncer into Game scene

  - Replace physics sprite creation with regular Phaser sprite in `createBouncingBackground()`
  - Remove physics-related properties (setBounce, setCollideWorldBounds, setVelocity)
  - Initialize BackgroundBouncer with screen dimensions and 80% bounding box
  - Update sprite depth and visual properties to match existing behavior
  - _Requirements: 1.1, 1.2, 2.4, 3.4_

- [x] 5. Update Game scene update loop

  - Modify `update()` method to call BackgroundBouncer update with delta time
  - Update background sprite position based on BackgroundBouncer calculations

  - Remove physics system dependency for background movement
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6. Remove physics world setup for background

  - Remove or modify `setupPhysicsWorld()` method since background no longer needs physics
  - Clean up physics-related imports and dependencies if no longer needed
  - Update logging to reflect new non-physics approach
  - _Requirements: 2.4, 3.1, 3.2_

- [x] 7. Update cleanup and resource management


  - Modify `shutdown()` method to properly destroy BackgroundBouncer instance
  - Ensure background sprite cleanup works with regular sprite instead of physics sprite
  - Update error handling for new system
  - _Requirements: 3.3, 3.4_

- [ ]\* 8. Add logging and debugging support
  - Add debug logging for logical point position and velocity
  - Include bounding box information in initialization logs
  - Add collision detection logging for troubleshooting
  - _Requirements: 3.3_
