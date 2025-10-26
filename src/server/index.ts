import express from 'express';
import { createServer, context } from '@devvit/web/server';
import { Devvit } from '@devvit/public-api';
import { LeaderboardManager } from './core/LeaderboardManager';
import { RedditPostHandler } from './core/RedditPostHandler';
import { ResetController } from './core/ResetController';
import { DevvitTaskScheduler } from './core/TaskScheduler';
import { GameMode } from '../shared/types/game';
import { RedditScoreSubmissionRequest, RedditScoreSubmissionResponse } from '../shared/types/api';

// Configure Devvit capabilities
Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
});

// Add menu item to create game posts
Devvit.addMenuItem({
  label: 'Create Dicetrix Game Post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    try {
      const { reddit } = context;
      const subredditName = context.subredditName;
      
      if (!subredditName) {
        context.ui.showToast({
          text: 'Error: No subreddit context available',
          appearance: 'neutral'
        });
        return;
      }

      // Create a simple post that will show the web app
      await reddit.submitPost({
        title: 'Play Dicetrix - Dice Matching Puzzle Game! 🎲',
        subredditName: subredditName,
        text: 'Click the "Launch App" button below to start playing Dicetrix!\n\n🎯 Match dice by color and number\n🔥 Create combos for higher scores\n🏆 Compete on the leaderboards\n\nGood luck and have fun! 🎮'
      });

      context.ui.showToast({
        text: `Game post created successfully!`,
        appearance: 'success'
      });
    } catch (error) {
      console.error('Failed to create game post:', error);
      context.ui.showToast({
        text: 'Failed to create game post. Check logs for details.',
        appearance: 'neutral'
      });
    }
  }
});

// Add trigger for app installation
Devvit.addTrigger({
  event: 'AppInstall',
  onEvent: async (_event, context) => {
    try {
      const { reddit } = context;
      const subredditName = context.subredditName;
      
      if (!subredditName) {
        console.error('No subreddit context available during app install');
        return;
      }

      console.log('🚀 Dicetrix app installed, creating initial game post...');
      
      // Create initial game post
      const post = await reddit.submitPost({
        title: 'Welcome to Dicetrix! 🎲',
        subredditName: subredditName,
        text: 'Dicetrix has been installed! Click the "Launch App" button below to start playing.\n\n🎯 Match dice by color and number\n🔥 Create combos for higher scores\n🏆 Compete on the leaderboards\n\nModerators can create additional game posts using the subreddit menu.'
      });
      
      console.log('✅ Initial game post created:', post.id);
    } catch (error) {
      console.error('❌ Failed to create initial post on app install:', error);
    }
  }
});

// Initialize core managers
const leaderboardManager = new LeaderboardManager();
const redditPostHandler = new RedditPostHandler();
const taskScheduler = new DevvitTaskScheduler();
const resetController = new ResetController(leaderboardManager, redditPostHandler, taskScheduler);

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple authentication middleware
const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { userId } = context;
  if (!userId) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
    return;
  }
  // Use userId as username for now - in real implementation, fetch from Reddit API
  req.user = { userId, username: `User_${userId.slice(-8)}` };
  next();
};

// Extend Express Request type
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

