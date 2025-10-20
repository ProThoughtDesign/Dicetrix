import { Die } from '../models/Die.js';

/**
 * Optimized match detection system using efficient algorithms
 * Implements flood-fill with early termination and spatial indexing
 */
export class MatchDetectionOptimizer {
  private static instance: MatchDetectionOptimizer;
  
  // Spatial indexing for faster lookups
  private spatialIndex: Map<string, Die> = new Map();
  private gridWidth: number = 10;
  private gridHeight: number = 20;
  
  // Reusable arrays to avoid garbage collection
  private visitedCells = new Set<string>();
  private matchQueue: GridPosition[] = [];
  private currentMatch: GridPosition[] = [];
  
  // Performance tracking
  private matchDetectionTime = 0;
  private matchDetectionCount = 0;
  
  private constructor() {}
  
  public static getInstance(): MatchDetectionOptimizer {
    if (!MatchDetectionOptimizer.instance) {
      MatchDetectionOptimizer.instance = new MatchDetectionOptimizer();
    }
    return MatchDetectionOptimizer.instance;
  }
  
  /**
   * Update spatial index with current grid state
   */
  public updateSpatialIndex(grid: (Die | null)[][]): void {
    const startTime = performance.now();
    
    this.spatialIndex.clear();
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const die = grid[y]?.[x];
        if (die) {
          const key = this.getPositionKey(x, y);
          this.spatialIndex.set(key, die);
        }
      }
    }
    
    const endTime = performance.now();
    this.matchDetectionTime += endTime - startTime;
  }
  
  /**
   * Detect all matches in the grid using optimized flood-fill algorithm
   */
  public detectMatches(grid: (Die | null)[][]): MatchGroup[] {
    const startTime = performance.now();
    this.matchDetectionCount++;
    
    // Update spatial index
    this.updateSpatialIndex(grid);
    
    const matches: MatchGroup[] = [];
    this.visitedCells.clear();
    
    // Iterate through grid to find match starting points
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const positionKey = this.getPositionKey(x, y);
        
        // Skip if already visited or empty
        if (this.visitedCells.has(positionKey)) continue;
        
        const die = this.spatialIndex.get(positionKey);
        if (!die) continue;
        
        // Find match group starting from this position
        const matchGroup = this.findMatchGroup(x, y, die);
        
        if (matchGroup && matchGroup.positions.length >= 3) {
          matches.push(matchGroup);
        }
      }
    }
    
    const endTime = performance.now();
    this.matchDetectionTime += endTime - startTime;
    
    return matches;
  }
  
  /**
   * Find match group using optimized flood-fill algorithm
   */
  private findMatchGroup(startX: number, startY: number, startDie: Die): MatchGroup | null {
    this.currentMatch = [];
    this.matchQueue = [];
    
    const matchValue = startDie.getMatchValue();
    const colors = new Map<string, number>();
    
    // Initialize with starting position
    this.matchQueue.push({ x: startX, y: startY });
    
    while (this.matchQueue.length > 0) {
      const pos = this.matchQueue.shift()!;
      const positionKey = this.getPositionKey(pos.x, pos.y);
      
      // Skip if already visited or out of bounds
      if (this.visitedCells.has(positionKey) || 
          pos.x < 0 || pos.x >= this.gridWidth || 
          pos.y < 0 || pos.y >= this.gridHeight) {
        continue;
      }
      
      const die = this.spatialIndex.get(positionKey);
      if (!die) continue;
      
      // Check if die matches
      if (!this.canMatch(die, startDie, matchValue)) continue;
      
      // Mark as visited and add to match
      this.visitedCells.add(positionKey);
      this.currentMatch.push(pos);
      
      // Track colors for booster detection
      const colorCount = colors.get(die.color) || 0;
      colors.set(die.color, colorCount + 1);
      
      // Add adjacent positions to queue (4-directional)
      this.addAdjacentPositions(pos.x, pos.y);
    }
    
    // Return match group if valid size
    if (this.currentMatch.length >= 3) {
      return {
        positions: [...this.currentMatch],
        matchedNumber: matchValue === -1 ? 0 : matchValue, // Wild dice special case
        size: this.currentMatch.length,
        colors,
        dice: this.currentMatch.map(pos => this.spatialIndex.get(this.getPositionKey(pos.x, pos.y))!)
      };
    }
    
    return null;
  }
  
  /**
   * Add adjacent positions to the match queue
   */
  private addAdjacentPositions(x: number, y: number): void {
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }  // Left
    ];
    
    for (const dir of directions) {
      this.matchQueue.push({
        x: x + dir.x,
        y: y + dir.y
      });
    }
  }
  
  /**
   * Check if two dice can match
   */
  private canMatch(die1: Die, die2: Die, targetValue: number): boolean {
    // Wild dice match with anything
    if (die1.isWild || die2.isWild) {
      return true;
    }
    
    // Regular matching
    return die1.getMatchValue() === targetValue;
  }
  
  /**
   * Get position key for spatial indexing
   */
  private getPositionKey(x: number, y: number): string {
    return `${x},${y}`;
  }
  
  /**
   * Detect matches in a specific region (for cascade optimization)
   */
  public detectMatchesInRegion(
    grid: (Die | null)[][],
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): MatchGroup[] {
    const startTime = performance.now();
    
    // Update only the relevant part of spatial index
    this.updateRegionalSpatialIndex(grid, minX, minY, maxX, maxY);
    
    const matches: MatchGroup[] = [];
    this.visitedCells.clear();
    
    // Only check the specified region
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const positionKey = this.getPositionKey(x, y);
        
        if (this.visitedCells.has(positionKey)) continue;
        
        const die = this.spatialIndex.get(positionKey);
        if (!die) continue;
        
        const matchGroup = this.findMatchGroup(x, y, die);
        
        if (matchGroup && matchGroup.positions.length >= 3) {
          matches.push(matchGroup);
        }
      }
    }
    
    const endTime = performance.now();
    this.matchDetectionTime += endTime - startTime;
    
    return matches;
  }
  
  /**
   * Update spatial index for a specific region
   */
  private updateRegionalSpatialIndex(
    grid: (Die | null)[][],
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): void {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const die = grid[y]?.[x];
        const key = this.getPositionKey(x, y);
        
        if (die) {
          this.spatialIndex.set(key, die);
        } else {
          this.spatialIndex.delete(key);
        }
      }
    }
  }
  
  /**
   * Get performance statistics
   */
  public getPerformanceStats(): MatchDetectionStats {
    const avgTime = this.matchDetectionCount > 0 ? 
      this.matchDetectionTime / this.matchDetectionCount : 0;
    
    return {
      totalDetections: this.matchDetectionCount,
      totalTime: this.matchDetectionTime,
      averageTime: avgTime,
      spatialIndexSize: this.spatialIndex.size
    };
  }
  
  /**
   * Reset performance tracking
   */
  public resetPerformanceStats(): void {
    this.matchDetectionTime = 0;
    this.matchDetectionCount = 0;
  }
  
  /**
   * Clear all cached data
   */
  public clear(): void {
    this.spatialIndex.clear();
    this.visitedCells.clear();
    this.matchQueue = [];
    this.currentMatch = [];
  }
}

/**
 * Grid position interface
 */
export interface GridPosition {
  x: number;
  y: number;
}

/**
 * Match group interface
 */
export interface MatchGroup {
  positions: GridPosition[];
  matchedNumber: number;
  size: number;
  colors: Map<string, number>;
  dice: Die[];
}

/**
 * Match detection performance statistics
 */
export interface MatchDetectionStats {
  totalDetections: number;
  totalTime: number;
  averageTime: number;
  spatialIndexSize: number;
}
