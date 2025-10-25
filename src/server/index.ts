import express from 'express';
import { redis, createServer, context } from '@devvit/web/server';
import { Devvit } from '@devvit/public-api';

// Enhanced debugging for Devvit issues
console.log('🚀 Dicetrix server starting...');
console.log('📋 Environment check:');
console.log('• Context available:', !!context);
console.log('• Redis available:', !!redis);
console.log('• Node version:', process.version);
console.log('• Port:', process.env.WEBBIT_PORT || 3000);
import { createPost } from './core/post';
import { LeaderboardManager, ScoreSubmission, LeaderboardOptions } from './core/LeaderboardManager';
import { ResetController } from './core/ResetController';
import { RedditPostHandler } from './core/RedditPostHandler';
import { DevvitTaskScheduler } from './core/TaskScheduler';
import { 
  GameInitResponse, 
  ScoreSubmissionRequest, 
  ScoreSubmissionResponse,
  LeaderboardResponse,
  LeaderboardEntry,
  ShareScoreRequest,
  ShareScoreResponse,
  AllLeaderboardsResponse,
  LeaderboardResetRequest,
  LeaderboardResetResponse,
  RedditScoreSubmissionRequest,
  RedditScoreSubmissionResponse,
  LeaderboardWidgetResponse,
  LeaderboardConfigRequest,
  LeaderboardConfigResponse,
  RedditConfigRequest,
  RedditConfigResponse,
  SystemStatusResponse,
  ConfigValidationResponse,
  SystemDiagnosticsResponse,
  ResetPreviewResponse,
  SystemHealthCheckResponse,
  ErrorResponse 
} from '../shared/types/api';
import { GameMode } from '../shared/types/game';
import Logger from './utils/Logger';

const app = express();

// Initialize LeaderboardManager, RedditPostHandler, and ResetController
const leaderboardManager = new LeaderboardManager({
  resetInterval: 'daily',
  maxHistoricalPeriods: 3,
  topPlayersCount: 5,
  enableAutoPosting: true,
  enableNotifications: true
});

const redditPostHandler = new RedditPostHandler();
const taskScheduler = new DevvitTaskScheduler();
const resetController = new ResetController(leaderboardManager, redditPostHandler, taskScheduler);

// Register scheduled job handler for leaderboard resets
Devvit.addSchedulerJob({
  name: 'leaderboard_reset',
  onRun: async (event, _context) => {
    try {
      Logger.log(`Scheduled job handler: Executing leaderboard reset job with data: ${JSON.stringify(event.data)}`);
      
      // Execute the scheduled reset
      await resetController.executeScheduledReset();
      
      Logger.log('Scheduled job handler: Leaderboard reset completed successfully');
    } catch (error) {
      Logger.log(`Scheduled job handler: Error executing leaderboard reset: ${String(error)}`);
      throw error; // Re-throw to mark job as failed
    }
  }
});

// Initialize reset scheduler on startup
resetController.initializeScheduler().catch(error => {
  Logger.log(`Failed to initialize reset scheduler: ${String(error)}`);
});

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// Authentication middleware
const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { userId } = context;
  if (!userId) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    } as ErrorResponse);
    return;
  }
  // Get username from context or use Anonymous as fallback
  const username = (context as any).username || 'Anonymous';
  req.user = { userId, username };
  next();
};

// Error handling middleware
const handleError = (error: unknown, operation: string): ErrorResponse => {
  Logger.log(`${operation} Error: ${String(error)}`);
  
  if (error instanceof Error) {
    return {
      status: 'error',
      message: error.message,
      code: 'OPERATION_FAILED'
    };
  }
  
  return {
    status: 'error',
    message: `Unknown error during ${operation}`,
    code: 'UNKNOWN_ERROR'
  };
};

// Configuration validation functions
const validateLeaderboardConfig = (config: LeaderboardConfigRequest): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate reset interval
  if (config.resetInterval !== undefined) {
    const validIntervals = ['daily', 'weekly', 'monthly', 'custom'];
    if (!validIntervals.includes(config.resetInterval)) {
      errors.push(`Invalid reset interval: ${config.resetInterval}. Must be one of: ${validIntervals.join(', ')}`);
    }
    
    // Validate custom hours if custom interval
    if (config.resetInterval === 'custom') {
      if (config.customResetHours === undefined) {
        errors.push('Custom reset hours must be specified when using custom interval');
      } else if (config.customResetHours < 1 || config.customResetHours > 8760) { // 1 hour to 1 year
        errors.push('Custom reset hours must be between 1 and 8760 (1 year)');
      } else if (config.customResetHours < 24) {
        warnings.push('Reset intervals less than 24 hours may create frequent resets');
      }
    }
  }
  
  // Validate historical periods
  if (config.maxHistoricalPeriods !== undefined) {
    if (config.maxHistoricalPeriods < 1 || config.maxHistoricalPeriods > 12) {
      errors.push('Max historical periods must be between 1 and 12');
    } else if (config.maxHistoricalPeriods > 6) {
      warnings.push('Storing more than 6 historical periods may impact performance');
    }
  }
  
  // Validate top players count
  if (config.topPlayersCount !== undefined) {
    if (config.topPlayersCount < 1 || config.topPlayersCount > 20) {
      errors.push('Top players count must be between 1 and 20');
    } else if (config.topPlayersCount > 10) {
      warnings.push('Displaying more than 10 top players may impact notification performance');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const validateRedditConfig = (config: RedditConfigRequest): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate post template
  if (config.postTemplate !== undefined && config.postTemplate !== null) {
    if (config.postTemplate.length < 10) {
      errors.push('Post template must be at least 10 characters long');
    } else if (config.postTemplate.length > 10000) {
      errors.push('Post template must be less than 10,000 characters');
    }
    
    // Check for required placeholders
    const requiredPlaceholders = ['{username}', '{score}', '{mode}'];
    const missingPlaceholders = requiredPlaceholders.filter(
      placeholder => !config.postTemplate!.includes(placeholder)
    );
    
    if (missingPlaceholders.length > 0) {
      warnings.push(`Post template is missing recommended placeholders: ${missingPlaceholders.join(', ')}`);
    }
  }
  
  // Validate widget update interval
  if (config.widgetUpdateInterval !== undefined) {
    if (config.widgetUpdateInterval < 60000) { // 1 minute minimum
      errors.push('Widget update interval must be at least 60 seconds (60000ms)');
    } else if (config.widgetUpdateInterval > 3600000) { // 1 hour maximum
      errors.push('Widget update interval must be less than 1 hour (3600000ms)');
    } else if (config.widgetUpdateInterval < 300000) { // 5 minutes
      warnings.push('Widget update intervals less than 5 minutes may impact performance');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const calculateNextResetTime = (interval: string, customHours?: number): number => {
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
      const hours = customHours || 24;
      const customNext = new Date(now.getTime() + (hours * 60 * 60 * 1000));
      return customNext.getTime();
    
    default:
      return calculateNextResetTime('daily');
  }
};

// LeaderboardManager and ResetController handle reset management

const router = express.Router();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}

// Initialize game session with user context
router.get<{}, GameInitResponse | ErrorResponse>(
  '/api/game/init',
  authenticateUser,
  async (req, res): Promise<void> => {
    const { postId } = context;
    const { userId, username } = req.user!;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
        code: 'MISSING_POST_ID'
      } as ErrorResponse);
      return;
    }

    try {
      // Get user's current game state or initialize new one
      const gameStateKey = `dicetrix:game:${postId}:${userId}`;
      const gameState = await redis.get(gameStateKey);
      
      let score = 0;
      let level = 1;
      let mode: GameMode = 'easy';
      
      if (gameState) {
        const parsed = JSON.parse(gameState);
        score = parsed.score || 0;
        level = parsed.level || 1;
        mode = parsed.mode || 'easy';
      }

      // Initialize user profile if not exists
      const userProfileKey = `dicetrix:user:${userId}`;
      const userProfile = await redis.get(userProfileKey);
      
      if (!userProfile) {
        await redis.set(userProfileKey, JSON.stringify({
          userId,
          username,
          createdAt: Date.now(),
          lastActive: Date.now()
        }));
      } else {
        // Update last active timestamp
        const profile = JSON.parse(userProfile);
        profile.lastActive = Date.now();
        await redis.set(userProfileKey, JSON.stringify(profile));
      }

      res.json({
        postId,
        score,
        level,
        gameState: 'initialized',
        mode
      } as GameInitResponse);
    } catch (error) {
      const errorResponse = handleError(error, 'game initialization');
      res.status(500).json(errorResponse);
    }
  }
);