// Enhanced score submission endpoint with Reddit integration
app.post('/api/reddit/submit-score', authenticateUser, async (req, res) => {
  try {
    const { userId, username } = req.user!;
    const submissionData: RedditScoreSubmissionRequest = req.body;

    // Validate submission data
    if (!submissionData.score || !submissionData.mode || !submissionData.breakdown) {
      res.status(400).json({
        success: false,
        message: 'Invalid submission data'
      });
      return;
    }

    // Submit score to leaderboard
    const scoreSubmission = {
      userId,
      username,
      score: submissionData.score,
      level: submissionData.level,
      mode: submissionData.mode,
      breakdown: submissionData.breakdown,
      timestamp: submissionData.timestamp,
      submissionTime: Date.now(),
      postId: context.postId || 'unknown',
      subredditName: context.subredditName || 'unknown'
    };

    const leaderboardResult = await leaderboardManager.submitScore(scoreSubmission);

    if (!leaderboardResult.success) {
      res.status(400).json({
        success: false,
        message: leaderboardResult.message || 'Failed to submit score'
      });
      return;
    }

    let redditPostUrl: string | undefined;

    // Create Reddit post if requested
    if (submissionData.createPost) {
      try {
        const redditPost = await redditPostHandler.createScorePost(scoreSubmission);
        redditPostUrl = redditPost.url;
      } catch (postError) {
        console.error('Failed to create Reddit post:', postError);
        // Continue without Reddit post - don't fail the entire submission
      }
    }

    // Update subreddit widget
    try {
      const allLeaderboards = await leaderboardManager.getAllLeaderboards({ limit: 3 });
      // Convert LeaderboardData to LeaderboardEntry[] for widget
      const topPlayers: Record<GameMode, any[]> = {} as Record<GameMode, any[]>;
      for (const [mode, data] of Object.entries(allLeaderboards)) {
        topPlayers[mode as GameMode] = data.entries;
      }
      
      const widgetData = {
        topPlayers,
        lastUpdated: Date.now(),
        nextReset: Date.now() + 86400000 // 24 hours from now
      };
      await redditPostHandler.updateSubredditWidget(widgetData);
    } catch (widgetError) {
      console.error('Failed to update widget:', widgetError);
      // Continue without widget update
    }

    const response: RedditScoreSubmissionResponse = {
      success: true,
      ...(leaderboardResult.leaderboardPosition && { leaderboardPosition: leaderboardResult.leaderboardPosition }),
      ...(redditPostUrl && { redditPostUrl }),
      message: leaderboardResult.message || 'Score submitted successfully!'
    };

    res.json(response);
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get leaderboard for specific mode
app.get('/api/leaderboards/:mode', async (req, res) => {
  try {
    const { mode } = req.params;
    const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
    
    if (!validModes.includes(mode as GameMode)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid game mode'
      });
      return;
    }

    const { userId } = context;
    const leaderboardData = await leaderboardManager.getLeaderboard(
      mode as GameMode, 
      { limit: 10, userId }
    );

    res.json(leaderboardData);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get leaderboard'
    });
  }
});

// Get all leaderboards
app.get('/api/leaderboards/all', async (_req, res) => {
  try {
    const { userId } = context;
    const allLeaderboards = await leaderboardManager.getAllLeaderboards({ 
      limit: 10, 
      userId 
    });

    // Calculate user stats
    const userStats = {
      totalGamesPlayed: 0,
      bestDifficulty: 'medium' as GameMode,
      overallRank: 0
    };

    // TODO: Implement user stats calculation from Redis data

    res.json({
      leaderboards: allLeaderboards,
      userStats
    });
  } catch (error) {
    console.error('All leaderboards error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get leaderboards'
    });
  }
});

// Manual leaderboard reset (admin only)
app.post('/api/leaderboards/reset', authenticateUser, async (req, res) => {
  try {
    // TODO: Add admin permission check
    const { difficulties, createPost } = req.body;

    const resetResult = await resetController.triggerManualReset({
      difficulties,
      createPost: createPost || false,
      immediate: true
    });

    res.json({
      success: true,
      resetId: resetResult.resetId,
      message: 'Leaderboard reset completed successfully'
    });
  } catch (error) {
    console.error('Manual reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset leaderboards'
    });
  }
});

// Get Reddit leaderboard widget data
app.get('/api/reddit/leaderboard-widget', async (_req, res) => {
  try {
    const allLeaderboards = await leaderboardManager.getAllLeaderboards({ limit: 3 });
    const schedule = await leaderboardManager.getResetSchedule();

    const widgetData = {
      topPlayers: allLeaderboards,
      lastUpdated: Date.now(),
      nextReset: schedule.nextReset
    };

    res.json(widgetData);
  } catch (error) {
    console.error('Widget data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get widget data'
    });
  }
});

