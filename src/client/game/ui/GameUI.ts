import * as Phaser from 'phaser';
import { BaseUI } from './BaseUI';
import { InputHandler, InputCallbacks, TouchDragCallbacks } from './InputHandler';
import { CoordinateConverter } from '../../../shared/utils/CoordinateConverter';
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
  private leaderboardContainer: Phaser.GameObjects.Container; // Desktop only

  // Control buttons
  private controlButtons: Phaser.GameObjects.Rectangle[] = [];
  private controlLabels: Phaser.GameObjects.Text[] = [];

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
    cols: 10,
    rows: 20,
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
  } = {
    nextX: 0,
    nextY: 0,
    nextW: 0,
    nextH: 0,
    cellW: 0,
    cellH: 0,
  };

  constructor(scene: Phaser.Scene, callbacks: GameUICallbacks = {}) {
    super(scene);

    // Initialize coordinate converter for 20-row grid
    this.coordinateConverter = new CoordinateConverter(20);

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

    // Create 3x3 booster grid
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const slot = this.scene.add
          .rectangle(0, 0, 64, 64, 0x000000, 0.0)
          .setStrokeStyle(1, 0x00ff88, 0.25)
          .setOrigin(0, 0);

        this.boostersContainer.add(slot);
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
    const { padding, leftColumnWidth, rightColumnWidth, isMobile, screenWidth, screenHeight } =
      this.layout;

    // Position main columns
    this.leftColumn.setPosition(padding, padding);
    this.rightColumn.setPosition(padding * 2 + leftColumnWidth, padding);

    this.updateLeftColumnLayout();
    this.updateRightColumnLayout();

    Logger.log(`Layout updated: ${isMobile ? 'Mobile' : 'Desktop'} ${screenWidth}x${screenHeight}`);
  }

  private updateLeftColumnLayout(): void {
    const { leftColumnWidth, screenHeight, padding, isMobile } = this.layout;

    // Score positioning
    const scorePadding = 12;
    this.scoreLabel.setPosition(scorePadding, 8);
    this.scoreValue.setPosition(leftColumnWidth - scorePadding, 8);
  // Position match footer below score
  this.matchFooter.setPosition(scorePadding, 40);

    // Board calculations
    const scoreAreaHeight = 48;
    const bottomPadding = padding; // Add bottom padding to prevent dice from going below screen
    const availableHeight = screenHeight - padding * 2 - scoreAreaHeight - bottomPadding;
    const cols = 10;
    const rows = 20;

    // Calculate cell size to fit in available space
    const maxCellW = Math.floor(leftColumnWidth / cols);
    const maxCellH = Math.floor(availableHeight / rows);
    const cellSize = Math.min(maxCellW, maxCellH);

    const cellW = cellSize;
    const cellH = cellSize;
    const boardW = cellW * cols;
    const boardH = cellH * rows;

    // Center board horizontally in left column
    const boardX = Math.floor((leftColumnWidth - boardW) / 2);
    const boardY = scoreAreaHeight;

    // Ensure the board doesn't extend beyond the screen bottom
    const maxBoardY = screenHeight - padding - boardH - bottomPadding;
    const finalBoardY = Math.min(boardY, maxBoardY);

    // Update board metrics
    this.boardMetrics = {
      boardX: padding + boardX,
      boardY: padding + finalBoardY,
      boardW,
      boardH,
      cellW,
      cellH,
      cols,
      rows,
      boardAreaY: scoreAreaHeight,
    };

    // Position board container
    this.boardContainer.setPosition(boardX, finalBoardY);

    // Draw board background
    this.boardBackground.clear();
    this.boardBackground.fillStyle(0x071021, 1);
    this.boardBackground.fillRect(0, 0, boardW, boardH);

    // Draw board border
    this.boardBorder.clear();
    this.boardBorder.lineStyle(2, 0x00ff88, 0.5);
    this.boardBorder.strokeRect(-2, -2, boardW + 4, boardH + 4);

    // Draw grid lines
    this.drawGridLines();
  }

  private updateRightColumnLayout(): void {
    const { rightColumnWidth, isMobile, screenHeight, padding } = this.layout;

    let currentY = 0;
    const elementSpacing = 20;

    // Next piece section
    this.nextLabel.setPosition(rightColumnWidth / 2, currentY);
    currentY += 35;

    // Next piece box (4x4 grid)
    const nextSize = Math.min(rightColumnWidth * 0.8, 160);
    const nextX = Math.floor((rightColumnWidth - nextSize) / 2);

    this.nextMetrics = {
      nextX: padding * 2 + this.layout.leftColumnWidth + nextX,
      nextY: padding + currentY,
      nextW: nextSize,
      nextH: nextSize,
      cellW: nextSize / 4,
      cellH: nextSize / 4,
    };

    // Draw next piece background
    this.nextBackground.clear();
    this.nextBackground.fillStyle(0x071021, 1);
    this.nextBackground.fillRect(nextX, currentY, nextSize, nextSize);

    // Draw next piece border
    this.nextBorder.clear();
    this.nextBorder.lineStyle(2, 0x00ff88, 0.25);
    this.nextBorder.strokeRect(nextX - 2, currentY - 2, nextSize + 4, nextSize + 4);

    this.drawNextGridLines(nextX, currentY, nextSize);
    currentY += nextSize + elementSpacing;

    // Controls section
    this.updateControlsLayout(currentY, rightColumnWidth);
    currentY += this.getControlsHeight() + elementSpacing;

    // Boosters section
    this.updateBoostersLayout(currentY, rightColumnWidth);
    currentY += this.getBoostersHeight() + elementSpacing;

    // Leaderboard section (desktop only)
    if (!isMobile) {
      this.updateLeaderboardLayout(currentY, rightColumnWidth, screenHeight - padding - currentY);
    } else {
      this.leaderboardContainer.setVisible(false);
    }
  }

  private updateControlsLayout(startY: number, columnWidth: number): void {
    const controlSize = Math.min(columnWidth / 3.5, 80);
    const controlGap = 8;
    const controlsWidth = 3 * controlSize + 2 * controlGap;
    const controlsX = Math.floor((columnWidth - controlsWidth) / 2);

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

  private updateBoostersLayout(startY: number, columnWidth: number): void {
    const boosterSize = Math.min(columnWidth / 4, 64);
    const boosterGap = 6;
    const boostersWidth = 3 * boosterSize + 2 * boosterGap;
    const boostersX = Math.floor((columnWidth - boostersWidth) / 2);

    this.boostersContainer.setPosition(boostersX, startY);

    this.boostersContainer.each((slot: any, index: number) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = col * (boosterSize + boosterGap);
      const y = row * (boosterSize + boosterGap);

      slot.setSize(boosterSize, boosterSize);
      slot.setPosition(x, y);
    });
  }

  private updateLeaderboardLayout(
    startY: number,
    columnWidth: number,
    availableHeight: number
  ): void {
    this.leaderboardContainer.setVisible(true);
    this.leaderboardContainer.setPosition(0, startY);

    const leaderboardHeight = Math.max(150, availableHeight - 20);
    const leaderboardWidth = columnWidth;

    // Get title and graphics from container
    const title = this.leaderboardContainer.getAt(2) as Phaser.GameObjects.Text;
    const bg = this.leaderboardContainer.getAt(0) as Phaser.GameObjects.Graphics;
    const border = this.leaderboardContainer.getAt(1) as Phaser.GameObjects.Graphics;

    title.setPosition(leaderboardWidth / 2, 10);

    bg.clear();
    bg.fillStyle(0x071021, 1);
    bg.fillRect(0, 30, leaderboardWidth, leaderboardHeight - 30);

    border.clear();
    border.lineStyle(2, 0x00ff88, 0.25);
    border.strokeRect(-2, 28, leaderboardWidth + 4, leaderboardHeight - 26);
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

  private getControlsHeight(): number {
    const controlSize = Math.min(this.layout.rightColumnWidth / 3.5, 80);
    return 2 * controlSize + 8; // 2 rows + gap
  }

  private getBoostersHeight(): number {
    const boosterSize = Math.min(this.layout.rightColumnWidth / 4, 64);
    return 3 * boosterSize + 2 * 6; // 3 rows + gaps
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
