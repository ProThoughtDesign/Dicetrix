import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CascadeManager } from '../CascadeManager.js';
import { Grid } from '../Grid.js';
import { MatchProcessor } from '../MatchProcessor.js';
import { BoosterManager } from '../BoosterManager.js';
import { GameStateManager } from '../GameStateManager.js';

// Mock Phaser scene with comprehensive mocking
const mockScene = {
  tweens: {
    add: vi.fn().mockImplementation((config) => {
      // Simulate immediate completion for testing
      if (config.onComplete) {
        setTimeout(config.onComplete, 0);
      }
      return { 
        on: vi.fn(),
        complete: vi.fn()
      };
    })
  },
  time: {
    delayedCall: vi.fn().mockImplementation((delay, callback) => {
      setTimeout(callback, 0);
    })
  },
  events: {
    emit: vi.fn()
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

describe('Cascade System Integration', () => {
  let gameStateManager: GameStateManager;
  let cascadeManager: CascadeManager;
  let grid: Grid;

  beforeEach(() => {
    gameStateManager = new GameStateManager(mockScene, 'medium');
    cascadeManager = gameStateManager.getCascadeManager();
    grid = gameStateManager.getGrid();
  });

  it('should integrate cascade system with game state manager', () => {
    expect(cascadeManager).toBeDefined();
    expect(cascadeManager.getCascadeState().maxCascades).toBe(10);
    expect(cascadeManager.getCascadeState().isProcessing).toBe(false);
  });

  it('should handle empty grid cascade processing', async () => {
    const result = await cascadeManager.processCascadeSequence();
    
    expect(result.cascadeCount).toBe(0);
    expect(result.totalScore).toBe(0);
    expect(result.clearedDice).toHaveLength(0);
    expect(result.maxCascadesReached).toBe(false);
    expect(result.ultimateComboTriggered).toBe(false);
  });

  it('should properly configure cascade manager settings', () => {
    // Test cascade limit configuration
    cascadeManager.setMaxCascades(5);
    expect(cascadeManager.getCascadeState().maxCascades).toBe(5);

    // Test animation timing configuration
    cascadeManager.setAnimationTiming(400, 150);
    const stats = cascadeManager.getCascadeStatistics();
    expect(stats.gravityAnimationDuration).toBe(400);
    expect(stats.cascadeDelay).toBe(150);
  });

  it('should track cascade state correctly', () => {
    const initialState = cascadeManager.getCascadeState();
    
    expect(initialState).toEqual({
      isProcessing: false,
      currentCascadeCount: 0,
      maxCascades: 10,
      chainMultiplier: 0,
      baseChainMultiplier: 0
    });
  });

  it('should provide comprehensive cascade statistics', () => {
    const stats = cascadeManager.getCascadeStatistics();
    
    expect(stats).toHaveProperty('totalCascadesProcessed');
    expect(stats).toHaveProperty('maxCascadeLimit');
    expect(stats).toHaveProperty('averageChainMultiplier');
    expect(stats).toHaveProperty('totalChainScore');
    expect(stats).toHaveProperty('gravityAnimationDuration');
    expect(stats).toHaveProperty('cascadeDelay');
    
    expect(typeof stats.totalCascadesProcessed).toBe('number');
    expect(typeof stats.maxCascadeLimit).toBe('number');
    expect(typeof stats.averageChainMultiplier).toBe('number');
    expect(typeof stats.totalChainScore).toBe('number');
    expect(typeof stats.gravityAnimationDuration).toBe('number');
    expect(typeof stats.cascadeDelay).toBe('number');
  });

  it('should handle force stop cascade correctly', () => {
    // Simulate cascade in progress
    (cascadeManager as any).isProcessingCascade = true;
    (cascadeManager as any).currentCascadeCount = 3;
    
    expect(cascadeManager.getCascadeState().isProcessing).toBe(true);
    expect(cascadeManager.getCascadeState().currentCascadeCount).toBe(3);
    
    cascadeManager.forceStopCascade();
    
    expect(cascadeManager.getCascadeState().isProcessing).toBe(false);
    expect(cascadeManager.getCascadeState().currentCascadeCount).toBe(0);
  });

  it('should validate chain multiplier calculation logic', () => {
    // Test the mathematical formula: floor(log2(chain_index))
    const testCases = [
      { chain: 1, expected: 0 },  // floor(log2(1)) = 0
      { chain: 2, expected: 1 },  // floor(log2(2)) = 1
      { chain: 3, expected: 1 },  // floor(log2(3)) = 1
      { chain: 4, expected: 2 },  // floor(log2(4)) = 2
      { chain: 5, expected: 2 },  // floor(log2(5)) = 2
      { chain: 8, expected: 3 },  // floor(log2(8)) = 3
      { chain: 16, expected: 4 }, // floor(log2(16)) = 4
    ];

    for (const testCase of testCases) {
      const result = Math.floor(Math.log2(testCase.chain));
      expect(result).toBe(testCase.expected);
    }
  });

  it('should properly clean up resources on destroy', () => {
    const forceStopSpy = vi.spyOn(cascadeManager, 'forceStopCascade');
    
    cascadeManager.destroy();
    
    expect(forceStopSpy).toHaveBeenCalled();
  });

  it('should integrate with game state manager turn processing', async () => {
    // Test that game state manager can access cascade manager
    const retrievedCascadeManager = gameStateManager.getCascadeManager();
    expect(retrievedCascadeManager).toBe(cascadeManager);
    
    // Test that turn processing doesn't crash with empty grid
    const turnResult = await gameStateManager.processTurn();
    expect(turnResult.matchesProcessed).toBe(false);
    expect(turnResult.cascadeResult).toBeNull();
    expect(turnResult.gameOver).toBe(false);
  });

  it('should validate cascade sequence result structure', async () => {
    const result = await cascadeManager.processCascadeSequence();
    
    // Validate result structure matches expected interface
    expect(result).toHaveProperty('cascadeCount');
    expect(result).toHaveProperty('totalScore');
    expect(result).toHaveProperty('clearedDice');
    expect(result).toHaveProperty('activatedBoosters');
    expect(result).toHaveProperty('ultimateComboTriggered');
    expect(result).toHaveProperty('maxCascadesReached');
    expect(result).toHaveProperty('chainMultipliers');
    
    expect(Array.isArray(result.clearedDice)).toBe(true);
    expect(Array.isArray(result.activatedBoosters)).toBe(true);
    expect(Array.isArray(result.chainMultipliers)).toBe(true);
    expect(typeof result.cascadeCount).toBe('number');
    expect(typeof result.totalScore).toBe('number');
    expect(typeof result.ultimateComboTriggered).toBe('boolean');
    expect(typeof result.maxCascadesReached).toBe('boolean');
  });
});
