// Basic game types for Dicetrix

export type GameMode = 'easy' | 'medium' | 'hard' | 'expert' | 'zen';

export type DieColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan';

export type TetrominoShape = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z' | 'PLUS';

export interface GridPosition {
  x: number;
  y: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  chainMultiplier: number;
  ultimateComboMultiplier: number;
  boosterModifiers: number;
  totalScore: number;
}

export interface GameState {
  score: number;
  level: number;
  mode: GameMode;
  isGameOver: boolean;
}
