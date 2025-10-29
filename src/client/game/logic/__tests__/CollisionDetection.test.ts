import { describe, test, expect, beforeEach, vi } from 'vitest';
import GameBoard from '../GameBoard';
import { GAME_CONSTANTS } from '../../../../shared/constants/GameConstants';
import { GridBoundaryValidator } from '../../../../shared/utils/GridBoundaryValidator';
import { Game } from '../../scenes/Game';

/**
 * Unit tests for individual die collision detection logic
 * Tests the core collision detection functionality for multi-piece scenarios
 */
describe('Individual Die Collision Detection', () => {
  let gameBoard: GameBoard;
  let mockGame: any;

  beforeEach(() => {
    gameBoard = new GameBoard(GAME_CONSTANTS.GRID_WIDTH, GAME_CONSTANTS.GRID_HEIGHT);
    
    // Create a minimal mock Game instance for testing collision logic
    mockGame = {
      gameBoard,
      activePiece: null,
      validateActivePieceState: vi.fn(() => true),
      handleActivePieceErrors: vi.fn(() => true),
      safeRemoveDiceByIndices: vi.fn((indices: number[]) => indices.length),
      validateArrayModificationSafety: vi.fn((indices: number[], length: number) => ({
        isSafe: true,
        safeIndices: [...indices].sort((a, b) => b - a),
        warnings: [],
        errors: []
      })),
      finalizePieceLocking: vi.fn(),
      renderGameState: vi.fn(),
      getCollisionScenarioName: vi.fn((lock: number, cont: number) => {
        if (lock === 0 && cont > 0) return `No Collisions (${cont} dice continue)`;
        if (lock > 0 && cont === 0) return `All Collisions (${lock} dice lock)`;
        if (lock > 0 && cont > 0) return `Mixed Collisions (${lock} lock, ${cont} continue)`;
        return `Empty Scenario (0 dice total)`;
      })
    };
  });

  describe('Single Die Collision Detection', () => {
    test('should detect bottom boundary collision correctly', () => {
      const testCases = [
        { currentY: 1, expectedCollision: false, reason: 'Y=1 -> Y=0 (valid)' },
        { currentY: 0, expectedCollision: true, reason: 'Y=0 -> Y=-1 (hits bottom)' },
        { currentY: -1, expectedCollision: true, reason: 'Y=-1 -> Y=-2 (already below)' },
        { currentY: 2, expectedCollision: false, reason: 'Y=2 -> Y=1 (valid)' }
      ];

      testCases.forEach(({ currentY, expectedCollision, reason }) => {
        const attemptedY = currentY + GAME_CONSTANTS.FALL_STEP; // -1
        const hitBottom = attemptedY < GAME_CONSTANTS.GROUND_Y;
        
        expect(hitBottom).toBe(expectedCollision);
      });
    });

    test('should detect side boundary collisions correctly', () => {
      const testCases = [
        { x: -1, expectedCollision: true, reason: 'Left boundary' },
        { x: 0, expectedCollision: false, reason: 'Valid left edge' },
        { x: 3, expectedCollision: false, reason: 'Valid center' },
        { x: 7, expectedCollision: false, reason: 'Valid right edge' },
        { x: 8, expectedCollision: true, reason: 'Right boundary' },
        { x: 15, expectedCollision: true, reason: 'Far right boundary' }
      ];

      testCases.forEach(({ x, expectedCollision, reason }) => {
        const outOfBounds = x < 0 || x >= GAME_CONSTANTS.GRID_WIDTH;
        expect(outOfBounds).toBe(expectedCollision);
      });
    });

    test('should detect piece-to-piece collisions correctly', () => {
      // Place obstacles on the board
      gameBoard.addPieceAt([
        { pos: { x: 5, y: 2 }, die: { id: 'obstacle1', sides: 6, number: 1, color: 'red' } as any },
        { pos: { x: 6, y: 1 }, die: { id: 'obstacle2', sides: 6, number: 2, color: 'blue' } as any },
        { pos: { x: 4, y: 0 }, die: { id: 'obstacle3', sides: 6, number: 3, color: 'green' } as any }
      ]);

      const testCases = [
        { x: 5, y: 2, expectedCollision: true, reason: 'Direct collision with obstacle1' },
        { x: 6, y: 1, expectedCollision: true, reason: 'Direct collision with obstacle2' },
        { x: 4, y: 0, expectedCollision: true, reason: 'Direct collision with obstacle3' },
        { x: 5, y: 1, expectedCollision: false, reason: 'Empty space below obstacle1' },
        { x: 7, y: 1, expectedCollision: false, reason: 'Empty space next to obstacle2' },
        { x: 3, y: 0, expectedCollision: false, reason: 'Empty space next to obstacle3' }
      ];

      testCases.forEach(({ x, y, expectedCollision, reason }) => {
        const hitPiece = y >= GAME_CONSTANTS.GROUND_Y && 
                         y <= GAME_CONSTANTS.MAX_VALID_Y && 
                         !gameBoard.isEmpty(x, y);
        expect(hitPiece).toBe(expectedCollision);
      });
    });
  });

  describe('Multi-Die Piece Collision Analysis', () => {
    test('should analyze L-shaped piece collision scenarios', () => {
      // Create L-shaped piece
      const lPiece = {
        x: 3,
        y: 2,
        dice: [
          { id: 'l1', sides: 6, number: 1, color: 'red', relativePos: { x: 0, y: 0 } },   // Bottom-left
          { id: 'l2', sides: 6, number: 2, color: 'red', relativePos: { x: 0, y: 1 } },   // Top-left  
          { id: 'l3', sides: 6, number: 3, color: 'red', relativePos: { x: 1, y: 0 } }    // Bottom-right
        ]
      };

      // Place obstacle that will block bottom-right die
      gameBoard.addPieceAt([
        { pos: { x: 4, y: 1 }, die: { id: 'obstacle', sides: 6, number: 4, color: 'blue' } as any }
      ]);

      // Analyze collision for each die when piece moves down
      const collisionResults = lPiece.dice.map((die, index) => {
        const currentX = lPiece.x + die.relativePos.x;
        const currentY = lPiece.y + die.relativePos.y;
        const attemptedY = currentY + GAME_CONSTANTS.FALL_STEP;

        const hitBottom = attemptedY < GAME_CONSTANTS.GROUND_Y;
        const outOfBounds = currentX < 0 || currentX >= gameBoard.state.width;
        const hitPiece = attemptedY >= GAME_CONSTANTS.GROUND_Y && 
                         attemptedY <= GAME_CONSTANTS.MAX_VALID_Y && 
                         !gameBoard.isEmpty(currentX, attemptedY);

        return {
          dieIndex: index,
          dieId: die.id,
          currentPos: { x: currentX, y: currentY },
          attemptedPos: { x: currentX, y: attemptedY },
          hasCollision: hitBottom || outOfBounds || hitPiece,
          collisionType: hitBottom ? 'bottom' : outOfBounds ? 'bounds' : hitPiece ? 'piece' : 'none'
        };
      });

      // Verify collision analysis
      expect(collisionResults[0].hasCollision).toBe(false); // Bottom-left: (3,2) -> (3,1) - no collision
      expect(collisionResults[1].hasCollision).toBe(false); // Top-left: (3,3) -> (3,2) - no collision  
      expect(collisionResults[2].hasCollision).toBe(true);  // Bottom-right: (4,2) -> (4,1) - hits obstacle
      expect(collisionResults[2].collisionType).toBe('piece');

      // Verify mixed collision scenario
      const dicesToLock = collisionResults.filter(r => r.hasCollision);
      const diceToContinue = collisionResults.filter(r => !r.hasCollision);
      
      expect(dicesToLock).toHaveLength(1);
      expect(diceToContinue).toHaveLength(2);
      expect(dicesToLock[0].dieId).toBe('l3');
    });

    test('should analyze T-shaped piece collision scenarios', () => {
      // Create T-shaped piece
      const tPiece = {
        x: 4,
        y: 1,
        dice: [
          { id: 't1', sides: 6, number: 1, color: 'blue', relativePos: { x: 1, y: 0 } },   // Bottom center
          { id: 't2', sides: 6, number: 2, color: 'blue', relativePos: { x: 0, y: 1 } },   // Top left
          { id: 't3', sides: 6, number: 3, color: 'blue', relativePos: { x: 1, y: 1 } },   // Top center
          { id: 't4', sides: 6, number: 4, color: 'blue', relativePos: { x: 2, y: 1 } }    // Top right
        ]
      };

      // Place obstacles that will block some dice
      gameBoard.addPieceAt([
        { pos: { x: 5, y: 0 }, die: { id: 'obs1', sides: 6, number: 5, color: 'green' } as any }, // Blocks bottom center
        { pos: { x: 6, y: 1 }, die: { id: 'obs2', sides: 6, number: 6, color: 'green' } as any }  // Blocks top right
      ]);

      // Analyze collision for each die
      const collisionResults = tPiece.dice.map((die, index) => {
        const currentX = tPiece.x + die.relativePos.x;
        const currentY = tPiece.y + die.relativePos.y;
        const attemptedY = currentY + GAME_CONSTANTS.FALL_STEP;

        const hitBottom = attemptedY < GAME_CONSTANTS.GROUND_Y;
        const outOfBounds = currentX < 0 || currentX >= gameBoard.state.width;
        const hitPiece = attemptedY >= GAME_CONSTANTS.GROUND_Y && 
                         attemptedY <= GAME_CONSTANTS.MAX_VALID_Y && 
                         !gameBoard.isEmpty(currentX, attemptedY);

        return {
          dieIndex: index,
          dieId: die.id,
          hasCollision: hitBottom || outOfBounds || hitPiece,
          collisionType: hitBottom ? 'bottom' : outOfBounds ? 'bounds' : hitPiece ? 'piece' : 'none'
        };
      });

      // Verify expected collisions
      expect(collisionResults[0].hasCollision).toBe(true);  // Bottom center hits obstacle
      expect(collisionResults[1].hasCollision).toBe(false); // Top left can continue
      expect(collisionResults[2].hasCollision).toBe(false); // Top center can continue
      expect(collisionResults[3].hasCollision).toBe(true);  // Top right hits obstacle

      // Verify mixed collision scenario
      const dicesToLock = collisionResults.filter(r => r.hasCollision);
      const diceToContinue = collisionResults.filter(r => !r.hasCollision);
      
      expect(dicesToLock).toHaveLength(2);
      expect(diceToContinue).toHaveLength(2);
    });

    test('should handle all-collision scenarios', () => {
      // Create horizontal line piece at bottom
      const linePiece = {
        x: 3,
        y: 0, // At bottom row
        dice: [
          { id: 'line1', sides: 6, number: 1, color: 'yellow', relativePos: { x: 0, y: 0 } },
          { id: 'line2', sides: 6, number: 2, color: 'yellow', relativePos: { x: 1, y: 0 } },
          { id: 'line3', sides: 6, number: 3, color: 'yellow', relativePos: { x: 2, y: 0 } }
        ]
      };

      // Analyze collision - all dice should hit bottom boundary
      const collisionResults = linePiece.dice.map((die, index) => {
        const currentY = linePiece.y + die.relativePos.y;
        const attemptedY = currentY + GAME_CONSTANTS.FALL_STEP;
        const hitBottom = attemptedY < GAME_CONSTANTS.GROUND_Y;

        return {
          dieIndex: index,
          dieId: die.id,
          hasCollision: hitBottom
        };
      });

      // All dice should have collision
      expect(collisionResults.every(r => r.hasCollision)).toBe(true);
      
      const dicesToLock = collisionResults.filter(r => r.hasCollision);
      const diceToContinue = collisionResults.filter(r => !r.hasCollision);
      
      expect(dicesToLock).toHaveLength(3);
      expect(diceToContinue).toHaveLength(0);
    });

    test('should handle no-collision scenarios', () => {
      // Create piece in open space
      const squarePiece = {
        x: 2,
        y: 10, // High up in the grid
        dice: [
          { id: 'sq1', sides: 6, number: 1, color: 'purple', relativePos: { x: 0, y: 0 } },
          { id: 'sq2', sides: 6, number: 2, color: 'purple', relativePos: { x: 1, y: 0 } },
          { id: 'sq3', sides: 6, number: 3, color: 'purple', relativePos: { x: 0, y: 1 } },
          { id: 'sq4', sides: 6, number: 4, color: 'purple', relativePos: { x: 1, y: 1 } }
        ]
      };

      // Analyze collision - no dice should have collision
      const collisionResults = squarePiece.dice.map((die, index) => {
        const currentX = squarePiece.x + die.relativePos.x;
        const currentY = squarePiece.y + die.relativePos.y;
        const attemptedY = currentY + GAME_CONSTANTS.FALL_STEP;

        const hitBottom = attemptedY < GAME_CONSTANTS.GROUND_Y;
        const outOfBounds = currentX < 0 || currentX >= gameBoard.state.width;
        const hitPiece = attemptedY >= GAME_CONSTANTS.GROUND_Y && 
                         attemptedY <= GAME_CONSTANTS.MAX_VALID_Y && 
                         !gameBoard.isEmpty(currentX, attemptedY);

        return {
          dieIndex: index,
          dieId: die.id,
          hasCollision: hitBottom || outOfBounds || hitPiece
        };
      });

      // No dice should have collision
      expect(collisionResults.every(r => !r.hasCollision)).toBe(true);
      
      const dicesToLock = collisionResults.filter(r => r.hasCollision);
      const diceToContinue = collisionResults.filter(r => !r.hasCollision);
      
      expect(dicesToLock).toHaveLength(0);
      expect(diceToContinue).toHaveLength(4);
    });
  });

  describe('Selective Dice Locking Logic', () => {
    test('should categorize dice correctly for mixed collision scenarios', () => {
      const activePiece = {
        x: 2,
        y: 1,
        dice: [
          { id: 'mixed1', sides: 6, number: 1, color: 'orange', relativePos: { x: 0, y: 0 } }, // Will hit bottom
          { id: 'mixed2', sides: 6, number: 2, color: 'orange', relativePos: { x: 1, y: 1 } }, // Can continue
          { id: 'mixed3', sides: 6, number: 3, color: 'orange', relativePos: { x: 2, y: 0 } }, // Will hit obstacle
          { id: 'mixed4', sides: 6, number: 4, color: 'orange', relativePos: { x: 3, y: 1 } }  // Can continue
        ]
      };

      // Place obstacle for third die (at Y=0 to block the die at (4,1) when it tries to move to (4,0))
      gameBoard.addPieceAt([
        { pos: { x: 4, y: 0 }, die: { id: 'block', sides: 6, number: 5, color: 'gray' } as any }
      ]);

      // Simulate collision detection logic
      const dicesToLock: Array<{die: any, index: number, x: number, y: number, collisionReason: string}> = [];
      const diceToContinue: Array<{die: any, index: number}> = [];

      activePiece.dice.forEach((die, index) => {
        const currentX = activePiece.x + die.relativePos.x;
        const currentY = activePiece.y + die.relativePos.y;
        const attemptedY = currentY + GAME_CONSTANTS.FALL_STEP;

        const hitBottom = attemptedY < GAME_CONSTANTS.GROUND_Y;
        const outOfBounds = currentX < 0 || currentX >= gameBoard.state.width;
        const hitPiece = attemptedY >= GAME_CONSTANTS.GROUND_Y && 
                         attemptedY <= GAME_CONSTANTS.MAX_VALID_Y && 
                         !gameBoard.isEmpty(currentX, attemptedY);

        let collisionReason = '';
        if (hitBottom) collisionReason = 'hit bottom';
        else if (outOfBounds) collisionReason = 'out of bounds';
        else if (hitPiece) collisionReason = 'hit piece';

        if (hitBottom || outOfBounds || hitPiece) {
          const lockX = Math.max(0, Math.min(currentX, gameBoard.state.width - 1));
          const lockY = Math.max(GAME_CONSTANTS.MIN_VALID_Y, Math.min(currentY, GAME_CONSTANTS.MAX_VALID_Y));
          dicesToLock.push({ die, index, x: lockX, y: lockY, collisionReason });
        } else {
          diceToContinue.push({ die, index });
        }
      });

      // Verify categorization - mixed collision scenario
      expect(dicesToLock.length).toBeGreaterThan(0); // At least one die should lock
      expect(diceToContinue.length).toBeGreaterThan(0); // At least one die should continue

      // Verify that we have a mixed collision scenario
      expect(dicesToLock.length + diceToContinue.length).toBe(activePiece.dice.length);

      // Find the dice that should lock
      const pieceHitDie = dicesToLock.find(d => d.collisionReason.includes('hit piece'));
      
      // The third die should hit the obstacle
      expect(pieceHitDie).toBeTruthy();
      expect(pieceHitDie?.die.id).toBe('mixed3');
    });

    test('should calculate correct lock positions with coordinate clamping', () => {
      const testCases = [
        {
          currentPos: { x: -1, y: 5 },
          expectedLock: { x: 0, y: 5 },
          reason: 'Clamp negative X to 0'
        },
        {
          currentPos: { x: 15, y: 3 },
          expectedLock: { x: 7, y: 3 },
          reason: 'Clamp excessive X to grid width - 1'
        },
        {
          currentPos: { x: 5, y: -2 },
          expectedLock: { x: 5, y: 0 },
          reason: 'Clamp negative Y to MIN_VALID_Y'
        },
        {
          currentPos: { x: 3, y: 25 },
          expectedLock: { x: 3, y: 15 },
          reason: 'Clamp excessive Y to MAX_VALID_Y'
        },
        {
          currentPos: { x: 4, y: 10 },
          expectedLock: { x: 4, y: 10 },
          reason: 'Valid position unchanged'
        }
      ];

      testCases.forEach(({ currentPos, expectedLock, reason }) => {
        const lockX = Math.max(0, Math.min(currentPos.x, gameBoard.state.width - 1));
        const lockY = Math.max(GAME_CONSTANTS.MIN_VALID_Y, Math.min(currentPos.y, GAME_CONSTANTS.MAX_VALID_Y));

        expect({ x: lockX, y: lockY }).toEqual(expectedLock);
      });
    });
  });

  describe('Safe Array Modification', () => {
    test('should remove dice indices in reverse order safely', () => {
      const originalDice = [
        { id: 'die0', color: 'red' },
        { id: 'die1', color: 'blue' },
        { id: 'die2', color: 'green' },
        { id: 'die3', color: 'yellow' },
        { id: 'die4', color: 'purple' }
      ];

      // Test removing indices [1, 3] (should remove in reverse order: 3, then 1)
      const testDice = [...originalDice];
      const indicesToRemove = [1, 3];
      const sortedIndices = [...indicesToRemove].sort((a, b) => b - a); // [3, 1]

      // Simulate safe removal
      sortedIndices.forEach(index => {
        testDice.splice(index, 1);
      });

      // Verify correct dice remain
      expect(testDice).toHaveLength(3);
      expect(testDice[0].id).toBe('die0'); // Original index 0
      expect(testDice[1].id).toBe('die2'); // Original index 2  
      expect(testDice[2].id).toBe('die4'); // Original index 4
    });

    test('should handle edge cases in array modification', () => {
      const testCases = [
        {
          originalLength: 5,
          indicesToRemove: [],
          expectedLength: 5,
          description: 'Empty indices array'
        },
        {
          originalLength: 3,
          indicesToRemove: [0, 1, 2],
          expectedLength: 0,
          description: 'Remove all dice'
        },
        {
          originalLength: 4,
          indicesToRemove: [1, 1, 2], // Duplicates
          expectedLength: 2,
          description: 'Duplicate indices (should be deduplicated)'
        },
        {
          originalLength: 2,
          indicesToRemove: [0],
          expectedLength: 1,
          description: 'Remove first die only'
        },
        {
          originalLength: 2,
          indicesToRemove: [1],
          expectedLength: 1,
          description: 'Remove last die only'
        }
      ];

      testCases.forEach(({ originalLength, indicesToRemove, expectedLength, description }) => {
        const testDice = Array.from({ length: originalLength }, (_, i) => ({ id: `die${i}` }));
        
        // Simulate safe removal with deduplication
        const uniqueIndices = [...new Set(indicesToRemove)].sort((a, b) => b - a);
        const validIndices = uniqueIndices.filter(i => i >= 0 && i < testDice.length);
        
        validIndices.forEach(index => {
          if (index < testDice.length) {
            testDice.splice(index, 1);
          }
        });

        expect(testDice).toHaveLength(expectedLength);
      });
    });

    test('should validate array modification safety', () => {
      const testCases = [
        {
          indices: [0, 2, 4],
          arrayLength: 5,
          expectedSafe: true,
          description: 'Valid indices within bounds'
        },
        {
          indices: [1, 5, 2],
          arrayLength: 4,
          expectedSafe: true, // Should be true because we filter out invalid indices
          description: 'Index out of bounds (filtered out)'
        },
        {
          indices: [-1, 2],
          arrayLength: 5,
          expectedSafe: true, // Should be true because we filter out invalid indices
          description: 'Negative index (filtered out)'
        },
        {
          indices: [1, 2, 1],
          arrayLength: 5,
          expectedSafe: true,
          description: 'Duplicate indices (should be handled)'
        }
      ];

      testCases.forEach(({ indices, arrayLength, expectedSafe, description }) => {
        // Simulate safety validation
        const maxValidIndex = arrayLength - 1;
        const validIndices = indices.filter(i => Number.isInteger(i) && i >= 0 && i <= maxValidIndex);
        const uniqueValidIndices = [...new Set(validIndices)];
        const isSafe = arrayLength > 0 && uniqueValidIndices.length > 0 && 
                      uniqueValidIndices.every(i => i >= 0 && i <= maxValidIndex);

        expect(isSafe).toBe(expectedSafe);
      });
    });
  });

  describe('Mixed Collision Scenarios', () => {
    test('should handle complex multi-piece collision with stacked obstacles', () => {
      // Create a complex obstacle pattern
      gameBoard.addPieceAt([
        // Bottom row obstacles
        { pos: { x: 2, y: 0 }, die: { id: 'obs1', sides: 6, number: 1, color: 'gray' } as any },
        { pos: { x: 4, y: 0 }, die: { id: 'obs2', sides: 6, number: 2, color: 'gray' } as any },
        { pos: { x: 6, y: 0 }, die: { id: 'obs3', sides: 6, number: 3, color: 'gray' } as any },
        // Second row obstacles  
        { pos: { x: 3, y: 1 }, die: { id: 'obs4', sides: 6, number: 4, color: 'gray' } as any },
        { pos: { x: 5, y: 1 }, die: { id: 'obs5', sides: 6, number: 5, color: 'gray' } as any }
      ]);

      // Create a large piece that will have mixed collisions
      const largePiece = {
        x: 1,
        y: 2,
        dice: [
          { id: 'large1', sides: 6, number: 1, color: 'cyan', relativePos: { x: 0, y: 0 } }, // (1,2) -> (1,1) - can continue
          { id: 'large2', sides: 6, number: 2, color: 'cyan', relativePos: { x: 1, y: 0 } }, // (2,2) -> (2,1) - can continue  
          { id: 'large3', sides: 6, number: 3, color: 'cyan', relativePos: { x: 2, y: 0 } }, // (3,2) -> (3,1) - hits obs4
          { id: 'large4', sides: 6, number: 4, color: 'cyan', relativePos: { x: 3, y: 0 } }, // (4,2) -> (4,1) - can continue
          { id: 'large5', sides: 6, number: 5, color: 'cyan', relativePos: { x: 4, y: 0 } }, // (5,2) -> (5,1) - hits obs5
          { id: 'large6', sides: 6, number: 6, color: 'cyan', relativePos: { x: 5, y: 0 } }  // (6,2) -> (6,1) - can continue
        ]
      };

      // Analyze collisions
      const collisionAnalysis = largePiece.dice.map((die, index) => {
        const currentX = largePiece.x + die.relativePos.x;
        const currentY = largePiece.y + die.relativePos.y;
        const attemptedY = currentY + GAME_CONSTANTS.FALL_STEP;

        const hitPiece = attemptedY >= GAME_CONSTANTS.GROUND_Y && 
                         attemptedY <= GAME_CONSTANTS.MAX_VALID_Y && 
                         !gameBoard.isEmpty(currentX, attemptedY);

        return {
          dieId: die.id,
          currentPos: { x: currentX, y: currentY },
          attemptedPos: { x: currentX, y: attemptedY },
          hasCollision: hitPiece,
          willLock: hitPiece
        };
      });

      // Verify expected collision pattern
      const expectedCollisions = [false, false, true, false, true, false];
      collisionAnalysis.forEach((result, index) => {
        expect(result.hasCollision).toBe(expectedCollisions[index]);
      });

      // Verify mixed scenario counts
      const dicesToLock = collisionAnalysis.filter(r => r.willLock);
      const diceToContinue = collisionAnalysis.filter(r => !r.willLock);

      expect(dicesToLock).toHaveLength(2);
      expect(diceToContinue).toHaveLength(4);
      expect(dicesToLock.map(d => d.dieId)).toEqual(['large3', 'large5']);
    });

    test('should simulate complete stepDrop collision detection flow', () => {
      // Create a realistic game scenario
      const activePiece = {
        id: 'test-piece',
        shape: 'L4',
        x: 3,
        y: 3,
        rotation: 0,
        dice: [
          { id: 'step1', sides: 6, number: 1, color: 'red', relativePos: { x: 0, y: 0 } },   // (3,3) -> (3,2)
          { id: 'step2', sides: 6, number: 2, color: 'red', relativePos: { x: 0, y: 1 } },   // (3,4) -> (3,3)  
          { id: 'step3', sides: 6, number: 3, color: 'red', relativePos: { x: 0, y: 2 } },   // (3,5) -> (3,4)
          { id: 'step4', sides: 6, number: 4, color: 'red', relativePos: { x: 1, y: 2 } }    // (4,5) -> (4,4)
        ]
      };

      // Place obstacle that will block first die
      gameBoard.addPieceAt([
        { pos: { x: 3, y: 2 }, die: { id: 'blocker', sides: 6, number: 5, color: 'blue' } as any }
      ]);

      // Simulate the collision detection logic from stepDrop
      const dicesToLock: Array<{die: any, index: number, x: number, y: number, collisionReason: string}> = [];
      const diceToContinue: Array<{die: any, index: number}> = [];

      activePiece.dice.forEach((die, index) => {
        const currentX = activePiece.x + die.relativePos.x;
        const currentY = activePiece.y + die.relativePos.y;
        const attemptedY = currentY + GAME_CONSTANTS.FALL_STEP;

        const hitBottom = attemptedY < GAME_CONSTANTS.GROUND_Y;
        const outOfBounds = currentX < 0 || currentX >= gameBoard.state.width;
        const hitPiece = attemptedY >= GAME_CONSTANTS.GROUND_Y && 
                         attemptedY <= GAME_CONSTANTS.MAX_VALID_Y && 
                         !gameBoard.isEmpty(currentX, attemptedY);

        let collisionReason = '';
        if (hitBottom) collisionReason = `hit bottom boundary (Y=${attemptedY} < ${GAME_CONSTANTS.GROUND_Y})`;
        else if (outOfBounds) collisionReason = `out of X bounds (X=${currentX})`;
        else if (hitPiece) collisionReason = `collision with existing piece at (${currentX}, ${attemptedY})`;

        if (hitBottom || outOfBounds || hitPiece) {
          const lockX = Math.max(0, Math.min(currentX, gameBoard.state.width - 1));
          const lockY = Math.max(GAME_CONSTANTS.MIN_VALID_Y, Math.min(currentY, GAME_CONSTANTS.MAX_VALID_Y));
          dicesToLock.push({ die, index, x: lockX, y: lockY, collisionReason });
        } else {
          diceToContinue.push({ die, index });
        }
      });

      // Verify collision detection results
      expect(dicesToLock).toHaveLength(1);
      expect(diceToContinue).toHaveLength(3);
      expect(dicesToLock[0].die.id).toBe('step1');
      expect(dicesToLock[0].collisionReason).toContain('collision with existing piece');

      // Simulate dice removal (safe array modification)
      const originalDiceCount = activePiece.dice.length;
      const lockedIndices = dicesToLock.map(d => d.index).sort((a, b) => b - a);
      
      // Remove locked dice
      lockedIndices.forEach(index => {
        activePiece.dice.splice(index, 1);
      });

      // Verify final state
      expect(activePiece.dice).toHaveLength(originalDiceCount - dicesToLock.length);
      expect(activePiece.dice.map(d => d.id)).toEqual(['step2', 'step3', 'step4']);

      // Verify collision scenario classification
      const scenarioName = mockGame.getCollisionScenarioName(dicesToLock.length, diceToContinue.length);
      expect(scenarioName).toBe('Mixed Collisions (1 lock, 3 continue)');
    });
  });

/**
 * Integration tests for collision detection with bottom-left coordinate system
 */
describe('Collision Detection Integration', () => {
  let gameBoard: GameBoard;

  beforeEach(() => {
    gameBoard = new GameBoard(GAME_CONSTANTS.GRID_WIDTH, GAME_CONSTANTS.GRID_HEIGHT);
  });

  describe('Bottom Boundary Collision', () => {
    test('should detect collision when piece would go below Y=0', () => {
      const testPositions = [
        { currentY: 0, nextY: -1, shouldCollide: true },
        { currentY: 1, nextY: 0, shouldCollide: false },
        { currentY: 2, nextY: 1, shouldCollide: false },
        { currentY: 0, nextY: -5, shouldCollide: true },
      ];

      testPositions.forEach(({ currentY, nextY, shouldCollide }) => {
        const hitBottom = nextY < GAME_CONSTANTS.GROUND_Y;
        expect(hitBottom).toBe(shouldCollide);
        
        // Also test with GridBoundaryValidator
        const isBelowGrid = GridBoundaryValidator.isBelowGrid(nextY);
        expect(isBelowGrid).toBe(shouldCollide);
      });
    });

    test('should handle multi-die piece collision with bottom', () => {
      const piece = [
        { x: 0, y: 0 }, // Bottom die
        { x: 0, y: 1 }, // Top die
      ];
      
      const pieceX = 5;
      const pieceY = 1; // Piece positioned so bottom die is at Y=1
      
      // Check collision for each die when moving down
      const collisionResults = piece.map(relativePos => {
        const currentY = pieceY + relativePos.y;
        const nextY = currentY + GAME_CONSTANTS.FALL_STEP; // -1
        return {
          die: relativePos,
          currentY,
          nextY,
          wouldHitBottom: nextY < GAME_CONSTANTS.GROUND_Y
        };
      });
      
      // Bottom die: Y=1 -> Y=0 (no collision)
      expect(collisionResults[0].wouldHitBottom).toBe(false);
      // Top die: Y=2 -> Y=1 (no collision)
      expect(collisionResults[1].wouldHitBottom).toBe(false);
      
      // Now test when piece is at Y=0
      const lowPieceY = 0;
      const lowCollisionResults = piece.map(relativePos => {
        const currentY = lowPieceY + relativePos.y;
        const nextY = currentY + GAME_CONSTANTS.FALL_STEP;
        return {
          die: relativePos,
          currentY,
          nextY,
          wouldHitBottom: nextY < GAME_CONSTANTS.GROUND_Y
        };
      });
      
      // Bottom die: Y=0 -> Y=-1 (collision!)
      expect(lowCollisionResults[0].wouldHitBottom).toBe(true);
      // Top die: Y=1 -> Y=0 (no collision)
      expect(lowCollisionResults[1].wouldHitBottom).toBe(false);
    });
  });

  describe('Side Boundary Collision', () => {
    test('should detect collision with left and right boundaries', () => {
      const testCases = [
        { x: -1, shouldCollide: true, boundary: 'left' },
        { x: 0, shouldCollide: false, boundary: 'none' },
        { x: 7, shouldCollide: false, boundary: 'none' },
        { x: 8, shouldCollide: true, boundary: 'right' },
        { x: 15, shouldCollide: true, boundary: 'right' },
      ];

      testCases.forEach(({ x, shouldCollide, boundary }) => {
        const outOfBounds = x < 0 || x >= GAME_CONSTANTS.GRID_WIDTH;
        expect(outOfBounds).toBe(shouldCollide);
        
        // Also test with GridBoundaryValidator
        const isValid = GridBoundaryValidator.validatePosition(x, 5, GAME_CONSTANTS.GRID_WIDTH, GAME_CONSTANTS.GRID_HEIGHT);
        expect(isValid).toBe(!shouldCollide);
      });
    });

    test('should handle piece collision with side boundaries', () => {
      const horizontalPiece = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ];
      
      // Test piece at right edge
      const rightEdgeX = 6; // Piece extends from X=6 to X=8
      const collisionResults = horizontalPiece.map(relativePos => {
        const absoluteX = rightEdgeX + relativePos.x;
        return {
          die: relativePos,
          absoluteX,
          outOfBounds: absoluteX < 0 || absoluteX >= GAME_CONSTANTS.GRID_WIDTH
        };
      });
      
      expect(collisionResults[0].outOfBounds).toBe(false); // X=6, valid
      expect(collisionResults[1].outOfBounds).toBe(false); // X=7, valid
      expect(collisionResults[2].outOfBounds).toBe(true);  // X=8, out of bounds
      
      // Test piece at left edge
      const leftEdgeX = -1; // Piece extends from X=-1 to X=1
      const leftCollisionResults = horizontalPiece.map(relativePos => {
        const absoluteX = leftEdgeX + relativePos.x;
        return {
          die: relativePos,
          absoluteX,
          outOfBounds: absoluteX < 0 || absoluteX >= GAME_CONSTANTS.GRID_WIDTH
        };
      });
      
      expect(leftCollisionResults[0].outOfBounds).toBe(true);  // X=-1, out of bounds
      expect(leftCollisionResults[1].outOfBounds).toBe(false); // X=0, valid
      expect(leftCollisionResults[2].outOfBounds).toBe(false); // X=1, valid
    });
  });

  describe('Piece-to-Piece Collision', () => {
    test('should detect collision with existing pieces', () => {
      // Place some dice on the board
      gameBoard.addPieceAt([
        { pos: { x: 5, y: 0 }, die: { id: 'existing1', sides: 6, number: 1, color: 'red' } as any },
        { pos: { x: 5, y: 1 }, die: { id: 'existing2', sides: 6, number: 2, color: 'blue' } as any },
        { pos: { x: 6, y: 0 }, die: { id: 'existing3', sides: 6, number: 3, color: 'green' } as any },
      ]);

      // Test collision detection
      const testPositions = [
        { x: 5, y: 0, shouldCollide: true, reason: 'occupied by existing1' },
        { x: 5, y: 1, shouldCollide: true, reason: 'occupied by existing2' },
        { x: 6, y: 0, shouldCollide: true, reason: 'occupied by existing3' },
        { x: 4, y: 0, shouldCollide: false, reason: 'empty position' },
        { x: 5, y: 2, shouldCollide: false, reason: 'empty position above existing piece' },
        { x: 7, y: 0, shouldCollide: false, reason: 'empty position to the right' },
      ];

      testPositions.forEach(({ x, y, shouldCollide, reason }) => {
        const isEmpty = gameBoard.isEmpty(x, y);
        expect(isEmpty).toBe(!shouldCollide);
      });
    });

    test('should simulate falling piece collision with stacked pieces', () => {
      // Create a stack at X=3 (center column)
      const stackHeight = 5;
      for (let y = 0; y < stackHeight; y++) {
        gameBoard.addPieceAt([{
          pos: { x: 3, y },
          die: { id: `stack-${y}`, sides: 6, number: y + 1, color: 'red' } as any
        }]);
      }

      // Simulate a piece falling in the same column
      const fallingPiece = [{ x: 0, y: 0 }]; // Single die
      const pieceX = 3; // Same column as stack (center of 8-column grid)
      let pieceY = GAME_CONSTANTS.SPAWN_Y; // Start at spawn position

      // Fall until collision
      let finalY = pieceY;
      while (pieceY + GAME_CONSTANTS.FALL_STEP >= GAME_CONSTANTS.GROUND_Y) {
        const nextY = pieceY + GAME_CONSTANTS.FALL_STEP;
        
        // Check if next position would collide
        const wouldCollide = nextY < GAME_CONSTANTS.GROUND_Y || 
                            (nextY >= GAME_CONSTANTS.GROUND_Y && 
                             nextY <= GAME_CONSTANTS.MAX_VALID_Y && 
                             !gameBoard.isEmpty(pieceX, nextY));
        
        if (wouldCollide) {
          finalY = pieceY; // Stop at current position
          break;
        } else {
          pieceY = nextY;
          finalY = pieceY;
        }
      }

      // Should stop at Y=5 (on top of the stack)
      expect(finalY).toBe(stackHeight);
      expect(gameBoard.isEmpty(pieceX, finalY)).toBe(true); // Position should be empty
      expect(gameBoard.isEmpty(pieceX, stackHeight - 1)).toBe(false); // Top of stack should be occupied
    });

    test('should handle complex piece collision scenarios', () => {
      // Create an L-shaped obstacle
      gameBoard.addPieceAt([
        { pos: { x: 3, y: 0 }, die: { id: 'obstacle1', sides: 6, number: 1, color: 'red' } as any },
        { pos: { x: 3, y: 1 }, die: { id: 'obstacle2', sides: 6, number: 2, color: 'red' } as any },
        { pos: { x: 4, y: 0 }, die: { id: 'obstacle3', sides: 6, number: 3, color: 'red' } as any },
      ]);

      // Test L-shaped piece collision
      const lPiece = [
        { x: 0, y: 0 }, // Bottom-left
        { x: 0, y: 1 }, // One up
        { x: 1, y: 0 }  // One right
      ];

      const testPlacements = [
        {
          pieceX: 2, pieceY: 0,
          expectedCollisions: [false, false, true], // Right die collides with obstacle at (3,0)
          description: 'Right die collides with existing piece'
        },
        {
          pieceX: 3, pieceY: 1,
          expectedCollisions: [true, false, false], // Bottom-left die collides with obstacle at (3,1)
          description: 'Bottom-left die collides with existing piece'
        },
        {
          pieceX: 5, pieceY: 0,
          expectedCollisions: [false, false, false], // No collisions
          description: 'No collisions in empty area'
        }
      ];

      testPlacements.forEach(({ pieceX, pieceY, expectedCollisions, description }) => {
        const collisionResults = lPiece.map((relativePos, index) => {
          const absoluteX = pieceX + relativePos.x;
          const absoluteY = pieceY + relativePos.y;
          
          // Check bounds
          const outOfBounds = absoluteX < 0 || absoluteX >= GAME_CONSTANTS.GRID_WIDTH ||
                             absoluteY < GAME_CONSTANTS.GROUND_Y;
          
          // Check piece collision (only within valid grid)
          const pieceCollision = !outOfBounds && 
                                absoluteY >= GAME_CONSTANTS.GROUND_Y && 
                                absoluteY <= GAME_CONSTANTS.MAX_VALID_Y && 
                                !gameBoard.isEmpty(absoluteX, absoluteY);
          
          return outOfBounds || pieceCollision;
        });

        expect(collisionResults).toEqual(expectedCollisions);
      });
    });
  });

  describe('Collision During Movement', () => {
    test('should detect collision during horizontal movement', () => {
      // Place obstacles
      gameBoard.addPieceAt([
        { pos: { x: 5, y: 5 }, die: { id: 'obstacle', sides: 6, number: 1, color: 'red' } as any },
      ]);

      const piece = [{ x: 0, y: 0 }]; // Single die
      const pieceY = 5; // Same row as obstacle

      // Test movement from left to right
      const movementTests = [
        { fromX: 3, toX: 4, shouldSucceed: true, reason: 'moving to empty space' },
        { fromX: 4, toX: 5, shouldSucceed: false, reason: 'moving into occupied space' },
        { fromX: 6, toX: 5, shouldSucceed: false, reason: 'moving into occupied space from right' },
        { fromX: 6, toX: 7, shouldSucceed: true, reason: 'moving to empty space on right' },
      ];

      movementTests.forEach(({ fromX, toX, shouldSucceed, reason }) => {
        const canMove = piece.every(relativePos => {
          const targetX = toX + relativePos.x;
          const targetY = pieceY + relativePos.y;
          
          // Check bounds
          if (targetX < 0 || targetX >= GAME_CONSTANTS.GRID_WIDTH ||
              targetY < GAME_CONSTANTS.GROUND_Y || targetY > GAME_CONSTANTS.MAX_VALID_Y) {
            return false;
          }
          
          // Check if target position is empty
          return gameBoard.isEmpty(targetX, targetY);
        });

        expect(canMove).toBe(shouldSucceed);
      });
    });

    test('should detect collision during rotation', () => {
      // Place obstacles to block rotation
      gameBoard.addPieceAt([
        { pos: { x: 6, y: 5 }, die: { id: 'block1', sides: 6, number: 1, color: 'red' } as any },
        { pos: { x: 7, y: 5 }, die: { id: 'block2', sides: 6, number: 2, color: 'blue' } as any },
      ]);

      // Vertical I-piece that would become horizontal when rotated
      const verticalPiece = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 }
      ];

      // Simulate rotation (vertical -> horizontal)
      const rotatedPiece = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 }
      ];

      const pieceX = 5;
      const pieceY = 5;

      // Check if original position is valid
      const originalValid = verticalPiece.every(relativePos => {
        const absoluteX = pieceX + relativePos.x;
        const absoluteY = pieceY + relativePos.y;
        return absoluteX >= 0 && absoluteX < GAME_CONSTANTS.GRID_WIDTH &&
               absoluteY >= GAME_CONSTANTS.GROUND_Y && absoluteY <= GAME_CONSTANTS.MAX_VALID_Y &&
               gameBoard.isEmpty(absoluteX, absoluteY);
      });

      // Check if rotated position would be valid
      const rotatedValid = rotatedPiece.every(relativePos => {
        const absoluteX = pieceX + relativePos.x;
        const absoluteY = pieceY + relativePos.y;
        return absoluteX >= 0 && absoluteX < GAME_CONSTANTS.GRID_WIDTH &&
               absoluteY >= GAME_CONSTANTS.GROUND_Y && absoluteY <= GAME_CONSTANTS.MAX_VALID_Y &&
               gameBoard.isEmpty(absoluteX, absoluteY);
      });

      expect(originalValid).toBe(true); // Vertical piece should fit
      expect(rotatedValid).toBe(false); // Horizontal piece should collide with obstacles at (6,5) and (7,5)
    });
  });

  describe('Edge Case Collision Scenarios', () => {
    test('should handle collision at exact boundaries', () => {
      // Test collision exactly at Y=0 (bottom boundary)
      const piece = [{ x: 0, y: 0 }];
      const pieceX = 5;
      const pieceY = 0; // Piece at bottom

      // Current position should be valid
      const currentValid = piece.every(relativePos => {
        const absoluteX = pieceX + relativePos.x;
        const absoluteY = pieceY + relativePos.y;
        return GridBoundaryValidator.validatePosition(absoluteX, absoluteY, GAME_CONSTANTS.GRID_WIDTH, GAME_CONSTANTS.GRID_HEIGHT);
      });

      // Next position (Y=-1) should be invalid
      const nextY = pieceY + GAME_CONSTANTS.FALL_STEP;
      const nextValid = piece.every(relativePos => {
        const absoluteX = pieceX + relativePos.x;
        const absoluteY = nextY + relativePos.y;
        return GridBoundaryValidator.validatePosition(absoluteX, absoluteY, GAME_CONSTANTS.GRID_WIDTH, GAME_CONSTANTS.GRID_HEIGHT);
      });

      expect(currentValid).toBe(true);
      expect(nextValid).toBe(false);
    });

    test('should handle collision with pieces at grid boundaries', () => {
      // Place pieces at all four corners
      const cornerPieces = [
        { x: 0, y: 0 }, // Bottom-left
        { x: 7, y: 0 }, // Bottom-right
        { x: 0, y: 15 }, // Top-left
        { x: 7, y: 15 }, // Top-right
      ];

      cornerPieces.forEach((pos, index) => {
        gameBoard.addPieceAt([{
          pos,
          die: { id: `corner-${index}`, sides: 6, number: index + 1, color: 'red' } as any
        }]);
      });

      // Test collision detection at corners
      cornerPieces.forEach(pos => {
        expect(gameBoard.isEmpty(pos.x, pos.y)).toBe(false);
      });

      // Test adjacent positions
      const adjacentTests = [
        { x: 1, y: 0, shouldBeEmpty: true }, // Next to bottom-left
        { x: 6, y: 0, shouldBeEmpty: true }, // Next to bottom-right
        { x: 1, y: 15, shouldBeEmpty: true }, // Next to top-left
        { x: 6, y: 15, shouldBeEmpty: true }, // Next to top-right
      ];

      adjacentTests.forEach(({ x, y, shouldBeEmpty }) => {
        expect(gameBoard.isEmpty(x, y)).toBe(shouldBeEmpty);
      });
    });

    test('should handle collision with partially locked pieces', () => {
      // Simulate a scenario where part of a piece has locked but part is still falling
      // This tests the individual die collision detection

      // Place some locked dice
      gameBoard.addPieceAt([
        { pos: { x: 4, y: 0 }, die: { id: 'locked1', sides: 6, number: 1, color: 'red' } as any },
        { pos: { x: 5, y: 0 }, die: { id: 'locked2', sides: 6, number: 2, color: 'blue' } as any },
      ]);

      // Simulate a T-piece where bottom die would hit the locked pieces
      const tPiece = [
        { x: 1, y: 0 }, // Bottom center (would be at X=5, Y=1)
        { x: 0, y: 1 }, // Top left (would be at X=4, Y=2)
        { x: 1, y: 1 }, // Top center (would be at X=5, Y=2)
        { x: 2, y: 1 }  // Top right (would be at X=6, Y=2)
      ];

      const pieceX = 4;
      const pieceY = 1;

      // Check collision for each die individually
      const collisionResults = tPiece.map((relativePos, index) => {
        const absoluteX = pieceX + relativePos.x;
        const absoluteY = pieceY + relativePos.y;
        const nextY = absoluteY + GAME_CONSTANTS.FALL_STEP;

        // Check if next position would collide
        const wouldHitBottom = nextY < GAME_CONSTANTS.GROUND_Y;
        const wouldHitPiece = nextY >= GAME_CONSTANTS.GROUND_Y && 
                             nextY <= GAME_CONSTANTS.MAX_VALID_Y && 
                             !gameBoard.isEmpty(absoluteX, nextY);

        return {
          dieIndex: index,
          currentPos: { x: absoluteX, y: absoluteY },
          nextPos: { x: absoluteX, y: nextY },
          wouldCollide: wouldHitBottom || wouldHitPiece
        };
      });

      // Bottom center die should collide (would move from Y=1 to Y=0, but X=5,Y=0 is occupied)
      expect(collisionResults[0].wouldCollide).toBe(true);
      
      // Top dice should not collide (would move from Y=2 to Y=1, which are empty)
      expect(collisionResults[1].wouldCollide).toBe(false);
      expect(collisionResults[2].wouldCollide).toBe(false);
      expect(collisionResults[3].wouldCollide).toBe(false);
    });
  });
});

});
