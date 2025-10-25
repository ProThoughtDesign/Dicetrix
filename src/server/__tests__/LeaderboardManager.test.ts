import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LeaderboardManager, ScoreSubmission, LeaderboardConfig, ResetInterval } from '../core/LeaderboardManager';
import { GameMode, ScoreBreakdown } from '../../shared/types/game';

// Mock the @devvit/web/server module
vi.mock('@devvit/web/server', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    zAdd: vi.fn(),
    zRange: vi.fn(),
    zCard: vi.fn(),
    del: vi.fn(),
    expire: vi.fn()
  }
}));

// Mock Logger
vi.mock('../utils/Logger', () => ({
  default: {
    log: vi.fn()
  }
}));

describe('LeaderboardManager', () => {
  let leaderboardManager: LeaderboardManager;
  let mockRedis: any;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mocked redis instance
    const { redis } = await import('@devvit/web/server');
    mockRedis = redis;
    leaderboardManager = new LeaderboardManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Score Submission and Ranking Logic', () => {
    const mockScoreSubmission: ScoreSubmission = {
      userId: 'user123',
      username: 'TestUser',
      score: 1500,
      level: 3,
      mode: 'medium',
      breakdown: {
        baseScore: 1200,
        chainMultiplier: 1,
        ultimateComboMultiplier: 1,
        boosterModifiers: 300,
        totalScore: 1500
      },
      timestamp: Date.now(),
      submissionTime: Date.now(),
      postId: 'post123',
      subredditName: 'testsubreddit'
    };

    it('should submit score successfully for new user', async () => {
      mockRedis.get.mockResolvedValueOnce(null); // No previous best score
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.zAdd.mockResolvedValue(1);
      mockRedis.zRange.mockResolvedValueOnce([JSON.stringify(mockScoreSubmission)]);

      const result = await leaderboardManager.submitScore(mockScoreSubmission);

      expect(result.success).toBe(true);
      expect(result.isNewHighScore).toBe(true);
      expect(result.isNewDifficultyRecord).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `dicetrix:user:${mockScoreSubmission.userId}:best:${mockScoreSubmission.mode}`,
        expect.stringContaining(mockScoreSubmission.score.toString())
      );
      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        `dicetrix:leaderboard:${mockScoreSubmission.mode}`,
        expect.objectContaining({
          member: expect.stringContaining(mockScoreSubmission.username),
          score: mockScoreSubmission.score
        })
      );
    });

    it('should handle existing user with lower score', async () => {
      const previousBest = {
        score: 1000,
        level: 2,
        breakdown: mockScoreSubmission.breakdown,
        timestamp: Date.now() - 1000,
        submissionTime: Date.now() - 1000
      };
      
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(previousBest));
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.zAdd.mockResolvedValue(1);
      mockRedis.zRange.mockResolvedValueOnce([JSON.stringify(mockScoreSubmission)]);

      const result = await leaderboardManager.submitScore(mockScoreSubmission);

      expect(result.success).toBe(true);
      expect(result.isNewHighScore).toBe(true);
      expect(result.isNewDifficultyRecord).toBe(true);
    });

    it('should handle existing user with higher score', async () => {
      const previousBest = {
        score: 2000,
        level: 4,
        breakdown: mockScoreSubmission.breakdown,
        timestamp: Date.now() - 1000,
        submissionTime: Date.now() - 1000
      };
      
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(previousBest));
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.zAdd.mockResolvedValue(1);
      mockRedis.zRange.mockResolvedValueOnce([JSON.stringify(mockScoreSubmission)]);

      const result = await leaderboardManager.submitScore(mockScoreSubmission);

      expect(result.success).toBe(true);
      expect(result.isNewHighScore).toBe(false);
      expect(result.isNewDifficultyRecord).toBe(false);
      // Should not update best score when current score is lower
      expect(mockRedis.set).not.toHaveBeenCalledWith(
        `dicetrix:user:${mockScoreSubmission.userId}:best:${mockScoreSubmission.mode}`,
        expect.any(String)
      );
    });

    it('should validate score submission data', async () => {
      const invalidSubmission = {
        ...mockScoreSubmission,
        score: -100 // Invalid negative score
      };

      const result = await leaderboardManager.submitScore(invalidSubmission);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid score submission data');
    });

    it('should validate score breakdown matches total score', async () => {
      const invalidSubmission = {
        ...mockScoreSubmission,
        breakdown: {
          ...mockScoreSubmission.breakdown,
          totalScore: 2000 // Doesn't match score of 1500
        }
      };

      const result = await leaderboardManager.submitScore(invalidSubmission);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid score submission data');
    });

    it('should get leaderboard data with correct ranking', async () => {
      const mockEntries = [
        JSON.stringify({
          userId: 'user1',
          username: 'Player1',
          score: 2000,
          level: 4,
          mode: 'medium',
          timestamp: Date.now(),
          submissionTime: Date.now(),
          breakdown: mockScoreSubmission.breakdown
        }),
        JSON.stringify({
          userId: 'user2',
          username: 'Player2',
          score: 1500,
          level: 3,
          mode: 'medium',
          timestamp: Date.now(),
          submissionTime: Date.now(),
          breakdown: mockScoreSubmission.breakdown
        })
      ];

      mockRedis.zRange.mockResolvedValueOnce(mockEntries);
      mockRedis.zCard.mockResolvedValue(10);

      const result = await leaderboardManager.getLeaderboard('medium', { limit: 10 });

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].rank).toBe(1);
      expect(result.entries[0].score).toBe(2000);
      expect(result.entries[1].rank).toBe(2);
      expect(result.entries[1].score).toBe(1500);
      expect(result.totalPlayers).toBe(10);
    });

    it('should get user rank correctly', async () => {
      const userBest = {
        score: 1500,
        level: 3,
        breakdown: mockScoreSubmission.breakdown,
        timestamp: Date.now(),
        submissionTime: Date.now()
      };

      const mockEntries = [
        JSON.stringify({
          userId: 'user1',
          username: 'Player1',
          score: 2000,
          level: 4,
          mode: 'medium',
          timestamp: Date.now(),
          submissionTime: Date.now(),
          breakdown: mockScoreSubmission.breakdown
        }),
        JSON.stringify({
          userId: 'user123',
          username: 'TestUser',
          score: 1500,
          level: 3,
          mode: 'medium',
          timestamp: Date.now(),
          submissionTime: Date.now(),
          breakdown: mockScoreSubmission.breakdown
        })
      ];

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(userBest));
      mockRedis.zRange.mockResolvedValueOnce(mockEntries);

      const result = await leaderboardManager.getUserRank('user123', 'medium');

      expect(result.difficultyRank).toBe(2);
      expect(result.leaderboardPosition).toBe(2);
    });

    it('should handle malformed leaderboard entries gracefully', async () => {
      const mockEntries = [
        'invalid-json{',
        JSON.stringify({
          userId: 'user1',
          username: 'Player1',
          score: 2000,
          level: 4,
          mode: 'medium',
          timestamp: Date.now(),
          submissionTime: Date.now(),
          breakdown: mockScoreSubmission.breakdown
        }),
        'another-invalid}'
      ];

      mockRedis.zRange.mockResolvedValueOnce(mockEntries);
      mockRedis.zCard.mockResolvedValue(3);

      const result = await leaderboardManager.getLeaderboard('medium');

      // Should only include valid entries
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].username).toBe('Player1');
      expect(result.totalPlayers).toBe(3);
    });
  });

  describe('Reset Scheduling and Archival Operations', () => {
    it('should schedule daily reset correctly', async () => {
      const resetInterval: ResetInterval = { type: 'daily' };
      
      mockRedis.set.mockResolvedValue('OK');

      await leaderboardManager.scheduleReset(resetInterval);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'dicetrix:leaderboard:config',
        expect.stringContaining('"resetInterval":"daily"')
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        'dicetrix:leaderboard:schedule',
        expect.stringContaining('"interval":"daily"')
      );
    });

    it('should schedule weekly reset correctly', async () => {
      const resetInterval: ResetInterval = { type: 'weekly' };
      
      mockRedis.set.mockResolvedValue('OK');

      await leaderboardManager.scheduleReset(resetInterval);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'dicetrix:leaderboard:config',
        expect.stringContaining('"resetInterval":"weekly"')
      );
    });

    it('should schedule custom reset with hours', async () => {
      const resetInterval: ResetInterval = { type: 'custom', customHours: 48 };
      
      mockRedis.set.mockResolvedValue('OK');

      await leaderboardManager.scheduleReset(resetInterval);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'dicetrix:leaderboard:config',
        expect.stringContaining('"customResetHours":48')
      );
    });

    it('should execute reset and archive data correctly', async () => {
      const mockLeaderboardEntries = [
        JSON.stringify({
          userId: 'user1',
          username: 'Player1',
          score: 2000,
          level: 4,
          mode: 'medium',
          timestamp: Date.now(),
          submissionTime: Date.now(),
          breakdown: { totalScore: 2000, baseScore: 1800, chainMultiplier: 1, ultimateComboMultiplier: 1, boosterModifiers: 200 }
        }),
        JSON.stringify({
          userId: 'user2',
          username: 'Player2',
          score: 1500,
          level: 3,
          mode: 'medium',
          timestamp: Date.now(),
          submissionTime: Date.now(),
          breakdown: { totalScore: 1500, baseScore: 1300, chainMultiplier: 1, ultimateComboMultiplier: 1, boosterModifiers: 200 }
        })
      ];

      mockRedis.zRange.mockResolvedValue(mockLeaderboardEntries);
      mockRedis.zAdd.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.del.mockResolvedValue(1);
      mockRedis.set.mockResolvedValue('OK');

      const result = await leaderboardManager.executeReset(['medium']);

      expect(result.resetId).toBeDefined();
      expect(result.difficulties).toEqual(['medium']);
      expect(result.totalPlayersAffected).toBe(2);
      expect(result.topPlayers.medium).toHaveLength(2);
      
      // Should archive data before reset
      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        expect.stringMatching(/dicetrix:leaderboard:medium:historical:/),
        expect.any(Object)
      );
      
      // Should clear current leaderboard
      expect(mockRedis.del).toHaveBeenCalledWith('dicetrix:leaderboard:medium');
      
      // Should update schedule
      expect(mockRedis.set).toHaveBeenCalledWith(
        'dicetrix:leaderboard:schedule',
        expect.stringContaining(result.resetId)
      );
    });

    it('should execute reset for all modes when none specified', async () => {
      mockRedis.zRange.mockResolvedValue([]);
      mockRedis.zAdd.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.del.mockResolvedValue(1);
      mockRedis.set.mockResolvedValue('OK');

      const result = await leaderboardManager.executeReset();

      expect(result.difficulties).toEqual(['easy', 'medium', 'hard', 'expert', 'zen']);
    });

    it('should validate game modes for reset', async () => {
      const invalidModes = ['invalid' as unknown as GameMode];

      await expect(leaderboardManager.executeReset(invalidModes)).rejects.toThrow('Invalid game mode: invalid');
    });

    it('should archive current leaderboard data', async () => {
      const mockEntries = [
        JSON.stringify({
          userId: 'user1',
          username: 'Player1',
          score: 2000,
          level: 4,
          mode: 'medium',
          timestamp: Date.now(),
          submissionTime: Date.now(),
          breakdown: { totalScore: 2000, baseScore: 1800, chainMultiplier: 1, ultimateComboMultiplier: 1, boosterModifiers: 200 }
        })
      ];

      mockRedis.zRange.mockResolvedValue(mockEntries);
      mockRedis.zAdd.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      await leaderboardManager.archiveCurrentLeaderboard('medium');

      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        expect.stringMatching(/dicetrix:leaderboard:medium:historical:/),
        expect.objectContaining({
          member: expect.stringContaining('Player1'),
          score: 2000
        })
      );
      expect(mockRedis.expire).toHaveBeenCalled();
    });

    it('should get reset schedule information', async () => {
      const mockSchedule = {
        nextReset: Date.now() + 86400000, // 24 hours from now
        interval: 'daily',
        lastReset: Date.now() - 3600000, // 1 hour ago
        resetId: 'reset_123'
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockSchedule));

      const result = await leaderboardManager.getResetSchedule();

      expect(result.nextReset).toBe(mockSchedule.nextReset);
      expect(result.interval).toBe('daily');
      expect(result.currentPeriod).toBeDefined();
    });

    it('should return default schedule when none exists', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await leaderboardManager.getResetSchedule();

      expect(result.interval).toBe('daily'); // Default interval
      expect(result.nextReset).toBeGreaterThan(Date.now());
      expect(result.currentPeriod).toBeDefined();
    });

    it('should check if reset is due', async () => {
      const pastResetTime = {
        nextReset: Date.now() - 1000, // 1 second ago
        interval: 'daily',
        currentPeriod: '2024-01-01'
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(pastResetTime));

      const isDue = await leaderboardManager.isResetDue();

      expect(isDue).toBe(true);
    });

    it('should check if reset is not due', async () => {
      const futureResetTime = {
        nextReset: Date.now() + 86400000, // 24 hours from now
        interval: 'daily',
        currentPeriod: '2024-01-01'
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(futureResetTime));

      const isDue = await leaderboardManager.isResetDue();

      expect(isDue).toBe(false);
    });
  });

  describe('Configuration Management and Error Handling', () => {
    it('should update configuration correctly', async () => {
      const newConfig: Partial<LeaderboardConfig> = {
        resetInterval: 'weekly',
        maxHistoricalPeriods: 5,
        enableAutoPosting: false
      };

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValueOnce(null); // No existing schedule

      await leaderboardManager.updateConfig(newConfig);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'dicetrix:leaderboard:config',
        expect.stringContaining('"resetInterval":"weekly"')
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        'dicetrix:leaderboard:config',
        expect.stringContaining('"maxHistoricalPeriods":5')
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        'dicetrix:leaderboard:config',
        expect.stringContaining('"enableAutoPosting":false')
      );
    });

    it('should update reset schedule when interval changes', async () => {
      const newConfig: Partial<LeaderboardConfig> = {
        resetInterval: 'monthly'
      };

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ interval: 'daily' }));

      await leaderboardManager.updateConfig(newConfig);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'dicetrix:leaderboard:schedule',
        expect.stringContaining('"interval":"monthly"')
      );
    });

    it('should get current configuration', async () => {
      const storedConfig: LeaderboardConfig = {
        resetInterval: 'weekly',
        maxHistoricalPeriods: 5,
        topPlayersCount: 10,
        enableAutoPosting: false,
        enableNotifications: true
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(storedConfig));

      const config = await leaderboardManager.getConfig();

      expect(config.resetInterval).toBe('weekly');
      expect(config.maxHistoricalPeriods).toBe(5);
      expect(config.enableAutoPosting).toBe(false);
    });

    it('should return default config when none stored', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const config = await leaderboardManager.getConfig();

      expect(config.resetInterval).toBe('daily');
      expect(config.maxHistoricalPeriods).toBe(3);
      expect(config.enableAutoPosting).toBe(true);
    });

    it('should handle Redis connection errors in score submission', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await leaderboardManager.submitScore({
        userId: 'user123',
        username: 'TestUser',
        score: 1500,
        level: 3,
        mode: 'medium',
        breakdown: {
          baseScore: 1200,
          chainMultiplier: 1,
          ultimateComboMultiplier: 1,
          boosterModifiers: 300,
          totalScore: 1500
        },
        timestamp: Date.now(),
        submissionTime: Date.now()
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to submit score');
    });

    it('should handle Redis errors in leaderboard retrieval', async () => {
      mockRedis.zRange.mockRejectedValue(new Error('Redis connection failed'));

      await expect(leaderboardManager.getLeaderboard('medium')).rejects.toThrow('Failed to get leaderboard');
    });

    it('should handle Redis errors in reset scheduling', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));

      await expect(leaderboardManager.scheduleReset({ type: 'daily' })).rejects.toThrow('Failed to schedule reset');
    });

    it('should handle Redis errors in reset execution', async () => {
      mockRedis.zRange.mockRejectedValue(new Error('Redis connection failed'));

      await expect(leaderboardManager.executeReset(['medium'])).rejects.toThrow('Failed to execute reset');
    });

    it('should handle Redis errors in configuration update', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));

      await expect(leaderboardManager.updateConfig({ resetInterval: 'weekly' })).rejects.toThrow('Failed to update configuration');
    });

    it('should handle errors gracefully in reset due check', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const isDue = await leaderboardManager.isResetDue();

      expect(isDue).toBe(false); // Should return false on error
    });

    it('should get all leaderboards successfully', async () => {
      const mockEntry = JSON.stringify({
        userId: 'user1',
        username: 'Player1',
        score: 2000,
        level: 4,
        mode: 'easy',
        timestamp: Date.now(),
        submissionTime: Date.now(),
        breakdown: { totalScore: 2000, baseScore: 1800, chainMultiplier: 1, ultimateComboMultiplier: 1, boosterModifiers: 200 }
      });

      mockRedis.zRange.mockResolvedValue([mockEntry]);
      mockRedis.zCard.mockResolvedValue(1);

      const result = await leaderboardManager.getAllLeaderboards({ limit: 5 });

      expect(result).toHaveProperty('easy');
      expect(result).toHaveProperty('medium');
      expect(result).toHaveProperty('hard');
      expect(result).toHaveProperty('expert');
      expect(result).toHaveProperty('zen');
      expect(result.easy.entries).toHaveLength(1);
    });

    it('should handle errors in get all leaderboards', async () => {
      mockRedis.zRange.mockRejectedValue(new Error('Redis connection failed'));

      await expect(leaderboardManager.getAllLeaderboards()).rejects.toThrow('Failed to get all leaderboards');
    });
  });
});
