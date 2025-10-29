# Requirements Document

## Introduction

This specification addresses a user interface bug in the Dicetrix game where the rotation control buttons perform the opposite rotation direction compared to their visual icons. Currently, clicking the clockwise rotation icon (↻) performs counter-clockwise rotation, and clicking the counter-clockwise rotation icon (↺) performs clockwise rotation. This creates a confusing user experience where the visual feedback does not match the actual game behavior.

## Glossary

- **Rotation_Control_System**: The user interface system that handles piece rotation input
- **Clockwise_Icon**: The visual symbol (↻) that should trigger clockwise rotation
- **Counter_Clockwise_Icon**: The visual symbol (↺) that should trigger counter-clockwise rotation
- **Rotation_Direction**: The actual mathematical direction of piece rotation (1 for clockwise, -1 for counter-clockwise)
- **Visual_Feedback**: The icon symbols displayed to users indicating expected rotation behavior
- **Input_Mapping**: The connection between UI button actions and game rotation functions

## Requirements

### Requirement 1

**User Story:** As a player, I want the rotation buttons to rotate pieces in the direction indicated by their visual icons, so that the controls behave as I expect them to.

#### Acceptance Criteria

1. WHEN a player clicks the clockwise rotation icon (↻), THE Rotation_Control_System SHALL rotate the active piece clockwise
2. WHEN a player clicks the counter-clockwise rotation icon (↺), THE Rotation_Control_System SHALL rotate the active piece counter-clockwise
3. WHEN rotation controls are activated, THE Rotation_Control_System SHALL ensure Visual_Feedback matches the actual Rotation_Direction
4. WHEN the rotation mapping is corrected, THE Rotation_Control_System SHALL maintain all existing rotation functionality including wall kicks
5. WHEN testing the fix, THE Rotation_Control_System SHALL demonstrate consistent behavior between icon symbols and rotation directions

### Requirement 2

**User Story:** As a developer, I want the rotation control mapping to be clearly documented and maintainable, so that future changes don't reintroduce this confusion.

#### Acceptance Criteria

1. WHEN implementing the fix, THE Rotation_Control_System SHALL use clear and consistent Input_Mapping between UI actions and rotation functions
2. WHEN the rotation direction is corrected, THE Rotation_Control_System SHALL preserve all existing rotation logic and collision detection
3. WHEN the fix is complete, THE Rotation_Control_System SHALL maintain backward compatibility with keyboard controls
4. WHEN documenting the change, THE Rotation_Control_System SHALL clearly indicate which direction corresponds to which control
5. WHEN the system is updated, THE Rotation_Control_System SHALL ensure no other game mechanics are affected by the rotation direction change
