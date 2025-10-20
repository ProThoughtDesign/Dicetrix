import { Scene } from 'phaser';
import { InputManager, InputEvent } from '../input/InputManager.js';
import { InputValidator } from '../input/InputValidator.js';
import { Piece } from '../models/Piece.js';
import { Grid } from '../models/Grid.js';
import { GameMode } from '../../../shared/types/game.js';
import { AudioEvents } from '../audio/AudioEvents.js';
import { GAME_MODES } from '../../../shared/config/game-modes.js';

/**
 * Game controller state
 */
export interface GameControllerState {
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  grid: Grid;
  gameMode: GameMode;
  isPaused: boolean;
  isGameOver: boolean;
  canMove: boolean;
}

/**
 * Movement validation result
 */
export interface MovementResult {
  success: boolean;
  reason?: string | undefined;
  triggeredLock?: boolean;
}

/**
 * GameController manages the interaction between input and game logic
 * Handles piece movement, rotation, and game state validation
 */
export class GameController {
  private scene: Scene;
  private inputManager: InputManager;
  private inputValidator: InputValidator;
  private state: GameControllerState;
  private audioEvents: AudioEvents | null = null;
  
  // Timing controls
  private fallTimer: Phaser.Time.TimerEvent | null = null;
  private lockDelay: number = 500; // Time before piece locks when it can't move down
  private lockTimer: Phaser.Time.TimerEvent | null = null;
  
  // Movement constraints
  private maxMovesPerSecond: number = 20;
  private moveHistory: number[] = [];
  
  // Callbacks
  private onPieceLocked: ((piece: Piece, positions: any[]) => void) | null = null;
  private onGameOver: (() => void) | null = null;
  private onPause: ((paused: boolean) => void) | null = null;
  private onScoreUpdate: ((points: number) => void) | null = null;

  constructor(scene: Scene, initialState: GameControllerState) {
    this.scene = scene;
    this.state = { ...initialState };
    
    // Initialize input systems
    this.inputManager = new InputManager(scene);
    this.inputValidator = new InputValidator({
      isPaused: this.state.isPaused,
      isGameOver: this.state.isGameOver,
      canMove: this.state.canMove,
      maxInputsPerSecond: this.maxMovesPerSecond
    });
    
    this.setupInputHandlers();
    
    // Start fall timer
    this.startFallTimer();
  }

  /**
   * Setup input event handlers
   */
  private setupInputHandlers(): void {
    // Wrap all input handlers with validation
    this.inputManager.onInput('move_left', (event) => this.validateAndHandle(event, () => this.handleMoveLeft(event)));
    this.inputManager.onInput('move_right', (event) => this.validateAndHandle(event, () => this.handleMoveRight(event)));
    this.inputManager.onInput('move_down', (event) => this.validateAndHandle(event, () => this.handleMoveDown(event)));
    this.inputManager.onInput('rotate', (event) => this.validateAndHandle(event, () => this.handleRotate(event)));
    this.inputManager.onInput('hard_drop', (event) => this.validateAndHandle(event, () => this.handleHardDrop(event)));
    this.inputManager.onInput('pause', (event) => this.validateAndHandle(event, () => this.handlePause(event)));
  }

  /**
   * Validate input event before processing
   */
  private validateAndHandle(event: InputEvent, handler: () => void): void {
    // Update validator context
    this.inputValidator.updateValidationContext({
      isPaused: this.state.isPaused,
      isGameOver: this.state.isGameOver,
      canMove: this.state.canMove
    });

    // Validate the input
    const validation = this.inputValidator.validate(event);
    
    if (validation.isValid) {
      handler();
    } else if (validation.shouldBlock) {
      console.log(`Input blocked: ${validation.reason}`);
    }
  }

  /**
   * Handle move left input
   */
  private handleMoveLeft(_event: InputEvent): MovementResult {
    if (!this.canProcessMovement()) {
      return { success: false, reason: 'Movement not allowed' };
    }

    const piece = this.state.currentPiece;
    if (!piece) {
      return { success: false, reason: 'No active piece' };
    }

    // Validate movement with grid collision
    if (!piece.canMoveToWithGrid(piece.gridX - 1, piece.gridY, this.state.grid)) {
      return { success: false, reason: 'Collision detected' };
    }

    // Perform movement
    const success = piece.moveLeft();
    if (success) {
      this.recordMovement();
      this.resetLockTimer(); // Reset lock timer on successful movement
      
      // Play movement sound
      if (this.audioEvents) {
        this.audioEvents.onPieceMove();
      }
    }

    return { success, reason: success ? undefined : 'Movement failed' };
  }