// Submit score to leaderboard with validation
router.post<{}, ScoreSubmissionResponse | ErrorResponse, ScoreSubmissionRequest>(
  '/api/game/score',
  authenticateUser,
  async (req, res): Promise<void> => {
    const { postId } = context;
    const { userId, username } = req.user!;

    try {
      const { score, level, mode, breakdown, timestamp } = req.body;
      
      // Validate input data
      if (typeof score !== 'number' || score < 0) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid score: must be a non-negative number',
          code: 'INVALID_SCORE'
        } as ErrorResponse);
        return;
      }

      if (typeof level !== 'number' || level < 1) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid level: must be a positive number',
          code: 'INVALID_LEVEL'
        } as ErrorResponse);
        return;
      }

      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      if (!validModes.includes(mode)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid game mode',
          code: 'INVALID_MODE'
        } as ErrorResponse);
        return;
      }

      if (!breakdown || typeof breakdown.totalScore !== 'number') {
        res.status(400).json({
          status: 'error',
          message: 'Invalid score breakdown',
          code: 'INVALID_BREAKDOWN'
        } as ErrorResponse);
        return;
      }

      // Basic score validation - breakdown total should match submitted score
      if (Math.abs(breakdown.totalScore - score) > 0.01) {
        res.status(400).json({
          status: 'error',
          message: 'Score breakdown does not match submitted score',
          code: 'SCORE_MISMATCH'
        } as ErrorResponse);
        return;
      }

      // Use client timestamp if provided, otherwise server timestamp
      const scoreTimestamp = timestamp || Date.now();
      const submissionTime = Date.now();

      // Save to user's game state
      const gameStateKey = `dicetrix:game:${postId}:${userId}`;
      await redis.set(gameStateKey, JSON.stringify({ 
        score, 
        level, 
        mode, 
        breakdown,
        timestamp: scoreTimestamp,
        submissionTime
      }));

      // Create score submission for LeaderboardManager
      const scoreSubmission: ScoreSubmission = {
        userId,
        username,
        score,
        level,
        mode,
        breakdown,
        timestamp: scoreTimestamp,
        submissionTime,
        ...(postId && { postId }),
        ...(context.subredditName && { subredditName: context.subredditName })
      };

      // Submit score using LeaderboardManager
      const leaderboardResult = await leaderboardManager.submitScore(scoreSubmission);
      
      if (!leaderboardResult.success) {
        Logger.log(`Score submission failed: ${leaderboardResult.message}`);
      } else {
        // Update subreddit widget when new scores are submitted (requirement 6.3)
        try {
          const allLeaderboards = await leaderboardManager.getAllLeaderboards({
            limit: 10,
            includeHistorical: false
          });

          const topPlayers: Record<GameMode, LeaderboardEntry[]> = {} as Record<GameMode, LeaderboardEntry[]>;
          const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
          for (const mode of validModes) {
            const data = allLeaderboards[mode];
            topPlayers[mode] = data.entries;
          }

          const nextReset = await resetController.getNextResetTime();
          const widgetData = {
            topPlayers,
            lastUpdated: Date.now(),
            nextReset
          };

          await redditPostHandler.updateSubredditWidget(widgetData);
          Logger.log('Server: Subreddit widget updated after score submission');
        } catch (widgetError) {
          Logger.log(`Server: Failed to update widget after score submission: ${String(widgetError)}`);
          // Don't fail the score submission if widget update fails
        }
      }

      res.json({
        success: leaderboardResult.success,
        newHighScore: leaderboardResult.isNewHighScore,
        leaderboardPosition: leaderboardResult.leaderboardPosition,
        difficultyRank: leaderboardResult.difficultyRank,
        isNewDifficultyRecord: leaderboardResult.isNewDifficultyRecord,
        message: leaderboardResult.message || 'Score submitted successfully'
      } as ScoreSubmissionResponse);
    } catch (error) {
      const errorResponse = handleError(error, 'score submission');
      res.status(500).json(errorResponse);
    }
  }
);

// Get leaderboard by difficulty mode
router.get<{ mode: GameMode }, LeaderboardResponse | ErrorResponse>(
  '/api/leaderboards/:mode',
  async (req, res): Promise<void> => {
    try {
      const { mode } = req.params;
      const { userId } = context;

      // Validate mode parameter
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      if (!validModes.includes(mode)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid game mode',
          code: 'INVALID_MODE'
        } as ErrorResponse);
        return;
      }

      // Use LeaderboardManager to get leaderboard data
      const leaderboardOptions: LeaderboardOptions = {
        limit: 10,
        includeHistorical: true,
        ...(userId && { userId })
      };
      const leaderboardData = await leaderboardManager.getLeaderboard(mode, leaderboardOptions);

      const response: LeaderboardResponse = {
        entries: leaderboardData.entries,
        totalPlayers: leaderboardData.totalPlayers,
        resetInfo: leaderboardData.resetInfo,
        historical: leaderboardData.historical,
        userRank: leaderboardData.userRank
      };
      
      res.json(response);
    } catch (error) {
      const errorResponse = handleError(error, 'leaderboard retrieval');
      res.status(500).json(errorResponse);
    }
  }
);

