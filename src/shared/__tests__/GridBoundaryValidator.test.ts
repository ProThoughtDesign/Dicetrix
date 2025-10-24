import { describe, test, expect } from 'vitest';
import { GridBoundaryValidator } from '../utils/GridBoundaryValidator';

describe('GridBoundaryValidator', () => {
  const gridWidth = 10;
  const gridHeight = 20;

  describe('validatePosition', () => {
    test('should validate positions within grid boundaries', () => {
      expect(GridBoundaryValidator.validatePosition(0, 0, gridWidth, gridHeight)).toBe(true);
      expect(GridBoundaryValidator.validatePosition(9, 19, gridWidth, gridHeight)).toBe(true);
      expect(GridBoundaryValidator.validatePosition(5, 10, gridWidth, gridHeight)).toBe(true);
    });

    test('should reject positions outside grid boundaries', () => {
      expect(GridBoundaryValidator.validatePosition(-1, 0, gridWidth, gridHeight)).toBe(false);
      expect(GridBoundaryValidator.validatePosition(0, -1, gridWidth, gridHeight)).toBe(false);
      expect(GridBoundaryValidator.validatePosition(10, 0, gridWidth, gridHeight)).toBe(false);
      expect(GridBoundaryValidator.validatePosition(0, 20, gridWidth, gridHeight)).toBe(false);
    });

    test('should handle edge cases correctly', () => {
      expect(GridBoundaryValidator.validatePosition(0, 0, gridWidth, gridHeight)).toBe(true);
      expect(GridBoundaryValidator.validatePosition(gridWidth - 1, gridHeight - 1, gridWidth, gridHeight)).toBe(true);
    });
  });

  describe('clampPosition', () => {
    test('should clamp negative coordinates to 0', () => {
      const result = GridBoundaryValidator.clampPosition(-5, -3, gridWidth, gridHeight);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    test('should clamp coordinates above maximum to maximum', () => {
      const result = GridBoundaryValidator.clampPosition(15, 25, gridWidth, gridHeight);
      expect(result).toEqual({ x: 9, y: 19 });
    });

    test('should leave valid coordinates unchanged', () => {
      const result = GridBoundaryValidator.clampPosition(5, 10, gridWidth, gridHeight);
      expect(result).toEqual({ x: 5, y: 10 });
    });

    test('should handle mixed valid/invalid coordinates', () => {
      const result1 = GridBoundaryValidator.clampPosition(-1, 10, gridWidth, gridHeight);
      expect(result1).toEqual({ x: 0, y: 10 });
      
      const result2 = GridBoundaryValidator.clampPosition(5, 25, gridWidth, gridHeight);
      expect(result2).toEqual({ x: 5, y: 19 });
    });
  });

  describe('validateSpawnPosition', () => {
    test('should validate spawn position above grid', () => {
      // Piece at Y=21 with lowest die at relative Y=0 should be valid
      expect(GridBoundaryValidator.validateSpawnPosition(21, 0, 21)).toBe(true);
      
      // Piece at Y=22 with lowest die at relative Y=-1 should be valid
      expect(GridBoundaryValidator.validateSpawnPosition(22, -1, 21)).toBe(true);
    });

    test('should reject spawn position at or below required spawn Y', () => {
      // Piece at Y=20 with lowest die at relative Y=0 would put lowest die at Y=20
      expect(GridBoundaryValidator.validateSpawnPosition(20, 0, 21)).toBe(false);
      
      // Piece at Y=19 with lowest die at relative Y=0 would put lowest die at Y=19
      expect(GridBoundaryValidator.validateSpawnPosition(19, 0, 21)).toBe(false);
    });
  });

  describe('boundary checks', () => {
    test('isAtBottom should detect bottom boundary', () => {
      expect(GridBoundaryValidator.isAtBottom(0)).toBe(true);
      expect(GridBoundaryValidator.isAtBottom(-1)).toBe(true);
      expect(GridBoundaryValidator.isAtBottom(1)).toBe(false);
    });

    test('isAtTop should detect top boundary', () => {
      expect(GridBoundaryValidator.isAtTop(19, gridHeight)).toBe(true);
      expect(GridBoundaryValidator.isAtTop(20, gridHeight)).toBe(false);
      expect(GridBoundaryValidator.isAtTop(18, gridHeight)).toBe(false);
    });

    test('isBelowGrid should detect positions below grid', () => {
      expect(GridBoundaryValidator.isBelowGrid(-1)).toBe(true);
      expect(GridBoundaryValidator.isBelowGrid(-5)).toBe(true);
      expect(GridBoundaryValidator.isBelowGrid(0)).toBe(false);
      expect(GridBoundaryValidator.isBelowGrid(1)).toBe(false);
    });

    test('isAboveGrid should detect positions above visible grid', () => {
      expect(GridBoundaryValidator.isAboveGrid(20, gridHeight)).toBe(true);
      expect(GridBoundaryValidator.isAboveGrid(25, gridHeight)).toBe(true);
      expect(GridBoundaryValidator.isAboveGrid(19, gridHeight)).toBe(false);
      expect(GridBoundaryValidator.isAboveGrid(0, gridHeight)).toBe(false);
    });
  });
});
