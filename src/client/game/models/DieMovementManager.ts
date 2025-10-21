import { SimpleDie } from './SimpleDie.js';

/**
 * Manages autonomous die movement with a queue system
 */
export class DieMovementManager {
  private scene: Phaser.Scene;
  private movingDice: Set<SimpleDie> = new Set();
  private onAllMovementComplete?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Add a die to move to a target position
   */
  public moveDie(die: SimpleDie, targetX: number, targetY: number): Promise<void> {
    return new Promise((resolve) => {
      this.movingDice.add(die);
      
      // Listen for movement completion
      die.once('moveComplete', () => {
        this.movingDice.delete(die);
        resolve();
        
        // Check if all movements are complete
        if (this.movingDice.size === 0 && this.onAllMovementComplete) {
          this.onAllMovementComplete();
          this.onAllMovementComplete = undefined;
        }
      });
      
      die.moveToPosition(targetX, targetY);
    });
  }

  /**
   * Move multiple dice and wait for all to complete
   */
  public async moveMultipleDice(movements: Array<{
    die: SimpleDie;
    targetX: number;
    targetY: number;
  }>): Promise<void> {
    const promises = movements.map(({ die, targetX, targetY }) => 
      this.moveDie(die, targetX, targetY)
    );
    
    await Promise.all(promises);
  }

  /**
   * Update all moving dice (call this every frame)
   */
  public update(): void {
    for (const die of this.movingDice) {
      die.update();
    }
  }

  /**
   * Check if any dice are currently moving
   */
  public hasMovingDice(): boolean {
    return this.movingDice.size > 0;
  }

  /**
   * Get count of moving dice
   */
  public getMovingDiceCount(): number {
    return this.movingDice.size;
  }

  /**
   * Set callback for when all movements complete
   */
  public onMovementComplete(callback: () => void): void {
    if (this.movingDice.size === 0) {
      // No dice moving, call immediately
      callback();
    } else {
      this.onAllMovementComplete = callback;
    }
  }

  /**
   * Force stop all movements
   */
  public stopAllMovements(): void {
    for (const die of this.movingDice) {
      // Snap each die to its target
      die.setPosition(die.targetX, die.targetY);
    }
    this.movingDice.clear();
    
    if (this.onAllMovementComplete) {
      this.onAllMovementComplete();
      this.onAllMovementComplete = undefined;
    }
  }
}