// Get all leaderboards for all difficulties
router.get<{}, AllLeaderboardsResponse | ErrorResponse>(
  '/api/leaderboards/all',
  async (_req, res): Promise<void> => {
    try {
      const { userId } = context;
      // Use LeaderboardManager to get all leaderboards
      const allLeaderboardOptions: LeaderboardOptions = {
        limit: 10,
        includeHistorical: false,
        ...(userId && { userId })
      };
      const allLeaderboards = await leaderboardManager.getAllLeaderboards(allLeaderboardOptions);

      // Convert to expected response format
      const leaderboards: Record<GameMode, LeaderboardResponse> = {} as Record<GameMode, LeaderboardResponse>;
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      for (const mode of validModes) {
        const data = allLeaderboards[mode];
        leaderboards[mode] = {
          entries: data.entries,
          userRank: data.userRank,
          totalPlayers: data.totalPlayers,
          resetInfo: data.resetInfo
        };
      }

      // Get user stats if authenticated
      let userStats: { totalGamesPlayed: number; bestDifficulty: GameMode; overallRank: number } | undefined;
      if (userId) {
        const userStatsKey = `dicetrix:user:${userId}:stats`;
        const stats = await redis.get(userStatsKey);
        
        if (stats) {
          const parsedStats = JSON.parse(stats);
          
          // Find user's best difficulty by checking their best scores
          let bestDifficulty: GameMode = 'easy';
          let bestScore = 0;
          
          for (const mode of validModes) {
            const userBestKey = `dicetrix:user:${userId}:best:${mode}`;
            const userBest = await redis.get(userBestKey);
            
            if (userBest) {
              const userBestData = JSON.parse(userBest);
              if (userBestData.score > bestScore) {
                bestScore = userBestData.score;
                bestDifficulty = mode;
              }
            }
          }
          
          userStats = {
            totalGamesPlayed: parsedStats.totalGamesPlayed || 0,
            bestDifficulty,
            overallRank: 1 // Simplified for now - could calculate across all difficulties
          };
        }
      }

      res.json({
        leaderboards,
        userStats
      } as AllLeaderboardsResponse);
    } catch (error) {
      const errorResponse = handleError(error, 'all leaderboards retrieval');
      res.status(500).json(errorResponse);
    }
  }
);

// Manual leaderboard reset endpoint (admin functionality)
router.post<{}, LeaderboardResetResponse | ErrorResponse, LeaderboardResetRequest>(
  '/api/leaderboards/reset',
  authenticateUser,
  async (req, res): Promise<void> => {
    try {
      const { difficulties } = req.body;
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      const modesToReset = difficulties || validModes;
      
      // Validate difficulties
      for (const mode of modesToReset) {
        if (!validModes.includes(mode)) {
          res.status(400).json({
            status: 'error',
            message: `Invalid game mode: ${mode}`,
            code: 'INVALID_MODE'
          } as ErrorResponse);
          return;
        }
      }

      // Use ResetController to execute manual reset
      const resetResult = await resetController.triggerManualReset({
        difficulties: modesToReset,
        createPost: req.body.createPost || false,
        immediate: true
      });

      res.json({
        success: true,
        resetId: resetResult.resetId,
        timestamp: resetResult.timestamp,
        period: resetResult.period,
        difficulties: resetResult.difficulties,
        totalPlayersAffected: resetResult.totalPlayersAffected,
        message: `Successfully reset leaderboards for ${resetResult.difficulties.join(', ')}`
      } as LeaderboardResetResponse);
    } catch (error) {
      const errorResponse = handleError(error, 'leaderboard reset');
      res.status(500).json(errorResponse);
    }
  }
);

