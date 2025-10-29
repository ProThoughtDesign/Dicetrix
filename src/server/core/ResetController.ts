import { LeaderboardManager, ResetResult, LeaderboardConfig, ResetInterval } from './LeaderboardManager';
import { RedditPostHandler, NotificationResult } from './RedditPostHandler';
import { GameMode } from '../../shared/types/game';
import { LeaderboardEntry } from '../../shared/types/api';
import Logger from '../utils/Logger';

export interface ManualResetOptions {
  difficulties?: GameMode[];
  createPost?: boolean;
  immediate?: boolean;
}

export interface ResetPreview {
  scheduledTime: number;
  affectedDifficulties: GameMode[];
  estimatedPlayersAffected: number;
  topPlayersPreview: Record<GameMode, { username: string; score: number }[]>;
}

export interface ResetConfig {
  interval: 'daily' | 'weekly' | 'monthly' | 'custom';
  customHours?: number | undefined;
  enableAutoPosting?: boolean;
  enableNotifications?: boolean;
}

export interface TaskScheduler {
  scheduleTask(taskId: string, executeAt: number, callback: () => Promise<void>): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  isTaskScheduled(taskId: string): Promise<boolean>;
}

/**
 * ResetController manages automated leaderboard resets and scheduling
 * Implements requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */
export class ResetController {
  private leaderboardManager: LeaderboardManager;
  private redditHandler: RedditPostHandler;
  private scheduler: TaskScheduler | null = null;
  private resetTaskId = 'leaderboard_auto_reset';

  constructor(leaderboardManager: LeaderboardManager, redditHandler?: RedditPostHandler, scheduler?: TaskScheduler) {
    this.leaderboardManager = leaderboardManager;
    this.redditHandler = redditHandler || new RedditPostHandler();
    this.scheduler = scheduler || null;
  }

