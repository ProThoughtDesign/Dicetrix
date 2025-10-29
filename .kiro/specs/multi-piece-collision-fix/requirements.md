# Requirements Document

## Introduction

This specification addresses a critical bug in the Dicetrix game's multi-piece collision detection system. Currently, when a multi-die piece (tetromino) is falling and one die hits an obstacle, all remaining dice in the piece disappear instead of continuing to fall independently. This breaks the core game mechanic where individual dice should lock when they hit obstacles while other dice in the same piece continue falling until they also hit obstacles.

## Glossary

- **Multi_Piece**: A tetromino composed of multiple dice that fall together as a unit
- **Individual_Die_Collision**: Collision detection that checks each die in a piece separately
- **Selective_Locking**: The process of locking only the dice that hit obstacles while preserving others
- **Remaining_Dice**: Dice in a multi-piece that have not yet hit obstacles and should continue falling
- **Collision_Detection_System**: The system that determines when dice cannot move further
- **Active_Piece**: The currently falling multi-piece that the player controls
- **Die_Removal**: The process of removing specific dice from the active piece when they lock
- **Piece_Continuation**: The behavior where remaining dice continue falling after some dice lock

## Requirements

### Requirement 1

**User Story:** As a player, I want individual dice in a multi-piece to lock independently when they hit obstacles, so that the remaining dice continue falling naturally.

#### Acceptance Criteria

1. WHEN a multi-piece is falling and some dice hit obstacles, THE Collision_Detection_System SHALL lock only the dice that hit obstacles
2. WHEN dice are locked from a multi-piece, THE Collision_Detection_System SHALL remove only the locked dice from the Active_Piece
3. WHEN some dice are locked, THE Collision_Detection_System SHALL preserve the Remaining_Dice in the Active_Piece
4. WHEN Remaining_Dice exist after locking, THE Collision_Detection_System SHALL continue collision detection for those dice
5. WHEN all dice in a piece are eventually locked, THE Collision_Detection_System SHALL finalize the piece and spawn a new one

### Requirement 2

**User Story:** As a player, I want multi-piece collision detection to work correctly with the bottom-left coordinate system, so that dice lock at the proper positions.

#### Acceptance Criteria

1. WHEN checking collision for each die, THE Collision_Detection_System SHALL use bottom-left coordinates for position validation
2. WHEN a die hits the bottom boundary, THE Collision_Detection_System SHALL detect collision when Y would become less than 0
3. WHEN a die hits another piece, THE Collision_Detection_System SHALL detect collision using the grid's isEmpty method
4. WHEN locking a die, THE Collision_Detection_System SHALL clamp coordinates to valid grid boundaries
5. WHEN calculating lock positions, THE Collision_Detection_System SHALL use the die's current position, not the attempted new position

### Requirement 3

**User Story:** As a developer, I want the collision detection logic to be clear and maintainable, so that future modifications are easier to implement.

#### Acceptance Criteria

1. WHEN processing collision detection, THE Collision_Detection_System SHALL separate dice into "to lock" and "to continue" categories
2. WHEN removing locked dice, THE Collision_Detection_System SHALL remove dice by index in reverse order to maintain array integrity
3. WHEN logging collision events, THE Collision_Detection_System SHALL provide clear information about which dice are locked and which continue
4. WHEN updating the active piece, THE Collision_Detection_System SHALL only modify the dice array after all collision checks are complete
5. WHEN all operations are complete, THE Collision_Detection_System SHALL update the visual rendering to reflect the new state

### Requirement 4

**User Story:** As a player, I want the game to handle edge cases properly, so that the collision system works reliably in all scenarios.

#### Acceptance Criteria

1. WHEN a piece has only one die remaining, THE Collision_Detection_System SHALL handle it the same as multi-die pieces
2. WHEN all dice in a piece hit obstacles simultaneously, THE Collision_Detection_System SHALL lock all dice and finalize the piece
3. WHEN no dice hit obstacles, THE Collision_Detection_System SHALL move the entire piece down as a unit
4. WHEN dice are at different heights in a piece, THE Collision_Detection_System SHALL handle each die's collision independently
5. WHEN the active piece becomes empty after locking, THE Collision_Detection_System SHALL immediately finalize and spawn a new piece

### Requirement 5

**User Story:** As a player, I want the visual representation to accurately show which dice are locked and which are still falling, so that I can understand the game state.

#### Acceptance Criteria

1. WHEN dice are locked from a multi-piece, THE Collision_Detection_System SHALL immediately update the locked pieces rendering
2. WHEN dice continue falling, THE Collision_Detection_System SHALL update the active piece rendering to show only remaining dice
3. WHEN the game state changes, THE Collision_Detection_System SHALL call renderGameState to update all visual elements
4. WHEN logging collision events, THE Collision_Detection_System SHALL include position information for debugging
5. WHEN the collision detection completes, THE Collision_Detection_System SHALL ensure visual consistency between logical and rendered state
