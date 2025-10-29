import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';
import { MatchGroup, GridPosition } from '../logic/types';
import { EmitterManager } from './EmitterManager';
import { PerformanceMonitor } from './PerformanceMonitor';

/**
 * Configuration for match explosion effects
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export interface MatchEffectConfig {
  baseParticleCount: number;
  colorMapping: Record<string, string>; // dice color to particle color
  explosionRadius: number;
  duration: number;
  scaleWithMatchSize: boolean;
  maxParticlesPerMatch: number;
  simultaneousMatchDelay: number; // Delay between simultaneous match effects
}

/**
 * Default configuration for match effects optimized for performance
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
const DEFAULT_MATCH_CONFIG: MatchEffectConfig = {
  baseParticleCount: 8,
  colorMapping: {
    red: 'red',
    blue: 'blue', 
    green: 'green',
    yellow: 'yellow',
    purple: 'purple',
    orange: 'orange',
    teal: 'teal',
    gray: 'gray',
    white: 'white',
    black: 'black'
  },
  explosionRadius: 25,
  duration: 400,
  scaleWithMatchSize: true,
  maxParticlesPerMatch: 20,
  simultaneousMatchDelay: 50
};

/**
 * Manages particle effects for dice match explosions
 * Handles color-coded explosions, match size scaling, and integration with game events
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export class MatchEffectManager {
  private scene: Phaser.Scene;
  private emitterManager: EmitterManager;
  private performanceMonitor: PerformanceMonitor;
  private config: MatchEffectConfig;
  private boardMetrics: any; // Board positioning and sizing information

  constructor(
    scene: Phaser.Scene, 
    emitterManager: EmitterManager, 
    performanceMonitor: PerformanceMonitor,
    config?: Partial<MatchEffectConfig>
  ) {
    this.scene = scene;
    this.emitterManager = emitterManager;
    this.performanceMonitor = performanceMonitor;
    this.config = { ...DEFAULT_MATCH_CONFIG, ...config };
    
    Logger.log('MatchEffectManager: Initialized');
  }

  /**
   * Set board metrics for position calculations
   * Requirements: 2.1, 2.4
   */
  public setBoardMetrics(boardMetrics: any): void {
    this.boardMetrics = boardMetrics;
    Logger.log('MatchEffectManager: Board metrics updated');
  }

  /**
   * Create explosion effects for multiple match groups
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  public createMatchExplosions(matches: MatchGroup[]): void {
    if (!matches || matches.length === 0) {
      return;
    }

    Logger.log(`MatchEffectManager: Creating explosions for ${matches.length} match groups`);

    // Process each match group with slight delays for visual clarity
    matches.forEach((match, index) => {
      const delay = index * this.config.simultaneousMatchDelay;
      
      this.scene.time.delayedCall(delay, () => {
        this.createSingleMatchExplosion(match);
      });
    });
  }

  /**
   * Create explosion effect for a single match group
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  private createSingleMatchExplosion(match: MatchGroup): void {
    try {
      if (!match.positions || match.positions.length === 0) {
        Logger.log('MatchEffectManager: No positions in match group, skipping explosion');
        return;
      }

      // Determine the primary color for the explosion
      const primaryColor = this.getPrimaryMatchColor(match);
      
      // Calculate particle count based on match size
      const particleCount = this.getParticleCountForMatch(match.size);
      
      // Check if we can create particles within performance limits
      const totalParticles = particleCount * match.positions.length;
      if (!this.performanceMonitor.canCreateParticles(totalParticles)) {
        Logger.log('MatchEffectManager: Cannot create match explosion - particle limit reached');
        return;
      }

      // Create explosion at each matched position
      match.positions.forEach((position, index) => {
        const worldPos = this.gridToWorldPosition(position);
        if (worldPos) {
          // Slight delay between explosions in the same match for visual effect
          const positionDelay = index * 25;
          
          this.scene.time.delayedCall(positionDelay, () => {
            this.createExplosionAtPosition(worldPos, primaryColor, particleCount);
          });
        }
      });

      Logger.log(`MatchEffectManager: Created explosion for match of size ${match.size} with color ${primaryColor}`);
      
    } catch (error) {
      Logger.log(`MatchEffectManager: Error creating match explosion - ${error}`);
    }
  }

  /**
   * Create explosion effect at a specific world position
   * Requirements: 2.1, 2.2, 2.3
   */
  private createExplosionAtPosition(
    position: Phaser.Math.Vector2, 
    color: string, 
    particleCount: number
  ): void {
    try {
      // Use the EmitterManager to create the actual particle effect
      const emitter = this.emitterManager.createMatchExplosion(position, color, particleCount);
      
      if (emitter) {
        Logger.log(`MatchEffectManager: Created explosion at (${position.x}, ${position.y}) with ${particleCount} particles`);
      }
      
    } catch (error) {
      Logger.log(`MatchEffectManager: Error creating explosion at position - ${error}`);
    }
  }

  /**
   * Determine the primary color for a match group based on color distribution
   * Requirements: 2.2
   */
  private getPrimaryMatchColor(match: MatchGroup): string {
    if (!match.colors || Object.keys(match.colors).length === 0) {
      // Fallback to white if no color information available
      return 'white';
    }

    // Find the color with the highest count
    let primaryColor = 'white';
    let maxCount = 0;

    for (const [color, count] of Object.entries(match.colors)) {
      if (count > maxCount) {
        maxCount = count;
        primaryColor = color;
      }
    }

    // Map to particle color using configuration
    return this.config.colorMapping[primaryColor] || primaryColor;
  }

  /**
   * Calculate particle count based on match size with scaling
   * Requirements: 2.3
   */
  private getParticleCountForMatch(matchSize: number): number {
    if (!this.config.scaleWithMatchSize) {
      return this.config.baseParticleCount;
    }

    // Scale particles based on match size: base + (size - 3) * 2
    // Minimum match size is typically 3, so we scale from there
    const scaledCount = this.config.baseParticleCount + Math.max(0, (matchSize - 3) * 2);
    
    // Cap at maximum to prevent performance issues
    return Math.min(scaledCount, this.config.maxParticlesPerMatch);
  }

  /**
   * Convert grid position to world coordinates for particle placement
   * Requirements: 2.1, 2.4
   */
  private gridToWorldPosition(gridPos: GridPosition): Phaser.Math.Vector2 | null {
    if (!this.boardMetrics) {
      Logger.log('MatchEffectManager: No board metrics available for position conversion');
      return null;
    }

    try {
      // Use the same coordinate conversion logic as CoordinateConverter.gridToScreen
      // Grid coordinates use bottom-left origin, screen coordinates use top-left origin
      const worldX = this.boardMetrics.boardX + (gridPos.x * this.boardMetrics.cellW) + (this.boardMetrics.cellW / 2);
      const worldY = this.boardMetrics.boardY + ((this.boardMetrics.rows - 1 - gridPos.y) * this.boardMetrics.cellH) + (this.boardMetrics.cellH / 2);
      
      Logger.log(`MatchEffectManager: Converting grid(${gridPos.x}, ${gridPos.y}) to world(${worldX}, ${worldY})`);
      
      return new Phaser.Math.Vector2(worldX, worldY);
      
    } catch (error) {
      Logger.log(`MatchEffectManager: Error converting grid position to world coordinates - ${error}`);
      return null;
    }
  }

  /**
   * Update configuration for match effects
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  public updateConfig(newConfig: Partial<MatchEffectConfig>): void {
    this.config = { ...this.config, ...newConfig };
    Logger.log('MatchEffectManager: Configuration updated');
  }

  /**
   * Get current configuration
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  public getConfig(): MatchEffectConfig {
    return { ...this.config };
  }

  /**
   * Destroy the match effect manager and clean up resources
   * Requirements: 2.1
   */
  public destroy(): void {
    try {
      Logger.log('MatchEffectManager: Destroying match effect manager');
      // No specific cleanup needed as EmitterManager handles emitter cleanup
      Logger.log('MatchEffectManager: Destroyed successfully');
      
    } catch (error) {
      Logger.log(`MatchEffectManager: Destruction error - ${error}`);
    }
  }
}