// Configuration endpoints
app.get('/api/config/leaderboard', async (_req, res) => {
  try {
    const config = await leaderboardManager.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Config get error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get configuration'
    });
  }
});

app.put('/api/config/leaderboard', authenticateUser, async (req, res) => {
  try {
    // TODO: Add admin permission check
    await leaderboardManager.updateConfig(req.body);
    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration'
    });
  }
});

app.get('/api/config/reddit', async (_req, res) => {
  try {
    const config = await redditPostHandler.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Reddit config get error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Reddit configuration'
    });
  }
});

app.put('/api/config/reddit', authenticateUser, async (req, res) => {
  try {
    // TODO: Add admin permission check
    await redditPostHandler.updateConfig(req.body);
    res.json({ success: true, message: 'Reddit configuration updated' });
  } catch (error) {
    console.error('Reddit config update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Reddit configuration'
    });
  }
});

// System status endpoint
app.get('/api/system/status', async (_req, res) => {
  try {
    const resetStatus = await resetController.getResetStatus();
    const schedule = await leaderboardManager.getResetSchedule();

    res.json({
      status: 'healthy',
      timestamp: Date.now(),
      resetController: resetStatus,
      nextReset: schedule.nextReset,
      currentPeriod: schedule.currentPeriod
    });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system status'
    });
  }
});

// Admin diagnostics endpoint
app.get('/api/admin/diagnostics', authenticateUser, async (_req, res) => {
  try {
    // TODO: Add admin permission check
    const diagnostics = {
      timestamp: Date.now(),
      context: {
        userId: context.userId,
        postId: context.postId,
        subredditName: context.subredditName
      },
      leaderboardManager: 'initialized',
      redditPostHandler: 'initialized',
      resetController: 'initialized'
    };

    res.json(diagnostics);
  } catch (error) {
    console.error('Diagnostics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get diagnostics'
    });
  }
});

// Legacy endpoints for backward compatibility
app.get('/api/game/init', authenticateUser, async (_req, res) => {
  try {
    const { postId } = context;

    res.json({
      postId,
      score: 0,
      level: 1,
      gameState: 'initialized',
      mode: 'medium'
    });
  } catch (error) {
    console.error('Game init error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize game'
    });
  }
});

app.post('/api/game/score', authenticateUser, async (req, res) => {
  try {
    const { userId, username } = req.user!;
    const { score, level, mode, breakdown, timestamp } = req.body;

    // Validate input
    if (typeof score !== 'number' || score < 0) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid score'
      });
      return;
    }

    const scoreSubmission = {
      userId,
      username,
      score,
      level: level || 1,
      mode: mode || 'medium',
      breakdown: breakdown || {
        baseScore: score,
        chainMultiplier: 1,
        ultimateComboMultiplier: 1,
        boosterModifiers: 0,
        totalScore: score
      },
      timestamp: timestamp || Date.now(),
      submissionTime: Date.now(),
      postId: context.postId || 'unknown',
      subredditName: context.subredditName || 'unknown'
    };

    const result = await leaderboardManager.submitScore(scoreSubmission);

    res.json({
      success: result.success,
      message: result.message,
      newHighScore: result.isNewHighScore,
      leaderboardPosition: result.leaderboardPosition
    });
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit score'
    });
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'dicetrix'
  });
});

// Test endpoint
app.get('/test', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    context: {
      hasUserId: !!context.userId,
      hasPostId: !!context.postId,
      hasSubredditName: !!context.subredditName
    }
  });
});

// Initialize reset controller
resetController.initializeScheduler().catch(error => {
  console.error('Failed to initialize reset scheduler:', error);
});

// Create and start server
const server = createServer(app);
const port = parseInt(process.env.WEBBIT_PORT || '3000', 10);

server.listen(port, () => {
  console.log(`🚀 Dicetrix server started on port ${port}`);
});

export default Devvit;
