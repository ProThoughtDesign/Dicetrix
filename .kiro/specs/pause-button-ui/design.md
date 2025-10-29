# Design Document

## Overview

The pause button feature will add a 128x128 pixel interactive button to the left margin of the game screen, positioned to mirror the Next Piece indicator on the right side. The button will integrate with the existing GameUI class and provide seamless navigation to the Settings scene. The Settings scene will be enhanced to work as a pause overlay, allowing players to resume the game or exit to the main menu with proper confirmation.

## Architecture

The pause button will be implemented as part of the existing GameUI system with enhanced Settings scene integration:

- **GameUI Class Extension**: Add pause button elements to the existing GameUI class
- **Layout Integration**: Position the button using the same coordinate system as other UI elements
- **Settings Scene Enhancement**: Modify Settings scene to serve as pause overlay with game context
- **Navigation Flow**: Implement seamless transitions between Game → Settings → Game/Menu
- **State Management**: Preserve game state during Settings navigation
- **Visual Consistency**: Use the same styling patterns as existing UI elements

## Components and Interfaces

### GameUI Class Modifications

```typescript
// New properties to add to GameUI class
private pauseButton: Phaser.GameObjects.Rectangle;
private pauseIcon: Phaser.GameObjects.Text;
private isPaused: boolean = false;

// New method signatures
private createPauseButton(): void;
private updatePauseButtonLayout(): void;
private updatePauseButtonState(paused: boolean): void;
private handlePauseButtonClick(): void;
```

### GameUICallbacks Interface Extension

```typescript
export interface GameUICallbacks extends InputCallbacks {
  onBoardTouch?: (gridX: number, gridY: number) => void;
  onPauseSettings?: () => void; // New callback to open Settings as pause overlay
}
```

### Settings Scene Enhancements

```typescript
// New properties for Settings scene
private gameContext: 'menu' | 'game' = 'menu'; // Track where Settings was opened from
private gameState: any = null; // Preserved game state when paused

// New method signatures for Settings scene
private createGameContextButtons(): void;
private handleResumeGame(): void;
private handleExitToMenu(): void;
private showExitConfirmation(): void;
```

## Data Models

### Button State Model

```typescript
interface PauseButtonState {
  icon: string; // '⚙️' for settings/pause
  color: string; // Button color
  enabled: boolean; // Whether button is interactive
}
```

### Position Metrics

```typescript
interface PauseButtonMetrics {
  buttonX: number; // Absolute screen X position
  buttonY: number; // Absolute screen Y position
  buttonSize: number; // 128x128 pixels
  marginFromBoard: number; // Distance from game board
}
```

### Game Context State

```typescript
interface GameContextState {
  context: 'menu' | 'game'; // Where Settings was opened from
  gameMode: string; // Current game mode
  score: number; // Current score
  activePiece: any; // Current active piece
  nextPiece: any; // Next piece
  gameBoard: any; // Board state
  isPaused: boolean; // Pause state
}
```

## Implementation Details

### Positioning Logic

The pause button will be positioned in the left margin using the same alignment strategy as the Next Piece indicator:

1. **Horizontal Position**: Left margin with consistent spacing from screen edge
2. **Vertical Position**: Aligned with the top of the Next Piece indicator
3. **Size**: Fixed 128x128 pixels to match the design requirement
4. **Spacing**: Maintain appropriate margin from the game board

### Visual Design

#### Pause Button
- **Background**: Dark background (0x1a1a2e) with green border (0x00ff88)
- **Icon**: Settings/gear icon (⚙️) to indicate pause/settings access
- **Font**: Asimovian font family to match existing UI
- **Hover Effects**: Border highlight on hover/press
- **Consistent Styling**: Match existing UI button patterns

#### Settings Scene Enhancements
- **Context-Aware Layout**: Different button layouts for menu vs game context
- **Resume Game Button**: Prominent green button when opened from game
- **Exit to Menu Button**: Secondary button with confirmation dialog
- **Confirmation Dialog**: Modal overlay for exit confirmation with "Yes" and "Cancel" options

### Integration Points

#### GameUI Integration
1. **GameUI.createUIElements()**: Add pause/settings button creation
2. **GameUI.updateLayout()**: Add pause button positioning
3. **GameUI.setupInputHandlers()**: Add pause button click handler
4. **Game scene callbacks**: Connect to Settings scene transition

#### Settings Scene Integration
1. **Settings.init()**: Accept game context parameter to determine layout
2. **Settings.create()**: Create context-appropriate buttons (Resume/Exit vs Back)
3. **Game state preservation**: Store game state in registry when transitioning to Settings
4. **Navigation flow**: Handle Resume Game → Game scene and Exit to Menu → StartMenu scene

#### Game Scene Integration
1. **Pause state management**: Pause game timers when transitioning to Settings
2. **State restoration**: Resume game state when returning from Settings
3. **Registry management**: Use scene registry to pass game context and state

## Error Handling

- **Graceful Degradation**: If Settings transition fails, maintain current game state
- **State Preservation**: Ensure game state is properly saved/restored during scene transitions
- **Input Validation**: Prevent rapid clicking that could cause navigation conflicts
- **Layout Fallback**: If positioning fails, use default safe position
- **Context Recovery**: Handle cases where game context is lost during Settings navigation
- **Confirmation Safety**: Prevent accidental game exit with confirmation dialog

## Testing Strategy

### Unit Testing Approach

- **Button Creation**: Verify pause button is created with correct properties
- **Layout Positioning**: Test button positioning relative to Next Piece indicator
- **State Management**: Test pause/resume state transitions
- **Event Handling**: Test click event handling and callback execution

### Integration Testing

- **UI Integration**: Test button integration with existing GameUI layout
- **Scene Transitions**: Test Game → Settings → Game/Menu navigation flow
- **State Preservation**: Test game state saving and restoration during Settings navigation
- **Context Awareness**: Test Settings scene behavior when opened from Game vs Menu
- **Confirmation Flow**: Test exit confirmation dialog and user choices
- **Responsive Layout**: Test button positioning across different screen sizes
- **Visual Consistency**: Verify styling matches existing UI elements

### Visual Testing

- **Alignment Verification**: Confirm button aligns with Next Piece indicator
- **Size Verification**: Confirm 128x128 pixel dimensions
- **Icon Display**: Verify correct pause/resume icons are displayed
- **Hover States**: Test visual feedback on interaction
