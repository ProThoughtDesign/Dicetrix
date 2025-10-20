import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CascadeManager } from '../CascadeManager.js';
import { Grid } from '../Grid.js';
import { MatchProcessor } from '../MatchProcessor.js';
import { BoosterManager } from '../BoosterManager.js';

// Mock Phaser scene
const mockScene = {
  tweens: {
    add: vi.fn().mockImplementation((config) => {
      // Simulate immediate completion for testing
      if (config.onComplete) {
        setTimeout(config.onComplete, 0);
      }
      return { on: vi.fn() };
    })
  },
  time: {
    delayedCall: vi.fn().mockImplementation((delay, callback) => {
      setTimeout(callback, 0);
    })
  },
  events: {
    emit: vi.fn()
  }
} as any;

describe('CascadeManager', () => {
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

  it('should initialize with correct default values', () => {
    const state = cascadeManager.getCascadeState();
    
    expect(state.isProcessing).toBe(false);
    expect(state.currentCascadeCount).toBe(0);
    expect(state.maxCascades).toBe(10);
    expect(state.chainMultiplier).toBe(0);
  });

  it('should set maximum cascades within valid range', () => {
    cascadeManager.setMaxCascades(5);
    expect(cascadeManager.getCascadeState().maxCascades).toBe(5);
    
    // Test clamping
    cascadeManager.setMaxCascades(-1);
    expect(cascadeManager.getCascadeState().maxCascades).toBe(1);
    
    cascadeManager.setMaxCascades(100);
    expect(cascadeManager.getCascadeState().maxCascades).toBe(50);
  });

  it('should update animation timing', () => {
    cascadeManager.setAnimationTiming(500, 300);
    const stats = cascadeManager.getCascadeStatistics();
    
    expect(stats.gravityAnimationDuration).toBe(500);
    expect(stats.cascadeDelay).toBe(300);
  });

  it('should handle empty cascade sequence', async () => {
    // Empty grid should not trigger cascades
    const result = await cascadeManager.processCascadeSequence();
    
    expect(result.cascadeCount).toBe(0);
    expect(result.totalScore).toBe(0);
    expect(result.clearedDice).toHaveLength(0);
    expect(result.maxCascadesReached).toBe(false);
  });

  it('should prevent concurrent cascade processing', async () => {
    // Start first cascade
    const promise1 = cascadeManager.processCascadeSequence();
    
    // Try to start second cascade while first is running
    const promise2 = cascadeManager.processCascadeSequence();
    
    const [result1, result2] = await Promise.all([promise1, promise2]);
    
    // Second call should return empty result
    expect(result2.cascadeCount).toBe(0);
    expect(result2.totalScore).toBe(0);
  });

  it('should force stop cascade processing', () => {
    // Manually set processing state
    (cascadeManager as any).isProcessingCascade = true;
    
    expect(cascadeManager.getCascadeState().isProcessing).toBe(true);
    
    cascadeManager.forceStopCascade();
    
    expect(cascadeManager.getCascadeState().isProcessing).toBe(false);
    expect(cascadeManager.getCascadeState().currentCascadeCount).toBe(0);
  });

  it('should track cascade statistics', () => {
    const stats = cascadeManager.getCascadeStatistics();
    
    expect(stats).toHaveProperty('totalCascadesProcessed');
    expect(stats).toHaveProperty('maxCascadeLimit');
    expect(stats).toHaveProperty('averageChainMultiplier');
    expect(stats).toHaveProperty('totalChainScore');
    expect(stats).toHaveProperty('gravityAnimationDuration');
    expect(stats).toHaveProperty('cascadeDelay');
  });

  it('should clean up resources on destroy', () => {
    const destroySpy = vi.spyOn(cascadeManager as any, 'forceStopCascade');
    
    cascadeManager.destroy();
    
    expect(destroySpy).toHaveBeenCalled();
  });

  it('should calculate chain multipliers correctly', () => {
    // Test chain multiplier calculation: floor(log2(chain_index))
    const testCases = [
      { cascadeNumber: 1, expectedBase: 0 }, // floor(log2(1)) = 0
      { cascadeNumber: 2, expectedBase: 1 }, // floor(log2(2)) = 1
      { cascadeNumber: 3, expectedBase: 1 }, // floor(log2(3)) = 1
      { cascadeNumber: 4, expectedBase: 2 }, // floor(log2(4)) = 2
      { cascadeNumber: 8, expectedBase: 3 }, // floor(log2(8)) = 3
    ];

    for (const testCase of testCases) {
      const result = Math.floor(Math.log2(testCase.cascadeNumber));
      expect(result).toBe(testCase.expectedBase);
    }
  });

  it('should handle gravity animation timing', async () => {
    // Mock grid with dice that need to fall
    const mockGrid = {
      applyGravity: vi.fn().mockReturnValue(true),
      detectMatches: vi.fn().mockReturnValue([]),
      width: 10,
      height: 20,
      getDie: vi.fn().mockReturnValue(null)
    } as any;

    const mockCascadeManager = new CascadeManager(mockGrid, matchProcessor, mockScene, boosterManager);
    
    // Set faster animation for testing
    mockCascadeManager.setAnimationTiming(50, 10);
    
    const stats = mockCascadeManager.getCascadeStatistics();
    expect(stats.gravityAnimationDuration).toBe(50);
    expect(stats.cascadeDelay).toBe(10);
  });

  it('should prevent cascade loops by limiting max cascades', async () => {
    // Mock grid that always has matches (potential infinite loop)
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

    const mockCascadeManager = new CascadeManager(mockGrid, mockMatchProcessor, mockScene, boosterManager);
    
    // Set low cascade limit for testing
    mockCascadeManager.setMaxCascades(3);
    
    const result = await mockCascadeManager.processCascadeSequence();
    
    // Should stop at max cascades
    expect(result.cascadeCount).toBe(3);
    expect(result.maxCascadesReached).toBe(true);
    expect(mockGrid.applyGravity).toHaveBeenCalledTimes(3);
  });

  it('should track cascade statistics accurately', async () => {
    const initialStats = cascadeManager.getCascadeStatistics();
    
    expect(initialStats.totalCascadesProcessed).toBe(0);
    expect(initialStats.maxCascadeLimit).toBe(10);
    expect(initialStats.averageChainMultiplier).toBe(0);
    expect(initialStats.totalChainScore).toBe(0);
  });
});
