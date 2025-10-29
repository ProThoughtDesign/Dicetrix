import Logger from '../../utils/Logger';

/**
 * Interface defining a rectangular layout area
 */
export interface LayoutArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Interface for button group layout metrics
 */
export interface ButtonGroupMetrics {
  area: LayoutArea;
  buttonSize: number;
  spacing: number;
  rows: number;
  cols: number;
}

/**
 * Configuration for the bottom section layout
 */
export interface BottomSectionConfig {
  screenWidth: number;
  screenHeight: number;
  bottomSectionHeight: number;
  buttonSize: number;
  groupSpacing: number;
  internalSpacing: number;
}

/**
 * Default layout configuration for 1920x1080 screens
 */
export const DEFAULT_BOTTOM_SECTION_CONFIG: BottomSectionConfig = {
  screenWidth: 1920,
  screenHeight: 1080,
  bottomSectionHeight: 480,
  buttonSize: 128,
  groupSpacing: 40,
  internalSpacing: 8,
};

/**
 * Manages the layout of elements in the bottom section of the game screen.
 * Organizes Next Piece, Control Buttons, and Boosters groups with proper spacing.
 */
export class BottomSectionLayoutManager {
  private config: BottomSectionConfig;
  private bottomSectionY: number;

  constructor(config: BottomSectionConfig = DEFAULT_BOTTOM_SECTION_CONFIG) {
    this.config = config;
    this.bottomSectionY = config.screenHeight - config.bottomSectionHeight;
    
    Logger.log(`BottomSectionLayoutManager initialized for ${config.screenWidth}x${config.screenHeight}`);
  }

  /**
   * Updates the configuration and recalculates the bottom section Y position
   */
  public updateConfig(config: Partial<BottomSectionConfig>): void {
    this.config = { ...this.config, ...config };
    this.bottomSectionY = this.config.screenHeight - this.config.bottomSectionHeight;
    
    Logger.log(`BottomSectionLayoutManager config updated`);
  }

  /**
   * Calculates the layout area for the Next Piece group (left portion)
   */
  public calculateNextPieceArea(): LayoutArea {
    const nextPieceWidth = this.calculateNextPieceWidth();
    
    return {
      x: this.config.groupSpacing,
      y: this.bottomSectionY + this.config.groupSpacing,
      width: nextPieceWidth,
      height: this.config.bottomSectionHeight - (2 * this.config.groupSpacing),
    };
  }

  /**
   * Calculates the layout area for the Control Buttons group (center portion)
   */
  public calculateControlButtonsArea(): LayoutArea {
    const nextPieceWidth = this.calculateNextPieceWidth();
    const controlsWidth = (this.config.buttonSize * 3) + (this.config.internalSpacing * 2);
    const controlsHeight = (this.config.buttonSize * 2) + this.config.internalSpacing;
    
    const startX = this.config.groupSpacing + nextPieceWidth + this.config.groupSpacing;
    
    return {
      x: startX,
      y: this.bottomSectionY + this.config.groupSpacing,
      width: controlsWidth,
      height: controlsHeight,
    };
  }

  /**
   * Calculates the layout area for the Boosters group (right portion)
   */
  public calculateBoostersArea(): LayoutArea {
    const controlsArea = this.calculateControlButtonsArea();
    const boostersWidth = (this.config.buttonSize * 3) + (this.config.internalSpacing * 2);
    const boostersHeight = (this.config.buttonSize * 3) + (this.config.internalSpacing * 2);
    
    const startX = controlsArea.x + controlsArea.width + this.config.groupSpacing;
    
    return {
      x: startX,
      y: this.bottomSectionY + this.config.groupSpacing,
      width: boostersWidth,
      height: boostersHeight,
    };
  }

  /**
   * Gets button group metrics for the Control Buttons (2x3 grid)
   */
  public getControlButtonsMetrics(): ButtonGroupMetrics {
    const area = this.calculateControlButtonsArea();
    
    return {
      area,
      buttonSize: this.config.buttonSize,
      spacing: this.config.internalSpacing,
      rows: 2,
      cols: 3,
    };
  }

  /**
   * Gets button group metrics for the Boosters (3x3 grid)
   */
  public getBoostersMetrics(): ButtonGroupMetrics {
    const area = this.calculateBoostersArea();
    
    return {
      area,
      buttonSize: this.config.buttonSize,
      spacing: this.config.internalSpacing,
      rows: 3,
      cols: 3,
    };
  }

  /**
   * Validates that all elements fit within the bottom section area
   */
  public validateLayout(): { isValid: boolean; error?: string; recommendation?: string } {
    const nextArea = this.calculateNextPieceArea();
    const controlsArea = this.calculateControlButtonsArea();
    const boostersArea = this.calculateBoostersArea();
    
    // Calculate total width needed
    const totalWidth = boostersArea.x + boostersArea.width + this.config.groupSpacing;
    const availableWidth = this.config.screenWidth;
    
    if (totalWidth > availableWidth) {
      return {
        isValid: false,
        error: `Bottom section elements exceed available width: ${totalWidth} > ${availableWidth}`,
        recommendation: 'Reduce button size or spacing',
      };
    }
    
    // Check if elements fit within bottom section height
    const maxElementHeight = Math.max(
      nextArea.height,
      controlsArea.height,
      boostersArea.height
    );
    
    if (maxElementHeight > this.config.bottomSectionHeight - (2 * this.config.groupSpacing)) {
      return {
        isValid: false,
        error: `Elements exceed bottom section height`,
        recommendation: 'Reduce button size or bottom section height',
      };
    }
    
    return { isValid: true };
  }

  /**
   * Gets the Y coordinate where the bottom section starts
   */
  public getBottomSectionY(): number {
    return this.bottomSectionY;
  }

  /**
   * Gets the current configuration
   */
  public getConfig(): BottomSectionConfig {
    return { ...this.config };
  }

  /**
   * Calculates the width needed for the Next Piece section
   * Based on label width and display area requirements
   */
  private calculateNextPieceWidth(): number {
    // Reserve space for "Next Piece" label and 4x4 preview grid
    // Minimum width to accommodate label text and preview display
    const minLabelWidth = 150; // Approximate width for "Next Piece" text
    const previewSize = this.config.buttonSize; // Use button size for preview area
    const padding = 20; // Internal padding
    
    return Math.max(minLabelWidth, previewSize + padding);
  }

  /**
   * Creates visual border graphics for a layout area
   * Returns graphics configuration for consistent styling
   */
  public createBorderStyle(): {
    color: number;
    alpha: number;
    thickness: number;
    cornerRadius: number;
  } {
    return {
      color: 0x00ff88,
      alpha: 0.3,
      thickness: 2,
      cornerRadius: 8,
    };
  }

  /**
   * Calculates position for individual buttons within a button group
   */
  public calculateButtonPosition(
    groupArea: LayoutArea,
    row: number,
    col: number,
    buttonSize: number,
    spacing: number
  ): { x: number; y: number } {
    return {
      x: groupArea.x + (col * (buttonSize + spacing)),
      y: groupArea.y + (row * (buttonSize + spacing)),
    };
  }

  /**
   * Gets all layout areas for debugging and validation
   */
  public getAllAreas(): {
    nextPiece: LayoutArea;
    controls: LayoutArea;
    boosters: LayoutArea;
  } {
    return {
      nextPiece: this.calculateNextPieceArea(),
      controls: this.calculateControlButtonsArea(),
      boosters: this.calculateBoostersArea(),
    };
  }
}
