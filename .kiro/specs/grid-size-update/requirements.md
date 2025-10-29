# Requirements Document

## Introduction

This specification covers updating the Dicetrix game's grid dimensions from the current 10x20 configuration to an 8x16 configuration. This change affects all game logic, constants, UI layout calculations, piece spawning, collision detection, and visual rendering to accommodate the smaller grid size while maintaining proper game balance and visual presentation.

## Glossary

- **Grid_System**: The playing field coordinate management system, changing from 10x20 to 8x16
- **Grid_Width**: Horizontal dimension changing from 10 columns to 8 columns
- **Grid_Height**: Vertical dimension changing from 20 rows to 16 rows
- **Spawn_Position**: Starting location for new pieces, must be recalculated for 8x16 grid
- **UI_Layout**: Visual arrangement of game elements that must adapt to smaller grid
- **Collision_Detection**: System that validates piece positions within 8x16 boundaries
- **Coordinate_System**: Bottom-left origin system that must work with new dimensions
- **Game_Balance**: Gameplay mechanics that may need adjustment for smaller playing field
- **Visual_Rendering**: Screen display calculations for 8x16 grid presentation

## Requirements

### Requirement 1

**User Story:** As a developer, I want the grid system to use 8x16 dimensions instead of 10x20, so that the game has a more compact playing field.

#### Acceptance Criteria

1. WHEN the grid is initialized, THE Grid_System SHALL create an 8x16 playing field
2. WHEN accessing grid cells, THE Grid_System SHALL use coordinates where X ranges from 0-7 and Y ranges from 0-15
3. WHEN validating positions, THE Grid_System SHALL ensure coordinates stay within 8x16 bounds
4. WHEN pieces are placed, THE Grid_System SHALL enforce the new grid boundaries
5. WHEN the game starts, THE Grid_System SHALL display the correct 8x16 grid size

### Requirement 2

**User Story:** As a player, I want pieces to spawn correctly in the 8x16 grid, so that the game functions properly with the new dimensions.

#### Acceptance Criteria

1. WHEN a new piece spawns, THE Grid_System SHALL calculate spawn position for 8-column width
2. WHEN pieces spawn, THE Grid_System SHALL use Y=13 as the spawn position (above 16-row grid)
3. WHEN the spawn center is calculated, THE Grid_System SHALL use X=3 (center of 8 columns)
4. WHEN pieces reach the bottom, THE Grid_System SHALL stop them at Y=0 (bottom of 16-row grid)
5. WHEN the grid is full, THE Grid_System SHALL detect game over when pieces cannot spawn at Y=13

### Requirement 3

**User Story:** As a developer, I want all game constants to reflect the 8x16 dimensions, so that the entire system uses consistent values.

#### Acceptance Criteria

1. WHEN constants are defined, THE Grid_System SHALL set GRID_WIDTH to 8
2. WHEN constants are defined, THE Grid_System SHALL set GRID_HEIGHT to 16
3. WHEN spawn positions are calculated, THE Grid_System SHALL use TOP_Y as 15 (height - 1)
4. WHEN spawn center is defined, THE Grid_System SHALL set SPAWN_X_CENTER to 3 (width / 2 - 1)
5. WHEN coordinate validation occurs, THE Grid_System SHALL use MAX_VALID_Y as 15

### Requirement 4

**User Story:** As a player, I want the UI to properly display the 8x16 grid, so that the visual presentation matches the logical grid size.

#### Acceptance Criteria

1. WHEN the game board is rendered, THE Grid_System SHALL display 8 columns and 16 rows
2. WHEN calculating board metrics, THE Grid_System SHALL use 8x16 dimensions for layout
3. WHEN rendering pieces, THE Grid_System SHALL position sprites within 8x16 boundaries
4. WHEN showing the grid, THE Grid_System SHALL maintain proper aspect ratio for 8x16
5. WHEN updating the display, THE Grid_System SHALL ensure all visual elements fit the new grid size

### Requirement 5

**User Story:** As a developer, I want collision detection to work correctly with 8x16 boundaries, so that pieces interact properly with the smaller grid.

#### Acceptance Criteria

1. WHEN checking piece placement, THE Grid_System SHALL validate against 8-column width
2. WHEN detecting collisions, THE Grid_System SHALL use 16-row height for boundary checks
3. WHEN pieces move horizontally, THE Grid_System SHALL prevent movement beyond X=7
4. WHEN pieces fall, THE Grid_System SHALL stop them at the bottom of the 16-row grid
5. WHEN validating positions, THE Grid_System SHALL reject coordinates outside 8x16 bounds

### Requirement 6

**User Story:** As a player, I want the game mechanics to work seamlessly with the 8x16 grid, so that gameplay remains balanced and enjoyable.

#### Acceptance Criteria

1. WHEN pieces rotate, THE Grid_System SHALL ensure rotated pieces fit within 8x16 boundaries
2. WHEN matches are detected, THE Grid_System SHALL find adjacent dice correctly in 8x16 grid
3. WHEN gravity is applied, THE Grid_System SHALL move dice within 16-row height limits
4. WHEN clearing matches, THE Grid_System SHALL target correct positions in 8x16 grid
5. WHEN cascades occur, THE Grid_System SHALL handle chain reactions properly in smaller grid

### Requirement 7

**User Story:** As a developer, I want all tests to pass with the 8x16 configuration, so that the system is validated for the new grid size.

#### Acceptance Criteria

1. WHEN unit tests run, THE Grid_System SHALL pass all coordinate conversion tests for 8x16
2. WHEN boundary validation tests run, THE Grid_System SHALL correctly validate 8x16 limits
3. WHEN spawn position tests run, THE Grid_System SHALL verify correct calculations for 8-column grid
4. WHEN integration tests run, THE Grid_System SHALL demonstrate proper 8x16 gameplay
5. WHEN visual tests run, THE Grid_System SHALL confirm correct rendering of 8x16 grid
