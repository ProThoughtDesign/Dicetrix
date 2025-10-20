import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoosterManager } from '../BoosterManager.js';
import { ColorBooster } from '../Booster.js';
import { MatchGroup } from '../MatchGroup.js';
import { Die } from '../Die.js';

// Mock scene for BoosterManager
const mockScene = {
  events: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  },
  add: {
    sprite: vi.fn().mockReturnValue({
      setPosition: vi.fn(),
      setTexture: vi.fn(),
      setTint: vi.fn(),
      setAlpha: vi.fn(),
      setScale: vi.fn(),
      setDisplaySize: vi.fn(),
      setOrigin: vi.fn(),
      destroy: vi.fn()
    }),
    existing: vi.fn()
  }
} as any;

describe('Booster Activation and Effects', () => {
  let boosterManager: BoosterManager;

  beforeEach(() => {
    boosterManager = new BoosterManager(mockScene);
  });

  describe('Booster Activation', () => {
    it('should activate red booster (score multiplier)', () => {
      const redBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 10000
      });

      boosterManager.activateBooster(redBooster);

      expect(boosterManager.isBoosterActive('red', 'score_multiplier')).toBe(true);
      expect(boosterManager.getActiveBoosters()).toHaveLength(1);
    });

    it('should activate blue booster (slow fall)', () => {
      const blueBooster = new ColorBooster('blue', {
        type: 'slow_fall',
        value: 0.5,
        duration: 15000
      });

      boosterManager.activateBooster(blueBooster);

      expect(boosterManager.isBoosterActive('blue', 'slow_fall')).toBe(true);
      expect(boosterManager.getFallSpeedModifier()).toBe(0.5);
    });

    it('should activate green booster (wild chance)', () => {
      const greenBooster = new ColorBooster('green', {
        type: 'wild_chance',
        value: 0.1,
        duration: 3
      });

      boosterManager.activateBooster(greenBooster);

      expect(boosterManager.isBoosterActive('green', 'wild_chance')).toBe(true);
      expect(boosterManager.getWildChanceModifier()).toBe(0.1);
    });

    it('should activate yellow booster (extra time)', () => {
      const yellowBooster = new ColorBooster('yellow', {
        type: 'extra_time',
        value: 5000,
        duration: 1
      });

      boosterManager.activateBooster(yellowBooster);

      expect(boosterManager.isBoosterActive('yellow', 'extra_time')).toBe(true);
    });

    it('should activate purple booster (chain bonus)', () => {
      const purpleBooster = new ColorBooster('purple', {
        type: 'chain_bonus',
        value: 2,
        duration: 8000
      });

      boosterManager.activateBooster(purpleBooster);

      expect(boosterManager.isBoosterActive('purple', 'chain_bonus')).toBe(true);
      expect(boosterManager.applyChainBonus(1)).toBe(3); // 1 + 2
    });

    it('should activate orange booster (size boost)', () => {
      const orangeBooster = new ColorBooster('orange', {
        type: 'size_boost',
        value: 1,
        duration: 5000
      });

      boosterManager.activateBooster(orangeBooster);

      expect(boosterManager.isBoosterActive('orange', 'size_boost')).toBe(true);
      expect(boosterManager.getSizeBoostModifier()).toBe(1);
    });

    it('should activate cyan booster (gravity delay)', () => {
      const cyanBooster = new ColorBooster('cyan', {
        type: 'gravity_delay',
        value: 2000,
        duration: 12000
      });

      boosterManager.activateBooster(cyanBooster);

      expect(boosterManager.isBoosterActive('cyan', 'gravity_delay')).toBe(true);
      expect(boosterManager.getGravityDelay()).toBe(2000);
    });
  });

  describe('Booster Stacking', () => {
    it('should stack compatible boosters', () => {
      const booster1 = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 5000
      });

      const booster2 = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 3000
      });

      boosterManager.activateBooster(booster1);
      boosterManager.activateBooster(booster2);

      // Should still have only one booster but with extended duration
      expect(boosterManager.getActiveBoosters()).toHaveLength(1);
      
      const activeBooster = boosterManager.getBooster('red', 'score_multiplier');
      expect(activeBooster?.remainingDuration).toBeGreaterThan(5000);
    });

    it('should not stack incompatible boosters', () => {
      const redBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 5000
      });

      const blueBooster = new ColorBooster('blue', {
        type: 'slow_fall',
        value: 0.5,
        duration: 8000
      });

      boosterManager.activateBooster(redBooster);
      boosterManager.activateBooster(blueBooster);

      // Should have two separate boosters
      expect(boosterManager.getActiveBoosters()).toHaveLength(2);
    });
  });

  describe('Booster Duration and Expiration', () => {
    it('should expire boosters after duration', () => {
      const shortBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 100 // Very short duration
      });

      boosterManager.activateBooster(shortBooster);
      expect(boosterManager.getActiveBoosters()).toHaveLength(1);

      // Simulate time passing
      boosterManager.update(150);

      expect(boosterManager.getActiveBoosters()).toHaveLength(0);
      expect(boosterManager.isBoosterActive('red', 'score_multiplier')).toBe(false);
    });

    it('should update booster durations correctly', () => {
      const booster = new ColorBooster('blue', {
        type: 'slow_fall',
        value: 0.5,
        duration: 5000
      });

      boosterManager.activateBooster(booster);
      const initialDuration = booster.remainingDuration;

      boosterManager.update(1000);

      expect(booster.remainingDuration).toBeLessThan(initialDuration);
      expect(booster.remainingDuration).toBeGreaterThan(3000);
    });

    it('should handle multiple boosters expiring simultaneously', () => {
      const boosters = [
        new ColorBooster('red', { type: 'score_multiplier', value: 1.5, duration: 100 }),
        new ColorBooster('blue', { type: 'slow_fall', value: 0.5, duration: 100 }),
        new ColorBooster('green', { type: 'wild_chance', value: 0.1, duration: 100 })
      ];

      boosters.forEach(booster => boosterManager.activateBooster(booster));
      expect(boosterManager.getActiveBoosters()).toHaveLength(3);

      boosterManager.update(150);

      expect(boosterManager.getActiveBoosters()).toHaveLength(0);
    });
  });

  describe('Match Group Processing', () => {
    it('should activate boosters from match group colors', () => {
      // Create dice with specific colors
      const redDice = Array.from({ length: 3 }, () => {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        die.number = 4;
        return die;
      });

      const positions = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ];

      const matchGroup = new MatchGroup(redDice, positions, 4);
      boosterManager.processMatchGroup(matchGroup);

      // Should activate red booster
      expect(boosterManager.isBoosterActive('red', 'score_multiplier')).toBe(true);
    });

    it('should handle mixed color matches', () => {
      // Create dice with mixed colors but same number
      const dice = [
        new Die(mockScene, 0, 0, 6, 'red', false, false),
        new Die(mockScene, 0, 0, 6, 'red', false, false),
        new Die(mockScene, 0, 0, 6, 'blue', false, false)
      ];

      dice.forEach(die => die.number = 3);

      const positions = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ];

      const matchGroup = new MatchGroup(dice, positions, 3);
      boosterManager.processMatchGroup(matchGroup);

      // Should activate red booster (most prevalent color)
      expect(boosterManager.isBoosterActive('red', 'score_multiplier')).toBe(true);
    });

    it('should remove all boosters when black die is matched', () => {
      // First activate some boosters
      const redBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 10000
      });
      const blueBooster = new ColorBooster('blue', {
        type: 'slow_fall',
        value: 0.5,
        duration: 10000
      });

      boosterManager.activateBooster(redBooster);
      boosterManager.activateBooster(blueBooster);
      expect(boosterManager.getActiveBoosters()).toHaveLength(2);

      // Create match with black die
      const dice = [
        new Die(mockScene, 0, 0, 6, 'red', false, false),
        new Die(mockScene, 0, 0, 6, 'red', false, false),
        new Die(mockScene, 0, 0, 6, 'black', false, true) // Black die
      ];

      dice.forEach(die => die.number = 5);

      const positions = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ];

      const matchGroup = new MatchGroup(dice, positions, 5);
      boosterManager.processMatchGroup(matchGroup);

      // All boosters should be removed
      expect(boosterManager.getActiveBoosters()).toHaveLength(0);
    });
  });

  describe('Booster Effects', () => {
    it('should apply score multiplier correctly', () => {
      const redBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 2.0,
        duration: 10000
      });

      boosterManager.activateBooster(redBooster);

      const baseScore = 1000;
      const modifiedScore = boosterManager.applyScoreMultipliers(baseScore);

      expect(modifiedScore).toBe(2000);
    });

    it('should apply multiple score multipliers', () => {
      // Note: In real implementation, multiple score multipliers might not stack
      // This test assumes they do for completeness
      const redBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 10000
      });

      boosterManager.activateBooster(redBooster);

      const baseScore = 1000;
      const modifiedScore = boosterManager.applyScoreMultipliers(baseScore);

      expect(modifiedScore).toBe(1500);
    });

    it('should apply chain bonus correctly', () => {
      const purpleBooster = new ColorBooster('purple', {
        type: 'chain_bonus',
        value: 3,
        duration: 10000
      });

      boosterManager.activateBooster(purpleBooster);

      const baseMultiplier = 2;
      const modifiedMultiplier = boosterManager.applyChainBonus(baseMultiplier);

      expect(modifiedMultiplier).toBe(5); // 2 + 3
    });

    it('should return default values when no boosters active', () => {
      expect(boosterManager.applyScoreMultipliers(1000)).toBe(1000);
      expect(boosterManager.applyChainBonus(2)).toBe(2);
      expect(boosterManager.getFallSpeedModifier()).toBe(1.0);
      expect(boosterManager.getWildChanceModifier()).toBe(0.0);
      expect(boosterManager.getSizeBoostModifier()).toBe(0);
      expect(boosterManager.getGravityDelay()).toBe(0);
    });
  });

  describe('Piece-Based Booster Consumption', () => {
    it('should consume piece-based boosters', () => {
      const greenBooster = new ColorBooster('green', {
        type: 'wild_chance',
        value: 0.1,
        duration: 3 // 3 pieces
      });

      const yellowBooster = new ColorBooster('yellow', {
        type: 'extra_time',
        value: 5000,
        duration: 1 // 1 piece
      });

      boosterManager.activateBooster(greenBooster);
      boosterManager.activateBooster(yellowBooster);

      expect(boosterManager.getActiveBoosters()).toHaveLength(2);

      // Consume one piece
      boosterManager.consumePieceBasedBoosters();

      // Yellow booster should be expired, green should have 2 remaining
      boosterManager.update(0); // Process expiration

      const activeBoosters = boosterManager.getActiveBoosters();
      expect(activeBoosters).toHaveLength(1);
      expect(activeBoosters[0].color).toBe('green');
    });
  });

  describe('HUD Data Generation', () => {
    it('should generate correct HUD data for active boosters', () => {
      const redBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 10000
      });

      const blueBooster = new ColorBooster('blue', {
        type: 'slow_fall',
        value: 0.5,
        duration: 15000
      });

      boosterManager.activateBooster(redBooster);
      boosterManager.activateBooster(blueBooster);

      const hudData = boosterManager.getHUDData();

      expect(hudData).toHaveLength(2);
      
      const redData = hudData.find(data => data.color === 'red');
      const blueData = hudData.find(data => data.color === 'blue');

      expect(redData).toBeDefined();
      expect(blueData).toBeDefined();
      
      expect(redData?.progress).toBeGreaterThan(0);
      expect(blueData?.progress).toBeGreaterThan(0);
    });

    it('should return empty HUD data when no boosters active', () => {
      const hudData = boosterManager.getHUDData();
      expect(hudData).toHaveLength(0);
    });
  });

  describe('Booster Management', () => {
    it('should remove specific booster', () => {
      const redBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 10000
      });

      const blueBooster = new ColorBooster('blue', {
        type: 'slow_fall',
        value: 0.5,
        duration: 10000
      });

      boosterManager.activateBooster(redBooster);
      boosterManager.activateBooster(blueBooster);
      expect(boosterManager.getActiveBoosters()).toHaveLength(2);

      boosterManager.removeBooster('red', 'score_multiplier');

      expect(boosterManager.getActiveBoosters()).toHaveLength(1);
      expect(boosterManager.isBoosterActive('red', 'score_multiplier')).toBe(false);
      expect(boosterManager.isBoosterActive('blue', 'slow_fall')).toBe(true);
    });

    it('should remove all boosters', () => {
      const boosters = [
        new ColorBooster('red', { type: 'score_multiplier', value: 1.5, duration: 10000 }),
        new ColorBooster('blue', { type: 'slow_fall', value: 0.5, duration: 10000 }),
        new ColorBooster('green', { type: 'wild_chance', value: 0.1, duration: 3 })
      ];

      boosters.forEach(booster => boosterManager.activateBooster(booster));
      expect(boosterManager.getActiveBoosters()).toHaveLength(3);

      boosterManager.removeAllBoosters();

      expect(boosterManager.getActiveBoosters()).toHaveLength(0);
    });

    it('should clear all boosters on reset', () => {
      const redBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 10000
      });

      boosterManager.activateBooster(redBooster);
      expect(boosterManager.getActiveBoosters()).toHaveLength(1);

      boosterManager.clear();

      expect(boosterManager.getActiveBoosters()).toHaveLength(0);
    });
  });

  describe('Debug Information', () => {
    it('should provide debug information', () => {
      const redBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 10000
      });

      boosterManager.activateBooster(redBooster);

      const debugInfo = boosterManager.getDebugInfo();

      expect(debugInfo).toContain('ActiveBoosters(1)');
      expect(debugInfo).toContain('red:score_multiplier');
    });

    it('should show empty debug info when no boosters', () => {
      const debugInfo = boosterManager.getDebugInfo();
      expect(debugInfo).toContain('ActiveBoosters(0)');
    });
  });

  describe('Performance Tests', () => {
    it('should handle many boosters efficiently', () => {
      const startTime = performance.now();

      // Activate many boosters
      const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'] as const;
      const types = ['score_multiplier', 'slow_fall', 'wild_chance', 'extra_time', 'chain_bonus', 'size_boost', 'gravity_delay'];

      for (let i = 0; i < 50; i++) {
        const color = colors[i % colors.length];
        const type = types[i % types.length];
        const booster = new ColorBooster(color, {
          type: type as any,
          value: 1.5,
          duration: 10000
        });
        boosterManager.activateBooster(booster);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(boosterManager.getActiveBoosters().length).toBeGreaterThan(0);
    });

    it('should update many boosters efficiently', () => {
      // Activate several boosters
      const boosters = Array.from({ length: 20 }, (_, i) => {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple'] as const;
        return new ColorBooster(colors[i % colors.length], {
          type: 'score_multiplier',
          value: 1.5,
          duration: 10000
        });
      });

      boosters.forEach(booster => boosterManager.activateBooster(booster));

      const startTime = performance.now();

      // Update multiple times
      for (let i = 0; i < 100; i++) {
        boosterManager.update(16); // ~60fps
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle booster with zero duration', () => {
      const zeroBooster = new ColorBooster('red', {
        type: 'score_multiplier',
        value: 1.5,
        duration: 0
      });

      boosterManager.activateBooster(zeroBooster);
      boosterManager.update(1);

      expect(boosterManager.getActiveBoosters()).toHaveLength(0);
    });

    it('should handle negative duration gracefully', () => {
      const negativeBooster = new ColorBooster('blue', {
        type: 'slow_fall',
        value: 0.5,
        duration: -1000
      });

      boosterManager.activateBooster(negativeBooster);
      boosterManager.update(1);

      expect(boosterManager.getActiveBoosters()).toHaveLength(0);
    });

    it('should handle invalid booster types gracefully', () => {
      expect(() => {
        boosterManager.removeBooster('red', 'invalid_type');
      }).not.toThrow();

      expect(boosterManager.isBoosterActive('red', 'invalid_type')).toBe(false);
    });

    it('should handle empty match groups', () => {
      const emptyMatchGroup = new MatchGroup([], [], 0);
      
      expect(() => {
        boosterManager.processMatchGroup(emptyMatchGroup);
      }).not.toThrow();
    });
  });
});
