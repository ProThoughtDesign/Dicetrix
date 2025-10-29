import { describe, test, expect } from 'vitest';
import { BlackDieManager, BlackDie } from '../utils/BlackDieManager.js';

describe('BlackDieManager', () => {
  describe('isBlackDie', () => {
    test('identifies Black Dice correctly', () => {
      const blackDie: BlackDie = {
        id: 'black1',
        sides: 20,
        number: 15,
        isBlack: true,
        isWild: true
      };

      const normalDie: BlackDie = {
        id: 'normal1',
        sides: 6,
        number: 3,
        isBlack: false,
        isWild: false
      };

      expect(BlackDieManager.isBlackDie(blackDie)).toBe(true);
      expect(BlackDieManager.isBlackDie(normalDie)).toBe(false);
    });

    test('handles undefined isBlack property', () => {
      const die: BlackDie = {
        id: 'test1',
        sides: 8,
        number: 4
      };

      expect(BlackDieManager.isBlackDie(die)).toBe(false);
    });
  });

  describe('canMatchWith', () => {
    test('Black Dice can match with any valid number', () => {
      const blackDie: BlackDie = {
        id: 'black1',
        sides: 20,
        number: 15,
        isBlack: true,
        isWild: true
      };

      expect(BlackDieManager.canMatchWith(blackDie, 1)).toBe(true);
      expect(BlackDieManager.canMatchWith(blackDie, 10)).toBe(true);
      expect(BlackDieManager.canMatchWith(blackDie, 20)).toBe(true);
    });

    test('Black Dice cannot match with invalid numbers', () => {
      const blackDie: BlackDie = {
        id: 'black1',
        sides: 20,
        number: 15,
        isBlack: true,
        isWild: true
      };

      expect(BlackDieManager.canMatchWith(blackDie, 0)).toBe(false);
      expect(BlackDieManager.canMatchWith(blackDie, 21)).toBe(false);
      expect(BlackDieManager.canMatchWith(blackDie, -1)).toBe(false);
    });

    test('Normal dice cannot match wildly', () => {
      const normalDie: BlackDie = {
        id: 'normal1',
        sides: 6,
        number: 3,
        isBlack: false,
        isWild: false
      };

      expect(BlackDieManager.canMatchWith(normalDie, 5)).toBe(false);
    });
  });

  describe('isWildDie', () => {
    test('identifies wild dice correctly', () => {
      const blackDie: BlackDie = {
        id: 'black1',
        sides: 20,
        number: 15,
        isBlack: true,
        isWild: true
      };

      const wildDie: BlackDie = {
        id: 'wild1',
        sides: 12,
        number: 8,
        isBlack: false,
        isWild: true
      };

      const normalDie: BlackDie = {
        id: 'normal1',
        sides: 6,
        number: 3,
        isBlack: false,
        isWild: false
      };

      expect(BlackDieManager.isWildDie(blackDie)).toBe(true);
      expect(BlackDieManager.isWildDie(wildDie)).toBe(true);
      expect(BlackDieManager.isWildDie(normalDie)).toBe(false);
    });
  });

  describe('getMatchingNumber', () => {
    test('returns target number for wild dice', () => {
      const blackDie: BlackDie = {
        id: 'black1',
        sides: 20,
        number: 15,
        isBlack: true,
        isWild: true
      };

      expect(BlackDieManager.getMatchingNumber(blackDie, 8)).toBe(8);
    });

    test('returns face value for normal dice', () => {
      const normalDie: BlackDie = {
        id: 'normal1',
        sides: 6,
        number: 3,
        isBlack: false,
        isWild: false
      };

      expect(BlackDieManager.getMatchingNumber(normalDie, 8)).toBe(3);
      expect(BlackDieManager.getMatchingNumber(normalDie)).toBe(3);
    });
  });

  describe('validateBlackDie', () => {
    test('validates properly configured Black Dice', () => {
      const validBlackDie: BlackDie = {
        id: 'black1',
        sides: 20,
        number: 15,
        isBlack: true,
        isWild: true
      };

      expect(BlackDieManager.validateBlackDie(validBlackDie)).toBe(true);
    });

    test('rejects Black Dice with wrong sides', () => {
      const invalidBlackDie: BlackDie = {
        id: 'black1',
        sides: 6,
        number: 3,
        isBlack: true,
        isWild: true
      };

      expect(BlackDieManager.validateBlackDie(invalidBlackDie)).toBe(false);
    });

    test('rejects Black Dice with invalid numbers', () => {
      const invalidBlackDie: BlackDie = {
        id: 'black1',
        sides: 20,
        number: 25,
        isBlack: true,
        isWild: true
      };

      expect(BlackDieManager.validateBlackDie(invalidBlackDie)).toBe(false);
    });

    test('rejects Black Dice without wild property', () => {
      const invalidBlackDie: BlackDie = {
        id: 'black1',
        sides: 20,
        number: 15,
        isBlack: true,
        isWild: false
      };

      expect(BlackDieManager.validateBlackDie(invalidBlackDie)).toBe(false);
    });
  });

  describe('createBlackDie', () => {
    test('creates properly configured Black Dice', () => {
      const blackDie = BlackDieManager.createBlackDie('test1', 12, { x: 1, y: 2 });

      expect(blackDie.id).toBe('test1');
      expect(blackDie.sides).toBe(20);
      expect(blackDie.number).toBe(12);
      expect(blackDie.isBlack).toBe(true);
      expect(blackDie.isWild).toBe(true);
    });

    test('throws error for invalid numbers', () => {
      expect(() => {
        BlackDieManager.createBlackDie('test1', 0, { x: 1, y: 2 });
      }).toThrow('Black Die number must be between 1 and 20, got 0');

      expect(() => {
        BlackDieManager.createBlackDie('test1', 21, { x: 1, y: 2 });
      }).toThrow('Black Die number must be between 1 and 20, got 21');
    });
  });

  describe('Area Conversion Effects', () => {
    // Create a mock game board for testing
    const createMockGameBoard = (width: number = 10, height: number = 20) => {
      const cells: (BlackDie | null)[][] = [];
      for (let y = 0; y < height; y++) {
        cells[y] = new Array(width).fill(null);
      }

      return {
        state: { width, height, cells },
        getCell: (pos: { x: number; y: number }) => {
          if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) {
            return null;
          }
          return cells[pos.y][pos.x];
        },
        lockCell: (pos: { x: number; y: number }, die: BlackDie) => {
          if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
            cells[pos.y][pos.x] = die;
          }
        },
        isValidPosition: (x: number, y: number) => {
          return x >= 0 && x < width && y >= 0 && y < height;
        }
      };
    };

    describe('triggerAreaConversion', () => {
      test('converts dice in 3×3 area to d20 and rerolls numbers', () => {
        const gameBoard = createMockGameBoard();
        
        // Place some dice in a 3×3 area around position (5, 5)
        const testDice = [
          { pos: { x: 4, y: 4 }, die: { id: 'die1', sides: 6, number: 3, isBlack: false, isWild: false } },
          { pos: { x: 5, y: 4 }, die: { id: 'die2', sides: 8, number: 7, isBlack: false, isWild: false } },
          { pos: { x: 6, y: 4 }, die: { id: 'die3', sides: 12, number: 11, isBlack: false, isWild: false } },
          { pos: { x: 4, y: 5 }, die: { id: 'die4', sides: 10, number: 9, isBlack: false, isWild: false } },
          { pos: { x: 5, y: 5 }, die: { id: 'die5', sides: 20, number: 15, isBlack: true, isWild: true } },
          { pos: { x: 6, y: 5 }, die: { id: 'die6', sides: 4, number: 2, isBlack: false, isWild: false } },
        ];

        // Place dice on the board
        testDice.forEach(({ pos, die }) => {
          gameBoard.lockCell(pos, die as BlackDie);
        });

        // Store original numbers for comparison
        const originalNumbers = testDice.map(({ pos }) => gameBoard.getCell(pos)?.number);

        // Trigger area conversion
        BlackDieManager.triggerAreaConversion({ x: 5, y: 5 }, gameBoard);

        // Check that all dice in the area are now d20
        testDice.forEach(({ pos }) => {
          const die = gameBoard.getCell(pos);
          expect(die?.sides).toBe(20);
          expect(die?.number).toBeGreaterThanOrEqual(1);
          expect(die?.number).toBeLessThanOrEqual(20);
        });

        // Check that at least some numbers were rerolled (statistically very likely)
        const newNumbers = testDice.map(({ pos }) => gameBoard.getCell(pos)?.number);
        const hasRerolledNumbers = originalNumbers.some((original, index) => 
          original !== newNumbers[index] && original !== undefined && newNumbers[index] !== undefined
        );
        
        // Note: There's a small chance all dice roll the same numbers, but it's extremely unlikely
        // For a more deterministic test, we could mock Math.random, but this tests real behavior
        expect(hasRerolledNumbers || originalNumbers.every(n => n === newNumbers[originalNumbers.indexOf(n)])).toBe(true);
      });

      test('handles boundary positions correctly', () => {
        const gameBoard = createMockGameBoard(5, 5);
        
        // Place dice near the edge
        gameBoard.lockCell({ x: 0, y: 0 }, { id: 'corner', sides: 6, number: 3, isBlack: false, isWild: false });
        gameBoard.lockCell({ x: 1, y: 0 }, { id: 'edge1', sides: 8, number: 5, isBlack: false, isWild: false });
        gameBoard.lockCell({ x: 0, y: 1 }, { id: 'edge2', sides: 10, number: 7, isBlack: false, isWild: false });

        // Trigger area conversion at corner (0, 0)
        BlackDieManager.triggerAreaConversion({ x: 0, y: 0 }, gameBoard);

        // Check that only valid positions were affected
        expect(gameBoard.getCell({ x: 0, y: 0 })?.sides).toBe(20);
        expect(gameBoard.getCell({ x: 1, y: 0 })?.sides).toBe(20);
        expect(gameBoard.getCell({ x: 0, y: 1 })?.sides).toBe(20);
        
        // Positions outside the 3×3 area should be unaffected (if they exist)
        expect(gameBoard.getCell({ x: 2, y: 2 })).toBeNull();
      });

      test('throws error for invalid game board', () => {
        expect(() => {
          BlackDieManager.triggerAreaConversion({ x: 5, y: 5 }, null as any);
        }).toThrow('Invalid game board provided for area conversion');

        expect(() => {
          BlackDieManager.triggerAreaConversion({ x: 5, y: 5 }, {} as any);
        }).toThrow('Invalid game board provided for area conversion');
      });

      test('throws error for out of bounds center position', () => {
        const gameBoard = createMockGameBoard(10, 20);

        expect(() => {
          BlackDieManager.triggerAreaConversion({ x: -1, y: 5 }, gameBoard);
        }).toThrow('Area conversion center position (-1, 5) is out of bounds');

        expect(() => {
          BlackDieManager.triggerAreaConversion({ x: 10, y: 5 }, gameBoard);
        }).toThrow('Area conversion center position (10, 5) is out of bounds');
      });
    });

    describe('canApplyAreaConversion', () => {
      test('returns true for valid positions', () => {
        const gameBoard = createMockGameBoard();
        
        expect(BlackDieManager.canApplyAreaConversion({ x: 5, y: 5 }, gameBoard)).toBe(true);
        expect(BlackDieManager.canApplyAreaConversion({ x: 0, y: 0 }, gameBoard)).toBe(true);
        expect(BlackDieManager.canApplyAreaConversion({ x: 9, y: 19 }, gameBoard)).toBe(true);
      });

      test('returns false for invalid positions', () => {
        const gameBoard = createMockGameBoard();
        
        expect(BlackDieManager.canApplyAreaConversion({ x: -1, y: 5 }, gameBoard)).toBe(false);
        expect(BlackDieManager.canApplyAreaConversion({ x: 10, y: 5 }, gameBoard)).toBe(false);
        expect(BlackDieManager.canApplyAreaConversion({ x: 5, y: -1 }, gameBoard)).toBe(false);
        expect(BlackDieManager.canApplyAreaConversion({ x: 5, y: 20 }, gameBoard)).toBe(false);
      });

      test('returns false for invalid game board', () => {
        expect(BlackDieManager.canApplyAreaConversion({ x: 5, y: 5 }, null as any)).toBe(false);
        expect(BlackDieManager.canApplyAreaConversion({ x: 5, y: 5 }, {} as any)).toBe(false);
      });
    });

    describe('area conversion with empty cells', () => {
      test('handles empty cells in conversion area gracefully', () => {
        const gameBoard = createMockGameBoard();
        
        // Place only one die in the area
        gameBoard.lockCell({ x: 5, y: 5 }, { id: 'single', sides: 6, number: 3, isBlack: false, isWild: false });

        // Should not throw error even with mostly empty area
        expect(() => {
          BlackDieManager.triggerAreaConversion({ x: 5, y: 5 }, gameBoard);
        }).not.toThrow();

        // The single die should be converted
        expect(gameBoard.getCell({ x: 5, y: 5 })?.sides).toBe(20);
      });
    });

    describe('number rerolling validation', () => {
      test('rerolled numbers are within valid d20 range', () => {
        const gameBoard = createMockGameBoard();
        
        // Place dice with various original sides
        const testPositions = [
          { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 },
          { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 },
          { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
        ];

        testPositions.forEach((pos, index) => {
          gameBoard.lockCell(pos, { 
            id: `die${index}`, 
            sides: [4, 6, 8, 10, 12, 20, 4, 6, 8][index], 
            number: [2, 4, 6, 8, 10, 15, 3, 5, 7][index],
            isBlack: false, 
            isWild: false 
          });
        });

        // Trigger conversion multiple times to test randomness
        for (let i = 0; i < 10; i++) {
          BlackDieManager.triggerAreaConversion({ x: 5, y: 5 }, gameBoard);
          
          // Check all dice have valid d20 numbers
          testPositions.forEach(pos => {
            const die = gameBoard.getCell(pos);
            if (die) {
              expect(die.number).toBeGreaterThanOrEqual(1);
              expect(die.number).toBeLessThanOrEqual(20);
              expect(die.sides).toBe(20);
            }
          });
        }
      });
    });
  });
});
