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
  timestamp?: number; // Client-side timestamp when score was achieved
}

export interface ScoreSubmissionResponse {
  success: boolean;
  newHighScore: boolean;
  leaderboardPosition?: number;
  difficultyRank?: number; // Rank within difficulty category
  isNewDifficultyRecord?: boolean; // New record for this difficulty
  message?: string;
}

// Leaderboard
export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  level: number;
  mode: GameMode;
  timestamp: number; // When score was achieved
  submissionTime: number; // When submitted to server
  breakdown: ScoreBreakdown;
  rank?: number; // Position in leaderboard
  isCurrentUser?: boolean; // Highlight user's entry
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number | undefined;
  totalPlayers: number;
  resetInfo?: {
    nextReset: number; // Timestamp of next reset
    resetInterval: string; // 'daily' | 'weekly' | 'monthly' | 'custom'
    currentPeriod: string; // Human-readable current period
  } | undefined;
  historical?: LeaderboardEntry[] | undefined; // Previous period data
}

// Enhanced leaderboard endpoints
export interface AllLeaderboardsResponse {
  leaderboards: Record<GameMode, LeaderboardResponse>;
  userStats?: {
    totalGamesPlayed: number;
    bestDifficulty: GameMode;
    overallRank: number;
  };
}

export interface LeaderboardResetRequest {
  difficulties?: GameMode[]; // Specific difficulties to reset
  createPost?: boolean; // Whether to create announcement post
}

export interface LeaderboardResetResponse {
  success: boolean;
  resetId: string;
  timestamp: number;
  period: string;
  difficulties: GameMode[];
  totalPlayersAffected: number;
  message?: string;
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

// Reddit integration
export interface RedditScoreSubmissionRequest {
  score: number;
  level: number;
  mode: GameMode;
  breakdown: ScoreBreakdown;
  timestamp: number;
  createPost: boolean; // User choice to post to Reddit
}

export interface RedditScoreSubmissionResponse {
  success: boolean;
  leaderboardPosition?: number;
  redditPostUrl?: string;
  message: string;
}

export interface LeaderboardWidgetResponse {
  topPlayers: Record<GameMode, LeaderboardEntry[]>;
  lastUpdated: number;
  nextReset: number;
}

// Reddit post interfaces
export interface RedditPost {
  id: string;
  url: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface NotificationResult {
  userId: string;
  username: string;
  success: boolean;
  message?: string;
  error?: string;
}

export interface Achievement {
  type: 'top_player' | 'new_record' | 'leaderboard_winner';
  mode: GameMode;
  rank: number;
  score: number;
  period: string;
}

export interface LeaderboardWidgetData {
  topPlayers: Record<GameMode, LeaderboardEntry[]>;
  lastUpdated: number;
  nextReset: number;
}

// Configuration management
export interface LeaderboardConfigRequest {
  resetInterval?: 'daily' | 'weekly' | 'monthly' | 'custom';
  customResetHours?: number;
  maxHistoricalPeriods?: number;
  topPlayersCount?: number;
  enableAutoPosting?: boolean;
  enableNotifications?: boolean;
}

export interface LeaderboardConfigResponse {
  resetInterval: 'daily' | 'weekly' | 'monthly' | 'custom';
  customResetHours?: number | undefined;
  maxHistoricalPeriods: number;
  topPlayersCount: number;
  enableAutoPosting: boolean;
  enableNotifications: boolean;
}

export interface RedditConfigRequest {
  enableAutoPosting?: boolean;
  enableUserNotifications?: boolean;
  postTemplate?: string;
  widgetUpdateInterval?: number;
}

export interface RedditConfigResponse {
  enableAutoPosting: boolean;
  enableUserNotifications: boolean;
  postTemplate: string;
  widgetUpdateInterval: number;
}

export interface SystemStatusResponse {
  leaderboard: {
    isActive: boolean;
    nextReset: number;
    resetInterval: string;
    totalPlayers: Record<GameMode, number>;
  };
  reddit: {
    isConnected: boolean;
    lastPostTime?: number | undefined;
    lastWidgetUpdate?: number | undefined;
  };
  scheduler: {
    isActive: boolean;
    nextScheduledTask?: number | undefined;
  };
  uptime: number;
  version: string;
}

export interface ConfigValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  preview?: {
    nextResetTime: number;
    affectedPlayers: number;
    estimatedImpact: string;
  } | undefined;
}

// Administrative interface types
export interface SystemDiagnosticsResponse {
  timestamp: number;
  redis: {
    status: string;
    keyCount: number;
    connectionLatency: number;
  };
  leaderboards: Record<GameMode, {
    totalPlayers: number;
    topScore: number;
    lastActivity: number;
  }>;
  scheduler: {
    isActive: boolean;
    nextReset: number;
    systemReady: boolean;
  };
  configuration: {
    leaderboard: LeaderboardConfigResponse;
    reddit: RedditConfigResponse;
  };
  performance: {
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    uptime: number;
    nodeVersion: string;
  };
  health: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
  };
}

export interface ResetPreviewResponse {
  scheduledTime: number;
  affectedDifficulties: GameMode[];
  estimatedPlayersAffected: number;
  topPlayersPreview: Record<GameMode, { username: string; score: number }[]>;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface SystemHealthCheckResponse {
  timestamp: number;
  checks: {
    component: string;
    status: 'healthy' | 'warning' | 'unhealthy';
    message: string;
  }[];
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  repairsPerformed: string[];
}

// Error response
export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}
