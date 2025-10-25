# Implementation Plan

- [x] 1. Enhance GameMode configuration system with dimensional constraints

  - Update GameConfig interface to include maxPieceWidth, maxPieceHeight, maxDicePerPiece properties
  - Add boosterChance, allowBlackDice, and uniformDiceRule configuration options
  - Modify each difficulty mode class (EasyMode, MediumMode, etc.) with new constraint values
  - Update getMode() function to return enhanced configuration objects
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Implement FloodFillValidator for connectivity validation

  - Create FloodFillValidator class with validateConnectivity method
  - Implement floodFill algorithm to traverse connected positions
  - Add getAdjacent method for finding neighboring positions (4-directional)
  - Create positionKey utility for position hashing and visited tracking
  - Add comprehensive error handling for invalid position arrays
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 3. Create ProceduralPieceGenerator for constraint-based piece generation

  - Implement ProceduralPieceGenerator class with generatePiece method
  - Create generateConnectedShape method using random walk algorithm within dimensional bounds
  - Add assignDiceTypes method for dice type selection based on difficulty configuration
  - Implement piece validation against maxWidth, maxHeight, and maxDicePerPiece constraints
  - Add retry logic with fallback to single die when generation fails repeatedly
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Implement Zen mode uniform dice rule

  - Modify assignDiceTypes method to detect Zen mode uniformDiceRule configuration
  - Add logic to select single dice type for entire piece when uniformDiceRule is enabled
  - Ensure different numbers are still assigned within the same face count constraint
  - Maintain normal dice type selection for single-die pieces in Zen mode
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Create Black Die system with wild matching capabilities

  - Implement BlackDieManager class with isBlackDie and canMatchWith methods
  - Add Black Die generation logic to ProceduralPieceGenerator for Hard and Expert modes
  - Extend Die interface with isBlack and isWild properties
  - Modify dice type assignment to include Black Dice when allowBlackDice is enabled
  - _Requirements: 4.1, 4.2_

- [x] 6. Implement Black Die area conversion effects

  - Add triggerAreaConversion method to BlackDieManager class
  - Implement convertToD20InArea method for 3×3 grid transformation
  - Create rerollDiceInArea method for number regeneration of converted dice
  - Add boundary validation to ensure area conversion respects grid limits
  - Integrate area conversion trigger into match clearing system
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 7. Create BoosterEffectSystem for visual glow effects

  - Implement BoosterEffectSystem class with applyBoosterEffect method
  - Create BoosterType enum with color variants (red, blue, green, yellow, purple, orange, teal, pink, lime)
  - Add determineBoosterType method for random booster type selection
  - Implement booster chance calculation using difficulty-specific percentages
  - Extend Die interface with boosterType and glowColor properties
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 8. Integrate booster visual rendering system

  - Modify DiceRenderer to handle booster glow effects
  - Implement renderBoosterGlow method with multi-layered concentric circle rendering
  - Add performance optimization for multiple glowing dice using sprite pooling
  - Ensure booster effects maintain visual clarity of dice numbers and colors
  - Add proper cleanup and memory management for booster effect resources
  - _Requirements: 8.3, 8.5_

- [x] 9. Update Game.ts to use procedural piece generation

  - Replace generateMultiDiePiece method to use ProceduralPieceGenerator
  - Integrate DifficultyModeConfig retrieval from registry
  - Add BlackDieManager and BoosterEffectSystem initialization
  - Update piece spawning logic to handle new procedural generation system
  - Maintain compatibility with existing individual die physics system
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

-

- [x] 10. Enhance match detection for Black Die wild matching

  - Modify MatchDetector to recognize Black Die wild matching capabilities
  - Update flood-fill match detection to treat Black Dice as matching any adjacent number
  - Add logic to trigger BlackDieManager area conversion when Black Dice are in matches
  - Ensure wild matching works correctly with existing cascade and gravity systems
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 11. Implement score multiplier application system

  - Create ScoreMultiplierManager to handle difficulty-based score scaling
  - Modify scoring calculation in Game.ts to apply scoreMultiplier from current difficulty
  - Update final score calculation to multiply by difficulty scoreMultiplier value
  - Ensure score multiplier is applied consistently across all scoring events
  - Add score multiplier display to UI for player feedback
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Update difficulty mode configurations with new constraint values

  - Set Easy mode to 3×3×5 constraints with d4,d6,d8 dice and 50% booster chance
  - Set Medium mode to 4×4×8 constraints with d6,d8,d10,d12 dice and 35% booster chance
  - Set Hard mode to 5×5×10 constraints with d8,d10,d12,d20,Black dice and 25% booster chance
  - Set Expert mode to 5×5×16 constraints with d10,d12,d20,Black dice and 15% booster chance

  - Set Zen mode to 3×3×5 constraints with d4,d6,d8 dice, 50% booster chance, and uniformDiceRule enabled
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]\* 13. Create comprehensive test suite for procedural generation

  - Write unit tests for FloodFillValidator connectivity detection accuracy
  - Create tests for ProceduralPieceGenerator dimensional constraint validation
  - Add tests for Black Die wild matching and area conversion mechanics
  - Implement performance tests for piece generation speed and memory usage
  - Create integration tests for cross-difficulty mode validation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 14. Add visual debugging tools for piece generation
  - Create debug visualization for generated piece shapes and connectivity
  - Add logging for dimensional constraint validation and retry attempts
  - Implement debug overlay showing booster effect distribution
  - Create performance monitoring for procedural generation timing
  - _Requirements: 5.1, 5.2, 8.1, 8.5_
