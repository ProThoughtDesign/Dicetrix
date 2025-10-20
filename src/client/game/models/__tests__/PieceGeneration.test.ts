import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Piece } from '../Piece.js';
import { Die } from '../Die.js';
import { DieFactory } from '../DieFactory.js';
import { PIECE_SHAPES } from '../../../../shared/config/game-modes.js';

// Mock scene for Piece creation
const mockScene = {
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

describe('Piece Generation and Rotation Logic', () => {
  describe('Piece Creation', () => {
    it('should create piece with correct shape and dice count', () => {
      const piece = new Piece(mockScene, 'I', 'easy', 4, 0);
      
      expect(piece.shape).toBe('I');
      expect(piece.dice).toHaveLength(4); // I-piece has 4 dice
      expect(piece.gridX).toBe(4);
      expect(piece.gridY).toBe(0);
    });

    it('should create pieces for all standard shapes', () => {
      const shapes = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'] as const;
      
      for (const shape of shapes) {
        const piece = new Piece(mockScene, shape, 'medium', 4, 0);
        
        expect(piece.shape).toBe(shape);
        expect(piece.dice.length).toBeGreaterThan(0);
        expect(piece.shapeMatrix).toBeDefined();
        
        piece.destroy();
      }
    });

    it('should throw error for unknown shape', () => {
      expect(() => {
        new Piece(mockScene, 'INVALID' as any, 'easy', 4, 0);
      }).toThrow('Unknown piece shape: INVALID');
    });

    it('should create dice with appropriate properties for game mode', () => {
      const piece = new Piece(mockScene, 'T', 'hard', 4, 0);
      
      // All dice should be valid Die instances
      piece.dice.forEach(die => {
        expect(die).toBeInstanceOf(Die);
        expect(die.sides).toBeGreaterThan(0);
        expect(die.number).toBeGreaterThan(0);
        expect(['red', 'blue', 'green', 'yellow', 'purple']).toContain(die.color);
      });
    });
  });

  describe('Piece Movement', () => {
    let piece: Piece;

    beforeEach(() => {
      piece = new Piece(mockScene, 'T', 'easy', 4, 5);
    });

    it('should move left when possible', () => {
      const initialX = piece.gridX;
      const moved = piece.moveLeft();
      
      expect(moved).toBe(true);
      expect(piece.gridX).toBe(initialX - 1);
    });

    it('should move right when possible', () => {
      const initialX = piece.gridX;
      const moved = piece.moveRight();
      
      expect(moved).toBe(true);
      expect(piece.gridX).toBe(initialX + 1);
    });

    it('should move down when possible', () => {
      const initialY = piece.gridY;
      const moved = piece.moveDown();
      
      expect(moved).toBe(true);
      expect(piece.gridY).toBe(initialY + 1);
    });

    it('should not move beyond left boundary', () => {
      const leftPiece = new Piece(mockScene, 'I', 'easy', 0, 5);
      const moved = leftPiece.moveLeft();
      
      expect(moved).toBe(false);
      expect(leftPiece.gridX).toBe(0);
    });

    it('should not move beyond right boundary', () => {
      const rightPiece = new Piece(mockScene, 'I', 'easy', 6, 5);
      const moved = rightPiece.moveRight();
      
      expect(moved).toBe(false);
      expect(rightPiece.gridX).toBe(6);
    });

    it('should not move beyond bottom boundary', () => {
      const bottomPiece = new Piece(mockScene, 'O', 'easy', 4, 18);
      const moved = bottomPiece.moveDown();
      
      expect(moved).toBe(false);
      expect(bottomPiece.gridY).toBe(18);
    });
  });

  describe('Piece Rotation', () => {
    it('should rotate T-piece correctly', () => {
      const piece = new Piece(mockScene, 'T', 'easy', 4, 5);
      const initialRotation = piece.rotation;
      
      const rotated = piece.rotatePiece();
      
      expect(rotated).toBe(true);
      expect(piece.rotation).toBe((initialRotation + 90) % 360);
    });

    it('should rotate I-piece correctly', () => {
      const piece = new Piece(mockScene, 'I', 'easy', 4, 5);
      
      // I-piece should rotate between horizontal and vertical
      const rotated1 = piece.rotatePiece();
      expect(rotated1).toBe(true);
      
      const rotated2 = piece.rotatePiece();
      expect(rotated2).toBe(true);
      
      // After 4 rotations, should be back to original
      piece.rotatePiece();
      piece.rotatePiece();
      expect(piece.rotation).toBe(0);
    });

    it('should handle wall kicks for rotation', () => {
      // Place I-piece near right wall
      const piece = new Piece(mockScene, 'I', 'easy', 8, 5);
      
      // Should kick left to accommodate rotation
      const rotated = piece.rotatePiece();
      
      if (rotated) {
        expect(piece.gridX).toBeLessThan(8);
      }
    });

    it('should not rotate when blocked', () => {
      // Create piece near boundary where rotation would fail
      const piece = new Piece(mockScene, 'I', 'easy', 9, 18);
      const initialRotation = piece.rotation;
      
      const rotated = piece.rotatePiece();
      
      // Should fail to rotate due to boundary constraints
      expect(rotated).toBe(false);
      expect(piece.rotation).toBe(initialRotation);
    });

    it('should update dice positions after rotation', () => {
      const piece = new Piece(mockScene, 'L', 'easy', 4, 5);
      
      // Mock setPosition to track calls
      piece.dice.forEach(die => {
        vi.clearAllMocks();
      });
      
      piece.rotatePiece();
      
      // All dice should have their positions updated
      piece.dice.forEach(die => {
        expect(die.setPosition).toHaveBeenCalled();
      });
    });
  });

  describe('Piece Position Validation', () => {
    let piece: Piece;

    beforeEach(() => {
      piece = new Piece(mockScene, 'O', 'easy', 4, 5);
    });

    it('should validate valid positions', () => {
      expect(piece.canMoveTo(3, 5)).toBe(true);
      expect(piece.canMoveTo(5, 5)).toBe(true);
      expect(piece.canMoveTo(4, 6)).toBe(true);
    });

    it('should reject invalid positions', () => {
      expect(piece.canMoveTo(-1, 5)).toBe(false);
      expect(piece.canMoveTo(10, 5)).toBe(false);
      expect(piece.canMoveTo(4, 20)).toBe(false);
    });

    it('should allow positions above grid (negative Y)', () => {
      expect(piece.canMoveTo(4, -1)).toBe(true);
      expect(piece.canMoveTo(4, -5)).toBe(true);
    });

    it('should get correct dice positions', () => {
      const positions = piece.getDicePositions();
      
      expect(positions).toHaveLength(4); // O-piece has 4 dice
      positions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(4);
        expect(pos.x).toBeLessThanOrEqual(5);
        expect(pos.y).toBeGreaterThanOrEqual(5);
        expect(pos.y).toBeLessThanOrEqual(6);
      });
    });

    it('should calculate piece bounds correctly', () => {
      const bounds = piece.getBounds();
      
      expect(bounds.left).toBe(4);
      expect(bounds.right).toBe(5);
      expect(bounds.top).toBe(5);
      expect(bounds.bottom).toBe(6);
    });
  });

  describe('Piece Locking', () => {
    it('should return correct lock positions', () => {
      const piece = new Piece(mockScene, 'T', 'easy', 3, 10);
      const lockPositions = piece.lockToGrid();
      
      expect(lockPositions).toHaveLength(4); // T-piece has 4 dice
      lockPositions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(2);
        expect(pos.x).toBeLessThanOrEqual(4);
        expect(pos.y).toBeGreaterThanOrEqual(10);
        expect(pos.y).toBeLessThanOrEqual(11);
      });
    });

    it('should handle different piece orientations for locking', () => {
      const piece = new Piece(mockScene, 'L', 'easy', 4, 8);
      
      // Rotate and check lock positions
      piece.rotatePiece();
      const lockPositions = piece.lockToGrid();
      
      expect(lockPositions).toHaveLength(4);
      // Positions should reflect rotated shape
      lockPositions.forEach(pos => {
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
      });
    });
  });

  describe('Ghost Piece Creation', () => {
    it('should create ghost piece with same shape and rotation', () => {
      const piece = new Piece(mockScene, 'S', 'medium', 5, 3);
      piece.rotatePiece(); // Rotate original
      
      const ghost = piece.createGhost(mockScene, 15);
      
      expect(ghost.shape).toBe(piece.shape);
      expect(ghost.rotation).toBe(piece.rotation);
      expect(ghost.gridX).toBe(piece.gridX);
      expect(ghost.gridY).toBe(15);
      
      // Ghost dice should be semi-transparent
      ghost.dice.forEach(die => {
        expect(die.setAlpha).toHaveBeenCalledWith(0.3);
      });
      
      ghost.destroy();
    });
  });

  describe('Piece Serialization', () => {
    it('should serialize piece data correctly', () => {
      const piece = new Piece(mockScene, 'Z', 'hard', 6, 12);
      piece.rotatePiece();
      
      const data = piece.toData();
      
      expect(data.shape).toBe('Z');
      expect(data.rotation).toBe(90);
      expect(data.gridX).toBe(6);
      expect(data.gridY).toBe(12);
      expect(data.dice).toHaveLength(piece.dice.length);
      
      // Each die should have serialized data
      data.dice.forEach(dieData => {
        expect(dieData).toHaveProperty('sides');
        expect(dieData).toHaveProperty('number');
        expect(dieData).toHaveProperty('color');
      });
    });
  });

  describe('Shape Matrix Operations', () => {
    it('should handle all standard Tetromino shapes', () => {
      const expectedDiceCounts = {
        'I': 4,
        'O': 4,
        'T': 4,
        'L': 4,
        'J': 4,
        'S': 4,
        'Z': 4
      };

      for (const [shape, expectedCount] of Object.entries(expectedDiceCounts)) {
        const piece = new Piece(mockScene, shape as any, 'easy', 4, 5);
        expect(piece.dice).toHaveLength(expectedCount);
        piece.destroy();
      }
    });

    it('should maintain shape integrity through rotations', () => {
      const piece = new Piece(mockScene, 'T', 'easy', 4, 5);
      const originalDiceCount = piece.dice.length;
      
      // Rotate 4 times (full circle)
      for (let i = 0; i < 4; i++) {
        piece.rotatePiece();
        expect(piece.dice).toHaveLength(originalDiceCount);
      }
      
      // Should be back to original rotation
      expect(piece.rotation).toBe(0);
    });

    it('should handle complex shapes correctly', () => {
      // Test with L-piece which has an asymmetric shape
      const piece = new Piece(mockScene, 'L', 'easy', 4, 5);
      
      const positions1 = piece.getDicePositions();
      piece.rotatePiece();
      const positions2 = piece.getDicePositions();
      
      // Positions should be different after rotation
      expect(positions1).not.toEqual(positions2);
      
      // But should have same number of positions
      expect(positions1).toHaveLength(positions2.length);
    });
  });

  describe('Performance Tests', () => {
    it('should create pieces efficiently', () => {
      const startTime = performance.now();
      
      // Create many pieces
      const pieces = [];
      for (let i = 0; i < 100; i++) {
        const shapes = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'] as const;
        const shape = shapes[i % shapes.length];
        pieces.push(new Piece(mockScene, shape, 'medium', 4, 0));
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
      
      // Clean up
      pieces.forEach(piece => piece.destroy());
    });

    it('should handle rapid rotation efficiently', () => {
      const piece = new Piece(mockScene, 'T', 'easy', 4, 5);
      
      const startTime = performance.now();
      
      // Perform many rotations
      for (let i = 0; i < 100; i++) {
        piece.rotatePiece();
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
      
      piece.destroy();
    });

    it('should handle rapid movement efficiently', () => {
      const piece = new Piece(mockScene, 'I', 'easy', 4, 5);
      
      const startTime = performance.now();
      
      // Perform many movements
      for (let i = 0; i < 100; i++) {
        piece.moveLeft();
        piece.moveRight();
        piece.moveDown();
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
      
      piece.destroy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle piece at grid boundaries', () => {
      // Test piece at various boundary positions
      const positions = [
        { x: 0, y: 0 },    // Top-left
        { x: 9, y: 0 },    // Top-right
        { x: 0, y: 19 },   // Bottom-left
        { x: 9, y: 19 }    // Bottom-right
      ];

      for (const pos of positions) {
        const piece = new Piece(mockScene, 'O', 'easy', pos.x, pos.y);
        
        // Should handle boundary conditions gracefully
        expect(() => {
          piece.moveLeft();
          piece.moveRight();
          piece.moveDown();
          piece.rotatePiece();
        }).not.toThrow();
        
        piece.destroy();
      }
    });

    it('should handle piece destruction correctly', () => {
      const piece = new Piece(mockScene, 'T', 'easy', 4, 5);
      const diceCount = piece.dice.length;
      
      // Mock destroy method to track calls
      piece.dice.forEach(die => {
        vi.spyOn(die, 'destroy');
      });
      
      piece.destroy();
      
      // All dice should be destroyed
      expect(piece.dice).toHaveLength(0);
    });

    it('should handle invalid grid positions gracefully', () => {
      const piece = new Piece(mockScene, 'L', 'easy', 4, 5);
      
      // Test extreme positions
      expect(piece.canMoveTo(-100, 5)).toBe(false);
      expect(piece.canMoveTo(100, 5)).toBe(false);
      expect(piece.canMoveTo(4, 100)).toBe(false);
    });
  });
});
