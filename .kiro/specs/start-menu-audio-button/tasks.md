# Implementation Plan

- [x] 1. Implement button positioning and layout calculations

  - Create helper methods to calculate Settings button left-alignment with Difficulty dropdown
  - Calculate Audio button position to the right of Settings button with proper spacing
  - Ensure all positioning calculations respect the existing UI_SCALE factor
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4_

- [x] 2. Reposition existing Settings button

  - Modify Settings button creation to use calculated left-aligned position
  - Maintain existing Settings button styling, hover effects, and click functionality
  - Verify Settings button continues to open Settings scene correctly
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 3. Create audio button component with initial state

  - Create square audio button with height matching Settings button
  - Implement muted speaker icon (🔇) as initial state
  - Apply consistent styling with Settings button (colors, borders, scaling)
  - Add hover effects matching other interactive elements

  - _Requirements: 2.2, 2.3, 2.5, 7.1, 7.3_

- [x] 4. Implement audio button click handler and state management

  - Create click handler that calls existing enableAudioOnUserInteraction method
  - Implement state tracking for muted/unmuted audio button states
  - Add visual feedback for button press interactions
  - Handle audio initialization success and failure scenarios
  - _Requirements: 3.1, 3.2, 3.5, 4.4, 5.1_

- [x] 5. Add audio activation and music control functionality

  - Integrate with existing audioHandler service to start/stop menu music
  - Update button icon to unmuted speaker (🔊) when audio is successfully activated
  - Implement toggle functionality to stop music and return to muted state
  - Add appropriate sound effects for button interactions when audio is enabled
  - _Requirements: 3.3, 3.4, 4.1, 4.2, 4.3, 4.5, 5.3_

- [x] 6. Add error handling and browser compatibility

  - Implement timeout protection for audio context initialization
  - Handle audio initialization failures gracefully with appropriate logging
  - Ensure compatibility with browser autoplay policies
  - Maintain button functionality even when audio systems fail
  - _Requirements: 3.5, 5.2, 5.4, 6.3_

- [x] 7. Implement responsive behavior and cross-platform support

  - Ensure button maintains proper touch target size on mobile devices
  - Verify button positioning works correctly across different screen sizes
  - Test and ensure button works with both mouse and touch interactions
  - Maintain button proportions when UI scaling changes
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ]\* 8. Add comprehensive error logging and debugging support

  - Add detailed logging for audio button state changes and user interactions
  - Log audio initialization attempts, successes, and failures with timestamps
  - Include diagnostic information for troubleshooting audio context issues
  - _Requirements: 5.5, 8.4_

- [ ]\* 9. Create unit tests for button positioning and state management
  - Write tests for button position calculation methods
  - Test audio button state transitions and icon updates
  - Verify error handling scenarios and fallback behaviors
  - Test integration with existing audio systems
  - _Requirements: 8.1, 8.2, 8.3, 8.5_
