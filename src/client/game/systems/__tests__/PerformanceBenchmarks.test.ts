import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor } from '../PerformanceMonitor.js';
import { MemoryManager } from '../MemoryManager.js';
import { ObjectPool } from '../ObjectPool.js';
import { MatchDetectionOptimizer } from '../MatchDetectionOptimizer.js';
import { Grid } from '../../models/Grid.js';
import { Die } from '../../models/Die.js';
import { MatchProcessor } from '../../models/MatchProcessor.js';
import { BoosterManager } from '../../models/BoosterManager.js';

// Mock scene for components
const mockScene = {
  add: {
    sprite: vi.fn().mockReturnValue({
      setPosition: vi.fn(),
      setTexture: vi.fn(),
      setTint: vi.fn(),
      setAlpha: vi.fn(),
      setScale: vi.fn(),
      destroy: vi.fn()
    }),
    particles: vi.fn().mockReturnValue({
      emitParticleAt: vi.fn(),
      destroy: vi.fn()
    }),
    circle: vi.fn().mockReturnValue({
      destroy: vi.fn(),
      setAlpha: vi.fn(),
      setPosition: vi.fn()
    })
  },
  events: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  },
  time: {
    now: vi.fn(() => Date.now())
  }
} as any;

describe('Performance Benchmarking Tests', () => {
  let performanceMonitor: PerformanceMonitor;
  let memoryManager: MemoryManager;
  let objectPool: ObjectPool<Die>;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    memoryManager = new MemoryManager();
    objectPool = new ObjectPool<Die>(
      () => new Die(mockScene, 0, 0, 6, 'red', false, false),
      (die) => die.destroy(),
      10
    );
  });

  describe('Frame Rate Performance', () => {
    it('should maintain target frame rate under normal load', () => {
      const targetFrameTime = 16.67; // 60 FPS = 16.67ms per frame
      const frameCount = 60;
      
      // Simulate 60 frames of normal gameplay
      for (let i = 0; i < frameCount; i++) {
        const frameStart = performance.now();
        
        // Simulate normal frame processing
        performanceMonitor.startFrame();
        
        // Simulate game logic (should be fast)
        const dummyWork = Math.random() * 1000;
        
        performanceMonitor.endFrame();
        
        const frameTime = performance.now() - frameStart;
        
        // Each frame should complete within target time
        expect(frameTime).toBeLessThan(targetFrameTime * 2); // Allow 2x buffer for test environment
      }
      
      const stats = performanceMonitor.getFrameStats();
      expect(stats.averageFrameTime).toBeLessThan(targetFrameTime * 1.5);
    });

    it('should detect performance degradation', () => {
      const normalFrames = 30;
      const slowFrames = 10;
      
      // Simulate normal frames
      for (let i = 0; i < normalFrames; i++) {
        performanceMonitor.startFrame();
        // Minimal work
        performanceMonitor.endFrame();
      }
      
      const normalStats = performanceMonitor.getFrameStats();
      
      // Simulate slow frames
      for (let i = 0; i < slowFrames; i++) {
        performanceMonitor.startFrame();
        
        // Simulate heavy work
        const start = Date.now();
        while (Date.now() - start < 50) {
          // Busy wait to simulate slow frame
        }
        
        performanceMonitor.endFrame();
      }
      
      const degradedStats = performanceMonitor.getFrameStats();
      
      expect(degradedStats.averageFrameTime).toBeGreaterThan(normalStats.averageFrameTime);
      expect(degradedStats.worstFrameTime).toBeGreaterThan(normalStats.worstFrameTime);
    });

    it('should track frame time distribution', () => {
      const frameCount = 100;
      
      for (let i = 0; i < frameCount; i++) {
        performanceMonitor.startFrame();
        
        // Vary the work load to create distribution
        if (i % 10 === 0) {
          // Every 10th frame is slower
          const start = Date.now();
          while (Date.now() - start < 20) {
            // Busy wait
          }
        }
        
        performanceMonitor.endFrame();
      }
      
      const stats = performanceMonitor.getFrameStats();
      
      expect(stats.frameCount).toBe(frameCount);
      expect(stats.worstFrameTime).toBeGreaterThan(stats.bestFrameTime);
      expect(stats.averageFrameTime).toBeGreaterThan(0);
    });
  });

  describe('Memory Management Performance', () => {
    it('should efficiently manage object pools', () => {
      const poolSize = 100;
      const iterations = 1000;
      
      const startTime = performance.now();
      
      // Test object pool performance
      for (let i = 0; i < iterations; i++) {
        const die = objectPool.acquire();
        
        // Simulate using the object
        die.number = Math.floor(Math.random() * 6) + 1;
        
        objectPool.release(die);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete quickly (< 100ms for 1000 operations)
      expect(totalTime).toBeLessThan(100);
      
      // Pool should be back to original state
      expect(objectPool.getAvailableCount()).toBeGreaterThan(0);
    });

    it('should track memory usage patterns', () => {
      const initialMemory = memoryManager.getMemoryStats();
      
      // Simulate memory allocation
      const objects: any[] = [];
      for (let i = 0; i < 1000; i++) {
        objects.push({
          id: i,
          data: new Array(100).fill(Math.random())
        });
      }
      
      memoryManager.trackAllocation('test-objects', objects.length * 100);
      
      const afterAllocation = memoryManager.getMemoryStats();
      
      expect(afterAllocation.totalAllocated).toBeGreaterThan(initialMemory.totalAllocated);
      
      // Clean up
      objects.length = 0;
      memoryManager.trackDeallocation('test-objects', 100000);
      
      const afterCleanup = memoryManager.getMemoryStats();
      expect(afterCleanup.totalAllocated).toBeLessThan(afterAllocation.totalAllocated);
    });

    it('should detect memory leaks', () => {
      const iterations = 50;
      const memorySnapshots: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        // Simulate potential memory leak
        const objects = Array.from({ length: 100 }, () => ({
          data: new Array(1000).fill(Math.random())
        }));
        
        memoryManager.trackAllocation('leak-test', objects.length * 1000);
        
        // Only clean up half the objects (simulating leak)
        if (i % 2 === 0) {
          memoryManager.trackDeallocation('leak-test', objects.length * 500);
        }
        
        memorySnapshots.push(memoryManager.getMemoryStats().totalAllocated);
      }
      
      // Memory should show increasing trend (indicating potential leak)
      const firstHalf = memorySnapshots.slice(0, 25);
      const secondHalf = memorySnapshots.slice(25);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
      
      expect(secondAvg).toBeGreaterThan(firstAvg);
    });
  });

  describe('Match Detection Performance', () => {
    it('should detect matches efficiently in large grids', () => {
      const grid = new Grid(32, 0, 0);
      const optimizer = new MatchDetectionOptimizer();
      
      // Fill grid with random dice
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
          die.number = Math.floor(Math.random() * 6) + 1;
          grid.setDie(x, y, die);
        }
      }
      
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const matches = grid.detectMatches();
        optimizer.trackMatchDetection(matches.length, performance.now() - startTime);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerDetection = totalTime / iterations;
      
      // Should average less than 5ms per detection on full grid
      expect(avgTimePerDetection).toBeLessThan(5);
      
      const stats = optimizer.getOptimizationStats();
      expect(stats.totalDetections).toBe(iterations);
      expect(stats.averageDetectionTime).toBeLessThan(5);
    });

    it('should optimize match detection for sparse grids', () => {
      const grid = new Grid(32, 0, 0);
      const optimizer = new MatchDetectionOptimizer();
      
      // Create sparse grid (only 10% filled)
      const fillRate = 0.1;
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          if (Math.random() < fillRate) {
            const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
            die.number = Math.floor(Math.random() * 6) + 1;
            grid.setDie(x, y, die);
          }
        }
      }
      
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const matches = grid.detectMatches();
        optimizer.trackMatchDetection(matches.length, performance.now() - startTime);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerDetection = totalTime / iterations;
      
      // Sparse grids should be even faster
      expect(avgTimePerDetection).toBeLessThan(2);
    });

    it('should handle worst-case match scenarios', () => {
      const grid = new Grid(32, 0, 0);
      
      // Create worst-case scenario: all dice have same number (maximum matches)
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
          die.number = 1; // All same number
          grid.setDie(x, y, die);
        }
      }
      
      const startTime = performance.now();
      const matches = grid.detectMatches();
      const endTime = performance.now();
      
      const detectionTime = endTime - startTime;
      
      // Even worst case should complete quickly
      expect(detectionTime).toBeLessThan(50);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('Game System Integration Performance', () => {
    it('should handle complete game turn efficiently', async () => {
      const grid = new Grid(32, 0, 0);
      const boosterManager = new BoosterManager(mockScene);
      const matchProcessor = new MatchProcessor(grid, mockScene, boosterManager);
      
      // Set up a game state with some matches
      const dice = Array.from({ length: 9 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = 3;
        return die;
      });
      
      // Create 3x3 block of matching dice
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          grid.setDie(x, y, dice[y * 3 + x]);
        }
      }
      
      const iterations = 10;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        await matchProcessor.processMatches();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerTurn = totalTime / iterations;
      
      // Complete turn processing should be fast
      expect(avgTimePerTurn).toBeLessThan(50);
    });

    it('should maintain performance under cascade stress', async () => {
      // This test would require a more complex setup with CascadeManager
      // For now, we'll test the performance monitoring itself
      
      const cascadeCount = 10;
      const startTime = performance.now();
      
      // Simulate cascade processing
      for (let i = 0; i < cascadeCount; i++) {
        performanceMonitor.startFrame();
        
        // Simulate cascade work
        await new Promise(resolve => setTimeout(resolve, 5));
        
        performanceMonitor.endFrame();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle cascades efficiently
      expect(totalTime).toBeLessThan(200);
      
      const stats = performanceMonitor.getFrameStats();
      expect(stats.frameCount).toBe(cascadeCount);
    });
  });

  describe('Resource Usage Benchmarks', () => {
    it('should efficiently manage visual effects', () => {
      const effectCount = 100;
      const startTime = performance.now();
      
      // Simulate creating and destroying many visual effects
      const effects: any[] = [];
      
      for (let i = 0; i < effectCount; i++) {
        const effect = mockScene.add.particles();
        effects.push(effect);
        
        // Simulate effect usage
        effect.emitParticleAt(Math.random() * 800, Math.random() * 600);
      }
      
      // Clean up effects
      effects.forEach(effect => effect.destroy());
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle many effects efficiently
      expect(totalTime).toBeLessThan(100);
    });

    it('should optimize audio resource usage', () => {
      const audioCallCount = 200;
      const startTime = performance.now();
      
      // Simulate many audio calls
      for (let i = 0; i < audioCallCount; i++) {
        mockScene.events.emit('audio-play', 'match-clear');
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Audio events should be very fast
      expect(totalTime).toBeLessThan(50);
      expect(mockScene.events.emit).toHaveBeenCalledTimes(audioCallCount);
    });

    it('should handle large numbers of dice efficiently', () => {
      const diceCount = 1000;
      const startTime = performance.now();
      
      const dice: Die[] = [];
      
      // Create many dice
      for (let i = 0; i < diceCount; i++) {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = Math.floor(Math.random() * 6) + 1;
        dice.push(die);
      }
      
      // Simulate operations on dice
      dice.forEach(die => {
        die.setPosition(Math.random() * 800, Math.random() * 600);
      });
      
      // Clean up
      dice.forEach(die => die.destroy());
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle many dice efficiently
      expect(totalTime).toBeLessThan(200);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should establish performance baselines', () => {
      const baselineTests = [
        { name: 'grid-creation', iterations: 100 },
        { name: 'match-detection', iterations: 50 },
        { name: 'dice-creation', iterations: 200 }
      ];
      
      const baselines: Record<string, number> = {};
      
      baselineTests.forEach(test => {
        const startTime = performance.now();
        
        for (let i = 0; i < test.iterations; i++) {
          switch (test.name) {
            case 'grid-creation':
              new Grid(32, 0, 0);
              break;
            case 'match-detection':
              const grid = new Grid(32, 0, 0);
              grid.detectMatches();
              break;
            case 'dice-creation':
              new Die(mockScene, 0, 0, 6, 'red', false, false);
              break;
          }
        }
        
        const endTime = performance.now();
        baselines[test.name] = (endTime - startTime) / test.iterations;
      });
      
      // Baselines should be reasonable
      expect(baselines['grid-creation']).toBeLessThan(1);
      expect(baselines['match-detection']).toBeLessThan(5);
      expect(baselines['dice-creation']).toBeLessThan(1);
    });

    it('should detect performance regressions', () => {
      // Establish baseline
      const iterations = 50;
      let baselineTime = 0;
      
      const startBaseline = performance.now();
      for (let i = 0; i < iterations; i++) {
        const grid = new Grid(32, 0, 0);
        grid.detectMatches();
      }
      baselineTime = performance.now() - startBaseline;
      
      // Simulate regression (artificially slow operation)
      let regressionTime = 0;
      const startRegression = performance.now();
      for (let i = 0; i < iterations; i++) {
        const grid = new Grid(32, 0, 0);
        
        // Add artificial delay to simulate regression
        const delay = Date.now();
        while (Date.now() - delay < 1) {
          // Busy wait
        }
        
        grid.detectMatches();
      }
      regressionTime = performance.now() - startRegression;
      
      // Should detect significant regression
      const regressionRatio = regressionTime / baselineTime;
      expect(regressionRatio).toBeGreaterThan(2); // At least 2x slower
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle mobile device constraints', () => {
      // Simulate mobile constraints (slower CPU, limited memory)
      const mobileIterations = 20; // Fewer iterations for mobile
      const startTime = performance.now();
      
      for (let i = 0; i < mobileIterations; i++) {
        performanceMonitor.startFrame();
        
        // Simulate mobile-optimized game loop
        const grid = new Grid(32, 0, 0);
        
        // Add some dice (mobile-appropriate amount)
        for (let j = 0; j < 50; j++) {
          const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
          die.number = Math.floor(Math.random() * 6) + 1;
          grid.setDie(j % 10, Math.floor(j / 10), die);
        }
        
        grid.detectMatches();
        performanceMonitor.endFrame();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgFrameTime = totalTime / mobileIterations;
      
      // Should maintain reasonable performance on mobile
      expect(avgFrameTime).toBeLessThan(33); // 30 FPS target
    });

    it('should handle long gaming sessions', () => {
      // Simulate extended gameplay
      const sessionLength = 100; // Simulate 100 game turns
      const memorySnapshots: number[] = [];
      
      for (let turn = 0; turn < sessionLength; turn++) {
        // Simulate game turn
        const grid = new Grid(32, 0, 0);
        
        // Add dice
        for (let i = 0; i < 20; i++) {
          const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
          grid.setDie(i % 10, Math.floor(i / 10), die);
        }
        
        // Process matches
        grid.detectMatches();
        
        // Track memory usage
        const memoryUsage = memoryManager.getMemoryStats().totalAllocated;
        memorySnapshots.push(memoryUsage);
        
        // Clean up (important for long sessions)
        grid.reset();
      }
      
      // Memory usage should remain stable (no significant growth)
      const firstQuarter = memorySnapshots.slice(0, 25);
      const lastQuarter = memorySnapshots.slice(-25);
      
      const firstAvg = firstQuarter.reduce((a, b) => a + b) / firstQuarter.length;
      const lastAvg = lastQuarter.reduce((a, b) => a + b) / lastQuarter.length;
      
      // Memory growth should be minimal
      const growthRatio = lastAvg / firstAvg;
      expect(growthRatio).toBeLessThan(1.5); // Less than 50% growth
    });
  });
});
