import express from 'express';
import { redis, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';

// Dicetrix game types
interface GameInitResponse {
  postId: string;
  score: number;
  level: number;
  gameState: string;
}

interface ScoreSubmissionRequest {
  score: number;
  level: number;
  mode: string;
}

interface ScoreSubmissionResponse {
  success: boolean;
  newHighScore: boolean;
  leaderboardPosition?: number;
}

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Initialize game session
router.get<{}, GameInitResponse | { status: string; message: string }>(
  '/api/game/init',
  async (_req, res): Promise<void> => {
    const { postId, userId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      // Get user's current game state or initialize new one
      const gameStateKey = `dicetrix:game:${postId}:${userId || 'anonymous'}`;
      const gameState = await redis.get(gameStateKey);
      
      let score = 0;
      let level = 1;
      
      if (gameState) {
        const parsed = JSON.parse(gameState);
        score = parsed.score || 0;
        level = parsed.level || 1;
      }

      res.json({
        postId: postId,
        score,
        level,
        gameState: 'initialized',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Submit score to leaderboard
router.post<{}, ScoreSubmissionResponse | { status: string; message: string }, ScoreSubmissionRequest>(
  '/api/game/score',
  async (req, res): Promise<void> => {
    const { postId, userId, username } = context;
    
    if (!postId || !userId) {
      res.status(400).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    try {
      const { score, level, mode } = req.body;
      
      if (typeof score !== 'number' || typeof level !== 'number' || typeof mode !== 'string') {
        res.status(400).json({
          status: 'error',
          message: 'Invalid score data',
        });
        return;
      }

      // Save to user's game state
      const gameStateKey = `dicetrix:game:${postId}:${userId}`;
      await redis.set(gameStateKey, JSON.stringify({ score, level, mode, timestamp: Date.now() }));

      // Add to leaderboard
      const leaderboardKey = `dicetrix:leaderboard:${mode}`;
      const scoreData = JSON.stringify({
        userId,
        username: username || 'Anonymous',
        score,
        level,
        timestamp: Date.now(),
      });
      
      await redis.zadd(leaderboardKey, { score, member: scoreData });

      // Check if it's a new high score (simplified for now)
      const userScores = await redis.zrevrangebyscore(leaderboardKey, '+inf', '-inf', { count: 1 });
      const isNewHighScore = userScores.length > 0 && JSON.parse(userScores[0]).userId === userId;

      res.json({
        success: true,
        newHighScore: isNewHighScore,
      });
    } catch (error) {
      console.error(`Score submission error:`, error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to submit score',
      });
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
    console.error(`Error creating post: ${error}`);
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
    console.error(`Error creating post: ${error}`);
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
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`http://localhost:${port}`));
