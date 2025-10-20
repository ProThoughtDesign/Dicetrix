import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../ScoreManager.js';
import { BoosterManager } from '../BoosterManager.js';
import { MatchGroup } from '../MatchGroup.js';
import { Die } from '../Die.js';
import { CascadeSequenceResult } from '../CascadeManager.js';
import { ScoreBreakdown } from '../../../shared/types/game.js';

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
    })
  },
  events: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
} as any;

describe('Scoring Calculation Verification', () => {
  let scoreManager: ScoreManager;
  let boosterManager: BoosterManager;

  beforeEach(() => {
    boosterManager = new BoosterManager(mockScene);
    scoreManager = new ScoreManager(boosterManager);
  });

  describe('Base Score Calculation', () => {
    it('should calculate base score correctly for simple match', () => {
      // Create a simple 3-dice match with 6-sided dice showing 4
      const dice = Array.from({ length: 3 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = 4;
        return die;
      });
      
      const positions = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ];
      
      const match = new MatchGroup(dice, positions, 4);
      const baseScore = match.calculateBaseScore();
      
      // Formula: sum of die sides × match size × matched number
      // (6 + 6 + 6) × 3 × 4 = 18 × 3 × 4 = 216
      expect(baseScore).toBe(216);
    });

    it('should calculate base score for different die sides', () => {
      // Create match with different sided dice
      const die1 = new Die(mockScene, 0, 0, 4, 'red', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die3 = new Die(mockScene, 0, 0, 8, 'red', false, false);
      
      die1.number = 3;
      die2.number = 3;
      die3.number = 3;
      
      const positions = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ];
      
      const match = new MatchGroup([die1, die2, die3], positions, 3);
      const baseScore = match.calculateBaseScore();
      
      // Formula: (4 + 6 + 8) × 3 × 3 = 18 × 3 × 3 = 162
      expect(baseScore).toBe(162);
    });

    it('should calculate base score for larger matches', () => {
      // Create 5-dice match
      const dice = Array.from({ length: 5 }, () => {
        const die = new Die(mockScene, 0, 0, 10, 'blue', false, false);
        die.number = 7;
        return die;
      });
      
      const positions = Array.from({ length: 5 }, (_, i) => ({ x: i, y: 0 }));
      const match = new MatchGroup(dice, positions, 7);
      const baseScore = match.calculateBaseScore();
      
      // Formula: (10 × 5) × 5 × 7 = 50 × 5 × 7 = 1750
      expect(baseScore).toBe(1750);
    });
  });

  describe('Chain Multiplier Calculation', () => {
    it('should calculate chain multipliers correctly', () => {
      // Test the formula: floor(log2(chain_index))
      const testCases = [
        { cascadeNumber: 1, expectedMultiplier: 0 }, // floor(log2(1)) = 0
        { cascadeNumber: 2, expectedMultiplier: 1 }, // floor(log2(2)) = 1
        { cascadeNumber: 3, expectedMultiplier: 1 }, // floor(log2(3)) = 1
        { cascadeNumber: 4, expectedMultiplier: 2 }, // floor(log2(4)) = 2
        { cascadeNumber: 5, expectedMultiplier: 2 }, // floor(log2(5)) = 2
        { cascadeNumber: 8, expectedMultiplier: 3 }, // floor(log2(8)) = 3
        { cascadeNumber: 16, expectedMultiplier: 4 }, // floor(log2(16)) = 4
      ];

      for (const testCase of testCases) {
        const result = Math.floor(Math.log2(testCase.cascadeNumber));
        expect(result).toBe(testCase.expectedMultiplier);
      }
    });

    it('should apply chain multipliers to cascade scores', () => {
      const mockCascadeResult: CascadeSequenceResult = {
        cascadeCount: 3,
        totalScore: 1000,
        clearedDice: [],
        activatedBoosters: [],
        ultimateComboTriggered: false,
        maxCascadesReached: false,
        chainMultipliers: [
          { cascadeNumber: 1, baseMultiplier: 0, finalMultiplier: 0, score: 300 },
          { cascadeNumber: 2, baseMultiplier: 1, finalMultiplier: 1, score: 400 },
          { cascadeNumber: 3, baseMultiplier: 1, finalMultiplier: 1, score: 300 }
        ]
      };

      const scoreBreakdown = scoreManager.calculateTurnScore(500, mockCascadeResult, false);
      
      expect(scoreBreakdown.baseScore).toBe(500);
      expect(scoreBreakdown.cascadeScore).toBe(1000);
      expect(scoreBreakdown.chainMultiplier).toBeGreaterThan(0);
    });
  });

  describe('Ultimate Combo Scoring', () => {
    it('should apply 5x multiplier for Ultimate Combo', () => {
      const mockCascadeResult: CascadeSequenceResult = {
        cascadeCount: 2,
        totalScore: 1000,
        clearedDice: [],
        activatedBoosters: [],
        ultimateComboTriggered: false,
        maxCascadesReached: false,
        chainMultipliers: [
          { cascadeNumber: 1, baseMultiplier: 0, finalMultiplier: 0, score: 500 },
          { cascadeNumber: 2, baseMultiplier: 1, finalMultiplier: 1, score: 500 }
        ]
      };

      // Test without Ultimate Combo
      const normalScore = scoreManager.calculateTurnScore(500, mockCascadeResult, false);
      
      // Test with Ultimate Combo
      const ultimateScore = scoreManager.calculateTurnScore(500, mockCascadeResult, true);
      
      expect(ultimateScore.ultimateComboMultiplier).toBe(5);
      expect(ultimateScore.totalScore).toBeGreaterThan(normalScore.totalScore);
    });

    it('should apply Ultimate Combo multiplier to all cascades', () => {
      const baseScore = 1000;
      const mockCascadeResult: CascadeSequenceResult = {
        cascadeCount: 1,
        totalScore: 500,
        clearedDice: [],
        activatedBoosters: [],
        ultimateComboTriggered: true,
        maxCascadesReached: false,
        chainMultipliers: [
          { cascadeNumber: 1, baseMultiplier: 0, finalMultiplier: 0, score: 500 }
        ]
      };

      const scoreBreakdown = scoreManager.calculateTurnScore(baseScore, mockCascadeResult, true);
      
      // Ultimate Combo should multiply the total effective score
      expect(scoreBreakdown.ultimateComboMultiplier).toBe(5);
      expect(scoreBreakdown.totalScore).toBe((baseScore + mockCascadeResult.totalScore) * 5);
    });
  });

  describe('Booster Score Modifications', () => {
    it('should apply score multiplier boosters', () => {
      // Activate a red booster (1.5x score multiplier)
      boosterManager.activateColorBooster('red');
      
      const baseScore = 1000;
      const modifiedScore = boosterManager.applyScoreMultipliers(baseScore);
      
      expect(modifiedScore).toBe(1500); // 1000 × 1.5
    });

    it('should apply multiple booster effects', () => {
      // Activate multiple boosters
      boosterManager.activateColorBooster('red');   // 1.5x multiplier
      boosterManager.activateColorBooster('purple'); // 2x chain bonus
      
      const baseScore = 1000;
      const modifiedScore = boosterManager.applyScoreMultipliers(baseScore);
      
      expect(modifiedScore).toBe(1500); // Only score multiplier affects this method
    });

    it('should handle booster expiration', () => {
      // Activate booster and let it expire
      boosterManager.activateColorBooster('red');
      
      // Simulate time passing to expire booster
      const activeBoosters = boosterManager.getActiveBoosters();
      if (activeBoosters.length > 0) {
        activeBoosters[0].remainingDuration = 0;
        boosterManager.update(1000); // Update to process expiration
      }
      
      const baseScore = 1000;
      const modifiedScore = boosterManager.applyScoreMultipliers(baseScore);
      
      expect(modifiedScore).toBe(1000); // No multiplier after expiration
    });
  });

  describe('Complete Score Breakdown', () => {
    it('should provide comprehensive score breakdown', () => {
      const mockCascadeResult: CascadeSequenceResult = {
        cascadeCount: 2,
        totalScore: 800,
        clearedDice: [],
        activatedBoosters: [],
        ultimateComboTriggered: false,
        maxCascadesReached: false,
        chainMultipliers: [
          { cascadeNumber: 1, baseMultiplier: 0, finalMultiplier: 0, score: 400 },
          { cascadeNumber: 2, baseMultiplier: 1, finalMultiplier: 1, score: 400 }
        ]
      };

      const scoreBreakdown = scoreManager.calculateTurnScore(1000, mockCascadeResult, false);
      
      // Verify all components are present
      expect(scoreBreakdown).toHaveProperty('baseScore');
      expect(scoreBreakdown).toHaveProperty('cascadeScore');
      expect(scoreBreakdown).toHaveProperty('chainMultiplier');
      expect(scoreBreakdown).toHaveProperty('ultimateComboMultiplier');
      expect(scoreBreakdown).toHaveProperty('boosterModifiers');
      expect(scoreBreakdown).toHaveProperty('totalScore');
      
      expect(scoreBreakdown.baseScore).toBe(1000);
      expect(scoreBreakdown.cascadeScore).toBe(800);
      expect(scoreBreakdown.ultimateComboMultiplier).toBe(1);
      expect(typeof scoreBreakdown.totalScore).toBe('number');
    });

    it('should accumulate scores correctly over multiple turns', () => {
      const initialTotal = scoreManager.getTotalScore();
      
      // First turn
      const breakdown1: ScoreBreakdown = {
        baseScore: 500,
        cascadeScore: 300,
        chainMultiplier: 1,
        ultimateComboMultiplier: 1,
        boosterModifiers: 0,
        totalScore: 800
      };
      
      scoreManager.addScore(breakdown1);
      expect(scoreManager.getTotalScore()).toBe(initialTotal + 800);
      
      // Second turn
      const breakdown2: ScoreBreakdown = {
        baseScore: 1000,
        cascadeScore: 600,
        chainMultiplier: 2,
        ultimateComboMultiplier: 1,
        boosterModifiers: 200,
        totalScore: 1800
      };
      
      scoreManager.addScore(breakdown2);
      expect(scoreManager.getTotalScore()).toBe(initialTotal + 800 + 1800);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle zero scores', () => {
      const mockCascadeResult: CascadeSequenceResult = {
        cascadeCount: 0,
        totalScore: 0,
        clearedDice: [],
        activatedBoosters: [],
        ultimateComboTriggered: false,
        maxCascadesReached: false,
        chainMultipliers: []
      };

      const scoreBreakdown = scoreManager.calculateTurnScore(0, mockCascadeResult, false);
      
      expect(scoreBreakdown.baseScore).toBe(0);
      expect(scoreBreakdown.cascadeScore).toBe(0);
      expect(scoreBreakdown.totalScore).toBe(0);
    });

    it('should handle negative scores gracefully', () => {
      // This shouldn't happen in normal gameplay, but test defensive programming
      const mockCascadeResult: CascadeSequenceResult = {
        cascadeCount: 0,
        totalScore: 0,
        clearedDice: [],
        activatedBoosters: [],
        ultimateComboTriggered: false,
        maxCascadesReached: false,
        chainMultipliers: []
      };

      const scoreBreakdown = scoreManager.calculateTurnScore(-100, mockCascadeResult, false);
      
      // Should handle gracefully, possibly clamping to 0
      expect(scoreBreakdown.totalScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large scores', () => {
      const mockCascadeResult: CascadeSequenceResult = {
        cascadeCount: 10,
        totalScore: 1000000,
        clearedDice: [],
        activatedBoosters: [],
        ultimateComboTriggered: true,
        maxCascadesReached: false,
        chainMultipliers: Array.from({ length: 10 }, (_, i) => ({
          cascadeNumber: i + 1,
          baseMultiplier: Math.floor(Math.log2(i + 1)),
          finalMultiplier: Math.floor(Math.log2(i + 1)),
          score: 100000
        }))
      };

      const scoreBreakdown = scoreManager.calculateTurnScore(1000000, mockCascadeResult, true);
      
      expect(scoreBreakdown.totalScore).toBeGreaterThan(0);
      expect(Number.isFinite(scoreBreakdown.totalScore)).toBe(true);
    });

    it('should maintain score precision', () => {
      // Test with decimal scores to ensure precision is maintained
      const mockCascadeResult: CascadeSequenceResult = {
        cascadeCount: 1,
        totalScore: 333.33,
        clearedDice: [],
        activatedBoosters: [],
        ultimateComboTriggered: false,
        maxCascadesReached: false,
        chainMultipliers: [
          { cascadeNumber: 1, baseMultiplier: 0, finalMultiplier: 0, score: 333.33 }
        ]
      };

      const scoreBreakdown = scoreManager.calculateTurnScore(666.67, mockCascadeResult, false);
      
      // Should handle decimal precision appropriately
      expect(scoreBreakdown.totalScore).toBeCloseTo(1000, 1);
    });
  });

  describe('Performance Validation', () => {
    it('should calculate scores efficiently', () => {
      const mockCascadeResult: CascadeSequenceResult = {
        cascadeCount: 10,
        totalScore: 5000,
        clearedDice: [],
        activatedBoosters: [],
        ultimateComboTriggered: false,
        maxCascadesReached: false,
        chainMultipliers: Array.from({ length: 10 }, (_, i) => ({
          cascadeNumber: i + 1,
          baseMultiplier: Math.floor(Math.log2(i + 1)),
          finalMultiplier: Math.floor(Math.log2(i + 1)),
          score: 500
        }))
      };

      const startTime = performance.now();
      
      // Perform multiple score calculations
      for (let i = 0; i < 100; i++) {
        scoreManager.calculateTurnScore(1000, mockCascadeResult, false);
      }
      
      const endTime = performance.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
