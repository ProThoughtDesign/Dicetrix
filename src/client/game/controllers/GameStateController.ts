import { Piece } from '../models/Piece.js';
import { MovementManager } from '../managers/MovementManager.js';

/**
 * Game state phases for the finite state machine
 */
export enum GamePhase {
  SPAWN = 'spawn',
  DROP_CONTROL = 'drop_control', 
  LOCK = 'lock',
  MATCH = 'match',
  CLEAR_MATCH = 'clear_match',
  CASCADE = 'cascade'
}

/**
 * Finite state machine game controller
 * Manages the game flow through distinct phases
 */
export class GameStateController extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private grid: any;
  private matchProcessor: any;
  private movementManager: MovementManager;
  private currentPiece: Piece | null = null;
  
  // Finite state machine
  private currentPhase: GamePhase = GamePhase.SPAWN;
  private phaseStartTime: number = 0;
  private processingCascade: boolean = false;
  private phaseProcessed: boolean = false;
  private readonly PHASE_TIMEOUT_MS = 5000; // 5 second timeout

  constructor(scene: Phaser.Scene, grid: any, matchProcessor: any) {
    super();
    this.scene = scene;
    this.grid = grid;
    this.matchProcessor = matchProcessor;
    this.movementManager = new MovementManager(scene);
    this.phaseStartTime = Date.now();

    console.log(`🎮 GameStateController initialized in phase: ${this.currentPhase}`);
  }

  /**
   * Refresh visual state through the game scene
   */
  private refreshVisualState(): void {
    if (this.scene && 'refreshVisualState' in this.scene) {
      (this.scene as any).refreshVisualState();
    }
  }

  /**
   * Update the state machine - called from game loop
   */
  public update(): void {
    // Safety timeout check
    const timeInPhase = Date.now() - this.phaseStartTime;
    if (timeInPhase > this.PHASE_TIMEOUT_MS) {
      console.warn(`⚠️ Phase ${this.currentPhase} timeout after ${timeInPhase}ms - forcing spawn`);
      this.forceSpawn();
      return;
    }

    switch (this.currentPhase) {
      case GamePhase.SPAWN:
        this.updateSpawnPhase();
        break;
      case GamePhase.DROP_CONTROL:
        this.updateDropControlPhase();
        break;
      case GamePhase.LOCK:
        this.updateLockPhase();
        break;
      case GamePhase.MATCH:
        this.updateMatchPhase();
        break;
      case GamePhase.CLEAR_MATCH:
        this.updateClearMatchPhase();
        break;
      case GamePhase.CASCADE:
        this.updateCascadePhase();
        break;
    }
  }

  /**
   * Transition to a new phase
   */
  private transitionToPhase(newPhase: GamePhase): void {
    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;
    this.phaseStartTime = Date.now();
    this.phaseProcessed = false; // Reset processing flag
    
    console.log(`🔄 Phase transition: ${oldPhase} → ${newPhase}`);
    this.emit('phaseChanged', { from: oldPhase, to: newPhase });
  }

  /**
   * SPAWN phase - waiting for piece to be spawned
   */
  private updateSpawnPhase(): void {
    if (!this.phaseProcessed) {
      console.log('🚀 SPAWN: Requesting new piece');
      this.phaseProcessed = true;
      this.requestSpawn();
    }
    
    // Once piece is set, we transition to DROP_CONTROL
    if (this.currentPiece) {
      console.log('🚀 SPAWN: Piece received, transitioning to DROP_CONTROL');
      this.transitionToPhase(GamePhase.DROP_CONTROL);
    }
    
    // Safety check - if we've been in spawn too long, force a spawn request
    const timeInPhase = Date.now() - this.phaseStartTime;
    if (timeInPhase > 2000 && this.phaseProcessed) { // 2 seconds
      console.warn('⚠️ SPAWN: Taking too long, re-requesting spawn');
      this.phaseProcessed = false; // Allow re-processing
    }
  }

  /**
   * DROP_CONTROL phase - piece is falling and player can control it
   */
  private updateDropControlPhase(): void {
    // This phase is managed externally by gravity and input systems
    // When piece needs to lock, external system calls lockCurrentPiece()
  }

  /**
   * LOCK phase - piece is being locked into the grid
   */
  private updateLockPhase(): void {
    if (this.phaseProcessed) return;
    
    if (!this.currentPiece) {
      console.log('❌ LOCK phase but no current piece - transitioning to SPAWN');
      this.transitionToPhase(GamePhase.SPAWN);
      return;
    }

    console.log(`🔒 LOCK: Locking piece ${this.currentPiece.shape} with ${this.currentPiece.dice.length} dice`);

    // Place each die in the grid using the dice matrix (properly rotated)
    const diceMatrix = this.currentPiece.getDiceMatrix();
    const matrixSize = this.currentPiece.getMatrixSize();
    console.log(`🔒 LOCK: Processing ${matrixSize}x${matrixSize} dice matrix`);
    
    let placedDice = 0;
    for (let row = 0; row < matrixSize; row++) {
      for (let col = 0; col < matrixSize; col++) {
        const die = diceMatrix[row]?.[col];
        if (die) {
          const gridX = this.currentPiece.gridX + col;
          const gridY = this.currentPiece.gridY + row;
          
          console.log(`🔒 LOCK: Placing die ${die.getDisplayText()} at (${gridX}, ${gridY})`);
          const success = this.grid.setDie(gridX, gridY, die);
          if (success) {
            die.setMovementManager(this.movementManager);
            placedDice++;
          } else {
            console.error(`❌ Failed to place die at (${gridX}, ${gridY})`);
          }
        }
      }
    }

    console.log(`🔒 LOCK: Successfully placed ${placedDice} dice in grid`);
    
    // Ensure visual consistency - grid is source of truth
    this.refreshVisualState();
    
    // Debug: Print grid state after locking
    this.grid.debugPrintGrid();

    // Clear current piece and transition to MATCH phase
    this.currentPiece = null;
    this.phaseProcessed = true;
    this.transitionToPhase(GamePhase.MATCH);
  }

  /**
   * MATCH phase - checking for matches
   */
  private updateMatchPhase(): void {
    if (this.phaseProcessed) return;
    
    console.log('🔍 MATCH: Checking for matches');
    this.phaseProcessed = true;
    
    // Process matches synchronously to avoid race conditions
    try {
      // Check for matches immediately
      const matches = this.grid.detectMatches();
      console.log(`Found ${matches.length} matches`);
      
      if (matches.length > 0) {
        // Process matches and transition to clear
        this.processMatches().then(matchesFound => {
          if (matchesFound) {
            this.transitionToPhase(GamePhase.CLEAR_MATCH);
          } else {
            // Fallback if processing failed
            this.completeProcessing();
          }
        }).catch(error => {
          console.error('❌ Error processing matches:', error);
          this.completeProcessing();
        });
      } else {
        // No matches found - complete processing
        this.completeProcessing();
      }
    } catch (error) {
      console.error('❌ Error in MATCH phase:', error);
      this.completeProcessing();
    }
  }

  /**
   * Complete processing and return to spawn
   */
  private completeProcessing(): void {
    console.log('✅ Processing complete - returning to spawn');
    this.processingCascade = false;
    this.transitionToPhase(GamePhase.SPAWN);
  }

  /**
   * CLEAR_MATCH phase - clearing matched dice
   */
  private updateClearMatchPhase(): void {
    if (this.phaseProcessed) return;
    
    console.log('🔥 CLEAR_MATCH: Matches cleared, transitioning to CASCADE');
    this.processingCascade = true;
    this.phaseProcessed = true;
    this.transitionToPhase(GamePhase.CASCADE);
  }

  /**
   * CASCADE phase - applying gravity after matches
   */
  private updateCascadePhase(): void {
    if (this.phaseProcessed) return;
    
    console.log('🌊 CASCADE: Processing gravity');
    this.phaseProcessed = true;
    
    // Apply gravity to all dice
    const diceMoving = this.applyGravityToGrid();
    
    if (diceMoving > 0) {
      console.log(`⏳ CASCADE: ${diceMoving} dice moving, waiting for completion`);
      // Wait for movement to complete, then check for more matches
      this.waitForMovementComplete().then(() => {
        this.transitionToPhase(GamePhase.MATCH);
      }).catch(error => {
        console.error('❌ Error waiting for movement:', error);
        this.completeProcessing();
      });
    } else {
      console.log('✅ CASCADE: No dice to move - checking for matches');
      // No movement needed - check for matches
      this.transitionToPhase(GamePhase.MATCH);
    }
  }

  /**
   * Set the current piece and handle phase transition
   */
  public setCurrentPiece(piece: Piece | null): void {
    this.currentPiece = piece;

    if (piece) {
      console.log(`🎯 New current piece: ${piece.shape}`);
      if (this.currentPhase === GamePhase.SPAWN) {
        this.transitionToPhase(GamePhase.DROP_CONTROL);
      }
    }
  }

  /**
   * Lock the current piece - triggers transition to LOCK phase
   */
  public lockCurrentPiece(): void {
    console.log('🔒 lockCurrentPiece() called');
    
    if (this.currentPhase !== GamePhase.DROP_CONTROL) {
      console.log(`❌ Cannot lock piece in phase: ${this.currentPhase}`);
      return;
    }

    if (!this.currentPiece) {
      console.log('❌ No current piece to lock');
      return;
    }

    // Emit input disabled event
    this.emit('inputDisabled');
    
    // Transition to LOCK phase
    this.transitionToPhase(GamePhase.LOCK);
  }

  /**
   * Process matches asynchronously
   */
  private async processMatches(): Promise<boolean> {
    try {
      const matchResult = await this.matchProcessor.processMatches();
      
      if (matchResult.matchesFound) {
        console.log(`🔥 Found matches: ${matchResult.clearedDice.length} dice cleared`);
        this.emit('scoreUpdate', matchResult.totalScore);
        
        // Ensure visual consistency after clearing matches
        this.refreshVisualState();
        
        // Debug: Print grid state after clearing matches
        console.log('🔥 Grid state after clearing matches:');
        this.grid.debugPrintGrid();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error processing matches:', error);
      return false;
    }
  }

  /**
   * Apply gravity to all dice in the grid
   * Returns the number of dice that started moving
   */
  private applyGravityToGrid(): number {
    let diceMoving = 0;
    console.log(`🌊 GRAVITY: Applying gravity to ${this.grid.width}x${this.grid.height} grid`);

    // Process from bottom to top to avoid conflicts
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = this.grid.height - 2; y >= 0; y--) {
        const die = this.grid.getDie(x, y);
        if (die && !die.isCurrentlyMoving()) {
          // Find how far this die can fall
          let fallY = y;
          while (fallY + 1 < this.grid.height && this.grid.isEmpty(x, fallY + 1)) {
            fallY++;
          }

          if (fallY > y) {
            console.log(`🌊 GRAVITY: Die ${die.getDisplayText()} falling from (${x}, ${y}) to (${x}, ${fallY})`);
            
            // Move die in grid - this should update the cells array
            this.grid.setDie(x, y, null);        // Clear old position
            this.grid.setDie(x, fallY, die);     // Set new position

            // Start visual movement
            const targetPos = this.grid.gridToScreen(x, fallY);
            die.setMovementManager(this.movementManager);
            die.moveToPosition(targetPos.x, targetPos.y);
            diceMoving++;
          }
        }
      }
    }

    console.log(`🌊 GRAVITY: ${diceMoving} dice started moving`);
    
    // Ensure visual consistency after gravity
    if (diceMoving > 0) {
      this.refreshVisualState();
    }
    
    // Debug: Print grid state after gravity
    if (diceMoving > 0) {
      console.log('🌊 Grid state after gravity applied:');
      this.grid.debugPrintGrid();
    }
    
    return diceMoving;
  }

  /**
   * Wait for all dice movement to complete
   */
  private async waitForMovementComplete(): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = 3000; // 3 second timeout
      
      const checkInterval = setInterval(() => {
        if (!this.movementManager.hasMovingDice()) {
          clearInterval(checkInterval);
          console.log('✅ All dice movement complete');
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          console.warn('⚠️ Movement timeout - forcing completion');
          this.movementManager.forceStopAllMovements();
          resolve(); // Don't reject, just continue
        }
      }, 50);
    });
  }

  /**
   * Check if input is currently enabled (only in DROP_CONTROL phase)
   */
  public isInputEnabled(): boolean {
    return this.currentPhase === GamePhase.DROP_CONTROL;
  }

  /**
   * Check if any processing is happening
   */
  public isProcessing(): boolean {
    return this.currentPhase !== GamePhase.DROP_CONTROL && this.currentPhase !== GamePhase.SPAWN;
  }

  /**
   * Get current piece
   */
  public getCurrentPiece(): Piece | null {
    return this.currentPiece;
  }

  /**
   * Get current phase
   */
  public getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  /**
   * Force transition to spawn phase (for external control)
   */
  public requestSpawn(): void {
    console.log('🚀 Spawn requested - emitting spawnNextPiece event');
    this.processingCascade = false;
    this.emit('inputEnabled');
    this.emit('spawnNextPiece');
  }

  /**
   * Handle completion of cascade processing
   */
  private onCascadeComplete(): void {
    console.log('✅ Cascade processing complete');
    this.processingCascade = false;
    this.transitionToPhase(GamePhase.SPAWN);
  }

  /**
   * Force spawn (emergency recovery)
   */
  private forceSpawn(): void {
    console.log('🚨 FORCE SPAWN - Emergency recovery');
    this.processingCascade = false;
    this.currentPiece = null;
    this.movementManager.forceStopAllMovements();
    this.transitionToPhase(GamePhase.SPAWN);
  }

  /**
   * Cleanup
   */
  public override destroy(): void {
    this.movementManager.destroy();
    this.removeAllListeners();
  }
}
