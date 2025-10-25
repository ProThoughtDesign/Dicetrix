# Implementation Plan

- [x] 1. Update audio documentation to reflect dice-matching mechanics

  - Replace all line-clear sound effect specifications with dice-match specifications in AUDIO_ASSETS_DOCUMENTATION.md
  - Update sound effect descriptions to use dice-matching terminology instead of line-clearing terminology
  - Preserve all existing non-matching sound effect documentation (piece movement, UI, game state, combos)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Update SoundEffectLibrary class for dice-matching sounds

  - [x] 2.1 Replace line-clear sound registrations with dice-match sound registrations

    - Remove `line-clear-single`, `line-clear-double`, `line-clear-triple`, `line-clear-tetris` registrations
    - Add `dice-match-3`, `dice-match-4`, `dice-match-5`, `dice-match-7`, `dice-match-9` registrations
    - _Requirements: 5.1, 5.2_

  - [x] 2.2 Replace playLineClear method with playDiceMatch method

    - Create new `playDiceMatch(diceCount: number)` method that maps dice counts to appropriate sound keys
    - Implement mapping logic: 3→dice-match-3, 4→dice-match-4, 5→dice-match-5, 7→dice-match-7, 9+→dice-match-9
    - Add error handling for unsupported dice counts with fallback behavior
    - _Requirements: 5.1, 5.4_

  - [x] 2.3 Maintain backward compatibility during transition

    - Keep existing `playLineClear` method temporarily for compatibility
    - Add deprecation logging for old method usage
    - Ensure graceful handling of missing audio files
    - _Requirements: 5.4_

- [x] 3. Update Preloader class to load new dice-match sound files

  - Replace line-clear sound file references with dice-match sound file references in asset loading
  - Update sound file array to include new dice-match sound keys
  - Maintain error handling for missing audio files during development
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 4. Update game event triggers to use dice-matching sounds

  - [x] 4.1 Identify and update locations where line-clear sounds are triggered

    - Search codebase for calls to `playLineClear()` method
    - Replace with appropriate `playDiceMatch()` calls based on game logic
    - _Requirements: 5.1, 5.4_

  - [x] 4.2 Ensure proper dice count parameter passing

    - Verify that dice-matching game events provide correct dice count values
    - Add validation for dice count parameters in sound trigger calls
    - _Requirements: 5.1, 5.4_

- [ ]\* 5. Add unit tests for dice-match sound functionality

  - Write tests for new `playDiceMatch()` method with various dice count inputs
  - Test error handling for invalid dice counts and missing audio files
  - Verify backward compatibility with existing sound effect functionality
  - _Requirements: 5.1, 5.4_

- [x] 6. Update combo sound effect descriptions for dice-matching context


  - Update combo sound effect descriptions in documentation to reference dice-matching chains
  - Ensure combo-2x, combo-3x, combo-4x descriptions mention dice-matching multipliers
  - Update ultimate-combo and perfect-clear descriptions for dice-matching achievements
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_
