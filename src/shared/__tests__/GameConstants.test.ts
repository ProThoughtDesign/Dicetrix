import { describe, test, expect } from 'vitest';
import { GAME_CONSTANTS, SPAWN_POSITIONS } from '../constants/GameConstants';

describe('GameConstants', () => {
  describe('GAME_CONSTANTS', () => {
    test('should have correct grid dimensions', () => {
      expect(GAME_CONSTANTS.GRID_WIDTH).toBe(8);
      expect(GAME_CONSTANTS.GRID_HEIGHT).toBe(16);
    });

    test('should have correct coordinate boundaries', () => {
      expect(GAME_CONSTANTS.GROUND_Y).toBe(0);
      expect(GAME_CONSTANTS.TOP_Y).toBe(15);
      expect(GAME_CONSTANTS.SPAWN_Y).toBe(16);
    });

    test('should have logical coordinate relationships', () => {
      // Spawn Y should be above the visible grid for 8x16 configuration
      expect(GAME_CONSTANTS.SPAWN_Y).toBeGreaterThan(GAME_CONSTANTS.TOP_Y);
      expect(GAME_CONSTANTS.SPAWN_Y).toBeGreaterThanOrEqual(GAME_CONSTANTS.GROUND_Y);
      
      // Ground Y should be at the bottom
      expect(GAME_CONSTANTS.GROUND_Y).toBe(0);
      
      // Top Y should be one less than grid height
      expect(GAME_CONSTANTS.TOP_Y).toBe(GAME_CONSTANTS.GRID_HEIGHT - 1);
    });

    test('should have correct movement constants', () => {
      expect(GAME_CONSTANTS.FALL_STEP).toBe(-1);
      expect(GAME_CONSTANTS.RISE_STEP).toBe(1);
    });

    test('should have correct validation boundaries', () => {
      expect(GAME_CONSTANTS.MIN_VALID_Y).toBe(0);
      expect(GAME_CONSTANTS.MAX_VALID_Y).toBe(15);
      expect(GAME_CONSTANTS.MAX_VALID_Y).toBe(GAME_CONSTANTS.TOP_Y);
    });

    test('should have correct spawn center position', () => {
      expect(GAME_CONSTANTS.SPAWN_X_CENTER).toBe(3);
      expect(GAME_CONSTANTS.SPAWN_X_CENTER).toBe(Math.floor(GAME_CONSTANTS.GRID_WIDTH / 2) - 1);
    });
  });

  describe('SPAWN_POSITIONS', () => {
    test('calculateSpawnY should calculate correct spawn position', () => {
      // Piece with lowest die at relative Y=0 should spawn at Y=16
      expect(SPAWN_POSITIONS.calculateSpawnY(0)).toBe(16);
      
      // Piece with lowest die at relative Y=-1 should spawn at Y=17
      expect(SPAWN_POSITIONS.calculateSpawnY(-1)).toBe(17);
      
      // Piece with lowest die at relative Y=1 should spawn at Y=15
      expect(SPAWN_POSITIONS.calculateSpawnY(1)).toBe(15);
    });

    test('getDefaultSpawn should return correct default position', () => {
      const defaultSpawn = SPAWN_POSITIONS.getDefaultSpawn();
      expect(defaultSpawn.x).toBe(GAME_CONSTANTS.SPAWN_X_CENTER);
      expect(defaultSpawn.y).toBe(GAME_CONSTANTS.SPAWN_Y);
    });

    test('calculated spawn positions should be within valid range', () => {
      // Test various relative Y positions
      const testCases = [-2, -1, 0, 1];
      
      testCases.forEach(relativeY => {
        const spawnY = SPAWN_POSITIONS.calculateSpawnY(relativeY);
        const lowestDieY = spawnY + relativeY;
        
        // Lowest die should be at the base spawn Y (13) when relativeY is 0
        if (relativeY === 0) {
          expect(lowestDieY).toBe(GAME_CONSTANTS.SPAWN_Y);
        }
        
        // Spawn position should be within reasonable bounds for 8x16 grid
        expect(spawnY).toBeGreaterThanOrEqual(GAME_CONSTANTS.GROUND_Y);
        expect(spawnY).toBeLessThanOrEqual(GAME_CONSTANTS.TOP_Y + 5); // Allow some buffer above grid
      });
    });
  });

  describe('constant consistency', () => {
    test('constants should have consistent relationships', () => {
      // Verify that all constants work together logically for 8x16 grid
      expect(GAME_CONSTANTS.SPAWN_Y).toBeGreaterThan(GAME_CONSTANTS.TOP_Y);
      expect(GAME_CONSTANTS.SPAWN_Y).toBeGreaterThanOrEqual(GAME_CONSTANTS.GROUND_Y);
      expect(GAME_CONSTANTS.TOP_Y).toBeGreaterThan(GAME_CONSTANTS.GROUND_Y);
      expect(GAME_CONSTANTS.MIN_VALID_Y).toBe(GAME_CONSTANTS.GROUND_Y);
      expect(GAME_CONSTANTS.MAX_VALID_Y).toBe(GAME_CONSTANTS.TOP_Y);
    });
  });
});
