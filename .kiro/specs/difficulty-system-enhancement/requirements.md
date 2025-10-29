# Difficulty System Enhancement Requirements

## Introduction

This specification defines a comprehensive enhancement to Dicetrix's difficulty system, introducing dimensional constraints for piece generation, booster mechanics, Black Die functionality, and refined difficulty progression. The system will replace the current hardcoded piece types with a flexible dimensional constraint system that allows for procedural piece generation while maintaining balanced gameplay across five distinct difficulty modes.

## Glossary

- **Dicetrix_System**: The main game engine managing piece generation, scoring, and difficulty mechanics
- **Dimensional_Constraints**: Width, height, and dice count limits that define maximum piece complexity per difficulty
- **Black_Die**: Special wild dice that match any number and trigger area conversion effects when matched
- **Booster_Chance**: Probability percentage for dice to receive visual glow effects representing special properties
- **Flood_Fill_Algorithm**: Connectivity validation system ensuring all generated pieces form connected shapes
- **Uniform_Dice_Rule**: Zen mode constraint where all dice in a piece have identical face counts
- **Area_Conversion_Effect**: Black Die ability to transform surrounding dice in a 3×3 grid to d20 dice with rerolled numbers

## Requirements

### Requirement 1: Dimensional Constraint System

**User Story:** As a player, I want piece complexity to scale appropriately with difficulty mode, so that I experience progressive challenge without overwhelming complexity jumps.

#### Acceptance Criteria

1. WHEN Easy mode is selected, THE Dicetrix_System SHALL generate pieces within 3×3×5 dimensional constraints
2. WHEN Medium mode is selected, THE Dicetrix_System SHALL generate pieces within 4×4×8 dimensional constraints  
3. WHEN Hard mode is selected, THE Dicetrix_System SHALL generate pieces within 5×5×10 dimensional constraints
4. WHEN Expert mode is selected, THE Dicetrix_System SHALL generate pieces within 5×5×16 dimensional constraints
5. WHEN Zen mode is selected, THE Dicetrix_System SHALL generate pieces within 3×3×5 dimensional constraints

### Requirement 2: Dice Type Distribution by Difficulty

**User Story:** As a player, I want dice complexity to match the difficulty level, so that matching becomes progressively more challenging and strategic.

#### Acceptance Criteria

1. WHEN Easy mode is active, THE Dicetrix_System SHALL generate dice using only d4, d6, and d8 types
2. WHEN Medium mode is active, THE Dicetrix_System SHALL generate dice using only d6, d8, d10, and d12 types
3. WHEN Hard mode is active, THE Dicetrix_System SHALL generate dice using d8, d10, d12, d20, and Black_Die types
4. WHEN Expert mode is active, THE Dicetrix_System SHALL generate dice using d10, d12, d20, and Black_Die types
5. WHEN Zen mode is active, THE Dicetrix_System SHALL generate dice using only d4, d6, and d8 types

### Requirement 3: Booster Chance Scaling

**User Story:** As a player, I want visual booster effects to be more frequent in easier modes, so that I have more assistance when learning and less when mastering the game.

#### Acceptance Criteria

1. WHEN Easy mode is active, THE Dicetrix_System SHALL apply booster effects to 50% of generated dice
2. WHEN Medium mode is active, THE Dicetrix_System SHALL apply booster effects to 35% of generated dice
3. WHEN Hard mode is active, THE Dicetrix_System SHALL apply booster effects to 25% of generated dice
4. WHEN Expert mode is active, THE Dicetrix_System SHALL apply booster effects to 15% of generated dice
5. WHEN Zen mode is active, THE Dicetrix_System SHALL apply booster effects to 50% of generated dice

### Requirement 4: Black Die Mechanics

**User Story:** As a player, I want Black Dice to provide powerful wild matching and transformation effects, so that I have strategic high-risk high-reward gameplay elements in advanced modes.

#### Acceptance Criteria

