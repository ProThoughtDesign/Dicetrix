import { GameModeConfig, GameMode, DieColor, SizeEffect, BoosterEffect } from '../types/game.js';

// Game mode configurations
export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  easy: {
    name: 'easy',
    diceTypes: [4, 6],
    colors: ['red', 'blue', 'green'],
    maxPieceSize: 5,
    blackDieChance: 0,
    fallSpeed: 1000,
    hasGameOver: true
  },
  medium: {
    name: 'medium',
    diceTypes: [4, 6, 8, 10],
    colors: ['red', 'blue', 'green', 'yellow'],
    maxPieceSize: 5,
    blackDieChance: 0,
    fallSpeed: 800,
    hasGameOver: true
  },
  hard: {
    name: 'hard',
    diceTypes: [4, 6, 8, 10, 12],
    colors: ['red', 'blue', 'green', 'yellow', 'purple'],
    maxPieceSize: 6,
    blackDieChance: 0.01,
    fallSpeed: 600,
    hasGameOver: true
  },
  expert: {
    name: 'expert',
    diceTypes: [4, 6, 8, 10, 12, 20],
    colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    maxPieceSize: 7,
    blackDieChance: 0.02,
    fallSpeed: 400,
    hasGameOver: true
  },
  zen: {
    name: 'zen',
    diceTypes: [4, 6, 8, 10],
    colors: ['red', 'blue', 'green', 'yellow'],
    maxPieceSize: 5,
    blackDieChance: 0,
    fallSpeed: 1200,
    hasGameOver: false
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
