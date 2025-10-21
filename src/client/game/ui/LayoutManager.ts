import { DisplayMode, Dimensions, LayoutConfig } from './ResponsiveUISystem.js';
import { ScalingCalculator } from './ScalingCalculator.js';
import { UIZoneManager } from './UIZoneManager.js';

/**
 * LayoutManager - Coordinates layout calculations and applies responsive layouts
 * Works with ScalingCalculator and UIZoneManager to create complete layout configurations
 */
export class LayoutManager {
  private readonly GRID_WIDTH = 10;
  private readonly GRID_HEIGHT = 20;

  constructor(
    private scalingCalculator: ScalingCalculator,
    private uiZoneManager: UIZoneManager
  ) {}

  /**
   * Calculate grid offset based on display mode and dimensions
   */
  public calculateGridOffset(
    dimensions: Dimensions, 
    mode: DisplayMode, 
    cellSize: number
  ): { x: number; y: number } {
    const { width, height } = dimensions;
    const gridPixelWidth = this.GRID_WIDTH * cellSize;
    const gridPixelHeight = this.GRID_HEIGHT * cellSize;

    switch (mode) {
      case 'mobile':
        // Mobile: 10px from left, centered vertically
        return {
          x: 10,
          y: (height - gridPixelHeight) / 2
        };

      case 'desktop':
      case 'fullscreen':
        // Desktop/Fullscreen: centered both ways
        return {
          x: (width - gridPixelWidth) / 2,
          y: (height - gridPixelHeight) / 2
        };
    }
  }

  /**
   * Create complete layout configuration
   */
  public createLayoutConfig(
    dimensions: Dimensions,
    mode: DisplayMode
  ): LayoutConfig {
    const cellSize = this.scalingCalculator.calculateCellSize(dimensions, mode);
    const gridOffset = this.calculateGridOffset(dimensions, mode, cellSize);
    const uiZones = this.uiZoneManager.allocateZones(dimensions, mode);
    const scalingFactor = this.scalingCalculator.calculateScalingFactor(mode, cellSize);

    return {
      displayMode: mode,
      cellSize,
      gridOffset,
      uiZones,
      scalingFactor,
      screenDimensions: dimensions
    };
  }

  /**
   * Validate layout configuration
   */
  public validateLayout(config: LayoutConfig): boolean {
    const { screenDimensions, cellSize, gridOffset, uiZones } = config;
    
    // Check if grid fits within screen bounds
    const gridPixelWidth = this.GRID_WIDTH * cellSize;
    const gridPixelHeight = this.GRID_HEIGHT * cellSize;
    
    if (gridOffset.x + gridPixelWidth > screenDimensions.width ||
        gridOffset.y + gridPixelHeight > screenDimensions.height) {
      console.warn('Grid extends beyond screen bounds');
      return false;
    }

    // Check if cell size is reasonable
    if (cellSize < 16 || cellSize > 256) {
      console.warn('Cell size out of reasonable range:', cellSize);
      return false;
    }

    // Validate UI zones don't overlap with grid
    const gridBounds = {
      x: gridOffset.x,
      y: gridOffset.y,
      width: gridPixelWidth,
      height: gridPixelHeight
    };

    // Check score area doesn't overlap with grid
    if (this.rectanglesOverlap(uiZones.scoreArea, gridBounds)) {
      console.warn('Score area overlaps with grid');
      return false;
    }

    return true;
  }

