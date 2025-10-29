# Game Scene Layout Finalization Design Document

## Overview

This design document outlines the implementation approach for finalizing the Game scene layout in Dicetrix. The design focuses on creating a consistent, professional interface with proper font loading, optimal element positioning for 1920x1080 screens, and organized bottom section layout with standardized button sizing.

The implementation will modify the existing GameUI class to incorporate Asimovian font loading, reposition the game board for better visual hierarchy, and reorganize the bottom section with grouped elements and consistent 128x128 button sizing.

## Architecture

### Font Loading Integration

The Game scene will integrate the same font loading mechanism used in SplashScreen to ensure consistent typography across the application.

```
Game Scene Initialization Flow:
1. Scene Create() → 2. Load Fonts → 3. Create UI Elements → 4. Apply Layout → 5. Render Game State
```

### Layout Architecture

The screen layout will be organized into distinct sections with clear visual hierarchy:

```
┌─────────────────────────────────────────────────────────────┐
│                        Score Display                        │ ← Header (80px)
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     Game Board                              │ ← Main Area
│                   (Centered)                                │   (960px)
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Next Piece] │ [Control Buttons] │ [Boosters]              │ ← Bottom Section
│   Label +    │    6 buttons      │  9 slots                │   (480px)
│   Display    │   (2x3 grid)      │ (3x3 grid)              │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
GameUI
├── Font Loading System
├── Header Section
│   ├── Score Label (Asimovian font)
│   └── Score Value (Asimovian font)
├── Main Game Area
│   └── Game Board (Centered, scaled)
└── Bottom Section (480px height)
    ├── Next Piece Group (Left)
    │   ├── Next Piece Label (Asimovian font)
    │   └── Next Piece Display
    ├── Control Buttons Group (Center)
    │   └── 6 buttons (128x128 each)
    └── Boosters Group (Right)
        └── 9 booster slots (128x128 each)
```

## Components and Interfaces

### Font Loading System

```typescript
interface FontLoadingSystem {
  loadFonts(): Promise<void>;
  createFallbackText(element: Phaser.GameObjects.Text): void;
  validateFontAvailability(): boolean;
}

class GameSceneFontLoader {
  private static readonly FONT_LOADING_TIMEOUT = 3000;
  
  async loadAsimovianFont(): Promise<void> {
    // Implementation mirrors SplashScreen approach
    const fontPromises: Promise<void>[] = [];
    
    if (document?.fonts?.load) {
      fontPromises.push(document.fonts.load('16px "Asimovian"'));
    }
    
    await Promise.race([
      Promise.all(fontPromises),
      this.createTimeoutPromise()
    ]);
  }
  
  private createTimeoutPromise(): Promise<void> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Font loading timeout')), 
                 this.FONT_LOADING_TIMEOUT);
    });
  }
}
```

### Layout Configuration

```typescript
interface LayoutConfiguration {
  screenWidth: number;
  screenHeight: number;
  headerHeight: number;
  bottomSectionHeight: number;
  buttonSize: number;
  groupSpacing: number;
}

const LAYOUT_CONFIG: LayoutConfiguration = {
  screenWidth: 1920,
  screenHeight: 1080,
  headerHeight: 80,
  bottomSectionHeight: 480,
  buttonSize: 128,
  groupSpacing: 40
};
```

### Bottom Section Layout Manager

```typescript
class BottomSectionLayoutManager {
  private readonly BUTTON_SIZE = 128;
  private readonly GROUP_SPACING = 40;
  private readonly INTERNAL_SPACING = 8;
  
  calculateNextPieceArea(): LayoutArea {
    return {
      x: this.GROUP_SPACING,
      y: this.getBottomSectionY(),
      width: this.calculateNextPieceWidth(),
      height: this.LAYOUT_CONFIG.bottomSectionHeight - 40
    };
  }
  
  calculateControlButtonsArea(): LayoutArea {
    const nextPieceWidth = this.calculateNextPieceWidth();
    return {
      x: this.GROUP_SPACING + nextPieceWidth + this.GROUP_SPACING,
      y: this.getBottomSectionY(),
      width: (this.BUTTON_SIZE * 3) + (this.INTERNAL_SPACING * 2),
      height: (this.BUTTON_SIZE * 2) + this.INTERNAL_SPACING
    };
  }
  
  calculateBoostersArea(): LayoutArea {
    const controlsEndX = this.getControlsEndX();
    return {
      x: controlsEndX + this.GROUP_SPACING,
      y: this.getBottomSectionY(),
      width: (this.BUTTON_SIZE * 3) + (this.INTERNAL_SPACING * 2),
      height: (this.BUTTON_SIZE * 3) + (this.INTERNAL_SPACING * 2)
    };
  }
}
```

### Game Board Positioning System