  /**
   * Handle move right input
   */
  private handleMoveRight(_event: InputEvent): MovementResult {
    if (!this.canProcessMovement()) {
      return { success: false, reason: 'Movement not allowed' };
    }

    const piece = this.state.currentPiece;
    if (!piece) {
      return { success: false, reason: 'No active piece' };
    }

    // Validate movement with grid collision
    if (!piece.canMoveToWithGrid(piece.gridX + 1, piece.gridY, this.state.grid)) {
      return { success: false, reason: 'Collision detected' };
    }

    // Perform movement
    const success = piece.moveRight();
    if (success) {
      this.recordMovement();
      this.resetLockTimer(); // Reset lock timer on successful movement
      
      // Play movement sound
      if (this.audioEvents) {
        this.audioEvents.onPieceMove();
      }
    }

    return { success, reason: success ? undefined : 'Movement failed' };
  }

  /**
   * Handle move down input (soft drop)
   */
  private handleMoveDown(_event: InputEvent): MovementResult {
    if (!this.canProcessMovement()) {
      return { success: false, reason: 'Movement not allowed' };
    }

    const piece = this.state.currentPiece;
    if (!piece) {
      return { success: false, reason: 'No active piece' };
    }

    // Try to move down
    const canMoveDown = piece.canMoveToWithGrid(piece.gridX, piece.gridY + 1, this.state.grid);
    
    if (canMoveDown) {
      const success = piece.moveDown();
      if (success) {
        this.recordMovement();
        this.resetLockTimer();
        
        // Play movement sound
        if (this.audioEvents) {
          this.audioEvents.onPieceMove();
        }
        
        // Award soft drop points
        if (this.onScoreUpdate) {
          this.onScoreUpdate(1); // 1 point per soft drop
        }
      }
      return { success, reason: success ? undefined : 'Movement failed' };
    } else {
      // Can't move down, start lock timer if not already started
      this.startLockTimer();
      return { success: false, reason: 'Cannot move down', triggeredLock: true };
    }
  }

  /**
   * Handle rotation input
   */
  private handleRotate(_event: InputEvent): MovementResult {
    if (!this.canProcessMovement()) {
      return { success: false, reason: 'Movement not allowed' };
    }

    const piece = this.state.currentPiece;
    if (!piece) {
      return { success: false, reason: 'No active piece' };
    }

    // Attempt rotation (includes wall kick logic)
    const success = piece.rotatePiece();
    if (success) {
      this.recordMovement();
      this.resetLockTimer(); // Reset lock timer on successful rotation
      
      // Play rotation sound
      if (this.audioEvents) {
        this.audioEvents.onPieceRotate();
      }
    }

    return { success, reason: success ? undefined : 'Rotation failed' };
  }

  /**
   * Handle hard drop input
   */
  private handleHardDrop(_event: InputEvent): MovementResult {
    if (!this.canProcessMovement()) {
      return { success: false, reason: 'Movement not allowed' };
    }

    const piece = this.state.currentPiece;
    if (!piece) {
      return { success: false, reason: 'No active piece' };
    }

    // Find drop position
    const dropY = this.state.grid.findDropPosition(piece, piece.gridX);
    const dropDistance = dropY - piece.gridY;
    
    if (dropDistance > 0) {
      // Move piece to drop position
      piece.gridY = dropY;
      piece['updateDicePositions'](); // Access private method
      
      // Award hard drop points
      if (this.onScoreUpdate) {
        this.onScoreUpdate(dropDistance * 2); // 2 points per cell dropped
      }
      
      // Immediately lock the piece
      this.lockCurrentPiece();
      
      return { success: true, triggeredLock: true };
    }

    return { success: false, reason: 'Already at bottom' };
  }

  /**
   * Handle pause input
   */
  private handlePause(_event: InputEvent): void {
    this.togglePause();
  }

  /**
   * Toggle game pause state
   */
  public togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
    
