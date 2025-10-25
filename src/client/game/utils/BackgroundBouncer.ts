/**
 * BackgroundBouncer - A utility class for managing background sprite bouncing behavior
 * 
 * This class implements a logical point-based bouncing system that moves within a 
 * rectangular bounding box, providing smooth and predictable bouncing behavior
 * without relying on Phaser's physics system.
 * 
 * Requirements: 1.1, 1.3, 2.1, 2.2, 3.1, 3.2
 */

/**
 * Configuration interface for BackgroundBouncer initialization
 */
export interface BackgroundBouncerConfig {
  /** Full screen width in pixels */
  screenWidth: number;
  /** Full screen height in pixels */
  screenHeight: number;
  /** Scale factor for bounding box (0.8 = 80% of screen size) */
  boundingBoxScale: number;
  /** Initial movement speed in pixels per second */
  initialSpeed: number;
}

/**
 * Represents the logical point that moves within the bounding box
 */
export interface LogicalPoint {
  /** Current X position within bounding box */
  x: number;
  /** Current Y position within bounding box */
  y: number;
  /** X velocity in pixels per second */
  velocityX: number;
  /** Y velocity in pixels per second */
  velocityY: number;
}

/**
 * Defines the rectangular bounding area for logical point movement
 */
export interface BoundingBox {
  /** Left boundary coordinate */
  left: number;
  /** Right boundary coordinate */
  right: number;
  /** Top boundary coordinate */
  top: number;
  /** Bottom boundary coordinate */
  bottom: number;
}

/**
 * BackgroundBouncer utility class for managing background sprite bouncing
 * 
 * This class provides a physics-free approach to background bouncing by using
 * a logical point that moves within a defined bounding box. The background
 * sprite is positioned relative to this logical point.
 */
export class BackgroundBouncer {
  private logicalPoint: LogicalPoint;
  private boundingBox: BoundingBox;
  private config: BackgroundBouncerConfig;

  /**
   * Initialize the BackgroundBouncer with configuration
   * 
   * @param config Configuration object containing screen dimensions and settings
   */
  constructor(config: BackgroundBouncerConfig) {
    this.config = { ...config };
    
    // Validate configuration
    this.validateConfig();
    
    // Calculate bounding box based on screen dimensions and scale
    this.boundingBox = this.calculateBoundingBox();
    
    // Initialize logical point at center of bounding box
    this.logicalPoint = this.initializeLogicalPoint();
  }

  /**
   * Validate the configuration parameters
   * 
   * @throws Error if configuration is invalid
   */
  private validateConfig(): void {
    const { screenWidth, screenHeight, boundingBoxScale, initialSpeed } = this.config;
    
    if (screenWidth <= 0 || screenHeight <= 0) {
      throw new Error(`Invalid screen dimensions: ${screenWidth}x${screenHeight}`);
    }
    
    if (boundingBoxScale <= 0 || boundingBoxScale > 1) {
      throw new Error(`Invalid bounding box scale: ${boundingBoxScale}. Must be between 0 and 1`);
    }
    
    if (initialSpeed <= 0) {
      throw new Error(`Invalid initial speed: ${initialSpeed}. Must be positive`);
    }
  }

  /**
   * Calculate the bounding box based on screen dimensions and scale factor
   * 
   * @returns BoundingBox object with calculated boundaries
   */
  private calculateBoundingBox(): BoundingBox {
    const { screenWidth, screenHeight, boundingBoxScale } = this.config;
    
    // Calculate bounding box dimensions (80% of screen by default)
    const boundingWidth = screenWidth * boundingBoxScale;
    const boundingHeight = screenHeight * boundingBoxScale;
    
    // Center the bounding box on screen
    const marginX = (screenWidth - boundingWidth) / 2;
    const marginY = (screenHeight - boundingHeight) / 2;
    
    return {
      left: marginX,
      right: screenWidth - marginX,
      top: marginY,
      bottom: screenHeight - marginY
    };
  }

  /**
   * Initialize the logical point at the center of the bounding box with random velocity
   * 
   * @returns LogicalPoint object with initial position and velocity
   */
  private initializeLogicalPoint(): LogicalPoint {
    const { initialSpeed } = this.config;
    
    // Start at center of bounding box
    const centerX = (this.boundingBox.left + this.boundingBox.right) / 2;
    const centerY = (this.boundingBox.top + this.boundingBox.bottom) / 2;
    
    // Generate random initial velocity direction
    const angle = Math.random() * Math.PI * 2;
    const velocityX = Math.cos(angle) * initialSpeed;
    const velocityY = Math.sin(angle) * initialSpeed;
    
    return {
      x: centerX,
      y: centerY,
      velocityX,
      velocityY
    };
  }

  /**
   * Update the logical point position and handle boundary collisions
   * 
   * This method should be called every frame with the delta time to ensure
   * frame-rate independent movement.
   * 
   * @param deltaTime Time elapsed since last update in milliseconds
   */
  public update(deltaTime: number): void {
    // Convert delta time from milliseconds to seconds
    const deltaSeconds = deltaTime / 1000;
    
    // Validate delta time to prevent large jumps
    const clampedDelta = Math.min(deltaSeconds, 1/30); // Cap at 30 FPS minimum
    
    // Update position based on velocity and delta time
    this.logicalPoint.x += this.logicalPoint.velocityX * clampedDelta;
    this.logicalPoint.y += this.logicalPoint.velocityY * clampedDelta;
    
    // Handle boundary collisions
    this.handleBoundaryCollisions();
  }

