import { DisplayMode, Dimensions } from './ResponsiveUISystem.js';

export type FontImportance = 'critical' | 'primary' | 'secondary' | 'tertiary';

export interface ScalingRules {
  mobile: {
    fontMultiplier: number;
    minFontSize: number;
    touchTarget: number;
    cellSize: number;
  };
  desktop: {
    fontMultiplier: number;
    minFontSize: number;
    touchTarget: number;
    cellSize: number;
  };
  fullscreen: {
    fontMultiplier: number;
    maxFontSize: number;
    touchTarget: number;
    cellSizeRange: { min: number; max: number };
  };
}

/**
 * ScalingCalculator - Handles dynamic scaling calculations for UI elements
 * Provides consistent scaling formulas across all display modes
 */
export class ScalingCalculator {
  private readonly scalingRules: ScalingRules = {
    mobile: {
      fontMultiplier: 0.75,
      minFontSize: 16,
      touchTarget: 44,
      cellSize: 24
    },
    desktop: {
      fontMultiplier: 0.65,
      minFontSize: 20,
      touchTarget: 32,
      cellSize: 32
    },
    fullscreen: {
      fontMultiplier: 0.6,
      maxFontSize: 48,
      touchTarget: 40,
      cellSizeRange: { min: 32, max: 128 }
    }
  };

  /**
   * Calculate optimal cell size based on screen dimensions and display mode
   */
  public calculateCellSize(dimensions: Dimensions, mode: DisplayMode): number {
    switch (mode) {
      case 'mobile':
        return this.scalingRules.mobile.cellSize;
      
      case 'desktop':
        return this.scalingRules.desktop.cellSize;
      
      case 'fullscreen':
        return this.calculateFullscreenCellSize(dimensions);
    }
  }

  /**
   * Calculate font size based on base size, display mode, and importance
   */
  public calculateFontSize(baseSize: number, mode: DisplayMode, importance: FontImportance = 'primary'): number {
    const importanceMultiplier = this.getImportanceMultiplier(importance);
    let calculatedSize: number;

    switch (mode) {
      case 'mobile':
        calculatedSize = Math.max(
          this.scalingRules.mobile.minFontSize,
          Math.floor(baseSize * this.scalingRules.mobile.fontMultiplier * importanceMultiplier)
        );
        break;
      
      case 'desktop':
        calculatedSize = Math.max(
          this.scalingRules.desktop.minFontSize,
          Math.floor(baseSize * this.scalingRules.desktop.fontMultiplier * importanceMultiplier)
        );
        break;
      
      case 'fullscreen':
        calculatedSize = Math.min(
          this.scalingRules.fullscreen.maxFontSize,
          Math.max(24, Math.floor(baseSize * this.scalingRules.fullscreen.fontMultiplier * importanceMultiplier))
        );
        break;
    }

    return calculatedSize;
  }

  /**
   * Calculate spacing based on base spacing and cell size
   */
  public calculateSpacing(baseSpacing: number, cellSize: number): number {
    // Scale spacing proportionally to cell size
    const scaleFactor = cellSize / 32; // 32 is the reference cell size
    return Math.max(1, Math.floor(baseSpacing * scaleFactor));
  }

  /**
   * Calculate touch target size based on display mode
   */
  public calculateTouchTargetSize(baseSize: number, mode: DisplayMode): number {
    const minSize = this.scalingRules[mode].touchTarget;
    return Math.max(minSize, baseSize);
  }

  /**
   * Calculate overall scaling factor for the display mode
   */
  public calculateScalingFactor(mode: DisplayMode, cellSize: number): number {
    const referenceCellSize = 32; // Desktop reference
    return cellSize / referenceCellSize;
  }

  /**
   * Calculate stroke thickness for text based on cell size
   */
  public calculateStrokeThickness(cellSize: number): number {
    if (cellSize <= 24) {
      return 2; // Thinner stroke for small cells
    } else if (cellSize <= 32) {
      return 3; // Standard stroke
    } else {
      return Math.max(3, Math.floor(cellSize / 12)); // Scale with size
    }
  }

  /**
   * Calculate border size based on cell size
   */
  public calculateBorderSize(cellSize: number): number {
    return Math.max(1, Math.floor(cellSize / 24)); // Proportional to cell size
  }

