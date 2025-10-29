import { DieColor } from '../../../shared/types/game';

export type DieId = string;

export interface Die {
  id: DieId;
  sides: number;
  number: number; // face value
  color: DieColor;
  isWild?: boolean;
  isBlack?: boolean;
  boosterType?: import('../../../shared/types/difficulty.js').BoosterType;
  glowColor?: string;
}

export interface GridPosition {
  x: number;
  y: number;
}

export type Cell = Die | null;

export interface GridState {
  width: number;
  height: number;
  cells: Cell[][]; // [y][x]
}

export interface MatchGroup {
  positions: GridPosition[];
  size: number;
  matchedNumber?: number;
  colors?: Record<string, number>;
}
