import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Piece } from '../models/Piece.js';
import { PieceFactory } from '../models/PieceFactory.js';
import { GameStateManager } from '../models/GameStateManager.js';
import { InputManager } from '../input/InputManager.js';
import { AudioManager, AudioEvents } from '../audio/index.js';
import { TetrominoShape, GameMode } from '../../../shared/types/game.js';
import { GameStateController } from '../controllers/GameStateController.js';
import { SimpleDie } from '../models/SimpleDie.js';
import { SimpleDie } from '../models/SimpleDie.js';

export class Game extends Scene {
  // Grid properties
  private gridWidth: number = 10;
  private gridHeight: number = 20;
  private cellSize: number = 0; // Will be calculated dynamically
  private gridGraphics: Phaser.GameObjects.Graphics;
  private gridOffsetX: number = 0;
  private gridOffsetY: number = 0;

  // Target interface dimensions (portrait mobile)
  private targetWidth: number = 400;
  private targetHeight: number = 600;

  // Display type tracking
  private currentDisplayType: 'mobile' | 'desktop' | 'fullscreen' = 'mobile';

  // UI elements
  private scoreText: Phaser.GameObjects.Text;
  private scoreValueText: Phaser.GameObjects.Text;
  private nextPieceLabel: Phaser.GameObjects.Text;
  private nextPieceSquare: Phaser.GameObjects.Graphics;
  private nextPieceGraphics: Phaser.GameObjects.Graphics;
  private debugButtons: Phaser.GameObjects.Text[] = [];

  // Game systems
  private gameStateManager: GameStateManager;
  private inputManager: InputManager;
  private audioManager: AudioManager;
  private audioEvents: AudioEvents;
  private gameStateController: GameStateController;

  // Piece system
  private currentPiece: Piece | null = null;
  private nextPiece: Piece | null = null;
  private pieceFactory: PieceFactory;

  // Game timing and state
  private gravitySpeed: number = 1000; // 1 second per drop
  private lastGravityTime: number = 0;
  private gameMode: GameMode = 'easy';
  private isGameActive: boolean = true;
  private isProcessingTurn: boolean = false;

  constructor() {
    super('Game');
  }

  /**
   * Main update loop - called every frame by Phaser
   */
  public override update(time: number, delta: number): void {
    if (!this.isGameActive) {
      return;
    }

    // Update the finite state machine
    if (this.gameStateController) {
      this.gameStateController.update();
    }

    // Update input manager (only if input is enabled)
    if (this.inputManager && this.gameStateController?.isInputEnabled()) {
      this.inputManager.update(delta);
    }

    // Handle gravity - move pieces down every second (only if input enabled)
    if (this.gameStateController?.isInputEnabled()) {
      this.updateGravity(time);
    }
  }

  /**
   * Handle gravity system - moves pieces down at regular intervals
   */
  private updateGravity(currentTime: number): void {
    const currentPiece = this.gameStateController?.getCurrentPiece();
    if (!currentPiece) {
      return;
    }

    // Check if it's time for gravity to apply
    if (currentTime - this.lastGravityTime >= this.gravitySpeed) {
      this.applyGravityToPiece();
      this.lastGravityTime = currentTime;
    }
  }

  /**
   * Setup game state controller events
   */
  private setupGameStateEvents(): void {
    this.gameStateController.on('spawnNextPiece', () => {
      console.log('🎮 Received spawnNextPiece event - spawning piece');
      this.spawnNextPiece();
    });

    this.gameStateController.on('gameOver', () => {
      this.handleGameOver();
    });

    this.gameStateController.on('scoreUpdate', (score: number) => {
      // Update score display
      this.updateScore();
    });

    this.gameStateController.on('inputEnabled', () => {
      console.log('Input enabled');
    });

    this.gameStateController.on('inputDisabled', () => {
      console.log('Input disabled');
    });
  }