  /**
   * Calculate fullscreen cell size based on available space
   */
  private calculateFullscreenCellSize(dimensions: Dimensions): number {
    const { width, height } = dimensions;
    const { min, max } = this.scalingRules.fullscreen.cellSizeRange;
    
    // Grid is 10x20, leave space for UI (200px on sides, 200px top/bottom)
    const availableWidth = width - 400;
    const availableHeight = height - 400;
    
    const maxCellByWidth = Math.floor(availableWidth / 10);
    const maxCellByHeight = Math.floor(availableHeight / 20);
    const calculatedSize = Math.min(maxCellByWidth, maxCellByHeight);
    
    // Clamp to min/max range
    return Math.max(min, Math.min(max, calculatedSize));
  }

  /**
   * Get font size multiplier based on importance level
   */
  private getImportanceMultiplier(importance: FontImportance): number {
    switch (importance) {
      case 'critical':
        return 1.4; // 40% larger
      case 'primary':
        return 1.0; // Base size
      case 'secondary':
        return 0.85; // 15% smaller
      case 'tertiary':
        return 0.7; // 30% smaller
    }
  }

  /**
   * Calculate responsive margin based on display mode and element type
   */
  public calculateMargin(baseMargin: number, mode: DisplayMode): number {
    const scaleFactor = this.getDisplayModeScaleFactor(mode);
    return Math.max(4, Math.floor(baseMargin * scaleFactor));
  }

  /**
   * Calculate responsive padding based on display mode
   */
  public calculatePadding(basePadding: number, mode: DisplayMode): number {
    const scaleFactor = this.getDisplayModeScaleFactor(mode);
    return Math.max(2, Math.floor(basePadding * scaleFactor));
  }

  /**
   * Get general scale factor for display mode
   */
  private getDisplayModeScaleFactor(mode: DisplayMode): number {
    switch (mode) {
      case 'mobile':
        return 0.8;
      case 'desktop':
        return 1.0;
      case 'fullscreen':
        return 1.5;
    }
  }

  /**
   * Calculate optimal line height for text
   */
  public calculateLineHeight(fontSize: number): number {
    return Math.max(fontSize * 1.2, fontSize + 4);
  }

  /**
   * Calculate icon size based on display mode and context
   */
  public calculateIconSize(baseSize: number, mode: DisplayMode): number {
    const scaleFactor = this.getDisplayModeScaleFactor(mode);
    return Math.max(16, Math.floor(baseSize * scaleFactor));
  }

  /**
   * Get scaling rules for external use
   */
  public getScalingRules(): ScalingRules {
    return { ...this.scalingRules };
  }

  /**
   * Update scaling rules (for testing or customization)
   */
  public updateScalingRules(newRules: Partial<ScalingRules>): void {
    Object.assign(this.scalingRules, newRules);
    console.log('Scaling rules updated:', this.scalingRules);
  }

  /**
   * Calculate responsive dimensions for UI elements
   */
  public calculateElementDimensions(
    baseWidth: number,
    baseHeight: number,
    mode: DisplayMode
  ): { width: number; height: number } {
    const scaleFactor = this.getDisplayModeScaleFactor(mode);
    
    return {
      width: Math.floor(baseWidth * scaleFactor),
      height: Math.floor(baseHeight * scaleFactor)
    };
  }

  /**
   * Calculate minimum viable sizes for elements
   */
  public getMinimumSizes(mode: DisplayMode): {
    cellSize: number;
    fontSize: number;
    touchTarget: number;
    spacing: number;
  } {
    switch (mode) {
      case 'mobile':
        return {
          cellSize: 20,
          fontSize: this.scalingRules.mobile.minFontSize,
          touchTarget: this.scalingRules.mobile.touchTarget,
          spacing: 4
        };
      
      case 'desktop':
        return {
          cellSize: 24,
          fontSize: this.scalingRules.desktop.minFontSize,
          touchTarget: this.scalingRules.desktop.touchTarget,
          spacing: 8
        };
      
      case 'fullscreen':
        return {
          cellSize: this.scalingRules.fullscreen.cellSizeRange.min,
          fontSize: 24,
          touchTarget: this.scalingRules.fullscreen.touchTarget,
          spacing: 12
        };
    }
  }
}
