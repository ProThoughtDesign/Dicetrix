/**
 * Utility class for converting between bottom-left grid coordinates and top-left array indices.
 * 
 * Grid coordinates use bottom-left origin (0,0) where Y increases upward.
 * Array indices use top-left origin where Y increases downward.
 */
export class CoordinateConverter {
  constructor(private gridHeight: number) {}

  /**
   * Convert grid Y coordinate (bottom-left origin) to array index (top-left origin)
   * @param gridY Y coordinate in grid system (0 = bottom, height-1 = top)
   * @returns Array index (0 = top row, height-1 = bottom row)
   */
  gridToArrayY(gridY: number): number {
    return this.gridHeight - 1 - gridY;
  }

  /**
   * Convert array index (top-left origin) to grid Y coordinate (bottom-left origin)
   * @param arrayY Array index (0 = top row, height-1 = bottom row)
   * @returns Y coordinate in grid system (0 = bottom, height-1 = top)
   */
  arrayToGridY(arrayY: number): number {
    return this.gridHeight - 1 - arrayY;
  }

  /**
   * Convert grid coordinates to screen pixel coordinates
   * @param gridX X coordinate in grid system
   * @param gridY Y coordinate in grid system (0 = bottom)
   * @param boardMetrics Board rendering metrics
   * @returns Screen pixel coordinates
   */
  gridToScreen(
    gridX: number, 
    gridY: number, 
    boardMetrics: { boardX: number; boardY: number; cellW: number; cellH: number; rows: number }
  ): { x: number; y: number } {
    return {
      x: boardMetrics.boardX + gridX * boardMetrics.cellW,
      y: boardMetrics.boardY + (boardMetrics.rows - 1 - gridY) * boardMetrics.cellH
    };
  }

  /**
   * Convert screen pixel coordinates to grid coordinates
   * @param screenX Screen X coordinate
   * @param screenY Screen Y coordinate
   * @param boardMetrics Board rendering metrics
   * @returns Grid coordinates or null if outside valid area
   */
  screenToGrid(
    screenX: number, 
    screenY: number, 
    boardMetrics: { boardX: number; boardY: number; cellW: number; cellH: number; rows: number; cols: number }
  ): { x: number; y: number } | null {
    const boardRelativeX = screenX - boardMetrics.boardX;
    const boardRelativeY = screenY - boardMetrics.boardY;
    
    const gridX = Math.floor(boardRelativeX / boardMetrics.cellW);
    const screenGridY = Math.floor(boardRelativeY / boardMetrics.cellH);
    const gridY = boardMetrics.rows - 1 - screenGridY;
    
    if (gridX >= 0 && gridX < boardMetrics.cols && gridY >= 0 && gridY < boardMetrics.rows) {
      return { x: gridX, y: gridY };
    }
    return null;
  }
}
