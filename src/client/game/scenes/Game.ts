import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import GameBoard from '../logic/GameBoard';
import { settings } from '../services/Settings';
import { getMode } from '../config/GameMode';
import { drawDie } from '../visuals/DiceRenderer';
import { detectMatches } from '../logic/MatchDetector';
import { applyGravity } from '../logic/Gravity';
// import { applyIndividualGravity } from '../logic/Gravity'; // Disabled for now
import Logger from '../../utils/Logger';
import { GameUI, GameUICallbacks } from '../ui/GameUI';
import { GAME_CONSTANTS, SPAWN_POSITIONS } from '../../../shared/constants/GameConstants';
import { CoordinateConverter } from '../../../shared/utils/CoordinateConverter';
import { GridBoundaryValidator } from '../../../shared/utils/GridBoundaryValidator';

export class Game extends Scene {
  // Simple game phase state machine to manage scene flow
  private phase: 'Idle' | 'Dropping' | 'Cascading' | 'Animating' | 'Spawning' = 'Idle';
  private gameUI: GameUI;
  private gameBoard: GameBoard;
  private score: number = 0;
  private cascadeMultiplier: number = 1;
  private coordinateConverter: CoordinateConverter;
  private activePiece: any;
  private nextPiece: any;
  private dropTimer: Phaser.Time.TimerEvent | null = null;
  private gravityTimer: Phaser.Time.TimerEvent | null = null;
  private activeSprites: Phaser.GameObjects.Container[] = [];
  private nextSprites: Phaser.GameObjects.Container[] = [];
  private lockedSprites: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('Game');
  }

  private renderGameState(): void {
    if (!this.gameUI) return;

    const { boardMetrics, nextMetrics } = this.gameUI;
    
    // Clear existing sprites
    this.clearSprites();

    // Render active piece
    this.renderActivePiece(boardMetrics);
    
    // Render next piece
    this.renderNextPiece(nextMetrics);
    
    // Render locked pieces
    this.renderLockedPieces(boardMetrics);
  }

  private clearSprites(): void {
    // Clear active piece sprites
    this.activeSprites.forEach(sprite => {
      try {
        sprite.destroy();
      } catch (e) {
        /* ignore */
      }
    });
    this.activeSprites = [];

    // Clear next piece sprites
    this.nextSprites.forEach(sprite => {
      try {
        sprite.destroy();
      } catch (e) {
        /* ignore */
      }
    });
    this.nextSprites = [];
  }

  private renderActivePiece(boardMetrics: any): void {
    if (!this.activePiece || !this.activePiece.dice || this.activePiece.dice.length === 0) {
      return;
    }

    Logger.log(`Rendering active piece with ${this.activePiece.dice.length} dice`);

    this.activePiece.dice.forEach((die: any, index: number) => {
      const gridX = this.activePiece.x + die.relativePos.x;
      const gridY = this.activePiece.y + die.relativePos.y;
      
      // Convert grid coordinates to screen pixel coordinates using CoordinateConverter
      const screenPos = this.coordinateConverter.gridToScreen(gridX, gridY, boardMetrics);

      const sprite = drawDie(
        this,
        screenPos.x,
        screenPos.y,
        boardMetrics.cellW,
        boardMetrics.cellH,
        die
      ) as Phaser.GameObjects.Container | null;
      
      if (sprite) {
        this.activeSprites.push(sprite);
        Logger.log(`Created active sprite ${index} at bottom-left grid(${gridX}, ${gridY}) -> screen(${screenPos.x}, ${screenPos.y})`);
      }
    });
  }

  private renderNextPiece(nextMetrics: any): void {
    if (!this.nextPiece || !this.nextPiece.dice) {
      return;
    }

    Logger.log(`Rendering next piece with ${this.nextPiece.dice.length} dice`);

    // Find bounding box to center the piece
    const minX = Math.min(...this.nextPiece.dice.map((die: any) => die.relativePos.x));
    const maxX = Math.max(...this.nextPiece.dice.map((die: any) => die.relativePos.x));
    const minY = Math.min(...this.nextPiece.dice.map((die: any) => die.relativePos.y));
    const maxY = Math.max(...this.nextPiece.dice.map((die: any) => die.relativePos.y));

    const pieceWidth = maxX - minX + 1;
    const pieceHeight = maxY - minY + 1;

    // Center in 4x4 grid
    const offsetX = (4 - pieceWidth) / 2 - minX;
    const offsetY = (4 - pieceHeight) / 2 - minY;

    this.nextPiece.dice.forEach((die: any, index: number) => {
      const gridX = die.relativePos.x + offsetX;
      const gridY = die.relativePos.y + offsetY;
      const px = nextMetrics.nextX + gridX * nextMetrics.cellW;
      const py = nextMetrics.nextY + gridY * nextMetrics.cellH;

      const sprite = drawDie(
        this,
        px,
        py,
        nextMetrics.cellW,
        nextMetrics.cellH,
        die
      ) as Phaser.GameObjects.Container | null;
      
      if (sprite) {
        this.nextSprites.push(sprite);
        Logger.log(`Created next sprite ${index} at bottom-left grid(${gridX}, ${gridY})`);
      }
    });
  }

  private renderLockedPieces(boardMetrics: any): void {
    if (!this.gameBoard) return;

    const { height, width, cells } = this.gameBoard.state;

    // Clear old locked sprites
    this.lockedSprites.forEach(sprite => {
      try {
        sprite.destroy();
      } catch (e) {
        /* ignore */
      }
    });
    this.lockedSprites = [];

    // Render all locked dice using bottom-left coordinate system
    for (let gridY = 0; gridY < height; gridY++) {
      // Convert grid Y to array index for accessing the cells array
      const arrayY = this.coordinateConverter.gridToArrayY(gridY);
      const row = cells[arrayY];
      if (!row) continue;
      
      for (let gridX = 0; gridX < width; gridX++) {
        const die = row[gridX];
        if (!die) continue;

        // Convert grid coordinates to screen pixel coordinates
        const screenPos = this.coordinateConverter.gridToScreen(gridX, gridY, boardMetrics);

        const sprite = drawDie(
          this,
          screenPos.x,
          screenPos.y,
          boardMetrics.cellW,
          boardMetrics.cellH,
          die
        ) as Phaser.GameObjects.Container | null;
        
        if (sprite) {
          this.lockedSprites.push(sprite);
        }
      }
    }
  }

  private generateMultiDiePiece(): any {
    // Define piece shapes (relative positions from origin)
    const pieceShapes = [
      // Single die
      { name: 'single', positions: [{ x: 0, y: 0 }] },
      // Line pieces
      {
        name: 'line2',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      },
      {
        name: 'line3',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
      },
      {
        name: 'line4',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
        ],
      },
      // L-shapes
      {
        name: 'L3',
        positions: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
      },
      {
        name: 'L4',
        positions: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: 2 },
          { x: 1, y: 2 },
        ],
      },
      // Square
      {
        name: 'square',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
      },
      // T-shape
      {
        name: 'T',
        positions: [
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
      },
    ];

    const diceTypes: number[] = (this.registry.get('gameConfig') as any)?.diceTypes || [6];
    const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'teal', 'gray'];

    // Select random shape
    const shape = pieceShapes[Math.floor(Math.random() * pieceShapes.length)];
    if (!shape) {
      // Fallback to single die if no shape found
      const fallbackShape = { name: 'single', positions: [{ x: 0, y: 0 }] };
      const dice = fallbackShape.positions.map((pos, index) => {
        const sides = diceTypes[Math.floor(Math.random() * diceTypes.length)] || 6;
        const color =
          palette[sides % palette.length || 0] ||
          palette[Math.floor(Math.random() * palette.length)];
        return {
          id: `p-${Date.now()}-${index}`,
          sides,
          number: Math.ceil(Math.random() * sides),
          color,
          relativePos: pos,
        };
      });
      return {
        id: `piece-${Date.now()}`,
        shape: fallbackShape.name,
        dice,
        rotation: 0,
      };
    }

    // Create dice for each position
    const dice = shape.positions.map((pos, index) => {
      const sides = diceTypes[Math.floor(Math.random() * diceTypes.length)] || 6;
      const color =
        palette[sides % palette.length || 0] || palette[Math.floor(Math.random() * palette.length)];
      return {
        id: `p-${Date.now()}-${index}`,
        sides,
        number: Math.ceil(Math.random() * sides),
        color,
        relativePos: pos,
      };
    });

    return {
      id: `piece-${Date.now()}`,
      shape: shape.name,
      dice,
      rotation: 0, // 0, 90, 180, 270 degrees
    };
  }

  private handleBoardTouch(gridX: number, gridY: number): void {
    Logger.log(`Board touched at bottom-left grid position (${gridX}, ${gridY})`);
    // TODO: Implement touch-based piece movement
    // For now, just log the touch position
  }

  private spawnPiece(): void {
    Logger.log('spawnPiece() called');
    if (!this.gameBoard) {
      Logger.log('ERROR: No gameBoard in spawnPiece');
      return;
    }

    const w = this.gameBoard.state.width;
    Logger.log(`Grid width: ${w}`);

    // If there's a nextPiece preview, promote it to active; otherwise generate new
    const next = this.nextPiece;
    let pieceToUse = next || this.generateMultiDiePiece();

    if (next) {
      Logger.log(`Using next piece: ${next.shape} with ${next.dice.length} dice`);
    } else {
      Logger.log('Generated new piece');
    }

    // Position piece ABOVE the grid using bottom-left coordinate system
    const x = GAME_CONSTANTS.SPAWN_X_CENTER; // Use constant for spawn X position
    
    // Find the lowest die in the piece (smallest Y in relative coordinates)
    const minRelativeY = Math.min(...pieceToUse.dice.map((die: any) => die.relativePos.y));
    
    // Calculate spawn Y position using constants: spawn so the lowest die starts above visible grid
    // When it falls one step, lowest die will be at Y=20, then Y=19 (top of grid)
    const spawnY = SPAWN_POSITIONS.calculateSpawnY(minRelativeY);
    
    Logger.log(`Spawning piece with bottom-left coordinates: minRelativeY=${minRelativeY}, spawnY=${spawnY}, so lowest die starts at Y=${spawnY + minRelativeY} (should be 21)`);
    
    // Create the piece object to test collision
    const newActivePiece = {
      ...pieceToUse,
      x,
      y: spawnY,
    };

    // Check if the piece can enter the grid (game over condition)
    // Try to move the piece down one step to see if it can enter the grid from Y=21 to Y=20
    const enterGridY = spawnY - 1; // Moving down means decreasing Y in bottom-left system
    if (!this.canPlacePiece(newActivePiece, x, enterGridY)) {
      Logger.log(`GAME OVER: Cannot enter grid - collision detected when trying to move from Y=${spawnY} to Y=${enterGridY}`);
      // Game over - transition to GameOver scene
      this.scene.start('GameOver');
      return;
    }

    this.activePiece = newActivePiece;
    Logger.log(`Spawned active piece at bottom-left coordinates x=${x}, Y=${spawnY}: ${newActivePiece.shape}`);

    // Generate fresh nextPiece for preview
    this.nextPiece = this.generateMultiDiePiece();
    Logger.log(`Generated next piece: ${this.nextPiece.shape}`);

    // render update
    this.renderGameState();
    Logger.log('spawnPiece() completed');
  }

  /**
   * Returns a descriptive name for the collision scenario based on dice counts
   * @param dicesToLock Number of dice that will be locked
   * @param diceToContinue Number of dice that will continue falling
   * @returns Human-readable scenario name
   */
  private getCollisionScenarioName(dicesToLock: number, diceToContinue: number): string {
    if (dicesToLock === 0 && diceToContinue > 0) {
      return `No Collisions (${diceToContinue} dice continue)`;
    } else if (dicesToLock > 0 && diceToContinue === 0) {
      return `All Collisions (${dicesToLock} dice lock)`;
    } else if (dicesToLock > 0 && diceToContinue > 0) {
      return `Mixed Collisions (${dicesToLock} lock, ${diceToContinue} continue)`;
    } else {
      return `Empty Scenario (0 dice total)`;
    }
  }

  private async stepDrop(): Promise<void> {
    Logger.log('=== stepDrop() START ===');
    this.phase = 'Dropping';
    if (!this.gameBoard) {
      Logger.log('ERROR: No gameBoard found');
      return;
    }

    let active = this.activePiece;
    if (!active) {
      Logger.log('No active piece, spawning new one');
      this.spawnPiece();
      return;
    }

    // If no dice remain in the piece, it's already fully locked
    if (!active.dice || active.dice.length === 0) {
      Logger.log('No unlocked dice remaining - finalizing piece');
      this.finalizePieceLocking(active);
      return;
    }

    // Log initial active piece state for debugging
    Logger.log(`COLLISION DETECTION: Active piece "${active.shape || 'unknown'}" at bottom-left coordinates (${active.x}, ${active.y}) with ${active.dice.length} unlocked dice`);
    Logger.log(`PIECE STATE: ID=${active.id}, rotation=${active.rotation}°`);

    // Enhanced validation and error handling before processing
    const preProcessValidation = this.validateActivePieceState();
    Logger.log(`PRE-PROCESS VALIDATION: ${preProcessValidation ? 'PASSED' : 'FAILED'}`);
    
    if (!preProcessValidation) {
      Logger.log('PRE-PROCESS VALIDATION FAILED: Attempting error recovery');
      const recoverySuccess = this.handleActivePieceErrors('stepDrop pre-process validation');
      if (!recoverySuccess) {
        Logger.log('ERROR RECOVERY FAILED: Aborting stepDrop operation');
        return;
      }
      
      // Re-validate after recovery
      const postRecoveryValidation = this.validateActivePieceState();
      if (!postRecoveryValidation) {
        Logger.log('POST-RECOVERY VALIDATION FAILED: Critical error - finalizing piece');
        this.finalizePieceLocking(active);
        return;
      }
      Logger.log('POST-RECOVERY VALIDATION: Successful - continuing with stepDrop');
    }

    // Bottom-up per-die collision processing to ensure dice above detect newly locked dice below.
    // Build list of absolute positions for remaining dice and sort by Y ascending (bottom first).
    const diceInfos: Array<{ die: any; index: number; absX: number; absY: number }> = [];
    for (let i = 0; i < active.dice.length; i++) {
      const die = active.dice[i];
      const absX = active.x + die.relativePos.x;
      const absY = active.y + die.relativePos.y;
      diceInfos.push({ die, index: i, absX, absY });
    }

    // Sort bottom (low Y) first so that locking a lower die updates the grid for upper dice
    diceInfos.sort((a, b) => a.absY - b.absY || a.absX - b.absX);

    Logger.log(`INDIVIDUAL DIE ANALYSIS (BOTTOM-UP): Processing ${diceInfos.length} dice for collision/locking`);

    const successfullyLocked: number[] = [];
    const lockingErrors: Array<{ index: number; error: string }> = [];
    const diceToContinue: Array<{ die: any; index: number }> = [];

    for (const info of diceInfos) {
      const { die, index, absX, absY } = info;
      const attemptedX = absX;
      const attemptedY = absY + GAME_CONSTANTS.FALL_STEP; // -1 step

      Logger.log(`DIE ${index} POSITION ANALYSIS:`);
      Logger.log(`  - Die ID: ${die.id}, Color: ${die.color}, Sides: ${die.sides}, Number: ${die.number}`);
      Logger.log(`  - Relative position: (${die.relativePos.x}, ${die.relativePos.y})`);
      Logger.log(`  - Current absolute position: (${absX}, ${absY})`);
      Logger.log(`  - Attempted position after fall: (${attemptedX}, ${attemptedY})`);

      const hitBottom = attemptedY < GAME_CONSTANTS.GROUND_Y;
      const outOfBounds = absX < 0 || absX >= this.gameBoard.state.width;
      // Important: check against the authoritative grid so any previously locked dice in this same loop are taken into account
      const hitPiece = attemptedY >= GAME_CONSTANTS.GROUND_Y &&
                       attemptedY <= GAME_CONSTANTS.MAX_VALID_Y &&
                       !this.gameBoard.isEmpty(attemptedX, attemptedY);

      Logger.log(`DIE ${index} COLLISION CHECKS: hitBottom=${hitBottom}, outOfBounds=${outOfBounds}, hitPiece=${hitPiece}`);

      if (hitBottom || outOfBounds || hitPiece) {
        // Immediately lock this die into the grid so that upper dice will see it as an obstacle
        let finalX = Math.max(0, Math.min(absX, this.gameBoard.state.width - 1));
        let finalY = Math.max(GAME_CONSTANTS.MIN_VALID_Y, Math.min(absY, GAME_CONSTANTS.MAX_VALID_Y));
        let positionClamped = false;

        // Use GridBoundaryValidator to clamp if needed
        const isValidPosition = GridBoundaryValidator.validatePosition(finalX, finalY, this.gameBoard.state.width, this.gameBoard.state.height);
        if (!isValidPosition) {
          const clamped = GridBoundaryValidator.clampPosition(finalX, finalY, this.gameBoard.state.width, this.gameBoard.state.height);
          finalX = clamped.x;
          finalY = clamped.y;
          positionClamped = true;
          Logger.log(`POSITION CLAMPING: (${absX}, ${absY}) -> (${finalX}, ${finalY})`);
        }

        try {
          Logger.log(`LOCKING DIE ${index}: locking immediately at (${finalX}, ${finalY})`);
          // Use batched lock: write to grid but defer match detection until after the batch
          this.gameBoard.lockCell({ x: finalX, y: finalY }, die);
          Logger.log(`LOCK SUCCESS: Die ${index} provisionally locked at (${finalX}, ${finalY})${positionClamped ? ' (clamped)' : ''}`);
          successfullyLocked.push(index);
        } catch (err) {
          const errorMsg = `Failed to lock die ${index} at (${finalX}, ${finalY}): ${err}`;
          Logger.log(`LOCK ERROR: ${errorMsg}`);
          lockingErrors.push({ index, error: errorMsg });
        }
      } else {
        // No collision for this die at this time; it can continue falling
        Logger.log(`DIE ${index} COLLISION RESULT: CONTINUE FALLING -> will attempt to move to (${attemptedX}, ${attemptedY})`);
        diceToContinue.push({ die, index });
      }
    }

    // Summary
    Logger.log(`COLLISION DETECTION SUMMARY:`);
    Logger.log(`  - Total dice processed: ${diceInfos.length}`);
    Logger.log(`  - Dice locked this step: ${successfullyLocked.length}`);
    Logger.log(`  - Dice to continue falling: ${diceToContinue.length}`);
    Logger.log(`  - Collision scenario: ${this.getCollisionScenarioName(successfullyLocked.length, diceToContinue.length)}`);

    if (lockingErrors.length > 0) {
      Logger.log(`LOCKING ERRORS (${lockingErrors.length}):`);
      lockingErrors.forEach(le => Logger.log(`  - Index ${le.index}: ${le.error}`));
    }

    // Remove successfully locked dice from the active piece using safe removal
    if (successfullyLocked.length > 0) {
      Logger.log(`DICE REMOVAL: Removing ${successfullyLocked.length} successfully locked dice from active piece`);
      const removedCount = this.safeRemoveDiceByIndices(successfullyLocked);
      Logger.log(`DICE REMOVAL RESULT: Expected to remove ${successfullyLocked.length}, actually removed ${removedCount}`);
      if (removedCount !== successfullyLocked.length) {
        Logger.log(`WARNING: Dice removal count mismatch - expected ${successfullyLocked.length}, removed ${removedCount}`);
      }

      // Validate post-removal state
      const postRemovalValidation = this.validateActivePieceState();
      Logger.log(`POST-REMOVAL VALIDATION: ${postRemovalValidation ? 'PASSED' : 'FAILED'}`);
      if (!postRemovalValidation) {
        Logger.log('POST-REMOVAL VALIDATION FAILED: Attempting recovery');
        const recoverySuccess = this.handleActivePieceErrors('stepDrop post-removal validation');
        if (!recoverySuccess) {
          Logger.log('POST-REMOVAL RECOVERY FAILED: Aborting stepDrop');
          return;
        }
        const finalValidation = this.validateActivePieceState();
        if (!finalValidation) {
          Logger.log('FINAL VALIDATION FAILED: Forcing piece finalization');
          this.activePiece.dice = [];
        }
      }
    }

    // After batching locks, run match detection and handle cascades with animations
    if (successfullyLocked.length > 0) {
      this.phase = 'Cascading';
      try {
        const boardMetrics = (this.gameUI && (this.gameUI as any).boardMetrics) || null;

        // Cascade loop: detect -> animate -> clear -> gravity -> repeat until no matches
        let cascadeMatches: any[] = detectMatches(this.gameBoard.state);
        if (cascadeMatches && cascadeMatches.length > 0) {
          Logger.log(`INITIAL CASCADE: ${cascadeMatches.length} match groups detected`);
        }

        while (cascadeMatches && cascadeMatches.length > 0) {
          // Build footer messages
          const msgs: string[] = [];
          const allPositions: Array<{ x: number; y: number }> = [];
          // Scoring: accumulate score for this cascade iteration
          let cascadeIterationScore = 0;
          for (const m of cascadeMatches) {
            const size = m.size || (m.positions ? m.positions.length : 0);
            const num = m.matchedNumber ?? '?';
            msgs.push(`Matched: ${size} dice with value ${num}`);
            if (m.positions && Array.isArray(m.positions)) {
              allPositions.push(...m.positions.map((p: any) => ({ x: p.x, y: p.y })));
            }
          }

          const footerText = msgs.join(' | ');
          try { this.gameUI?.updateMatchFooter(footerText); } catch (e) { /* ignore UI errors */ }

          // Animate matched positions before clearing
          try {
            this.phase = 'Animating';
            await this.animateMatchPositions(allPositions, boardMetrics);
          } catch (e) {
            Logger.log(`ERROR: animateMatchPositions failed: ${e}`);
          } finally {
            this.phase = 'Cascading';
          }

          // Clear matched positions from authoritative grid
          try {
            const clearPositions = allPositions.map(p => ({ x: p.x, y: p.y }));
            // Before clearing, compute score for each match group using authoritative grid
            for (const m of cascadeMatches) {
              const positions = (m.positions || []) as Array<{ x: number; y: number }>;
              const size = m.size || positions.length;
              const matchedNumber = m.matchedNumber ?? 0;

              // Sum of sides (total possible die faces) for this match
              let facesTotal = 0;
              for (const p of positions) {
                const die = this.gameBoard.getCell(p as any);
                if (die) facesTotal += (die.sides || 0);
              }

              const base = size * (matchedNumber as number);
              const groupScore = (base + facesTotal) * this.cascadeMultiplier;
              cascadeIterationScore += groupScore;

              // Increase multiplier for next match (per-match increase)
              this.cascadeMultiplier++;
            }

            // Clear cells
            this.gameBoard.clearCells(clearPositions);
          } catch (e) {
            Logger.log(`ERROR: clearCells failed: ${e}`);
          }

          // Apply gravity once after clears and animate falling pieces
          try {
            // animateGravityMovements will apply gravity and animate moved dice, then re-render
            await this.animateGravityMovements(boardMetrics);
          } catch (e) {
            Logger.log(`ERROR: applyGravity/animate failed: ${e}`);
            // As fallback, apply gravity and re-render
            try { applyGravity(this.gameBoard.state); } catch (ee) { /* ignore */ }
            this.renderGameState();
          }

          // Update score for this cascade iteration and propagate to UI
          if (cascadeIterationScore > 0) {
            this.score += cascadeIterationScore;
            try { this.gameUI?.updateScore(this.score); } catch (e) { /* ignore UI */ }
          }

          // Detect again for potential cascades
          cascadeMatches = detectMatches(this.gameBoard.state);
          if (cascadeMatches && cascadeMatches.length > 0) {
            Logger.log(`CASCADE CONTINUED: ${cascadeMatches.length} new match groups detected`);
          }
        }
      } catch (e) {
        Logger.log(`ERROR: Cascade handling failed: ${e}`);
      }
    }

    // Handle piece movement based on collision scenarios
    Logger.log(`\nPIECE MOVEMENT LOGIC:`);
    const scenarioName = this.getCollisionScenarioName(successfullyLocked.length, diceToContinue.length);
    Logger.log(`MOVEMENT SCENARIO: ${scenarioName}`);
    
    if (diceToContinue.length > 0 && successfullyLocked.length === 0) {
      // Scenario 1: No collisions - move entire piece down
      const oldY = active.y;
      active.y += GAME_CONSTANTS.FALL_STEP; // FALL_STEP is -1, so this decreases Y (moves down)
      Logger.log(`NO COLLISIONS: Moving entire piece from Y=${oldY} to Y=${active.y} (${Math.abs(GAME_CONSTANTS.FALL_STEP)} units down)`);
      Logger.log(`PIECE MOVEMENT: All ${diceToContinue.length} dice continue falling together`);
    } else if (diceToContinue.length > 0 && successfullyLocked.length > 0) {
      // Scenario 3: Mixed collisions - some dice lock, others continue falling
      // The remaining dice should continue falling, so move the piece down
      const oldY = active.y;
      active.y += GAME_CONSTANTS.FALL_STEP; // FALL_STEP is -1, so this decreases Y (moves down)
      Logger.log(`MIXED COLLISION: ${successfullyLocked.length} dice locked, ${diceToContinue.length} dice continue falling`);
      Logger.log(`PIECE MOVEMENT: Moving piece from Y=${oldY} to Y=${active.y} for remaining dice`);
      Logger.log(`CONTINUING DICE: ${diceToContinue.map(d => `Die ${d.index} (ID: ${d.die.id})`).join(', ')}`);
    } else if (diceToContinue.length === 0 && successfullyLocked.length > 0) {
      // Scenario 2: All collisions - all dice locked, no movement needed
      Logger.log(`ALL COLLISIONS: ${successfullyLocked.length} dice locked, no remaining dice to move`);
      Logger.log(`PIECE MOVEMENT: No movement - piece will be finalized`);
    } else {
      // Edge case: no dice in either category (shouldn't happen)
      Logger.log(`WARNING: Unexpected collision scenario - no dice in either category`);
      Logger.log(`PIECE MOVEMENT: No action taken`);
    }

    // Log final active piece state
    const finalDiceCount = active.dice ? active.dice.length : 0;
    Logger.log(`FINAL ACTIVE PIECE STATE: ${finalDiceCount} dice at position (${active.x}, ${active.y})`);
    
    // Update visuals to show current state
    Logger.log(`RENDERING: Updating visual representation`);
    this.renderGameState();
    
    // Check if piece is completely locked and log the decision
    if (finalDiceCount === 0) {
      Logger.log(`PIECE FINALIZATION: All dice locked - finalizing piece "${active.shape || 'unknown'}"`);
      this.finalizePieceLocking(active);
    } else {
      Logger.log(`STEP COMPLETION: ${finalDiceCount} dice still falling - step complete`);
      
      // Log remaining dice details for next step
      if (active.dice && active.dice.length > 0) {
        Logger.log(`REMAINING DICE FOR NEXT STEP:`);
        active.dice.forEach((die: any, index: number) => {
          const absX = active.x + die.relativePos.x;
          const absY = active.y + die.relativePos.y;
          Logger.log(`  - Die ${index} (ID: ${die.id}): relative (${die.relativePos.x}, ${die.relativePos.y}) -> absolute (${absX}, ${absY})`);
        });
      }
    }
    
    Logger.log('=== stepDrop() END ===\n');
  }



  private finalizePieceLocking(_active: any): void {
    Logger.log('Finalizing piece locking - all dice settled');

    // Clear active piece and spawn new one
    this.activePiece = undefined;
    Logger.log('Cleared active piece, about to spawn new one');

    // Re-render grid to show final locked state and spawn a new piece
    this.renderGameState();
    this.phase = 'Spawning';
    this.spawnPiece();
  }

  // Animate matched positions (fade out) and return a Promise that resolves when animations complete
  private animateMatchPositions(positions: Array<{ x: number; y: number }>, boardMetrics: any): Promise<void> {
    return new Promise((resolve) => {
      if (!positions || positions.length === 0) return resolve();
      const tweens: Phaser.Tweens.Tween[] = [];
      let completed = 0;

      const onComplete = () => {
        completed++;
        if (completed >= positions.length) resolve();
      };

      for (const p of positions) {
        // Create a temporary sprite at the grid position
        try {
          const screenPos = this.coordinateConverter.gridToScreen(p.x, p.y, boardMetrics);
          const sprite = drawDie(
            this,
            screenPos.x,
            screenPos.y,
            boardMetrics.cellW,
            boardMetrics.cellH,
            // create a lightweight visual die for animation
            { id: `anim-${p.x}-${p.y}-${Date.now()}`, sides: 6, number: 1, color: 'white' } as any
          ) as Phaser.GameObjects.Container | null;

          if (!sprite) {
            onComplete();
            continue;
          }

          // Ensure origin placement matches existing renders
          sprite.setAlpha(1);
          this.add.existing(sprite);

          const tw = this.tweens.add({
            targets: sprite,
            alpha: 0,
            scale: 0.8,
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              try { sprite.destroy(); } catch (e) { /* ignore */ }
              onComplete();
            }
          });

          tweens.push(tw);
        } catch (e) {
          onComplete();
        }
      }

      // Safety timeout in case tweens never call complete
      this.time.delayedCall(400, () => {
        if (completed < positions.length) resolve();
      });
    });
  }

  // Animate gravity movements: apply gravity to grid state, animate dice that moved from their
  // previous positions to new positions, then re-render the locked pieces. Returns after
  // animations complete and grid is up-to-date.
  private animateGravityMovements(boardMetrics: any): Promise<void> {
    return new Promise((resolve) => {
      if (!this.gameBoard) return resolve();

      const beforeMap: Record<string, { gridX: number; gridY: number; screenX: number; screenY: number; die: any }> = {};
      const { width, height, cells } = this.gameBoard.state;

      // Capture before positions
      for (let gridY = 0; gridY < height; gridY++) {
        const arrayY = this.coordinateConverter.gridToArrayY(gridY);
        const row = cells[arrayY];
        if (!row) continue;
        for (let gridX = 0; gridX < width; gridX++) {
          const die = row[gridX];
          if (!die) continue;
          const screenPos = this.coordinateConverter.gridToScreen(gridX, gridY, boardMetrics);
          if (die.id) {
            beforeMap[die.id] = { gridX, gridY, screenX: screenPos.x, screenY: screenPos.y, die };
          }
        }
      }

      // Apply gravity to authoritative grid (mutates state)
      try {
        applyGravity(this.gameBoard.state);
      } catch (e) {
        Logger.log(`animateGravityMovements: applyGravity failed: ${e}`);
        // Still attempt to render
        this.renderGameState();
        return resolve();
      }

      // Capture after positions and determine moved dice
      const moved: Array<{ id: string; die: any; from: { x: number; y: number }; to: { x: number; y: number } }> = [];

      for (let gridY = 0; gridY < height; gridY++) {
        const arrayY = this.coordinateConverter.gridToArrayY(gridY);
        const row = this.gameBoard.state.cells[arrayY];
        if (!row) continue;
        for (let gridX = 0; gridX < width; gridX++) {
          const die = row[gridX];
          if (!die || !die.id) continue;
          const before = beforeMap[die.id];
          const screenPos = this.coordinateConverter.gridToScreen(gridX, gridY, boardMetrics);
          if (before) {
            if (before.screenX !== screenPos.x || before.screenY !== screenPos.y) {
              moved.push({ id: die.id, die, from: { x: before.screenX, y: before.screenY }, to: { x: screenPos.x, y: screenPos.y } });
            }
          }
        }
      }

      if (moved.length === 0) {
        // Nothing moved; just render and resolve
        this.renderGameState();
        return resolve();
      }

      // Create temporary sprites for moved dice and tween them
      const tweens: Phaser.Tweens.Tween[] = [];
      const tempSprites: Phaser.GameObjects.Container[] = [];
      let completed = 0;

      const onComplete = () => {
        completed++;
        if (completed >= moved.length) {
          // destroy temp sprites and re-render authoritative locked pieces
          tempSprites.forEach(s => { try { s.destroy(); } catch (e) {} });
          this.renderGameState();
          resolve();
        }
      };

      for (const mv of moved) {
        try {
          const spr = drawDie(this, mv.from.x, mv.from.y, boardMetrics.cellW, boardMetrics.cellH, mv.die) as Phaser.GameObjects.Container | null;
          if (!spr) { onComplete(); continue; }
          tempSprites.push(spr);
          this.add.existing(spr);

          const tw = this.tweens.add({
            targets: spr,
            x: mv.to.x,
            y: mv.to.y,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              try { spr.destroy(); } catch (e) {}
              onComplete();
            }
          });

          tweens.push(tw);
        } catch (e) {
          onComplete();
        }
      }

      // Safety timeout
      this.time.delayedCall(500, () => {
        if (completed < moved.length) {
          tempSprites.forEach(s => { try { s.destroy(); } catch (e) {} });
          this.renderGameState();
          resolve();
        }
      });
    });
  }

  private stepGravity(): void {
    // Disabled for now - individual gravity conflicts with piece-based falling
    // This will be re-enabled when we implement match clearing
    return;
    
    // const lg: any = (this as any).gameBoard;
    // if (!lg) return;

    // // Apply individual gravity to make dice fall independently
    // const gravityResult = applyIndividualGravity(lg.state);
    
    // if (gravityResult.changed) {
    //   Logger.log('Individual gravity applied - dice fell');
    //   // Re-render the grid to show the updated positions
    //   this.renderGridPlaceholder();
    // }
  }

  create(): void {
    // Set background
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.registry.set('gameSceneReady', true);

    // Read selected mode from registry and apply config
    const selectedMode =
      (this.registry.get('selectedMode') as string) || settings.get('selectedMode') || 'medium';
    const mode = getMode(selectedMode);
    const cfg = mode.getConfig();
    this.registry.set('gameMode', mode.id);
    this.registry.set('gameConfig', cfg);

    // Initialize game board and coordinate converter
    this.gameBoard = new GameBoard(10, 20);
    this.coordinateConverter = new CoordinateConverter(20);

    // Create UI with game callbacks
    const uiCallbacks: GameUICallbacks = {
      onMoveLeft: () => this.movePiece(-1, 0),
      onMoveRight: () => this.movePiece(1, 0),
      onMoveDown: () => this.movePiece(0, GAME_CONSTANTS.FALL_STEP), // Use FALL_STEP (-1) for downward movement
      onRotateClockwise: () => this.rotatePiece(1),
      onRotateCounterClockwise: () => this.rotatePiece(-1),
      onHardDrop: () => this.hardDrop(),
      onPause: () => this.scene.start('StartMenu'),
      onBoardTouch: (gridX, gridY) => this.handleBoardTouch(gridX, gridY),
    };

    this.gameUI = new GameUI(this, uiCallbacks);

    // Initialize the piece generation system
    Logger.log('Initializing piece generation system');
    
    // First, generate the initial next piece
    this.nextPiece = this.generateMultiDiePiece();
    Logger.log(`Generated initial next piece: ${this.nextPiece.shape}`);
    
  // Then spawn the first active piece (which will use the next piece)
  this.phase = 'Spawning';
  this.spawnPiece();
    
    const cfgAny: any = cfg;
    const ms = Number(cfgAny?.fallSpeed) || 800;
    Logger.log(`Setting up drop timer with ${ms}ms delay`);

    this.dropTimer = this.time.addEvent({
      delay: ms,
      callback: () => this.stepDrop(),
      loop: true,
    });

    // Set up gravity timer (if enabled)
    const allowGravity = (cfgAny?.allowGravity !== false);
    if (allowGravity) {
      const gravityMs = Math.max(100, Math.floor(ms / 4));
      this.gravityTimer = this.time.addEvent({
        delay: gravityMs,
        callback: () => this.stepGravity(),
        loop: true,
      });
      Logger.log('Gravity timer created successfully');
    } else {
      Logger.log('Gravity disabled for this mode');
    }

    // Initial render
    this.renderGameState();
    Logger.log('Game scene initialized with new UI system');
    this.phase = 'Dropping';
  }



  private movePiece(dx: number, dy: number): void {
    if (!this.activePiece || !this.gameBoard) return;

    // If no dice remain in the piece, it's already fully locked
    if (!this.activePiece.dice || this.activePiece.dice.length === 0) {
      Logger.log('Cannot move piece - no dice remaining (all locked)');
      return;
    }

    const newX = this.activePiece.x + dx;
    const newY = this.activePiece.y + dy;

    Logger.log(`Attempting to move piece from bottom-left (${this.activePiece.x}, ${this.activePiece.y}) to (${newX}, ${newY})`);
    
    // For downward movement (dy < 0), we're decreasing Y which moves the piece down in bottom-left coordinates
    // For left/right movement (dx != 0), X coordinates remain unchanged in behavior
    // For upward movement (dy > 0), we're increasing Y which moves the piece up in bottom-left coordinates

    // Check if the new position is valid for remaining dice in the piece
    if (this.canPlacePiece(this.activePiece, newX, newY)) {
      this.activePiece.x = newX;
      this.activePiece.y = newY;
      this.renderGameState();
      Logger.log(`Successfully moved piece to bottom-left (${newX}, ${newY})`);
    } else {
      Logger.log(`Cannot move piece to bottom-left (${newX}, ${newY}) - collision detected`);
    }
  }

  private hardDrop(): void {
    if (!this.activePiece || !this.gameBoard) return;

    // If no dice remain in the piece, it's already fully locked
    if (!this.activePiece.dice || this.activePiece.dice.length === 0) {
      Logger.log('Cannot hard drop - no dice remaining (all locked)');
      return;
    }

    // Find the lowest valid Y position for the remaining dice in the piece
    // In bottom-left system, we need to find the smallest Y where the piece can still be placed
    // Start from current position and move down (decrease Y) until we find a collision
    let dropY = this.activePiece.y;
    let testY = dropY + GAME_CONSTANTS.FALL_STEP; // Start testing one step down
    
    // Keep moving down (decreasing Y) while the piece can still be placed
    while (testY >= GAME_CONSTANTS.MIN_VALID_Y && this.canPlacePiece(this.activePiece, this.activePiece.x, testY)) {
      dropY = testY;
      testY += GAME_CONSTANTS.FALL_STEP; // FALL_STEP is -1, so this decreases Y (moves down)
    }

    this.activePiece.y = dropY;
    Logger.log(`Hard dropped piece to lowest valid Y=${dropY}`);

    // Force immediate collision detection by calling stepDrop
    this.stepDrop();
  }

  private rotateMatrix(
    positions: Array<{ x: number; y: number }>,
    clockwise: boolean
  ): Array<{ x: number; y: number }> {
    if (positions.length === 0) return positions;

    Logger.log(`Rotating ${positions.length} positions ${clockwise ? 'clockwise' : 'counter-clockwise'}`);
    Logger.log(`Input positions: ${JSON.stringify(positions)}`);

    // Simple rotation around origin (0,0)
    const rotated = positions.map((p) => {
      let newX, newY;
      if (clockwise) {
        // 90° clockwise: (x,y) -> (-y, x)
        newX = -p.y;
        newY = p.x;
      } else {
        // 90° counter-clockwise: (x,y) -> (y, -x)
        newX = p.y;
        newY = -p.x;
      }
      return { x: newX, y: newY };
    });

    Logger.log(`After rotation: ${JSON.stringify(rotated)}`);

    // Find the minimum X and Y to normalize back to positive coordinates
    const xValues = rotated.map((p) => p.x);
    const yValues = rotated.map((p) => p.y);
    const minX = Math.min(...xValues);
    const minY = Math.min(...yValues);

    // Normalize to ensure all coordinates are >= 0
    const normalized = rotated.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
    }));

    Logger.log(`After normalization: ${JSON.stringify(normalized)}`);
    return normalized;
  }

  private canPlacePiece(
    piece: any,
    newX: number,
    newY: number,
    newPositions?: Array<{ x: number; y: number }>
  ): boolean {
    if (!this.gameBoard) {
      Logger.log('canPlacePiece: No gameBoard available');
      return false;
    }

    if (!piece || !piece.dice || piece.dice.length === 0) {
      Logger.log('canPlacePiece: Invalid piece or no dice remaining');
      return false;
    }

    const positions =
      newPositions ||
      piece.dice.map((die: any) => ({
        x: die.relativePos.x,
        y: die.relativePos.y,
      }));

    // Check each remaining die position using bottom-left coordinate system
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const absoluteX = newX + pos.x;
      const absoluteY = newY + pos.y;

      // Check X bounds (must be within grid width)
      if (absoluteX < 0 || absoluteX >= this.gameBoard.state.width) {
        Logger.log(`canPlacePiece: Die ${i} out of X bounds at bottom-left (${absoluteX}, ${absoluteY})`);
        return false;
      }

      // Check Y bounds: pieces can be above the grid (Y > MAX_VALID_Y) but not below (Y < MIN_VALID_Y)
      if (absoluteY < GAME_CONSTANTS.MIN_VALID_Y) {
        Logger.log(`canPlacePiece: Die ${i} below grid bottom at bottom-left (${absoluteX}, ${absoluteY})`);
        return false;
      }

      // Check collision with existing pieces (only if within visible grid bounds)
      if (absoluteY >= GAME_CONSTANTS.MIN_VALID_Y && 
          absoluteY <= GAME_CONSTANTS.MAX_VALID_Y && 
          !this.gameBoard.isEmpty(absoluteX, absoluteY)) {
        Logger.log(`canPlacePiece: Die ${i} collision with existing piece at bottom-left (${absoluteX}, ${absoluteY})`);
        return false;
      }
    }
    
    Logger.log(`canPlacePiece: All ${positions.length} dice positions valid for piece at bottom-left (${newX}, ${newY})`);
    return true;
  }

  private rotatePiece(direction: number): void {
    if (!this.activePiece || !this.activePiece.dice || this.activePiece.dice.length === 0) {
      Logger.log('No active dice to rotate - piece fully locked');
      return;
    }

    Logger.log(`Rotating piece ${direction > 0 ? 'clockwise' : 'counter-clockwise'} with ${this.activePiece.dice.length} remaining dice`);

    // Get current relative positions of remaining dice
    const currentPositions = this.activePiece.dice.map((die: any) => die.relativePos);
    Logger.log(`Current positions before rotation: ${JSON.stringify(currentPositions)}`);

    // Calculate rotated positions
    const rotatedPositions = this.rotateMatrix(currentPositions, direction > 0);
    Logger.log(`Rotated positions: ${JSON.stringify(rotatedPositions)}`);

    // Try rotation at current position first
    if (this.canPlacePiece(this.activePiece, this.activePiece.x, this.activePiece.y, rotatedPositions)) {
      this.applyRotation(rotatedPositions, direction);
      return;
    }

    // If rotation fails at current position, try wall kicks
    Logger.log('Rotation blocked at current position, attempting wall kicks');
    const wallKickOffsets = this.getWallKickOffsets(direction > 0);
    
    for (const offset of wallKickOffsets) {
      const testX = this.activePiece.x + offset.x;
      const testY = this.activePiece.y + offset.y;
      
      Logger.log(`Trying wall kick at offset (${offset.x}, ${offset.y}) -> position (${testX}, ${testY})`);
      
      if (this.canPlacePiece(this.activePiece, testX, testY, rotatedPositions)) {
        // Apply wall kick and rotation
        this.activePiece.x = testX;
        this.activePiece.y = testY;
        this.applyRotation(rotatedPositions, direction);
        Logger.log(`Wall kick successful at offset (${offset.x}, ${offset.y})`);
        return;
      }
    }

    Logger.log('Rotation blocked - no valid wall kick positions found');
  }

  private getWallKickOffsets(_clockwise: boolean): Array<{ x: number; y: number }> {
    // Wall kick offsets for bottom-left coordinate system
    // Try moving left, right, up, and combinations
    // Note: Could be customized based on rotation direction in the future
    return [
      { x: -1, y: 0 },  // Try one left
      { x: 1, y: 0 },   // Try one right
      { x: -2, y: 0 },  // Try two left
      { x: 2, y: 0 },   // Try two right
      { x: 0, y: 1 },   // Try one up
      { x: -1, y: 1 },  // Try left and up
      { x: 1, y: 1 },   // Try right and up
      { x: 0, y: -1 },  // Try one down (if above ground)
    ];
  }

  private applyRotation(rotatedPositions: Array<{ x: number; y: number }>, direction: number): void {
    // Apply rotation to remaining dice
    this.activePiece.dice.forEach((die: any, index: number) => {
      Logger.log(`Die ${index}: ${JSON.stringify(die.relativePos)} -> ${JSON.stringify(rotatedPositions[index])}`);
      die.relativePos = rotatedPositions[index];
    });

    // Update rotation angle for reference
    this.activePiece.rotation = (this.activePiece.rotation + (direction > 0 ? 90 : -90) + 360) % 360;

    // Validate the rotation result
    this.validateRotationResult();

    this.renderGameState();
    Logger.log(`Piece rotated successfully to ${this.activePiece.rotation}°`);
    
    // Verify the positions after rotation
    Logger.log(`Final positions after rotation: ${JSON.stringify(this.activePiece.dice.map((die: any) => die.relativePos))}`);
  }

  private validateRotationResult(): void {
    if (!this.activePiece || !this.activePiece.dice) return;

    // Ensure all dice positions are valid after rotation
    for (let i = 0; i < this.activePiece.dice.length; i++) {
      const die = this.activePiece.dice[i];
      const absoluteX = this.activePiece.x + die.relativePos.x;
      const absoluteY = this.activePiece.y + die.relativePos.y;

      // Validate coordinates are within expected bounds
      if (absoluteX < 0 || absoluteX >= this.gameBoard.state.width) {
        Logger.log(`WARNING: Die ${i} has invalid X coordinate after rotation: ${absoluteX}`);
      }

      if (absoluteY < GAME_CONSTANTS.MIN_VALID_Y) {
        Logger.log(`WARNING: Die ${i} has invalid Y coordinate after rotation: ${absoluteY} (below grid)`);
      }

      // Check relative positions are non-negative (normalized correctly)
      if (die.relativePos.x < 0 || die.relativePos.y < 0) {
        Logger.log(`WARNING: Die ${i} has negative relative position after rotation: (${die.relativePos.x}, ${die.relativePos.y})`);
      }
    }

    Logger.log(`Rotation validation complete for piece at (${this.activePiece.x}, ${this.activePiece.y})`);
  }

  /**
   * Safely removes dice from the active piece by indices in reverse order to maintain array integrity
   * Enhanced with detailed logging for debugging collision detection issues
   * @param indices Array of dice indices to remove
   * @returns Number of dice actually removed
   */
  private safeRemoveDiceByIndices(indices: number[]): number {
    Logger.log('DICE REMOVAL: Starting enhanced safe dice removal process');
    
    // Enhanced validation for active piece state
    if (!this.activePiece) {
      Logger.log('DICE REMOVAL ERROR: No active piece exists - cannot remove dice');
      return 0;
    }
    
    if (!this.activePiece.dice) {
      Logger.log('DICE REMOVAL ERROR: Active piece has no dice property - initializing empty array');
      this.activePiece.dice = [];
      return 0;
    }
    
    if (!Array.isArray(this.activePiece.dice)) {
      Logger.log('DICE REMOVAL ERROR: Active piece dice is not an array - attempting recovery');
      Logger.log(`DICE REMOVAL ERROR: dice type: ${typeof this.activePiece.dice}, value: ${JSON.stringify(this.activePiece.dice)}`);
      
      // Attempt to recover by converting to array or resetting
      try {
        if (typeof this.activePiece.dice === 'object' && this.activePiece.dice !== null) {
          // Try to convert object to array if it has array-like properties
          const keys = Object.keys(this.activePiece.dice);
          const isArrayLike = keys.every(key => /^\d+$/.test(key));
          if (isArrayLike) {
            Logger.log('DICE REMOVAL RECOVERY: Converting array-like object to proper array');
            this.activePiece.dice = Object.values(this.activePiece.dice);
          } else {
            throw new Error('Not array-like object');
          }
        } else {
          throw new Error('Invalid dice data type');
        }
      } catch (recoveryError) {
        Logger.log(`DICE REMOVAL RECOVERY FAILED: ${recoveryError} - resetting to empty array`);
        this.activePiece.dice = [];
        return 0;
      }
    }

    // Enhanced input validation
    if (!indices || !Array.isArray(indices)) {
      Logger.log('DICE REMOVAL ERROR: Invalid indices parameter - must be an array');
      Logger.log(`DICE REMOVAL ERROR: indices type: ${typeof indices}, value: ${JSON.stringify(indices)}`);
      return 0;
    }

    if (indices.length === 0) {
      Logger.log('DICE REMOVAL: No dice indices provided for removal - nothing to do');
      return 0;
    }

    // Check for empty dice array edge case
    if (this.activePiece.dice.length === 0) {
      Logger.log('DICE REMOVAL WARNING: Active piece has empty dice array - cannot remove any dice');
      return 0;
    }

    const originalLength = this.activePiece.dice.length;
    Logger.log(`DICE REMOVAL: Attempting to remove ${indices.length} dice from active piece`);
    Logger.log(`DICE REMOVAL: Current active piece state - length: ${originalLength}, shape: ${this.activePiece.shape || 'unknown'}`);
    Logger.log(`DICE REMOVAL: Indices to remove: [${indices.join(', ')}]`);

    // Log current dice state before removal
    Logger.log(`DICE REMOVAL: Current dice before removal:`);
    this.activePiece.dice.forEach((die: any, index: number) => {
      Logger.log(`  - Index ${index}: ID=${die.id}, pos=(${die.relativePos?.x}, ${die.relativePos?.y}), color=${die.color}`);
    });

    // Enhanced validation for all indices with detailed error reporting
    const maxValidIndex = originalLength - 1;
    const validIndices: number[] = [];
    const invalidIndices: Array<{index: any, reason: string}> = [];
    
    indices.forEach(index => {
      // Check for various types of invalid indices
      if (index === null || index === undefined) {
        invalidIndices.push({index, reason: 'null or undefined'});
      } else if (!Number.isInteger(index)) {
        invalidIndices.push({index, reason: `not an integer (type: ${typeof index})`});
      } else if (index < 0) {
        invalidIndices.push({index, reason: 'negative index'});
      } else if (index > maxValidIndex) {
        invalidIndices.push({index, reason: `index exceeds array bounds (max: ${maxValidIndex})`});
      } else if (isNaN(index)) {
        invalidIndices.push({index, reason: 'NaN value'});
      } else if (!isFinite(index)) {
        invalidIndices.push({index, reason: 'infinite value'});
      } else {
        validIndices.push(index);
      }
    });
    
    // Log detailed validation results
    if (invalidIndices.length > 0) {
      Logger.log(`DICE REMOVAL VALIDATION: Found ${invalidIndices.length} invalid indices:`);
      invalidIndices.forEach(({index, reason}) => {
        Logger.log(`  - Index ${index}: ${reason}`);
      });
    }

    if (validIndices.length === 0) {
      Logger.log('DICE REMOVAL WARNING: No valid indices found for dice removal - all indices were invalid');
      return 0;
    }

    if (validIndices.length !== indices.length) {
      const invalidCount = indices.length - validIndices.length;
      Logger.log(`DICE REMOVAL WARNING: ${invalidCount} invalid indices detected and skipped`);
      Logger.log(`DICE REMOVAL WARNING: Valid indices: [${validIndices.join(', ')}]`);
    }

    // Enhanced array modification safety validation
    const safetyValidation = this.validateArrayModificationSafety(validIndices, originalLength);
    
    // Log safety validation results
    if (safetyValidation.warnings.length > 0) {
      Logger.log(`DICE REMOVAL SAFETY WARNINGS:`);
      safetyValidation.warnings.forEach(warning => {
        Logger.log(`  - ${warning}`);
      });
    }
    
    if (safetyValidation.errors.length > 0) {
      Logger.log(`DICE REMOVAL SAFETY ERRORS:`);
      safetyValidation.errors.forEach(error => {
        Logger.log(`  - ${error}`);
      });
    }
    
    if (!safetyValidation.isSafe) {
      Logger.log('DICE REMOVAL ABORTED: Array modification safety validation failed');
      return 0;
    }
    
    const uniqueIndices = safetyValidation.safeIndices;
    Logger.log(`DICE REMOVAL SAFETY: Using ${uniqueIndices.length} validated indices for safe removal: [${uniqueIndices.join(', ')}]`);

    // Remove dice in reverse order with detailed logging
    let removedCount = 0;
    const removedDice: Array<{index: number, die: any}> = [];
    
    Logger.log(`DICE REMOVAL: Processing ${uniqueIndices.length} unique indices in reverse order`);
    
    uniqueIndices.forEach((index, removalStep) => {
      const currentLength = this.activePiece.dice.length;
      Logger.log(`DICE REMOVAL STEP ${removalStep + 1}: Attempting to remove index ${index} (current array length: ${currentLength})`);
      
      if (index < currentLength) { // Double-check bounds before each removal
        const dieToRemove = this.activePiece.dice[index];
        Logger.log(`DICE REMOVAL STEP ${removalStep + 1}: Removing die at index ${index} - ID: ${dieToRemove.id}, color: ${dieToRemove.color}`);
        
        this.activePiece.dice.splice(index, 1);
        removedDice.push({ index, die: dieToRemove });
        removedCount++;
        
        Logger.log(`DICE REMOVAL STEP ${removalStep + 1}: Successfully removed die, new array length: ${this.activePiece.dice.length}`);
      } else {
        Logger.log(`DICE REMOVAL ERROR: Index ${index} out of bounds during removal (current array length: ${currentLength})`);
        Logger.log(`DICE REMOVAL ERROR: This indicates an array manipulation error or race condition`);
      }
    });

    // Log removed dice details
    if (removedDice.length > 0) {
      Logger.log(`DICE REMOVAL SUMMARY: Successfully removed ${removedDice.length} dice:`);
      removedDice.forEach(({ index, die }) => {
        Logger.log(`  - Original index ${index}: ID=${die.id}, color=${die.color}, pos=(${die.relativePos?.x}, ${die.relativePos?.y})`);
      });
    }

    // Validate final state with detailed logging
    const finalLength = this.activePiece.dice.length;
    const expectedLength = originalLength - removedCount;
    
    Logger.log(`DICE REMOVAL VALIDATION:`);
    Logger.log(`  - Original length: ${originalLength}`);
    Logger.log(`  - Removed count: ${removedCount}`);
    Logger.log(`  - Expected final length: ${expectedLength}`);
    Logger.log(`  - Actual final length: ${finalLength}`);
    
    if (finalLength !== expectedLength) {
      Logger.log(`DICE REMOVAL ERROR: Unexpected dice count after removal - length mismatch detected`);
      Logger.log(`DICE REMOVAL ERROR: This indicates a critical array manipulation error`);
    }

    if (finalLength < 0) {
      Logger.log(`DICE REMOVAL ERROR: Invalid negative dice count after removal: ${finalLength}`);
      Logger.log(`DICE REMOVAL RECOVERY: Resetting dice array to empty to prevent further errors`);
      this.activePiece.dice = [];
      return originalLength; // All dice were effectively removed
    }

    // Log final dice state after removal
    if (finalLength > 0) {
      Logger.log(`DICE REMOVAL: Remaining dice after removal:`);
      this.activePiece.dice.forEach((die: any, index: number) => {
        Logger.log(`  - Index ${index}: ID=${die.id}, pos=(${die.relativePos?.x}, ${die.relativePos?.y}), color=${die.color}`);
      });
    } else {
      Logger.log(`DICE REMOVAL: No dice remaining in active piece - piece will be finalized`);
    }

    Logger.log(`DICE REMOVAL COMPLETE: Successfully removed ${removedCount} dice. Active piece now has ${finalLength} dice remaining`);
    return removedCount;
  }

  /**
   * Validates the consistency of the active piece state with detailed logging
   * @returns true if the active piece state is valid, false otherwise
   */
  private validateActivePieceState(): boolean {
    Logger.log('VALIDATION: Starting enhanced active piece state validation');
    
    if (!this.activePiece) {
      Logger.log('VALIDATION RESULT: No active piece - valid state');
      return true; // No piece is a valid state
    }

    Logger.log(`VALIDATION: Checking piece "${this.activePiece.shape || 'unknown'}" (ID: ${this.activePiece.id || 'unknown'})`);
    
    // Enhanced position validation
    const pieceX = this.activePiece.x;
    const pieceY = this.activePiece.y;
    const rotation = this.activePiece.rotation || 0;
    
    Logger.log(`VALIDATION: Piece position: (${pieceX}, ${pieceY}), rotation: ${rotation}°`);
    
    // Validate piece position coordinates
    if (typeof pieceX !== 'number' || typeof pieceY !== 'number') {
      Logger.log(`VALIDATION ERROR: Invalid piece position coordinates - x: ${typeof pieceX}, y: ${typeof pieceY}`);
      return false;
    }
    
    if (!isFinite(pieceX) || !isFinite(pieceY)) {
      Logger.log(`VALIDATION ERROR: Non-finite piece position coordinates - x: ${pieceX}, y: ${pieceY}`);
      return false;
    }
    
    if (isNaN(pieceX) || isNaN(pieceY)) {
      Logger.log(`VALIDATION ERROR: NaN piece position coordinates - x: ${pieceX}, y: ${pieceY}`);
      return false;
    }
    
    // Validate rotation value
    if (typeof rotation !== 'number' || !isFinite(rotation) || isNaN(rotation)) {
      Logger.log(`VALIDATION ERROR: Invalid rotation value - type: ${typeof rotation}, value: ${rotation}`);
      return false;
    }

    if (!this.activePiece.dice || !Array.isArray(this.activePiece.dice)) {
      Logger.log('VALIDATION ERROR: Active piece has invalid dice array');
      Logger.log(`VALIDATION ERROR: dice property type: ${typeof this.activePiece.dice}, isArray: ${Array.isArray(this.activePiece.dice)}`);
      return false;
    }

    const diceCount = this.activePiece.dice.length;
    Logger.log(`VALIDATION: Checking ${diceCount} dice in active piece`);

    if (diceCount < 0) {
      Logger.log(`VALIDATION ERROR: Active piece has negative dice count: ${diceCount}`);
      return false;
    }

    // Check for duplicate dice IDs
    const diceIds = this.activePiece.dice.map((die: any) => die.id).filter((id: any) => id !== undefined);
    const uniqueIds = new Set(diceIds);
    Logger.log(`VALIDATION: Dice ID check - ${diceIds.length} IDs found, ${uniqueIds.size} unique`);
    
    if (diceIds.length !== uniqueIds.size) {
      Logger.log('VALIDATION ERROR: Duplicate dice IDs detected in active piece');
      const duplicates = diceIds.filter((id: any, index: number) => diceIds.indexOf(id) !== index);
      Logger.log(`VALIDATION ERROR: Duplicate IDs: ${JSON.stringify([...new Set(duplicates)])}`);
      return false;
    }

    // Enhanced dice structure validation with boundary checks
    let validationErrors = 0;
    const gameBoard = this.gameBoard;
    
    for (let i = 0; i < this.activePiece.dice.length; i++) {
      const die = this.activePiece.dice[i];
      Logger.log(`VALIDATION: Checking die ${i} - ID: ${die?.id || 'undefined'}`);
      
      if (!die || typeof die !== 'object') {
        Logger.log(`VALIDATION ERROR: Invalid die object at index ${i} - type: ${typeof die}`);
        validationErrors++;
        continue;
      }
      
      // Check required die properties with enhanced validation
      const requiredProps = ['id', 'sides', 'number', 'color', 'relativePos'];
      for (const prop of requiredProps) {
        if (!(prop in die)) {
          Logger.log(`VALIDATION ERROR: Die ${i} missing required property: ${prop}`);
          validationErrors++;
        } else if (die[prop] === null || die[prop] === undefined) {
          Logger.log(`VALIDATION ERROR: Die ${i} has null/undefined value for property: ${prop}`);
          validationErrors++;
        }
      }
      
      // Enhanced relative position validation
      if (!die.relativePos || typeof die.relativePos !== 'object') {
        Logger.log(`VALIDATION ERROR: Die ${i} has invalid relativePos object - type: ${typeof die.relativePos}`);
        validationErrors++;
      } else {
        const relX = die.relativePos.x;
        const relY = die.relativePos.y;
        
        // Validate coordinate types and values
        if (typeof relX !== 'number' || typeof relY !== 'number') {
          Logger.log(`VALIDATION ERROR: Die ${i} has invalid relative position coordinate types - x: ${typeof relX}, y: ${typeof relY}`);
          validationErrors++;
        } else if (!isFinite(relX) || !isFinite(relY)) {
          Logger.log(`VALIDATION ERROR: Die ${i} has non-finite relative position coordinates - x: ${relX}, y: ${relY}`);
          validationErrors++;
        } else if (isNaN(relX) || isNaN(relY)) {
          Logger.log(`VALIDATION ERROR: Die ${i} has NaN relative position coordinates - x: ${relX}, y: ${relY}`);
          validationErrors++;
        } else {
          // Calculate absolute position and validate boundaries
          const absX = pieceX + relX;
          const absY = pieceY + relY;
          
          Logger.log(`VALIDATION: Die ${i} position analysis - relative (${relX}, ${relY}) -> absolute (${absX}, ${absY})`);
          
          // Enhanced boundary validation using GridBoundaryValidator
          if (gameBoard) {
            const isWithinBounds = GridBoundaryValidator.validatePosition(absX, absY, gameBoard.state.width, gameBoard.state.height);
            const isAboveGrid = GridBoundaryValidator.isAboveGrid(absY, gameBoard.state.height);
            const isBelowGrid = GridBoundaryValidator.isBelowGrid(absY);
            
            Logger.log(`VALIDATION: Die ${i} boundary checks - withinBounds: ${isWithinBounds}, aboveGrid: ${isAboveGrid}, belowGrid: ${isBelowGrid}`);
            
            // Allow dice to be above grid (spawn area) but warn about other boundary issues
            if (absX < 0 || absX >= gameBoard.state.width) {
              Logger.log(`VALIDATION WARNING: Die ${i} has X coordinate outside grid bounds: ${absX} (valid: 0-${gameBoard.state.width - 1})`);
            }
            
            if (isBelowGrid) {
              Logger.log(`VALIDATION WARNING: Die ${i} is below grid bottom: Y=${absY} (should be >= 0)`);
            }
            
            // Check for extremely large coordinates that might indicate corruption
            const maxReasonableCoord = 1000;
            if (Math.abs(absX) > maxReasonableCoord || Math.abs(absY) > maxReasonableCoord) {
              Logger.log(`VALIDATION ERROR: Die ${i} has unreasonably large coordinates - absolute (${absX}, ${absY})`);
              validationErrors++;
            }
          }
          
          Logger.log(`VALIDATION: Die ${i} coordinate validation complete`);
        }
      }
      
      // Validate other die properties
      if (die.sides && (typeof die.sides !== 'number' || die.sides < 1 || !Number.isInteger(die.sides))) {
        Logger.log(`VALIDATION ERROR: Die ${i} has invalid sides value: ${die.sides} (must be positive integer)`);
        validationErrors++;
      }
      
      if (die.number && (typeof die.number !== 'number' || die.number < 1 || !Number.isInteger(die.number))) {
        Logger.log(`VALIDATION ERROR: Die ${i} has invalid number value: ${die.number} (must be positive integer)`);
        validationErrors++;
      }
      
      if (die.color && typeof die.color !== 'string') {
        Logger.log(`VALIDATION ERROR: Die ${i} has invalid color value: ${die.color} (must be string)`);
        validationErrors++;
      }
    }

    if (validationErrors > 0) {
      Logger.log(`VALIDATION FAILED: ${validationErrors} validation errors found in active piece`);
      return false;
    }

    Logger.log(`VALIDATION PASSED: Active piece state is valid - ${diceCount} dice, shape: ${this.activePiece.shape || 'unknown'}`);
    return true;
  }

  /**
   * Enhanced error handling and recovery for edge cases
   * @param context Description of the operation context for logging
   * @returns True if recovery was successful, false if critical error
   */
  private handleActivePieceErrors(context: string): boolean {
    Logger.log(`ERROR HANDLING: Starting error recovery for context: ${context}`);
    
    if (!this.activePiece) {
      Logger.log('ERROR HANDLING: No active piece - spawning new piece');
      this.spawnPiece();
      return true;
    }
    
    // Handle corrupted dice array
    if (!this.activePiece.dice || !Array.isArray(this.activePiece.dice)) {
      Logger.log('ERROR HANDLING: Corrupted dice array detected - attempting recovery');
      
      try {
        if (this.activePiece.dice === null || this.activePiece.dice === undefined) {
          Logger.log('ERROR RECOVERY: Dice array is null/undefined - initializing empty array');
          this.activePiece.dice = [];
        } else if (typeof this.activePiece.dice === 'object') {
          Logger.log('ERROR RECOVERY: Dice is object but not array - attempting conversion');
          const keys = Object.keys(this.activePiece.dice);
          if (keys.length === 0) {
            this.activePiece.dice = [];
          } else {
            // Try to extract array-like values
            const values = Object.values(this.activePiece.dice);
            if (values.every(v => v && typeof v === 'object' && 'id' in v)) {
              Logger.log('ERROR RECOVERY: Converting object to dice array');
              this.activePiece.dice = values;
            } else {
              Logger.log('ERROR RECOVERY: Object values are not valid dice - resetting to empty');
              this.activePiece.dice = [];
            }
          }
        } else {
          Logger.log('ERROR RECOVERY: Dice array is invalid type - resetting to empty');
          this.activePiece.dice = [];
        }
        
        Logger.log(`ERROR RECOVERY: Dice array recovered with ${this.activePiece.dice.length} dice`);
      } catch (recoveryError) {
        Logger.log(`ERROR RECOVERY FAILED: ${recoveryError} - finalizing corrupted piece`);
        this.finalizePieceLocking(this.activePiece);
        return false;
      }
    }
    
    // Handle invalid piece position
    if (typeof this.activePiece.x !== 'number' || typeof this.activePiece.y !== 'number' ||
        !isFinite(this.activePiece.x) || !isFinite(this.activePiece.y) ||
        isNaN(this.activePiece.x) || isNaN(this.activePiece.y)) {
      Logger.log('ERROR HANDLING: Invalid piece position detected - applying emergency positioning');
      
      this.activePiece.x = GAME_CONSTANTS.SPAWN_X_CENTER;
      this.activePiece.y = GAME_CONSTANTS.SPAWN_Y;
      
      Logger.log(`ERROR RECOVERY: Reset piece position to (${this.activePiece.x}, ${this.activePiece.y})`);
    }
    
    // Validate and clean up dice array
    if (this.activePiece.dice.length > 0) {
      const validDice: any[] = [];
      const invalidDiceIndices: number[] = [];
      
      this.activePiece.dice.forEach((die: any, index: number) => {
        if (this.validateDieStructure(die, index)) {
          validDice.push(die);
        } else {
          invalidDiceIndices.push(index);
        }
      });
      
      if (invalidDiceIndices.length > 0) {
        Logger.log(`ERROR RECOVERY: Removed ${invalidDiceIndices.length} invalid dice from active piece`);
        this.activePiece.dice = validDice;
      }
      
      // If no valid dice remain, finalize the piece
      if (validDice.length === 0) {
        Logger.log('ERROR RECOVERY: No valid dice remaining - finalizing piece');
        this.finalizePieceLocking(this.activePiece);
        return false;
      }
    }
    
    Logger.log(`ERROR HANDLING: Recovery complete for context: ${context}`);
    return true;
  }

  /**
   * Validate individual die structure for error recovery
   * @param die Die object to validate
   * @param index Die index for logging
   * @returns True if die is valid
   */
  private validateDieStructure(die: any, index: number): boolean {
    if (!die || typeof die !== 'object') {
      Logger.log(`DIE VALIDATION: Die ${index} is not a valid object`);
      return false;
    }
    
    const requiredProps = ['id', 'sides', 'number', 'color', 'relativePos'];
    for (const prop of requiredProps) {
      if (!(prop in die) || die[prop] === null || die[prop] === undefined) {
        Logger.log(`DIE VALIDATION: Die ${index} missing or null property: ${prop}`);
        return false;
      }
    }
    
    // Validate relativePos structure
    if (!die.relativePos || typeof die.relativePos !== 'object' ||
        typeof die.relativePos.x !== 'number' || typeof die.relativePos.y !== 'number' ||
        !isFinite(die.relativePos.x) || !isFinite(die.relativePos.y) ||
        isNaN(die.relativePos.x) || isNaN(die.relativePos.y)) {
      Logger.log(`DIE VALIDATION: Die ${index} has invalid relativePos structure`);
      return false;
    }
    
    // Validate numeric properties
    if (typeof die.sides !== 'number' || die.sides < 1 || !Number.isInteger(die.sides) ||
        typeof die.number !== 'number' || die.number < 1 || !Number.isInteger(die.number)) {
      Logger.log(`DIE VALIDATION: Die ${index} has invalid numeric properties`);
      return false;
    }
    
    // Validate color
    if (typeof die.color !== 'string' || die.color.length === 0) {
      Logger.log(`DIE VALIDATION: Die ${index} has invalid color property`);
      return false;
    }
    
    return true;
  }

  /**
   * Validates array modification safety before performing dice removal operations
   * @param indices Array of indices to be removed
   * @param arrayLength Current length of the dice array
   * @returns Validation result with safety recommendations
   */
  private validateArrayModificationSafety(indices: number[], arrayLength: number): {
    isSafe: boolean;
    safeIndices: number[];
    warnings: string[];
    errors: string[];
  } {
    const result = {
      isSafe: true,
      safeIndices: [] as number[],
      warnings: [] as string[],
      errors: [] as string[]
    };
    
    Logger.log(`ARRAY SAFETY: Validating modification safety for ${indices.length} indices on array of length ${arrayLength}`);
    
    if (arrayLength <= 0) {
      result.isSafe = false;
      result.errors.push('Cannot modify empty or invalid array');
      return result;
    }
    
    if (indices.length === 0) {
      result.warnings.push('No indices provided for modification');
      return result;
    }
    
    // Check for various safety issues
    const uniqueIndices = [...new Set(indices)];
    if (uniqueIndices.length !== indices.length) {
      result.warnings.push(`Duplicate indices detected: ${indices.length - uniqueIndices.length} duplicates removed`);
    }
    
    const maxValidIndex = arrayLength - 1;
    const validIndices: number[] = [];
    const invalidIndices: number[] = [];
    
    uniqueIndices.forEach(index => {
      if (Number.isInteger(index) && index >= 0 && index <= maxValidIndex) {
        validIndices.push(index);
      } else {
        invalidIndices.push(index);
      }
    });
    
    if (invalidIndices.length > 0) {
      result.warnings.push(`Invalid indices detected: [${invalidIndices.join(', ')}] (valid range: 0-${maxValidIndex})`);
    }
    
    // Check for potential array modification issues
    if (validIndices.length === arrayLength) {
      result.warnings.push('All array elements will be removed - array will become empty');
    }
    
    if (validIndices.length > arrayLength / 2) {
      result.warnings.push(`Removing ${validIndices.length}/${arrayLength} elements (>${Math.round(arrayLength/2*100)/100}%) - consider array reconstruction`);
    }
    
    // Sort indices for safe removal (descending order)
    result.safeIndices = validIndices.sort((a, b) => b - a);
    
    if (result.errors.length > 0) {
      result.isSafe = false;
    }
    
    Logger.log(`ARRAY SAFETY RESULT: Safe=${result.isSafe}, ValidIndices=${result.safeIndices.length}, Warnings=${result.warnings.length}, Errors=${result.errors.length}`);
    
    return result;
  }

  override update(): void {
    // Update UI system
    if (this.gameUI) {
      this.gameUI.update();
    }
  }

  shutdown(): void {
    // Clean up timers when scene shuts down
    if (this.dropTimer) {
      this.dropTimer.remove(false);
      this.dropTimer = null;
    }
    
    if (this.gravityTimer) {
      this.gravityTimer.remove(false);
      this.gravityTimer = null;
    }

    // Clean up UI
    if (this.gameUI) {
      this.gameUI.destroy();
    }
    
    Logger.log('Game scene: Timers and UI cleaned up');
  }
}
