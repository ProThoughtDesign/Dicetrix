import * as Phaser from 'phaser';
import { BaseUI } from './BaseUI';
import { InputHandler, InputCallbacks, TouchDragCallbacks } from './InputHandler';
import { CoordinateConverter } from '../../../shared/utils/CoordinateConverter';
import { GAME_CONSTANTS } from '../../../shared/constants/GameConstants';
import Logger from '../../utils/Logger';
import FontLoader from '../../utils/FontLoader';
import { BottomSectionLayoutManager, LayoutArea, DEFAULT_BOTTOM_SECTION_CONFIG } from './BottomSectionLayoutManager';

export interface GameUICallbacks extends InputCallbacks {
  onBoardTouch?: (gridX: number, gridY: number) => void;
}

export class GameUI extends BaseUI {
  private inputHandler: InputHandler;
  private coordinateConverter: CoordinateConverter;
  private bottomLayoutManager: BottomSectionLayoutManager;

  // UI Elements
  private leftColumn: Phaser.GameObjects.Container;
  private rightColumn: Phaser.GameObjects.Container;

  // Left Column Elements
  private scoreLabel: Phaser.GameObjects.Text;
  private scoreValue: Phaser.GameObjects.Text;
  private matchFooter: Phaser.GameObjects.Text;
  private boardContainer: Phaser.GameObjects.Container;
  private boardBackground: Phaser.GameObjects.Graphics;
  private boardBorder: Phaser.GameObjects.Graphics;
  private gridLines: Phaser.GameObjects.Graphics;

  // Right Column Elements
  private nextLabel: Phaser.GameObjects.Text;
  private nextBackground: Phaser.GameObjects.Graphics;
  private nextBorder: Phaser.GameObjects.Graphics;
  private nextGridLines: Phaser.GameObjects.Graphics;
  private controlsContainer: Phaser.GameObjects.Container;
  private boostersContainer: Phaser.GameObjects.Container;
  private boostersBackground: Phaser.GameObjects.Graphics;
  private boostersBorder: Phaser.GameObjects.Graphics;
  private leaderboardContainer: Phaser.GameObjects.Container; // Desktop only

  // Control buttons
  private controlButtons: Phaser.GameObjects.Rectangle[] = [];
  private controlLabels: Phaser.GameObjects.Text[] = [];
  // Booster slots (only the slot rectangles)
  private boosterSlots: Phaser.GameObjects.Rectangle[] = [];

  // Board metrics for external access
  public boardMetrics: {
    boardX: number;
    boardY: number;
    boardW: number;
    boardH: number;
    cellW: number;
    cellH: number;
    cols: number;
    rows: number;
    boardAreaY: number;
  } = {
    boardX: 0,
    boardY: 0,
    boardW: 0,
    boardH: 0,
    cellW: 0,
    cellH: 0,
    cols: GAME_CONSTANTS.GRID_WIDTH,
    rows: GAME_CONSTANTS.GRID_HEIGHT,
    boardAreaY: 0,
  };

  // Next piece metrics
  public nextMetrics: {
    nextX: number;
    nextY: number;
    nextW: number;
    nextH: number;
    cellW: number;
    cellH: number;
    globalNextX: number;
    globalNextY: number;
  } = {
    nextX: 0,
    nextY: 0,
    nextW: 0,
    nextH: 0,
    cellW: 0,
    cellH: 0,
    globalNextX: 0,
    globalNextY: 0,
  };

  constructor(scene: Phaser.Scene, callbacks: GameUICallbacks = {}) {
    super(scene);

    // Initialize coordinate converter for 8x16 grid
    this.coordinateConverter = new CoordinateConverter(GAME_CONSTANTS.GRID_HEIGHT);

    // Initialize bottom section layout manager
    this.bottomLayoutManager = new BottomSectionLayoutManager({
      ...DEFAULT_BOTTOM_SECTION_CONFIG,
      screenWidth: this.layout.screenWidth,
      screenHeight: this.layout.screenHeight,
    });

    this.createUIElements();
    this.setupInputHandlers(callbacks);
    this.updateLayout();

    Logger.log('GameUI initialized');
  }