  /**
   * Handle collisions with bounding box boundaries
   * 
   * When the logical point hits a boundary, reverse the appropriate velocity
   * component and clamp the position to prevent boundary penetration.
   */
  private handleBoundaryCollisions(): void {
    // Check horizontal boundaries
    if (this.logicalPoint.x <= this.boundingBox.left) {
      this.logicalPoint.velocityX = Math.abs(this.logicalPoint.velocityX); // Ensure positive velocity
      this.logicalPoint.x = this.boundingBox.left; // Clamp to boundary
    } else if (this.logicalPoint.x >= this.boundingBox.right) {
      this.logicalPoint.velocityX = -Math.abs(this.logicalPoint.velocityX); // Ensure negative velocity
      this.logicalPoint.x = this.boundingBox.right; // Clamp to boundary
    }
    
    // Check vertical boundaries
    if (this.logicalPoint.y <= this.boundingBox.top) {
      this.logicalPoint.velocityY = Math.abs(this.logicalPoint.velocityY); // Ensure positive velocity
      this.logicalPoint.y = this.boundingBox.top; // Clamp to boundary
    } else if (this.logicalPoint.y >= this.boundingBox.bottom) {
      this.logicalPoint.velocityY = -Math.abs(this.logicalPoint.velocityY); // Ensure negative velocity
      this.logicalPoint.y = this.boundingBox.bottom; // Clamp to boundary
    }
  }

  /**
   * Calculate the background sprite position based on the logical point
   * 
   * The sprite is positioned offset from the logical point by half its dimensions
   * to ensure the logical point represents the center of the sprite.
   * 
   * @param spriteWidth Width of the background sprite
   * @param spriteHeight Height of the background sprite
   * @param spriteScaleX Horizontal scale factor of the sprite
   * @param spriteScaleY Vertical scale factor of the sprite
   * @returns Object with x and y coordinates for sprite positioning
   */
  public getBackgroundPosition(
    spriteWidth: number, 
    spriteHeight: number, 
    spriteScaleX: number = 1, 
    spriteScaleY: number = 1
  ): { x: number; y: number } {
    // Calculate actual sprite dimensions considering scale
    const actualWidth = spriteWidth * spriteScaleX;
    const actualHeight = spriteHeight * spriteScaleY;
    
    // Position sprite so logical point is at its center
    const spriteX = this.logicalPoint.x - actualWidth / 2;
    const spriteY = this.logicalPoint.y - actualHeight / 2;
    
    return { x: spriteX, y: spriteY };
  }

  /**
   * Reset the logical point to center with new random velocity
   * 
   * Useful for restarting the bouncing animation or recovering from errors.
   */
  public reset(): void {
    this.logicalPoint = this.initializeLogicalPoint();
  }

  /**
   * Get current logical point information for debugging
   * 
   * @returns Copy of current logical point state
   */
  public getLogicalPoint(): Readonly<LogicalPoint> {
    return { ...this.logicalPoint };
  }

  /**
   * Get bounding box information for debugging
   * 
   * @returns Copy of current bounding box
   */
  public getBoundingBox(): Readonly<BoundingBox> {
    return { ...this.boundingBox };
  }

  /**
   * Update configuration and recalculate bounding box
   * 
   * Useful when screen dimensions change (e.g., window resize)
   * 
   * @param newConfig New configuration to apply
   */
  public updateConfig(newConfig: Partial<BackgroundBouncerConfig>): void {
    // Update configuration
    this.config = { ...this.config, ...newConfig };
    
    // Validate updated configuration
    this.validateConfig();
    
    // Recalculate bounding box
    const oldBoundingBox = this.boundingBox;
    this.boundingBox = this.calculateBoundingBox();
    
    // Adjust logical point position if it's now outside new bounds
    this.adjustLogicalPointToBounds(oldBoundingBox);
  }

  /**
   * Adjust logical point position to fit within new bounding box
   * 
   * @param oldBoundingBox Previous bounding box for reference
   */
  private adjustLogicalPointToBounds(oldBoundingBox: BoundingBox): void {
    // Calculate relative position within old bounds
    const relativeX = (this.logicalPoint.x - oldBoundingBox.left) / (oldBoundingBox.right - oldBoundingBox.left);
    const relativeY = (this.logicalPoint.y - oldBoundingBox.top) / (oldBoundingBox.bottom - oldBoundingBox.top);
    
    // Apply relative position to new bounds
    this.logicalPoint.x = this.boundingBox.left + relativeX * (this.boundingBox.right - this.boundingBox.left);
    this.logicalPoint.y = this.boundingBox.top + relativeY * (this.boundingBox.bottom - this.boundingBox.top);
    
    // Ensure position is within bounds (handle edge cases)
    this.logicalPoint.x = Math.max(this.boundingBox.left, Math.min(this.boundingBox.right, this.logicalPoint.x));
    this.logicalPoint.y = Math.max(this.boundingBox.top, Math.min(this.boundingBox.bottom, this.logicalPoint.y));
  }
}
