import { SimpleDie } from '../models/SimpleDie.js';

/**
 * Manages moving dice with explicit registration/unregistration
 */
export class MovementManager extends Phaser.Events.EventEmitter {
  private movingDice: Set<SimpleDie> = new Set();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
  }

  /**
   * Register a die as moving
   */
  public registerMovingDie(die: SimpleDie): void {
    if (!this.movingDice.has(die)) {
      this.movingDice.add(die);
      console.log(`Die registered as moving. Total moving: ${this.movingDice.size}`);
      
      // Listen for this die's completion
      die.once('moveComplete', () => {
        this.unregisterMovingDie(die);
      });

      // If this is the first moving die, emit movement started
      if (this.movingDice.size === 1) {
        this.emit('movementStarted');
      }
    }
  }

  /**
   * Unregister a die as moving
   */
  public unregisterMovingDie(die: SimpleDie): void {
    if (this.movingDice.has(die)) {
      this.movingDice.delete(die);
      console.log(`Die unregistered from moving. Total moving: ${this.movingDice.size}`);

      // If no more dice are moving, emit all movement complete
      if (this.movingDice.size === 0) {
        console.log('All dice movement complete');
        this.emit('allMovementComplete');
      }
    }
  }

  /**
   * Check if any dice are moving
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
   * Force stop all movements (emergency cleanup)
   */
  public forceStopAllMovements(): void {
    console.log(`Force stopping ${this.movingDice.size} moving dice`);
    
    for (const die of this.movingDice) {
      // Snap die to target position
      if (die.targetX !== undefined && die.targetY !== undefined) {
        die.setPosition(die.targetX, die.targetY);
      }
    }
    
    this.movingDice.clear();
    this.emit('allMovementComplete');
  }

  /**
   * Get list of currently moving dice (for debugging)
   */
  public getMovingDice(): SimpleDie[] {
    return Array.from(this.movingDice);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.forceStopAllMovements();
    this.removeAllListeners();
  }
}