  private createUIElements(): void {
    // Create main column containers
    this.leftColumn = this.scene.add.container(0, 0);
    this.rightColumn = this.scene.add.container(0, 0);

    this.container.add([this.leftColumn, this.rightColumn]);

    // Left Column: Score and Board
    this.createScoreElements();
    this.createBoardElements();

    // Right Column: Next piece, Controls, Boosters, Leaderboard
    this.createNextPieceElements();
    this.createControlElements();
    this.createBoosterElements();
    this.createLeaderboardElements();
  }

  private createScoreElements(): void {
    this.scoreLabel = this.scene.add
      .text(0, 0, 'Score:', {
        fontFamily: FontLoader.createFontFamily('Asimovian'),
        fontSize: '42px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0, 0);

    this.scoreValue = this.scene.add
      .text(0, 0, '0', {
        fontFamily: FontLoader.createFontFamily('Asimovian'),
        fontSize: '42px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0);

    this.matchFooter = this.scene.add
      .text(0, 0, '', {
        fontFamily: FontLoader.createFontFamily('Asimovian'),
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0, 0);

    this.leftColumn.add([this.scoreLabel, this.scoreValue]);
    this.leftColumn.add(this.matchFooter);
  }

  private createBoardElements(): void {
    this.boardContainer = this.scene.add.container(0, 0);
    this.boardBackground = this.scene.add.graphics();
    this.boardBorder = this.scene.add.graphics();
    this.gridLines = this.scene.add.graphics();

    this.boardContainer.add([this.boardBackground, this.gridLines, this.boardBorder]);
    this.leftColumn.add(this.boardContainer);
  }

  private createNextPieceElements(): void {
    this.nextLabel = this.scene.add
      .text(0, 0, 'Next Piece', {
        fontFamily: FontLoader.createFontFamily('Asimovian'),
        fontSize: '24px',
        color: '#00ff88',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5, 0);

    this.nextBackground = this.scene.add.graphics();
    this.nextBorder = this.scene.add.graphics();
    this.nextGridLines = this.scene.add.graphics();

    this.rightColumn.add([
      this.nextLabel,
      this.nextBackground,
      this.nextBorder,
      this.nextGridLines,
    ]);
  }

  private createControlElements(): void {
    this.controlsContainer = this.scene.add.container(0, 0);

    // Control button data: [row, col, symbol, action]
    const controlData: Array<[number, number, string, string]> = [
      [0, 0, '↺', 'rotateLeft'],
      [0, 1, '⇊', 'softDrop'],
      [0, 2, '↻', 'rotateRight'],
      [1, 0, '←', 'moveLeft'],
      [1, 1, '⇓', 'hardDrop'],
      [1, 2, '→', 'moveRight'],
    ];

    // Use standardized 128x128 button size
    const buttonSize = DEFAULT_BOTTOM_SECTION_CONFIG.buttonSize;

    controlData.forEach(([row, col, symbol, action]) => {
      const button = this.scene.add
        .rectangle(0, 0, buttonSize, buttonSize, 0x1a1a2e, 1.0)
        .setStrokeStyle(2, 0x00ff88, 0.8)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });

      const label = this.scene.add
        .text(buttonSize / 2, buttonSize / 2, symbol, {
          fontFamily: FontLoader.createFontFamily('Asimovian'),
          fontSize: '32px',
          color: '#00ff88',
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 0.5);

      (button as any).controlAction = action;
      (button as any).controlRow = row;
      (button as any).controlCol = col;

      this.controlsContainer.add([button, label]);
      this.controlButtons.push(button);
      this.controlLabels.push(label);
    });

    this.rightColumn.add(this.controlsContainer);
  }

  private createBoosterElements(): void {
    this.boostersContainer = this.scene.add.container(0, 0);
    this.boostersBackground = this.scene.add.graphics();
    this.boostersBorder = this.scene.add.graphics();

    // add background & border first so slots render above
    this.boostersContainer.add([this.boostersBackground, this.boostersBorder]);

    // Use standardized 128x128 button size
    const buttonSize = DEFAULT_BOTTOM_SECTION_CONFIG.buttonSize;

    // Create 3x3 booster grid (keep slot rectangles in boosterSlots array)
    this.boosterSlots = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const slot = this.scene.add
          .rectangle(0, 0, buttonSize, buttonSize, 0x000000, 0.0)
          .setStrokeStyle(1, 0x00ff88, 0.25)
          .setOrigin(0, 0) as Phaser.GameObjects.Rectangle;

        this.boostersContainer.add(slot);
        this.boosterSlots.push(slot);
      }
    }

    this.rightColumn.add(this.boostersContainer);
  }

  private createLeaderboardElements(): void {
    this.leaderboardContainer = this.scene.add.container(0, 0);

    const leaderboardTitle = this.scene.add
      .text(0, 0, 'Leaderboard: Medium', {
        fontFamily: FontLoader.createFontFamily('Asimovian'),
        fontSize: '20px',
        color: '#00ff88',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5, 0);

    const leaderboardBg = this.scene.add.graphics();
    const leaderboardBorder = this.scene.add.graphics();

    this.leaderboardContainer.add([leaderboardBg, leaderboardBorder, leaderboardTitle]);
    this.rightColumn.add(this.leaderboardContainer);
  }

  protected updateLayout(): void {
    const { screenWidth, screenHeight } = this.layout;

    // Update bottom layout manager configuration
    this.bottomLayoutManager.updateConfig({
      screenWidth,
      screenHeight,
    });

    // We will position elements absolutely across the screen. Reset containers to origin.
    this.leftColumn.setPosition(0, 0);
    this.rightColumn.setPosition(0, 0);

    this.updateLeftColumnLayout();
    this.updateRightColumnLayout();

    Logger.log(`Layout updated: ${screenWidth}x${screenHeight}`);
  }

  private updateLeftColumnLayout(): void {
    const { screenWidth, screenHeight, padding } = this.layout;

    // Header full width
    const headerHeight = 80;
    const headerY = padding;
    const headerInnerY = headerY + 12;

    // Score label left aligned, score value right aligned (full width)
    this.scoreLabel.setPosition(padding + 12, headerInnerY);
    this.scoreValue.setPosition(screenWidth - padding - 12, headerInnerY);
    // hide match footer for now
    if (this.matchFooter) this.matchFooter.setVisible(false);

    // Calculate board metrics for 10x20 grid (standard Tetris dimensions)
    const cols = GAME_CONSTANTS.GRID_WIDTH;  // 10 columns
    const rows = GAME_CONSTANTS.GRID_HEIGHT; // 20 rows
    
    // Reserve 480 pixels at bottom for controls/UI elements (for 1920px height screens)
    const bottomSectionHeight = 480;
    const scoreSpacing = 20; // Space between score and board
    
    // Available height: total height minus header, bottom section, and spacing
    const availableHeight = screenHeight - headerY - headerHeight - scoreSpacing - bottomSectionHeight;
    
    // Calculate cell size based on available height to fit 20 rows
    const cellHByHeight = Math.floor(availableHeight / rows);
    
    // Calculate cell width to maintain square cells, but don't exceed reasonable screen width
    const maxBoardWidth = Math.floor(screenWidth * 0.8); // Max 80% of screen width
    const cellWByWidth = Math.floor(maxBoardWidth / cols);
    
    // Use smaller dimension to ensure board fits and cells remain square
    const cellSize = Math.min(cellWByWidth, cellHByHeight);
    const cellW = Math.max(20, cellSize); // Ensure minimum cell size of 20px
    const cellH = Math.max(20, cellSize); // Ensure minimum cell size of 20px
    
    // Calculate actual board dimensions
    const boardW = cellW * cols;  // 10 columns
    const boardH = cellH * rows;  // 20 rows

    // Center board horizontally on screen
    const boardX = Math.floor((screenWidth - boardW) / 2);
    
    // Position board directly below score display with proper spacing
    const boardY = headerY + headerHeight + scoreSpacing;

    // Update board metrics (boardX/Y are absolute screen coordinates)
    this.boardMetrics = {
      boardX,
      boardY,
      boardW,
      boardH,
      cellW,
      cellH,
      cols,
      rows,
      boardAreaY: headerHeight,
    };
    
    // Validate board metrics
    if (cellW <= 0 || cellH <= 0) {
      Logger.log(`ERROR: Invalid cell dimensions - cellW=${cellW}, cellH=${cellH}`);
    }
    if (boardW <= 0 || boardH <= 0) {
      Logger.log(`ERROR: Invalid board dimensions - boardW=${boardW}, boardH=${boardH}`);
    }
    if (boardX < 0 || boardY < 0) {
      Logger.log(`WARNING: Negative board position - boardX=${boardX}, boardY=${boardY}`);
    }

    // Position board container (use absolute coordinates)
    this.boardContainer.setPosition(boardX, boardY);

    // Draw board background / border
    this.boardBackground.clear();
    this.boardBackground.fillStyle(0x071021, 1);
    this.boardBackground.fillRect(0, 0, boardW, boardH);

    this.boardBorder.clear();
    this.boardBorder.lineStyle(2, 0x00ff88, 0.5);
    this.boardBorder.strokeRect(-2, -2, boardW + 4, boardH + 4);

    // Draw grid lines
    this.drawGridLines();
  }

  private updateRightColumnLayout(): void {
    // Reset right column container to origin for absolute positioning
    this.rightColumn.setPosition(0, 0);

    // New layout: Next Piece to the right of board, Controls scaled up on left
    this.updateNextPieceLayoutBesideBoard();
    this.updateControlsLayoutScaled();
    this.updateBoostersLayoutBottom();
    
    // Add visual borders around each group
    this.addGroupBordersNewLayout();

    // Hide leaderboard for now
    this.leaderboardContainer.setVisible(false);
  }

  /**
   * Updates the Next Piece section to be positioned beside the board
   */
  private updateNextPieceLayoutBesideBoard(): void {
    const { screenWidth, screenHeight, padding } = this.layout;
    const boardMetrics = this.boardMetrics;
    
    // Position Next Piece to the right of the board, under the score
    const nextPieceX = boardMetrics.boardX + boardMetrics.boardW + 20; // 20px gap from board
    const nextPieceY = boardMetrics.boardY; // Same Y as board top
    const nextPieceWidth = Math.min(200, screenWidth - nextPieceX - padding);
    const nextPieceHeight = 150;
    
    // Position Next Piece label
    this.nextLabel.setPosition(nextPieceX + nextPieceWidth / 2, nextPieceY);
    
    // Calculate next piece display size and position
    const labelHeight = 36;
    const displayPadding = 10;
    const availableHeight = nextPieceHeight - labelHeight - displayPadding;
    const nextSize = Math.min(nextPieceWidth - displayPadding, availableHeight);
    
    const nextX = nextPieceX + Math.floor((nextPieceWidth - nextSize) / 2);
    const nextY = nextPieceY + labelHeight + Math.floor((availableHeight - nextSize) / 2);

    this.nextMetrics = {
      nextX: nextX,
      nextY: nextY,
      nextW: nextSize,
      nextH: nextSize,
      cellW: nextSize / 4,
      cellH: nextSize / 4,
      // Global coordinates for sprite positioning
      globalNextX: nextX,
      globalNextY: nextY,
    };

    // Draw next piece background and border (absolute coords)
    this.nextBackground.clear();
    this.nextBackground.fillStyle(0x071021, 1);
    this.nextBackground.fillRect(nextX, nextY, nextSize, nextSize);

    this.nextBorder.clear();
    this.nextBorder.lineStyle(2, 0x00ff88, 0.5);
    this.nextBorder.strokeRect(nextX - 2, nextY - 2, nextSize + 4, nextSize + 4);

    this.drawNextGridLines(nextX, nextY, nextSize);
  }

  /**
   * Updates the Next Piece section layout using the layout manager (legacy)
   */
  private updateNextPieceLayout(area: LayoutArea): void {
    const labelY = area.y;
    const labelX = area.x + area.width / 2;
    
    // Position Next Piece label
    this.nextLabel.setPosition(labelX, labelY);
    
    // Calculate next piece display size and position
    const displayPadding = 20;
    const labelHeight = 36;
    const availableHeight = area.height - labelHeight - displayPadding;
    const maxDisplaySize = Math.min(area.width - displayPadding, availableHeight);
    
    const nextSize = Math.max(80, maxDisplaySize); // Minimum size of 80px
    const nextX = area.x + Math.floor((area.width - nextSize) / 2);
    const nextY = labelY + labelHeight + Math.floor((availableHeight - nextSize) / 2);

    this.nextMetrics = {
      nextX: nextX,
      nextY: nextY,
      nextW: nextSize,
      nextH: nextSize,
      cellW: nextSize / 4,
      cellH: nextSize / 4,
      // Global coordinates for sprite positioning
      globalNextX: nextX,
      globalNextY: nextY,
    };

    // Draw next piece background and border (absolute coords)
    this.nextBackground.clear();
    this.nextBackground.fillStyle(0x071021, 1);
    this.nextBackground.fillRect(nextX, nextY, nextSize, nextSize);

    this.nextBorder.clear();
    this.nextBorder.lineStyle(2, 0x00ff88, 0.25);
    this.nextBorder.strokeRect(nextX - 2, nextY - 2, nextSize + 4, nextSize + 4);

    this.drawNextGridLines(nextX, nextY, nextSize);
  }

  /**
   * Updates the Controls section with scaled-up buttons for easy playability
   */
  private updateControlsLayoutScaled(): void {
    const { screenWidth, screenHeight, padding } = this.layout;
    
    // Position controls on the left side of the bottom section
    const bottomSectionY = this.bottomLayoutManager.getBottomSectionY();
    const bottomSectionHeight = this.bottomLayoutManager.getConfig().bottomSectionHeight;
    
    const controlsX = padding;
    const controlsY = bottomSectionY + padding;
    const controlsWidth = Math.min(400, screenWidth * 0.4); // Max 40% of screen width
    const controlsHeight = bottomSectionHeight - (padding * 2);
    
    // Calculate button size to fit the height (2 rows)
    const buttonSpacing = 12;
    const buttonSize = Math.floor((controlsHeight - buttonSpacing) / 2);
    
    this.controlsContainer.setPosition(controlsX, controlsY);

    this.controlButtons.forEach((button, index) => {
      const row = (button as any).controlRow;
      const col = (button as any).controlCol;
      
      const buttonX = col * (buttonSize + buttonSpacing);
      const buttonY = row * (buttonSize + buttonSpacing);

      button.setSize(buttonSize, buttonSize);
      button.setPosition(buttonX, buttonY);

      const label = this.controlLabels[index];
      if (label) {
        label.setPosition(
          buttonX + buttonSize / 2,
          buttonY + buttonSize / 2
        );
        const fontSize = Math.max(20, Math.floor(buttonSize / 3));
        label.setFontSize(fontSize);
      }
    });
  }

  /**
   * Updates the Controls section layout using the layout manager (legacy)
   */
  private updateControlsLayoutWithManager(area: LayoutArea): void {
    const metrics = this.bottomLayoutManager.getControlButtonsMetrics();
    
    this.controlsContainer.setPosition(area.x, area.y);

    this.controlButtons.forEach((button, index) => {
      const row = (button as any).controlRow;
      const col = (button as any).controlCol;
      
      const buttonPos = this.bottomLayoutManager.calculateButtonPosition(
        { x: 0, y: 0, width: area.width, height: area.height }, // Local coordinates
        row,
        col,
        metrics.buttonSize,
        metrics.spacing
      );

      button.setSize(metrics.buttonSize, metrics.buttonSize);
      button.setPosition(buttonPos.x, buttonPos.y);

      const label = this.controlLabels[index];
      if (label) {
        label.setPosition(
          buttonPos.x + metrics.buttonSize / 2,
          buttonPos.y + metrics.buttonSize / 2
        );
        const fontSize = Math.max(16, Math.floor(metrics.buttonSize / 4));
        label.setFontSize(fontSize);
      }
    });
  }

  /**
   * Updates the Boosters section positioned at the bottom right
   */
  private updateBoostersLayoutBottom(): void {
    const { screenWidth, screenHeight, padding } = this.layout;
    
    // Position boosters on the right side of the bottom section
    const bottomSectionY = this.bottomLayoutManager.getBottomSectionY();
    const bottomSectionHeight = this.bottomLayoutManager.getConfig().bottomSectionHeight;
    
    const boostersWidth = 300;
    const boostersX = screenWidth - boostersWidth - padding;
    const boostersY = bottomSectionY + padding;
    const boostersHeight = bottomSectionHeight - (padding * 2);
    
    // Calculate button size for 3x3 grid
    const buttonSpacing = 8;
    const buttonSize = Math.floor((Math.min(boostersWidth, boostersHeight) - (buttonSpacing * 2)) / 3);
    
    this.boostersContainer.setPosition(boostersX, boostersY);

    // Draw background & border for the boosters area (local coords)
    if (this.boostersBackground && this.boostersBorder) {
      this.boostersBackground.clear();
      this.boostersBackground.fillStyle(0x071021, 1);
      this.boostersBackground.fillRect(0, 0, boostersWidth, boostersHeight);

      this.boostersBorder.clear();
      this.boostersBorder.lineStyle(2, 0x00ff88, 0.25);
      this.boostersBorder.strokeRect(-2, -2, boostersWidth + 4, boostersHeight + 4);
    }

    this.boosterSlots.forEach((slot, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      const buttonX = col * (buttonSize + buttonSpacing);
      const buttonY = row * (buttonSize + buttonSpacing);

      slot.setSize(buttonSize, buttonSize);
      slot.setPosition(buttonX, buttonY);
    });
  }

  /**
   * Updates the Boosters section layout using the layout manager (legacy)
   */
  private updateBoostersLayoutWithManager(area: LayoutArea): void {
    const metrics = this.bottomLayoutManager.getBoostersMetrics();
    
    this.boostersContainer.setPosition(area.x, area.y);

    // Draw background & border for the boosters area (local coords)
    if (this.boostersBackground && this.boostersBorder) {
      this.boostersBackground.clear();
      this.boostersBackground.fillStyle(0x071021, 1);
      this.boostersBackground.fillRect(0, 0, area.width, area.height);

      this.boostersBorder.clear();
      this.boostersBorder.lineStyle(2, 0x00ff88, 0.25);
      this.boostersBorder.strokeRect(-2, -2, area.width + 4, area.height + 4);
    }

    this.boosterSlots.forEach((slot, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      const buttonPos = this.bottomLayoutManager.calculateButtonPosition(
        { x: 0, y: 0, width: area.width, height: area.height }, // Local coordinates
        row,
        col,
        metrics.buttonSize,
        metrics.spacing
      );

      slot.setSize(metrics.buttonSize, metrics.buttonSize);
      slot.setPosition(buttonPos.x, buttonPos.y);
    });
  }

  // Store reference to group borders graphics
  private groupBorders: Phaser.GameObjects.Graphics | null = null;

  /**
   * Adds visual borders around each functional group
   */
  private addGroupBorders(nextPieceArea: LayoutArea, controlsArea: LayoutArea, boostersArea: LayoutArea): void {
    const borderStyle = this.bottomLayoutManager.createBorderStyle();
    
    // Create border graphics if they don't exist
    if (!this.groupBorders) {
      this.groupBorders = this.scene.add.graphics();
      this.container.add(this.groupBorders);
    }
    
    // Clear and redraw borders
    this.groupBorders.clear();
    this.groupBorders.lineStyle(borderStyle.thickness, borderStyle.color, borderStyle.alpha);
    
    // Draw borders around each group
    const areas = [nextPieceArea, controlsArea, boostersArea];
    areas.forEach(area => {
      const padding = 4;
      this.groupBorders!.strokeRoundedRect(
        area.x - padding,
        area.y - padding,
        area.width + (padding * 2),
        area.height + (padding * 2),
        borderStyle.cornerRadius
      );
    });
  }

  /**
   * Adds visual borders around the Next Piece group only
   */
  private addGroupBordersNewLayout(): void {
    const borderStyle = this.bottomLayoutManager.createBorderStyle();
    
    // Create border graphics if they don't exist
    if (!this.groupBorders) {
      this.groupBorders = this.scene.add.graphics();
      this.container.add(this.groupBorders);
    }
    
    // Clear and redraw borders
    this.groupBorders.clear();
    this.groupBorders.lineStyle(borderStyle.thickness, borderStyle.color, borderStyle.alpha);
    
    const { screenWidth, padding } = this.layout;
    const boardMetrics = this.boardMetrics;
    
    // Next Piece border (beside board) - ONLY border to be drawn
    const nextPieceX = boardMetrics.boardX + boardMetrics.boardW + 20;
    const nextPieceY = boardMetrics.boardY;
    const nextPieceWidth = Math.min(200, screenWidth - nextPieceX - padding);
    const nextPieceHeight = 150;
    
    this.groupBorders.strokeRoundedRect(
      nextPieceX - 4,
      nextPieceY - 4,
      nextPieceWidth + 8,
      nextPieceHeight + 8,
      borderStyle.cornerRadius
    );
    
    // Controls and Boosters borders removed - no longer drawn
  }

  private drawGridLines(): void {
    const { cellW, cellH, cols, rows } = this.boardMetrics;

    this.gridLines.clear();
    this.gridLines.lineStyle(1, 0x17f64b, 0.3);

    // Vertical lines
    for (let x = 0; x <= cols; x++) {
      const px = x * cellW;
      this.gridLines.moveTo(px, 0);
      this.gridLines.lineTo(px, rows * cellH);
    }

    // Horizontal lines
    for (let y = 0; y <= rows; y++) {
      const py = y * cellH;
      this.gridLines.moveTo(0, py);
      this.gridLines.lineTo(cols * cellW, py);
    }

    this.gridLines.strokePath();
  }

  private drawNextGridLines(x: number, y: number, size: number): void {
    this.nextGridLines.clear();
    this.nextGridLines.lineStyle(1, 0x17f64b, 0.3);

    const cellSize = size / 4;

    // Vertical lines
    for (let i = 0; i <= 4; i++) {
      const px = x + i * cellSize;
      this.nextGridLines.moveTo(px, y);
      this.nextGridLines.lineTo(px, y + size);
    }

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const py = y + i * cellSize;
      this.nextGridLines.moveTo(x, py);
      this.nextGridLines.lineTo(x + size, py);
    }

    this.nextGridLines.strokePath();
  }

  

  public setupInputHandlers(callbacks: GameUICallbacks = {}): void {
    // Create input handler with callbacks
    const inputCallbacks: InputCallbacks = {
      onMoveLeft: callbacks.onMoveLeft || (() => {}),
      onMoveRight: callbacks.onMoveRight || (() => {}),
      onMoveDown: callbacks.onMoveDown || (() => {}),
      onRotateClockwise: callbacks.onRotateClockwise || (() => {}),
      onRotateCounterClockwise: callbacks.onRotateCounterClockwise || (() => {}),
      onHardDrop: callbacks.onHardDrop || (() => {}),
      onPause: callbacks.onPause || (() => {}),
    };

    const touchCallbacks: TouchDragCallbacks = {
      onTap: (x, y) => {
        // Convert screen coordinates to bottom-left grid coordinates
        const gridPos = this.screenToGrid(x, y);
        if (gridPos) {
          // Pass bottom-left grid coordinates to the callback
          callbacks.onBoardTouch?.(gridPos.x, gridPos.y);
        }
      },
    };

    this.inputHandler = new InputHandler(this.scene, inputCallbacks, touchCallbacks);

    // Set up control button handlers
    this.controlButtons.forEach((button) => {
      button.on('pointerdown', () => {
        const action = (button as any).controlAction;
        this.handleControlAction(action, callbacks);
      });

      // Visual feedback
      button.on('pointerover', () => {
        button.setStrokeStyle(2, 0x00ff88, 1.0);
      });

      button.on('pointerout', () => {
        button.setStrokeStyle(2, 0x00ff88, 0.8);
      });
    });
  }

  private handleControlAction(action: string, callbacks: GameUICallbacks): void {
    switch (action) {
      case 'moveLeft':
        callbacks.onMoveLeft?.();
        break;
      case 'moveRight':
        callbacks.onMoveRight?.();
        break;
      case 'softDrop':
        callbacks.onMoveDown?.();
        break;
      case 'hardDrop':
        callbacks.onHardDrop?.();
        break;
      case 'rotateLeft':
        // Swapped: left button should rotate clockwise
        callbacks.onRotateClockwise?.();
        break;
      case 'rotateRight':
        // Swapped: right button should rotate counter-clockwise
        callbacks.onRotateCounterClockwise?.();
        break;
    }
  }

  private screenToGrid(screenX: number, screenY: number): { x: number; y: number } | null {
    // Convert screen coordinates to bottom-left grid coordinates
    // Returns grid coordinates where (0,0) is bottom-left, Y increases upward
    return this.coordinateConverter.screenToGrid(screenX, screenY, this.boardMetrics);
  }

  public updateScore(score: number): void {
    this.scoreValue.setText(score.toString());
  }

  public updateMatchFooter(text: string): void {
    if (this.matchFooter) {
      this.matchFooter.setText(text);
    }
  }

  public update(): void {
    if (this.inputHandler) {
      this.inputHandler.update();
    }
  }

  /**
   * Gets the bottom section layout manager for external access
   */
  public getBottomLayoutManager(): BottomSectionLayoutManager {
    return this.bottomLayoutManager;
  }

  public override destroy(): void {
    if (this.inputHandler) {
      this.inputHandler.destroy();
    }
    if (this.groupBorders) {
      this.groupBorders.destroy();
      this.groupBorders = null;
    }
    super.destroy();
  }
}
