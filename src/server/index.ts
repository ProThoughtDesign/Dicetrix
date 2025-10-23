import express from 'express';
import { redis, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';
import { 
  GameInitResponse, 
  ScoreSubmissionRequest, 
  ScoreSubmissionResponse,
  LeaderboardResponse,
  LeaderboardEntry,
  ShareScoreRequest,
  ShareScoreResponse,
  ErrorResponse 
} from '../shared/types/api';
import { GameMode } from '../shared/types/game';
import Logger from './utils/Logger';

const app = express();

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
      const { score, level, mode, breakdown } = req.body;
      
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

      // Save to user's game state
      const gameStateKey = `dicetrix:game:${postId}:${userId}`;
      await redis.set(gameStateKey, JSON.stringify({ 
        score, 
        level, 
        mode, 
        breakdown,
        timestamp: Date.now() 
      }));

      // Get user's previous best score for this mode
      const userBestKey = `dicetrix:user:${userId}:best:${mode}`;
      const previousBest = await redis.get(userBestKey);
      const previousBestScore = previousBest ? JSON.parse(previousBest).score : 0;
      const isNewHighScore = score > previousBestScore;

      // Update user's best score if this is better
      if (isNewHighScore) {
        await redis.set(userBestKey, JSON.stringify({
          score,
          level,
          breakdown,
          timestamp: Date.now()
        }));
      }

      // Add to leaderboard (sorted set with score as the sort key)
      const leaderboardKey = `dicetrix:leaderboard:${mode}`;
      const leaderboardEntry: LeaderboardEntry = {
        userId,
        username,
        score,
        level,
        mode,
        timestamp: Date.now(),
        breakdown
      };
      
      await redis.zAdd(leaderboardKey, {
        member: JSON.stringify(leaderboardEntry),
        score: score
      });

      // Get user's current leaderboard position by finding their entry
      let leaderboardPosition: number | undefined;
      try {
        const allEntries = await redis.zRange(leaderboardKey, 0, -1, { 
          reverse: true, 
          by: 'rank'
        });
        
        // Find user's position by matching their userId and score
        for (let i = 0; i < allEntries.length; i++) {
          const entryData = allEntries[i];
          if (typeof entryData === 'string') {
            try {
              const entry = JSON.parse(entryData);
              if (entry.userId === userId && entry.score === score) {
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
        leaderboardPosition = undefined;
      }

      res.json({
        success: true,
        newHighScore: isNewHighScore,
        leaderboardPosition,
        message: isNewHighScore ? 'New personal best!' : 'Score submitted successfully'
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

      const leaderboardKey = `dicetrix:leaderboard:${mode}`;
      
      // Get top 10 scores (Redis zRange with reverse returns highest scores first)
      const topScores = await redis.zRange(leaderboardKey, 0, 9, { 
        reverse: true,
        by: 'rank'
      });
      
      // Parse leaderboard entries
      const entries: LeaderboardEntry[] = [];
      for (const scoreEntry of topScores) {
        try {
          if (typeof scoreEntry === 'string') {
            const entryData = JSON.parse(scoreEntry);
            entries.push(entryData);
          }
        } catch (parseError) {
          Logger.log('Failed to parse leaderboard entry: ' + String(parseError));
        }
      }

      // Get total number of players for this mode
      const totalPlayers = await redis.zCard(leaderboardKey);

      // Get user's rank if authenticated
      let userRank: number | undefined;
      if (userId) {
        // Find user's best entry in the leaderboard
        const userBestKey = `dicetrix:user:${userId}:best:${mode}`;
        const userBest = await redis.get(userBestKey);
        
        if (userBest) {
          const userBestData = JSON.parse(userBest);
          
          try {
            // Find user's rank by getting all entries and searching for their best score
            const allEntries = await redis.zRange(leaderboardKey, 0, -1, { 
              reverse: true, 
              by: 'rank'
            });
            
            for (let i = 0; i < allEntries.length; i++) {
              const entryData = allEntries[i];
              if (typeof entryData === 'string') {
                try {
                  const entry = JSON.parse(entryData);
                  if (entry.userId === userId && entry.score === userBestData.score) {
                    userRank = i + 1;
                    break;
                  }
                } catch (parseError) {
                  continue;
                }
              }
            }
          } catch (rankError) {
            Logger.log('Could not determine user rank: ' + String(rankError));
            userRank = undefined;
          }
        }
      }

      res.json({
        entries,
        userRank,
        totalPlayers
      } as LeaderboardResponse);
    } catch (error) {
      const errorResponse = handleError(error, 'leaderboard retrieval');
      res.status(500).json(errorResponse);
    }
  }
);

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
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
    } catch (error) {
    Logger.log(`Error creating post: ${String(error)}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
    } catch (error) {
    Logger.log(`Error creating post: ${String(error)}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = process.env.WEBBIT_PORT || 3000;

const server = createServer(app);
server.on('error', (err) => Logger.log(`server error; ${String((err as any)?.stack || err)}`));
server.listen(port, () => Logger.log(`http://localhost:${port}`));
