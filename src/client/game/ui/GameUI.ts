import * as Phaser from 'phaser';
import { BaseUI } from './BaseUI';
import { InputHandler, InputCallbacks, TouchDragCallbacks } from './InputHandler';
import { CoordinateConverter } from '../../../shared/utils/CoordinateConverter';
import { GAME_CONSTANTS } from '../../../shared/constants/GameConstants';
import Logger from '../../utils/Logger';

export interface GameUICallbacks extends InputCallbacks {
  onBoardTouch?: (gridX: number, gridY: number) => void;
}

export class GameUI extends BaseUI {
  private inputHandler: InputHandler;
  private coordinateConverter: CoordinateConverter;

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
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0, 0);

    this.scoreValue = this.scene.add
      .text(0, 0, '0', {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0);

    this.matchFooter = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Arial',
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
        fontFamily: 'Arial Black',
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

    controlData.forEach(([row, col, symbol, action]) => {
      const button = this.scene.add
        .rectangle(0, 0, 80, 80, 0x1a1a2e, 1.0)
        .setStrokeStyle(2, 0x00ff88, 0.8)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });

      const label = this.scene.add
        .text(40, 40, symbol, {
          fontFamily: 'Arial Black',
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

    // Create 3x3 booster grid (keep slot rectangles in boosterSlots array)
    this.boosterSlots = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const slot = this.scene.add
          .rectangle(0, 0, 64, 64, 0x000000, 0.0)
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
        fontFamily: 'Arial Black',
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
  const { screenWidth } = this.layout;

    // We will position elements absolutely across the screen. Reset containers to origin.
    this.leftColumn.setPosition(0, 0);
    this.rightColumn.setPosition(0, 0);

    this.updateLeftColumnLayout();
    this.updateRightColumnLayout();

    Logger.log(`Layout updated: ${screenWidth}x${this.layout.screenHeight}`);
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

    // Calculate board metrics for 8x16 grid
    const cols = GAME_CONSTANTS.GRID_WIDTH;  // 8 columns
    const rows = GAME_CONSTANTS.GRID_HEIGHT; // 16 rows
    
    // Available space for board (60% of screen width, remaining height after header)
    const availableWidth = Math.floor(screenWidth * 0.6);
    const availableHeight = screenHeight - headerY - headerHeight - padding * 3;
    
    // Calculate cell size to fit 8x16 grid in available space
    const cellWByWidth = Math.floor(availableWidth / cols);
    const cellHByHeight = Math.floor(availableHeight / rows);
    
    // Use smaller dimension to ensure grid fits within available space
    const cellSize = Math.min(cellWByWidth, cellHByHeight);
    const cellW = cellSize;
    const cellH = cellSize;
    
    // Calculate actual board dimensions
    const boardW = cellW * cols;  // 8 columns
    const boardH = cellH * rows;  // 16 rows

    // Position board on the left side, below header, centered in available space
    const boardX = padding + Math.floor((availableWidth - boardW) / 2);
    const boardY = headerY + headerHeight + 12 + Math.floor((availableHeight - boardH) / 2);

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
    const { screenWidth, padding } = this.layout;

    const elementSpacing = 20;
    // Right column sits to the right of the board
    const board = this.boardMetrics;
    const rightX = board.boardX + board.boardW + padding;
    const rightWidth = Math.max(0, screenWidth - rightX - padding);

    let currentY = board.boardY; // start aligned with top of board

    // Position right column container to the right of the board so internal coords are local
    this.rightColumn.setPosition(rightX, 0);

    // Next piece label centered in right column (local coords)
    this.nextLabel.setPosition(rightWidth / 2, currentY);
    currentY += 36;

    // Next piece box (4x4 grid) - size related to board cell size
    const nextSize = Math.min(rightWidth * 0.9, board.cellW * 4, 160);
    const nextX = Math.floor((rightWidth - nextSize) / 2);

    this.nextMetrics = {
      nextX,
      nextY: currentY,
      nextW: nextSize,
      nextH: nextSize,
      cellW: nextSize / 4,
      cellH: nextSize / 4,
      // Add global coordinates for sprite positioning
      globalNextX: rightX + nextX,
      globalNextY: currentY,
    };

    // Draw next piece background and border (local coords)
    this.nextBackground.clear();
    this.nextBackground.fillStyle(0x071021, 1);
    this.nextBackground.fillRect(nextX, currentY, nextSize, nextSize);

    this.nextBorder.clear();
    this.nextBorder.lineStyle(2, 0x00ff88, 0.25);
    this.nextBorder.strokeRect(nextX - 2, currentY - 2, nextSize + 4, nextSize + 4);

    this.drawNextGridLines(nextX, currentY, nextSize);
    currentY += nextSize + elementSpacing;

    // Controls: 3x2 grid (scaled up 10%)
    this.updateControlsLayout(currentY, 0, rightWidth);
    const controlSizeScaled = Math.round(96 * 1.1);
    currentY += (controlSizeScaled * 2) + 8 + elementSpacing;

    // Boosters: 3x3 grid of 96x96 (rendered inside a bordered box)
    this.updateBoostersLayout(currentY, 0, rightWidth);
    currentY += (96 * 3) + 2 * 6 + elementSpacing;

    // Hide leaderboard for now
    this.leaderboardContainer.setVisible(false);
  }

  // New signature: position controls within right column area specified by startX and width
  private updateControlsLayout(startY: number, startX: number, columnWidth: number): void {
    const controlSize = Math.round(96 * 1.1); // scaled up 10%
    const controlGap = 8;
    const controlsWidth = 3 * controlSize + 2 * controlGap;
    const controlsX = Math.floor(startX + (columnWidth - controlsWidth) / 2);

    this.controlsContainer.setPosition(controlsX, startY);

    this.controlButtons.forEach((button, index) => {
      const row = (button as any).controlRow;
      const col = (button as any).controlCol;
  const x = col * (controlSize + controlGap);
  const y = row * (controlSize + controlGap);

  button.setSize(controlSize, controlSize);
  button.setPosition(x, y);

      const label = this.controlLabels[index];
      if (label) {
        label.setPosition(x + controlSize / 2, y + controlSize / 2);
        const fontSize = Math.max(16, Math.floor(controlSize / 2.5));
        label.setFontSize(fontSize);
      }
    });
  }

  private updateBoostersLayout(startY: number, startX: number, columnWidth: number): void {
    const boosterSize = 96; // fixed per spec
    const boosterGap = 6;
    const boostersWidth = 3 * boosterSize + 2 * boosterGap;
    const boostersX = Math.floor(startX + (columnWidth - boostersWidth) / 2);

    this.boostersContainer.setPosition(boostersX, startY);

    // Draw background & border for the boosters area (local coords)
    if (this.boostersBackground && this.boostersBorder) {
      this.boostersBackground.clear();
      this.boostersBackground.fillStyle(0x071021, 1);
      this.boostersBackground.fillRect(0, 0, boostersWidth, 3 * boosterSize + 2 * boosterGap);

      this.boostersBorder.clear();
      this.boostersBorder.lineStyle(2, 0x00ff88, 0.25);
      this.boostersBorder.strokeRect(-2, -2, boostersWidth + 4, 3 * boosterSize + 2 * boosterGap + 4);
    }

    this.boosterSlots.forEach((slot, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = col * (boosterSize + boosterGap);
      const y = row * (boosterSize + boosterGap);

      slot.setSize(boosterSize, boosterSize);
      slot.setPosition(x, y);
    });
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

  public override destroy(): void {
    if (this.inputHandler) {
      this.inputHandler.destroy();
    }
    super.destroy();
  }
}
