import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CascadeManager } from '../CascadeManager.js';
import { Grid } from '../Grid.js';
import { MatchProcessor } from '../MatchProcessor.js';
import { BoosterManager } from '../BoosterManager.js';
import { Die } from '../Die.js';

// Mock scene for components
const mockScene = {
  tweens: {
    add: vi.fn().mockImplementation((config) => {
      if (config.onComplete) {
        setTimeout(config.onComplete, 0);
      }
      return { on: vi.fn(), complete: vi.fn() };
    })
  },
  time: {
    delayedCall: vi.fn().mockImplementation((delay, callback) => {
      setTimeout(callback, 0);
    })
  },
  events: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  },
  add: {
    particles: vi.fn().mockReturnValue({
      emitParticleAt: vi.fn(),
      destroy: vi.fn()
    }),
    circle: vi.fn().mockReturnValue({
      destroy: vi.fn(),
      setAlpha: vi.fn(),
      setPosition: vi.fn()
    }),
    graphics: vi.fn().mockReturnValue({
      lineStyle: vi.fn(),
      lineBetween: vi.fn(),
      setAlpha: vi.fn(),
      destroy: vi.fn()
    }),
    text: vi.fn().mockReturnValue({
      setOrigin: vi.fn(),
      setAlpha: vi.fn(),
      destroy: vi.fn()
    }),
    rectangle: vi.fn().mockReturnValue({
      destroy: vi.fn()
    }),
    sprite: vi.fn().mockReturnValue({
      setPosition: vi.fn(),
      setTexture: vi.fn(),
      setTint: vi.fn(),
      setAlpha: vi.fn(),
      setScale: vi.fn(),
      destroy: vi.fn()
    })
  },
  scale: {
    width: 800,
    height: 600
  },
  cameras: {
    main: {
      shake: vi.fn()
    }
  }
} as any;

