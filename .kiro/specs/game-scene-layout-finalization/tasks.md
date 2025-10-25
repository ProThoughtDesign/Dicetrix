# Implementation Plan

- [x] 1. Extract and create reusable font loading system

  - Extract font loading logic from SplashScreen.ts into a shared utility
  - Create FontLoader utility class with async loading and timeout handling
  - Add comprehensive error handling and fallback font mechanisms
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Integrate font loading into Game scene initialization

  - Modify Game.ts scene create() method to load fonts before UI creation
  - Update GameUI constructor to wait for font loading completion
  - Apply Asimovian font to all text elements with fallback chains
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implement game board repositioning and scaling

  - Modify GameUI updateLeftColumnLayout() to center board horizontally
  - Position game board directly below score display with proper spacing
  - Scale board to leave approximately 480 pixels at bottom for 1920px screen height
  - Update board metrics calculations for new positioning
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Create bottom section layout manager

  - Implement BottomSectionLayoutManager class for organized element positioning
  - Calculate layout areas for Next Piece, Control Buttons, and Boosters groups
  - Ensure all elements fit within the 480-pixel bottom section area
  - Add proper spacing and alignment between grouped sections
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Standardize button sizing to 128x128 pixels

  - Update control button sizing in updateControlsLayout() method
  - Modify booster slot sizing in updateBoostersLayout() method
  - Ensure all interactive elements maintain consistent 128x128 dimensions
  - Adjust button positioning and spacing for new sizing
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement visual grouping with borders

  - Add border graphics around Next Piece label and display group
  - Create bordered container for Control Buttons group
  - Add visual border around Boosters section
  - Apply consistent border styling (color, thickness, alpha) across all groups
  - _Requirements: 3.3, 4.4_

- [ ] 7. Update Next Piece display positioning and labeling

  - Position Next Piece label and display in left portion of bottom section
  - Ensure clear "Next Piece" label visibility with Asimovian font
  - Group label and display together with visual border
  - Scale Next Piece display appropriately for piece preview visibility
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]\* 8. Add layout validation and error handling

  - Create LayoutValidator class for bottom section fit validation
  - Add button sizing validation methods
  - Implement responsive fallback handling for insufficient space
  - Add comprehensive error logging for layout issues
  - _Requirements: 3.5, 4.5_

- [ ]\* 9. Create unit tests for font loading system

  - Test successful Asimovian font loading
  - Test font loading timeout handling
  - Test fallback font application when primary font fails
  - Verify error handling and graceful degradation
  - _Requirements: 1.3, 1.4, 1.5_

- [ ]\* 10. Create unit tests for layout positioning

  - Test game board centering and scaling calculations
  - Test bottom section element positioning within 480px constraint
  - Test button sizing consistency across all interactive elements
  - Test visual grouping and border application
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2_


- [x] 11. Refine UI visual styling and prominence

  - Remove visual borders from Control Buttons and Boosters groups
  - Keep visual border only around Next Piece group
  - Scale Score label font size from 28px to 42px (150% increase)
  - Scale Score value font size from 28px to 42px (150% increase)
  - Ensure Score elements maintain proper alignment and positioning
  - _Requirements: 3.3, 6.1, 6.2, 6.3, 6.4, 6.5_
