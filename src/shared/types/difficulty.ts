import { GameMode, GridPosition } from './game.js';

/**
 * Configuration interface for difficulty modes
 */
export interface DifficultyModeConfig {
  id: GameMode;
  fallSpeed: number;
  scoreMultiplier: number;
  allowGravity: boolean;
  
  // Dimensional Constraints
  maxPieceWidth: number;
  maxPieceHeight: number;
  maxDicePerPiece: number;
  
  // Dice Configuration
  diceTypes: number[];
  allowBlackDice: boolean;
  uniformDiceRule: boolean; // Zen mode only
  
  // Booster System
  boosterChance: number; // 0.0 to 1.0
}

/**
 * Enhanced Die interface with new properties for difficulty system
 */
export interface EnhancedDie {
  id: string;
  sides: number;
  number: number;
  color: string;
  relativePos: GridPosition;
  
  // New properties for difficulty system
  isBlack?: boolean; // Black Die flag
  isWild?: boolean; // Wild matching capability
  boosterType?: BoosterType; // Visual effect type
  glowColor?: string; // Booster glow color
}

/**
 * Booster effect types for visual enhancements
 */
export enum BoosterType {
  NONE = 'none',
  RED_GLOW = 'red',
  BLUE_GLOW = 'blue',
  YELLOW_GLOW = 'yellow',
  GREEN_GLOW = 'green',
  PURPLE_GLOW = 'purple',
  ORANGE_GLOW = 'orange',
  MAGENTA_GLOW = 'magenta',
  CYAN_GLOW = 'cyan',
  TEAL_GLOW = 'teal'
}

/**
 * Constraints for piece generation
 */
export interface PieceGenerationConstraints {
  maxWidth: number;
  maxHeight: number;
  maxDiceCount: number;
  allowedDiceTypes: number[];
  allowBlackDice: boolean;
  uniformDiceRule: boolean;
  boosterChance: number;
}

/**
 * Multi-die piece structure for procedural generation
 */
export interface MultiDiePiece {
  dice: EnhancedDie[];
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}