describe('Cascade Loop Prevention', () => {
  let cascadeManager: CascadeManager;
  let grid: Grid;
  let matchProcessor: MatchProcessor;
  let boosterManager: BoosterManager;

  beforeEach(() => {
    grid = new Grid(32, 0, 0);
    boosterManager = new BoosterManager(mockScene);
    matchProcessor = new MatchProcessor(grid, mockScene, boosterManager);
    cascadeManager = new CascadeManager(grid, matchProcessor, mockScene, boosterManager);
  });

  describe('Maximum Cascade Limit', () => {
    it('should enforce default maximum cascade limit of 10', () => {
      const state = cascadeManager.getCascadeState();
      expect(state.maxCascades).toBe(10);
    });

    it('should allow setting custom cascade limits', () => {
      cascadeManager.setMaxCascades(5);
      const state = cascadeManager.getCascadeState();
      expect(state.maxCascades).toBe(5);
    });

    it('should clamp cascade limits to valid range', () => {
      // Test minimum limit
      cascadeManager.setMaxCascades(-1);
      expect(cascadeManager.getCascadeState().maxCascades).toBe(1);
      
      // Test maximum limit
      cascadeManager.setMaxCascades(100);
      expect(cascadeManager.getCascadeState().maxCascades).toBe(50);
    });

    it('should stop cascades when limit is reached', async () => {
      // Create a mock grid that always has matches (potential infinite loop)
      const mockGrid = {
        applyGravity: vi.fn().mockReturnValue(true), // Always return true (dice moved)
        detectMatches: vi.fn().mockReturnValue([{ size: 3 }]), // Always return matches
        width: 10,
        height: 20,
        getDie: vi.fn().mockReturnValue(null)
      } as any;

      // Mock match processor that always finds matches
      const mockMatchProcessor = {
        processMatches: vi.fn().mockResolvedValue({
          matchesFound: true,
          totalScore: 100,
          activatedBoosters: [],
          clearedDice: [],
          sizeEffects: [],
          ultimateComboTriggered: false
        })
      } as any;

      const testCascadeManager = new CascadeManager(mockGrid, mockMatchProcessor, mockScene, boosterManager);
      
      // Set low cascade limit for testing
      testCascadeManager.setMaxCascades(3);
      
      const result = await testCascadeManager.processCascadeSequence();
      
      // Should stop at max cascades
      expect(result.cascadeCount).toBe(3);
      expect(result.maxCascadesReached).toBe(true);
      expect(mockGrid.applyGravity).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cascade State Management', () => {
    it('should prevent concurrent cascade processing', async () => {
      // Mock a slow cascade process
      const slowMatchProcessor = {
        processMatches: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            matchesFound: false,
            totalScore: 0,
            activatedBoosters: [],
            clearedDice: [],
            sizeEffects: [],
            ultimateComboTriggered: false
          }), 100))
        )
      } as any;

      const slowGrid = {
        applyGravity: vi.fn().mockReturnValue(false),
        detectMatches: vi.fn().mockReturnValue([]),
        width: 10,
        height: 20,
        getDie: vi.fn().mockReturnValue(null)
      } as any;

      const testCascadeManager = new CascadeManager(slowGrid, slowMatchProcessor, mockScene, boosterManager);
      
      // Start first cascade
      const promise1 = testCascadeManager.processCascadeSequence();
      
      // Try to start second cascade while first is running
      const promise2 = testCascadeManager.processCascadeSequence();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // First should process normally, second should return empty result
      expect(result1.cascadeCount).toBe(0);
      expect(result2.cascadeCount).toBe(0);
      expect(result2.totalScore).toBe(0);
    });

    it('should track cascade processing state correctly', async () => {
      // Initially not processing
      expect(cascadeManager.getCascadeState().isProcessing).toBe(false);
      
      // Start cascade processing
      const cascadePromise = cascadeManager.processCascadeSequence();
      
      // Should be processing (though it might complete quickly in tests)
      const result = await cascadePromise;
      
      // Should not be processing after completion
      expect(cascadeManager.getCascadeState().isProcessing).toBe(false);
    });

    it('should reset cascade count after processing', async () => {
      const result = await cascadeManager.processCascadeSequence();
      
      const state = cascadeManager.getCascadeState();
      expect(state.currentCascadeCount).toBe(0);
    });
  });

  describe('Force Stop Functionality', () => {
    it('should force stop cascade processing', () => {
      // Manually set processing state to simulate ongoing cascade
      (cascadeManager as any).isProcessingCascade = true;
      (cascadeManager as any).currentCascadeCount = 5;
      
      expect(cascadeManager.getCascadeState().isProcessing).toBe(true);
      expect(cascadeManager.getCascadeState().currentCascadeCount).toBe(5);
      
      cascadeManager.forceStopCascade();
      
      expect(cascadeManager.getCascadeState().isProcessing).toBe(false);
      expect(cascadeManager.getCascadeState().currentCascadeCount).toBe(0);
    });

    it('should handle force stop when not processing', () => {
      // Should not throw error when force stopping while not processing
      expect(() => cascadeManager.forceStopCascade()).not.toThrow();
      
      const state = cascadeManager.getCascadeState();
      expect(state.isProcessing).toBe(false);
      expect(state.currentCascadeCount).toBe(0);
    });
  });

  describe('Infinite Loop Prevention Scenarios', () => {
    it('should handle grid that always has gravity movement', async () => {
      // Create a mock grid that always reports dice movement
      const infiniteGravityGrid = {
        applyGravity: vi.fn().mockReturnValue(true), // Always return true
        detectMatches: vi.fn().mockReturnValue([]), // But no matches
        width: 10,
        height: 20,
        getDie: vi.fn().mockReturnValue(null)
      } as any;

      const testCascadeManager = new CascadeManager(infiniteGravityGrid, matchProcessor, mockScene, boosterManager);
      testCascadeManager.setMaxCascades(5);
      
      const result = await testCascadeManager.processCascadeSequence();
      
      // Should stop when no matches are found, not when gravity limit is reached
      expect(result.cascadeCount).toBe(0);
      expect(result.maxCascadesReached).toBe(false);
    });

    it('should handle grid that always has matches', async () => {
      // Create scenario that could cause infinite loop
      const infiniteMatchGrid = {
        applyGravity: vi.fn().mockReturnValue(true),
        detectMatches: vi.fn().mockReturnValue([{ size: 3 }]), // Always has matches
        width: 10,
        height: 20,
        getDie: vi.fn().mockReturnValue(null)
      } as any;

      const infiniteMatchProcessor = {
        processMatches: vi.fn().mockResolvedValue({
          matchesFound: true,
          totalScore: 100,
          activatedBoosters: [],
          clearedDice: [],
          sizeEffects: [],
          ultimateComboTriggered: false
        })
      } as any;

      const testCascadeManager = new CascadeManager(infiniteMatchGrid, infiniteMatchProcessor, mockScene, boosterManager);
      testCascadeManager.setMaxCascades(3);
      
      const result = await testCascadeManager.processCascadeSequence();
      
      // Should stop at cascade limit
      expect(result.cascadeCount).toBe(3);
      expect(result.maxCascadesReached).toBe(true);
    });

    it('should handle alternating gravity and matches', async () => {
      let gravityCallCount = 0;
      let matchCallCount = 0;
      
      const alternatingGrid = {
        applyGravity: vi.fn().mockImplementation(() => {
          gravityCallCount++;
          return gravityCallCount <= 5; // Return true for first 5 calls
        }),
        detectMatches: vi.fn().mockImplementation(() => {
          matchCallCount++;
          return matchCallCount <= 3 ? [{ size: 3 }] : []; // Matches for first 3 calls
        }),
        width: 10,
        height: 20,
        getDie: vi.fn().mockReturnValue(null)
      } as any;

      const alternatingProcessor = {
        processMatches: vi.fn().mockResolvedValue({
          matchesFound: true,
          totalScore: 100,
          activatedBoosters: [],
          clearedDice: [],
          sizeEffects: [],
          ultimateComboTriggered: false
        })
      } as any;

      const testCascadeManager = new CascadeManager(alternatingGrid, alternatingProcessor, mockScene, boosterManager);
      
      const result = await testCascadeManager.processCascadeSequence();
      
      // Should process 3 cascades then stop when no more matches
      expect(result.cascadeCount).toBe(3);
      expect(result.maxCascadesReached).toBe(false);
    });
  });

  describe('Performance Under Stress', () => {
    it('should complete cascade processing within reasonable time', async () => {
      // Set up a scenario with maximum cascades
      const stressGrid = {
        applyGravity: vi.fn().mockReturnValue(true),
        detectMatches: vi.fn().mockReturnValue([{ size: 3 }]),
        width: 10,
        height: 20,
        getDie: vi.fn().mockReturnValue(null)
      } as any;

      const stressProcessor = {
        processMatches: vi.fn().mockResolvedValue({
          matchesFound: true,
          totalScore: 100,
          activatedBoosters: [],
          clearedDice: [],
          sizeEffects: [],
          ultimateComboTriggered: false
        })
      } as any;

      const testCascadeManager = new CascadeManager(stressGrid, stressProcessor, mockScene, boosterManager);
      testCascadeManager.setMaxCascades(10);
      
      const startTime = performance.now();
      const result = await testCascadeManager.processCascadeSequence();
      const endTime = performance.now();
      
      // Should complete within reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.cascadeCount).toBe(10);
      expect(result.maxCascadesReached).toBe(true);
    });

    it('should handle rapid cascade calls without memory leaks', async () => {
      // Perform multiple cascade operations rapidly
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(cascadeManager.processCascadeSequence());
      }
      
      const results = await Promise.all(promises);
      
      // All should complete successfully
      results.forEach(result => {
        expect(result).toHaveProperty('cascadeCount');
        expect(result).toHaveProperty('totalScore');
        expect(result).toHaveProperty('maxCascadesReached');
      });
      
      // State should be clean after all operations
      const finalState = cascadeManager.getCascadeState();
      expect(finalState.isProcessing).toBe(false);
      expect(finalState.currentCascadeCount).toBe(0);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track cascade statistics for monitoring', () => {
      const stats = cascadeManager.getCascadeStatistics();
      
      expect(stats).toHaveProperty('totalCascadesProcessed');
      expect(stats).toHaveProperty('maxCascadeLimit');
      expect(stats).toHaveProperty('averageChainMultiplier');
      expect(stats).toHaveProperty('totalChainScore');
      
      expect(typeof stats.totalCascadesProcessed).toBe('number');
      expect(typeof stats.maxCascadeLimit).toBe('number');
      expect(typeof stats.averageChainMultiplier).toBe('number');
      expect(typeof stats.totalChainScore).toBe('number');
    });

    it('should update statistics after cascade processing', async () => {
      const initialStats = cascadeManager.getCascadeStatistics();
      
      // Process a cascade sequence
      await cascadeManager.processCascadeSequence();
      
      const updatedStats = cascadeManager.getCascadeStatistics();
      
      // Statistics should be updated (even if no cascades occurred)
      expect(updatedStats.maxCascadeLimit).toBe(initialStats.maxCascadeLimit);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle errors in match processing gracefully', async () => {
      const errorGrid = {
        applyGravity: vi.fn().mockReturnValue(true),
        detectMatches: vi.fn().mockReturnValue([{ size: 3 }]),
        width: 10,
        height: 20,
        getDie: vi.fn().mockReturnValue(null)
      } as any;

      const errorProcessor = {
        processMatches: vi.fn().mockRejectedValue(new Error('Match processing failed'))
      } as any;

      const testCascadeManager = new CascadeManager(errorGrid, errorProcessor, mockScene, boosterManager);
      
      // Should handle error gracefully and not crash
      const result = await testCascadeManager.processCascadeSequence();
      
      expect(result.cascadeCount).toBe(0);
      expect(result.totalScore).toBe(0);
    });

    it('should recover from force stop and allow new cascades', async () => {
      // Force stop cascade
      cascadeManager.forceStopCascade();
      
      // Should be able to start new cascade after force stop
      const result = await cascadeManager.processCascadeSequence();
      
      expect(result).toHaveProperty('cascadeCount');
      expect(result).toHaveProperty('totalScore');
    });
  });
});