  /**
   * Calculate safe margins around the grid
   */
  public calculateGridMargins(mode: DisplayMode): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    switch (mode) {
      case 'mobile':
        return { top: 40, right: 20, bottom: 20, left: 10 };
      case 'desktop':
        return { top: 50, right: 30, bottom: 30, left: 30 };
      case 'fullscreen':
        return { top: 60, right: 50, bottom: 50, left: 50 };
    }
  }

  /**
   * Calculate optimal UI element positions relative to grid
   */
  public calculateUIElementPosition(
    elementType: 'score' | 'nextPiece' | 'boosters',
    gridOffset: { x: number; y: number },
    cellSize: number,
    mode: DisplayMode
  ): { x: number; y: number; width: number; height: number } {
    const gridPixelWidth = this.GRID_WIDTH * cellSize;
    const gridPixelHeight = this.GRID_HEIGHT * cellSize;

    switch (elementType) {
      case 'score':
        return {
          x: gridOffset.x,
          y: gridOffset.y - (mode === 'mobile' ? 30 : mode === 'desktop' ? 35 : 45),
          width: gridPixelWidth,
          height: mode === 'mobile' ? 25 : mode === 'desktop' ? 30 : 35
        };

      case 'nextPiece':
        const rightPanelX = gridOffset.x + gridPixelWidth + (mode === 'mobile' ? 20 : 30);
        const nextPieceSize = mode === 'mobile' ? 80 : mode === 'desktop' ? 100 : 120;
        
        return {
          x: rightPanelX,
          y: gridOffset.y + 20,
          width: nextPieceSize,
          height: nextPieceSize
        };

      case 'boosters':
        const boosterX = gridOffset.x + gridPixelWidth + (mode === 'mobile' ? 20 : 30);
        const boosterY = gridOffset.y + (mode === 'mobile' ? 120 : mode === 'desktop' ? 140 : 170);
        const boosterWidth = mode === 'desktop' ? 180 : 270;
        const boosterHeight = mode === 'desktop' ? 120 : 150;
        
        return {
          x: boosterX,
          y: boosterY,
          width: boosterWidth,
          height: boosterHeight
        };
    }
  }

  /**
   * Check if two rectangles overlap
   */
  private rectanglesOverlap(rect1: any, rect2: any): boolean {
    return !(rect1.x + rect1.width <= rect2.x ||
             rect2.x + rect2.width <= rect1.x ||
             rect1.y + rect1.height <= rect2.y ||
             rect2.y + rect2.height <= rect1.y);
  }

  /**
   * Calculate responsive breakpoints for layout transitions
   */
  public getLayoutBreakpoints(): {
    mobileToDesktop: number;
    desktopToFullscreen: number;
  } {
    return {
      mobileToDesktop: 1080,
      desktopToFullscreen: 1600
    };
  }

  /**
   * Get minimum screen size requirements for each mode
   */
  public getMinimumScreenRequirements(): {
    mobile: { width: number; height: number };
    desktop: { width: number; height: number };
    fullscreen: { width: number; height: number };
  } {
    return {
      mobile: {
        width: this.GRID_WIDTH * 24 + 150, // Grid + minimal UI
        height: this.GRID_HEIGHT * 24 + 100
      },
      desktop: {
        width: this.GRID_WIDTH * 32 + 250, // Grid + UI panels
        height: this.GRID_HEIGHT * 32 + 150
      },
      fullscreen: {
        width: this.GRID_WIDTH * 32 + 600, // Grid + expanded panels
        height: this.GRID_HEIGHT * 32 + 300
      }
    };
  }

  /**
   * Calculate adaptive spacing based on display mode
   */
  public calculateAdaptiveSpacing(baseSpacing: number, mode: DisplayMode): number {
    const multiplier = mode === 'mobile' ? 0.8 : mode === 'desktop' ? 1.0 : 1.5;
    return Math.max(4, Math.floor(baseSpacing * multiplier));
  }

  /**
   * Get layout performance metrics
   */
  public getLayoutMetrics(config: LayoutConfig): {
    gridUtilization: number;
    screenUtilization: number;
    aspectRatioOptimal: boolean;
  } {
    const { screenDimensions, cellSize } = config;
    const gridPixelWidth = this.GRID_WIDTH * cellSize;
    const gridPixelHeight = this.GRID_HEIGHT * cellSize;
    
    const gridArea = gridPixelWidth * gridPixelHeight;
    const screenArea = screenDimensions.width * screenDimensions.height;
    
    const gridUtilization = (gridArea / screenArea) * 100;
    const screenUtilization = gridUtilization; // Simplified for now
    
    // Optimal aspect ratios: mobile ~0.6-0.8, desktop ~1.2-1.6, fullscreen ~1.5-2.0
    const aspectRatio = screenDimensions.aspectRatio;
    let aspectRatioOptimal = false;
    
    switch (config.displayMode) {
      case 'mobile':
        aspectRatioOptimal = aspectRatio >= 0.5 && aspectRatio <= 1.0;
        break;
      case 'desktop':
        aspectRatioOptimal = aspectRatio >= 1.0 && aspectRatio <= 2.0;
        break;
      case 'fullscreen':
        aspectRatioOptimal = aspectRatio >= 1.2 && aspectRatio <= 2.5;
        break;
    }

    return {
      gridUtilization,
      screenUtilization,
      aspectRatioOptimal
    };
  }
}
