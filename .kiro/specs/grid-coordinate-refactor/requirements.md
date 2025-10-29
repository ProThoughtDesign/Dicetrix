# Requirements Document

## Introduction

This specification covers the refactoring of the Dicetrix game's grid coordinate system to use bottom-left origin (0,0) instead of the current top-left origin. This change affects all collision detection, piece positioning, gravity calculations, and visual rendering to align with a more intuitive coordinate system where Y increases upward and pieces stack from the bottom.

## Glossary

- **Grid_System**: The 10x20 playing field coordinate management system
- **Bottom_Left_Origin**: Coordinate system where (0,0) represents the bottom-left corner of the grid
- **Grid_Position**: X,Y coordinates where X ranges 0-9 and Y ranges 0-19
- **Collision_Detection**: System that determines when pieces cannot move further down
- **Gravity_System**: Mechanism that makes dice fall downward after clearing matches
- **Piece_Spawning**: Process of creating new pieces at the top of the grid (Y=21 for bottom piece)
- **Stack_Height**: The vertical accumulation of locked dice starting from Y=0
- **Visual_Rendering**: Translation between grid coordinates and screen pixel positions
- **Die_Locking**: Process of fixing individual dice to grid positions when they cannot fall further

## Requirements

### Requirement 1

**User Story:** As a developer, I want the grid system to use bottom-left origin coordinates, so that the coordinate system is more intuitive with Y increasing upward.

#### Acceptance Criteria

1. WHEN the grid is initialized, THE Grid_System SHALL treat position (0,0) as the bottom-left corner
2. WHEN accessing grid cells, THE Grid_System SHALL use coordinates where X ranges from 0-9 and Y ranges from 0-19
3. WHEN converting to screen coordinates, THE Grid_System SHALL map grid Y=0 to the bottom of the visual grid
4. WHEN pieces are placed, THE Grid_System SHALL position them using bottom-left as the reference point
5. WHEN validating positions, THE Grid_System SHALL ensure no negative Y coordinates are used

### Requirement 2

**User Story:** As a player, I want pieces to spawn at the top and fall naturally to the bottom, so that the game feels intuitive with gravity working downward.

#### Acceptance Criteria

1. WHEN a new piece spawns, THE Grid_System SHALL place the bottom-most die at grid Y=21 (above the visible grid)
2. WHEN pieces fall due to gravity, THE Grid_System SHALL decrease Y coordinates to move pieces downward
3. WHEN pieces reach the bottom, THE Grid_System SHALL stop them at Y=0 (the bottom row)
4. WHEN pieces stack, THE Grid_System SHALL place new pieces on top of existing ones with increasing Y values
5. WHEN the grid is full, THE Grid_System SHALL detect game over when pieces cannot spawn at Y=21

### Requirement 3

**User Story:** As a developer, I want collision detection to work correctly with bottom-left coordinates, so that pieces stop at the correct positions and stack properly.

#### Acceptance Criteria

1. WHEN checking downward movement, THE Grid_System SHALL prevent movement when Y would become negative
2. WHEN detecting piece-to-piece collision, THE Grid_System SHALL check if the target Y position is occupied
3. WHEN a die cannot move down, THE Grid_System SHALL lock it at its current Y position
4. WHEN multiple dice in a piece hit obstacles, THE Grid_System SHALL lock each die individually at its stopping point
5. WHEN all dice in a piece are locked, THE Grid_System SHALL generate the next piece

### Requirement 4

**User Story:** As a developer, I want gravity to work correctly with the new coordinate system, so that cleared dice fall naturally and create proper cascades.

#### Acceptance Criteria

1. WHEN dice are cleared from the grid, THE Grid_System SHALL apply gravity by moving remaining dice to lower Y positions
2. WHEN applying gravity, THE Grid_System SHALL move dice downward until they reach Y=0 or hit another die
3. WHEN gravity creates gaps, THE Grid_System SHALL ensure dice settle at the lowest possible Y position
4. WHEN cascading matches occur, THE Grid_System SHALL apply gravity after each clearing cycle
5. WHEN gravity is complete, THE Grid_System SHALL ensure no floating dice remain above empty spaces

### Requirement 5

**User Story:** As a player, I want the visual representation to match the logical grid system, so that what I see corresponds to the coordinate system being used.

#### Acceptance Criteria

1. WHEN rendering the grid, THE Grid_System SHALL display Y=0 at the bottom of the screen
2. WHEN drawing dice, THE Grid_System SHALL position sprites based on bottom-left grid coordinates
3. WHEN showing piece previews, THE Grid_System SHALL use the same coordinate conversion
4. WHEN displaying effects, THE Grid_System SHALL align visual effects with the grid coordinate system
5. WHEN updating the display, THE Grid_System SHALL maintain consistent coordinate mapping throughout the game

### Requirement 6

**User Story:** As a developer, I want all existing game mechanics to work seamlessly with the new coordinate system, so that no functionality is broken during the refactor.

#### Acceptance Criteria

1. WHEN pieces rotate, THE Grid_System SHALL maintain correct positioning relative to the bottom-left origin
2. WHEN detecting matches, THE Grid_System SHALL find adjacent dice correctly using the new coordinates
3. WHEN applying size effects, THE Grid_System SHALL target the correct grid positions
4. WHEN clearing areas, THE Grid_System SHALL calculate affected positions accurately
5. WHEN saving/loading game state, THE Grid_System SHALL preserve coordinate consistency
