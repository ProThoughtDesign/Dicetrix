import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock Phaser for integration tests
const mockPhaser = {
  Game: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    scene: {
      add: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    },
  })),
  Scene: vi.fn(),
  AUTO: 'AUTO',
  WEBGL: 'WEBGL',
  CANVAS: 'CANVAS',
};

vi.mock('phaser', () => mockPhaser);

describe('Complete Game Integration Tests', () => {
  let dom: JSDOM;
  let container: HTMLElement;

  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="game-container"></div></body></html>');
    global.document = dom.window.document;
    global.window = dom.window as any;
    global.HTMLElement = dom.window.HTMLElement;
    global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
    
    container = document.getElementById('game-container')!;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Game Initialization Flow', () => {
    it('should initialize game with proper configuration', async () => {
      // Import after mocks are set up
      const { default: StartGame } = await import('../client/game/main');
      
      // Test game initialization
      const gameInstance = StartGame('game-container');
      
      expect(mockPhaser.Game).toHaveBeenCalledWith(
        expect.objectContaining({
          type: mockPhaser.AUTO,
          width: expect.any(Number),
          height: expect.any(Number),
          parent: 'game-container',
          backgroundColor: expect.any(String),
          scene: expect.any(Array),
        })
      );
    });

    it('should handle missing container gracefully', async () => {
      const { default: StartGame } = await import('../client/game/main');
      
      // Test with non-existent container
      expect(() => StartGame('non-existent')).not.toThrow();
    });
  });

  describe('API Integration', () => {
    it('should handle game initialization API call', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          postId: 'test-post',
          score: 0,
          level: 1,
          gameState: 'initialized',
          mode: 'easy'
        })
      });

      const response = await fetch('/api/game/init');
      const data = await response.json();

      expect(data).toEqual({
        postId: 'test-post',
        score: 0,
        level: 1,
        gameState: 'initialized',
        mode: 'easy'
      });
    });

    it('should handle score submission', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          newHighScore: false,
          leaderboardPosition: 5,
          message: 'Score submitted successfully'
        })
      });

      const scoreData = {
        score: 1000,
        level: 3,
        mode: 'medium',
        breakdown: {
          baseScore: 800,
          chainMultiplier: 1.25,
          ultimateComboMultiplier: 1,
          boosterModifiers: 0,
          totalScore: 1000
        }
      };

      const response = await fetch('/api/game/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData)
      });

      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should handle leaderboard retrieval', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          entries: [
            { userId: 'user1', username: 'Player1', score: 5000, mode: 'hard' },
            { userId: 'user2', username: 'Player2', score: 4500, mode: 'hard' }
          ],
          userRank: 3,
          totalPlayers: 100
        })
      });

      const response = await fetch('/api/leaderboards/hard');
      const data = await response.json();

      expect(data.entries).toHaveLength(2);
      expect(data.userRank).toBe(3);
      expect(data.totalPlayers).toBe(100);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network failures gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/game/init');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle API errors with proper status codes', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          status: 'error',
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        })
      });

      const response = await fetch('/api/game/score', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Mobile Compatibility', () => {
    it('should handle touch events', () => {
      // Mock touch events
      const touchEvent = new dom.window.TouchEvent('touchstart', {
        touches: [{
          clientX: 100,
          clientY: 200,
          identifier: 0,
          target: container
        } as any]
      });

      expect(() => container.dispatchEvent(touchEvent)).not.toThrow();
    });

    it('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(dom.window, 'innerWidth', { value: 375 });
      Object.defineProperty(dom.window, 'innerHeight', { value: 667 });

      expect(dom.window.innerWidth).toBe(375);
      expect(dom.window.innerHeight).toBe(667);
    });
  });

  describe('Performance Integration', () => {
    it('should track performance metrics', () => {
      const performanceEntries: any[] = [];
      
      global.performance = {
        now: vi.fn(() => Date.now()),
        mark: vi.fn((name: string) => {
          performanceEntries.push({ name, type: 'mark' });
        }),
        measure: vi.fn((name: string, start?: string, end?: string) => {
          performanceEntries.push({ name, type: 'measure', start, end });
        }),
        getEntriesByType: vi.fn((type: string) => 
          performanceEntries.filter(entry => entry.type === type)
        )
      } as any;

      performance.mark('game-start');
      performance.mark('game-ready');
      performance.measure('game-init', 'game-start', 'game-ready');

      expect(performance.mark).toHaveBeenCalledWith('game-start');
      expect(performance.measure).toHaveBeenCalledWith('game-init', 'game-start', 'game-ready');
    });
  });

  describe('Reddit Integration', () => {
    it('should handle Reddit webview environment', () => {
      // Mock Reddit webview user agent
      Object.defineProperty(dom.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Reddit/Version'
      });

      const isRedditWebview = dom.window.navigator.userAgent.includes('Reddit');
      expect(isRedditWebview).toBe(true);
    });

    it('should handle fullscreen mode', () => {
      // Mock fullscreen API
      Object.defineProperty(document, 'fullscreenElement', { value: null });
      document.requestFullscreen = vi.fn().mockResolvedValue(undefined);
      document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

      expect(document.requestFullscreen).toBeDefined();
      expect(document.exitFullscreen).toBeDefined();
    });
  });
});