```typescript
class GameBoardPositioner {
  calculateOptimalBoardPosition(screenDimensions: ScreenDimensions): BoardMetrics {
    const availableHeight = screenDimensions.height - 
                           LAYOUT_CONFIG.headerHeight - 
                           LAYOUT_CONFIG.bottomSectionHeight;
    
    // Scale board to fit available space while maintaining aspect ratio
    const maxBoardHeight = availableHeight * 0.9; // 90% of available space
    const cellSize = Math.floor(maxBoardHeight / GAME_CONSTANTS.GRID_HEIGHT);
    
    const boardWidth = cellSize * GAME_CONSTANTS.GRID_WIDTH;
    const boardHeight = cellSize * GAME_CONSTANTS.GRID_HEIGHT;
    
    // Center horizontally
    const boardX = (screenDimensions.width - boardWidth) / 2;
    const boardY = LAYOUT_CONFIG.headerHeight + 
                   ((availableHeight - boardHeight) / 2);
    
    return {
      x: boardX,
      y: boardY,
      width: boardWidth,
      height: boardHeight,
      cellSize: cellSize
    };
  }
}
```

## Data Models

### Layout Area Definition

```typescript
interface LayoutArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoardMetrics extends LayoutArea {
  cellSize: number;
  cols: number;
  rows: number;
}

interface ButtonGroupMetrics {
  area: LayoutArea;
  buttonSize: number;
  spacing: number;
  rows: number;
  cols: number;
}
```

### Font Configuration

```typescript
interface FontConfiguration {
  primaryFont: string;
  fallbackChain: string[];
  sizes: {
    scoreLabel: string;
    scoreValue: string;
    nextPieceLabel: string;
    buttonLabels: string;
  };
}

const FONT_CONFIG: FontConfiguration = {
  primaryFont: 'Asimovian',
  fallbackChain: ['Arial Black', 'Arial', 'sans-serif'],
  sizes: {
    scoreLabel: '28px',
    scoreValue: '28px', 
    nextPieceLabel: '24px',
    buttonLabels: '20px'
  }
};
```

### Visual Grouping Configuration

```typescript
interface GroupBorderStyle {
  color: number;
  alpha: number;
  thickness: number;
  cornerRadius: number;
}

const GROUP_BORDER_STYLE: GroupBorderStyle = {
  color: 0x00ff88,
  alpha: 0.3,
  thickness: 2,
  cornerRadius: 8
};
```

## Error Handling

### Font Loading Error Recovery

```typescript
class FontErrorHandler {
  handleFontLoadingFailure(error: Error): void {
    Logger.log(`Font loading failed: ${error.message}`);
    
    // Apply fallback font configuration
    this.applyFallbackFonts();
    
    // Continue with UI creation using system fonts
    this.proceedWithSystemFonts();
  }
  
  private applyFallbackFonts(): void {
    // Update all text elements to use fallback font chain
    const fallbackChain = 'Arial Black, Arial, sans-serif';
    
    // Apply to existing text elements
    this.updateExistingTextElements(fallbackChain);
  }
}
```

### Layout Validation

```typescript
class LayoutValidator {
  validateBottomSectionFit(elements: LayoutArea[]): ValidationResult {
    const totalWidth = elements.reduce((sum, element) => sum + element.width, 0);
    const availableWidth = LAYOUT_CONFIG.screenWidth - (GROUP_SPACING * 2);
    
    if (totalWidth > availableWidth) {
      return {
        isValid: false,
        error: 'Bottom section elements exceed available width',
        recommendation: 'Reduce button size or spacing'
      };
    }
    
    return { isValid: true };
  }
  
  validateButtonSizing(buttons: ButtonElement[]): ValidationResult {
    const invalidButtons = buttons.filter(btn => 
      btn.width !== LAYOUT_CONFIG.buttonSize || 
      btn.height !== LAYOUT_CONFIG.buttonSize
    );
    
    if (invalidButtons.length > 0) {
      return {
        isValid: false,
        error: `${invalidButtons.length} buttons not sized to 128x128`,
        invalidElements: invalidButtons
      };
    }
    
    return { isValid: true };
  }
}
```

### Responsive Fallbacks

```typescript
class ResponsiveFallbackHandler {
  handleInsufficientSpace(availableSpace: LayoutArea): LayoutConfiguration {
    // If 1920x1080 layout doesn't fit, scale proportionally
    const scaleFactorX = availableSpace.width / LAYOUT_CONFIG.screenWidth;
    const scaleFactorY = availableSpace.height / LAYOUT_CONFIG.screenHeight;
    const scaleFactor = Math.min(scaleFactorX, scaleFactorY);
    
    return {
      ...LAYOUT_CONFIG,
      buttonSize: Math.floor(LAYOUT_CONFIG.buttonSize * scaleFactor),
      bottomSectionHeight: Math.floor(LAYOUT_CONFIG.bottomSectionHeight * scaleFactor),
      groupSpacing: Math.floor(GROUP_SPACING * scaleFactor)
    };
  }
}
```

