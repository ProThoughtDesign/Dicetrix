// Core game types for Dicetrix

export type DieColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan';
export type GameMode = 'easy' | 'medium' | 'hard' | 'expert' | 'zen';
export type TetrominoShape = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z' | 'PLUS';

export interface GridPosition {
  x: number;
  y: number;
}

export interface Die {
  sides: number;        // 4, 6, 8, 10, 12, 20
  number: number;       // 1 to max for sides
  color: DieColor;
  isWild: boolean;      // matches any number
  isBlack: boolean;     // debuff die (Hard/Expert only)
}

// MatchGroup is now a class in src/client/game/models/MatchGroup.ts

export interface SizeEffect {
  type: 'standard' | 'line_clear' | 'spawn_wild' | 'area_clear' | 'grid_clear';
  description: string;
}

export interface BoosterEffect {
  type: 'score_multiplier' | 'slow_fall' | 'wild_chance' | 'extra_time' | 'chain_bonus' | 'size_boost' | 'gravity_delay';
  value: number;
  duration: number; // milliseconds or piece count
}

export interface GameModeConfig {
  name: GameMode;
  diceTypes: number[];      // Available die sides
  colors: DieColor[];       // Available colors
  maxPieceSize: number;     // Max dice per piece
  blackDieChance: number;   // Probability of black dice
  fallSpeed: number;        // Base falling speed (ms)
  hasGameOver: boolean;     // Whether game can end
  // Progression-specific properties
  wildDieChance: number;    // Probability of wild dice spawning
  boosterDuration: number;  // Multiplier for booster effect duration
  scoreMultiplier: number;  // Score multiplier for this mode
  levelUpThreshold: number; // Points needed to level up
  maxLevel: number;         // Maximum level achievable in this mode
}

export interface GameState {
  score: number;
  level: number;
  mode: GameMode;
  chainMultiplier: number;
  isGameOver: boolean;
  activeBoosters: ColorBooster[];
}

export interface ColorBooster {
  color: DieColor;
  effect: BoosterEffect;
  remainingDuration: number;
  isActive: boolean;
}

export interface ScoreBreakdown {
  baseScore: number;
  chainMultiplier: number;
  ultimateComboMultiplier: number;
  boosterModifiers: number;
  totalScore: number;
}

export interface GridCell {
  die: Die | null;
  x: number;
  y: number;
}
