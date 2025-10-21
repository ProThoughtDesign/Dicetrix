import { DisplayMode, Dimensions, Rectangle, UIZoneConfig } from './ResponsiveUISystem.js';

export type UIElementType = 'gameGrid' | 'score' | 'nextPiece' | 'boosters' | 'statistics';

/**
 * UIZoneManager - Manages screen real estate allocation for different UI elements
 * Handles dynamic zone positioning based on display mode and screen dimensions
 */
export class UIZoneManager {
  private readonly GRID_WIDTH = 10;
  private readonly GRID_HEIGHT = 20;

  /**
   * Allocate UI zones based on screen dimensions and display mode
   */
  public allocateZones(dimensions: Dimensions, mode: DisplayMode): UIZoneConfig {
    const { width, height } = dimensions;
    
    switch (mode) {
      case 'mobile':
        return this.allocateMobileZones(width, height);
      case 'desktop':
        return this.allocateDesktopZones(width, height);
      case 'fullscreen':
        return this.allocateFullscreenZones(width, height);
    }
  }

  /**
   * Allocate zones for mobile layout
   */
  private allocateMobileZones(screenWidth: number, screenHeight: number): UIZoneConfig {
    const cellSize = 24; // Mobile cell size
    const gridPixelWidth = this.GRID_WIDTH * cellSize;
    const gridPixelHeight = this.GRID_HEIGHT * cellSize;
    
    // Game grid positioned 10px from left, centered vertically
    const gridX = 10;
    const gridY = (screenHeight - gridPixelHeight) / 2;
    
    // Right panel takes remaining space
    const rightPanelX = gridX + gridPixelWidth + 20;
    const rightPanelWidth = screenWidth - rightPanelX - 10;
    
    // Score area at top of grid
    const scoreY = gridY - 30;
    const scoreHeight = 25;
    
    // Next piece in right panel
    const nextPieceY = gridY + 20;
    const nextPieceSize = 80;

    return {
      gameGrid: {
        x: gridX,
        y: gridY,
        width: gridPixelWidth,
        height: gridPixelHeight
      },
      scoreArea: {
        x: gridX,
        y: scoreY,
        width: gridPixelWidth,
        height: scoreHeight
      },
      nextPiece: {
        x: rightPanelX,
        y: nextPieceY,
        width: Math.min(nextPieceSize, rightPanelWidth),
        height: nextPieceSize
      }
    };
  }

  /**
   * Allocate zones for desktop layout
   */
  private allocateDesktopZones(screenWidth: number, screenHeight: number): UIZoneConfig {
    const cellSize = 32; // Desktop cell size
    const gridPixelWidth = this.GRID_WIDTH * cellSize;
    const gridPixelHeight = this.GRID_HEIGHT * cellSize;
    
    // Game grid centered both horizontally and vertically
    const gridX = (screenWidth - gridPixelWidth) / 2;
    const gridY = (screenHeight - gridPixelHeight) / 2;
    
    // Right panel
    const rightPanelWidth = 200;
    const rightPanelX = gridX + gridPixelWidth + 20;
    
    // Score area above grid
    const scoreY = gridY - 30;
    const scoreHeight = 25;
    
    // Next piece in right panel
    const nextPieceY = gridY + 20;
    const nextPieceSize = 100;
    
    // Booster area below next piece
    const boosterY = nextPieceY + nextPieceSize + 20;
    const boosterHeight = 120;

    return {
      gameGrid: {
        x: gridX,
        y: gridY,
        width: gridPixelWidth,
        height: gridPixelHeight
      },
      scoreArea: {
        x: gridX,
        y: scoreY,
        width: gridPixelWidth,
        height: scoreHeight
      },
      nextPiece: {
        x: rightPanelX,
        y: nextPieceY,
        width: nextPieceSize,
        height: nextPieceSize
      },
      boosterArea: {
        x: rightPanelX,
        y: boosterY,
        width: rightPanelWidth - 20,
        height: boosterHeight
      }
    };
  }

  /**
   * Allocate zones for fullscreen layout
   */
  private allocateFullscreenZones(screenWidth: number, screenHeight: number): UIZoneConfig {
    // Calculate cell size for fullscreen (will be between 32-128)
    const availableWidth = screenWidth - 600; // Leave space for side panels
    const availableHeight = screenHeight - 300; // Leave space for top/bottom
    const maxCellByWidth = Math.floor(availableWidth / this.GRID_WIDTH);
    const maxCellByHeight = Math.floor(availableHeight / this.GRID_HEIGHT);
    const cellSize = Math.max(32, Math.min(128, Math.min(maxCellByWidth, maxCellByHeight)));
    
    const gridPixelWidth = this.GRID_WIDTH * cellSize;
    const gridPixelHeight = this.GRID_HEIGHT * cellSize;
    
    // Game grid centered
    const gridX = (screenWidth - gridPixelWidth) / 2;
    const gridY = (screenHeight - gridPixelHeight) / 2;
    
    // Panel dimensions
    const rightPanelWidth = 300;
    const leftPanelWidth = 200;
    
    // Panel positions
    const rightPanelX = gridX + gridPixelWidth + 30;
    const leftPanelX = gridX - leftPanelWidth - 30;
    
    // Score area above grid
    const scoreY = gridY - 40;
    const scoreHeight = 30;
    
    // Next piece in right panel
    const nextPieceY = gridY + 20;
    const nextPieceSize = 120;
    
    // Booster area below next piece
    const boosterY = nextPieceY + nextPieceSize + 30;
    const boosterHeight = 150;
    
    // Statistics in left panel
    const statisticsY = gridY + 20;
    const statisticsHeight = 200;

    return {
      gameGrid: {
        x: gridX,
        y: gridY,
        width: gridPixelWidth,
        height: gridPixelHeight
      },
      scoreArea: {
        x: gridX,
        y: scoreY,
        width: gridPixelWidth,
        height: scoreHeight
      },
      nextPiece: {
        x: rightPanelX,
        y: nextPieceY,
        width: nextPieceSize,
        height: nextPieceSize
      },
      boosterArea: {
        x: rightPanelX,
        y: boosterY,
        width: rightPanelWidth - 30,
        height: boosterHeight
      },
      statisticsArea: {
        x: leftPanelX,
        y: statisticsY,
        width: leftPanelWidth - 20,
        height: statisticsHeight
      }
    };
  }
}
