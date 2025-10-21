import { Die } from './Die.js';
import { DieColor } from '../../../shared/types/game.js';

/**
 * TestDie class that provides visual representation using Phaser drawing commands
 * This is a temporary implementation for testing until proper dice sprites are created
 */
export class TestDie extends Die {
  private graphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private cellSize: number = 32; // Dynamic cell size

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    sides: number,
    color: DieColor,
    isWild: boolean = false,
    isBlack: boolean = false,
    cellSize: number = 32
  ) {
    // Call parent constructor but handle scene addition ourselves
    super(scene, x, y, sides, color, isWild, isBlack);
    
    // Set the cell size for this die
    this.cellSize = cellSize;
    
    // Create graphics object for drawing the die
    try {
      if (scene.add && scene.add.graphics) {
        this.graphics = scene.add.graphics();
        // Position graphics at top-left corner of the cell
        this.graphics.setPosition(x - this.cellSize / 2, y - this.cellSize / 2);
      } else {
        // Create a mock graphics object for testing
        this.graphics = this.createMockGraphics();
      }
    } catch (error) {
      console.warn('Failed to create graphics object:', error);
      this.graphics = this.createMockGraphics();
    }
    
    // Create text object for displaying the face value
    try {
      if (scene.add && scene.add.text) {
        this.text = scene.add.text(x, y, '', {
          fontSize: this.calculateFontSize() + 'px',
          color: '#ffd700', // Gold color
          fontFamily: 'Anta',
          fontStyle: 'normal',
          stroke: '#000000', // Black stroke
          strokeThickness: this.calculateStrokeThickness()
        });
        this.text.setOrigin(0.5, 0.5);
      } else {
        // Create a mock text object for testing
        this.text = this.createMockText();
      }
    } catch (error) {
      console.warn('Failed to create text object:', error);
      this.text = this.createMockText();
    }
    
    // Initial render
    this.renderVisual();
  }

  /**
   * Create a mock graphics object for testing environments
   */
  private createMockGraphics(): any {
    return {
      clear: () => {},
      fillStyle: () => {},
      lineStyle: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillTriangle: () => {},
      setPosition: () => {},
      destroy: () => {}
    };
  }

  /**
   * Create a mock text object for testing environments
   */
  private createMockText(): any {
    return {
      setText: () => {},
      setStyle: () => {},
      setPosition: () => {},
      setOrigin: () => {},
      destroy: () => {}
    };
  }

  /**
   * Override renderNumber to use our custom visual rendering
   */
  public override renderNumber(): void {
    // Disable the base Die sprite rendering to prevent double drawing
    this.setVisible(false); // Hide the sprite
    this.renderVisual();
  }

  /**
   * Render the die using Phaser drawing commands
   */
  private renderVisual(): void {
    // Skip rendering if we don't have real graphics objects (testing environment)
    if (!this.graphics || !this.graphics.clear || !this.text || !this.text.setText) {
      console.log('Skipping TestDie rendering - graphics or text not available');
      return;
    }
    
    // Clear previous graphics
    this.graphics.clear();
    
    // Get colors for the die
    const { fillColor, strokeColor } = this.getDieColors();
    
    // Draw the die square
    this.drawDieSquare(fillColor, strokeColor);
    
    // Update text content and color
    this.updateDieText();
    
    // Position graphics and text correctly
    this.graphics.setPosition(this.x - this.cellSize / 2, this.y - this.cellSize / 2);
    this.text.setPosition(this.x, this.y);
    
    // Ensure text is properly centered
    this.text.setOrigin(0.5, 0.5);
  }

  /**
   * Draw the square shape of the die
   */
  private drawDieSquare(fillColor: number, strokeColor: number): void {
    // Skip if graphics is not available
    if (!this.graphics || !this.graphics.fillStyle) return;
    
    // Simple clean die - just the blue square with minimal border
    const borderSize = 1; // Minimal 1px border
    const size = this.cellSize - 2; // Leave 1px border on each side
    
    try {
      // Set fill and stroke styles
      this.graphics.fillStyle(fillColor, 1.0);
      this.graphics.lineStyle(1, strokeColor, 1.0);
      
      // Draw just the main square - clean and simple
      this.graphics.fillRect(borderSize, borderSize, size, size);
      this.graphics.strokeRect(borderSize, borderSize, size, size);
      
    } catch (error) {
      console.warn('Error drawing die square:', error);
    }
  }



  /**
   * Update the text display for the die
   */
  private updateDieText(): void {
    // Skip if text is not available
    if (!this.text || !this.text.setText) return;
    
    try {
      let displayText = '';
      
      if (this.isBlack) {
        displayText = 'X'; // X for black dice (avoid emoji issues)
      } else if (this.isWild) {
        displayText = '*'; // Star for wild dice
      } else {
        displayText = this.number.toString();
      }
      
      this.text.setText(displayText);
      this.text.setStyle({ 
        fontSize: this.calculateFontSize() + 'px',
        color: '#ffd700', // Always use gold for die numbers
        stroke: '#000000',
        strokeThickness: this.calculateStrokeThickness()
      });
    } catch (error) {
      console.warn('Error updating die text:', error);
    }
  }

  /**
   * Get appropriate colors for the die based on its properties
   */
  private getDieColors(): { fillColor: number; strokeColor: number; textColor: string } {
    if (this.isBlack) {
      return {
        fillColor: 0x2a2a2a,
        strokeColor: 0xff0000,
        textColor: '#ff0000'
      };
    }
    
    if (this.isWild) {
      return {
        fillColor: 0xffffff,
        strokeColor: 0xffd700,
        textColor: '#ffd700'
      };
    }
    
    // All regular dice use the same blue color for now (colors disabled)
    return {
      fillColor: 0x4dabf7,
      strokeColor: 0x0066cc,
      textColor: '#ffffff'
    };
  }

  /**
   * Override setPosition to update graphics and text positions
   */
  public override setPosition(x?: number, y?: number): this {
    super.setPosition(x, y);
    
    // Keep the base sprite hidden to prevent double drawing
    this.setVisible(false);
    
    if (this.graphics && this.graphics.setPosition && this.text && this.text.setPosition) {
      // Position graphics so the die square is centered on the given x,y
      this.graphics.setPosition(this.x - this.cellSize / 2, this.y - this.cellSize / 2);
      this.text.setPosition(this.x, this.y);
      this.text.setOrigin(0.5, 0.5); // Ensure text stays centered
    }
    
    return this;
  }

  /**
   * Override destroy to clean up graphics and text objects
   */
  public override destroy(fromScene?: boolean): void {
    if (this.graphics && this.graphics.destroy) {
      this.graphics.destroy();
    }
    if (this.text && this.text.destroy) {
      this.text.destroy();
    }
    super.destroy(fromScene);
  }

  /**
   * Create a copy of this TestDie with the same properties
   */
  public override clone(scene: Phaser.Scene, x?: number, y?: number): TestDie {
    const newDie = new TestDie(
      scene,
      x ?? this.x,
      y ?? this.y,
      this.sides,
      this.color,
      this.isWild,
      this.isBlack,
      this.cellSize
    );
    
    // Copy the current number (don't re-roll)
    newDie.number = this.number;
    newDie.renderVisual();
    
    return newDie;
  }

  /**
   * Override upgradeToMax to trigger visual update
   */
  public override upgradeToMax(maxSides: number): void {
    super.upgradeToMax(maxSides);
    this.renderVisual();
  }

  /**
   * Override convertToWild to trigger visual update
   */
  public override convertToWild(): void {
    super.convertToWild();
    this.renderVisual();
  }

  /**
   * Create TestDie from data (for deserialization)
   */
  public static override fromData(
    scene: Phaser.Scene,
    x: number,
    y: number,
    data: {
      sides: number;
      number: number;
      color: DieColor;
      isWild: boolean;
      isBlack: boolean;
    },
    cellSize: number = 32
  ): TestDie {
    const die = new TestDie(scene, x, y, data.sides, data.color, data.isWild, data.isBlack, cellSize);
    die.number = data.number;
    die.renderVisual();
    return die;
  }

  /**
   * Get the cell size for grid calculations
   */
  public getCellSize(): number {
    return this.cellSize;
  }

  /**
   * Calculate appropriate font size based on cell size
   * Mobile (24px): 16px font
   * Desktop (32px): 20px font  
   * Fullscreen (up to 128px): scales proportionally
   */
  private calculateFontSize(): number {
    if (this.cellSize <= 24) {
      // Mobile: larger relative font size for visibility
      return Math.max(16, Math.floor(this.cellSize * 0.75));
    } else if (this.cellSize <= 32) {
      // Desktop: good balance
      return Math.max(20, Math.floor(this.cellSize * 0.65));
    } else {
      // Fullscreen: scale proportionally but cap for readability
      return Math.min(48, Math.max(24, Math.floor(this.cellSize * 0.6)));
    }
  }

  /**
   * Calculate stroke thickness based on cell size
   */
  private calculateStrokeThickness(): number {
    if (this.cellSize <= 24) {
      return 2; // Thinner stroke for small cells
    } else if (this.cellSize <= 32) {
      return 3; // Standard stroke
    } else {
      return Math.max(3, Math.floor(this.cellSize / 12)); // Scale with size
    }
  }

  /**
   * Set position based on grid coordinates and offset
   */
  public setGridPosition(gridX: number, gridY: number, cellSize: number, offsetX: number, offsetY: number): void {
    this.cellSize = cellSize;
    const worldX = offsetX + gridX * cellSize + cellSize / 2;
    const worldY = offsetY + gridY * cellSize + cellSize / 2;
    this.setPosition(worldX, worldY);
    
    // Update font size based on new cell size
    if (this.text && this.text.setStyle) {
      this.text.setStyle({
        fontSize: this.calculateFontSize() + 'px',
        strokeThickness: this.calculateStrokeThickness()
      });
    }
    
    // Re-render with new size
    this.renderVisual();
  }

  /**
   * Update cell size and re-render
   */
  public updateCellSize(newCellSize: number): void {
    this.cellSize = newCellSize;
    
    // Update font size
    if (this.text && this.text.setStyle) {
      this.text.setStyle({
        fontSize: this.calculateFontSize() + 'px',
        strokeThickness: this.calculateStrokeThickness()
      });
    }
    
    // Re-render with new size
    this.renderVisual();
  }
}
