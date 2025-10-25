import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreMultiplierManager } from '../utils/ScoreMultiplierManager';
import { DifficultyModeConfig } from '../types/difficulty';
import { GameMode } from '../../client/game/config/GameMode';

describe('ScoreMultiplierManager', () => {
  let scoreMultiplierManager: ScoreMultiplierManager;

  const easyConfig: DifficultyModeConfig = {
    id: 'easy' as GameMode,
    fallSpeed: 1000,
    scoreMultiplier: 1.0,
    allowGravity: true,
    maxPieceWidth: 3,
    maxPieceHeight: 3,
    maxDicePerPiece: 5,
    diceTypes: [4, 6, 8],
    allowBlackDice: false,
    uniformDiceRule: false,
    boosterChance: 0.5
  };

  const hardConfig: DifficultyModeConfig = {
    id: 'hard' as GameMode,
    fallSpeed: 600,
    scoreMultiplier: 1.25,
    allowGravity: true,
    maxPieceWidth: 5,
    maxPieceHeight: 5,
    maxDicePerPiece: 10,
    diceTypes: [8, 10, 12, 20],
    allowBlackDice: true,
    uniformDiceRule: false,
    boosterChance: 0.25
  };

  const zenConfig: DifficultyModeConfig = {
    id: 'zen' as GameMode,
    fallSpeed: 1200,
    scoreMultiplier: 0.9,
    allowGravity: true,
    maxPieceWidth: 3,
    maxPieceHeight: 3,
    maxDicePerPiece: 5,
    diceTypes: [4, 6, 8],
    allowBlackDice: false,
    uniformDiceRule: true,
    boosterChance: 0.5
  };

  beforeEach(() => {
    scoreMultiplierManager = new ScoreMultiplierManager();
  });

  describe('initialization', () => {
    it('should start with default 1.0x multiplier', () => {
      expect(scoreMultiplierManager.getMultiplier()).toBe(1.0);
      expect(scoreMultiplierManager.getCurrentDifficultyId()).toBeNull();
      expect(scoreMultiplierManager.hasActiveMultiplier()).toBe(false);
    });
  });

  describe('setDifficultyConfig', () => {
    it('should set multiplier from easy config', () => {
      scoreMultiplierManager.setDifficultyConfig(easyConfig);
      
      expect(scoreMultiplierManager.getMultiplier()).toBe(1.0);
      expect(scoreMultiplierManager.getCurrentDifficultyId()).toBe('easy');
      expect(scoreMultiplierManager.hasActiveMultiplier()).toBe(false);
    });

    it('should set multiplier from hard config', () => {
      scoreMultiplierManager.setDifficultyConfig(hardConfig);
      
      expect(scoreMultiplierManager.getMultiplier()).toBe(1.25);
      expect(scoreMultiplierManager.getCurrentDifficultyId()).toBe('hard');
      expect(scoreMultiplierManager.hasActiveMultiplier()).toBe(true);
    });

    it('should set multiplier from zen config', () => {
      scoreMultiplierManager.setDifficultyConfig(zenConfig);
      
      expect(scoreMultiplierManager.getMultiplier()).toBe(0.9);
      expect(scoreMultiplierManager.getCurrentDifficultyId()).toBe('zen');
      expect(scoreMultiplierManager.hasActiveMultiplier()).toBe(true);
    });
  });

  describe('applyMultiplier', () => {
    it('should apply 1.0x multiplier correctly', () => {
      scoreMultiplierManager.setDifficultyConfig(easyConfig);
      
      expect(scoreMultiplierManager.applyMultiplier(100)).toBe(100);
      expect(scoreMultiplierManager.applyMultiplier(250)).toBe(250);
      expect(scoreMultiplierManager.applyMultiplier(1000)).toBe(1000);
    });

    it('should apply 1.25x multiplier correctly', () => {
      scoreMultiplierManager.setDifficultyConfig(hardConfig);
      
      expect(scoreMultiplierManager.applyMultiplier(100)).toBe(125);
      expect(scoreMultiplierManager.applyMultiplier(200)).toBe(250);
      expect(scoreMultiplierManager.applyMultiplier(1000)).toBe(1250);
    });

    it('should apply 0.9x multiplier correctly', () => {
      scoreMultiplierManager.setDifficultyConfig(zenConfig);
      
      expect(scoreMultiplierManager.applyMultiplier(100)).toBe(90);
      expect(scoreMultiplierManager.applyMultiplier(200)).toBe(180);
      expect(scoreMultiplierManager.applyMultiplier(1000)).toBe(900);
    });

    it('should handle zero and negative scores', () => {
      scoreMultiplierManager.setDifficultyConfig(hardConfig);
      
      expect(scoreMultiplierManager.applyMultiplier(0)).toBe(0);
      expect(scoreMultiplierManager.applyMultiplier(-100)).toBe(-100);
    });

    it('should floor fractional results', () => {
      scoreMultiplierManager.setDifficultyConfig(hardConfig);
      
      // 33 * 1.25 = 41.25, should floor to 41
      expect(scoreMultiplierManager.applyMultiplier(33)).toBe(41);
      
      scoreMultiplierManager.setDifficultyConfig(zenConfig);
      
      // 33 * 0.9 = 29.7, should floor to 29
      expect(scoreMultiplierManager.applyMultiplier(33)).toBe(29);
    });
  });

  describe('getFormattedMultiplier', () => {
    it('should format multipliers correctly', () => {
      scoreMultiplierManager.setDifficultyConfig(easyConfig);
      expect(scoreMultiplierManager.getFormattedMultiplier()).toBe('1x');

      scoreMultiplierManager.setDifficultyConfig(hardConfig);
      expect(scoreMultiplierManager.getFormattedMultiplier()).toBe('1.25x');

      scoreMultiplierManager.setDifficultyConfig(zenConfig);
      expect(scoreMultiplierManager.getFormattedMultiplier()).toBe('0.9x');
    });
  });

  describe('hasActiveMultiplier', () => {
    it('should return false for 1.0x multiplier', () => {
      scoreMultiplierManager.setDifficultyConfig(easyConfig);
      expect(scoreMultiplierManager.hasActiveMultiplier()).toBe(false);
    });

    it('should return true for non-1.0x multipliers', () => {
      scoreMultiplierManager.setDifficultyConfig(hardConfig);
      expect(scoreMultiplierManager.hasActiveMultiplier()).toBe(true);

      scoreMultiplierManager.setDifficultyConfig(zenConfig);
      expect(scoreMultiplierManager.hasActiveMultiplier()).toBe(true);
    });
  });
});