  /**
   * Apply gravity to the current piece
   */
  private applyGravityToPiece(): void {
    if (!this.currentPiece) {
      return;
    }

    const grid = this.gameStateManager.getGrid();
    
    // Check individual dice using the dice matrix for accurate collision detection
    const diceMatrix = this.currentPiece.getDiceMatrix();
    const matrixSize = this.currentPiece.getMatrixSize();
    const collidingDice: { die: SimpleDie; x: number; y: number }[] = [];
    
    for (let row = 0; row < matrixSize; row++) {
      for (let col = 0; col < matrixSize; col++) {
        const die = diceMatrix[row]?.[col];
        if (die) {
          const currentX = this.currentPiece.gridX + col;
          const currentY = this.currentPiece.gridY + row;
          const newY = currentY + 1;
          
          // Check if this specific die would collide when moving down
          if (grid.checkDieCollision(currentX, newY)) {
            collidingDice.push({ die, x: currentX, y: currentY });
          }
        }
      }
    }

    const totalDice = this.currentPiece.dice.length;
    
    if (collidingDice.length === 0) {
      // No collisions - move entire piece down
      this.movePieceDownSmooth();
    } else if (collidingDice.length === totalDice) {
      // All dice colliding - lock entire piece
      console.log(`🔒 All ${totalDice} dice colliding - locking piece`);
      this.gameStateController.lockCurrentPiece();
    } else {
      // Some dice colliding - break piece and handle individually
      console.log(`🔒 ${collidingDice.length}/${totalDice} dice colliding - breaking piece`);
      this.breakPieceOnCollision(collidingDice);
    }
  }

