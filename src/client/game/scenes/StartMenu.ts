import { Scene } from 'phaser';
import { audioHandler } from '../services/AudioHandler';
import { SettingsManager } from '../../../shared/services/SettingsManager';
import Logger from '../../utils/Logger';

/**
 * Interface for standardized button dimensions
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
interface ButtonDimensions {
  width: number;
  height: number;
  fontSize: number;
  paddingX: number;
  paddingY: number;
}

/**
 * Interface for perfect 2x2 grid layout calculations
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
interface GridLayoutCalculation {
  gridCenterX: number;
  gridCenterY: number;
  gridWidth: number;
  gridHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  positions: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}

/**
 * Standardized button factory interface for consistent button creation
 * Requirements: 1.1, 1.2, 1.3, 1.5, 6.1, 6.2, 6.3
 */
interface StandardButtonConfig {
  x: number;
  y: number;
  text: string;
  onClick: () => void;
  type: 'text' | 'square';
  customSize?: number; // For square buttons like audio button
  disabled?: boolean; // For disabled state visual indicators
  loading?: boolean; // For loading state visual indicators
}

/**
 * Visual feedback configuration for consistent button interactions
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
interface VisualFeedbackConfig {
  normalColor: number;
  hoverColor: number;
  pressColor: number;
  disabledColor: number;
  loadingColor: number;
  feedbackDuration: number;
  scaleEffect: number;
  textColor: string;
  disabledTextColor: string;
}

export class StartMenu extends Scene {
  // Audio button state management
  private audioButton: Phaser.GameObjects.Rectangle | null = null;
  private audioIcon: Phaser.GameObjects.Text | null = null;
  private audioButtonState: 'muted' | 'unmuted' | 'loading' = 'muted';
  private isAudioInitializing = false;

  // Standardized button dimensions with responsive caching
  private standardButtonDimensions: ButtonDimensions | null = null;
  private lastDimensionsCacheKey: string | null = null;

  // Settings Manager integration
  private settingsManager: SettingsManager;
  private settingsSubscriptions: (() => void)[] = [];

  // Button references for consistent visual feedback and state management
  // Requirements: 7.4, 7.5
  private buttonReferences: {
    settings?: any;
    howToPlay?: any;
    leaderboard?: any;
    audio?: any;
  } = {};

  constructor() {
    super('StartMenu');
    this.settingsManager = SettingsManager.getInstance();
  }

  /**
   * Calculate standardized button dimensions based on longest text content
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   * @param uiScale - UI scaling factor
   * @returns Standardized button dimensions for all buttons
   */
  private calculateStandardButtonDimensions(uiScale: number): ButtonDimensions {
    // Define all button texts to find the longest one
    const buttonTexts = ['SETTINGS', 'HOW TO PLAY', 'LEADERBOARD'];
    
    // Standardized font size and padding
    const fontSize = 24 * uiScale;
    const paddingX = 25 * uiScale;
    const paddingY = 12 * uiScale;
    
    // Calculate maximum required width based on longest text content
    let maxTextWidth = 0;
    
    // Use a more accurate text width calculation
    // Average character width for the Asimovian font is approximately 0.6 of font size
    const avgCharWidth = fontSize * 0.6;
    
    for (const text of buttonTexts) {
      const textWidth = text.length * avgCharWidth;
      maxTextWidth = Math.max(maxTextWidth, textWidth);
    }
    
    // Calculate standardized dimensions
    const standardWidth = maxTextWidth + (paddingX * 2);
    const standardHeight = fontSize + (paddingY * 2);
    
    return {
      width: Math.round(standardWidth),
      height: Math.round(standardHeight),
      fontSize: fontSize,
      paddingX: paddingX,
      paddingY: paddingY
    };
  }

  /**
   * Get or calculate responsive standardized button dimensions
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.4, 5.5
   * @param uiScale - UI scaling factor
   * @param screenWidth - Current screen width for responsive calculations
   * @param screenHeight - Current screen height for responsive calculations
   * @returns Responsive standardized button dimensions
   */
  private getResponsiveStandardButtonDimensions(uiScale: number, screenWidth: number, screenHeight: number): ButtonDimensions {
    // Calculate base dimensions
    const baseDimensions = this.calculateStandardButtonDimensions(uiScale);
    
    // Apply responsive sizing to ensure proper touch targets and scaling
    const responsiveWidth = this.calculateResponsiveButtonSize(
      baseDimensions.width, 
      screenWidth, 
      screenHeight, 
      uiScale, 
      false // isSquareButton
    );
    
    const responsiveHeight = this.calculateResponsiveButtonSize(
      baseDimensions.height, 
      screenWidth, 
      screenHeight, 
      uiScale, 
      false // isSquareButton
    );
    
    // Maintain aspect ratio while ensuring minimum touch targets
    const aspectRatio = baseDimensions.width / baseDimensions.height;
    let finalWidth = responsiveWidth;
    let finalHeight = responsiveHeight;
    
    // Ensure width accommodates height with proper aspect ratio
    const widthFromHeight = finalHeight * aspectRatio;
    if (widthFromHeight > finalWidth) {
      finalWidth = widthFromHeight;
    }
    
    // Ensure height accommodates width with proper aspect ratio
    const heightFromWidth = finalWidth / aspectRatio;
    if (heightFromWidth > finalHeight) {
      finalHeight = heightFromWidth;
    }
    
    return {
      width: Math.round(finalWidth),
      height: Math.round(finalHeight),
      fontSize: baseDimensions.fontSize,
      paddingX: baseDimensions.paddingX,
      paddingY: baseDimensions.paddingY
    };
  }

  /**
   * Get or calculate standardized button dimensions (cached for performance)
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.4, 5.5
   * @param uiScale - UI scaling factor
   * @returns Cached or newly calculated standardized button dimensions
   */
  private getStandardButtonDimensions(uiScale: number): ButtonDimensions {
    // For responsive behavior, we need current screen dimensions
    const { width, height } = this.scale;
    
    // Cache dimensions to avoid recalculation, but include screen size in cache key
    const cacheKey = `${uiScale}-${width}-${height}`;
    if (!this.standardButtonDimensions || this.lastDimensionsCacheKey !== cacheKey) {
      this.standardButtonDimensions = this.getResponsiveStandardButtonDimensions(uiScale, width, height);
      this.lastDimensionsCacheKey = cacheKey;
      Logger.log(`StartMenu: Calculated responsive standard button dimensions - width: ${this.standardButtonDimensions.width}, height: ${this.standardButtonDimensions.height} for screen ${width}x${height}`);
    }
    return this.standardButtonDimensions;
  }

  /**
   * Get consistent visual feedback configuration for all buttons
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   * @returns Visual feedback configuration with consistent colors and timing
   */
  private getVisualFeedbackConfig(): VisualFeedbackConfig {
    const isTouchDevice = this.detectTouchDevice();
    
    return {
      normalColor: 0x666666,
      hoverColor: 0x888888,
      pressColor: 0x444444,
      disabledColor: 0x444444,
      loadingColor: 0x555555,
      feedbackDuration: isTouchDevice ? 150 : 100, // Longer feedback for touch devices
      scaleEffect: isTouchDevice ? 0.95 : 0.98, // More pronounced scale for touch
      textColor: '#ffffff',
      disabledTextColor: '#888888'
    };
  }

  /**
   * Apply consistent visual feedback to a button rectangle
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   * @param buttonRect - Button rectangle to apply feedback to
   * @param textElement - Optional text element to update color
   * @param config - Button configuration for state management
   * @param feedbackConfig - Visual feedback configuration
   */
  private applyConsistentVisualFeedback(
    buttonRect: Phaser.GameObjects.Rectangle,
    textElement: Phaser.GameObjects.Text | null,
    config: StandardButtonConfig,
    feedbackConfig: VisualFeedbackConfig
  ): void {
    const isTouchDevice = this.detectTouchDevice();
    
    // Store original state for restoration
    const originalScale = buttonRect.scaleX;
    
    // Apply hover effects only on desktop devices (Requirement 7.1)
    if (!isTouchDevice) {
      buttonRect.on('pointerover', () => {
        if (!config.disabled && !config.loading) {
          buttonRect.setFillStyle(feedbackConfig.hoverColor);
        }
      });
      
      buttonRect.on('pointerout', () => {
        if (!config.disabled && !config.loading) {
          buttonRect.setFillStyle(feedbackConfig.normalColor);
        }
      });
    }
    
    // Apply press feedback for all devices (Requirements 7.2, 7.3)
    buttonRect.on('pointerdown', () => {
      if (!config.disabled && !config.loading) {
        // Immediate visual feedback for press action (Requirement 7.2)
        buttonRect.setFillStyle(feedbackConfig.pressColor);
        buttonRect.setScale(originalScale * feedbackConfig.scaleEffect);
        
        // Return to normal state after feedback duration (Requirement 7.4)
        this.time.delayedCall(feedbackConfig.feedbackDuration, () => {
          if (buttonRect && buttonRect.active) {
            buttonRect.setFillStyle(feedbackConfig.normalColor);
            buttonRect.setScale(originalScale);
          }
        });
      }
    });
    
    // Apply loading and disabled state visual indicators (Requirement 7.5)
    this.updateButtonVisualState(buttonRect, textElement, config, feedbackConfig);
  }

  /**
   * Update button visual state for loading and disabled states
   * Requirements: 7.4, 7.5
   * @param buttonRect - Button rectangle to update
   * @param textElement - Optional text element to update
   * @param config - Button configuration with state information
   * @param feedbackConfig - Visual feedback configuration
   */
  private updateButtonVisualState(
    buttonRect: Phaser.GameObjects.Rectangle,
    textElement: Phaser.GameObjects.Text | null,
    config: StandardButtonConfig,
    feedbackConfig: VisualFeedbackConfig
  ): void {
    if (config.disabled) {
      // Apply disabled state visual indicators (Requirement 7.5)
      buttonRect.setFillStyle(feedbackConfig.disabledColor);
      buttonRect.setAlpha(0.6);
      buttonRect.disableInteractive();
      
      if (textElement) {
        textElement.setColor(feedbackConfig.disabledTextColor);
        textElement.setAlpha(0.6);
      }
      
      Logger.log(`StartMenu: Button "${config.text}" set to disabled state`);
      
    } else if (config.loading) {
      // Apply loading state visual indicators (Requirement 7.5)
      buttonRect.setFillStyle(feedbackConfig.loadingColor);
      buttonRect.disableInteractive();
      
      // Add pulsing effect for loading state
      this.tweens.add({
        targets: buttonRect,
        alpha: { from: 1.0, to: 0.7 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      if (textElement) {
        textElement.setColor(feedbackConfig.textColor);
        // Add pulsing effect to text as well
        this.tweens.add({
          targets: textElement,
          alpha: { from: 1.0, to: 0.7 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      
      Logger.log(`StartMenu: Button "${config.text}" set to loading state`);
      
    } else {
      // Normal state - ensure button is interactive and properly styled
      buttonRect.setFillStyle(feedbackConfig.normalColor);
      buttonRect.setAlpha(1.0);
      buttonRect.setInteractive({ useHandCursor: true });
      
      if (textElement) {
        textElement.setColor(feedbackConfig.textColor);
        textElement.setAlpha(1.0);
      }
    }
  }

  /**
   * Create a standardized button using factory pattern with consistent styling and visual feedback
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5
   * @param config - Button configuration object
   * @param uiScale - UI scaling factor
   * @returns Created button object with standardized styling and consistent visual feedback
   */
  private createStandardizedButton(
    config: StandardButtonConfig, 
    uiScale: number
  ): Phaser.GameObjects.Text | { button: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Text } {
    const dimensions = this.getStandardButtonDimensions(uiScale);
    const feedbackConfig = this.getVisualFeedbackConfig();
    
    if (config.type === 'text') {
      // Create standardized text button using rectangle + text for exact size control
      // This ensures all buttons have identical dimensions regardless of text content
      const buttonRect = this.add
        .rectangle(config.x, config.y, dimensions.width, dimensions.height, feedbackConfig.normalColor)
        .setOrigin(0.5)
        .setStrokeStyle(1, 0x000000, 0.2)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', config.onClick);

      // Create text overlay with exact positioning (NOT interactive to avoid conflicts)
      const buttonText = this.add
        .text(config.x, config.y, config.text, {
          fontSize: `${dimensions.fontSize}px`,
          color: feedbackConfig.textColor,
          fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
          stroke: '#000000',
          strokeThickness: 1,
        })
        .setOrigin(0.5);

      // Apply consistent visual feedback to the button (Requirements 7.1, 7.2, 7.3, 7.4, 7.5)
      this.applyConsistentVisualFeedback(buttonRect, buttonText, config, feedbackConfig);

      Logger.log(`StartMenu: Standardized text button created with consistent visual feedback - "${config.text}" with exact dimensions: ${dimensions.width}x${dimensions.height}`);

      // Return a composite object that behaves like the old text button
      const compositeButton = buttonText; // Use text as the main object for backward compatibility
      
      // Store reference to rectangle for visual feedback effects
      (compositeButton as any).buttonRect = buttonRect;
      (compositeButton as any).feedbackConfig = feedbackConfig;
      (compositeButton as any).buttonConfig = config;
      
      // Override setStyle method to affect the rectangle
      const originalSetStyle = compositeButton.setStyle.bind(compositeButton);
      compositeButton.setStyle = (style: any) => {
        if (style.backgroundColor) {
          buttonRect.setFillStyle(parseInt(style.backgroundColor.replace('#', '0x')));
        }
        return originalSetStyle(style);
      };

      return compositeButton;
    } else if (config.type === 'square') {
      // Create standardized square button (for audio button)
      // Use standardized button height as the square size, or custom size if provided
      const squareSize = config.customSize || dimensions.height;
      
      const button = this.add
        .rectangle(config.x, config.y, squareSize, squareSize, feedbackConfig.normalColor)
        .setOrigin(0.5)
        .setStrokeStyle(1, 0x000000, 0.2)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', config.onClick);

      // Create icon for square button using standardized sizing (NOT interactive to avoid conflicts)
      const iconSize = this.calculateResponsiveIconSize(squareSize, uiScale);
      const icon = this.add
        .text(config.x, config.y, config.text, {
          fontSize: `${iconSize}px`,
          color: feedbackConfig.textColor,
          fontFamily: 'Arial', // Use Arial for better emoji support
        })
        .setOrigin(0.5);

      // Apply consistent visual feedback to the square button (Requirements 7.1, 7.2, 7.3, 7.4, 7.5)
      this.applyConsistentVisualFeedback(button, icon, config, feedbackConfig);

      Logger.log(`StartMenu: Square button created with consistent visual feedback - size: ${squareSize}x${squareSize}, icon size: ${iconSize}`);

      return { button, icon };
    }

    throw new Error(`Unknown button type: ${config.type}`);
  }

  /**
   * Legacy method for backward compatibility - delegates to new factory
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   * @param x - X position for the button center
   * @param y - Y position for the button center
   * @param text - Button text content
   * @param onClick - Click handler function
   * @param uiScale - UI scaling factor
   * @returns Created Phaser text object with standardized styling
   */
  private createStandardButton(
    x: number, 
    y: number, 
    text: string, 
    onClick: () => void, 
    uiScale: number
  ): Phaser.GameObjects.Text {
    const result = this.createStandardizedButton({
      x, y, text, onClick, type: 'text'
    }, uiScale);
    
    if (result instanceof Phaser.GameObjects.Text) {
      return result;
    }
    
    throw new Error('Expected text button from factory');
  }

  /**
   * Validate that the standardized button sizing system is working correctly
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   * @param uiScale - UI scaling factor
   */
  private validateStandardizedButtonSizing(uiScale: number): void {
    const dimensions = this.getStandardButtonDimensions(uiScale);
    const buttonTexts = ['SETTINGS', 'HOW TO PLAY', 'LEADERBOARD'];
    
    // Verify that dimensions are consistent and reasonable
    const isValidWidth = dimensions.width > 0 && dimensions.width < 1000;
    const isValidHeight = dimensions.height > 0 && dimensions.height < 200;
    const isValidFontSize = dimensions.fontSize === 24 * uiScale;
    const isValidPadding = dimensions.paddingX === 25 * uiScale && dimensions.paddingY === 12 * uiScale;
    
    // Verify that the width can accommodate the longest text
    const longestText = buttonTexts.reduce((a, b) => a.length > b.length ? a : b);
    const expectedMinWidth = longestText.length * (dimensions.fontSize * 0.6) + (dimensions.paddingX * 2);
    const isWidthSufficient = dimensions.width >= expectedMinWidth;
    
    if (isValidWidth && isValidHeight && isValidFontSize && isValidPadding && isWidthSufficient) {
      Logger.log(`StartMenu: Standardized button sizing validation PASSED - all buttons will use consistent dimensions`);
    } else {
      Logger.log(`StartMenu: Standardized button sizing validation FAILED - width: ${isValidWidth}, height: ${isValidHeight}, fontSize: ${isValidFontSize}, padding: ${isValidPadding}, widthSufficient: ${isWidthSufficient}`);
    }
    
    // Log the calculation details for verification
    Logger.log(`StartMenu: Button sizing details - longest text: "${longestText}" (${longestText.length} chars), expected min width: ${expectedMinWidth}px, actual width: ${dimensions.width}px`);
  }

  /**
   * Calculate perfect 2x2 grid layout with centered positioning and equal spacing
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   * @param screenWidth - Canvas width
   * @param screenHeight - Canvas height
   * @param buttonWidth - Standardized button width
   * @param buttonHeight - Standardized button height
   * @param uiScale - UI scaling factor
   * @returns Perfect 2x2 grid layout calculations
   */
  private calculatePerfect2x2GridLayout(
    screenWidth: number, 
    screenHeight: number, 
    buttonWidth: number, 
    buttonHeight: number, 
    uiScale: number
  ): GridLayoutCalculation {
    // Calculate responsive spacing that maintains proportions when UI scaling is applied (Requirements 2.5, 5.2, 5.3, 5.4)
    const horizontalSpacing = this.calculateResponsiveButtonSpacing(screenWidth, screenHeight, uiScale);
    const verticalSpacing = horizontalSpacing; // Equal spacing for perfect grid symmetry
    
    // Calculate total grid dimensions using standardized button sizes and equal spacing
    const gridWidth = (buttonWidth * 2) + horizontalSpacing;
    const gridHeight = (buttonHeight * 2) + verticalSpacing;
    
    // Center the entire grid horizontally on the screen (Requirement 2.2)
    const gridCenterX = screenWidth / 2;
    const gridCenterY = screenHeight * 0.75; // Position at 75% of screen height
    
    // Calculate grid boundaries for perfect centering
    const gridLeft = gridCenterX - (gridWidth / 2);
    const gridTop = gridCenterY - (gridHeight / 2);
    
    // Calculate individual button positions for perfect 2x2 grid with equal spacing
    // Requirements: 2.3, 2.4 - Equal horizontal and vertical spacing between buttons
    const positions = {
      // Top-left position (Settings button)
      topLeft: {
        x: gridLeft + (buttonWidth / 2),
        y: gridTop + (buttonHeight / 2)
      },
      // Top-right position (How To Play button) 
      topRight: {
        x: gridLeft + buttonWidth + horizontalSpacing + (buttonWidth / 2),
        y: gridTop + (buttonHeight / 2)
      },
      // Bottom-left position (Leaderboard button)
      bottomLeft: {
        x: gridLeft + (buttonWidth / 2),
        y: gridTop + buttonHeight + verticalSpacing + (buttonHeight / 2)
      },
      // Bottom-right position (Audio button)
      bottomRight: {
        x: gridLeft + buttonWidth + horizontalSpacing + (buttonWidth / 2),
        y: gridTop + buttonHeight + verticalSpacing + (buttonHeight / 2)
      }
    };
    
    // Log grid calculations for verification (Requirements 2.1, 2.2, 2.3, 2.4, 2.5)
    Logger.log(`StartMenu: Perfect 2x2 grid calculated - center: (${gridCenterX}, ${gridCenterY}), dimensions: ${gridWidth}x${gridHeight}, spacing: ${horizontalSpacing}x${verticalSpacing}`);
    Logger.log(`StartMenu: Grid positions - topLeft: (${positions.topLeft.x}, ${positions.topLeft.y}), topRight: (${positions.topRight.x}, ${positions.topRight.y}), bottomLeft: (${positions.bottomLeft.x}, ${positions.bottomLeft.y}), bottomRight: (${positions.bottomRight.x}, ${positions.bottomRight.y})`);
    
    return {
      gridCenterX,
      gridCenterY,
      gridWidth,
      gridHeight,
      horizontalSpacing,
      verticalSpacing,
      positions
    };
  }

  /**
   * Validate perfect 2x2 grid layout calculations
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   * @param gridLayout - Grid layout calculation results
   * @param screenWidth - Canvas width
   * @param screenHeight - Canvas height
   * @param buttonWidth - Standardized button width
   * @param buttonHeight - Standardized button height
   */
  private validatePerfect2x2GridLayout(
    gridLayout: GridLayoutCalculation,
    screenWidth: number,
    screenHeight: number,
    buttonWidth: number,
    buttonHeight: number
  ): void {
    const { gridCenterX, gridCenterY, gridWidth, gridHeight, horizontalSpacing, verticalSpacing, positions } = gridLayout;
    
    // Validate grid is centered horizontally (Requirement 2.2)
    const expectedCenterX = screenWidth / 2;
    const isCenteredHorizontally = Math.abs(gridCenterX - expectedCenterX) < 1;
    
    // Validate equal horizontal spacing (Requirement 2.3)
    const actualHorizontalSpacing = positions.topRight.x - positions.topLeft.x - buttonWidth;
    const isHorizontalSpacingEqual = Math.abs(actualHorizontalSpacing - horizontalSpacing) < 1;
    
    // Validate equal vertical spacing (Requirement 2.4)
    const actualVerticalSpacing = positions.bottomLeft.y - positions.topLeft.y - buttonHeight;
    const isVerticalSpacingEqual = Math.abs(actualVerticalSpacing - verticalSpacing) < 1;
    
    // Validate grid dimensions are correct
    const expectedGridWidth = (buttonWidth * 2) + horizontalSpacing;
    const expectedGridHeight = (buttonHeight * 2) + verticalSpacing;
    const isGridDimensionsCorrect = Math.abs(gridWidth - expectedGridWidth) < 1 && Math.abs(gridHeight - expectedGridHeight) < 1;
    
    // Validate perfect 2x2 positioning (Requirement 2.1)
    const isTopRowAligned = Math.abs(positions.topLeft.y - positions.topRight.y) < 1;
    const isBottomRowAligned = Math.abs(positions.bottomLeft.y - positions.bottomRight.y) < 1;
    const isLeftColumnAligned = Math.abs(positions.topLeft.x - positions.bottomLeft.x) < 1;
    const isRightColumnAligned = Math.abs(positions.topRight.x - positions.bottomRight.x) < 1;
    const isPerfect2x2Grid = isTopRowAligned && isBottomRowAligned && isLeftColumnAligned && isRightColumnAligned;
    
    // Log validation results
    if (isCenteredHorizontally && isHorizontalSpacingEqual && isVerticalSpacingEqual && isGridDimensionsCorrect && isPerfect2x2Grid) {
      Logger.log(`StartMenu: Perfect 2x2 grid layout validation PASSED - all requirements met`);
    } else {
      Logger.log(`StartMenu: Perfect 2x2 grid layout validation FAILED - centered: ${isCenteredHorizontally}, horizontalSpacing: ${isHorizontalSpacingEqual}, verticalSpacing: ${isVerticalSpacingEqual}, dimensions: ${isGridDimensionsCorrect}, perfect2x2: ${isPerfect2x2Grid}`);
    }
    
    // Log detailed measurements for debugging
    Logger.log(`StartMenu: Grid validation details - expectedCenterX: ${expectedCenterX}, actualCenterX: ${gridCenterX}, expectedHSpacing: ${horizontalSpacing}, actualHSpacing: ${actualHorizontalSpacing}, expectedVSpacing: ${verticalSpacing}, actualVSpacing: ${actualVerticalSpacing}`);
  }

  /**
   * Calculate button positioning layout using perfect 2x2 grid system
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5
   * @param screenWidth - Canvas width
   * @param screenHeight - Canvas height
   * @param dropdownWidth - Width of the difficulty dropdown
   * @param uiScale - UI scaling factor
   * @returns Layout calculations for button positioning
   */
  private calculateButtonLayout(screenWidth: number, screenHeight: number, dropdownWidth: number, uiScale: number) {
    // Dropdown position (existing)
    const dropdownX = screenWidth / 2;
    const dropdownY = screenHeight * 0.45;
    const dropdownLeft = dropdownX - dropdownWidth / 2;

    // Get standardized button dimensions for consistent sizing
    const standardDimensions = this.getStandardButtonDimensions(uiScale);
    
    // Calculate perfect 2x2 grid layout with centered positioning and equal spacing
    // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
    const gridLayout = this.calculatePerfect2x2GridLayout(
      screenWidth,
      screenHeight,
      standardDimensions.width,
      standardDimensions.height,
      uiScale
    );
    
    // Validate the perfect 2x2 grid layout calculations
    this.validatePerfect2x2GridLayout(
      gridLayout,
      screenWidth,
      screenHeight,
      standardDimensions.width,
      standardDimensions.height
    );
    
    // Audio button uses responsive square dimensions with proper touch targets (Requirements 5.1, 5.2, 5.4, 5.5)
    const audioButtonSize = this.calculateResponsiveButtonSize(
      standardDimensions.height, 
      screenWidth, 
      screenHeight, 
      uiScale, 
      true // isSquareButton
    );

    return {
      // Dropdown reference
      dropdownX,
      dropdownY,
      dropdownLeft,
      dropdownWidth,
      
      // Standardized button dimensions (all buttons use these)
      standardButtonWidth: standardDimensions.width,
      standardButtonHeight: standardDimensions.height,
      
      // Perfect 2x2 grid button positions
      settingsButtonX: gridLayout.positions.topLeft.x,
      settingsButtonY: gridLayout.positions.topLeft.y,
      
      howToPlayButtonX: gridLayout.positions.topRight.x,
      howToPlayButtonY: gridLayout.positions.topRight.y,
      
      leaderboardButtonX: gridLayout.positions.bottomLeft.x,
      leaderboardButtonY: gridLayout.positions.bottomLeft.y,
      
      // Audio button uses bottom-right position but with square dimensions
      audioButtonX: gridLayout.positions.bottomRight.x,
      audioButtonY: gridLayout.positions.bottomRight.y,
      audioButtonSize,
      
      // Perfect 2x2 grid properties
      gridCenterX: gridLayout.gridCenterX,
      gridCenterY: gridLayout.gridCenterY,
      gridWidth: gridLayout.gridWidth,
      gridHeight: gridLayout.gridHeight,
      
      // Equal spacing values
      buttonSpacing: gridLayout.horizontalSpacing, // For backward compatibility
      horizontalSpacing: gridLayout.horizontalSpacing,
      verticalSpacing: gridLayout.verticalSpacing,
      
      // UI scaling
      uiScale
    };
  }

  /**
   * Calculate responsive button sizing that maintains minimum 44px touch targets on mobile
   * Requirements: 5.1, 5.2, 5.4, 5.5
   * @param baseSize - Base size from standardized button dimensions
   * @param screenWidth - Current screen width
   * @param screenHeight - Current screen height
   * @param uiScale - UI scaling factor
   * @param isSquareButton - Whether this is a square button (like audio button)
   * @returns Responsive button size that meets touch target requirements
   */
  private calculateResponsiveButtonSize(baseSize: number, screenWidth: number, screenHeight: number, uiScale: number, isSquareButton: boolean = false): number {
    // Minimum touch target size for mobile accessibility (44px minimum recommended)
    const MIN_TOUCH_TARGET = 44;
    const OPTIMAL_TOUCH_TARGET = 48;
    
    // Detect screen size categories for responsive behavior
    const screenSizeInfo = this.detectScreenSizeCategory(screenWidth, screenHeight);
    
    // Calculate minimum size based on UI scale and touch requirements
    const scaledMinTarget = MIN_TOUCH_TARGET;
    const scaledOptimalTarget = OPTIMAL_TOUCH_TARGET;
    
    // Start with base size but ensure it meets minimum requirements
    let buttonSize = Math.max(baseSize, scaledMinTarget);
    
    // Apply responsive sizing based on screen category
    switch (screenSizeInfo.category) {
      case 'mobile-portrait':
      case 'mobile-landscape':
        // On mobile devices, ensure optimal touch target size (Requirement 5.1)
        buttonSize = Math.max(buttonSize, scaledOptimalTarget);
        
        // On very small screens, limit maximum size to prevent UI overflow
        if (screenSizeInfo.isVerySmall) {
          const maxSizeRatio = isSquareButton ? 0.08 : 0.12; // Square buttons smaller to save space
          const maxSize = Math.min(screenWidth, screenHeight) * maxSizeRatio;
          buttonSize = Math.min(buttonSize, maxSize);
          
          // But still maintain minimum touch target
          buttonSize = Math.max(buttonSize, scaledMinTarget);
        }
        break;
        
      case 'tablet-portrait':
      case 'tablet-landscape':
        // On tablets, use optimal touch targets but allow larger sizes
        buttonSize = Math.max(buttonSize, scaledOptimalTarget);
        break;
        
      case 'desktop':
        // On desktop, prioritize visual consistency over touch targets
        // But still ensure reasonable minimum size for accessibility
        buttonSize = Math.max(buttonSize, scaledMinTarget);
        
        // On very large screens, prevent buttons from becoming too large (Requirement 5.5)
        if (screenSizeInfo.isVeryLarge) {
          const maxDesktopSize = isSquareButton ? 80 : 120;
          buttonSize = Math.min(buttonSize, maxDesktopSize);
        }
        break;
    }
    
    // Ensure button maintains proportions when UI scaling changes (Requirement 5.4)
    return Math.round(buttonSize);
  }

  /**
   * Detect screen size category for responsive layout decisions
   * Requirements: 5.2, 5.3, 5.4, 5.5
   * @param screenWidth - Current screen width
   * @param screenHeight - Current screen height
   * @returns Screen size category and additional size information
   */
  private detectScreenSizeCategory(screenWidth: number, screenHeight: number): {
    category: 'mobile-portrait' | 'mobile-landscape' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';
    isVerySmall: boolean;
    isVeryLarge: boolean;
    orientation: 'portrait' | 'landscape';
  } {
    const isPortrait = screenHeight > screenWidth;
    const orientation = isPortrait ? 'portrait' : 'landscape';
    
    // Define breakpoints for different device categories
    const MOBILE_MAX_WIDTH = 768;
    const TABLET_MAX_WIDTH = 1024;
    const VERY_SMALL_THRESHOLD = 480;
    const VERY_LARGE_THRESHOLD = 1920;
    
    const smallerDimension = Math.min(screenWidth, screenHeight);
    const largerDimension = Math.max(screenWidth, screenHeight);
    
    const isVerySmall = smallerDimension <= VERY_SMALL_THRESHOLD;
    const isVeryLarge = largerDimension >= VERY_LARGE_THRESHOLD;
    
    let category: 'mobile-portrait' | 'mobile-landscape' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';
    
    if (smallerDimension <= MOBILE_MAX_WIDTH) {
      category = isPortrait ? 'mobile-portrait' : 'mobile-landscape';
    } else if (smallerDimension <= TABLET_MAX_WIDTH) {
      category = isPortrait ? 'tablet-portrait' : 'tablet-landscape';
    } else {
      category = 'desktop';
    }
    
    return {
      category,
      isVerySmall,
      isVeryLarge,
      orientation
    };
  }

  /**
   * Calculate responsive audio button size ensuring proper touch target size on mobile
   * Requirements: 5.1, 5.2, 5.4, 5.5 (legacy method - delegates to new responsive system)
   * @param baseSize - Base size from settings button height
   * @param screenWidth - Current screen width
   * @param screenHeight - Current screen height
   * @param uiScale - UI scaling factor
   * @returns Responsive button size
   */
  private calculateResponsiveAudioButtonSize(baseSize: number, screenWidth: number, screenHeight: number, uiScale: number): number {
    return this.calculateResponsiveButtonSize(baseSize, screenWidth, screenHeight, uiScale, true);
  }

  /**
   * Calculate responsive button spacing with appropriate layout scaling
   * Requirements: 5.2, 5.3, 5.4, 5.5
   * @param screenWidth - Current screen width
   * @param screenHeight - Current screen height
   * @param uiScale - UI scaling factor
   * @returns Responsive spacing value that maintains grid alignment
   */
  private calculateResponsiveButtonSpacing(screenWidth: number, screenHeight: number, uiScale: number): number {
    const BASE_SPACING = 20;
    
    // Get screen size category for responsive decisions
    const screenInfo = this.detectScreenSizeCategory(screenWidth, screenHeight);
    
    let spacing = BASE_SPACING;
    
    // Apply responsive spacing based on screen category
    switch (screenInfo.category) {
      case 'mobile-portrait':
      case 'mobile-landscape':
        // On mobile, reduce spacing to fit better while maintaining usability
        spacing = screenInfo.isVerySmall ? 10 : 15;
        break;
        
      case 'tablet-portrait':
      case 'tablet-landscape':
        // On tablets, use moderate spacing
        spacing = 18;
        break;
        
      case 'desktop':
        // On desktop, use full spacing but limit on very large screens
        spacing = screenInfo.isVeryLarge ? 25 : BASE_SPACING;
        break;
    }
    
    // Apply UI scale factor while ensuring minimum spacing for touch targets
    const scaledSpacing = spacing * uiScale;
    const minSpacing = 8; // Minimum spacing to prevent buttons from touching
    
    return Math.round(Math.max(minSpacing, scaledSpacing));
  }

  /**
   * Legacy method for backward compatibility - delegates to new responsive system
   * Requirements: 5.2, 5.4
   * @param screenWidth - Current screen width
   * @param uiScale - UI scaling factor
   * @returns Responsive spacing value
   */
  private calculateResponsiveButtonSpacingLegacy(screenWidth: number, uiScale: number): number {
    // Use screen height as width for legacy compatibility (assumes square-ish screen)
    const estimatedHeight = screenWidth * 0.75; // Common aspect ratio approximation
    return this.calculateResponsiveButtonSpacing(screenWidth, estimatedHeight, uiScale);
  }

  preload(): void {
    // Load the Start button image from public assets
    // public assets are served from /assets/... when running the client
    this.load.image('start-btn-img', 'assets/startmenu/Dicetrix-StartGame.png');
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;

    // Set background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Ensure fonts are loaded before rendering text
    try {
      // Wait for document.fonts if available (most browsers). Use several fallbacks.
      const fontPromises: Promise<void>[] = [];
      // Nabla for title
      if (document && (document as any).fonts && (document as any).fonts.load) {
        fontPromises.push((document as any).fonts.load('16px "Nabla"'));
        fontPromises.push((document as any).fonts.load('16px "Asimovian"'));
      }
      // Also wait for the font system to be ready
      if ((document as any).fonts && (document as any).fonts.ready) {
        fontPromises.push((document as any).fonts.ready.then(() => {}));
      }
      if (fontPromises.length > 0) await Promise.all(fontPromises);
    } catch (e) {
      // If font loading fails, continue and let the browser fallback
      Logger.log('Font preloading failed or not supported: ' + e);
    }

    // Title using Nabla font. We will scale the text so its rendered width is ~900px.
    const title = this.add
      .text(width / 2, height * 0.3, 'DICETRIX', {
        fontSize: '200px',
        color: '#00ff88',
        fontFamily: 'Nabla',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    // Scale title to approximately 900px width
    try {
      const measuredWidth = title.width || title.getBounds().width || 1;
      const target = 900;
      const scale = target / measuredWidth;
      title.setScale(scale, scale);
    } catch (e) {
      // ignore scaling issues
    }

    // UI scale factor for buttons/dropdowns (scale up by 2x as requested)
    const UI_SCALE = 2;

    // Create start button as an image (preloaded in preload)
    let startImg: Phaser.GameObjects.Image | null = null;
    try {
      startImg = this.add.image(width / 2, height * 0.6, 'start-btn-img');
      startImg.setInteractive({ useHandCursor: true });
      startImg.on('pointerdown', () => this.startGame());
      // center origin
      startImg.setOrigin(0.5, 0.5);
      // Optionally scale the image if it's too large for screen width
      const maxImgW = Math.min(width * 0.8, 800);
      let s = 1;
      if (startImg.width > maxImgW) {
        s = maxImgW / startImg.width;
        startImg.setScale(s);
      }
      // Now scale to 2x current display size per request
      startImg.setScale((startImg.scaleX || 1) * UI_SCALE, (startImg.scaleY || 1) * UI_SCALE);

      // Add a centered label on top of the image
      const labelFontSize = Math.max(20, Math.floor(startImg.displayHeight * 0.25));
      const startLabel = this.add
        .text(startImg.x, startImg.y, 'START GAME', {
          fontSize: `${labelFontSize}px`,
          color: '#ffffff',
          fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5);
      // Ensure clicking the text also starts the game
      startLabel.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.startGame());
    } catch (e) {
      // Fallback: text button if image missing
      const startButton = this.add
        .text(width / 2, height * 0.6, 'START GAME', {
          fontSize: '40px',
          color: '#ffffff',
          fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
          backgroundColor: '#00ff88',
          padding: { x: 20, y: 10 },
          stroke: '#000000',
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => startButton.setStyle({ backgroundColor: '#00dd70' }))
        .on('pointerout', () => startButton.setStyle({ backgroundColor: '#00ff88' }))
        .on('pointerdown', () => this.startGame());
    }



    // Difficulty dropdown
    const modes = ['easy', 'medium', 'hard', 'expert', 'zen'];
    const modeLabels = {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert',
      zen: 'Zen',
    } as Record<string, string>;
    // User-specified palette (ordered). We'll map first five colors to the five modes.
    const palette = [0x00ff88, 0xffff33, 0xff3366, 0xff9933, 0xcc33ff];
    // Load persisted selection from Settings Manager if present
    const persisted = this.settingsManager.get<string>('game.selectedMode');
    const defaultMode = (this.registry.get('selectedMode') as string) || persisted || 'medium';

    const dropdownX = width / 2;
    const dropdownY = height * 0.45;

    // Fixed dropdown width (children will match this width)
    const DROPDOWN_WIDTH = 220;
    const DROPDOWN_HEIGHT = 36;
    const SCALED_DROPDOWN_WIDTH = DROPDOWN_WIDTH * UI_SCALE;
    const SCALED_DROPDOWN_HEIGHT = DROPDOWN_HEIGHT * UI_SCALE;

    // Calculate button layout positions using perfect 2x2 grid system
    const layout = this.calculateButtonLayout(width, height, SCALED_DROPDOWN_WIDTH, UI_SCALE);
    
    // Log standardized button dimensions for verification
    const standardDimensions = this.getStandardButtonDimensions(UI_SCALE);
    Logger.log(`StartMenu: Using standardized button dimensions - width: ${standardDimensions.width}px, height: ${standardDimensions.height}px, fontSize: ${standardDimensions.fontSize}px, padding: ${standardDimensions.paddingX}x${standardDimensions.paddingY}px`);
    
    // Log perfect 2x2 grid layout details for verification
    Logger.log(`StartMenu: Perfect 2x2 grid layout - center: (${layout.gridCenterX}, ${layout.gridCenterY}), dimensions: ${layout.gridWidth}x${layout.gridHeight}`);
    Logger.log(`StartMenu: Grid spacing - horizontal: ${layout.horizontalSpacing}px, vertical: ${layout.verticalSpacing}px`);
    Logger.log(`StartMenu: Button positions - Settings: (${layout.settingsButtonX}, ${layout.settingsButtonY}), HowToPlay: (${layout.howToPlayButtonX}, ${layout.howToPlayButtonY}), Leaderboard: (${layout.leaderboardButtonX}, ${layout.leaderboardButtonY}), Audio: (${layout.audioButtonX}, ${layout.audioButtonY})`);
    
    // Validate standardized button sizing system implementation
    this.validateStandardizedButtonSizing(UI_SCALE);

    const contrastTextColor = (n: number) => {
      const r = (n >> 16) & 0xff;
      const g = (n >> 8) & 0xff;
      const b = n & 0xff;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      return lum < 140 ? '#ffffff' : '#0b0b0b';
    };
    const darken = (n: number, factor = 0.85) => {
      const r = Math.max(0, Math.min(255, Math.floor(((n >> 16) & 0xff) * factor)));
      const g = Math.max(0, Math.min(255, Math.floor(((n >> 8) & 0xff) * factor)));
      const b = Math.max(0, Math.min(255, Math.floor((n & 0xff) * factor)));
      return (r << 16) | (g << 8) | b;
    };

    // Determine initial color from persisted/default mode
    const initialIndex = Math.max(0, modes.indexOf(defaultMode));
    const initialColor = palette[initialIndex % palette.length] ?? 0x222222;

    // Background rectangle for dropdown (fixed size)
    const dropdownBg = this.add
      .rectangle(
        dropdownX - SCALED_DROPDOWN_WIDTH / 2,
        dropdownY - SCALED_DROPDOWN_HEIGHT / 2,
        SCALED_DROPDOWN_WIDTH,
        SCALED_DROPDOWN_HEIGHT,
        initialColor
      )
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x000000, 0.2)
      .setInteractive({ useHandCursor: true });

    const dropdownLabelColor = contrastTextColor(initialColor);
    const dropdownLabel = this.add
      .text(dropdownX, dropdownY, `Mode: ${modeLabels[defaultMode]}`, {
        fontSize: `${18 * UI_SCALE}px`,
        color: dropdownLabelColor,
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    // Make clicks land on bg but keep label for display
    // toggle implementation is bound later (dropdownToggleImpl)
    dropdownBg.on('pointerdown', () => dropdownToggleImpl());
    dropdownLabel
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => dropdownToggleImpl());

    // Options group (hidden initially)
    // options stores pairs {bg, text} so we can destroy them easily
    const options: Array<{ bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = [];
    let open = false;

    // override the placeholder toggle with real implementation that has access to locals
    const dropdownToggleImpl = () => {
      open = !open;
      const parentWidth = SCALED_DROPDOWN_WIDTH;
      const optHeight = 32 * UI_SCALE;
      const startX = dropdownX - parentWidth / 2;

      if (open) {
        for (let i = 0; i < modes.length; i++) {
          const m = modes[i];
          const color = palette[i % palette.length] ?? 0x222222;
          const y = dropdownY + SCALED_DROPDOWN_HEIGHT / 2 + 8 * UI_SCALE + i * (optHeight + 6 * UI_SCALE);

          const bg = this.add
            .rectangle(startX, y, parentWidth, optHeight, color)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
          const label = modeLabels[m as keyof typeof modeLabels] || m;
          const optColor = contrastTextColor(Number(color));
          const txt = this.add
            .text(startX + 10 * UI_SCALE, y + optHeight / 2, String(label), {
              fontSize: `${18 * UI_SCALE}px`,
              color: optColor,
              fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
              stroke: '#000000',
              strokeThickness: 1,
            })
            .setOrigin(0, 0.5);

          const onSelect = () => {
            // This user interaction enables audio context with enhanced error handling
            this.enableAudioOnUserInteraction().then(() => {
              // Play menu select sound after audio is initialized
              try {
                audioHandler.playSound('menu-select');
              } catch (soundError) {
                Logger.log(`StartMenu: Menu select sound failed in dropdown - ${soundError}`);
                // Continue with dropdown functionality even if sound fails
              }
            }).catch(error => {
              Logger.log(`StartMenu: Audio initialization failed in dropdown - ${error}`);
              // Continue with dropdown functionality even if audio fails
            });
            
            this.registry.set('selectedMode', m);
            // persist via Settings Manager
            try {
              this.settingsManager.set('game.selectedMode', String(m));
            } catch (e) {}
            // update dropdown appearance
            dropdownLabel.setText(`Mode: ${modeLabels[m as keyof typeof modeLabels] || m}`);
            const selColor = palette[i % palette.length] ?? 0x222222;
            dropdownBg.setFillStyle(Number(selColor));
            dropdownLabel.setColor(contrastTextColor(Number(selColor)));

            // destroy all option objects
            options.forEach((o) => {
              o.bg.destroy();
              o.text.destroy();
            });
            options.length = 0;
            open = false;
          };

          // hover effects: darken the color on hover
          bg.on('pointerover', () => bg.setFillStyle(darken(Number(color))));
          bg.on('pointerout', () => bg.setFillStyle(Number(color)));

          bg.on('pointerdown', onSelect);
          txt.setInteractive({ useHandCursor: true }).on('pointerdown', onSelect);
          options.push({ bg, text: txt });
        }
      } else {
        options.forEach((o) => {
          o.bg.destroy();
          o.text.destroy();
        });
        options.length = 0;
      }
    };

    // Create standardized buttons using the improved factory pattern with consistent visual feedback
    // Requirements: 1.1, 1.2, 1.3, 1.5, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5
    Logger.log('StartMenu: Creating buttons using standardized factory pattern with consistent visual feedback');
    
    // Settings button - uses standardized dimensions and positioning with consistent visual feedback
    const settingsButton = this.createStandardizedButton({
      x: layout.settingsButtonX,
      y: layout.settingsButtonY,
      text: 'SETTINGS',
      onClick: () => this.openSettings(),
      type: 'text'
    }, UI_SCALE);
    Logger.log(`StartMenu: Settings button created with consistent visual feedback at (${layout.settingsButtonX}, ${layout.settingsButtonY})`);

    // How To Play button - uses standardized dimensions and positioning with consistent visual feedback
    const howToPlayButton = this.createStandardizedButton({
      x: layout.howToPlayButtonX,
      y: layout.howToPlayButtonY,
      text: 'HOW TO PLAY',
      onClick: () => this.openHowToPlay(),
      type: 'text'
    }, UI_SCALE);
    Logger.log(`StartMenu: How To Play button created with consistent visual feedback at (${layout.howToPlayButtonX}, ${layout.howToPlayButtonY})`);

    // Leaderboard button - uses standardized dimensions and positioning with consistent visual feedback
    const leaderboardButton = this.createStandardizedButton({
      x: layout.leaderboardButtonX,
      y: layout.leaderboardButtonY,
      text: 'LEADERBOARD',
      onClick: () => this.openLeaderboard(),
      type: 'text'
    }, UI_SCALE);
    Logger.log(`StartMenu: Leaderboard button created with consistent visual feedback at (${layout.leaderboardButtonX}, ${layout.leaderboardButtonY})`);

    // Audio button - uses standardized dimensions while maintaining square aspect ratio with consistent visual feedback
    // Requirements: 1.1, 1.2, 1.3, 1.5, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5
    const audioButtonResult = this.createStandardizedButton({
      x: layout.audioButtonX,
      y: layout.audioButtonY,
      text: '🔇', // Initial muted state icon
      onClick: () => this.handleAudioButtonClick(),
      type: 'square',
      customSize: layout.audioButtonSize
    }, UI_SCALE);

    // Extract button and icon from factory result
    if (typeof audioButtonResult === 'object' && 'button' in audioButtonResult) {
      this.audioButton = audioButtonResult.button;
      this.audioIcon = audioButtonResult.icon;
      Logger.log(`StartMenu: Audio button created with consistent visual feedback at (${layout.audioButtonX}, ${layout.audioButtonY}) with square size ${layout.audioButtonSize}x${layout.audioButtonSize}`);
    } else {
      throw new Error('Expected square button result from factory');
    }

    // Store button references for state management (Requirements 7.4, 7.5)
    this.buttonReferences = {
      settings: settingsButton,
      howToPlay: howToPlayButton,
      leaderboard: leaderboardButton,
      audio: audioButtonResult
    };
    
    Logger.log('StartMenu: All buttons successfully created with consistent visual feedback using standardized factory pattern');

    // Initialize audio state synchronization using Settings Manager
    this.initializeAudioStateSynchronization();

    // Setup responsive behavior and cross-platform support (Requirements 6.1, 6.2, 6.4, 6.5)
    this.setupResponsiveBehavior();

    // Setup cleanup for Settings Manager subscriptions
    this.events.once('shutdown', this.cleanupSettingsManagerSubscriptions, this);

    // Audio will be enabled on first user interaction through the audio button
  }

  /**
   * Clean up Settings Manager subscriptions when scene is destroyed
   * Requirements: 2.5
   */
  private cleanupSettingsManagerSubscriptions(): void {
    return Logger.withSilentLogging(() => {
      try {
        // Unsubscribe from all Settings Manager events to prevent memory leaks
        this.settingsSubscriptions.forEach(unsubscribe => {
          try {
            unsubscribe();
          } catch (error) {
            Logger.log(`StartMenu: Error unsubscribing from Settings Manager - ${error}`);
          }
        });
        this.settingsSubscriptions = [];
        
        Logger.log('StartMenu: Settings Manager subscriptions cleaned up');
        
      } catch (error) {
        Logger.log(`StartMenu: Error during Settings Manager cleanup - ${error}`);
      }
    });
  }

  /**
   * Enable audio on user interaction with enhanced error handling and browser compatibility
   * Requirements: 3.1, 3.5, 5.1, 5.2, 5.3, 6.3
   */
  private async enableAudioOnUserInteraction(): Promise<void> {
    return Logger.withSilentLogging(async () => {
      const startTime = Date.now();
      
      try {
        Logger.log('StartMenu: enableAudioOnUserInteraction called with enhanced error handling');
        
        // Initialize AudioContext properly after user gesture with timeout protection
        // This follows Chrome's autoplay policy requirements (Requirement 6.3)
        await this.initializeAudioContextWithTimeout();
        
        // Use existing enableAudioOnUserInteraction method and integrate with audioHandler service (Requirements 5.1, 5.3)
        if (!audioHandler.isInitialized()) {
          Logger.log('StartMenu: Initializing audio on user interaction using audioHandler service');
          
          // Initialize with timeout protection (Requirement 3.5)
          await this.initializeAudioHandlerWithTimeout();
          
          if (audioHandler.isInitialized()) {
            Logger.log('StartMenu: AudioHandler initialized successfully');
          } else {
            Logger.log('StartMenu: AudioHandler initialization completed but not marked as initialized');
          }
        } else {
          // Audio already initialized
          Logger.log('StartMenu: Audio already initialized via audioHandler service');
        }
        
        const duration = Date.now() - startTime;
        Logger.log(`StartMenu: Audio initialization completed in ${duration}ms`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Enhanced error handling with graceful degradation (Requirements 3.5, 5.2)
        await this.handleAudioInitializationError(error, duration);
      }
    });
  }

  /**
   * Initialize AudioContext with timeout protection and browser compatibility
   * Requirements: 3.5, 6.3
   */
  private async initializeAudioContextWithTimeout(): Promise<void> {
    const AUDIO_CONTEXT_TIMEOUT = 5000; // 5 seconds timeout protection
    
    try {
      // Create timeout promise for protection against hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`AudioContext initialization timed out after ${AUDIO_CONTEXT_TIMEOUT}ms`));
        }, AUDIO_CONTEXT_TIMEOUT);
      });
      
      // Create initialization promise
      const initPromise = this.performAudioContextInitialization();
      
      // Race between initialization and timeout
      await Promise.race([initPromise, timeoutPromise]);
      
      Logger.log('StartMenu: AudioContext initialization completed successfully');
      
    } catch (error) {
      Logger.log(`StartMenu: AudioContext initialization failed - ${error}`);
      
      // Enhanced browser compatibility - try fallback methods
      await this.tryAudioContextFallbacks();
    }
  }

  /**
   * Perform the actual AudioContext initialization with browser compatibility
   * Requirements: 6.3
   */
  private async performAudioContextInitialization(): Promise<void> {
    // Check browser compatibility for AudioContext
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }
    
    // Browser compatibility check - support multiple AudioContext implementations
    const AudioContextClass = window.AudioContext || 
                             (window as any).webkitAudioContext || 
                             (window as any).mozAudioContext ||
                             (window as any).msAudioContext;
    
    if (!AudioContextClass) {
      throw new Error('AudioContext not supported in this browser');
    }
    
    // Check if there's an existing AudioContext
    const existingContext = (window as any).audioContext;
    
    if (existingContext) {
      // Resume existing context if suspended
      if (existingContext.state === 'suspended') {
        Logger.log('StartMenu: Resuming suspended AudioContext');
        await existingContext.resume();
        Logger.log(`StartMenu: AudioContext resumed, state: ${existingContext.state}`);
      } else {
        Logger.log(`StartMenu: AudioContext already active, state: ${existingContext.state}`);
      }
    } else {
      // Create new AudioContext with browser compatibility
      Logger.log('StartMenu: Creating new AudioContext with browser compatibility');
      const audioContext = new AudioContextClass();
      
      // Store reference for other services to use
      (window as any).audioContext = audioContext;
      
      // Ensure context is running (required by autoplay policies)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      Logger.log(`StartMenu: AudioContext created and started, state: ${audioContext.state}`);
    }
    
    // Also initialize Phaser's audio system with error handling
    await this.initializePhaserAudioContext();
  }

  /**
   * Initialize Phaser's AudioContext with error handling
   * Requirements: 6.3
   */
  private async initializePhaserAudioContext(): Promise<void> {
    try {
      if (this.sound && 'context' in this.sound) {
        const phaserContext = (this.sound as any).context;
        if (phaserContext) {
          if (phaserContext.state === 'suspended') {
            Logger.log('StartMenu: Resuming Phaser AudioContext');
            await phaserContext.resume();
            Logger.log(`StartMenu: Phaser AudioContext resumed, state: ${phaserContext.state}`);
          } else {
            Logger.log(`StartMenu: Phaser AudioContext already active, state: ${phaserContext.state}`);
          }
        }
      }
    } catch (error) {
      Logger.log(`StartMenu: Phaser AudioContext initialization failed - ${error}`);
      // Don't throw - Phaser audio is optional
    }
  }

  /**
   * Try fallback methods for AudioContext initialization
   * Requirements: 6.3
   */
  private async tryAudioContextFallbacks(): Promise<void> {
    Logger.log('StartMenu: Attempting AudioContext fallback methods');
    
    try {
      // Fallback 1: Try creating a minimal AudioContext for compatibility testing
      if (typeof window !== 'undefined' && window.AudioContext) {
        const testContext = new window.AudioContext();
        if (testContext.state !== 'suspended') {
          (window as any).audioContext = testContext;
          Logger.log('StartMenu: Fallback AudioContext created successfully');
          return;
        }
        testContext.close();
      }
      
      // Fallback 2: Try webkit prefixed version
      if ((window as any).webkitAudioContext) {
        const webkitContext = new (window as any).webkitAudioContext();
        (window as any).audioContext = webkitContext;
        Logger.log('StartMenu: WebKit AudioContext fallback successful');
        return;
      }
      
      Logger.log('StartMenu: All AudioContext fallback methods failed - continuing without AudioContext');
      
    } catch (error) {
      Logger.log(`StartMenu: AudioContext fallback methods failed - ${error}`);
      // Continue without AudioContext - graceful degradation
    }
  }

  /**
   * Handle audio button click using centralized Settings Manager
   * Requirements: 2.1, 2.2, 2.5, 4.1, 4.2, 4.3, 4.4
   */
  private async handleAudioButtonClick(): Promise<void> {
    return Logger.withSilentLogging(async () => {
      Logger.log('StartMenu: Audio button clicked - using Settings Manager');
      
      // Prevent multiple simultaneous initialization attempts
      if (this.isAudioInitializing) {
        Logger.log('StartMenu: Audio initialization already in progress, ignoring click');
        return;
      }

      try {
        // Provide immediate visual feedback for button press
        this.showButtonPressEffect();

        // Get current audio settings from Settings Manager
        const currentMusicEnabled = this.settingsManager.get<boolean>('audio.musicEnabled');
        const currentSoundEnabled = this.settingsManager.get<boolean>('audio.soundEnabled');
        const currentMasterMute = this.settingsManager.get<boolean>('audio.masterMute');

        if (currentMasterMute || (!currentMusicEnabled && !currentSoundEnabled)) {
          // Enable audio through Settings Manager
          await this.enableAudioThroughSettingsManager();
        } else {
          // Disable audio through Settings Manager
          this.disableAudioThroughSettingsManager();
        }
        
      } catch (error) {
        Logger.log(`StartMenu: Audio button click handler failed - ${error}`);
        
        // Graceful error handling - ensure button remains functional
        this.updateAudioButtonState('muted');
      }
    });
  }

  /**
   * Enable audio through Settings Manager
   * Requirements: 2.1, 2.2, 4.1, 4.2, 4.3, 4.4
   */
  private async enableAudioThroughSettingsManager(): Promise<void> {
    return Logger.withSilentLogging(async () => {
      this.isAudioInitializing = true;
      this.updateAudioButtonState('loading');

      try {
        // Enable audio context first
        await this.enableAudioOnUserInteraction();

        // Update settings through Settings Manager
        this.settingsManager.set('audio.musicEnabled', true);
        this.settingsManager.set('audio.soundEnabled', true);
        this.settingsManager.set('audio.masterMute', false);

        // Settings Manager will automatically propagate changes to AudioHandler
        // through the AudioSettingsAdapter, so we don't need to call AudioHandler directly

        // Update button state to reflect enabled audio
        this.updateAudioButtonState('unmuted');
        
        Logger.log('StartMenu: Audio enabled through Settings Manager');
        
      } catch (error) {
        Logger.log(`StartMenu: Failed to enable audio through Settings Manager - ${error}`);
        this.updateAudioButtonState('muted');
        throw error;
      } finally {
        this.isAudioInitializing = false;
      }
    });
  }

  /**
   * Disable audio through Settings Manager
   * Requirements: 2.1, 2.2, 4.1, 4.2, 4.3, 4.4
   */
  private disableAudioThroughSettingsManager(): void {
    return Logger.withSilentLogging(() => {
      try {
        // Update settings through Settings Manager
        this.settingsManager.set('audio.masterMute', true);

        // Settings Manager will automatically propagate changes to AudioHandler
        // through the AudioSettingsAdapter, so we don't need to call AudioHandler directly

        // Update button state to reflect disabled audio
        this.updateAudioButtonState('muted');
        
        Logger.log('StartMenu: Audio disabled through Settings Manager');
        
      } catch (error) {
        Logger.log(`StartMenu: Failed to disable audio through Settings Manager - ${error}`);
        // Maintain button functionality even if Settings Manager fails
        this.updateAudioButtonState('muted');
      }
    });
  }

  /**
   * Update audio button state based on current Settings Manager values
   * Requirements: 2.1, 2.2, 2.5, 4.1, 4.2, 4.3, 4.4
   */
  private updateAudioButtonFromSettings(): void {
    return Logger.withSilentLogging(() => {
      try {
        // Get current audio settings from Settings Manager
        const musicEnabled = this.settingsManager.get<boolean>('audio.musicEnabled');
        const soundEnabled = this.settingsManager.get<boolean>('audio.soundEnabled');
        const masterMute = this.settingsManager.get<boolean>('audio.masterMute');

        // Determine button state based on settings
        const isAudioEnabled = !masterMute && (musicEnabled || soundEnabled);
        const newButtonState: 'muted' | 'unmuted' = isAudioEnabled ? 'unmuted' : 'muted';

        // Only update if state has changed to avoid unnecessary updates
        if (this.audioButtonState !== newButtonState) {
          this.updateAudioButtonState(newButtonState);
          Logger.log(`StartMenu: Audio button updated from Settings Manager - ${newButtonState} (music: ${musicEnabled}, sound: ${soundEnabled}, masterMute: ${masterMute})`);
        }
        
      } catch (error) {
        Logger.log(`StartMenu: Error updating audio button from Settings Manager - ${error}`);
        // Fallback to muted state if update fails
        this.updateAudioButtonState('muted');
      }
    });
  }

  /**
   * Create responsive touch target configuration with proper 44px minimum targets
   * Requirements: 5.1, 5.2, 5.4
   * @param buttonSize - Size of the button for touch target calculation
   * @returns Phaser interactive configuration with responsive touch targets
   */
  private createResponsiveTouchTargetConfig(buttonSize: number): Phaser.Types.Input.InputConfiguration {
    const { width, height } = this.scale;
    const screenInfo = this.detectScreenSizeCategory(width, height);
    
    // Minimum touch target size for mobile accessibility (44px minimum recommended)
    const MIN_TOUCH_TARGET = 44;
    const OPTIMAL_TOUCH_TARGET = 48;
    
    let touchTargetSize = buttonSize;
    
    // Apply responsive touch target sizing based on screen category
    switch (screenInfo.category) {
      case 'mobile-portrait':
      case 'mobile-landscape':
        // On mobile devices, ensure optimal touch target size (Requirement 5.1)
        touchTargetSize = Math.max(buttonSize, OPTIMAL_TOUCH_TARGET);
        break;
        
      case 'tablet-portrait':
      case 'tablet-landscape':
        // On tablets, use optimal touch targets
        touchTargetSize = Math.max(buttonSize, OPTIMAL_TOUCH_TARGET);
        break;
        
      case 'desktop':
        // On desktop, ensure minimum accessibility but don't over-expand
        touchTargetSize = Math.max(buttonSize, MIN_TOUCH_TARGET);
        break;
    }
    
    return {
      useHandCursor: true,
      // Expand hit area for better touch accessibility with responsive sizing
      hitArea: new Phaser.Geom.Rectangle(
        -touchTargetSize / 2,
        -touchTargetSize / 2,
        touchTargetSize,
        touchTargetSize
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      // Enable both mouse and touch interactions
      draggable: false,
      dropZone: false,
      cursor: 'pointer'
    };
  }

  /**
   * Create cross-platform interactive configuration for buttons (legacy method)
   * Requirements: 5.1, 5.2 (delegates to responsive system)
   * @param buttonSize - Size of the button for touch target calculation
   * @returns Phaser interactive configuration
   */
  private createCrossPlatformInteractiveConfig(buttonSize: number): Phaser.Types.Input.InputConfiguration {
    return this.createResponsiveTouchTargetConfig(buttonSize);
  }

  /**
   * Calculate responsive icon size with proper scaling for different screen sizes
   * Requirements: 5.2, 5.4, 5.5
   * @param buttonSize - Current button size
   * @param uiScale - UI scaling factor
   * @returns Appropriate icon size for current screen
   */
  private calculateResponsiveIconSize(buttonSize: number, uiScale: number): number {
    const { width, height } = this.scale;
    const screenInfo = this.detectScreenSizeCategory(width, height);
    
    // Icon should be proportional to button size but with responsive adjustments
    let baseIconRatio = 0.4; // Icon takes up 40% of button size
    
    // Adjust icon ratio based on screen category for better visibility
    switch (screenInfo.category) {
      case 'mobile-portrait':
      case 'mobile-landscape':
        // On mobile, make icons slightly larger for better visibility
        baseIconRatio = screenInfo.isVerySmall ? 0.45 : 0.42;
        break;
        
      case 'tablet-portrait':
      case 'tablet-landscape':
        // On tablets, use standard ratio
        baseIconRatio = 0.4;
        break;
        
      case 'desktop':
        // On desktop, icons can be slightly smaller relative to button size
        baseIconRatio = screenInfo.isVeryLarge ? 0.35 : 0.38;
        break;
    }
    
    let iconSize = buttonSize * baseIconRatio;
    
    // Ensure icon size is reasonable for readability with responsive limits
    let minIconSize = 16;
    let maxIconSize = 32;
    
    // Adjust limits based on screen category
    switch (screenInfo.category) {
      case 'mobile-portrait':
      case 'mobile-landscape':
        minIconSize = screenInfo.isVerySmall ? 14 : 16;
        maxIconSize = screenInfo.isVerySmall ? 24 : 28;
        break;
        
      case 'tablet-portrait':
      case 'tablet-landscape':
        minIconSize = 18;
        maxIconSize = 32;
        break;
        
      case 'desktop':
        minIconSize = 16;
        maxIconSize = screenInfo.isVeryLarge ? 40 : 32;
        break;
    }
    
    iconSize = Math.max(minIconSize, Math.min(maxIconSize, iconSize));
    
    return Math.round(iconSize);
  }

  /**
   * Handle audio button hover effects with cross-platform support (legacy method - now uses consistent system)
   * Requirements: 6.2, 6.4, 7.1
   * @param isHovering - Whether the button is being hovered
   */
  private handleAudioButtonHover(isHovering: boolean): void {
    return Logger.withSilentLogging(() => {
      if (!this.audioButton) return;

      // Audio button now uses the consistent visual feedback system
      // This method is kept for backward compatibility but the actual hover effects
      // are handled by the applyConsistentVisualFeedback method
      Logger.log(`StartMenu: Audio button hover state: ${isHovering} (handled by consistent visual feedback system)`);
    });
  }

  /**
   * Handle audio button release for better touch feedback (legacy method - now uses consistent system)
   * Requirements: 6.1, 6.4, 7.2, 7.3
   */
  private handleAudioButtonRelease(): void {
    return Logger.withSilentLogging(() => {
      if (!this.audioButton) return;

      // Audio button now uses the consistent visual feedback system
      // This method is kept for backward compatibility but the actual release effects
      // are handled by the applyConsistentVisualFeedback method
      Logger.log('StartMenu: Audio button release (handled by consistent visual feedback system)');
    });
  }

  /**
   * Detect if the current device is primarily touch-based
   * Requirements: 6.1, 6.2, 6.4
   * @returns True if touch device is detected
   */
  private detectTouchDevice(): boolean {
    // Multiple detection methods for better accuracy
    const hasTouchScreen = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 || 
                          (navigator as any).msMaxTouchPoints > 0;
    
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    
    // Consider it a touch device if any of these conditions are true
    return hasTouchScreen || isMobileUserAgent || hasCoarsePointer;
  }

  /**
   * Handle screen orientation changes to maintain grid alignment
   * Requirements: 5.3, 5.4, 5.5
   */
  private handleOrientationChange(): void {
    return Logger.withSilentLogging(() => {
      // Debounce orientation changes to avoid excessive recalculations
      if (this.orientationChangeTimeout) {
        clearTimeout(this.orientationChangeTimeout);
      }
      
      this.orientationChangeTimeout = setTimeout(() => {
        Logger.log('StartMenu: Handling orientation change - updating responsive layout');
        this.updateResponsiveLayoutForOrientationChange();
      }, 250);
    });
  }

  /**
   * Update responsive layout specifically for orientation changes
   * Requirements: 5.3, 5.4, 5.5
   */
  private updateResponsiveLayoutForOrientationChange(): void {
    return Logger.withSilentLogging(() => {
      const { width, height } = this.scale;
      const UI_SCALE = 2;
      
      // Detect new screen size category after orientation change
      const screenInfo = this.detectScreenSizeCategory(width, height);
      Logger.log(`StartMenu: Orientation change detected - new category: ${screenInfo.category}, orientation: ${screenInfo.orientation}, very small: ${screenInfo.isVerySmall}, very large: ${screenInfo.isVeryLarge}`);
      
      // Clear cached dimensions to force recalculation with new screen dimensions
      this.standardButtonDimensions = null;
      
      // Update all button elements with new responsive layout
      this.updateAllButtonsForResponsiveLayout(width, height, UI_SCALE);
      
      Logger.log(`StartMenu: Responsive layout updated for orientation change - screen: ${width}x${height}, category: ${screenInfo.category}`);
    });
  }

  /**
   * Update all buttons for responsive layout changes
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   * @param screenWidth - Current screen width
   * @param screenHeight - Current screen height
   * @param uiScale - UI scaling factor
   */
  private updateAllButtonsForResponsiveLayout(screenWidth: number, screenHeight: number, uiScale: number): void {
    return Logger.withSilentLogging(() => {
      if (!this.audioButton || !this.audioIcon) {
        Logger.log('StartMenu: Audio button elements not available for responsive layout update');
        return;
      }

      // Apply responsive scaling adjustments for extreme screen sizes (Requirement 5.5)
      const adjustedUIScale = this.calculateResponsiveUIScale(screenWidth, screenHeight, uiScale);
      const SCALED_DROPDOWN_WIDTH = 220 * adjustedUIScale;
      
      // Recalculate layout with current screen dimensions using responsive system
      const layout = this.calculateButtonLayout(screenWidth, screenHeight, SCALED_DROPDOWN_WIDTH, adjustedUIScale);
      
      // Update audio button position and size with responsive calculations
      const responsiveAudioButtonSize = this.calculateResponsiveButtonSize(
        layout.audioButtonSize, 
        screenWidth, 
        screenHeight, 
        adjustedUIScale, 
        true // isSquareButton
      );
      
      this.audioButton.setPosition(layout.audioButtonX, layout.audioButtonY);
      this.audioButton.setSize(responsiveAudioButtonSize, responsiveAudioButtonSize);
      
      // Update icon position and size with responsive calculations
      const responsiveIconSize = this.calculateResponsiveIconSize(responsiveAudioButtonSize, adjustedUIScale);
      this.audioIcon.setPosition(layout.audioButtonX, layout.audioButtonY);
      this.audioIcon.setFontSize(responsiveIconSize);
      
      // Update interactive areas for new responsive size (keep it simple to avoid alignment issues)
      this.audioButton.setInteractive({ useHandCursor: true });
      // Icon is not interactive to avoid conflicts
      
      // Log responsive layout details
      const screenInfo = this.detectScreenSizeCategory(screenWidth, screenHeight);
      Logger.log(`StartMenu: All buttons updated for responsive layout - screen: ${screenWidth}x${screenHeight} (${screenInfo.category}), UI scale: ${uiScale} -> ${adjustedUIScale}, audio button: ${responsiveAudioButtonSize}x${responsiveAudioButtonSize}, icon size: ${responsiveIconSize}, spacing: ${layout.horizontalSpacing}x${layout.verticalSpacing}`);
    });
  }

  /**
   * Calculate responsive UI scale for extreme screen sizes
   * Requirements: 5.4, 5.5
   * @param screenWidth - Current screen width
   * @param screenHeight - Current screen height
   * @param baseUIScale - Base UI scaling factor
   * @returns Adjusted UI scale for current screen size
   */
  private calculateResponsiveUIScale(screenWidth: number, screenHeight: number, baseUIScale: number): number {
    const screenInfo = this.detectScreenSizeCategory(screenWidth, screenHeight);
    let adjustedScale = baseUIScale;
    
    // Adjust UI scale for extreme screen sizes to ensure appropriate button scaling
    if (screenInfo.isVerySmall) {
      // On very small screens, reduce UI scale to prevent buttons from becoming too large (Requirement 5.4)
      adjustedScale = Math.max(1.0, baseUIScale * 0.7);
      Logger.log(`StartMenu: Very small screen detected - reducing UI scale from ${baseUIScale} to ${adjustedScale}`);
    } else if (screenInfo.isVeryLarge) {
      // On very large screens, limit UI scale to prevent buttons from becoming excessively large (Requirement 5.5)
      adjustedScale = Math.min(baseUIScale * 1.2, baseUIScale);
      Logger.log(`StartMenu: Very large screen detected - UI scale maintained at ${adjustedScale}`);
    }
    
    return adjustedScale;
  }

  /**
   * Update layout for responsive behavior using responsive system with proper touch targets
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  private updateResponsiveLayout(): void {
    return Logger.withSilentLogging(() => {
      const { width, height } = this.scale;
      const UI_SCALE = 2;
      
      // Use the comprehensive responsive layout update
      this.updateAllButtonsForResponsiveLayout(width, height, UI_SCALE);
    });
  }

  // Add property for orientation change timeout
  private orientationChangeTimeout: NodeJS.Timeout | null = null;

  /**
   * Update the audio button's visual state and icon
   * Requirements: 4.1, 4.3, 4.4
   */
  private updateAudioButtonState(newState: 'muted' | 'unmuted' | 'loading'): void {
    return Logger.withSilentLogging(() => {
      this.audioButtonState = newState;
      
      if (!this.audioIcon) {
        Logger.log('StartMenu: Audio icon not available for state update');
        return;
      }

      // Update icon based on state
      switch (newState) {
        case 'muted':
          this.audioIcon.setText('🔇'); // Muted speaker
          Logger.log('StartMenu: Audio button state updated to muted');
          break;
        case 'unmuted':
          // Update button icon to unmuted speaker (🔊) when audio is successfully activated (Requirement 4.1)
          this.audioIcon.setText('🔊'); // Unmuted speaker with sound waves
          Logger.log('StartMenu: Audio button state updated to unmuted');
          break;
        case 'loading':
          this.audioIcon.setText('⏳'); // Hourglass for loading state
          Logger.log('StartMenu: Audio button state updated to loading');
          break;
      }
    });
  }

  /**
   * Setup responsive behavior and cross-platform support
   * Requirements: 6.1, 6.2, 6.4, 6.5
   */
  private setupResponsiveBehavior(): void {
    return Logger.withSilentLogging(() => {
      // Listen for orientation changes on mobile devices
      if (typeof window !== 'undefined') {
        // Modern approach using screen.orientation API
        if (screen && screen.orientation) {
          screen.orientation.addEventListener('change', () => this.handleOrientationChange());
        }
        
        // Fallback for older browsers
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
        
        // Also listen for resize events for desktop responsive behavior
        window.addEventListener('resize', () => this.handleOrientationChange());
        
        // Listen for visibility changes to handle app backgrounding/foregrounding
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
      }
      
      // Setup scale manager listeners for Phaser-specific scaling events
      this.scale.on('resize', () => this.handleOrientationChange());
      
      Logger.log('StartMenu: Responsive behavior and cross-platform support initialized');
    });
  }

  /**
   * Handle visibility changes for better mobile app lifecycle management
   * Requirements: 6.1, 6.4
   */
  private handleVisibilityChange(): void {
    return Logger.withSilentLogging(() => {
      if (document.hidden) {
        // App is being backgrounded - pause any ongoing audio operations
        if (this.isAudioInitializing) {
          Logger.log('StartMenu: App backgrounded during audio initialization');
        }
      } else {
        // App is being foregrounded - check if layout needs updating
        setTimeout(() => {
          this.updateResponsiveLayout();
        }, 100);
      }
    });
  }

  /**
   * Provide enhanced visual feedback for button press with cross-platform support (legacy method - now uses consistent system)
   * Requirements: 6.1, 6.4, 7.2, 7.3, 7.4
   */
  private showButtonPressEffect(): void {
    return Logger.withSilentLogging(() => {
      if (!this.audioButton) return;

      // Audio button now uses the consistent visual feedback system
      // This method is kept for backward compatibility but the actual press effects
      // are handled by the applyConsistentVisualFeedback method
      Logger.log('StartMenu: Audio button press effect (handled by consistent visual feedback system)');
    });
  }

  /**
   * Update button state for loading and disabled visual indicators
   * Requirements: 7.4, 7.5
   * @param buttonElement - Button element (text or composite button)
   * @param state - New button state ('normal', 'loading', 'disabled')
   */
  private updateButtonState(buttonElement: any, state: 'normal' | 'loading' | 'disabled'): void {
    return Logger.withSilentLogging(() => {
      if (!buttonElement) return;

      const feedbackConfig = this.getVisualFeedbackConfig();
      const buttonRect = buttonElement.buttonRect || buttonElement.button;
      const textElement = buttonElement instanceof Phaser.GameObjects.Text ? buttonElement : 
                         (buttonElement.icon || null);

      if (!buttonRect) {
        Logger.log('StartMenu: Cannot update button state - button rectangle not found');
        return;
      }

      // Stop any existing tweens
      this.tweens.killTweensOf(buttonRect);
      if (textElement) {
        this.tweens.killTweensOf(textElement);
      }

      // Create updated config for state management
      const updatedConfig: StandardButtonConfig = {
        ...(buttonElement.buttonConfig || {}),
        text: buttonElement.buttonConfig?.text || 'BUTTON',
        x: buttonRect.x,
        y: buttonRect.y,
        onClick: () => {},
        type: buttonElement.buttonConfig?.type || 'text',
        disabled: state === 'disabled',
        loading: state === 'loading'
      };

      // Apply the new visual state
      this.updateButtonVisualState(buttonRect, textElement, updatedConfig, feedbackConfig);

      Logger.log(`StartMenu: Button state updated to "${state}" with consistent visual feedback`);
    });
  }

  /**
   * Demonstrate loading state visual indicators for testing
   * Requirements: 7.5
   * @param buttonName - Name of button to set to loading state
   */
  private demonstrateLoadingState(buttonName: keyof typeof this.buttonReferences): void {
    return Logger.withSilentLogging(() => {
      const button = this.buttonReferences[buttonName];
      if (button) {
        this.updateButtonState(button, 'loading');
        Logger.log(`StartMenu: Demonstrating loading state for ${buttonName} button`);
        
        // Return to normal state after 3 seconds for demonstration
        this.time.delayedCall(3000, () => {
          this.updateButtonState(button, 'normal');
          Logger.log(`StartMenu: ${buttonName} button returned to normal state`);
        });
      }
    });
  }

  /**
   * Demonstrate disabled state visual indicators for testing
   * Requirements: 7.5
   * @param buttonName - Name of button to set to disabled state
   */
  private demonstrateDisabledState(buttonName: keyof typeof this.buttonReferences): void {
    return Logger.withSilentLogging(() => {
      const button = this.buttonReferences[buttonName];
      if (button) {
        this.updateButtonState(button, 'disabled');
        Logger.log(`StartMenu: Demonstrating disabled state for ${buttonName} button`);
        
        // Return to normal state after 3 seconds for demonstration
        this.time.delayedCall(3000, () => {
          this.updateButtonState(button, 'normal');
          Logger.log(`StartMenu: ${buttonName} button returned to normal state`);
        });
      }
    });
  }

  /**
   * Test all visual feedback states for all buttons
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  private testVisualFeedbackStates(): void {
    return Logger.withSilentLogging(() => {
      Logger.log('StartMenu: Testing all visual feedback states for all buttons');
      
      // Test loading states with staggered timing
      setTimeout(() => this.demonstrateLoadingState('settings'), 1000);
      setTimeout(() => this.demonstrateLoadingState('howToPlay'), 2000);
      setTimeout(() => this.demonstrateLoadingState('leaderboard'), 3000);
      
      // Test disabled states with staggered timing
      setTimeout(() => this.demonstrateDisabledState('settings'), 5000);
      setTimeout(() => this.demonstrateDisabledState('howToPlay'), 6000);
      setTimeout(() => this.demonstrateDisabledState('leaderboard'), 7000);
      
      Logger.log('StartMenu: Visual feedback state testing sequence initiated');
    });
  }

  /**
   * Clean up responsive behavior listeners
   * Requirements: 6.4
   */
  private cleanupResponsiveBehavior(): void {
    return Logger.withSilentLogging(() => {
      if (this.orientationChangeTimeout) {
        clearTimeout(this.orientationChangeTimeout);
        this.orientationChangeTimeout = null;
      }
      
      // Remove event listeners to prevent memory leaks
      if (typeof window !== 'undefined') {
        if (screen && screen.orientation) {
          screen.orientation.removeEventListener('change', () => this.handleOrientationChange());
        }
        window.removeEventListener('orientationchange', () => this.handleOrientationChange());
        window.removeEventListener('resize', () => this.handleOrientationChange());
        document.removeEventListener('visibilitychange', () => this.handleVisibilityChange());
      }
      
      Logger.log('StartMenu: Responsive behavior cleanup completed');
    });
  }

  /**
   * Clean up audio state synchronization system
   * Requirements: 3.4, 3.5
   */
  private cleanupAudioStateSynchronization(): void {
    return Logger.withSilentLogging(() => {
      try {
        // Remove registry event listeners to prevent memory leaks
        this.registry.events.off('changedata-audioEnabled');
        this.registry.events.off('changedata-musicEnabled');
        this.registry.events.off('changedata-soundEnabled');
        
        // Audio state synchronization cleanup completed
        
        Logger.log('StartMenu: Audio state synchronization cleanup completed');
        
      } catch (error) {
        Logger.log(`StartMenu: Error during audio state synchronization cleanup - ${error}`);
      }
    });
  }

  /**
   * Initialize AudioHandler with timeout protection
   * Requirements: 3.5, 5.2
   */
  private async initializeAudioHandlerWithTimeout(): Promise<void> {
    const AUDIO_HANDLER_TIMEOUT = 5000; // 5 seconds timeout protection
    
    // Create timeout promise for protection against hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`AudioHandler initialization timed out after ${AUDIO_HANDLER_TIMEOUT}ms`));
      }, AUDIO_HANDLER_TIMEOUT);
    });
    
    // Create initialization promise
    const initPromise = audioHandler.initialize(this);
    
    // Race between initialization and timeout
    await Promise.race([initPromise, timeoutPromise]);
  }

  /**
   * Handle audio initialization errors with graceful degradation
   * Requirements: 3.5, 5.2, 5.4, 6.3
   */
  private async handleAudioInitializationError(error: any, duration: number): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timed out');
    const isPermissionDenied = errorMessage.includes('permission') || errorMessage.includes('denied');
    const isBrowserPolicy = errorMessage.includes('autoplay') || errorMessage.includes('policy');
    
    Logger.log(`StartMenu: Audio initialization failed after ${duration}ms - ${errorMessage}`);
    
    // Log browser and system information for debugging
    this.logBrowserCompatibilityInfo();
    
    if (isTimeout) {
      Logger.log('StartMenu: Audio initialization timed out - maintaining button functionality with graceful degradation');
    } else if (isPermissionDenied) {
      Logger.log('StartMenu: Audio permission denied - button will remain functional but silent');
    } else if (isBrowserPolicy) {
      Logger.log('StartMenu: Browser autoplay policy prevented audio - button functionality maintained');
    } else {
      Logger.log('StartMenu: Audio system failure - graceful degradation enabled');
    }
    
    // Maintain button functionality even when audio systems fail (Requirement 5.4)
    // The button remains interactive and provides visual feedback
  }

  /**
   * Log browser compatibility information for debugging
   * Requirements: 6.3
   */
  private logBrowserCompatibilityInfo(): void {
    try {
      const browserInfo = {
        userAgent: navigator.userAgent,
        audioContextSupport: !!(window.AudioContext || (window as any).webkitAudioContext),
        webAudioSupport: typeof AudioContext !== 'undefined',
        autoplayPolicy: 'unknown', // Cannot directly detect, but logged for context
        documentHidden: document.hidden,
        visibilityState: document.visibilityState,
        online: navigator.onLine
      };
      
      Logger.log(`StartMenu: Browser compatibility info - ${JSON.stringify(browserInfo)}`);
    } catch (error) {
      Logger.log(`StartMenu: Could not collect browser compatibility info - ${error}`);
    }
  }



  /**
   * Handle audio button errors with graceful degradation
   * Requirements: 3.5, 5.2, 5.4, 6.3
   */
  private async handleAudioButtonError(error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timed out');
    const isPermissionDenied = errorMessage.includes('permission') || errorMessage.includes('denied');
    const isBrowserPolicy = errorMessage.includes('autoplay') || errorMessage.includes('policy');
    const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch');
    
    Logger.log(`StartMenu: Audio button error - ${errorMessage}`);
    
    // Ensure compatibility with browser autoplay policies (Requirement 6.3)
    if (isBrowserPolicy || isPermissionDenied) {
      Logger.log('StartMenu: Browser autoplay policy or permission issue - button remains functional');
      // Button stays functional but audio won't work until user grants permission
    } else if (isTimeout) {
      Logger.log('StartMenu: Audio operation timed out - implementing timeout protection');
      // Reset button state and allow user to retry
    } else if (isNetworkError) {
      Logger.log('StartMenu: Network error during audio operation - graceful degradation');
      // Audio assets may not load but button remains functional
    } else {
      Logger.log('StartMenu: Unknown audio error - maintaining button functionality');
    }
    
    // Maintain button functionality even when audio systems fail (Requirement 5.4)
    this.updateAudioButtonState('muted');
    
    // Log additional diagnostics for troubleshooting
    this.logAudioSystemDiagnostics();
  }

  /**
   * Log audio system diagnostics for troubleshooting
   * Requirements: 5.2, 6.3
   */
  private logAudioSystemDiagnostics(): void {
    try {
      const diagnostics = {
        audioHandlerInitialized: audioHandler.isInitialized(),
        audioContextExists: !!(window as any).audioContext,
        audioContextState: (window as any).audioContext?.state || 'none',
        phaserSoundExists: !!this.sound,
        phaserSoundContext: this.sound && 'context' in this.sound ? (this.sound as any).context?.state : 'none',
        documentHidden: document.hidden,
        visibilityState: document.visibilityState,
        userActivation: (navigator as any).userActivation?.hasBeenActive || 'unknown',
        timestamp: new Date().toISOString()
      };
      
      Logger.log(`StartMenu: Audio system diagnostics - ${JSON.stringify(diagnostics)}`);
    } catch (error) {
      Logger.log(`StartMenu: Could not collect audio diagnostics - ${error}`);
    }
  }



















  /**
   * Initialize audio state synchronization using Settings Manager
   * Requirements: 2.1, 2.2, 2.5, 4.1, 4.2, 4.3, 4.4
   */
  private initializeAudioStateSynchronization(): void {
    return Logger.withSilentLogging(() => {
      try {
        Logger.log('StartMenu: Initializing audio state synchronization using Settings Manager');
        
        // Subscribe to audio settings changes from Settings Manager
        const musicEnabledUnsubscribe = this.settingsManager.subscribe('audio.musicEnabled', (event) => {
          Logger.log(`StartMenu: Music enabled changed to ${event.newValue}`);
          this.updateAudioButtonFromSettings();
        });

        const soundEnabledUnsubscribe = this.settingsManager.subscribe('audio.soundEnabled', (event) => {
          Logger.log(`StartMenu: Sound enabled changed to ${event.newValue}`);
          this.updateAudioButtonFromSettings();
        });

        const masterMuteUnsubscribe = this.settingsManager.subscribe('audio.masterMute', (event) => {
          Logger.log(`StartMenu: Master mute changed to ${event.newValue}`);
          this.updateAudioButtonFromSettings();
        });

        // Store unsubscribe functions for cleanup
        this.settingsSubscriptions.push(musicEnabledUnsubscribe, soundEnabledUnsubscribe, masterMuteUnsubscribe);

        // Initialize button state from current settings
        this.updateAudioButtonFromSettings();
        
        Logger.log('StartMenu: Audio state synchronization initialized using Settings Manager');
        
      } catch (error) {
        Logger.log(`StartMenu: Error initializing audio state synchronization - ${error}`);
        
        // Fallback to muted state if initialization fails
        this.updateAudioButtonState('muted');
      }
    });
  }

  private openSettings(): void {
    return Logger.withSilentLogging(() => {
      // This user interaction enables audio context with enhanced error handling
      this.enableAudioOnUserInteraction().then(() => {
        // Play menu select sound after audio is initialized
        try {
          audioHandler.playSound('menu-select');
        } catch (soundError) {
          Logger.log(`StartMenu: Menu select sound failed in openSettings - ${soundError}`);
          // Continue with settings navigation even if sound fails
        }
      }).catch(error => {
        Logger.log(`StartMenu: Audio initialization failed in openSettings - ${error}`);
        // Continue with settings navigation even if audio fails
      });
      
      // Switch to Settings scene (don't wait for audio)
      this.scene.start('Settings');
      Logger.log('StartMenu: Opening Settings');
    });
  }

  /**
   * Open leaderboard scene
   * Requirements: 7.1, 7.4
   */
  private openLeaderboard(): void {
    return Logger.withSilentLogging(() => {
      // This user interaction enables audio context with enhanced error handling
      this.enableAudioOnUserInteraction().then(() => {
        // Play menu select sound after audio is initialized
        try {
          audioHandler.playSound('menu-select');
        } catch (soundError) {
          Logger.log(`StartMenu: Menu select sound failed in openLeaderboard - ${soundError}`);
          // Continue with leaderboard navigation even if sound fails
        }
      }).catch(error => {
        Logger.log(`StartMenu: Audio initialization failed in openLeaderboard - ${error}`);
        // Continue with leaderboard navigation even if audio fails
      });
      
      // Switch to LeaderboardScene (don't wait for audio)
      this.scene.start('LeaderboardScene');
      Logger.log('StartMenu: Opening Leaderboard');
    });
  }

  /**
   * Open How To Play scene
   * Requirements: 8.1, 8.2
   */
  private openHowToPlay(): void {
    return Logger.withSilentLogging(() => {
      // This user interaction enables audio context with enhanced error handling
      this.enableAudioOnUserInteraction().then(() => {
        // Play menu select sound after audio is initialized
        try {
          audioHandler.playSound('menu-select');
        } catch (soundError) {
          Logger.log(`StartMenu: Menu select sound failed in openHowToPlay - ${soundError}`);
          // Continue with How To Play navigation even if sound fails
        }
      }).catch(error => {
        Logger.log(`StartMenu: Audio initialization failed in openHowToPlay - ${error}`);
        // Continue with How To Play navigation even if audio fails
      });
      
      // Switch to HowToPlayScene (don't wait for audio)
      this.scene.start('HowToPlayScene');
      Logger.log('StartMenu: Opening How To Play');
    });
  }

  private startGame(): void {
    return Logger.withSilentLogging(() => {
      // This user interaction enables audio context with enhanced error handling
      this.enableAudioOnUserInteraction().then(() => {
        // Play menu select sound after audio is initialized
        try {
          audioHandler.playSound('menu-select');
        } catch (soundError) {
          Logger.log(`StartMenu: Menu select sound failed in startGame - ${soundError}`);
          // Continue with game start even if sound fails
        }
      }).catch(error => {
        Logger.log(`StartMenu: Audio initialization failed in startGame - ${error}`);
        // Continue with game start even if audio fails
      });
      
      Logger.log('Starting game...');
      // Determine selected mode (default to 'medium') and pass progressionData if available
      const registry = this.registry;
      const mode =
        (registry.get('selectedMode') as string) || (registry.get('gameMode') as string) || 'medium';
      const progressionData = registry.get('progressionData') || null;

      // Stop menu music before transitioning to game with error handling
      try {
        audioHandler.stopMusic();
      } catch (stopError) {
        Logger.log(`StartMenu: Failed to stop menu music - ${stopError}`);
        // Continue with game start even if music stop fails
      }

      // Start Game scene with initial data payload (don't wait for audio)
      this.scene.start('Game', { gameMode: mode, progressionData });
    });
  }

  /**
   * Test responsive layout system with various screen sizes and touch targets
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  private testResponsiveLayoutSystem(): void {
    Logger.log('StartMenu: Testing responsive layout system with touch targets');
    
    // Test with comprehensive screen sizes including extreme cases
    const testCases = [
      { width: 320, height: 568, name: 'Very Small Mobile (iPhone SE)' },
      { width: 375, height: 667, name: 'Mobile Portrait (iPhone 8)' },
      { width: 667, height: 375, name: 'Mobile Landscape (iPhone 8)' },
      { width: 768, height: 1024, name: 'Tablet Portrait (iPad)' },
      { width: 1024, height: 768, name: 'Tablet Landscape (iPad)' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 1920, height: 1080, name: 'Desktop 1080p' },
      { width: 2560, height: 1440, name: 'Large Desktop 1440p' },
      { width: 3840, height: 2160, name: 'Very Large Desktop 4K' }
    ];
    
    const UI_SCALE = 2;
    
    testCases.forEach(testCase => {
      Logger.log(`StartMenu: Testing responsive layout for ${testCase.name} (${testCase.width}x${testCase.height})`);
      
      // Test screen size detection
      const screenInfo = this.detectScreenSizeCategory(testCase.width, testCase.height);
      
      // Test responsive button sizing
      const baseButtonSize = 60; // Example base size
      const responsiveButtonSize = this.calculateResponsiveButtonSize(
        baseButtonSize, 
        testCase.width, 
        testCase.height, 
        UI_SCALE, 
        false
      );
      
      const responsiveSquareButtonSize = this.calculateResponsiveButtonSize(
        baseButtonSize, 
        testCase.width, 
        testCase.height, 
        UI_SCALE, 
        true
      );
      
      // Test touch target compliance
      const MIN_TOUCH_TARGET = 44;
      const touchTargetCompliant = responsiveButtonSize >= MIN_TOUCH_TARGET && responsiveSquareButtonSize >= MIN_TOUCH_TARGET;
      
      // Test responsive spacing
      const responsiveSpacing = this.calculateResponsiveButtonSpacing(testCase.width, testCase.height, UI_SCALE);
      
      // Test responsive UI scaling
      const adjustedUIScale = this.calculateResponsiveUIScale(testCase.width, testCase.height, UI_SCALE);
      
      // Test icon sizing
      const iconSize = this.calculateResponsiveIconSize(responsiveSquareButtonSize, adjustedUIScale);
      
      Logger.log(`StartMenu: ${testCase.name} Results:`);
      Logger.log(`  - Category: ${screenInfo.category}, Orientation: ${screenInfo.orientation}`);
      Logger.log(`  - Very Small: ${screenInfo.isVerySmall}, Very Large: ${screenInfo.isVeryLarge}`);
      Logger.log(`  - Button Size: ${baseButtonSize} -> ${responsiveButtonSize} (square: ${responsiveSquareButtonSize})`);
      Logger.log(`  - Touch Target Compliant: ${touchTargetCompliant}`);
      Logger.log(`  - Spacing: ${responsiveSpacing}px`);
      Logger.log(`  - UI Scale: ${UI_SCALE} -> ${adjustedUIScale}`);
      Logger.log(`  - Icon Size: ${iconSize}px`);
    });
    
    Logger.log('StartMenu: Responsive layout system testing completed');
  }

  /**
   * Test perfect 2x2 grid layout calculations with various screen sizes
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5
   */
  private testPerfect2x2GridLayout(): void {
    Logger.log('StartMenu: Testing perfect 2x2 grid layout calculations with responsive system');
    
    // Test with common screen sizes
    const testCases = [
      { width: 1920, height: 1080, name: 'Desktop 1080p' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 375, height: 667, name: 'Mobile Portrait' },
      { width: 667, height: 375, name: 'Mobile Landscape' }
    ];
    
    const UI_SCALE = 2;
    
    testCases.forEach(testCase => {
      Logger.log(`StartMenu: Testing ${testCase.name} (${testCase.width}x${testCase.height})`);
      
      // Use responsive dimensions for testing
      const responsiveStandardDimensions = this.getResponsiveStandardButtonDimensions(UI_SCALE, testCase.width, testCase.height);
      
      const gridLayout = this.calculatePerfect2x2GridLayout(
        testCase.width,
        testCase.height,
        responsiveStandardDimensions.width,
        responsiveStandardDimensions.height,
        UI_SCALE
      );
      
      // Verify grid is centered horizontally
      const expectedCenterX = testCase.width / 2;
      const isCentered = Math.abs(gridLayout.gridCenterX - expectedCenterX) < 1;
      
      // Verify equal spacing
      const horizontalSpacingCheck = Math.abs(
        (gridLayout.positions.topRight.x - gridLayout.positions.topLeft.x - responsiveStandardDimensions.width) - 
        gridLayout.horizontalSpacing
      ) < 1;
      
      const verticalSpacingCheck = Math.abs(
        (gridLayout.positions.bottomLeft.y - gridLayout.positions.topLeft.y - responsiveStandardDimensions.height) - 
        gridLayout.verticalSpacing
      ) < 1;
      
      Logger.log(`StartMenu: ${testCase.name} - Centered: ${isCentered}, Equal H-Spacing: ${horizontalSpacingCheck}, Equal V-Spacing: ${verticalSpacingCheck}, Button Size: ${responsiveStandardDimensions.width}x${responsiveStandardDimensions.height}`);
    });
    
    Logger.log('StartMenu: Perfect 2x2 grid layout testing completed');
  }

  /**
   * Initialize scene and setup cleanup on shutdown
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.4, 7.5
   */
  init(): void {
    // Setup cleanup when scene shuts down
    this.events.once('shutdown', () => {
      this.cleanupResponsiveBehavior();
      this.cleanupAudioStateSynchronization();
      this.cleanupVisualFeedbackSystem();
    });
    
    // Test the responsive layout system during development
    if (process.env.NODE_ENV === 'development') {
      this.testResponsiveLayoutSystem();
      this.testPerfect2x2GridLayout();
      // Test visual feedback system during development
      this.time.delayedCall(2000, () => this.testVisualFeedbackStates());
    }
  }

  /**
   * Handle browser-specific audio policies for cross-browser compatibility
   * Requirements: 8.1, 8.2
   */
  private async handleBrowserSpecificAudioPolicies(): Promise<void> {
    return Logger.withSilentLogging(async () => {
      try {
        const browserInfo = this.detectBrowserType();
        Logger.log(`StartMenu: Handling audio policies for ${browserInfo.name} ${browserInfo.version}`);

        // Chrome/Chromium-based browsers (Requirements 8.1, 8.2)
        if (browserInfo.isChrome || browserInfo.isEdge) {
          await this.handleChromeAudioPolicy();
        }
        // Firefox-specific handling (Requirements 8.1, 8.2)
        else if (browserInfo.isFirefox) {
          await this.handleFirefoxAudioPolicy();
        }
        // Safari-specific handling (Requirements 8.1, 8.2)
        else if (browserInfo.isSafari) {
          await this.handleSafariAudioPolicy();
        }
        // Mobile browser handling (Requirements 8.2)
        else if (browserInfo.isMobile) {
          await this.handleMobileAudioPolicy();
        }
        // Generic fallback for other browsers
        else {
          await this.handleGenericAudioPolicy();
        }

        Logger.log(`StartMenu: Browser-specific audio policy handling completed for ${browserInfo.name}`);

      } catch (error) {
        Logger.log(`StartMenu: Browser-specific audio policy handling failed - ${error}`);
        // Continue with generic handling
        await this.handleGenericAudioPolicy();
      }
    });
  }

  /**
   * Detect browser type for audio policy handling
   * Requirements: 8.1, 8.2
   */
  private detectBrowserType(): {
    name: string;
    version: string;
    isChrome: boolean;
    isFirefox: boolean;
    isSafari: boolean;
    isEdge: boolean;
    isMobile: boolean;
  } {
    const userAgent = navigator.userAgent;
    
    const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isEdge = /Edg/.test(userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    let name = 'Unknown';
    let version = 'Unknown';

    if (isChrome) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match?.[1] || 'Unknown';
    } else if (isFirefox) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match?.[1] || 'Unknown';
    } else if (isSafari) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match?.[1] || 'Unknown';
    } else if (isEdge) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match?.[1] || 'Unknown';
    }

    return {
      name,
      version,
      isChrome,
      isFirefox,
      isSafari,
      isEdge,
      isMobile
    };
  }

  /**
   * Handle Chrome/Chromium audio policy (autoplay restrictions)
   * Requirements: 8.1, 8.2
   */
  private async handleChromeAudioPolicy(): Promise<void> {
    try {
      // Chrome requires user activation for AudioContext
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const context = (window as any).audioContext;
        if (context && context.state === 'suspended') {
          Logger.log('StartMenu: Chrome AudioContext suspended, will resume on user interaction');
          // Context will be resumed by the audio initialization process
        }
      }

      // Check for user activation (Chrome's gesture requirement)
      const userActivation = (navigator as any).userActivation;
      if (userActivation && !userActivation.hasBeenActive) {
        Logger.log('StartMenu: Chrome requires user activation for audio - this click should satisfy the requirement');
      }

      Logger.log('StartMenu: Chrome audio policy handling completed');
    } catch (error) {
      Logger.log(`StartMenu: Chrome audio policy handling failed - ${error}`);
    }
  }

  /**
   * Handle Firefox audio policy
   * Requirements: 8.1, 8.2
   */
  private async handleFirefoxAudioPolicy(): Promise<void> {
    try {
      // Firefox has less restrictive autoplay policies but still requires user interaction
      Logger.log('StartMenu: Firefox audio policy - ensuring user interaction requirement is met');
      
      // Firefox-specific AudioContext handling
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const context = (window as any).audioContext;
        if (context && context.state === 'suspended') {
          Logger.log('StartMenu: Firefox AudioContext suspended, will resume on user interaction');
        }
      }

      Logger.log('StartMenu: Firefox audio policy handling completed');
    } catch (error) {
      Logger.log(`StartMenu: Firefox audio policy handling failed - ${error}`);
    }
  }

  /**
   * Handle Safari audio policy (strict autoplay restrictions)
   * Requirements: 8.1, 8.2
   */
  private async handleSafariAudioPolicy(): Promise<void> {
    try {
      // Safari has very strict autoplay policies
      Logger.log('StartMenu: Safari audio policy - handling strict autoplay restrictions');
      
      // Safari requires explicit user interaction for each audio element
      if (typeof window !== 'undefined' && 'webkitAudioContext' in window) {
        const context = (window as any).audioContext || (window as any).webkitAudioContext;
        if (context && context.state === 'suspended') {
          Logger.log('StartMenu: Safari AudioContext suspended, will resume on user interaction');
        }
      }

      // Safari may require additional setup time
      await new Promise(resolve => setTimeout(resolve, 100));

      Logger.log('StartMenu: Safari audio policy handling completed');
    } catch (error) {
      Logger.log(`StartMenu: Safari audio policy handling failed - ${error}`);
    }
  }

  /**
   * Handle mobile browser audio policies
   * Requirements: 8.2
   */
  private async handleMobileAudioPolicy(): Promise<void> {
    try {
      Logger.log('StartMenu: Mobile audio policy - handling mobile-specific restrictions');
      
      // Mobile browsers often have additional restrictions
      // Ensure we're in a user gesture context
      const isTouchDevice = this.detectTouchDevice();
      if (isTouchDevice) {
        Logger.log('StartMenu: Touch device detected - audio initialization will respect mobile policies');
      }

      // Mobile browsers may need additional time to process user gestures
      await new Promise(resolve => setTimeout(resolve, 150));

      Logger.log('StartMenu: Mobile audio policy handling completed');
    } catch (error) {
      Logger.log(`StartMenu: Mobile audio policy handling failed - ${error}`);
    }
  }

  /**
   * Handle generic audio policy for unknown browsers
   * Requirements: 8.1, 8.2
   */
  private async handleGenericAudioPolicy(): Promise<void> {
    try {
      Logger.log('StartMenu: Generic audio policy - using conservative approach for unknown browser');
      
      // Conservative approach for unknown browsers
      if (typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const context = (window as any).audioContext;
          if (context && context.state === 'suspended') {
            Logger.log('StartMenu: Generic browser AudioContext suspended, will resume on user interaction');
          }
        }
      }

      Logger.log('StartMenu: Generic audio policy handling completed');
    } catch (error) {
      Logger.log(`StartMenu: Generic audio policy handling failed - ${error}`);
    }
  }



  /**
   * Clean up visual feedback system and button references
   * Requirements: 7.4, 7.5
   */
  private cleanupVisualFeedbackSystem(): void {
    return Logger.withSilentLogging(() => {
      try {
        // Stop all button-related tweens to prevent memory leaks
        Object.values(this.buttonReferences).forEach(button => {
          if (button) {
            const buttonRect = button.buttonRect || button.button;
            const textElement = button instanceof Phaser.GameObjects.Text ? button : 
                               (button.icon || null);
            
            if (buttonRect) {
              this.tweens.killTweensOf(buttonRect);
            }
            if (textElement) {
              this.tweens.killTweensOf(textElement);
            }
          }
        });
        
        // Clear button references
        this.buttonReferences = {};
        
        Logger.log('StartMenu: Visual feedback system cleanup completed');
        
      } catch (error) {
        Logger.log(`StartMenu: Error during visual feedback system cleanup - ${error}`);
      }
    });
  }
}