1. WHEN a Black_Die is generated, THE Dicetrix_System SHALL treat it as wild for number matching purposes
2. WHEN Black_Die participate in matches, THE Dicetrix_System SHALL match them with any adjacent dice numbers
3. WHEN a match containing Black_Die is cleared, THE Dicetrix_System SHALL trigger Area_Conversion_Effect on a 3×3 grid centered on each Black_Die position
4. WHEN Area_Conversion_Effect triggers, THE Dicetrix_System SHALL convert all dice within the 3×3 area to d20 type
5. WHEN Area_Conversion_Effect triggers, THE Dicetrix_System SHALL reroll all converted dice to new random numbers between 1 and 20

### Requirement 5: Procedural Piece Generation

**User Story:** As a developer, I want pieces to be generated procedurally within dimensional constraints, so that gameplay remains varied and unpredictable while respecting difficulty boundaries.

#### Acceptance Criteria

1. WHEN generating a new piece, THE Dicetrix_System SHALL use Flood_Fill_Algorithm to ensure all dice positions form a connected shape
2. WHEN piece generation occurs, THE Dicetrix_System SHALL respect the current difficulty mode's dimensional constraints
3. WHEN piece generation occurs, THE Dicetrix_System SHALL validate that no piece exceeds MaxWidth × MaxHeight bounds
4. WHEN piece generation occurs, THE Dicetrix_System SHALL validate that no piece contains more than MaxDicePerPiece dice
5. WHEN piece generation fails validation, THE Dicetrix_System SHALL regenerate until valid piece is created

### Requirement 6: Zen Mode Uniform Dice Rule

**User Story:** As a player, I want Zen mode to provide predictable piece behavior, so that I can focus on spatial reasoning without complex dice type management.

#### Acceptance Criteria

1. WHEN Zen mode generates a multi-die piece, THE Dicetrix_System SHALL assign identical face counts to all dice in the piece
2. WHEN Zen mode assigns dice numbers, THE Dicetrix_System SHALL allow different numbers within the same face count constraint
3. WHEN Zen mode piece generation occurs, THE Dicetrix_System SHALL randomly select one dice type from available types for the entire piece
4. WHEN Zen mode is active, THE Dicetrix_System SHALL maintain gravity and cascade mechanics for chain reactions
5. WHEN Zen mode generates single-die pieces, THE Dicetrix_System SHALL follow normal dice type selection rules

### Requirement 7: Fall Speed and Score Multiplier Integration

**User Story:** As a player, I want difficulty modes to affect both timing pressure and scoring rewards, so that higher difficulties provide appropriate risk-reward balance.

#### Acceptance Criteria

1. WHEN Easy mode is active, THE Dicetrix_System SHALL set fall speed to 1000ms and score multiplier to 1.0x
2. WHEN Medium mode is active, THE Dicetrix_System SHALL set fall speed to 800ms and score multiplier to 1.1x
3. WHEN Hard mode is active, THE Dicetrix_System SHALL set fall speed to 600ms and score multiplier to 1.25x
4. WHEN Expert mode is active, THE Dicetrix_System SHALL set fall speed to 400ms and score multiplier to 1.5x
5. WHEN Zen mode is active, THE Dicetrix_System SHALL set fall speed to 1200ms and score multiplier to 0.9x

### Requirement 8: Booster Visual Effect System

**User Story:** As a player, I want booster effects to be visually distinct and meaningful, so that I can identify special dice properties and plan strategies accordingly.

#### Acceptance Criteria

1. WHEN a die receives a booster effect, THE Dicetrix_System SHALL apply appropriate visual glow rendering
2. WHEN booster chance calculation occurs, THE Dicetrix_System SHALL use the current difficulty mode's booster percentage
3. WHEN rendering boosted dice, THE Dicetrix_System SHALL maintain visual clarity of dice numbers and colors
4. WHEN booster effects are applied, THE Dicetrix_System SHALL store booster type information for future gameplay mechanics
5. WHEN booster visual effects are rendered, THE Dicetrix_System SHALL ensure performance optimization for multiple glowing dice
