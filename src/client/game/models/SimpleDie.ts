import { DieColor } from '../../../shared/types/game.js';

/**
 * SimpleDie - A Phaser GameObject that manages itself autonomously
 * Uses Phaser's built-in update system and event architecture
 */
export class SimpleDie extends Phaser.GameObjects.Container {
  public sides: number;
  public number: number;
  public color: DieColor;
  public isWild: boolean;
  public isBlack: boolean;

  private graphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private cellSize: number;

  // Movement system
  public targetX: number;
  public targetY: number;
  private isMoving: boolean = false;
  private moveSpeed: number = 8; // pixels per frame
  private movementManager?: any; // Reference to movement manager

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
    super(scene, x, y);
    
    this.targetX = x;
    this.targetY = y;
    this.sides = sides;
    this.color = color;
    this.isWild = isWild;
    this.isBlack = isBlack;
    this.cellSize = cellSize;

    // Roll initial number
    this.roll();

    // Create visuals and add to container
    this.createVisuals();
    this.render();

    // Add to scene so it gets updated
    scene.add.existing(this);
  }

  /**
   * Roll the die to get a random number
   */
  public roll(): void {
    if (this.isWild) {
      this.number = 0; // Wild dice don't have a specific number
    } else {
      this.number = Math.floor(Math.random() * this.sides) + 1;
    }
  }

  /**
   * Create the visual components and add them to this container
   */
  private createVisuals(): void {
    // Create graphics object for the die square
    this.graphics = this.scene.add.graphics();
    
    // Create text object for the number
    this.text = this.scene.add.text(0, 0, '', {
      fontSize: this.calculateFontSize() + 'px',
      color: '#ffd700',
      fontFamily: 'Anta',
      fontStyle: 'normal',
      stroke: '#000000',
      strokeThickness: this.calculateStrokeThickness()
    });
    this.text.setOrigin(0.5, 0.5);

    // Add to container
    this.add([this.graphics, this.text]);
  }

  /**
   * Render the die (this is the ONLY drawing method)
   */
  private render(): void {
    // Clear previous graphics
    this.graphics.clear();

    // Get colors
    const { fillColor, strokeColor } = this.getDieColors();

    // Draw the die square
    this.drawDieSquare(fillColor, strokeColor);

    // Update text
    this.updateText();

    // Position everything correctly
    this.updatePositions();
  }

  /**
   * Draw the die square (clean and simple)
   */
  private drawDieSquare(fillColor: number, strokeColor: number): void {
    const borderSize = 1;
    const size = this.cellSize - 2;

    // Set styles
    this.graphics.fillStyle(fillColor, 1.0);
    this.graphics.lineStyle(1, strokeColor, 1.0);

    // Draw square
    this.graphics.fillRect(borderSize, borderSize, size, size);
    this.graphics.strokeRect(borderSize, borderSize, size, size);
  }

  /**
   * Update text content and styling
   */
  private updateText(): void {
    let displayText = '';
    
    if (this.isBlack) {
      displayText = 'X';
    } else if (this.isWild) {
      displayText = '*';
    } else {
      displayText = this.number.toString();
    }

    this.text.setText(displayText);
    this.text.setStyle({
      fontSize: this.calculateFontSize() + 'px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: this.calculateStrokeThickness()
    });
  }

  /**
   * Update positions of graphics and text within container
   */
  private updatePositions(): void {
    // Position graphics relative to container center
    this.graphics.setPosition(-this.cellSize / 2, -this.cellSize / 2);
    
    // Text is already centered at 0,0 within container
    this.text.setPosition(0, 0);
  }

  /**
   * Set movement manager reference
   */
  public setMovementManager(manager: any): void {
    this.movementManager = manager;
  }

  /**
   * Move to target position with smooth animation
   */
  public moveToPosition(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    
    if (!this.isMoving) {
      this.isMoving = true;
      
      // Register with movement manager
      if (this.movementManager) {
        this.movementManager.registerMovingDie(this);
      }
    }
  }

  // Die is naturally autonomous through proper design - no special methods needed

  /**
   * Phaser's built-in preUpdate - called automatically every frame
   */
  public preUpdate(): void {
    if (!this.isMoving) return;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.moveSpeed) {
      // Close enough - snap to target and stop moving
      this.setPosition(this.targetX, this.targetY);
      this.isMoving = false;
      
      // Emit movement complete event (movement manager will handle unregistration)
      this.emit('moveComplete', this);
    } else {
      // Move towards target
      this.x += (dx / distance) * this.moveSpeed;
      this.y += (dy / distance) * this.moveSpeed;
    }
  }

  /**
   * Check if die is currently moving
   */
  public isCurrentlyMoving(): boolean {
    return this.isMoving;
  }

  /**
   * Update cell size and re-render
   */
  public updateCellSize(newCellSize: number): void {
    this.cellSize = newCellSize;
    this.render();
  }

  /**
   * Set position based on grid coordinates
   */
  public setGridPosition(gridX: number, gridY: number, cellSize: number, offsetX: number, offsetY: number): void {
    this.cellSize = cellSize;
    const worldX = offsetX + gridX * cellSize + cellSize / 2;
    const worldY = offsetY + gridY * cellSize + cellSize / 2;
    this.setPosition(worldX, worldY);
    this.render(); // Re-render with new size
  }

  /**
   * Calculate font size based on cell size
   */
  private calculateFontSize(): number {
    if (this.cellSize <= 24) {
      return Math.max(16, Math.floor(this.cellSize * 0.75));
    } else if (this.cellSize <= 32) {
      return Math.max(20, Math.floor(this.cellSize * 0.65));
    } else {
      return Math.min(48, Math.max(24, Math.floor(this.cellSize * 0.6)));
    }
  }

  /**
   * Calculate stroke thickness based on cell size
   */
  private calculateStrokeThickness(): number {
    if (this.cellSize <= 24) {
      return 2;
    } else if (this.cellSize <= 32) {
      return 3;
    } else {
      return Math.max(3, Math.floor(this.cellSize / 12));
    }
  }

  /**
   * Get die colors based on properties
   */
  private getDieColors(): { fillColor: number; strokeColor: number } {
    if (this.isBlack) {
      return {
        fillColor: 0x2a2a2a,
        strokeColor: 0xff0000
      };
    }
    
    if (this.isWild) {
      return {
        fillColor: 0xffffff,
        strokeColor: 0xffd700
      };
    }
    
    // Regular dice - clean blue
    return {
      fillColor: 0x4dabf7,
      strokeColor: 0x0066cc
    };
  }

  /**
   * Set alpha (transparency) - override Container method
   */
  public override setAlpha(alpha: number): this {
    this.graphics.setAlpha(alpha);
    this.text.setAlpha(alpha);
    return this;
  }

  /**
   * Destroy the die and clean up resources - override Container method
   */
  public override destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
    if (this.text) {
      this.text.destroy();
    }
    super.destroy();
  }

  /**
   * Clone this die
   */
  public clone(scene: Phaser.Scene, x?: number, y?: number): SimpleDie {
    const newDie = new SimpleDie(
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
    newDie.render();
    
    return newDie;
  }

  /**
   * Get match value for game logic
   */
  public getMatchValue(): number {
    if (this.isWild) {
      return -1; // Special value for wild
    }
    return this.number;
  }

  /**
   * Check if can match with another die
   */
  public canMatchWith(otherDie: SimpleDie): boolean {
    if (this.isWild || otherDie.isWild) {
      return true;
    }
    return this.number === otherDie.number;
  }

  /**
   * Get display text
   */
  public getDisplayText(): string {
    if (this.isBlack) return 'BLACK';
    if (this.isWild) return 'WILD';
    return this.number.toString();
  }

  /**
   * Convert to wild die
   */
  public convertToWild(): void {
    this.isWild = true;
    this.isBlack = false;
    this.number = 0;
    this.render();
  }

  /**
   * Upgrade to max sides
   */
  public upgradeToMax(maxSides: number): void {
    if (!this.isWild && !this.isBlack) {
      this.sides = maxSides;
      this.number = maxSides;
      this.render();
    }
  }

  /**
   * Get die data for serialization
   */
  public toData(): {
    sides: number;
    number: number;
    color: DieColor;
    isWild: boolean;
    isBlack: boolean;
  } {
    return {
      sides: this.sides,
      number: this.number,
      color: this.color,
      isWild: this.isWild,
      isBlack: this.isBlack
    };
  }



  /**
   * Create die from data
   */
  public static fromData(
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
  ): SimpleDie {
    const die = new SimpleDie(scene, x, y, data.sides, data.color, data.isWild, data.isBlack, cellSize);
    die.number = data.number;
    die.render();
    return die;
  }
}
