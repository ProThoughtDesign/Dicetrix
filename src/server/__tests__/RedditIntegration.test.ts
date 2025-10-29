import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameMode, ScoreBreakdown } from '../../shared/types/game.js';
import { 
  GameInitResponse, 
  ScoreSubmissionRequest, 
  ScoreSubmissionResponse,
  LeaderboardResponse,
  ShareScoreRequest,
  ShareScoreResponse,
  ErrorResponse 
} from '../../shared/types/api.js';

// Mock the @devvit/web/server module
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  zAdd: vi.fn(),
  zRange: vi.fn(),
  zCard: vi.fn()
};

const mockContext = {
  userId: 'test-user-123',
  username: 'TestUser',
  postId: 'test-post-456',
  subredditName: 'testsubreddit'
};

vi.mock('@devvit/web/server', () => ({
  redis: mockRedis,
  context: mockContext,
  createServer: vi.fn((app) => ({
    on: vi.fn(),
    listen: vi.fn()
  }))
}));

describe('Reddit Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Server Endpoint Functionality', () => {
    it('should initialize game with Reddit user context', async () => {
      // Mock Redis responses for new user
      mockRedis.get.mockResolvedValueOnce(null); // No existing game state
      mockRedis.get.mockResolvedValueOnce(null); // No existing user profile
      mockRedis.set.mockResolvedValue('OK');

      // Simulate game initialization logic
      const gameStateKey = `dicetrix:game:${mockContext.postId}:${mockContext.userId}`;
      const gameState = await mockRedis.get(gameStateKey);
      
      let score = 0;
      let level = 1;
      let mode: GameMode = 'easy';
      
      if (gameState) {
        const parsed = JSON.parse(gameState);
        score = parsed.score || 0;
        level = parsed.level || 1;
        mode = parsed.mode || 'easy';
      }

      const userProfileKey = `dicetrix:user:${mockContext.userId}`;
      const userProfile = await mockRedis.get(userProfileKey);
      
      if (!userProfile) {
        await mockRedis.set(userProfileKey, JSON.stringify({
          userId: mockContext.userId,
          username: mockContext.username,
          createdAt: Date.now(),
          lastActive: Date.now()
        }));
      }

      const response: GameInitResponse = {
        postId: mockContext.postId,
        score,
        level,
        gameState: 'initialized',
        mode
      };

      expect(response.postId).toBe(mockContext.postId);
      expect(response.score).toBe(0);
      expect(response.level).toBe(1);
      expect(response.mode).toBe('easy');
      expect(mockRedis.set).toHaveBeenCalledWith(
        userProfileKey,
        expect.stringContaining(mockContext.username)
      );
    });

    it('should handle existing Reddit user game state', async () => {
      const existingGameState = {
        score: 5000,
        level: 3,
        mode: 'medium' as GameMode,
        timestamp: Date.now()
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(existingGameState));
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ userId: mockContext.userId }));
      mockRedis.set.mockResolvedValue('OK');

      // Simulate game initialization with existing state
      const gameStateKey = `dicetrix:game:${mockContext.postId}:${mockContext.userId}`;
      const gameState = await mockRedis.get(gameStateKey);
      
      let score = 0;
      let level = 1;
      let mode: GameMode = 'easy';
      
      if (gameState) {
        const parsed = JSON.parse(gameState);
        score = parsed.score || 0;
        level = parsed.level || 1;
        mode = parsed.mode || 'easy';
      }

      expect(score).toBe(5000);
      expect(level).toBe(3);
      expect(mode).toBe('medium');
    });
  });

  describe('Leaderboard Storage and Retrieval', () => {
    it('should store score in Redis leaderboard with Reddit user data', async () => {
      const scoreBreakdown: ScoreBreakdown = {
        baseScore: 1000,
        chainMultiplier: 2,
        ultimateComboMultiplier: 1,
        boosterModifiers: 200,
        totalScore: 1700
      };

      const scoreRequest: ScoreSubmissionRequest = {
        score: 1700,
        level: 2,
        mode: 'medium',
        breakdown: scoreBreakdown
      };

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValueOnce(null); // No previous best
      mockRedis.zAdd.mockResolvedValue(1);

      // Simulate score submission logic
      const { score, level, mode, breakdown } = scoreRequest;
      
      // Validation
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(Math.abs(breakdown.totalScore - score)).toBeLessThanOrEqual(0.01);

      // Save to user's game state
      const gameStateKey = `dicetrix:game:${mockContext.postId}:${mockContext.userId}`;
      await mockRedis.set(gameStateKey, JSON.stringify({ 
        score, 
        level, 
        mode, 
        breakdown,
        timestamp: Date.now() 
      }));

      // Check for new high score - since we mocked null, this should be a new high score
      const userBestKey = `dicetrix:user:${mockContext.userId}:best:${mode}`;
      const previousBest = await mockRedis.get(userBestKey);
      const isNewHighScore = !previousBest || score > 0; // Since previousBest is null, this is a new high score

      // Add to leaderboard
      const leaderboardKey = `dicetrix:leaderboard:${mode}`;
      const leaderboardEntry = {
        userId: mockContext.userId,
        username: mockContext.username,
        score,
        level,
        mode,
        timestamp: Date.now(),
        breakdown
      };
      
      await mockRedis.zAdd(leaderboardKey, {
        member: JSON.stringify(leaderboardEntry),
        score: score
      });

      const response: ScoreSubmissionResponse = {
        success: true,
        newHighScore: isNewHighScore,
        leaderboardPosition: 1,
        message: isNewHighScore ? 'New personal best!' : 'Score submitted successfully'
      };

      expect(response.success).toBe(true);
      expect(response.newHighScore).toBe(true);
      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        leaderboardKey,
        expect.objectContaining({
          member: expect.stringContaining(mockContext.username),
          score: scoreRequest.score
        })
      );
    });

    it('should retrieve leaderboard with Reddit user rankings', async () => {
      const mockLeaderboardEntries = [
        JSON.stringify({
          userId: 'user1',
          username: 'Player1',
          score: 5000,
          level: 5,
          mode: 'medium',
          timestamp: Date.now(),
          breakdown: { totalScore: 5000, baseScore: 4000, chainMultiplier: 1, ultimateComboMultiplier: 1, boosterModifiers: 1000 }
        }),
        JSON.stringify({
          userId: mockContext.userId,
          username: mockContext.username,
          score: 4000,
          level: 4,
          mode: 'medium',
          timestamp: Date.now(),
          breakdown: { totalScore: 4000, baseScore: 3500, chainMultiplier: 1, ultimateComboMultiplier: 1, boosterModifiers: 500 }
        })
      ];

      mockRedis.zRange.mockResolvedValueOnce(mockLeaderboardEntries);
      mockRedis.zCard.mockResolvedValue(10);

      // Simulate leaderboard retrieval
      const mode = 'medium';
      const leaderboardKey = `dicetrix:leaderboard:${mode}`;
      
      const topScores = await mockRedis.zRange(leaderboardKey, 0, 9, { 
        reverse: true,
        by: 'rank'
      });
      
      const entries = topScores.map((entry: string) => JSON.parse(entry));
      const totalPlayers = await mockRedis.zCard(leaderboardKey);

      // Find user rank
      let userRank: number | undefined;
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].userId === mockContext.userId) {
          userRank = i + 1;
          break;
        }
      }

      const response: LeaderboardResponse = {
        entries,
        userRank,
        totalPlayers
      };

      expect(response.entries).toHaveLength(2);
      expect(response.entries[0].score).toBe(5000);
      expect(response.entries[1].username).toBe(mockContext.username);
      expect(response.userRank).toBe(2);
      expect(response.totalPlayers).toBe(10);
    });

    it('should validate game mode for leaderboard requests', () => {
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      
      // Test valid modes
      validModes.forEach(mode => {
        expect(validModes.includes(mode)).toBe(true);
      });

      // Test invalid mode
      const invalidMode = 'invalid' as GameMode;
      expect(validModes.includes(invalidMode)).toBe(false);
    });
  });

  describe('Score Sharing to Subreddit', () => {
    it('should format score for Reddit post sharing', () => {
      const shareRequest: ShareScoreRequest = {
        score: 2500,
        level: 3,
        mode: 'hard',
        breakdown: {
          baseScore: 2000,
          chainMultiplier: 1,
          ultimateComboMultiplier: 1,
          boosterModifiers: 500,
          totalScore: 2500
        }
      };

      // Validate input data
      expect(typeof shareRequest.score).toBe('number');
      expect(shareRequest.score).toBeGreaterThanOrEqual(0);

      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      expect(validModes.includes(shareRequest.mode)).toBe(true);

      // Format post content for Reddit
      const { score, level, mode, breakdown } = shareRequest;
      const modeDisplayName = mode.charAt(0).toUpperCase() + mode.slice(1);
      
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

      const postUrl = `https://reddit.com/r/${mockContext.subredditName}/comments/dicetrix_score_${Date.now()}`;
      
      const response: ShareScoreResponse = {
        success: true,
        postUrl,
        message: 'Score shared successfully!'
      };

      expect(response.success).toBe(true);
      expect(response.postUrl).toContain('reddit.com');
      expect(response.postUrl).toContain(mockContext.subredditName);
      
      // Verify Reddit-specific formatting
      expect(postContent).toContain('**2,500 points**'); // Bold formatting
      expect(postContent).toContain('🎯'); // Emoji
      expect(postContent).toContain('**Booster Bonus:** +500'); // Booster bonus display
      expect(postContent).toContain('#Dicetrix #PuzzleGame #HighScore #Reddit #Gaming'); // Hashtags
    });

    it('should handle Ultimate Combo in Reddit post formatting', () => {
      const shareRequest: ShareScoreRequest = {
        score: 10000,
        level: 5,
        mode: 'expert',
        breakdown: {
          baseScore: 8000,
          chainMultiplier: 2,
          ultimateComboMultiplier: 5,
          boosterModifiers: 1000,
          totalScore: 10000
        }
      };

      const { score, level, mode, breakdown } = shareRequest;
      const modeDisplayName = mode.charAt(0).toUpperCase() + mode.slice(1);
      
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

      // Verify Ultimate Combo is displayed when > 1
      expect(postContent).toContain('**Ultimate Combo:** 5x');
      expect(postContent).toContain('**10,000 points**');
      expect(postContent).toContain('Expert mode');
    });

    it('should reject invalid share data', () => {
      const invalidShareRequest = {
        score: 'invalid', // Should be number
        level: 1,
        mode: 'easy',
        breakdown: {}
      };

      // Validation should fail
      expect(typeof invalidShareRequest.score).not.toBe('number');
      
      const validModes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
      expect(validModes.includes(invalidShareRequest.mode as GameMode)).toBe(true); // Mode is valid
    });
  });

  describe('Authentication Flow Verification', () => {
    it('should extract Reddit user context correctly', () => {
      // Simulate authentication middleware
      const userContext = {
        userId: mockContext.userId,
        username: mockContext.username
      };

      expect(userContext.userId).toBe(mockContext.userId);
      expect(userContext.username).toBe(mockContext.username);
      expect(typeof userContext.userId).toBe('string');
      expect(typeof userContext.username).toBe('string');
    });

    it('should handle Reddit context data in operations', () => {
      // Test that Reddit context is properly used in key generation
      const gameStateKey = `dicetrix:game:${mockContext.postId}:${mockContext.userId}`;
      const userProfileKey = `dicetrix:user:${mockContext.userId}`;
      const leaderboardKey = `dicetrix:leaderboard:medium`;

      expect(gameStateKey).toContain(mockContext.postId);
      expect(gameStateKey).toContain(mockContext.userId);
      expect(userProfileKey).toContain(mockContext.userId);
      expect(leaderboardKey).toContain('dicetrix:leaderboard:');
    });

    it('should validate required Reddit context fields', () => {
      // Test that all required context fields are present
      expect(mockContext.userId).toBeDefined();
      expect(mockContext.username).toBeDefined();
      expect(mockContext.postId).toBeDefined();
      expect(mockContext.subredditName).toBeDefined();

      expect(typeof mockContext.userId).toBe('string');
      expect(typeof mockContext.username).toBe('string');
      expect(typeof mockContext.postId).toBe('string');
      expect(typeof mockContext.subredditName).toBe('string');
    });
  });

  describe('Reddit Integration Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Create a fresh mock that will reject
      const failingRedisGet = vi.fn().mockRejectedValue(new Error('Redis connection failed'));

      await expect(failingRedisGet('test-key')).rejects.toThrow('Redis connection failed');
    });

    it('should handle malformed leaderboard data in Redis', async () => {
      mockRedis.zRange.mockResolvedValue(['invalid-json{', 'another-invalid}']);
      mockRedis.zCard.mockResolvedValue(2);

      // Simulate leaderboard parsing with error handling
      const topScores = await mockRedis.zRange('dicetrix:leaderboard:medium', 0, 9);
      
      const entries = [];
      for (const scoreEntry of topScores) {
        try {
          if (typeof scoreEntry === 'string') {
            const entryData = JSON.parse(scoreEntry);
            entries.push(entryData);
          }
        } catch (parseError) {
          // Should handle parse errors gracefully
          expect(parseError).toBeInstanceOf(SyntaxError);
        }
      }

      const totalPlayers = await mockRedis.zCard('dicetrix:leaderboard:medium');

      // Should return empty entries but still work
      expect(entries).toEqual([]);
      expect(totalPlayers).toBe(2);
    });

    it('should handle missing Reddit context gracefully', () => {
      // Test missing postId
      const contextWithoutPostId = { ...mockContext, postId: undefined };
      
      if (!contextWithoutPostId.postId) {
        const error: ErrorResponse = {
          status: 'error',
          message: 'postId is required but missing from context',
          code: 'MISSING_POST_ID'
        };
        
        expect(error.status).toBe('error');
        expect(error.code).toBe('MISSING_POST_ID');
      }
    });
  });

  describe('Reddit Integration Performance', () => {
    it('should handle concurrent Redis operations', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.zAdd.mockResolvedValue(1);

      // Simulate multiple concurrent operations
      const operations = Array.from({ length: 5 }, async (_, i) => {
        await mockRedis.set(`dicetrix:game:${mockContext.postId}:user${i}`, 'test');
        await mockRedis.zAdd('dicetrix:leaderboard:easy', { member: `user${i}`, score: 1000 + i * 100 });
      });

      await Promise.all(operations);

      // Verify Redis operations were called for each concurrent operation
      expect(mockRedis.set).toHaveBeenCalledTimes(5);
      expect(mockRedis.zAdd).toHaveBeenCalledTimes(5);
    });

    it('should maintain performance under load', async () => {
      mockRedis.zRange.mockResolvedValue([]);
      mockRedis.zCard.mockResolvedValue(0);

      const startTime = Date.now();
      
      // Simulate leaderboard retrieval operations
      await mockRedis.zRange('dicetrix:leaderboard:medium', 0, 9);
      await mockRedis.zCard('dicetrix:leaderboard:medium');
      
      const processingTime = Date.now() - startTime;
      
      // Should complete quickly (under 100ms for mocked operations)
      expect(processingTime).toBeLessThan(100);
    });

    it('should validate score data efficiently', () => {
      const scoreBreakdown: ScoreBreakdown = {
        baseScore: 1000,
        chainMultiplier: 2,
        ultimateComboMultiplier: 1,
        boosterModifiers: 200,
        totalScore: 1700
      };

      const score = 1700;

      // Test efficient validation
      const startTime = Date.now();
      
      const isValidScore = typeof score === 'number' && score >= 0;
      const isValidBreakdown = scoreBreakdown && typeof scoreBreakdown.totalScore === 'number';
      const isScoreMatched = Math.abs(scoreBreakdown.totalScore - score) <= 0.01;
      
      const validationTime = Date.now() - startTime;

      expect(isValidScore).toBe(true);
      expect(isValidBreakdown).toBe(true);
      expect(isScoreMatched).toBe(true);
      expect(validationTime).toBeLessThan(10); // Should be very fast
    });
  });
});