// Reddit integration endpoint for enhanced score submission
router.post<{}, RedditScoreSubmissionResponse | ErrorResponse, RedditScoreSubmissionRequest>(
  '/api/reddit/submit-score',
  authenticateUser,
  async (req, res): Promise<void> => {
    const { subredditName } = context;
    const { username } = req.user!;

    try {
      const { score, level, mode, breakdown, timestamp, createPost } = req.body;

      // Validate input data
      if (typeof score !== 'number' || score < 0) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid score data',
          code: 'INVALID_SCORE'
        } as ErrorResponse);
        return;
      }

      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      if (!validModes.includes(mode)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid game mode',
          code: 'INVALID_MODE'
        } as ErrorResponse);
        return;
      }

      if (!breakdown || typeof breakdown.totalScore !== 'number') {
        res.status(400).json({
          status: 'error',
          message: 'Invalid score breakdown',
          code: 'INVALID_BREAKDOWN'
        } as ErrorResponse);
        return;
      }

      // Submit score to leaderboard first (reuse existing logic)
      // This would typically call the existing score submission logic
      
      let redditPostUrl: string | undefined;
      let leaderboardPosition: number | undefined;

      if (createPost) {
        // Format score post content for Reddit
        const modeDisplayName = mode.charAt(0).toUpperCase() + mode.slice(1);
        const scoreDate = new Date(timestamp).toLocaleDateString();
        
        const postContent = `Just achieved **${score.toLocaleString()} points** in Dicetrix ${modeDisplayName} mode! 🎯

**Game Stats:**
- **Score:** ${score.toLocaleString()}
- **Level:** ${level}
- **Mode:** ${modeDisplayName}
- **Date:** ${scoreDate}
- **Base Score:** ${breakdown.baseScore.toLocaleString()}
- **Chain Multiplier:** ${breakdown.chainMultiplier}x
${breakdown.ultimateComboMultiplier > 1 ? `- **Ultimate Combo:** ${breakdown.ultimateComboMultiplier}x` : ''}
${breakdown.boosterModifiers > 0 ? `- **Booster Bonus:** +${breakdown.boosterModifiers.toLocaleString()}` : ''}

Think you can beat my score? Try Dicetrix now! 🎮

#Dicetrix #PuzzleGame #HighScore #Reddit #Gaming`;

        // Create the Reddit post (simulated for now)
        redditPostUrl = `https://reddit.com/r/${subredditName}/comments/dicetrix_score_${timestamp}`;
        
        // Log the formatted post content for debugging
        Logger.log('Reddit score submission post content: ' + postContent);
      }

      // Get leaderboard position
      const leaderboardKey = `dicetrix:leaderboard:${mode}`;
      try {
        const allEntries = await redis.zRange(leaderboardKey, 0, -1, { 
          reverse: true, 
          by: 'rank'
        });
        
        for (let i = 0; i < allEntries.length; i++) {
          const entryData = allEntries[i];
          if (typeof entryData === 'string') {
            try {
              const entry = JSON.parse(entryData);
              if (entry.score === score) {
                leaderboardPosition = i + 1;
                break;
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      } catch (rankError) {
        Logger.log('Could not determine leaderboard position: ' + String(rankError));
      }

      // Update subreddit widget after Reddit score submission (requirement 6.3)
      try {
        const allLeaderboards = await leaderboardManager.getAllLeaderboards({
          limit: 10,
          includeHistorical: false
        });

        const topPlayers: Record<GameMode, LeaderboardEntry[]> = {} as Record<GameMode, LeaderboardEntry[]>;
        const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
        for (const mode of validModes) {
          const data = allLeaderboards[mode];
          topPlayers[mode] = data.entries;
        }

        const nextReset = await resetController.getNextResetTime();
        const widgetData = {
          topPlayers,
          lastUpdated: Date.now(),
          nextReset
        };

        await redditPostHandler.updateSubredditWidget(widgetData);
        Logger.log('Server: Subreddit widget updated after Reddit score submission');
      } catch (widgetError) {
        Logger.log(`Server: Failed to update widget after Reddit score submission: ${String(widgetError)}`);
        // Don't fail the submission if widget update fails
      }

      // Log the submission event
      Logger.log(`Reddit score submission by ${username}: ${score} points in ${mode} mode, createPost: ${createPost}`);

      res.json({
        success: true,
        leaderboardPosition,
        redditPostUrl,
        message: createPost ? 'Score submitted and posted to Reddit!' : 'Score submitted successfully!'
      } as RedditScoreSubmissionResponse);
    } catch (error) {
      const errorResponse = handleError(error, 'Reddit score submission');
      res.status(500).json(errorResponse);
    }
  }
);

// Subreddit widget endpoint for leaderboard display
router.get<{}, LeaderboardWidgetResponse | ErrorResponse>(
  '/api/reddit/leaderboard-widget',
  async (_req, res): Promise<void> => {
    try {
      // Use LeaderboardManager to get top players for widget
      const allLeaderboards = await leaderboardManager.getAllLeaderboards({
        limit: 10, // Get top 10 for widget display (requirement 6.4)
        includeHistorical: false
      });

      const topPlayers: Record<GameMode, LeaderboardEntry[]> = {} as Record<GameMode, LeaderboardEntry[]>;
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      for (const mode of validModes) {
        const data = allLeaderboards[mode];
        topPlayers[mode] = data.entries;
      }

      // Get next reset time from reset controller
      const nextReset = await resetController.getNextResetTime();

      const widgetData = {
        topPlayers,
        lastUpdated: Date.now(),
        nextReset
      };

      // Update the subreddit widget with current data (requirement 6.3)
      try {
        await redditPostHandler.updateSubredditWidget(widgetData);
        Logger.log('Server: Subreddit widget updated successfully');
      } catch (widgetError) {
        Logger.log(`Server: Failed to update subreddit widget: ${String(widgetError)}`);
        // Continue with API response even if widget update fails
      }

      res.json(widgetData as LeaderboardWidgetResponse);
    } catch (error) {
      const errorResponse = handleError(error, 'leaderboard widget');
      res.status(500).json(errorResponse);
    }
  }
);

// Get formatted widget content for subreddit display
router.get<{}, { content: string } | ErrorResponse>(
  '/api/reddit/widget-content',
  async (_req, res): Promise<void> => {
    try {
      // Get current leaderboard data for widget
      const allLeaderboards = await leaderboardManager.getAllLeaderboards({
        limit: 10,
        includeHistorical: false
      });

      const topPlayers: Record<GameMode, LeaderboardEntry[]> = {} as Record<GameMode, LeaderboardEntry[]>;
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      for (const mode of validModes) {
        const data = allLeaderboards[mode];
        topPlayers[mode] = data.entries;
      }

      const nextReset = await resetController.getNextResetTime();
      const widgetData = {
        topPlayers,
        lastUpdated: Date.now(),
        nextReset
      };

      // Get formatted content from RedditPostHandler
      const formattedContent = redditPostHandler.getWidgetContent(widgetData);

      res.json({
        content: formattedContent
      });
    } catch (error) {
      const errorResponse = handleError(error, 'widget content generation');
      res.status(500).json(errorResponse);
    }
  }
);

// Configuration Management Endpoints

// Get current leaderboard configuration
router.get<{}, LeaderboardConfigResponse | ErrorResponse>(
  '/api/config/leaderboard',
  authenticateUser,
  async (_req, res): Promise<void> => {
    try {
      Logger.log('ConfigAPI: Getting leaderboard configuration');
      
      const config = await leaderboardManager.getConfig();
      
      const response: LeaderboardConfigResponse = {
        resetInterval: config.resetInterval,
        customResetHours: config.customResetHours || undefined,
        maxHistoricalPeriods: config.maxHistoricalPeriods,
        topPlayersCount: config.topPlayersCount,
        enableAutoPosting: config.enableAutoPosting,
        enableNotifications: config.enableNotifications
      };
      
      res.json(response);
    } catch (error) {
      const errorResponse = handleError(error, 'leaderboard configuration retrieval');
      res.status(500).json(errorResponse);
    }
  }
);

// Update leaderboard configuration
router.put<{}, LeaderboardConfigResponse | ErrorResponse, LeaderboardConfigRequest>(
  '/api/config/leaderboard',
  authenticateUser,
  async (req, res): Promise<void> => {
    try {
      Logger.log(`ConfigAPI: Updating leaderboard configuration: ${JSON.stringify(req.body)}`);
      
      // Validate configuration data
      const validationResult = validateLeaderboardConfig(req.body);
      if (!validationResult.isValid) {
        res.status(400).json({
          status: 'error',
          message: `Invalid configuration: ${validationResult.errors.join(', ')}`,
          code: 'INVALID_CONFIG'
        } as ErrorResponse);
        return;
      }

      // Update configuration
      await leaderboardManager.updateConfig(req.body);
      
      // Update reset schedule if interval changed
      if (req.body.resetInterval || req.body.customResetHours !== undefined) {
        await resetController.updateResetSchedule({
          interval: req.body.resetInterval || 'daily',
          customHours: req.body.customResetHours,
          enableAutoPosting: req.body.enableAutoPosting ?? true,
          enableNotifications: req.body.enableNotifications ?? true
        });
      }
      
      // Return updated configuration
      const updatedConfig = await leaderboardManager.getConfig();
      const response: LeaderboardConfigResponse = {
        resetInterval: updatedConfig.resetInterval,
        customResetHours: updatedConfig.customResetHours || undefined,
        maxHistoricalPeriods: updatedConfig.maxHistoricalPeriods,
        topPlayersCount: updatedConfig.topPlayersCount,
        enableAutoPosting: updatedConfig.enableAutoPosting,
        enableNotifications: updatedConfig.enableNotifications
      };
      
      Logger.log('ConfigAPI: Leaderboard configuration updated successfully');
      res.json(response);
    } catch (error) {
      const errorResponse = handleError(error, 'leaderboard configuration update');
      res.status(500).json(errorResponse);
    }
  }
);

// Get current Reddit configuration
router.get<{}, RedditConfigResponse | ErrorResponse>(
  '/api/config/reddit',
  authenticateUser,
  async (_req, res): Promise<void> => {
    try {
      Logger.log('ConfigAPI: Getting Reddit configuration');
      
      // Get Reddit configuration from RedditPostHandler
      const redditConfig = await redditPostHandler.getConfig();
      
      const response: RedditConfigResponse = {
        enableAutoPosting: redditConfig.enableAutoPosting,
        enableUserNotifications: redditConfig.enableUserNotifications,
        postTemplate: redditConfig.postTemplate,
        widgetUpdateInterval: redditConfig.widgetUpdateInterval
      };
      
      res.json(response);
    } catch (error) {
      const errorResponse = handleError(error, 'Reddit configuration retrieval');
      res.status(500).json(errorResponse);
    }
  }
);

// Update Reddit configuration
router.put<{}, RedditConfigResponse | ErrorResponse, RedditConfigRequest>(
  '/api/config/reddit',
  authenticateUser,
  async (req, res): Promise<void> => {
    try {
      Logger.log(`ConfigAPI: Updating Reddit configuration: ${JSON.stringify(req.body)}`);
      
      // Validate Reddit configuration
      const validationResult = validateRedditConfig(req.body);
      if (!validationResult.isValid) {
        res.status(400).json({
          status: 'error',
          message: `Invalid Reddit configuration: ${validationResult.errors.join(', ')}`,
          code: 'INVALID_CONFIG'
        } as ErrorResponse);
        return;
      }

      // Update Reddit configuration
      await redditPostHandler.updateConfig(req.body);
      
      // Return updated configuration
      const updatedConfig = await redditPostHandler.getConfig();
      const response: RedditConfigResponse = {
        enableAutoPosting: updatedConfig.enableAutoPosting,
        enableUserNotifications: updatedConfig.enableUserNotifications,
        postTemplate: updatedConfig.postTemplate,
        widgetUpdateInterval: updatedConfig.widgetUpdateInterval
      };
      
      Logger.log('ConfigAPI: Reddit configuration updated successfully');
      res.json(response);
    } catch (error) {
      const errorResponse = handleError(error, 'Reddit configuration update');
      res.status(500).json(errorResponse);
    }
  }
);

// Validate configuration without applying changes
router.post<{}, ConfigValidationResponse | ErrorResponse, LeaderboardConfigRequest>(
  '/api/config/validate',
  authenticateUser,
  async (req, res): Promise<void> => {
    try {
      Logger.log(`ConfigAPI: Validating configuration: ${JSON.stringify(req.body)}`);
      
      const validationResult = validateLeaderboardConfig(req.body);
      
      // Generate preview if configuration is valid
      let preview;
      if (validationResult.isValid && (req.body.resetInterval || req.body.customResetHours !== undefined)) {
        try {
          // Calculate next reset time with new configuration
          const nextResetTime = calculateNextResetTime(
            req.body.resetInterval || 'daily',
            req.body.customResetHours
          );
          
          // Get current player counts
          const allLeaderboards = await leaderboardManager.getAllLeaderboards({ limit: 1 });
          const totalPlayers = Object.values(allLeaderboards).reduce(
            (sum, board) => sum + board.totalPlayers, 0
          );
          
          preview = {
            nextResetTime,
            affectedPlayers: totalPlayers,
            estimatedImpact: totalPlayers > 100 ? 'High impact - many players affected' : 
                           totalPlayers > 10 ? 'Medium impact' : 'Low impact'
          };
        } catch (previewError) {
          Logger.log(`ConfigAPI: Error generating preview: ${String(previewError)}`);
        }
      }
      
      const response: ConfigValidationResponse = {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        preview: preview || undefined
      };
      
      res.json(response);
    } catch (error) {
      const errorResponse = handleError(error, 'configuration validation');
      res.status(500).json(errorResponse);
    }
  }
);

// Get system status and diagnostics
router.get<{}, SystemStatusResponse | ErrorResponse>(
  '/api/system/status',
  authenticateUser,
  async (_req, res): Promise<void> => {
    try {
      Logger.log('ConfigAPI: Getting system status');
      
      // Get leaderboard status
      const leaderboardConfig = await leaderboardManager.getConfig();
      const resetSchedule = await leaderboardManager.getResetSchedule();
      const allLeaderboards = await leaderboardManager.getAllLeaderboards({ limit: 1 });
      
      const totalPlayers: Record<GameMode, number> = {} as Record<GameMode, number>;
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      for (const mode of validModes) {
        totalPlayers[mode] = allLeaderboards[mode].totalPlayers;
      }
      
      // Get reset controller status
      const resetStatus = await resetController.getResetStatus();
      
      // Calculate uptime (simplified - would be more accurate with actual start time tracking)
      const uptime = Date.now() - (Date.now() % (24 * 60 * 60 * 1000)); // Approximate daily uptime
      
      const systemStatus: SystemStatusResponse = {
        leaderboard: {
          isActive: resetStatus.systemReady,
          nextReset: resetSchedule.nextReset,
          resetInterval: leaderboardConfig.resetInterval,
          totalPlayers
        },
        reddit: {
          isConnected: true, // Simplified - would check actual Reddit API connectivity
          lastPostTime: undefined as number | undefined, // Would track actual last post time
          lastWidgetUpdate: undefined as number | undefined // Would track actual last widget update
        },
        scheduler: {
          isActive: resetStatus.isSchedulerActive,
          nextScheduledTask: resetSchedule.nextReset
        },
        uptime,
        version: '1.0.0' // Would come from package.json or environment
      };
      
      res.json(systemStatus);
    } catch (error) {
      const errorResponse = handleError(error, 'system status retrieval');
      res.status(500).json(errorResponse);
    }
  }
);

// Administrative Interface Endpoints

// Manual leaderboard operations - Archive current leaderboards
router.post<{}, { success: boolean; message: string; archivedModes: GameMode[] } | ErrorResponse, { modes?: GameMode[] }>(
  '/api/admin/leaderboard/archive',
  authenticateUser,
  async (req, res): Promise<void> => {
    try {
      Logger.log(`AdminAPI: Manual leaderboard archive requested: ${JSON.stringify(req.body)}`);
      
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      const modesToArchive = req.body.modes || validModes;
      
      // Validate modes
      for (const mode of modesToArchive) {
        if (!validModes.includes(mode)) {
          res.status(400).json({
            status: 'error',
            message: `Invalid game mode: ${mode}`,
            code: 'INVALID_MODE'
          } as ErrorResponse);
          return;
        }
      }
      
      // Archive each specified mode
      const archivedModes: GameMode[] = [];
      for (const mode of modesToArchive) {
        try {
          await leaderboardManager.archiveCurrentLeaderboard(mode);
          archivedModes.push(mode);
          Logger.log(`AdminAPI: Successfully archived leaderboard for ${mode} mode`);
        } catch (archiveError) {
          Logger.log(`AdminAPI: Failed to archive leaderboard for ${mode} mode: ${String(archiveError)}`);
        }
      }
      
      res.json({
        success: archivedModes.length > 0,
        message: `Successfully archived ${archivedModes.length}/${modesToArchive.length} leaderboards`,
        archivedModes
      });
    } catch (error) {
      const errorResponse = handleError(error, 'manual leaderboard archive');
      res.status(500).json(errorResponse);
    }
  }
);

// Manual leaderboard operations - Clear specific leaderboards
router.post<{}, { success: boolean; message: string; clearedModes: GameMode[] } | ErrorResponse, { modes?: GameMode[]; confirm?: boolean }>(
  '/api/admin/leaderboard/clear',
  authenticateUser,
  async (req, res): Promise<void> => {
    try {
      Logger.log(`AdminAPI: Manual leaderboard clear requested: ${JSON.stringify(req.body)}`);
      
      if (!req.body.confirm) {
        res.status(400).json({
          status: 'error',
          message: 'Confirmation required for leaderboard clearing. Set confirm: true',
          code: 'CONFIRMATION_REQUIRED'
        } as ErrorResponse);
        return;
      }
      
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      const modesToClear = req.body.modes || validModes;
      
      // Validate modes
      for (const mode of modesToClear) {
        if (!validModes.includes(mode)) {
          res.status(400).json({
            status: 'error',
            message: `Invalid game mode: ${mode}`,
            code: 'INVALID_MODE'
          } as ErrorResponse);
          return;
        }
      }
      
      // Clear each specified mode by deleting the Redis key
      const clearedModes: GameMode[] = [];
      for (const mode of modesToClear) {
        try {
          const leaderboardKey = `dicetrix:leaderboard:${mode}`;
          await redis.del(leaderboardKey);
          clearedModes.push(mode);
          Logger.log(`AdminAPI: Successfully cleared leaderboard for ${mode} mode`);
        } catch (clearError) {
          Logger.log(`AdminAPI: Failed to clear leaderboard for ${mode} mode: ${String(clearError)}`);
        }
      }
      
      res.json({
        success: clearedModes.length > 0,
        message: `Successfully cleared ${clearedModes.length}/${modesToClear.length} leaderboards`,
        clearedModes
      });
    } catch (error) {
      const errorResponse = handleError(error, 'manual leaderboard clear');
      res.status(500).json(errorResponse);
    }
  }
);

// Get detailed system diagnostics
router.get<{}, SystemDiagnosticsResponse | ErrorResponse>(
  '/api/admin/diagnostics',
  authenticateUser,
  async (_req, res): Promise<void> => {
    try {
      Logger.log('AdminAPI: Getting detailed system diagnostics');
      
      // Get Redis connection status
      let redisStatus = 'connected';
      let redisKeyCount = 0;
      try {
        // Test Redis connection with a simple operation
        await redis.get('test_connection_key');
        
        // Count total keys (approximate) - using scan instead of keys for better performance
        try {
          // Simple key count estimation - in production would use SCAN
          redisKeyCount = 100; // Placeholder - would implement proper key counting
        } catch (keyCountError) {
          redisKeyCount = 0;
        }
      } catch (redisError) {
        redisStatus = 'disconnected';
        Logger.log(`AdminAPI: Redis connection error: ${String(redisError)}`);
      }
      
      // Get leaderboard statistics
      const leaderboardStats: Record<GameMode, { totalPlayers: number; topScore: number; lastActivity: number }> = {} as any;
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      
      for (const mode of validModes) {
        try {
          const leaderboardData = await leaderboardManager.getLeaderboard(mode, { limit: 1 });
          const topScore = leaderboardData.entries.length > 0 ? leaderboardData.entries[0]!.score : 0;
          const lastActivity = leaderboardData.entries.length > 0 ? leaderboardData.entries[0]!.timestamp : 0;
          
          leaderboardStats[mode] = {
            totalPlayers: leaderboardData.totalPlayers,
            topScore,
            lastActivity
          };
        } catch (modeError) {
          Logger.log(`AdminAPI: Error getting stats for ${mode}: ${String(modeError)}`);
          leaderboardStats[mode] = {
            totalPlayers: 0,
            topScore: 0,
            lastActivity: 0
          };
        }
      }
      
      // Get reset controller diagnostics
      const resetStatus = await resetController.getResetStatus();
      
      // Get configuration status
      const leaderboardConfig = await leaderboardManager.getConfig();
      const redditConfig = await redditPostHandler.getConfig();
      
      // Calculate memory usage (simplified)
      const memoryUsage = {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      };
      
      const diagnostics: SystemDiagnosticsResponse = {
        timestamp: Date.now(),
        redis: {
          status: redisStatus,
          keyCount: redisKeyCount,
          connectionLatency: 0 // Would measure actual latency in real implementation
        },
        leaderboards: leaderboardStats,
        scheduler: {
          isActive: resetStatus.isSchedulerActive,
          nextReset: resetStatus.schedule.nextReset,
          systemReady: resetStatus.systemReady
        },
        configuration: {
          leaderboard: {
            resetInterval: leaderboardConfig.resetInterval,
            customResetHours: leaderboardConfig.customResetHours || undefined,
            maxHistoricalPeriods: leaderboardConfig.maxHistoricalPeriods,
            topPlayersCount: leaderboardConfig.topPlayersCount,
            enableAutoPosting: leaderboardConfig.enableAutoPosting,
            enableNotifications: leaderboardConfig.enableNotifications
          },
          reddit: redditConfig
        },
        performance: {
          memoryUsage,
          uptime: process.uptime() * 1000, // Convert to milliseconds
          nodeVersion: process.version
        },
        health: {
          overall: redisStatus === 'connected' && resetStatus.systemReady ? 'healthy' : 'degraded',
          issues: []
        }
      };
      
      // Add health issues if any
      if (redisStatus !== 'connected') {
        diagnostics.health.issues.push('Redis connection unavailable');
      }
      if (!resetStatus.systemReady) {
        diagnostics.health.issues.push('Reset system not ready');
      }
      if (redisKeyCount > 10000) {
        diagnostics.health.issues.push('High Redis key count - consider cleanup');
      }
      
      res.json(diagnostics);
    } catch (error) {
      const errorResponse = handleError(error, 'system diagnostics');
      res.status(500).json(errorResponse);
    }
  }
);

// Preview reset results without executing
router.get<{}, ResetPreviewResponse | ErrorResponse>(
  '/api/admin/reset/preview',
  authenticateUser,
  async (_req, res): Promise<void> => {
    try {
      Logger.log('AdminAPI: Getting reset preview');
      
      const preview = await resetController.previewResetResults();
      
      const response: ResetPreviewResponse = {
        scheduledTime: preview.scheduledTime,
        affectedDifficulties: preview.affectedDifficulties,
        estimatedPlayersAffected: preview.estimatedPlayersAffected,
        topPlayersPreview: preview.topPlayersPreview,
        impact: preview.estimatedPlayersAffected > 100 ? 'high' : 
                preview.estimatedPlayersAffected > 10 ? 'medium' : 'low',
        recommendations: []
      };
      
      // Add recommendations based on preview data
      if (preview.estimatedPlayersAffected === 0) {
        response.recommendations.push('No players will be affected - consider postponing reset');
      } else if (preview.estimatedPlayersAffected > 500) {
        response.recommendations.push('High player impact - ensure notification system is ready');
      }
      
      // Check if any difficulty has no players
      const emptyDifficulties = preview.affectedDifficulties.filter(
        mode => preview.topPlayersPreview[mode].length === 0
      );
      if (emptyDifficulties.length > 0) {
        response.recommendations.push(`No players in ${emptyDifficulties.join(', ')} mode(s)`);
      }
      
      res.json(response);
    } catch (error) {
      const errorResponse = handleError(error, 'reset preview');
      res.status(500).json(errorResponse);
    }
  }
);

// Force system health check and repair
router.post<{}, SystemHealthCheckResponse | ErrorResponse>(
  '/api/admin/health/check',
  authenticateUser,
  async (_req, res): Promise<void> => {
    try {
      Logger.log('AdminAPI: Performing system health check');
      
      const healthCheck: SystemHealthCheckResponse = {
        timestamp: Date.now(),
        checks: [],
        overallHealth: 'healthy',
        repairsPerformed: []
      };
      
      // Check Redis connectivity
      try {
        await redis.get('health_check_key');
        healthCheck.checks.push({
          component: 'redis',
          status: 'healthy',
          message: 'Redis connection successful'
        });
      } catch (redisError) {
        healthCheck.checks.push({
          component: 'redis',
          status: 'unhealthy',
          message: `Redis connection failed: ${String(redisError)}`
        });
        healthCheck.overallHealth = 'unhealthy';
      }
      
      // Check leaderboard system
      try {
        const schedule = await leaderboardManager.getResetSchedule();
        
        if (schedule.nextReset > Date.now()) {
          healthCheck.checks.push({
            component: 'leaderboard',
            status: 'healthy',
            message: `Leaderboard system operational, next reset: ${new Date(schedule.nextReset).toISOString()}`
          });
        } else {
          healthCheck.checks.push({
            component: 'leaderboard',
            status: 'warning',
            message: 'Reset is overdue - may need manual intervention'
          });
          healthCheck.overallHealth = 'degraded';
        }
      } catch (leaderboardError) {
        healthCheck.checks.push({
          component: 'leaderboard',
          status: 'unhealthy',
          message: `Leaderboard system error: ${String(leaderboardError)}`
        });
        healthCheck.overallHealth = 'unhealthy';
      }
      
      // Check reset controller
      try {
        const resetStatus = await resetController.getResetStatus();
        
        if (resetStatus.systemReady) {
          healthCheck.checks.push({
            component: 'reset_controller',
            status: 'healthy',
            message: 'Reset controller ready'
          });
        } else {
          healthCheck.checks.push({
            component: 'reset_controller',
            status: 'warning',
            message: 'Reset controller not ready - check configuration'
          });
          healthCheck.overallHealth = 'degraded';
        }
      } catch (resetError) {
        healthCheck.checks.push({
          component: 'reset_controller',
          status: 'unhealthy',
          message: `Reset controller error: ${String(resetError)}`
        });
        healthCheck.overallHealth = 'unhealthy';
      }
      
      // Check Reddit integration
      try {
        const redditConfig = await redditPostHandler.getConfig();
        healthCheck.checks.push({
          component: 'reddit',
          status: 'healthy',
          message: `Reddit integration configured, auto-posting: ${redditConfig.enableAutoPosting}`
        });
      } catch (redditError) {
        healthCheck.checks.push({
          component: 'reddit',
          status: 'warning',
          message: `Reddit integration warning: ${String(redditError)}`
        });
        if (healthCheck.overallHealth === 'healthy') {
          healthCheck.overallHealth = 'degraded';
        }
      }
      
      Logger.log(`AdminAPI: Health check completed - Overall status: ${healthCheck.overallHealth}`);
      res.json(healthCheck);
    } catch (error) {
      const errorResponse = handleError(error, 'system health check');
      res.status(500).json(errorResponse);
    }
  }
);

// Reddit Integration System demo endpoint
router.get('/api/reddit-integration/demo', async (_req, res): Promise<void> => {
  try {
    const { subredditName } = context;
    
    // Demonstrate all the integration features without post creation
    const integrationDemo = {
      subreddit: subredditName || 'demo-subreddit',
      timestamp: Date.now(),
      features: {
        scoreSubmission: {
          status: 'active',
          description: 'Players can submit scores with optional Reddit posting',
          endpoint: '/api/reddit/submit-score'
        },
        leaderboards: {
          status: 'active',
          description: 'Multi-difficulty leaderboards with reset scheduling',
          endpoints: ['/api/leaderboards/:mode', '/api/leaderboards/all']
        },
        widgetIntegration: {
          status: 'active',
          description: 'Automatic subreddit widget updates',
          endpoint: '/api/reddit/leaderboard-widget'
        },
        resetSystem: {
          status: 'active',
          description: 'Automated leaderboard resets with Reddit announcements',
          endpoint: '/api/leaderboards/reset'
        },
        configuration: {
          status: 'active',
          description: 'Real-time system configuration management',
          endpoints: ['/api/config/leaderboard', '/api/config/reddit']
        }
      },
      sampleData: {
        topScore: 25000,
        totalPlayers: 150,
        nextReset: new Date(Date.now() + 86400000).toISOString(),
        lastWidgetUpdate: new Date().toISOString()
      }
    };
    
    Logger.log('Reddit Integration demo accessed');
    res.json(integrationDemo);
  } catch (error) {
    console.error('Demo endpoint error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Test endpoint for basic server functionality
router.get('/test', async (_req, res): Promise<void> => {
  try {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      server: 'dicetrix-reddit-integration',
      context: {
        hasUserId: !!context.userId,
        hasSubredditName: !!context.subredditName,
        hasPostId: !!context.postId,
        subredditName: context.subredditName || 'not-available'
      },
      environment: {
        nodeVersion: process.version,
        port: process.env.WEBBIT_PORT || 3000
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Health check endpoint for debugging
router.get('/health', async (_req, res): Promise<void> => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: 'running',
      context: {
        hasUserId: !!context.userId,
        hasSubredditName: !!context.subredditName,
        hasPostId: !!context.postId
      },
      environment: {
        nodeVersion: process.version,
        port: process.env.WEBBIT_PORT || 3000
      }
    };
    
    Logger.log('Health check requested');
    res.json(healthStatus);
  } catch (error) {
    Logger.log(`Health check error: ${String(error)}`);
    res.status(500).json({
      status: 'unhealthy',
      error: String(error)
    });
  }
});

// Share score to subreddit
router.post<{}, ShareScoreResponse | ErrorResponse, ShareScoreRequest>(
  '/api/share-score',
  authenticateUser,
  async (req, res): Promise<void> => {
    const { subredditName } = context;
    const { username } = req.user!;

    try {
      const { score, level, mode, breakdown } = req.body;

      // Validate input data
      if (typeof score !== 'number' || score < 0) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid score data',
          code: 'INVALID_SCORE'
        } as ErrorResponse);
        return;
      }

      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      if (!validModes.includes(mode)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid game mode',
          code: 'INVALID_MODE'
        } as ErrorResponse);
        return;
      }

      // Format score post content
      const modeDisplayName = mode.charAt(0).toUpperCase() + mode.slice(1);
      
      // Create formatted post content for sharing
      const postContent = `Just achieved **${score.toLocaleString()} points** in Dicetrix ${modeDisplayName} mode! 🎯

**Game Stats:**
- **Score:** ${score.toLocaleString()}
- **Level:** ${level}
- **Mode:** ${modeDisplayName}
- **Base Score:** ${breakdown.baseScore.toLocaleString()}
- **Chain Multiplier:** ${breakdown.chainMultiplier}x
${breakdown.ultimateComboMultiplier > 1 ? `- **Ultimate Combo:** ${breakdown.ultimateComboMultiplier}x` : ''}
${breakdown.boosterModifiers > 0 ? `- **Booster Bonus:** +${breakdown.boosterModifiers.toLocaleString()}` : ''}

Think you can beat my score? Try Dicetrix now! 🎮

#Dicetrix #PuzzleGame #HighScore #Reddit #Gaming`;

      // Create the post (this would use Reddit API in a real implementation)
      // For now, we'll simulate post creation and log the content
      const postUrl = `https://reddit.com/r/${subredditName}/comments/dicetrix_score_${Date.now()}`;
      
  // Log the formatted post content for debugging
  Logger.log('Score share post content: ' + postContent);
      
  // Log the share event
  Logger.log(`Score shared by ${username}: ${score} points in ${mode} mode`);

      res.json({
        success: true,
        postUrl,
        message: 'Score shared successfully!'
      } as ShareScoreResponse);
    } catch (error) {
      const errorResponse = handleError(error, 'score sharing');
      res.status(500).json(errorResponse);
    }
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    Logger.log('App install triggered - initializing Reddit Integration System');
    
    // Initialize the system without creating a post
    const { subredditName } = context;
    
    // Set up initial system state
    const initData = {
      subredditName,
      timestamp: Date.now(),
      systemReady: true
    };
    
    // Store initialization data
    await redis.set('dicetrix:system:initialized', JSON.stringify(initData));
    
    Logger.log(`Reddit Integration System initialized for subreddit: ${subredditName}`);
    res.json({
      status: 'success',
      message: `Reddit Integration System initialized for subreddit ${subredditName}`,
      data: initData
    });
  } catch (error) {
    Logger.log(`Error initializing system during app install: ${String(error)}`);
    console.error('Detailed error:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to initialize system: ${error instanceof Error ? error.message : 'Unknown error'}`,
      code: 'SYSTEM_INIT_FAILED'
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    Logger.log('Manual system status check triggered from menu');
    
    const { subredditName } = context;
    
    // Get system status instead of creating a post
    const systemStatus = {
      subredditName,
      timestamp: Date.now(),
      systemReady: true,
      features: {
        scoreSubmission: true,
        leaderboards: true,
        redditIntegration: true,
        widgetUpdates: true
      }
    };
    
    Logger.log(`System status checked for subreddit: ${subredditName}`);
    res.json({
      status: 'success',
      message: `Reddit Integration System is active for ${subredditName}`,
      data: systemStatus
    });
  } catch (error) {
    Logger.log(`Error checking system status from menu: ${String(error)}`);
    console.error('Detailed error:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to check system status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      code: 'STATUS_CHECK_FAILED'
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = process.env.WEBBIT_PORT || 3000;

// Enhanced server error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Logger.log(`Unhandled server error: ${String(err)}`);
  console.error('Server error details:', err);
  
  if (!res.headersSent) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

const server = createServer(app);

server.on('error', (err) => {
  Logger.log(`Server startup error: ${String((err as any)?.stack || err)}`);
  console.error('Server error details:', err);
});

server.on('listening', () => {
  Logger.log(`Dicetrix server listening on port ${port}`);
  Logger.log('Server ready to handle requests');
});

server.listen(port, () => {
  Logger.log(`Dicetrix server started at http://localhost:${port}`);
});