  public create(): void {
    console.log('Game scene create() called');

    try {
      // Set dark background
      this.cameras.main.setBackgroundColor(0x1a1a2e);

      // Detect initial display type
      this.detectDisplayType();

      // Calculate initial layout (this sets cellSize)
      this.calculateLayout(this.scale.width, this.scale.height);
      console.log('Layout calculated, cellSize:', this.cellSize);

      // Create the grid graphics
      this.createGrid();
      console.log('Grid graphics created');

      // Initialize game systems
      this.initializeGameSystems();
      console.log('Game systems initialized');

      // Initialize game state controller
      this.gameStateController = new GameStateController(
        this,
        this.gameStateManager.getGrid(),
        this.gameStateManager.getMatchProcessor()
      );
      this.setupGameStateEvents();
      console.log('Game state controller initialized');

      // Setup input handling
      this.setupInput();
      console.log('Input system initialized');

      // Generate initial pieces
      this.generateNextPiece();
      this.spawnFirstPiece();
      console.log('Initial pieces created');
    } catch (error) {
      console.error('Error in Game scene create():', error);
      throw error; // Re-throw to see the full error
    }

    // Create UI elements
    this.createUI();

    // Add debug buttons for testing display modes
    this.createDebugButtons();

    // Debug square removed - no longer needed

    // Handle window resize
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.updateLayout(gameSize.width, gameSize.height);
    });

    // Listen for fullscreen changes (multiple event types for cross-browser support)
    const fullscreenEvents = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];
    fullscreenEvents.forEach((eventType) => {
      document.addEventListener(eventType, () => {
        console.log(`Fullscreen event: ${eventType}`);
        setTimeout(() => {
          this.detectDisplayType();
          this.updateLayout(this.scale.width, this.scale.height);
        }, 100); // Small delay to ensure fullscreen state is updated
      });
    });

    // Also listen for window resize events
    window.addEventListener('resize', () => {
      console.log(`Window resize: ${window.innerWidth}x${window.innerHeight}`);
      setTimeout(() => {
        this.detectDisplayType();
        this.updateLayout(window.innerWidth, window.innerHeight);
      }, 100);
    });

    console.log('Game scene initialization complete');
  }

  /**
   * Create the game grid using Phaser graphics
   */
  private createGrid(): void {
    // Create graphics object for the grid
    this.gridGraphics = this.add.graphics();

    // Draw the grid
    this.drawGrid();
  }

  /**
   * Draw the grid lines
   */
  private drawGrid(): void {
    this.gridGraphics.clear();

    // Set line style - green color, 2px width
    this.gridGraphics.lineStyle(2, 0x00ff00, 1);

    // Draw vertical lines
    for (let x = 0; x <= this.gridWidth; x++) {
      const lineX = this.gridOffsetX + x * this.cellSize;
      this.gridGraphics.moveTo(lineX, this.gridOffsetY);
      this.gridGraphics.lineTo(lineX, this.gridOffsetY + this.gridHeight * this.cellSize);
    }

    // Draw horizontal lines
    for (let y = 0; y <= this.gridHeight; y++) {
      const lineY = this.gridOffsetY + y * this.cellSize;
      this.gridGraphics.moveTo(this.gridOffsetX, lineY);
      this.gridGraphics.lineTo(this.gridOffsetX + this.gridWidth * this.cellSize, lineY);
    }

    // Apply the stroke to make lines visible
    this.gridGraphics.strokePath();
  }

  /**
   * Calculate grid layout based on display type with specific cell sizes
   */
  private calculateLayout(width: number, height: number): void {
    let availableWidth = width;
    let availableHeight = height;

    // Set cell size based on display type
    switch (this.currentDisplayType) {
      case 'mobile':
        // Use target mobile dimensions if screen is larger
        availableWidth = Math.min(width, this.targetWidth);
        availableHeight = Math.min(height, this.targetHeight);
        this.cellSize = 24; // Fixed 24x24 for mobile
        break;

      case 'desktop':
        this.cellSize = 32; // Fixed 32x32 for desktop
        break;

      case 'fullscreen':
        // For fullscreen, calculate optimal size up to 128x128 max
        const maxCellByWidth = Math.floor((width - 200) / this.gridWidth); // Leave 200px for UI
        const maxCellByHeight = Math.floor((height - 200) / this.gridHeight);
        const calculatedSize = Math.min(maxCellByWidth, maxCellByHeight);

        // Use calculated size but cap at 128px maximum
        this.cellSize = Math.min(calculatedSize, 128);

        // Ensure minimum size for visibility
        this.cellSize = Math.max(this.cellSize, 32);
        break;
    }

    // Calculate actual grid dimensions
    const gridPixelWidth = this.gridWidth * this.cellSize;
    const gridPixelHeight = this.gridHeight * this.cellSize;

    // Position grid based on display type
    if (this.currentDisplayType === 'mobile') {
      // Mobile: 10px from left, centered vertically
      this.gridOffsetX = 10;
      this.gridOffsetY = (availableHeight - gridPixelHeight) / 2;
    } else {
      // Desktop/Fullscreen: center both horizontally and vertically
      this.gridOffsetX = (availableWidth - gridPixelWidth) / 2;
      this.gridOffsetY = (availableHeight - gridPixelHeight) / 2;
    }

    // Calculate UI area information
    const rightUISpace = availableWidth - this.gridOffsetX - gridPixelWidth;
    const bottomUISpace = availableHeight - this.gridOffsetY - gridPixelHeight;

    console.log(
      `${this.currentDisplayType.toUpperCase()}: ${this.cellSize}x${this.cellSize} cells`
    );
    console.log(
      `Grid: ${gridPixelWidth}x${gridPixelHeight} at (${this.gridOffsetX.toFixed(1)}, ${this.gridOffsetY.toFixed(1)})`
    );
    console.log(
      `UI space - Right: ${rightUISpace.toFixed(1)}px, Bottom: ${bottomUISpace.toFixed(1)}px`
    );

    // Log screen utilization
    const screenUtilization = (
      ((gridPixelWidth * gridPixelHeight) / (availableWidth * availableHeight)) *
      100
    ).toFixed(1);
    console.log(`Screen utilization: ${screenUtilization}%`);
  }

  /**
   * Detect the current display type based on specific dimension criteria
   */
  private detectDisplayType(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const previousType = this.currentDisplayType;

    // Use your corrected criteria:
    // Mobile: 1080 or below (in either dimension)
    // Desktop: up to 1600 (in both dimensions)
    // Fullscreen: anything above 1600 (in either dimension)

    if (width > 1600 || height > 1600) {
      this.currentDisplayType = 'fullscreen';
    } else if (width <= 1080 || height <= 1080) {
      this.currentDisplayType = 'mobile';
    } else {
      this.currentDisplayType = 'desktop';
    }

    console.log(`Display type: ${previousType} -> ${this.currentDisplayType} (${width}x${height})`);
    console.log(`Criteria: Mobile(≤1080), Desktop(≤1600), Fullscreen(>1600)`);
  }

  /**
   * Get the current display type
   */
  public getDisplayType(): 'mobile' | 'desktop' | 'fullscreen' {
    return this.currentDisplayType;
  }

  /**
   * Initialize all game systems
   */
  private initializeGameSystems(): void {
    try {
      // Initialize audio system
      this.audioManager = new AudioManager(this);
      this.audioEvents = new AudioEvents(this.audioManager);

      try {
        this.audioManager.initialize();
      } catch (error) {
        console.warn('Audio system initialization failed:', error);
      }

      // Initialize GameStateManager with proper game mode
      this.gameStateManager = new GameStateManager(this, this.gameMode);
      console.log('GameStateManager created successfully');

      // Initialize piece factory
      this.pieceFactory = new PieceFactory(this.gameMode, this.cellSize);
      console.log('PieceFactory created successfully');

      // Connect audio events to game systems
      if (this.audioEvents) {
        const boosterManager = this.gameStateManager.getBoosterManager();
        const matchProcessor = this.gameStateManager.getMatchProcessor();

        boosterManager.setAudioEvents(this.audioEvents);
        matchProcessor.setAudioEvents(this.audioEvents);
      }

      // Update grid layout
      this.updateGridLayout();

      console.log('Game systems initialized successfully');
    } catch (error) {
      console.error('Error initializing game systems:', error);
      throw error;
    }
  }

  /**
   * Update grid layout when display changes
   */
  private updateGridLayout(): void {
    const grid = this.gameStateManager.getGrid();
    if (grid) {
      grid.setLayout(this.cellSize, this.gridOffsetX, this.gridOffsetY);
    }
    if (this.pieceFactory) {
      this.pieceFactory.setCellSize(this.cellSize);
    }

    // Update current piece if it exists
    if (this.currentPiece) {
      // Update each die in the current piece with new cell size
      this.currentPiece.dice.forEach((die) => {
        if ('updateCellSize' in die) {
          (die as any).updateCellSize(this.cellSize);
        }
      });
      // Update piece positions with new grid offset
      this.currentPiece.setGridOffset(this.gridOffsetX, this.gridOffsetY);
    }
  }

  /**
   * Setup input handling
   */
  private setupInput(): void {
    this.inputManager = new InputManager(this);

    // Handle piece movement
    this.inputManager.onInput('move_left', () => {
      if (this.currentPiece && this.isGameActive && this.gameStateController?.isInputEnabled()) {
        this.movePieceLeft();
      }
    });

    this.inputManager.onInput('move_right', () => {
      if (this.currentPiece && this.isGameActive && this.gameStateController?.isInputEnabled()) {
        this.movePieceRight();
      }
    });

    this.inputManager.onInput('move_down', () => {
      if (this.currentPiece && this.isGameActive && this.gameStateController?.isInputEnabled()) {
        this.movePieceDown();
      }
    });

    this.inputManager.onInput('rotate', () => {
      if (this.currentPiece && this.isGameActive && this.gameStateController?.isInputEnabled()) {
        this.rotatePiece();
      }
    });

    this.inputManager.onInput('hard_drop', () => {
      if (this.currentPiece && this.isGameActive && this.gameStateController?.isInputEnabled()) {
        this.hardDropPiece();
      }
    });

    console.log('Input system setup complete');
  }

  /**
   * Generate a random Tetris piece shape based on game mode
   */
  private getRandomShape(): TetrominoShape {
    let shapes: TetrominoShape[];
    
    // Easy mode: only simple pieces
    if (this.gameMode === 'easy') {
      shapes = ['O', 'I', 'L', 'J', 'T'];
    } else {
      // Other modes: include all pieces
      shapes = ['O', 'I', 'S', 'Z', 'L', 'J', 'T', 'PLUS'];
    }
    
    const randomIndex = Math.floor(Math.random() * shapes.length);
    const shape = shapes[randomIndex];
    return shape || 'I'; // Fallback to 'I' if undefined
  }

  /**
   * Generate the next piece shape (just the shape, not the actual piece)
   */
  private generateNextPiece(): void {
    try {
      // Just store the shape and matrix for preview, don't create actual piece
      const shape = this.getRandomShape();

      // Create a simple preview object instead of a full piece
      this.nextPiece = {
        shape: shape,
        shapeMatrix: this.getShapeMatrix(shape),
      } as any; // Temporary type override

      console.log(`Generated next piece shape: ${shape}`);
    } catch (error) {
      console.error('Error generating next piece:', error);
      this.nextPiece = null;
    }
  }

  /**
   * Get shape matrix for a given shape
   */
  private getShapeMatrix(shape: TetrominoShape): number[][] {
    const shapeMatrices: Record<TetrominoShape, number[][]> = {
      'I': [[1, 1, 1, 1]],
      'O': [
        [1, 1],
        [1, 1],
      ],
      'T': [
        [0, 1, 0],
        [1, 1, 1],
      ],
      'S': [
        [0, 1, 1],
        [1, 1, 0],
      ],
      'Z': [
        [1, 1, 0],
        [0, 1, 1],
      ],
      'J': [
        [1, 0, 0],
        [1, 1, 1],
      ],
      'L': [
        [0, 0, 1],
        [1, 1, 1],
      ],
      'PLUS': [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
    };

    return shapeMatrices[shape] || [[1]];
  }

  /**
   * Render the next piece in the preview area
   */
  private renderNextPiece(): void {
    if (!this.nextPiece || !this.nextPieceGraphics) return;

    this.nextPieceGraphics.clear();

    const uiStartX = this.gridOffsetX + this.gridWidth * this.cellSize + 20;
    const uiStartY = this.gridOffsetY + 20;
    const previewX = uiStartX + 5;
    const previewY = uiStartY + 30;
    const previewCellSize = 15;

    // Get the piece shape matrix
    const matrix = this.nextPiece.shapeMatrix;
    if (!matrix || !matrix[0]) return;

    // Calculate centering
    const pieceWidth = matrix[0].length * previewCellSize;
    const pieceHeight = matrix.length * previewCellSize;
    const centerX = previewX + (70 - pieceWidth) / 2;
    const centerY = previewY + (70 - pieceHeight) / 2;

    // Draw each cell of the piece
    for (let row = 0; row < matrix.length; row++) {
      const matrixRow = matrix[row];
      if (!matrixRow) continue;

      for (let col = 0; col < matrixRow.length; col++) {
        if (matrixRow[col] === 1) {
          const cellX = centerX + col * previewCellSize;
          const cellY = centerY + row * previewCellSize;

          // Use a nice blue color for preview
          this.nextPieceGraphics.fillStyle(0x4dabf7, 1);
          this.nextPieceGraphics.fillRect(cellX, cellY, previewCellSize - 1, previewCellSize - 1);

          // Add white border
          this.nextPieceGraphics.lineStyle(1, 0xffffff, 0.8);
          this.nextPieceGraphics.strokeRect(cellX, cellY, previewCellSize - 1, previewCellSize - 1);
        }
      }
    }
  }

  /**
   * Create UI elements (score and next piece)
   */
  private createUI(): void {
    // Score in top left margin - "Score:" left aligned, number right aligned to grid edge
    const scoreY = this.gridOffsetY - 30;
    const gridRightEdge = this.gridOffsetX + this.gridWidth * this.cellSize;

    // Score label (left aligned to grid) with Stalinist One font
    this.scoreText = this.add.text(this.gridOffsetX, scoreY, 'Score:', {
      fontFamily: 'Stalinist One',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });

    // Score value (right aligned to grid edge) with Stalinist One font
    const currentScore = this.gameStateManager ? this.gameStateManager.getScore() : 0;
    this.scoreValueText = this.add
      .text(gridRightEdge, scoreY, currentScore.toString(), {
        fontFamily: 'Stalinist One',
        fontSize: '18px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(1, 0); // Right aligned

    // Next Piece in right side area
    const uiStartX = this.gridOffsetX + this.gridWidth * this.cellSize + 20;
    const uiStartY = this.gridOffsetY + 20;

    this.nextPieceLabel = this.add.text(uiStartX, uiStartY, 'Next Piece:', {
      fontFamily: 'Stalinist One',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });

    // Background square for next piece preview
    this.nextPieceSquare = this.add.graphics();
    this.nextPieceSquare.fillStyle(0x222222, 1); // Dark gray background
    this.nextPieceSquare.fillRect(uiStartX, uiStartY + 25, 80, 80);
    this.nextPieceSquare.lineStyle(2, 0x666666, 1); // Gray border
    this.nextPieceSquare.strokeRect(uiStartX, uiStartY + 25, 80, 80);

    // Graphics object for rendering the actual piece
    this.nextPieceGraphics = this.add.graphics();

    // Render the initial next piece
    this.renderNextPiece();
  }

  /**
   * Update UI positions when layout changes
   */
  private updateUI(): void {
    if (!this.scoreText) return;

    // Update score position in top margin
    const scoreY = this.gridOffsetY - 30;
    const gridRightEdge = this.gridOffsetX + this.gridWidth * this.cellSize;

    this.scoreText.setPosition(this.gridOffsetX, scoreY);
    this.scoreValueText.setPosition(gridRightEdge, scoreY);
    const currentScore = this.gameStateManager ? this.gameStateManager.getScore() : 0;
    this.scoreValueText.setText(currentScore.toString());

    // Update next piece area in right side
    const uiStartX = this.gridOffsetX + this.gridWidth * this.cellSize + 20;
    const uiStartY = this.gridOffsetY + 20;

    // Update next piece label position
    this.nextPieceLabel.setPosition(uiStartX, uiStartY);

    // Update next piece background square
    this.nextPieceSquare.clear();
    this.nextPieceSquare.fillStyle(0x222222, 1);
    this.nextPieceSquare.fillRect(uiStartX, uiStartY + 25, 80, 80);
    this.nextPieceSquare.lineStyle(2, 0x666666, 1);
    this.nextPieceSquare.strokeRect(uiStartX, uiStartY + 25, 80, 80);

    // Re-render the next piece in new position
    this.renderNextPiece();
  }

  /**
   * Update debug button positions
   */
  private updateDebugButtons(): void {
    if (this.debugButtons.length === 0) return;

    const buttonSize = 24;
    const buttonSpacing = 4;
    const startX = this.scale.width - (3 * buttonSize + 2 * buttonSpacing + 10);
    const buttonY = 10;

    this.debugButtons.forEach((button, index) => {
      const buttonX = startX + index * (buttonSize + buttonSpacing);
      button.setPosition(buttonX, buttonY);
    });
  }

  /**
   * Update score value from game state
   */
  public updateScore(): void {
    const currentScore = this.gameStateManager ? this.gameStateManager.getScore() : 0;

    if (this.scoreValueText) {
      this.scoreValueText.setText(currentScore.toString());
    }
  }

  /**
   * Refresh visual state - ensure only grid dice are visible
   */
  public refreshVisualState(): void {
    const grid = this.gameStateManager.getGrid();
    if (grid) {
      console.log('🎨 GAME: Refreshing visual state');
      grid.renderAllDice();
      grid.hideOrphanedDice(this);
    }
  }

  /**
   * Spawn next piece as current piece
   */
  public spawnNextPiece(): void {
    console.log('🎮 spawnNextPiece() called');
    
    if (!this.nextPiece) {
      console.error('❌ No next piece available');
      return;
    }
    
    if (!this.pieceFactory) {
      console.error('❌ No piece factory available');
      return;
    }

    try {
      console.log(`🎮 Creating piece: ${this.nextPiece.shape}`);
      
      // Update piece factory with current cell size
      this.pieceFactory.setCellSize(this.cellSize);

      // Create actual piece from the preview shape
      const actualPiece = this.pieceFactory.createPiece(
        this,
        this.nextPiece.shape,
        4, // Center of 10-wide grid
        0 // Top of grid
      );

      console.log(`🎮 Piece created with ${actualPiece.dice.length} dice`);

      // Position the piece within the grid bounds immediately
      this.positionPieceInGrid(actualPiece);

      // Set as current piece
      this.currentPiece = actualPiece;
      console.log('🎮 Setting current piece in GameStateController');
      this.gameStateController.setCurrentPiece(actualPiece);

      // Generate new next piece preview
      this.generateNextPiece();
      this.renderNextPiece();

      console.log(
        `✅ Spawned new piece: ${actualPiece.shape} at (${actualPiece.gridX}, ${actualPiece.gridY})`
      );

      // Check if the new piece can be placed (game over check)
      const grid = this.gameStateManager.getGrid();
      if (grid.checkCollision(actualPiece, actualPiece.gridX, actualPiece.gridY)) {
        console.log('Cannot place new piece - Game Over!');
        this.handleGameOver();
      }
    } catch (error) {
      console.error('❌ Error spawning next piece:', error);
      this.handleGameOver();
    }
  }

  /**
   * Create debug buttons for testing display modes
   */
  private createDebugButtons(): void {
    const buttonSize = 24;
    const buttonSpacing = 4;
    const startX = this.scale.width - (3 * buttonSize + 2 * buttonSpacing + 10);
    const buttonY = 10;

    const buttonLabels = ['M', 'D', 'F'];
    const buttonModes: ('mobile' | 'desktop' | 'fullscreen')[] = [
      'mobile',
      'desktop',
      'fullscreen',
    ];

    buttonLabels.forEach((label, index) => {
      const buttonX = startX + index * (buttonSize + buttonSpacing);
      const button = this.add
        .text(buttonX, buttonY, label, {
          fontFamily: 'Stalinist One',
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: '#444444',
          padding: { x: 6, y: 4 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          const mode = buttonModes[index];
          if (mode) {
            console.log(`Forcing ${mode} mode`);
            this.currentDisplayType = mode;
            this.calculateLayout(this.scale.width, this.scale.height);
            this.drawGrid();
            this.updateUI();
            this.updateDebugButtons();
          }
        });

      this.debugButtons.push(button);
    });
  }

  /**
   * Update layout when window is resized
   */
  private updateLayout(width: number, height: number): void {
    console.log(`Layout update triggered: ${width}x${height}`);

    // Re-detect display type on resize
    this.detectDisplayType();

    // Recalculate layout
    this.calculateLayout(width, height);

    // Redraw the grid with new layout
    if (this.gridGraphics) {
      this.drawGrid();
    }

    // Update grid layout for game systems
    this.updateGridLayout();

    // Update UI positions
    this.updateUI();

    // Update debug button positions
    this.updateDebugButtons();

    console.log(
      `Layout update complete: ${this.currentDisplayType} mode, ${this.cellSize}px cells`
    );
  }

  /**
   * Spawn the first piece to start the game
   */
  private spawnFirstPiece(): void {
    if (this.nextPiece && this.pieceFactory) {
      try {
        // Update piece factory with current cell size
        this.pieceFactory.setCellSize(this.cellSize);

        // Create actual piece from the preview shape
        const actualPiece = this.pieceFactory.createPiece(
          this,
          this.nextPiece.shape,
          4, // Center of 10-wide grid
          0 // Top of grid
        );

        // Position the piece within the grid bounds
        this.positionPieceInGrid(actualPiece);

        // Set as current piece
        this.currentPiece = actualPiece;
        this.gameStateController.setCurrentPiece(actualPiece);

        console.log(
          `First piece spawned: ${this.currentPiece.shape} at (${this.currentPiece.gridX}, ${this.currentPiece.gridY})`
        );

        // Generate new next piece preview
        this.generateNextPiece();
        this.renderNextPiece();

        // Initialize gravity timer
        this.lastGravityTime = this.time.now;
      } catch (error) {
        console.error('Error spawning first piece:', error);
        this.handleGameOver();
      }
    }
  }

  /**
   * Position a piece correctly within the game grid
   */
  private positionPieceInGrid(piece: Piece): void {
    console.log(`Positioning piece ${piece.shape} with ${piece.dice.length} dice`);
    console.log(`Piece grid position: (${piece.gridX}, ${piece.gridY})`);
    console.log(
      `Grid offset: (${this.gridOffsetX}, ${this.gridOffsetY}), Cell size: ${this.cellSize}`
    );

    // Use the new positioning method with grid offset
    piece.updateDicePositionsWithOffset(this.gridOffsetX, this.gridOffsetY);
  }

  // Old lockCurrentPiece method removed - now handled by GameStateController

  /**
   * Move piece left with collision detection
   */
  private movePieceLeft(): void {
    if (!this.currentPiece) return;

    const grid = this.gameStateManager.getGrid();
    const canMove = !grid.checkCollision(
      this.currentPiece,
      this.currentPiece.gridX - 1,
      this.currentPiece.gridY
    );

    if (canMove) {
      this.currentPiece.gridX--;
      this.currentPiece.setGridOffset(this.gridOffsetX, this.gridOffsetY);
      console.log(`Piece moved left to x=${this.currentPiece.gridX}`);
    }
  }

  /**
   * Move piece right with collision detection
   */
  private movePieceRight(): void {
    if (!this.currentPiece) return;

    const grid = this.gameStateManager.getGrid();
    const canMove = !grid.checkCollision(
      this.currentPiece,
      this.currentPiece.gridX + 1,
      this.currentPiece.gridY
    );

    if (canMove) {
      this.currentPiece.gridX++;
      this.currentPiece.setGridOffset(this.gridOffsetX, this.gridOffsetY);
      console.log(`Piece moved right to x=${this.currentPiece.gridX}`);
    }
  }

  /**
   * Move piece down manually (soft drop)
   */
  private movePieceDown(): void {
    if (!this.currentPiece) return;

    const grid = this.gameStateManager.getGrid();
    const canMove = !grid.checkCollision(
      this.currentPiece,
      this.currentPiece.gridX,
      this.currentPiece.gridY + 1
    );

    if (canMove) {
      this.currentPiece.gridY++;
      this.currentPiece.setGridOffset(this.gridOffsetX, this.gridOffsetY);
      console.log(`Piece soft dropped to y=${this.currentPiece.gridY}`);

      // Reset gravity timer to prevent double movement
      this.lastGravityTime = this.time.now;
    } else {
      // Can't move down - lock immediately
      this.gameStateController.lockCurrentPiece();
    }
  }

  /**
   * Move piece down smoothly due to gravity
   */
  private movePieceDownSmooth(): void {
    if (!this.currentPiece) return;

    this.currentPiece.gridY++;
    this.currentPiece.setGridOffset(this.gridOffsetX, this.gridOffsetY);
    console.log(`Piece gravity moved to y=${this.currentPiece.gridY}`);
  }

  /**
   * Rotate piece with collision detection
   */
  private rotatePiece(): void {
    if (!this.currentPiece) return;

    // Try to rotate the piece (this updates the shapeMatrix and repositions dice)
    const success = this.currentPiece.rotatePiece();
    if (success) {
      // Ensure the piece uses the correct grid offset after rotation
      this.currentPiece.setGridOffset(this.gridOffsetX, this.gridOffsetY);
      console.log(`Piece rotated to ${this.currentPiece.rotation} degrees, dice repositioned`);
    }
  }

  /**
   * Hard drop piece to bottom
   */
  private hardDropPiece(): void {
    if (!this.currentPiece) return;

    const grid = this.gameStateManager.getGrid();
    let dropDistance = 0;

    // Find how far the piece can drop
    while (
      !grid.checkCollision(
        this.currentPiece,
        this.currentPiece.gridX,
        this.currentPiece.gridY + dropDistance + 1
      )
    ) {
      dropDistance++;
    }

    if (dropDistance > 0) {
      this.currentPiece.gridY += dropDistance;
      this.tweenPieceToPosition(this.currentPiece, 200); // Fast hard drop
      console.log(`Piece hard dropped ${dropDistance} cells to y=${this.currentPiece.gridY}`);

      // Lock the piece after hard drop
      this.time.delayedCall(200, () => {
        this.gameStateController.lockCurrentPiece();
      });
    } else {
      // Already at bottom, lock immediately
      this.gameStateController.lockCurrentPiece();
    }
  }

  /**
   * Smoothly tween piece to its grid position
   */
  private tweenPieceToPosition(piece: Piece, duration: number): void {
    let dieIndex = 0;

    for (let row = 0; row < piece.shapeMatrix.length; row++) {
      const matrixRow = piece.shapeMatrix[row];
      if (matrixRow) {
        for (let col = 0; col < matrixRow.length; col++) {
          if (matrixRow[col] === 1 && dieIndex < piece.dice.length) {
            const die = piece.dice[dieIndex];
            if (die) {
              const targetX =
                this.gridOffsetX + (piece.gridX + col) * this.cellSize + this.cellSize / 2;
              const targetY =
                this.gridOffsetY + (piece.gridY + row) * this.cellSize + this.cellSize / 2;

              // Smooth tween to target position
              this.tweens.add({
                targets: die,
                x: targetX,
                y: targetY,
                duration: duration,
                ease: 'Power2',
              });
            }
            dieIndex++;
          }
        }
      }
    }
  }

  /**
   * Break piece when some dice collide but others don't
   */
  private async breakPieceOnCollision(collidingDice: { die: SimpleDie; x: number; y: number }[]): Promise<void> {
    if (!this.currentPiece) return;

    console.log(`Breaking piece ${this.currentPiece.shape} - ${collidingDice.length} dice colliding`);
    
    this.isProcessingTurn = true;

    try {
      const grid = this.gameStateManager.getGrid();
      
      // Place colliding dice in the grid
      for (const { die, x, y } of collidingDice) {
        grid.setDie(x, y, die);
      }

      // Remove colliding dice from the piece
      const remainingDice = this.currentPiece.dice.filter(die => 
        !collidingDice.some(colliding => colliding.die === die)
      );

      if (remainingDice.length > 0) {
        // Create a new piece with remaining dice
        // For now, let remaining dice fall individually
        for (const die of remainingDice) {
          // Find the die's current position
          const dicePositions = this.currentPiece.getDicePositions();
          for (let i = 0; i < dicePositions.length && i < this.currentPiece.dice.length; i++) {
            if (this.currentPiece.dice[i] === die) {
              const pos = dicePositions[i];
              if (pos) {
                grid.setDie(pos.x, pos.y, die);
              }
              break;
            }
          }
        }
      }

      // Clear current piece and spawn next piece immediately
      this.currentPiece = null;
      this.spawnNextPiece();

      // Enable controls immediately
      this.isProcessingTurn = false;

      // GameStateController will handle cascade processing

    } catch (error) {
      console.error('Error breaking piece on collision:', error);
      this.handleGameOver();
      this.isProcessingTurn = false;
    }
  }

  /**
   * Handle game over condition
   */
  private handleGameOver(): void {
    console.log('Game Over!');

    this.isGameActive = false;

    // Could transition to GameOver scene here
    // For now, just log the final score
    const finalScore = this.gameStateManager.getScore();
    console.log(`Final Score: ${finalScore}`);
  }
}