## Testing Strategy

### Font Loading Tests

```typescript
describe('Font Loading System', () => {
  test('should load Asimovian font successfully', async () => {
    const fontLoader = new GameSceneFontLoader();
    await expect(fontLoader.loadAsimovianFont()).resolves.not.toThrow();
  });
  
  test('should handle font loading timeout gracefully', async () => {
    // Mock slow font loading
    jest.spyOn(document.fonts, 'load').mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 5000))
    );
    
    const fontLoader = new GameSceneFontLoader();
    await expect(fontLoader.loadAsimovianFont()).rejects.toThrow('timeout');
  });
  
  test('should apply fallback fonts when primary font fails', () => {
    const errorHandler = new FontErrorHandler();
    const mockError = new Error('Font not found');
    
    expect(() => errorHandler.handleFontLoadingFailure(mockError)).not.toThrow();
  });
});
```

### Layout Positioning Tests

```typescript
describe('Layout Positioning', () => {
  test('should position game board in center with correct scaling', () => {
    const positioner = new GameBoardPositioner();
    const screenDims = { width: 1920, height: 1080 };
    
    const boardMetrics = positioner.calculateOptimalBoardPosition(screenDims);
    
    expect(boardMetrics.x).toBeGreaterThan(0);
    expect(boardMetrics.y).toBe(LAYOUT_CONFIG.headerHeight + expectedOffset);
    expect(boardMetrics.height).toBeLessThanOrEqual(960); // Available space
  });
  
  test('should fit all bottom section elements within 480px height', () => {
    const layoutManager = new BottomSectionLayoutManager();
    const areas = [
      layoutManager.calculateNextPieceArea(),
      layoutManager.calculateControlButtonsArea(),
      layoutManager.calculateBoostersArea()
    ];
    
    areas.forEach(area => {
      expect(area.y + area.height).toBeLessThanOrEqual(1080);
    });
  });
});
```

### Button Sizing Tests

```typescript
describe('Button Sizing', () => {
  test('should scale all control buttons to 128x128', () => {
    const buttons = createControlButtons();
    
    buttons.forEach(button => {
      expect(button.width).toBe(128);
      expect(button.height).toBe(128);
    });
  });
  
  test('should scale all booster slots to 128x128', () => {
    const boosterSlots = createBoosterSlots();
    
    boosterSlots.forEach(slot => {
      expect(slot.width).toBe(128);
      expect(slot.height).toBe(128);
    });
  });
});
```

### Visual Grouping Tests

```typescript
describe('Visual Grouping', () => {
  test('should add borders around each functional group', () => {
    const groups = ['nextPiece', 'controls', 'boosters'];
    
    groups.forEach(groupName => {
      const border = getBorderForGroup(groupName);
      expect(border).toBeDefined();
      expect(border.thickness).toBe(GROUP_BORDER_STYLE.thickness);
      expect(border.color).toBe(GROUP_BORDER_STYLE.color);
    });
  });
  
  test('should maintain consistent spacing between groups', () => {
    const layoutManager = new BottomSectionLayoutManager();
    const nextArea = layoutManager.calculateNextPieceArea();
    const controlsArea = layoutManager.calculateControlButtonsArea();
    
    const spacing = controlsArea.x - (nextArea.x + nextArea.width);
    expect(spacing).toBe(GROUP_SPACING);
  });
});
```

## Implementation Phases

### Phase 1: Font Loading Integration
1. Extract font loading logic from SplashScreen
2. Create reusable FontLoader utility class
3. Integrate font loading into Game scene initialization
4. Add comprehensive error handling and fallbacks

### Phase 2: Game Board Repositioning
1. Modify GameUI layout calculations
2. Implement centered board positioning
3. Scale board to leave 480px bottom space
4. Update board metrics and coordinate systems

### Phase 3: Bottom Section Reorganization
1. Create BottomSectionLayoutManager
2. Implement grouped layout for Next Piece, Controls, Boosters
3. Add visual borders around each group
4. Ensure proper spacing and alignment

### Phase 4: Button Standardization
1. Update all control buttons to 128x128 sizing
2. Modify booster slots to 128x128 sizing
3. Adjust button positioning and spacing
4. Maintain visual consistency across all interactive elements

### Phase 5: Integration and Testing
1. Integrate all layout changes into GameUI
2. Test font loading under various conditions
3. Validate layout on target 1920x1080 resolution
4. Perform cross-browser compatibility testing

This design provides a comprehensive approach to finalizing the Game scene layout while maintaining code quality, error resilience, and visual consistency throughout the implementation.
