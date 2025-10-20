import { GameModeConfig, GameMode, DieColor, SizeEffect, BoosterEffect } from '../types/game.js';

// Game mode configurations with progression-specific rules
export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  easy: {
    name: 'easy',
    diceTypes: [4, 6],
    colors: ['red', 'blue', 'green'],
    maxPieceSize: 5,
    blackDieChance: 0,
    fallSpeed: 1000,
    hasGameOver: true,
    // Progression-specific rules
    wildDieChance: 0.05,        // 5% chance for wild dice
    boosterDuration: 1.2,       // 20% longer booster effects
    scoreMultiplier: 1.0,       // Base score multiplier
    levelUpThreshold: 5000,     // Points needed for level up
    maxLevel: 10                // Maximum level in this mode
  },
  medium: {
    name: 'medium',
    diceTypes: [4, 6, 8, 10],
    colors: ['red', 'blue', 'green', 'yellow'],
    maxPieceSize: 5,
    blackDieChance: 0,
    fallSpeed: 800,
    hasGameOver: true,
    // Progression-specific rules
    wildDieChance: 0.04,        // 4% chance for wild dice
    boosterDuration: 1.0,       // Normal booster duration
    scoreMultiplier: 1.2,       // 20% score bonus
    levelUpThreshold: 7500,     // Points needed for level up
    maxLevel: 15                // Maximum level in this mode
  },
  hard: {
    name: 'hard',
    diceTypes: [4, 6, 8, 10, 12],
    colors: ['red', 'blue', 'green', 'yellow', 'purple'],
    maxPieceSize: 6,
    blackDieChance: 0.01,
    fallSpeed: 600,
    hasGameOver: true,
    // Progression-specific rules
    wildDieChance: 0.03,        // 3% chance for wild dice
    boosterDuration: 0.8,       // 20% shorter booster effects
    scoreMultiplier: 1.5,       // 50% score bonus
    levelUpThreshold: 10000,    // Points needed for level up
    maxLevel: 20                // Maximum level in this mode
  },
  expert: {
    name: 'expert',
    diceTypes: [4, 6, 8, 10, 12, 20],
    colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    maxPieceSize: 7,
    blackDieChance: 0.02,
    fallSpeed: 400,
    hasGameOver: true,
    // Progression-specific rules
    wildDieChance: 0.02,        // 2% chance for wild dice
    boosterDuration: 0.6,       // 40% shorter booster effects
    scoreMultiplier: 2.0,       // 100% score bonus
    levelUpThreshold: 15000,    // Points needed for level up
    maxLevel: 25                // Maximum level in this mode
  },
  zen: {
    name: 'zen',
    diceTypes: [4, 6, 8, 10],
    colors: ['red', 'blue', 'green', 'yellow'],
    maxPieceSize: 5,
    blackDieChance: 0,
    fallSpeed: 1200,
    hasGameOver: false,
    // Progression-specific rules (zen mode is relaxed)
    wildDieChance: 0.08,        // 8% chance for wild dice (higher for relaxed play)
    boosterDuration: 1.5,       // 50% longer booster effects
    scoreMultiplier: 0.8,       // 20% less score (since no game over)
    levelUpThreshold: 3000,     // Lower threshold for frequent progression
    maxLevel: 999               // Unlimited levels
  }
};

// Size effects configuration
export const SIZE_EFFECTS: Record<number, SizeEffect> = {
  3: { type: 'standard', description: 'Clear matched dice' },
  4: { type: 'line_clear', description: 'Clear row or column' },
  5: { type: 'spawn_wild', description: 'Spawn wild die' },
  7: { type: 'area_clear', description: 'Clear 7x7 area' },
  9: { type: 'grid_clear', description: 'Clear entire grid' }
};

// Color booster effects
export const COLOR_BOOSTERS: Record<DieColor, BoosterEffect> = {
  red: { type: 'score_multiplier', value: 1.5, duration: 10000 },
  blue: { type: 'slow_fall', value: 0.5, duration: 15000 },
  green: { type: 'wild_chance', value: 0.1, duration: 3 }, // 3 pieces
  yellow: { type: 'extra_time', value: 5000, duration: 1 },
  purple: { type: 'chain_bonus', value: 2, duration: 8000 },
  orange: { type: 'size_boost', value: 1, duration: 5000 },
  cyan: { type: 'gravity_delay', value: 2000, duration: 12000 }
};

// Tetromino piece shapes
export const PIECE_SHAPES: Record<string, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  L: [[1, 0, 0], [1, 1, 1]],
  J: [[0, 0, 1], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  // Custom shapes for higher difficulties
  PLUS: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
  CROSS: [[1, 0, 1], [0, 1, 0], [1, 0, 1]]
};

// Game constants
export const GAME_CONSTANTS = {
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  MAX_CASCADES: 10,
  ULTIMATE_COMBO_MULTIPLIER: 5,
  TARGET_FRAME_TIME: 60 // milliseconds
} as const;
