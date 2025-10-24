# Implementation Plan

- [x] 1. Add timeout protection to Strudel initialization

  - Wrap `initAudioOnFirstClick()` in Promise.race() with 5-second timeout
  - Create timeout promise utility function
  - Add comprehensive logging for timeout events and state transitions
  - Implement cancellation logic for hanging initialization
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [x] 2. Implement fallback audio modes

- [x] 2.1 Create Phaser-only audio mode

  - Add fallback mode flag and state management
  - Implement simple audio file playback using Phaser sound system
  - Create basic music patterns using Phaser audio instead of Strudel
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2.2 Add silent mode operation

  - Implement silent audio mode that handles all audio calls gracefully
  - Ensure UI controls still work in silent mode
  - Add mode indicator for debugging purposes
  - _Requirements: 3.4, 3.5_

- [x] 3. Enhance error handling and state management

- [x] 3.1 Add initialization attempt tracking

  - Track number of initialization attempts to prevent infinite retries
  - Implement maximum retry limit (2 attempts)
  - Add state reset functionality for scene changes
  - _Requirements: 1.5, 4.4, 4.5_

- [x] 3.2 Improve logging and debugging

  - Add detailed initialization progress logging with timestamps
  - Log AudioContext state changes and transitions
  - Add diagnostic information for timeout and error scenarios
  - Create clear indicators for fallback mode activation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Update HybridAudioService implementation

- [x] 4.1 Refactor initialization method

  - Replace current `initializeStrudelOnUserInteraction()` with timeout-protected version
  - Add proper error handling and state management
  - Implement automatic fallback mode switching
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 4.2 Update music playback methods

  - Modify `playMusic()` to handle different audio modes
  - Add mode-specific pattern creation logic
  - Ensure consistent behavior across all audio modes
  - _Requirements: 1.3, 3.2, 3.3_

- [x] 5. Test and validate the audio fix

- [x] 5.1 Test timeout scenarios

  - Verify timeout triggers correctly after 5 seconds
  - Test fallback mode activation after timeout
  - Validate state transitions and logging output
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5.2 Test fallback modes

  - Verify Phaser-only audio functionality works correctly
  - Test silent mode operation and UI behavior
  - Validate mode switching during runtime

  - _Requirements: 3.1, 3.2, 3.4_

- [x] 5.3 Integration testing with game scenes


  - Test audio initialization from SplashScreen scene

  - Verify StartMenu music playback works in all modes
  - Test Settings scene audio controls with different modes
  - _Requirements: 1.1, 1.3, 3.5_
