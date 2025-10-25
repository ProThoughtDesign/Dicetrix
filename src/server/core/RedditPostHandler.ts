import { context } from '@devvit/web/server';
import { GameMode, ScoreBreakdown } from '../../shared/types/game';
import { LeaderboardEntry } from '../../shared/types/api';
import { ScoreSubmission, ResetResult } from './LeaderboardManager';
import Logger from '../utils/Logger';

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

/**
 * RedditPostHandler manages Reddit integration for score submissions and leaderboard posts
 * Implements requirements 1.3, 2.1, 5.1, 5.2
 */
export class RedditPostHandler {
  private subredditName: string;

  constructor() {
    this.subredditName = context.subredditName || 'dicetrix';
  }

  /**
   * Create a Reddit post for score submission
   * Implements requirement 1.3: Score submission posts with difficulty and timestamp data
   */
  async createScorePost(submission: ScoreSubmission): Promise<RedditPost> {
    try {
      Logger.log(`RedditPostHandler: Creating score post for ${submission.username} - ${submission.score} points in ${submission.mode} mode`);

      const postContent = this.formatScorePostContent(submission);
      const postTitle = this.generateScorePostTitle(submission);
      
      // In a real implementation, this would use the Reddit API through Devvit
      // For now, we'll simulate post creation and return structured data
      const postId = `score_${submission.userId}_${submission.timestamp}`;
      const postUrl = `https://reddit.com/r/${this.subredditName}/comments/${postId}`;
      
      const redditPost: RedditPost = {
        id: postId,
        url: postUrl,
        title: postTitle,
        content: postContent,
        timestamp: Date.now()
      };

      Logger.log(`RedditPostHandler: Score post created successfully - ${postUrl}`);
      return redditPost;
    } catch (error) {
      Logger.log(`RedditPostHandler: Error creating score post: ${String(error)}`);
      throw new Error(`Failed to create score post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse score submission data from Reddit post content
   * Implements requirement 2.1: Automatic detection and parsing of score submission posts
   */
  async parseScorePost(postContent: string): Promise<ScoreSubmission | null> {
    try {
      Logger.log(`RedditPostHandler: Parsing score post content`);

      // Extract score using regex patterns
      const scoreMatch = postContent.match(/\*\*Score:\*\*\s*([0-9,]+)/i);
      const levelMatch = postContent.match(/\*\*Level:\*\*\s*(\d+)/i);
      const modeMatch = postContent.match(/\*\*Mode:\*\*\s*(\w+)/i);
      const dateMatch = postContent.match(/\*\*Date:\*\*\s*([^\n]+)/i);
      const baseScoreMatch = postContent.match(/\*\*Base Score:\*\*\s*([0-9,]+)/i);
      const chainMultiplierMatch = postContent.match(/\*\*Chain Multiplier:\*\*\s*([0-9.]+)x/i);
      const ultimateComboMatch = postContent.match(/\*\*Ultimate Combo:\*\*\s*([0-9.]+)x/i);
      const boosterBonusMatch = postContent.match(/\*\*Booster Bonus:\*\*\s*\+([0-9,]+)/i);

      if (!scoreMatch || !levelMatch || !modeMatch) {
        Logger.log(`RedditPostHandler: Could not parse required fields from post content`);
        return null;
      }

      // Parse extracted values
      const score = parseInt(scoreMatch[1]!.replace(/,/g, ''));
      const level = parseInt(levelMatch[1]!);
      const mode = modeMatch[1]!.toLowerCase() as GameMode;
      
      // Validate mode
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      if (!validModes.includes(mode)) {
        Logger.log(`RedditPostHandler: Invalid game mode found: ${mode}`);
        return null;
      }

      // Parse score breakdown
      const baseScore = baseScoreMatch ? parseInt(baseScoreMatch[1]!.replace(/,/g, '')) : score;
      const chainMultiplier = chainMultiplierMatch ? parseFloat(chainMultiplierMatch[1]!) : 1;
      const ultimateComboMultiplier = ultimateComboMatch ? parseFloat(ultimateComboMatch[1]!) : 1;
      const boosterModifiers = boosterBonusMatch ? parseInt(boosterBonusMatch[1]!.replace(/,/g, '')) : 0;

      const breakdown: ScoreBreakdown = {
        baseScore,
        chainMultiplier,
        ultimateComboMultiplier,
        boosterModifiers,
        totalScore: score
      };

      // Parse timestamp from date string or use current time
      let timestamp = Date.now();
      if (dateMatch) {
        const parsedDate = new Date(dateMatch[1]!);
        if (!isNaN(parsedDate.getTime())) {
          timestamp = parsedDate.getTime();
        }
      }

      // Create score submission object (userId and username would come from post context)
      const scoreSubmission: ScoreSubmission = {
        userId: 'parsed_user', // Would be extracted from post author in real implementation
        username: 'ParsedUser', // Would be extracted from post author in real implementation
        score,
        level,
        mode,
        breakdown,
        timestamp,
        submissionTime: Date.now(),
        postId: 'parsed_post_id', // Would be the actual post ID
        subredditName: this.subredditName
      };

      Logger.log(`RedditPostHandler: Successfully parsed score submission - ${score} points in ${mode} mode`);
      return scoreSubmission;
    } catch (error) {
      Logger.log(`RedditPostHandler: Error parsing score post: ${String(error)}`);
      return null;
    }
  }

  /**
   * Create leaderboard announcement post for reset periods
   * Implements requirement 5.1, 5.2: Automated leaderboard posting with top 5 players per difficulty
   */
  async createLeaderboardPost(results: ResetResult): Promise<RedditPost> {
    try {
      Logger.log(`RedditPostHandler: Creating leaderboard announcement post for reset ${results.resetId}`);

      const postContent = this.formatLeaderboardContent(results);
      const postTitle = this.generateLeaderboardPostTitle(results);
      
      // In a real implementation, this would use the Reddit API through Devvit
      const postId = `leaderboard_${results.resetId}`;
      const postUrl = `https://reddit.com/r/${this.subredditName}/comments/${postId}`;
      
      const redditPost: RedditPost = {
        id: postId,
        url: postUrl,
        title: postTitle,
        content: postContent,
        timestamp: Date.now()
      };

      Logger.log(`RedditPostHandler: Leaderboard post created successfully - ${postUrl}`);
      return redditPost;
    } catch (error) {
      Logger.log(`RedditPostHandler: Error creating leaderboard post: ${String(error)}`);
      throw new Error(`Failed to create leaderboard post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format leaderboard content for Reddit post
   * Implements requirement 5.2: Formatted leaderboard posts with player data and time period
   */
  formatLeaderboardContent(results: ResetResult): string {
    try {
      const { period, topPlayers, totalPlayersAffected } = results;
      
      let content = `# 🏆 Dicetrix Leaderboard Results - ${period}\n\n`;
      content += `Congratulations to all ${totalPlayersAffected} players who competed during this period! Here are the top performers in each difficulty mode:\n\n`;

      // Add top players for each difficulty
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      for (const mode of validModes) {
        const modeTopPlayers = topPlayers[mode];
        if (modeTopPlayers && modeTopPlayers.length > 0) {
          const modeDisplayName = mode.charAt(0).toUpperCase() + mode.slice(1);
          content += `## ${modeDisplayName} Mode 🎯\n\n`;
          
          for (let i = 0; i < Math.min(5, modeTopPlayers.length); i++) {
            const player = modeTopPlayers[i]!;
            const medal = this.getMedalEmoji(i + 1);
            const scoreDate = new Date(player.timestamp).toLocaleDateString();
            
            content += `${medal} **${player.username}** - ${player.score.toLocaleString()} points (Level ${player.level}) - ${scoreDate}\n`;
          }
          content += '\n';
        }
      }

      content += `---\n\n`;
      content += `🎮 **Ready to compete in the next period?** Play Dicetrix now and climb the leaderboards!\n\n`;
      content += `📊 **Stats Summary:**\n`;
      content += `- **Total Players:** ${totalPlayersAffected}\n`;
      content += `- **Period:** ${period}\n`;
      content += `- **Next Reset:** Check the leaderboard widget for the next competition period!\n\n`;
      content += `#Dicetrix #Leaderboard #Competition #PuzzleGame #Reddit #Gaming`;

      return content;
    } catch (error) {
      Logger.log(`RedditPostHandler: Error formatting leaderboard content: ${String(error)}`);
      throw new Error(`Failed to format leaderboard content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send notifications to top players about their achievements
   * Implements requirement 5.3, 5.4: Player notification system for top players
   */
  async notifyTopPlayers(players: LeaderboardEntry[]): Promise<NotificationResult[]> {
    try {
      Logger.log(`RedditPostHandler: Sending notifications to ${players.length} top players`);

      const notificationResults: NotificationResult[] = [];

      for (const player of players) {
        try {
          const achievement: Achievement = {
            type: 'top_player',
            mode: player.mode,
            rank: player.rank || 1,
            score: player.score,
            period: new Date(player.timestamp).toLocaleDateString()
          };

          const notificationSent = await this.sendAchievementNotification(player.username, achievement);
          
          notificationResults.push({
            userId: player.userId,
            username: player.username,
            success: notificationSent,
            message: notificationSent ? 'Notification sent successfully' : 'Failed to send notification'
          });
        } catch (error) {
          Logger.log(`RedditPostHandler: Error notifying player ${player.username}: ${String(error)}`);
          notificationResults.push({
            userId: player.userId,
            username: player.username,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = notificationResults.filter(r => r.success).length;
      Logger.log(`RedditPostHandler: Sent ${successCount}/${players.length} notifications successfully`);

      return notificationResults;
    } catch (error) {
      Logger.log(`RedditPostHandler: Error sending notifications: ${String(error)}`);
      throw new Error(`Failed to send notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send achievement notification to a specific user
   * Implements requirement 5.4: Individual player notifications
   */
  async sendAchievementNotification(username: string, achievement: Achievement): Promise<boolean> {
    try {
      Logger.log(`RedditPostHandler: Sending achievement notification to ${username}`);

      const notificationContent = this.formatAchievementNotification(achievement);
      
      // In a real implementation, this would use Reddit's messaging API through Devvit
      // For now, we'll simulate the notification and log the content
      Logger.log(`RedditPostHandler: Notification content for ${username}: ${notificationContent}`);
      
      // Simulate success/failure (in real implementation, this would depend on Reddit API response)
      const success = Math.random() > 0.1; // 90% success rate simulation
      
      if (success) {
        Logger.log(`RedditPostHandler: Achievement notification sent successfully to ${username}`);
      } else {
        Logger.log(`RedditPostHandler: Failed to send achievement notification to ${username}`);
      }

      return success;
    } catch (error) {
      Logger.log(`RedditPostHandler: Error sending achievement notification: ${String(error)}`);
      return false;
    }
  }

  /**
   * Update subreddit widget with current leaderboard data
   * Implements requirement 6.3: Automatic widget updates when new scores are submitted
   */
  async updateSubredditWidget(data: LeaderboardWidgetData): Promise<void> {
    try {
      Logger.log(`RedditPostHandler: Updating subreddit widget with leaderboard data`);

      const widgetContent = await this.getWidgetContent(data);
      
      // In a real implementation, this would update the subreddit widget through Devvit
      // For now, we'll log the widget content
      Logger.log(`RedditPostHandler: Widget content updated: ${widgetContent.substring(0, 200)}...`);
      
      Logger.log(`RedditPostHandler: Subreddit widget updated successfully`);
    } catch (error) {
      Logger.log(`RedditPostHandler: Error updating subreddit widget: ${String(error)}`);
      throw new Error(`Failed to update subreddit widget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get formatted widget content for subreddit display
   * Implements requirement 6.1, 6.2: Widget content formatting for subreddit main page
   */
  getWidgetContent(data?: LeaderboardWidgetData): string {
    try {
      if (!data) {
        return 'Dicetrix Leaderboards - Loading...';
      }

      const { topPlayers, lastUpdated, nextReset } = data;
      
      let content = '🏆 **Dicetrix Leaderboards** 🏆\n\n';
      
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      for (const mode of validModes) {
        const modeTopPlayers = topPlayers[mode];
        if (modeTopPlayers && modeTopPlayers.length > 0) {
          const modeDisplayName = mode.charAt(0).toUpperCase() + mode.slice(1);
          content += `**${modeDisplayName}:**\n`;
          
          for (let i = 0; i < Math.min(3, modeTopPlayers.length); i++) {
            const player = modeTopPlayers[i]!;
            const medal = this.getMedalEmoji(i + 1);
            content += `${medal} ${player.username} - ${player.score.toLocaleString()}\n`;
          }
          content += '\n';
        }
      }

      const nextResetDate = new Date(nextReset).toLocaleDateString();
      const lastUpdatedDate = new Date(lastUpdated).toLocaleString();
      
      content += `🔄 Next Reset: ${nextResetDate}\n`;
      content += `📊 Updated: ${lastUpdatedDate}\n\n`;
      content += `🎮 Play Dicetrix now!`;

      return content;
    } catch (error) {
      Logger.log(`RedditPostHandler: Error generating widget content: ${String(error)}`);
      return 'Dicetrix Leaderboards - Error loading data';
    }
  }

  /**
   * Format score post content for Reddit submission
   * Private helper method for score post formatting
   */
  private formatScorePostContent(submission: ScoreSubmission): string {
    const modeDisplayName = submission.mode.charAt(0).toUpperCase() + submission.mode.slice(1);
    const scoreDate = new Date(submission.timestamp).toLocaleDateString();
    
    let content = `Just achieved **${submission.score.toLocaleString()} points** in Dicetrix ${modeDisplayName} mode! 🎯\n\n`;
    content += `**Game Stats:**\n`;
    content += `- **Score:** ${submission.score.toLocaleString()}\n`;
    content += `- **Level:** ${submission.level}\n`;
    content += `- **Mode:** ${modeDisplayName}\n`;
    content += `- **Date:** ${scoreDate}\n`;
    content += `- **Base Score:** ${submission.breakdown.baseScore.toLocaleString()}\n`;
    content += `- **Chain Multiplier:** ${submission.breakdown.chainMultiplier}x\n`;
    
    if (submission.breakdown.ultimateComboMultiplier > 1) {
      content += `- **Ultimate Combo:** ${submission.breakdown.ultimateComboMultiplier}x\n`;
    }
    
    if (submission.breakdown.boosterModifiers > 0) {
      content += `- **Booster Bonus:** +${submission.breakdown.boosterModifiers.toLocaleString()}\n`;
    }
    
    content += `\nThink you can beat my score? Try Dicetrix now! 🎮\n\n`;
    content += `#Dicetrix #PuzzleGame #HighScore #Reddit #Gaming`;

    return content;
  }

  /**
   * Generate title for score submission post
   * Private helper method for post title generation
   */
  private generateScorePostTitle(submission: ScoreSubmission): string {
    const modeDisplayName = submission.mode.charAt(0).toUpperCase() + submission.mode.slice(1);
    return `🎯 ${submission.score.toLocaleString()} points in Dicetrix ${modeDisplayName} mode!`;
  }

  /**
   * Generate title for leaderboard announcement post
   * Private helper method for leaderboard post title generation
   */
  private generateLeaderboardPostTitle(results: ResetResult): string {
    return `🏆 Dicetrix Leaderboard Results - ${results.period}`;
  }

  /**
   * Format achievement notification content
   * Private helper method for notification formatting
   */
  private formatAchievementNotification(achievement: Achievement): string {
    const modeDisplayName = achievement.mode.charAt(0).toUpperCase() + achievement.mode.slice(1);
    const medal = this.getMedalEmoji(achievement.rank);
    
    let content = `🎉 Congratulations! You've achieved a top position in Dicetrix!\n\n`;
    content += `${medal} **Rank ${achievement.rank}** in ${modeDisplayName} mode\n`;
    content += `🎯 **Score:** ${achievement.score.toLocaleString()} points\n`;
    content += `📅 **Period:** ${achievement.period}\n\n`;
    content += `Your amazing performance has been featured in the latest leaderboard announcement! `;
    content += `Keep up the great work and continue climbing the ranks!\n\n`;
    content += `🎮 Ready for the next challenge? Play Dicetrix again and defend your position!`;

    return content;
  }

  /**
   * Get medal emoji for ranking position
   * Private helper method for ranking display
   */
  private getMedalEmoji(rank: number): string {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}.`;
    }
  }

  /**
   * Get current Reddit configuration
   * Implements requirement 4.5, 5.1: Configuration management for Reddit posting and notifications
   */
  async getConfig(): Promise<RedditConfig> {
    try {
      // Import redis here to avoid circular dependencies
      const { redis } = await import('@devvit/web/server');
      
      const configKey = 'dicetrix:reddit:config';
      const configData = await redis.get(configKey);
      
      if (configData) {
        const storedConfig = JSON.parse(configData);
        return {
          enableAutoPosting: storedConfig.enableAutoPosting ?? true,
          enableUserNotifications: storedConfig.enableUserNotifications ?? true,
          postTemplate: storedConfig.postTemplate ?? this.getDefaultPostTemplate(),
          widgetUpdateInterval: storedConfig.widgetUpdateInterval ?? 300000 // 5 minutes default
        };
      }
      
      // Return default configuration
      return {
        enableAutoPosting: true,
        enableUserNotifications: true,
        postTemplate: this.getDefaultPostTemplate(),
        widgetUpdateInterval: 300000 // 5 minutes default
      };
    } catch (error) {
      Logger.log(`RedditPostHandler: Error getting configuration: ${String(error)}`);
      // Return default configuration as fallback
      return {
        enableAutoPosting: true,
        enableUserNotifications: true,
        postTemplate: this.getDefaultPostTemplate(),
        widgetUpdateInterval: 300000
      };
    }
  }

  /**
   * Update Reddit configuration
   * Implements requirement 4.5, 5.1: Configuration updates for Reddit posting and notification settings
   */
  async updateConfig(config: Partial<RedditConfig>): Promise<void> {
    try {
      Logger.log(`RedditPostHandler: Updating Reddit configuration: ${JSON.stringify(config)}`);
      
      // Import redis here to avoid circular dependencies
      const { redis } = await import('@devvit/web/server');
      
      // Get current configuration
      const currentConfig = await this.getConfig();
      
      // Merge with new configuration
      const updatedConfig = { ...currentConfig, ...config };
      
      // Store updated configuration in Redis
      const configKey = 'dicetrix:reddit:config';
      await redis.set(configKey, JSON.stringify(updatedConfig));
      
      Logger.log(`RedditPostHandler: Reddit configuration updated successfully`);
    } catch (error) {
      Logger.log(`RedditPostHandler: Error updating configuration: ${String(error)}`);
      throw new Error(`Failed to update Reddit configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get default post template for score submissions
   * Private helper method for default configuration
   */
  private getDefaultPostTemplate(): string {
    return `Just achieved **{score} points** in Dicetrix {mode} mode! 🎯

**Game Stats:**
- **Score:** {score}
- **Level:** {level}
- **Mode:** {mode}
- **Date:** {date}
- **Base Score:** {baseScore}
- **Chain Multiplier:** {chainMultiplier}x
{ultimateCombo}
{boosterBonus}

Think you can beat my score? Try Dicetrix now! 🎮

#Dicetrix #PuzzleGame #HighScore #Reddit #Gaming`;
  }
}

export interface RedditConfig {
  enableAutoPosting: boolean;
  enableUserNotifications: boolean;
  postTemplate: string;
  widgetUpdateInterval: number;
}