    if (this.state.isPaused) {
      this.pauseFallTimer();
      this.inputManager.setEnabled(false);
    } else {
      this.resumeFallTimer();
      this.inputManager.setEnabled(true);
    }
    
    if (this.onPause) {
      this.onPause(this.state.isPaused);
    }
  }

  /**
   * Check if movement can be processed (simplified since validation is now handled by InputValidator)
   */
  private canProcessMovement(): boolean {
    return this.state.canMove && !this.state.isPaused && !this.state.isGameOver;
  }

  /**
   * Record a movement for rate limiting
   */
  private recordMovement(): void {
    this.moveHistory.push(Date.now());
  }

  /**
   * Start the fall timer for automatic piece dropping
   */
  private startFallTimer(): void {
    if (this.fallTimer) {
      this.fallTimer.destroy();
    }

    // Get fall speed from game mode configuration
    const fallSpeed = this.getFallSpeed();
    
    this.fallTimer = this.scene.time.addEvent({
      delay: fallSpeed,
      callback: this.handleAutomaticFall,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Handle automatic piece falling
   */
  private handleAutomaticFall(): void {
    if (this.state.isPaused || this.state.isGameOver || !this.state.currentPiece) {
      return;
    }

    const piece = this.state.currentPiece;
    const canMoveDown = piece.canMoveToWithGrid(piece.gridX, piece.gridY + 1, this.state.grid);
    
    if (canMoveDown) {
      piece.moveDown();
      this.resetLockTimer();
    } else {
      // Start lock timer if not already started
      this.startLockTimer();
    }
  }

  /**
   * Start lock timer for piece locking delay
   */
  private startLockTimer(): void {
    if (this.lockTimer) {
      return; // Timer already running
    }

    this.lockTimer = this.scene.time.delayedCall(this.lockDelay, () => {
      this.lockCurrentPiece();
    });
  }

  /**
   * Reset lock timer (called when piece moves successfully)
   */
  private resetLockTimer(): void {
    if (this.lockTimer) {
      this.lockTimer.destroy();
      this.lockTimer = null;
    }
  }

  /**
   * Lock the current piece to the grid
   */
  private lockCurrentPiece(): void {
    const piece = this.state.currentPiece;
    if (!piece) {
      return;
    }

    // Get lock positions
    const positions = piece.lockToGrid();
    
    // Add piece to grid
    const success = this.state.grid.addPiece(piece);
    
    if (success) {
      // Play piece lock sound
      if (this.audioEvents) {
        this.audioEvents.onPieceLock();
      }
      
      // Notify that piece was locked
      if (this.onPieceLocked) {
        this.onPieceLocked(piece, positions);
      }
      
      // Clear current piece
      this.state.currentPiece = null;
      
      // Reset lock timer
      this.resetLockTimer();
      
      // Check for game over condition
      if (this.checkGameOver()) {
        this.handleGameOver();
      }
    } else {
      // Failed to add piece - check if this should trigger game over
      const modeConfig = GAME_MODES[this.state.gameMode];
      
      if (modeConfig.hasGameOver) {
        // Normal game over for modes that support it
        this.handleGameOver();
      } else {
        // Zen mode: clear some space and try again
        this.handleZenModeGridFull();
      }
    }
  }

  /**
   * Check if game over condition is met
   */
  private checkGameOver(): boolean {
    const modeConfig = GAME_MODES[this.state.gameMode];
    
    // Zen mode and other modes with hasGameOver=false never have game over
    if (!modeConfig.hasGameOver) {
      return false;
    }
    
    // For modes with game over enabled, check if grid is full at the top
    return this.state.grid.isFull();
  }

  /**
   * Handle Zen mode grid full condition by clearing some space
   */
  private handleZenModeGridFull(): void {
    console.log('Zen mode: Grid full, clearing space...');
    
    // Clear the top few rows to make space
    const rowsToClear = 3;
    for (let row = 0; row < rowsToClear; row++) {
      this.state.grid.clearRow(row);
    }
    
    // Apply gravity to settle remaining pieces
    this.state.grid.applyGravity();
    
    // Try to spawn the piece again
    if (this.state.currentPiece) {
      // Reset piece position to top center
      this.state.currentPiece.gridX = 4; // Center of 10-wide grid
      this.state.currentPiece.gridY = 0; // Top of grid
      
      // Try to add it again
      const success = this.state.grid.addPiece(this.state.currentPiece);
      if (!success) {
        // If still can't add, clear more space
        for (let row = 0; row < 5; row++) {
          this.state.grid.clearRow(row);
        }
        this.state.grid.applyGravity();
      }
    }
  }

  /**
   * Handle game over
   */
  private handleGameOver(): void {
    this.state.isGameOver = true;
    this.state.canMove = false;
    
    // Stop timers
    if (this.fallTimer) {
      this.fallTimer.destroy();
      this.fallTimer = null;
    }
    
    this.resetLockTimer();
    
    // Disable input
    this.inputManager.setEnabled(false);
    
    // Notify game over
    if (this.onGameOver) {
      this.onGameOver();
    }
  }

  /**
   * Pause fall timer
   */
  private pauseFallTimer(): void {
    if (this.fallTimer) {
      this.fallTimer.paused = true;
    }
    if (this.lockTimer) {
      this.lockTimer.paused = true;
    }
  }

  /**
   * Resume fall timer
   */
  private resumeFallTimer(): void {
    if (this.fallTimer) {
      this.fallTimer.paused = false;
    }
    if (this.lockTimer) {
      this.lockTimer.paused = false;
    }
  }

  /**
   * Get fall speed based on game mode and level
   */
  private getFallSpeed(): number {
    // Base fall speed from game mode configuration
    // This would be imported from game mode config
    const baseFallSpeed = 800; // Default medium speed
    
    // Could be modified by level or boosters
    return baseFallSpeed;
  }

  /**
   * Set current piece
   */
  public setCurrentPiece(piece: Piece | null): void {
    this.state.currentPiece = piece;
    this.resetLockTimer();
  }

  /**
   * Set next piece
   */
  public setNextPiece(piece: Piece | null): void {
    this.state.nextPiece = piece;
  }

  /**
   * Update game controller state
   */
  public updateState(newState: Partial<GameControllerState>): void {
    this.state = { ...this.state, ...newState };
  }

  /**
   * Get current state
   */
  public getState(): GameControllerState {
    return { ...this.state };
  }

  /**
   * Set callback for piece locked event
   */
  public onPieceLockedCallback(callback: (piece: Piece, positions: any[]) => void): void {
    this.onPieceLocked = callback;
  }

  /**
   * Set callback for game over event
   */
  public onGameOverCallback(callback: () => void): void {
    this.onGameOver = callback;
  }

  /**
   * Set callback for pause event
   */
  public onPauseCallback(callback: (paused: boolean) => void): void {
    this.onPause = callback;
  }

  /**
   * Set callback for score update event
   */
  public onScoreUpdateCallback(callback: (points: number) => void): void {
    this.onScoreUpdate = callback;
  }

  /**
   * Set audio events handler
   */
  public setAudioEvents(audioEvents: AudioEvents): void {
    this.audioEvents = audioEvents;
  }

  /**
   * Update controller (called from scene update loop)
   */
  public update(delta: number): void {
    this.inputManager.update(delta);
  }

  /**
   * Enable/disable movement
   */
  public setMovementEnabled(enabled: boolean): void {
    this.state.canMove = enabled;
    this.inputManager.setEnabled(enabled);
  }

  /**
   * Get input manager for advanced configuration
   */
  public getInputManager(): InputManager {
    return this.inputManager;
  }

  /**
   * Get input validator for advanced configuration
   */
  public getInputValidator(): InputValidator {
    return this.inputValidator;
  }

  /**
   * Get input statistics
   */
  public getInputStats(): ReturnType<InputValidator['getInputStats']> {
    return this.inputValidator.getInputStats();
  }

  /**
   * Cleanup controller
   */
  public destroy(): void {
    // Stop timers
    if (this.fallTimer) {
      this.fallTimer.destroy();
    }
    
    this.resetLockTimer();
    
    // Cleanup input systems
    this.inputManager.destroy();
    this.inputValidator.reset();
    
    // Clear callbacks
    this.onPieceLocked = null;
    this.onGameOver = null;
    this.onPause = null;
    this.onScoreUpdate = null;
  }
}
