import { describe, it, expect, beforeEach } from 'vitest';
import { BoosterEffectSystem } from '../utils/BoosterEffectSystem.js';
import { BoosterType, EnhancedDie } from '../types/difficulty.js';

describe('BoosterEffectSystem', () => {
  let boosterSystem: BoosterEffectSystem;
  let mockDie: EnhancedDie;

  beforeEach(() => {
    boosterSystem = new BoosterEffectSystem();
    mockDie = {
      id: 'test-die-1',
      sides: 6,
      number: 3,
      color: 'red',
      relativePos: { x: 0, y: 0 }
    };
  });

  describe('applyBoosterEffect', () => {
    it('should not apply booster effect when chance is 0', () => {
      boosterSystem.applyBoosterEffect(mockDie, 0);
      
      expect(mockDie.boosterType).toBe(BoosterType.NONE);
      expect(mockDie.glowColor).toBeUndefined();
    });

    it('should always apply booster effect when chance is 1', () => {
      boosterSystem.applyBoosterEffect(mockDie, 1);
      
      expect(mockDie.boosterType).not.toBe(BoosterType.NONE);
      expect(mockDie.glowColor).toBeDefined();
      expect(mockDie.glowColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should throw error for invalid booster chance', () => {
      expect(() => boosterSystem.applyBoosterEffect(mockDie, -0.1)).toThrow();
      expect(() => boosterSystem.applyBoosterEffect(mockDie, 1.1)).toThrow();
    });
  });

  describe('calculateBoosterChance', () => {
    it('should return the same value for valid input', () => {
      expect(boosterSystem.calculateBoosterChance(0.5)).toBe(0.5);
      expect(boosterSystem.calculateBoosterChance(0.0)).toBe(0.0);
      expect(boosterSystem.calculateBoosterChance(1.0)).toBe(1.0);
    });

    it('should throw error for invalid booster chance', () => {
      expect(() => boosterSystem.calculateBoosterChance(-0.1)).toThrow();
      expect(() => boosterSystem.calculateBoosterChance(1.1)).toThrow();
    });
  });

  describe('getGlowColor', () => {
    it('should return correct colors for booster types', () => {
      expect(boosterSystem.getGlowColor(BoosterType.RED_GLOW)).toBe('#ff4444');
      expect(boosterSystem.getGlowColor(BoosterType.BLUE_GLOW)).toBe('#4444ff');
      expect(boosterSystem.getGlowColor(BoosterType.NONE)).toBe('');
    });
  });

  describe('hasBoosterEffect', () => {
    it('should return false for dice without booster effects', () => {
      mockDie.boosterType = BoosterType.NONE;
      expect(boosterSystem.hasBoosterEffect(mockDie)).toBe(false);

      delete mockDie.boosterType;
      expect(boosterSystem.hasBoosterEffect(mockDie)).toBe(false);
    });

    it('should return true for dice with booster effects', () => {
      mockDie.boosterType = BoosterType.RED_GLOW;
      expect(boosterSystem.hasBoosterEffect(mockDie)).toBe(true);
    });
  });
});
