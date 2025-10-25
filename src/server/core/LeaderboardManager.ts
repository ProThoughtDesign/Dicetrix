import { redis } from '@devvit/web/server';
import { GameMode, ScoreBreakdown } from '../../shared/types/game';
import { LeaderboardEntry } from '../../shared/types/api';
import Logger from '../utils/Logger';

export interface ScoreSubmission {
  userId: string;
  username: string;
  score: number;
  level: number;
  mode: GameMode;
  breakdown: ScoreBreakdown;
  timestamp: number; // When score was achieved
  submissionTime: number; // When submitted to server
  postId?: string; // Reddit post context
  subredditName?: string;
}

export interface LeaderboardResult {
  success: boolean;
  isNewHighScore: boolean;
  isNewDifficultyRecord: boolean;
  difficultyRank?: number | undefined;
  leaderboardPosition?: number | undefined;
  message?: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  userRank?: number | undefined;
  resetInfo?: {
    nextReset: number;
    resetInterval: string;
    currentPeriod: string;
  };
  historical?: LeaderboardEntry[] | undefined;
}

export interface LeaderboardOptions {
  limit?: number; // Number of entries to return (default: 10)
  includeHistorical?: boolean; // Include previous period data
  userId?: string | undefined; // For user-specific data like rank
}

export interface LeaderboardConfig {
  resetInterval: 'daily' | 'weekly' | 'monthly' | 'custom';
  customResetHours?: number | undefined; // For custom intervals
  maxHistoricalPeriods: number;
  topPlayersCount: number;
  enableAutoPosting: boolean;
  enableNotifications: boolean;
}

export interface ResetInterval {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  customHours?: number | undefined;
}

export interface ResetResult {
  resetId: string;
  timestamp: number;
  period: string;
  difficulties: GameMode[];
  topPlayers: Record<GameMode, LeaderboardEntry[]>;
  totalPlayersAffected: number;
  redditPostCreated: boolean;
}

export interface ResetSchedule {
  nextReset: number;
  interval: string;
  currentPeriod: string;
}

/**
 * LeaderboardManager handles all leaderboard operations including:
 * - Score submission and ranking by difficulty
 * - Top score tracking per player per difficulty
 * - Redis operations for difficulty-specific storage
 * - Reset scheduling and historical data management
 */
export class LeaderboardManager {
  private config: LeaderboardConfig;
  
  constructor(config?: Partial<LeaderboardConfig>) {
    this.config = {
      resetInterval: 'daily',
      maxHistoricalPeriods: 3,
      topPlayersCount: 5,
      enableAutoPosting: true,
      enableNotifications: true,
      ...config
    };
  }

