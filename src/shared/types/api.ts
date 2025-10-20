// API types for client-server communication

import { GameMode, ScoreBreakdown } from './game';

// Game initialization
export interface GameInitRequest {
  mode?: GameMode;
}

export interface GameInitResponse {
  postId: string;
  score: number;
  level: number;
  gameState: string;
  mode: GameMode;
}

// Score submission
export interface ScoreSubmissionRequest {
  score: number;
  level: number;
  mode: GameMode;
  breakdown: ScoreBreakdown;
}

export interface ScoreSubmissionResponse {
  success: boolean;
  newHighScore: boolean;
  leaderboardPosition?: number;
  message?: string;
}

// Leaderboard
export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  level: number;
  mode: GameMode;
  timestamp: number;
  breakdown: ScoreBreakdown;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number;
  totalPlayers: number;
}

// Score sharing
export interface ShareScoreRequest {
  score: number;
  level: number;
  mode: GameMode;
  breakdown: ScoreBreakdown;
}

export interface ShareScoreResponse {
  success: boolean;
  postUrl?: string;
  message?: string;
}

// Error response
export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}
