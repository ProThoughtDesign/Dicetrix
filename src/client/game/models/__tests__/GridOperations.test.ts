import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Grid } from '../Grid.js';
import { Die } from '../Die.js';
import { Piece } from '../Piece.js';

// Mock scene for Die and Piece creation
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

describe('Grid Operations and Collision Detection', () => {
  let grid: Grid;

  beforeEach(() => {
    grid = new Grid(32, 0, 0);
  });

  describe('Basic Grid Operations', () => {
    it('should initialize empty 10x20 grid', () => {
      expect(grid.width).toBe(10);
      expect(grid.height).toBe(20);
      expect(grid.getFilledCellCount()).toBe(0);
    });

    it('should validate grid positions correctly', () => {
      expect(grid.isValidPosition(0, 0)).toBe(true);
      expect(grid.isValidPosition(9, 19)).toBe(true);
      expect(grid.isValidPosition(-1, 0)).toBe(false);
      expect(grid.isValidPosition(10, 0)).toBe(false);
      expect(grid.isValidPosition(0, 20)).toBe(false);
    });

    it('should check empty positions correctly', () => {
      expect(grid.isEmpty(5, 5)).toBe(true);
      
      const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
      grid.setDie(5, 5, die);
      
      expect(grid.isEmpty(5, 5)).toBe(false);
    });

    it('should set and get dice correctly', () => {
      const die = new Die(mockScene, 0, 0, 6, 'blue', false, false);
      die.number = 4;
      
      expect(grid.setDie(3, 7, die)).toBe(true);
      expect(grid.getDie(3, 7)).toBe(die);
      expect(grid.getDie(3, 8)).toBe(null);
    });

    it('should reject invalid positions for setDie', () => {
      const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
      
      expect(grid.setDie(-1, 0, die)).toBe(false);
      expect(grid.setDie(10, 0, die)).toBe(false);
      expect(grid.setDie(0, 20, die)).toBe(false);
    });
  });

  describe('Collision Detection', () => {
    it('should detect collision with grid boundaries', () => {
      const piece = new Piece(mockScene, 'I', 'easy', 0, 0);
      
      // Test left boundary collision
      expect(grid.checkCollision(piece, -1, 0)).toBe(true);
      
      // Test right boundary collision  
      expect(grid.checkCollision(piece, 8, 0)).toBe(true);
      
      // Test bottom boundary collision
      expect(grid.checkCollision(piece, 0, 19)).toBe(true);
    });

    it('should allow movement above grid (negative Y)', () => {
      const piece = new Piece(mockScene, 'O', 'easy', 4, -2);
      
      // Should not collide when above grid
      expect(grid.checkCollision(piece, 4, -1)).toBe(false);
    });

    it('should detect collision with existing dice', () => {
      // Place a die in the grid
      const existingDie = new Die(mockScene, 0, 0, 6, 'red', false, false);
      grid.setDie(5, 10, existingDie);
      
      const piece = new Piece(mockScene, 'O', 'easy', 4, 9);
      
      // Should collide with existing die
      expect(grid.checkCollision(piece, 4, 9)).toBe(true);
    });

    it('should not detect collision in empty areas', () => {
      const piece = new Piece(mockScene, 'T', 'easy', 4, 5);
      
      // Should not collide in empty area
      expect(grid.checkCollision(piece, 4, 5)).toBe(false);
    });
  });

  describe('Piece Placement', () => {
    it('should successfully place piece in empty area', () => {
      const piece = new Piece(mockScene, 'O', 'easy', 4, 10);
      
      expect(grid.addPiece(piece)).toBe(true);
      expect(grid.getFilledCellCount()).toBeGreaterThan(0);
    });

    it('should reject piece placement in occupied area', () => {
      // Place first piece
      const piece1 = new Piece(mockScene, 'O', 'easy', 4, 10);
      grid.addPiece(piece1);
      
      // Try to place overlapping piece
      const piece2 = new Piece(mockScene, 'O', 'easy', 4, 10);
      expect(grid.addPiece(piece2)).toBe(false);
    });

    it('should check if piece can be placed at position', () => {
      const piece = new Piece(mockScene, 'L', 'easy', 0, 0);
      
      expect(grid.canPlacePiece(piece, 2, 5)).toBe(true);
      
      // Place blocking die
      const blockingDie = new Die(mockScene, 0, 0, 6, 'red', false, false);
      grid.setDie(2, 5, blockingDie);
      
      expect(grid.canPlacePiece(piece, 2, 5)).toBe(false);
    });
  });

  describe('Gravity System', () => {
    it('should apply gravity to floating dice', () => {
      // Place dice with gaps
      const die1 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'blue', false, false);
      
      grid.setDie(5, 5, die1);  // Floating die
      grid.setDie(5, 18, die2); // Bottom die
      
      const moved = grid.applyGravity();
      
      expect(moved).toBe(true);
      expect(grid.getDie(5, 5)).toBe(null);
      expect(grid.getDie(5, 17)).toBe(die1); // Should fall to position above bottom die
    });

    it('should not move dice that are already settled', () => {
      // Place dice at bottom
      const die1 = new Die(mockScene, 0, 0, 6, 'red', false, false);
      const die2 = new Die(mockScene, 0, 0, 6, 'blue', false, false);
      
      grid.setDie(3, 18, die1);
      grid.setDie(3, 19, die2);
      
      const moved = grid.applyGravity();
      
      expect(moved).toBe(false);
      expect(grid.getDie(3, 18)).toBe(die1);
      expect(grid.getDie(3, 19)).toBe(die2);
    });

    it('should handle multiple columns with gravity', () => {
      // Place dice in multiple columns
      const dice = Array.from({ length: 4 }, () => 
        new Die(mockScene, 0, 0, 6, 'green', false, false)
      );
      
      grid.setDie(2, 5, dice[0]);
      grid.setDie(2, 10, dice[1]);
      grid.setDie(7, 3, dice[2]);
      grid.setDie(7, 15, dice[3]);
      
      const moved = grid.applyGravity();
      
      expect(moved).toBe(true);
      // Check that dice fell to bottom
      expect(grid.getDie(2, 18)).toBe(dice[1]);
      expect(grid.getDie(2, 19)).toBe(dice[0]);
      expect(grid.getDie(7, 18)).toBe(dice[3]);
      expect(grid.getDie(7, 19)).toBe(dice[2]);
    });
  });

  describe('Row and Column Operations', () => {
    it('should clear entire row correctly', () => {
      // Fill a row with dice
      const dice = Array.from({ length: 5 }, () => 
        new Die(mockScene, 0, 0, 6, 'red', false, false)
      );
      
      for (let i = 0; i < 5; i++) {
        grid.setDie(i, 10, dice[i]);
      }
      
      const clearedDice = grid.clearRow(10);
      
      expect(clearedDice).toHaveLength(5);
      expect(grid.getRow(10).every(cell => cell === null)).toBe(true);
    });

    it('should clear entire column correctly', () => {
      // Fill a column with dice
      const dice = Array.from({ length: 5 }, () => 
        new Die(mockScene, 0, 0, 6, 'blue', false, false)
      );
      
      for (let i = 0; i < 5; i++) {
        grid.setDie(5, 15 + i, dice[i]);
      }
      
      const clearedDice = grid.clearColumn(5);
      
      expect(clearedDice).toHaveLength(5);
      expect(grid.getColumn(5).every(cell => cell === null)).toBe(true);
    });

    it('should get row and column data correctly', () => {
      const die = new Die(mockScene, 0, 0, 6, 'yellow', false, false);
      grid.setDie(3, 7, die);
      
      const row = grid.getRow(7);
      const column = grid.getColumn(3);
      
      expect(row[3]).toBe(die);
      expect(column[7]).toBe(die);
      expect(row).toHaveLength(10);
      expect(column).toHaveLength(20);
    });
  });

  describe('Area Clearing', () => {
    it('should clear rectangular area correctly', () => {
      // Place dice in 3x3 area
      const dice = Array.from({ length: 9 }, () => 
        new Die(mockScene, 0, 0, 6, 'purple', false, false)
      );
      
      let dieIndex = 0;
      for (let y = 8; y <= 10; y++) {
        for (let x = 4; x <= 6; x++) {
          grid.setDie(x, y, dice[dieIndex++]);
        }
      }
      
      const clearedDice = grid.clearArea(5, 9, 3);
      
      expect(clearedDice).toHaveLength(9);
      
      // Check that area is cleared
      for (let y = 8; y <= 10; y++) {
        for (let x = 4; x <= 6; x++) {
          expect(grid.getDie(x, y)).toBe(null);
        }
      }
    });

    it('should clear entire grid correctly', () => {
      // Place some dice
      const dice = Array.from({ length: 10 }, () => 
        new Die(mockScene, 0, 0, 6, 'orange', false, false)
      );
      
      for (let i = 0; i < 10; i++) {
        grid.setDie(i, 19, dice[i]);
      }
      
      const clearedDice = grid.clearAll();
      
      expect(clearedDice).toHaveLength(10);
      expect(grid.getFilledCellCount()).toBe(0);
    });
  });

  describe('Game State Checks', () => {
    it('should detect when grid is full (game over)', () => {
      expect(grid.isFull()).toBe(false);
      
      // Fill top row
      for (let x = 0; x < 10; x++) {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        grid.setDie(x, 0, die);
      }
      
      expect(grid.isFull()).toBe(true);
    });

    it('should count filled cells correctly', () => {
      expect(grid.getFilledCellCount()).toBe(0);
      
      // Add some dice
      for (let i = 0; i < 5; i++) {
        const die = new Die(mockScene, 0, 0, 6, 'green', false, false);
        grid.setDie(i, 19, die);
      }
      
      expect(grid.getFilledCellCount()).toBe(5);
    });

    it('should find drop position for pieces', () => {
      const piece = new Piece(mockScene, 'I', 'easy', 5, 0);
      
      // Empty grid - should drop to bottom
      const dropY1 = grid.findDropPosition(piece, 5);
      expect(dropY1).toBeGreaterThan(15);
      
      // Add blocking dice
      const blockingDie = new Die(mockScene, 0, 0, 6, 'red', false, false);
      grid.setDie(5, 15, blockingDie);
      
      const dropY2 = grid.findDropPosition(piece, 5);
      expect(dropY2).toBeLessThan(15);
    });
  });

  describe('Coordinate Conversion', () => {
    it('should convert grid to screen coordinates', () => {
      const screenPos = grid.gridToScreen(5, 10);
      
      expect(screenPos.x).toBe(5 * 32 + 16); // 5 * cellSize + cellSize/2
      expect(screenPos.y).toBe(10 * 32 + 16);
    });

    it('should convert screen to grid coordinates', () => {
      const gridPos = grid.screenToGrid(176, 336); // 5.5 * 32, 10.5 * 32
      
      expect(gridPos.x).toBe(5);
      expect(gridPos.y).toBe(10);
    });
  });

  describe('Grid Reset and Layout', () => {
    it('should reset grid to empty state', () => {
      // Add some dice
      for (let i = 0; i < 5; i++) {
        const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
        grid.setDie(i, 19, die);
      }
      
      expect(grid.getFilledCellCount()).toBe(5);
      
      grid.reset();
      
      expect(grid.getFilledCellCount()).toBe(0);
    });

    it('should update layout and dice positions', () => {
      const die = new Die(mockScene, 0, 0, 6, 'blue', false, false);
      grid.setDie(2, 3, die);
      
      // Change layout
      grid.setLayout(64, 100, 200);
      
      // Verify die position was updated (setPosition should be called)
      expect(die.setPosition).toHaveBeenCalled();
    });
  });

  describe('Performance Tests', () => {
    it('should handle full grid operations efficiently', () => {
      // Fill entire grid
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          const die = new Die(mockScene, 0, 0, 6, 'red', false, false);
          die.number = Math.floor(Math.random() * 6) + 1;
          grid.setDie(x, y, die);
        }
      }
      
      const startTime = performance.now();
      
      // Perform operations
      grid.applyGravity();
      grid.detectMatches();
      grid.getFilledCellCount();
      
      const endTime = performance.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle repeated gravity applications efficiently', () => {
      // Create scenario with many floating dice
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          if (Math.random() > 0.5) {
            const die = new Die(mockScene, 0, 0, 6, 'green', false, false);
            grid.setDie(x, y, die);
          }
        }
      }
      
      const startTime = performance.now();
      
      // Apply gravity multiple times
      for (let i = 0; i < 10; i++) {
        grid.applyGravity();
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