  /**
   * Submit a score to the appropriate difficulty leaderboard
   * Implements requirements 3.1, 3.2, 3.3
   */
  async submitScore(submission: ScoreSubmission): Promise<LeaderboardResult> {
    try {
      Logger.log(`LeaderboardManager: Submitting score ${submission.score} for user ${submission.username} in ${submission.mode} mode`);

      // Validate submission data
      if (!this.validateSubmission(submission)) {
        throw new Error('Invalid score submission data');
      }

      // Get user's previous best score for this mode
      const userBestKey = `dicetrix:user:${submission.userId}:best:${submission.mode}`;
      const previousBest = await redis.get(userBestKey);
      const previousBestScore = previousBest ? JSON.parse(previousBest).score : 0;
      const isNewHighScore = submission.score > previousBestScore;
      const isNewDifficultyRecord = isNewHighScore;

      // Update user's best score if this is better
      if (isNewHighScore) {
        await redis.set(userBestKey, JSON.stringify({
          score: submission.score,
          level: submission.level,
          breakdown: submission.breakdown,
          timestamp: submission.timestamp,
          submissionTime: submission.submissionTime
        }));
        Logger.log(`LeaderboardManager: New high score for user ${submission.username} in ${submission.mode}: ${submission.score}`);
      }

      // Add to difficulty-specific leaderboard (sorted set with score as the sort key)
      const leaderboardKey = `dicetrix:leaderboard:${submission.mode}`;
      const leaderboardEntry: LeaderboardEntry = {
        userId: submission.userId,
        username: submission.username,
        score: submission.score,
        level: submission.level,
        mode: submission.mode,
        timestamp: submission.timestamp,
        submissionTime: submission.submissionTime,
        breakdown: submission.breakdown
      };
      
      await redis.zAdd(leaderboardKey, {
        member: JSON.stringify(leaderboardEntry),
        score: submission.score
      });

      // Update user statistics
      await this.updateUserStats(submission);

      // Get user's current leaderboard position
      const { difficultyRank, leaderboardPosition } = await this.getUserRank(submission.userId, submission.mode, submission.score);

      Logger.log(`LeaderboardManager: Score submitted successfully. Rank: ${difficultyRank}, Position: ${leaderboardPosition}`);

      return {
        success: true,
        isNewHighScore,
        isNewDifficultyRecord,
        difficultyRank,
        leaderboardPosition,
        message: isNewHighScore ? 'New personal best!' : 'Score submitted successfully'
      };
    } catch (error) {
      Logger.log(`LeaderboardManager: Error submitting score: ${String(error)}`);
      return {
        success: false,
        isNewHighScore: false,
        isNewDifficultyRecord: false,
        message: `Failed to submit score: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get leaderboard data for a specific difficulty mode
   * Implements requirements 3.1, 3.2, 3.3
   */
  async getLeaderboard(mode: GameMode, options: LeaderboardOptions = {}): Promise<LeaderboardData> {
    try {
      const { limit = 10, includeHistorical = false, userId } = options;
      
      Logger.log(`LeaderboardManager: Getting leaderboard for ${mode} mode, limit: ${limit}`);

      const leaderboardKey = `dicetrix:leaderboard:${mode}`;
      
      // Get top scores (Redis zRange with reverse returns highest scores first)
      const topScores = await redis.zRange(leaderboardKey, 0, limit - 1, { 
        reverse: true,
        by: 'rank'
      });
      
      // Parse leaderboard entries and add rank information
      const entries: LeaderboardEntry[] = [];
      for (let i = 0; i < topScores.length; i++) {
        const scoreEntry = topScores[i];
        try {
          if (typeof scoreEntry === 'string') {
            const entryData = JSON.parse(scoreEntry);
            entryData.rank = i + 1;
            entryData.isCurrentUser = userId ? entryData.userId === userId : false;
            entries.push(entryData);
          }
        } catch (parseError) {
          Logger.log(`LeaderboardManager: Failed to parse leaderboard entry: ${String(parseError)}`);
        }
      }

      // Get total number of players for this mode
      const totalPlayers = await redis.zCard(leaderboardKey);

      // Get reset information
      const resetInfo = {
        nextReset: this.getNextResetTime(this.config.resetInterval),
        resetInterval: this.config.resetInterval,
        currentPeriod: this.getCurrentPeriodString(this.config.resetInterval)
      };

      // Get historical data if requested
      let historical: LeaderboardEntry[] | undefined;
      if (includeHistorical) {
        historical = await this.getHistoricalLeaderboard(mode, this.getPreviousPeriodKey(this.config.resetInterval));
      }

      // Get user's rank if userId provided
      let userRank: number | undefined;
      if (userId) {
        const rankResult = await this.getUserRank(userId, mode);
        userRank = rankResult.difficultyRank;
      }

      Logger.log(`LeaderboardManager: Retrieved leaderboard for ${mode} with ${entries.length} entries`);

      return {
        entries,
        totalPlayers,
        userRank,
        resetInfo,
        historical
      };
    } catch (error) {
      Logger.log(`LeaderboardManager: Error getting leaderboard: ${String(error)}`);
      throw new Error(`Failed to get leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's rank in a specific difficulty leaderboard
   * Implements requirements 3.2, 3.3
   */
  async getUserRank(userId: string, mode: GameMode, specificScore?: number): Promise<{ difficultyRank?: number | undefined; leaderboardPosition?: number | undefined }> {
    try {
      const leaderboardKey = `dicetrix:leaderboard:${mode}`;
      
      // If specific score provided, find rank for that score
      if (specificScore !== undefined) {
        const allEntries = await redis.zRange(leaderboardKey, 0, -1, { 
          reverse: true, 
          by: 'rank'
        });
        
        for (let i = 0; i < allEntries.length; i++) {
          const entryData = allEntries[i];
          if (typeof entryData === 'string') {
            try {
              const entry = JSON.parse(entryData);
              if (entry.userId === userId && entry.score === specificScore) {
                const rank = i + 1;
                return { difficultyRank: rank, leaderboardPosition: rank };
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      } else {
        // Find user's best score rank
        const userBestKey = `dicetrix:user:${userId}:best:${mode}`;
        const userBest = await redis.get(userBestKey);
        
        if (userBest) {
          const userBestData = JSON.parse(userBest);
          const rankResult = await this.getUserRank(userId, mode, userBestData.score);
          return rankResult;
        }
      }
      
      return { difficultyRank: undefined, leaderboardPosition: undefined };
    } catch (error) {
      Logger.log(`LeaderboardManager: Error getting user rank: ${String(error)}`);
      return { difficultyRank: undefined, leaderboardPosition: undefined };
    }
  }

  /**
   * Schedule a leaderboard reset with configurable intervals
   * Implements requirement 4.1, 4.2
   */
  async scheduleReset(interval: ResetInterval): Promise<void> {
    try {
      Logger.log(`LeaderboardManager: Scheduling reset with interval: ${interval.type}`);
      
      // Update configuration
      this.config.resetInterval = interval.type;
      if (interval.customHours) {
        this.config.customResetHours = interval.customHours;
      }
      
      // Store configuration in Redis
      const configKey = 'dicetrix:leaderboard:config';
      await redis.set(configKey, JSON.stringify(this.config));
      
      // Store next reset time
      const nextResetTime = this.getNextResetTime(interval.type);
      const scheduleKey = 'dicetrix:leaderboard:schedule';
      await redis.set(scheduleKey, JSON.stringify({
        nextReset: nextResetTime,
        interval: interval.type,
        customHours: interval.customHours
      }));
      
      Logger.log(`LeaderboardManager: Reset scheduled for ${new Date(nextResetTime).toISOString()}`);
    } catch (error) {
      Logger.log(`LeaderboardManager: Error scheduling reset: ${String(error)}`);
      throw new Error(`Failed to schedule reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute leaderboard reset for specified modes
   * Implements requirements 4.1, 4.3, 4.4, 4.5
   */
  async executeReset(modes?: GameMode[]): Promise<ResetResult> {
    try {
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      const modesToReset = modes || validModes;
      
      Logger.log(`LeaderboardManager: Executing reset for modes: ${modesToReset.join(', ')}`);
      
      // Validate modes
      for (const mode of modesToReset) {
        if (!validModes.includes(mode)) {
          throw new Error(`Invalid game mode: ${mode}`);
        }
      }

      const resetId = `reset_${Date.now()}`;
      const resetTimestamp = Date.now();
      const currentPeriod = this.getCurrentPeriodString(this.config.resetInterval);
      let totalPlayersAffected = 0;
      const topPlayers: Record<GameMode, LeaderboardEntry[]> = {} as Record<GameMode, LeaderboardEntry[]>;

      // Archive current leaderboards before reset
      for (const mode of modesToReset) {
        const leaderboardKey = `dicetrix:leaderboard:${mode}`;
        const historicalKey = `dicetrix:leaderboard:${mode}:historical:${currentPeriod}`;
        
        // Get current leaderboard data
        const currentEntries = await redis.zRange(leaderboardKey, 0, -1, { 
          reverse: true,
          by: 'rank'
        });
        
        // Get top players for this mode before reset
        const topModeEntries: LeaderboardEntry[] = [];
        const topScores = await redis.zRange(leaderboardKey, 0, this.config.topPlayersCount - 1, { 
          reverse: true,
          by: 'rank'
        });
        
        for (let i = 0; i < topScores.length; i++) {
          const scoreEntry = topScores[i];
          try {
            if (typeof scoreEntry === 'string') {
              const entryData = JSON.parse(scoreEntry);
              entryData.rank = i + 1;
              topModeEntries.push(entryData);
            }
          } catch (parseError) {
            Logger.log(`LeaderboardManager: Failed to parse top player entry: ${String(parseError)}`);
          }
        }
        
        topPlayers[mode] = topModeEntries;
        
        // Archive current data if there are entries
        if (currentEntries.length > 0) {
          for (const entry of currentEntries) {
            if (typeof entry === 'string') {
              const entryData = JSON.parse(entry);
              await redis.zAdd(historicalKey, {
                member: entry,
                score: entryData.score
              });
            }
          }
          
          // Set expiration for historical data based on retention policy
          const retentionDays = this.config.maxHistoricalPeriods * this.getRetentionMultiplier(this.config.resetInterval);
          await redis.expire(historicalKey, retentionDays * 24 * 60 * 60);
          
          totalPlayersAffected += currentEntries.length;
          
          // Clear current leaderboard
          await redis.del(leaderboardKey);
          
          Logger.log(`LeaderboardManager: Archived ${currentEntries.length} entries for ${mode} mode`);
        }
      }

      // Update reset schedule for next period
      const nextResetTime = this.getNextResetTime(this.config.resetInterval);
      const scheduleKey = 'dicetrix:leaderboard:schedule';
      await redis.set(scheduleKey, JSON.stringify({
        nextReset: nextResetTime,
        interval: this.config.resetInterval,
        lastReset: resetTimestamp,
        resetId
      }));

      // Store reset result for tracking
      const resetResultKey = `dicetrix:leaderboard:reset:${resetId}`;
      const resetResult: ResetResult = {
        resetId,
        timestamp: resetTimestamp,
        period: currentPeriod,
        difficulties: modesToReset,
        topPlayers,
        totalPlayersAffected,
        redditPostCreated: false // Will be updated by Reddit integration
      };
      
      await redis.set(resetResultKey, JSON.stringify(resetResult));
      await redis.expire(resetResultKey, 30 * 24 * 60 * 60); // Keep for 30 days

      Logger.log(`LeaderboardManager: Reset completed successfully. Reset ID: ${resetId}, Players affected: ${totalPlayersAffected}`);

      return resetResult;
    } catch (error) {
      Logger.log(`LeaderboardManager: Error executing reset: ${String(error)}`);
      throw new Error(`Failed to execute reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current reset schedule information
   * Implements requirement 4.2
   */
  async getResetSchedule(): Promise<ResetSchedule> {
    try {
      const scheduleKey = 'dicetrix:leaderboard:schedule';
      const scheduleData = await redis.get(scheduleKey);
      
      if (scheduleData) {
        const schedule = JSON.parse(scheduleData);
        return {
          nextReset: schedule.nextReset,
          interval: schedule.interval,
          currentPeriod: this.getCurrentPeriodString(schedule.interval)
        };
      }
      
      // Return default schedule if none exists
      return {
        nextReset: this.getNextResetTime(this.config.resetInterval),
        interval: this.config.resetInterval,
        currentPeriod: this.getCurrentPeriodString(this.config.resetInterval)
      };
    } catch (error) {
      Logger.log(`LeaderboardManager: Error getting reset schedule: ${String(error)}`);
      throw new Error(`Failed to get reset schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Archive current leaderboard data before reset
   * Implements requirement 4.3
   */
  async archiveCurrentLeaderboard(mode: GameMode): Promise<void> {
    try {
      Logger.log(`LeaderboardManager: Archiving current leaderboard for ${mode} mode`);
      
      const leaderboardKey = `dicetrix:leaderboard:${mode}`;
      const currentPeriod = this.getCurrentPeriodString(this.config.resetInterval);
      const historicalKey = `dicetrix:leaderboard:${mode}:historical:${currentPeriod}`;
      
      // Get all current entries
      const currentEntries = await redis.zRange(leaderboardKey, 0, -1, { 
        reverse: true,
        by: 'rank'
      });
      
      if (currentEntries.length > 0) {
        // Archive each entry
        for (const entry of currentEntries) {
          if (typeof entry === 'string') {
            const entryData = JSON.parse(entry);
            await redis.zAdd(historicalKey, {
              member: entry,
              score: entryData.score
            });
          }
        }
        
        // Set expiration based on retention policy
        const retentionDays = this.config.maxHistoricalPeriods * this.getRetentionMultiplier(this.config.resetInterval);
        await redis.expire(historicalKey, retentionDays * 24 * 60 * 60);
        
        Logger.log(`LeaderboardManager: Archived ${currentEntries.length} entries for ${mode} mode to ${historicalKey}`);
      }
    } catch (error) {
      Logger.log(`LeaderboardManager: Error archiving leaderboard: ${String(error)}`);
      throw new Error(`Failed to archive leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update leaderboard configuration
   * Implements requirements 4.1, 4.2, 4.5
   */
  async updateConfig(config: Partial<LeaderboardConfig>): Promise<void> {
    try {
      Logger.log(`LeaderboardManager: Updating configuration: ${JSON.stringify(config)}`);
      
      // Merge with existing configuration
      this.config = { ...this.config, ...config };
      
      // Store updated configuration in Redis
      const configKey = 'dicetrix:leaderboard:config';
      await redis.set(configKey, JSON.stringify(this.config));
      
      // Update reset schedule if interval changed
      if (config.resetInterval || config.customResetHours) {
        const nextResetTime = this.getNextResetTime(this.config.resetInterval);
        const scheduleKey = 'dicetrix:leaderboard:schedule';
        const currentSchedule = await redis.get(scheduleKey);
        
        const scheduleData = currentSchedule ? JSON.parse(currentSchedule) : {};
        scheduleData.nextReset = nextResetTime;
        scheduleData.interval = this.config.resetInterval;
        scheduleData.customHours = this.config.customResetHours;
        
        await redis.set(scheduleKey, JSON.stringify(scheduleData));
      }
      
      Logger.log(`LeaderboardManager: Configuration updated successfully`);
    } catch (error) {
      Logger.log(`LeaderboardManager: Error updating configuration: ${String(error)}`);
      throw new Error(`Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current leaderboard configuration
   * Implements requirement 4.2
   */
  async getConfig(): Promise<LeaderboardConfig> {
    try {
      const configKey = 'dicetrix:leaderboard:config';
      const configData = await redis.get(configKey);
      
      if (configData) {
        const storedConfig = JSON.parse(configData);
        this.config = { ...this.config, ...storedConfig };
      }
      
      return this.config;
    } catch (error) {
      Logger.log(`LeaderboardManager: Error getting configuration: ${String(error)}`);
      return this.config; // Return current config as fallback
    }
  }

  /**
   * Check if a reset is due based on current schedule
   * Utility method for automated reset checking
   */
  async isResetDue(): Promise<boolean> {
    try {
      const schedule = await this.getResetSchedule();
      return Date.now() >= schedule.nextReset;
    } catch (error) {
      Logger.log(`LeaderboardManager: Error checking reset due: ${String(error)}`);
      return false;
    }
  }

  /**
   * Get all leaderboards for all difficulties
   * Convenience method for retrieving complete leaderboard state
   */
  async getAllLeaderboards(options: LeaderboardOptions = {}): Promise<Record<GameMode, LeaderboardData>> {
    try {
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      const leaderboards: Record<GameMode, LeaderboardData> = {} as Record<GameMode, LeaderboardData>;

      for (const mode of validModes) {
        leaderboards[mode] = await this.getLeaderboard(mode, options);
      }

      return leaderboards;
    } catch (error) {
      Logger.log(`LeaderboardManager: Error getting all leaderboards: ${String(error)}`);
      throw new Error(`Failed to get all leaderboards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user statistics after score submission
   */
  private async updateUserStats(submission: ScoreSubmission): Promise<void> {
    try {
      const userStatsKey = `dicetrix:user:${submission.userId}:stats`;
      const userStats = await redis.get(userStatsKey);
      let totalGamesPlayed = 1;
      
      if (userStats) {
        const stats = JSON.parse(userStats);
        totalGamesPlayed = (stats.totalGamesPlayed || 0) + 1;
      }
      
      await redis.set(userStatsKey, JSON.stringify({
        totalGamesPlayed,
        lastGameMode: submission.mode,
        lastScore: submission.score,
        lastPlayed: submission.submissionTime
      }));
    } catch (error) {
      Logger.log(`LeaderboardManager: Error updating user stats: ${String(error)}`);
    }
  }

  /**
   * Validate score submission data
   */
  private validateSubmission(submission: ScoreSubmission): boolean {
    if (!submission.userId || !submission.username) {
      return false;
    }
    
    if (typeof submission.score !== 'number' || submission.score < 0) {
      return false;
    }
    
    if (typeof submission.level !== 'number' || submission.level < 1) {
      return false;
    }
    
    const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
    if (!validModes.includes(submission.mode)) {
      return false;
    }
    
    if (!submission.breakdown || typeof submission.breakdown.totalScore !== 'number') {
      return false;
    }
    
    // Basic score validation - breakdown total should match submitted score
    if (Math.abs(submission.breakdown.totalScore - submission.score) > 0.01) {
      return false;
    }
    
    return true;
  }

  /**
   * Get next reset time based on interval
   */
  private getNextResetTime(interval: string): number {
    const now = new Date();
    
    switch (interval) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
      
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek.getTime();
      
      case 'monthly':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth.getTime();
      
      case 'custom':
        const customHours = this.config.customResetHours || 24;
        const customNext = new Date(now.getTime() + (customHours * 60 * 60 * 1000));
        return customNext.getTime();
      
      default:
        return this.getNextResetTime('daily');
    }
  }

  /**
   * Get current period string for display
   */
  private getCurrentPeriodString(interval: string): string {
    const now = new Date();
    
    switch (interval) {
      case 'daily':
        return now.toISOString().split('T')[0]!;
      
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toISOString().split('T')[0]!} to ${weekEnd.toISOString().split('T')[0]!}`;
      
      case 'monthly':
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      default:
        return now.toISOString().split('T')[0]!;
    }
  }

  /**
   * Get previous period key for historical data
   */
  private getPreviousPeriodKey(interval: string): string {
    const now = new Date();
    
    switch (interval) {
      case 'daily':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0]!;
      
      case 'weekly':
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return lastWeek.toISOString().split('T')[0]!;
      
      case 'monthly':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
      
      default:
        const prevDay = new Date(now);
        prevDay.setDate(prevDay.getDate() - 1);
        return prevDay.toISOString().split('T')[0]!;
    }
  }

  /**
   * Get historical leaderboard data for a specific period
   */
  private async getHistoricalLeaderboard(mode: GameMode, period: string): Promise<LeaderboardEntry[]> {
    try {
      const historicalKey = `dicetrix:leaderboard:${mode}:historical:${period}`;
      const historicalScores = await redis.zRange(historicalKey, 0, 4, { 
        reverse: true,
        by: 'rank'
      });
      
      const historical: LeaderboardEntry[] = [];
      for (let i = 0; i < historicalScores.length; i++) {
        const scoreEntry = historicalScores[i];
        try {
          if (typeof scoreEntry === 'string') {
            const entryData = JSON.parse(scoreEntry);
            entryData.rank = i + 1;
            historical.push(entryData);
          }
        } catch (parseError) {
          Logger.log(`LeaderboardManager: Failed to parse historical entry: ${String(parseError)}`);
        }
      }
      
      return historical;
    } catch (error) {
      Logger.log(`LeaderboardManager: Error getting historical leaderboard: ${String(error)}`);
      return [];
    }
  }

  /**
   * Get retention multiplier based on reset interval
   * Helper method for calculating historical data retention
   */
  private getRetentionMultiplier(interval: string): number {
    switch (interval) {
      case 'daily':
        return 1; // Days
      case 'weekly':
        return 7; // Days per week
      case 'monthly':
        return 30; // Approximate days per month
      case 'custom':
        return Math.ceil((this.config.customResetHours || 24) / 24); // Convert hours to days
      default:
        return 1;
    }
  }
}