  /**
   * Initialize the reset scheduler with current configuration
   * Implements requirement 4.1, 4.2
   */
  async initializeScheduler(): Promise<void> {
    try {
      Logger.log('ResetController: Initializing reset scheduler');

      // Get current configuration and schedule
      const config = await this.leaderboardManager.getConfig();
      const schedule = await this.leaderboardManager.getResetSchedule();

      Logger.log(`ResetController: Current reset interval: ${config.resetInterval}, Next reset: ${new Date(schedule.nextReset).toISOString()}`);

      // Schedule the next reset if scheduler is available
      if (this.scheduler) {
        await this.scheduleNextReset(schedule.nextReset);
      } else {
        Logger.log('ResetController: No task scheduler provided, manual reset checking required');
      }

      Logger.log('ResetController: Scheduler initialized successfully');
    } catch (error) {
      Logger.log(`ResetController: Error initializing scheduler: ${String(error)}`);
      throw new Error(`Failed to initialize scheduler: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a scheduled reset automatically
   * Implements requirements 4.1, 4.5
   */
  async executeScheduledReset(): Promise<void> {
    try {
      Logger.log('ResetController: Executing scheduled reset');

      // Check if reset is actually due
      const isResetDue = await this.leaderboardManager.isResetDue();
      if (!isResetDue) {
        Logger.log('ResetController: Reset not due yet, skipping execution');
        return;
      }

      // Execute reset for all difficulties
      const resetResult = await this.leaderboardManager.executeReset();
      
      // Handle reset completion (notifications, posting, etc.)
      await this.handleResetCompletion(resetResult);

      // Schedule the next reset
      const nextSchedule = await this.leaderboardManager.getResetSchedule();
      if (this.scheduler) {
        await this.scheduleNextReset(nextSchedule.nextReset);
      }

      Logger.log(`ResetController: Scheduled reset completed successfully. Reset ID: ${resetResult.resetId}`);
    } catch (error) {
      Logger.log(`ResetController: Error executing scheduled reset: ${String(error)}`);
      throw new Error(`Failed to execute scheduled reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle post-reset operations like notifications and posting
   * Implements requirements 4.5, 5.1, 5.2, 5.3, 5.4, 5.5
   */
  async handleResetCompletion(resetResult: ResetResult): Promise<void> {
    try {
      Logger.log(`ResetController: Handling reset completion for reset ${resetResult.resetId}`);

      const config = await this.leaderboardManager.getConfig();

      // Log reset completion
      Logger.log(`ResetController: Reset completed - Period: ${resetResult.period}, Players affected: ${resetResult.totalPlayersAffected}`);

      // Log top players for each difficulty
      for (const [modeName, players] of Object.entries(resetResult.topPlayers)) {
        if (players.length > 0) {
          Logger.log(`ResetController: Top players for ${modeName}: ${players.map(p => `${p.username} (${p.score})`).join(', ')}`);
        }
      }

      let redditPostCreated = false;
      const allNotificationResults: NotificationResult[] = [];

      // Create Reddit leaderboard post if auto-posting is enabled
      if (config.enableAutoPosting) {
        try {
          Logger.log('ResetController: Creating Reddit leaderboard post');
          const leaderboardPost = await this.redditHandler.createLeaderboardPost(resetResult);
          redditPostCreated = true;
          
          Logger.log(`ResetController: Reddit leaderboard post created successfully: ${leaderboardPost.url}`);
        } catch (postError) {
          Logger.log(`ResetController: Failed to create Reddit leaderboard post: ${String(postError)}`);
          // Continue with notifications even if posting fails
        }
      }

      // Send notifications to top players if notifications are enabled
      if (config.enableNotifications) {
        try {
          Logger.log('ResetController: Sending notifications to top players');
          
          // Collect all top players across all difficulties (top 5 per difficulty)
          const allTopPlayers: LeaderboardEntry[] = [];
          for (const [, players] of Object.entries(resetResult.topPlayers)) {
            const topPlayersForMode = players.slice(0, 5); // Top 5 players per difficulty
            allTopPlayers.push(...topPlayersForMode);
          }

          if (allTopPlayers.length > 0) {
            const notificationResults = await this.redditHandler.notifyTopPlayers(allTopPlayers);
            allNotificationResults.push(...notificationResults);
            
            const successfulNotifications = notificationResults.filter(r => r.success).length;
            Logger.log(`ResetController: Sent ${successfulNotifications}/${allTopPlayers.length} notifications successfully`);
          } else {
            Logger.log('ResetController: No top players to notify');
          }
        } catch (notificationError) {
          Logger.log(`ResetController: Error sending notifications: ${String(notificationError)}`);
          // Continue even if notifications fail - don't affect the main reset process
        }
      }

      // Update reset result with Reddit posting status
      resetResult.redditPostCreated = redditPostCreated;

      // Store notification results for tracking
      if (allNotificationResults.length > 0) {
        try {
          const notificationResultsKey = `dicetrix:reset:${resetResult.resetId}:notifications`;
          await this.storeNotificationResults(notificationResultsKey, allNotificationResults);
        } catch (storageError) {
          Logger.log(`ResetController: Failed to store notification results: ${String(storageError)}`);
        }
      }

      Logger.log(`ResetController: Reset completion handling finished for ${resetResult.resetId} - Post created: ${redditPostCreated}, Notifications sent: ${allNotificationResults.filter(r => r.success).length}`);
    } catch (error) {
      Logger.log(`ResetController: Error handling reset completion: ${String(error)}`);
      // Don't throw error here as reset was successful, just log the issue
    }
  }

  /**
   * Trigger a manual reset with options
   * Implements requirements 4.1, 4.3
   */
  async triggerManualReset(options: ManualResetOptions = {}): Promise<ResetResult> {
    try {
      Logger.log(`ResetController: Triggering manual reset with options: ${JSON.stringify(options)}`);

      const { difficulties, createPost = false, immediate = true } = options;

      if (!immediate) {
        // Schedule reset for next scheduled time
        const schedule = await this.leaderboardManager.getResetSchedule();
        Logger.log(`ResetController: Manual reset scheduled for ${new Date(schedule.nextReset).toISOString()}`);
        
        if (this.scheduler) {
          await this.scheduleNextReset(schedule.nextReset);
        }
        
        // Return a placeholder result for scheduled reset
        return {
          resetId: `manual_scheduled_${Date.now()}`,
          timestamp: Date.now(),
          period: 'scheduled',
          difficulties: difficulties || ['easy', 'medium', 'hard', 'expert', 'zen'],
          topPlayers: {} as Record<GameMode, any[]>,
          totalPlayersAffected: 0,
          redditPostCreated: false
        };
      }

      // Execute immediate reset
      const resetResult = await this.leaderboardManager.executeReset(difficulties);

      // Handle completion if requested
      if (createPost) {
        await this.handleResetCompletion(resetResult);
      }

      Logger.log(`ResetController: Manual reset completed. Reset ID: ${resetResult.resetId}`);
      return resetResult;
    } catch (error) {
      Logger.log(`ResetController: Error triggering manual reset: ${String(error)}`);
      throw new Error(`Failed to trigger manual reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Preview what would happen in the next reset
   * Implements requirement 4.4
   */
  async previewResetResults(): Promise<ResetPreview> {
    try {
      Logger.log('ResetController: Generating reset preview');

      const schedule = await this.leaderboardManager.getResetSchedule();
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      
      let estimatedPlayersAffected = 0;
      const topPlayersPreview: Record<GameMode, { username: string; score: number }[]> = {} as Record<GameMode, { username: string; score: number }[]>;

      // Get preview data for each difficulty
      for (const mode of validModes) {
        const leaderboardData = await this.leaderboardManager.getLeaderboard(mode, { limit: 5 });
        
        estimatedPlayersAffected += leaderboardData.totalPlayers;
        
        topPlayersPreview[mode] = leaderboardData.entries.map(entry => ({
          username: entry.username,
          score: entry.score
        }));
      }

      const preview: ResetPreview = {
        scheduledTime: schedule.nextReset,
        affectedDifficulties: validModes,
        estimatedPlayersAffected,
        topPlayersPreview
      };

      Logger.log(`ResetController: Reset preview generated - ${estimatedPlayersAffected} players would be affected`);
      return preview;
    } catch (error) {
      Logger.log(`ResetController: Error generating reset preview: ${String(error)}`);
      throw new Error(`Failed to generate reset preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update the reset schedule configuration
   * Implements requirements 4.1, 4.2
   */
  async updateResetSchedule(config: ResetConfig): Promise<void> {
    try {
      Logger.log(`ResetController: Updating reset schedule: ${JSON.stringify(config)}`);

      // Update leaderboard manager configuration
      const leaderboardConfig: Partial<LeaderboardConfig> = {
        resetInterval: config.interval,
        ...(config.customHours !== undefined && { customResetHours: config.customHours }),
        enableAutoPosting: config.enableAutoPosting ?? true,
        enableNotifications: config.enableNotifications ?? true
      };

      await this.leaderboardManager.updateConfig(leaderboardConfig);

      // Schedule reset with new interval
      const resetInterval: ResetInterval = {
        type: config.interval,
        ...(config.customHours !== undefined && { customHours: config.customHours })
      };
      await this.leaderboardManager.scheduleReset(resetInterval);

      // Update scheduler if available
      if (this.scheduler) {
        // Cancel existing scheduled task
        await this.scheduler.cancelTask(this.resetTaskId);
        
        // Schedule new task
        const newSchedule = await this.leaderboardManager.getResetSchedule();
        await this.scheduleNextReset(newSchedule.nextReset);
      }

      Logger.log('ResetController: Reset schedule updated successfully');
    } catch (error) {
      Logger.log(`ResetController: Error updating reset schedule: ${String(error)}`);
      throw new Error(`Failed to update reset schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the next scheduled reset time
   * Implements requirement 4.2
   */
  async getNextResetTime(): Promise<number> {
    try {
      const schedule = await this.leaderboardManager.getResetSchedule();
      return schedule.nextReset;
    } catch (error) {
      Logger.log(`ResetController: Error getting next reset time: ${String(error)}`);
      throw new Error(`Failed to get next reset time: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if the system is ready for automated resets
   */
  async isSystemReady(): Promise<boolean> {
    try {
      // Check if configuration exists
      const config = await this.leaderboardManager.getConfig();
      
      // Check if schedule exists
      const schedule = await this.leaderboardManager.getResetSchedule();
      
      // Verify basic configuration is valid
      const validIntervals = ['daily', 'weekly', 'monthly', 'custom'];
      const isConfigValid = validIntervals.includes(config.resetInterval);
      
      const isScheduleValid = schedule.nextReset > Date.now();
      
      Logger.log(`ResetController: System ready check - Config valid: ${isConfigValid}, Schedule valid: ${isScheduleValid}`);
      
      return isConfigValid && isScheduleValid;
    } catch (error) {
      Logger.log(`ResetController: Error checking system readiness: ${String(error)}`);
      return false;
    }
  }

  /**
   * Get current reset configuration and status
   */
  async getResetStatus(): Promise<{
    config: LeaderboardConfig;
    schedule: { nextReset: number; interval: string; currentPeriod: string };
    isSchedulerActive: boolean;
    systemReady: boolean;
  }> {
    try {
      const config = await this.leaderboardManager.getConfig();
      const schedule = await this.leaderboardManager.getResetSchedule();
      const systemReady = await this.isSystemReady();
      const isSchedulerActive = this.scheduler !== null && await this.scheduler.isTaskScheduled(this.resetTaskId);

      return {
        config,
        schedule,
        isSchedulerActive,
        systemReady
      };
    } catch (error) {
      Logger.log(`ResetController: Error getting reset status: ${String(error)}`);
      throw new Error(`Failed to get reset status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule the next reset task
   * Private helper method for task scheduling
   */
  private async scheduleNextReset(executeAt: number): Promise<void> {
    if (!this.scheduler) {
      Logger.log('ResetController: No scheduler available for task scheduling');
      return;
    }

    try {
      // Cancel any existing scheduled task
      await this.scheduler.cancelTask(this.resetTaskId);

      // Schedule new task
      await this.scheduler.scheduleTask(this.resetTaskId, executeAt, async () => {
        await this.executeScheduledReset();
      });

      Logger.log(`ResetController: Next reset scheduled for ${new Date(executeAt).toISOString()}`);
    } catch (error) {
      Logger.log(`ResetController: Error scheduling next reset: ${String(error)}`);
    }
  }

  /**
   * Store notification results for tracking and debugging
   * Private helper method for notification result storage
   */
  private async storeNotificationResults(key: string, results: NotificationResult[]): Promise<void> {
    try {
      // Import redis here to avoid circular dependencies
      const { redis } = await import('@devvit/web/server');
      
      await redis.set(key, JSON.stringify({
        timestamp: Date.now(),
        totalNotifications: results.length,
        successfulNotifications: results.filter(r => r.success).length,
        results
      }));
      
      // Set expiration for 30 days
      await redis.expire(key, 30 * 24 * 60 * 60);
      
      Logger.log(`ResetController: Stored notification results for ${results.length} notifications`);
    } catch (error) {
      Logger.log(`ResetController: Error storing notification results: ${String(error)}`);
    }
  }
}
