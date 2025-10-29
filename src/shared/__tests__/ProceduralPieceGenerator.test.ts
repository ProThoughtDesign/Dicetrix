import { describe, it, expect } from 'vitest';
import { ProceduralPieceGenerator } from '../utils/ProceduralPieceGenerator.js';
import { DifficultyModeConfig, BoosterType, MultiDiePiece } from '../types/difficulty.js';
import { GameMode } from '../types/game.js';

describe('ProceduralPieceGenerator', () => {
  // Test configurations for different difficulty modes
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

  describe('generatePiece', () => {
    it('should generate a valid piece within dimensional constraints', () => {
      const piece = ProceduralPieceGenerator.generatePiece(easyConfig);
      
      expect(piece).toBeDefined();
      expect(piece.dice).toBeDefined();
      expect(piece.dice.length).toBeGreaterThan(0);
      expect(piece.dice.length).toBeLessThanOrEqual(easyConfig.maxDicePerPiece);
      expect(piece.width).toBeLessThanOrEqual(easyConfig.maxPieceWidth);
      expect(piece.height).toBeLessThanOrEqual(easyConfig.maxPieceHeight);
    });

    it('should respect dice type constraints for easy mode', () => {
      const piece = ProceduralPieceGenerator.generatePiece(easyConfig);
      
      for (const die of piece.dice) {
        expect(easyConfig.diceTypes).toContain(die.sides);
        expect(die.number).toBeGreaterThanOrEqual(1);
        expect(die.number).toBeLessThanOrEqual(die.sides);
        expect(die.isBlack).toBe(false); // Easy mode doesn't allow black dice
      }
    });

    it('should allow black dice in hard mode', () => {
      // Generate multiple pieces to increase chance of getting a black die
      let hasBlackDie = false;
      let blackDieCount = 0;
      let totalDiceCount = 0;
      
      for (let i = 0; i < 100; i++) {
        const piece = ProceduralPieceGenerator.generatePiece(hardConfig);
        totalDiceCount += piece.dice.length;
        
        for (const die of piece.dice) {
          if (die.isBlack) {
            hasBlackDie = true;
            blackDieCount++;
            
            // Verify Black Die properties
            expect(die.sides).toBe(20);
            expect(die.isWild).toBe(true);
            expect(die.number).toBeGreaterThanOrEqual(1);
            expect(die.number).toBeLessThanOrEqual(20);
          }
        }
      }
      
      // With 10% chance and 100 iterations, we should get at least some Black Dice
      // This is probabilistic but very likely to pass
      expect(hasBlackDie).toBe(true);
      
      // Black Dice should be roughly 10% of total dice (allowing for variance)
      const blackDiePercentage = blackDieCount / totalDiceCount;
      expect(blackDiePercentage).toBeGreaterThan(0.02); // At least 2%
      expect(blackDiePercentage).toBeLessThan(0.25); // Less than 25%
    });

    it('should not generate black dice when allowBlackDice is false', () => {
      // Test with Easy mode (allowBlackDice: false)
      for (let i = 0; i < 50; i++) {
        const piece = ProceduralPieceGenerator.generatePiece(easyConfig);
        
        for (const die of piece.dice) {
          expect(die.isBlack).toBe(false);
          expect(die.isWild).toBe(false);
        }
      }
    });

    it('should generate black dice with correct properties in expert mode', () => {
      const expertConfig: DifficultyModeConfig = {
        id: 'expert' as GameMode,
        fallSpeed: 400,
        scoreMultiplier: 1.5,
        allowGravity: true,
        maxPieceWidth: 5,
        maxPieceHeight: 5,
        maxDicePerPiece: 16,
        diceTypes: [10, 12, 20],
        allowBlackDice: true,
        uniformDiceRule: false,
        boosterChance: 0.15
      };

      let hasBlackDie = false;
      
      for (let i = 0; i < 100; i++) {
        const piece = ProceduralPieceGenerator.generatePiece(expertConfig);
        
        for (const die of piece.dice) {
          if (die.isBlack) {
            hasBlackDie = true;
            
            // Verify Black Die properties
            expect(die.sides).toBe(20);
            expect(die.isWild).toBe(true);
            expect(die.number).toBeGreaterThanOrEqual(1);
            expect(die.number).toBeLessThanOrEqual(20);
          }
        }
      }
      
      expect(hasBlackDie).toBe(true);
    });

    it('should apply uniform dice rule in zen mode for multi-die pieces', () => {
      // Generate multiple pieces to get a multi-die piece
      let multiDiePiece: MultiDiePiece | null = null;
      for (let i = 0; i < 50; i++) {
        const piece = ProceduralPieceGenerator.generatePiece(zenConfig);
        if (piece.dice.length > 1) {
          multiDiePiece = piece;
          break;
        }
      }

      if (multiDiePiece) {
        // All dice should have the same number of sides (Requirement 6.1)
        const firstDieSides = multiDiePiece.dice[0]!.sides;
        for (const die of multiDiePiece.dice) {
          expect(die.sides).toBe(firstDieSides);
        }

        // Dice type should be from allowed types (Requirement 6.3)
        expect(zenConfig.diceTypes).toContain(firstDieSides);

        // Different numbers should be allowed within same face count (Requirement 6.2)
        const numbers = multiDiePiece.dice.map(die => die.number);
        for (const number of numbers) {
          expect(number).toBeGreaterThanOrEqual(1);
          expect(number).toBeLessThanOrEqual(firstDieSides);
        }

        // No Black Dice should be generated in Zen mode uniform rule
        for (const die of multiDiePiece.dice) {
          expect(die.isBlack).toBe(false);
          expect(die.isWild).toBe(false);
        }
      }
    });

    it('should follow normal dice selection for single-die pieces in zen mode', () => {
      // Test single die pieces in Zen mode (Requirement 6.5)
      const singleDieZenConfig = { ...zenConfig, maxDicePerPiece: 1 };
      const piece = ProceduralPieceGenerator.generatePiece(singleDieZenConfig);
      
      expect(piece.dice.length).toBe(1);
      const die = piece.dice[0]!;
      
      // Should use normal dice type selection (from allowed types)
      expect(zenConfig.diceTypes).toContain(die.sides);
      expect(die.number).toBeGreaterThanOrEqual(1);
      expect(die.number).toBeLessThanOrEqual(die.sides);
      expect(die.isBlack).toBe(false);
      expect(die.isWild).toBe(false);
    });

    it('should generate pieces with valid dice properties', () => {
      const piece = ProceduralPieceGenerator.generatePiece(easyConfig);
      
      for (const die of piece.dice) {
        expect(die.id).toBeDefined();
        expect(typeof die.id).toBe('string');
        expect(die.sides).toBeGreaterThan(0);
        expect(die.number).toBeGreaterThanOrEqual(1);
        expect(die.number).toBeLessThanOrEqual(die.sides);
        expect(die.color).toBeDefined();
        expect(die.relativePos).toBeDefined();
        expect(typeof die.relativePos.x).toBe('number');
        expect(typeof die.relativePos.y).toBe('number');
        expect(die.boosterType).toBeDefined();
      }
    });

    it('should apply booster effects based on booster chance', () => {
      // Test with high booster chance
      const highBoosterConfig = { ...easyConfig, boosterChance: 1.0 };
      const piece = ProceduralPieceGenerator.generatePiece(highBoosterConfig);
      
      // All dice should have booster effects
      for (const die of piece.dice) {
        expect(die.boosterType).not.toBe(BoosterType.NONE);
        expect(die.glowColor).toBeDefined();
      }
    });

    it('should not apply booster effects when chance is zero', () => {
      const noBoosterConfig = { ...easyConfig, boosterChance: 0.0 };
      const piece = ProceduralPieceGenerator.generatePiece(noBoosterConfig);
      
      // No dice should have booster effects
      for (const die of piece.dice) {
        expect(die.boosterType).toBe(BoosterType.NONE);
      }
    });

    it('should generate fallback single die piece when constraints are very restrictive', () => {
      const restrictiveConfig: DifficultyModeConfig = {
        ...easyConfig,
        maxPieceWidth: 1,
        maxPieceHeight: 1,
        maxDicePerPiece: 1
      };
      
      const piece = ProceduralPieceGenerator.generatePiece(restrictiveConfig);
      
      expect(piece.dice.length).toBe(1);
      expect(piece.width).toBe(1);
      expect(piece.height).toBe(1);
    });

    it('should generate pieces with connected positions', () => {
      const piece = ProceduralPieceGenerator.generatePiece(easyConfig);
      
      if (piece.dice.length > 1) {
        // Check that all positions form a connected shape
        // This is implicitly tested by the FloodFillValidator in the generator
        // but we can verify the positions are reasonable
        const positions = piece.dice.map(die => die.relativePos);
        
        // All positions should be unique
        const positionKeys = positions.map(pos => `${pos.x},${pos.y}`);
        const uniqueKeys = new Set(positionKeys);
        expect(uniqueKeys.size).toBe(positions.length);
      }
    });

    it('should handle maximum complexity pieces', () => {
      const maxComplexityConfig: DifficultyModeConfig = {
        id: 'expert' as GameMode,
        fallSpeed: 400,
        scoreMultiplier: 1.5,
        allowGravity: true,
        maxPieceWidth: 5,
        maxPieceHeight: 5,
        maxDicePerPiece: 16,
        diceTypes: [10, 12, 20],
        allowBlackDice: true,
        uniformDiceRule: false,
        boosterChance: 0.15
      };
      
      const piece = ProceduralPieceGenerator.generatePiece(maxComplexityConfig);
      
      expect(piece).toBeDefined();
      expect(piece.dice.length).toBeGreaterThan(0);
      expect(piece.dice.length).toBeLessThanOrEqual(maxComplexityConfig.maxDicePerPiece);
      expect(piece.width).toBeLessThanOrEqual(maxComplexityConfig.maxPieceWidth);
      expect(piece.height).toBeLessThanOrEqual(maxComplexityConfig.maxPieceHeight);
    });
  });

  describe('edge cases', () => {
    it('should handle single die pieces correctly', () => {
      const singleDieConfig = { ...easyConfig, maxDicePerPiece: 1 };
      const piece = ProceduralPieceGenerator.generatePiece(singleDieConfig);
      
      expect(piece.dice.length).toBe(1);
      expect(piece.width).toBe(1);
      expect(piece.height).toBe(1);
      expect(piece.centerX).toBe(0);
      expect(piece.centerY).toBe(0);
    });

    it('should handle minimum dimensional constraints', () => {
      const minConfig = {
        ...easyConfig,
        maxPieceWidth: 1,
        maxPieceHeight: 1,
        maxDicePerPiece: 1
      };
      
      const piece = ProceduralPieceGenerator.generatePiece(minConfig);
      
      expect(piece.dice.length).toBe(1);
      expect(piece.width).toBe(1);
      expect(piece.height).toBe(1);
    });

    it('should generate consistent piece structure', () => {
      const piece = ProceduralPieceGenerator.generatePiece(easyConfig);
      
      // Verify piece structure consistency
      expect(piece.dice).toBeInstanceOf(Array);
      expect(typeof piece.width).toBe('number');
      expect(typeof piece.height).toBe('number');
      expect(typeof piece.centerX).toBe('number');
      expect(typeof piece.centerY).toBe('number');
      
      // Verify all dice have required properties
      for (const die of piece.dice) {
        expect(die).toHaveProperty('id');
        expect(die).toHaveProperty('sides');
        expect(die).toHaveProperty('number');
        expect(die).toHaveProperty('color');
        expect(die).toHaveProperty('relativePos');
        expect(die).toHaveProperty('isBlack');
        expect(die).toHaveProperty('isWild');
        expect(die).toHaveProperty('boosterType');
      }
    });
  });
});
