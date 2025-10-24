import { describe, test, expect } from 'vitest';
import { GAME_CONSTANTS } from '../../../../shared/constants/GameConstants';

/**
 * Test suite for piece rotation system with bottom-left coordinate system
 */
describe('Piece Rotation System', () => {
  
  // Helper function to simulate the rotation matrix logic
  function rotateMatrix(
    positions: Array<{ x: number; y: number }>,
    clockwise: boolean
  ): Array<{ x: number; y: number }> {
    if (positions.length === 0) return positions;

    // Simple rotation around origin (0,0)
    const rotated = positions.map((p) => {
      let newX, newY;
      if (clockwise) {
        // 90° clockwise: (x,y) -> (-y, x)
        newX = -p.y;
        newY = p.x;
      } else {
        // 90° counter-clockwise: (x,y) -> (y, -x)
        newX = p.y;
        newY = -p.x;
      }
      return { x: newX, y: newY };
    });

    // Find the minimum X and Y to normalize back to positive coordinates
    const xValues = rotated.map((p) => p.x);
    const yValues = rotated.map((p) => p.y);
    const minX = Math.min(...xValues);
    const minY = Math.min(...yValues);

    // Normalize to ensure all coordinates are >= 0
    const normalized = rotated.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
    }));

    return normalized;
  }

  describe('Basic Rotation Logic', () => {
    test('should rotate L-piece correctly clockwise', () => {
      const lPiece = [
        { x: 0, y: 0 }, // Bottom-left corner
        { x: 0, y: 1 }, // One up
        { x: 0, y: 2 }, // Two up
        { x: 1, y: 0 }  // One right from bottom-left
      ];

      const rotated = rotateMatrix(lPiece, true);
      
      // After 90° clockwise rotation, the L should be rotated
      expect(rotated).toEqual([
        { x: 2, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
        { x: 2, y: 1 }
      ]);
    });

    test('should rotate L-piece correctly counter-clockwise', () => {
      const lPiece = [
        { x: 0, y: 0 }, // Bottom-left corner
        { x: 0, y: 1 }, // One up
        { x: 0, y: 2 }, // Two up
        { x: 1, y: 0 }  // One right from bottom-left
      ];

      const rotated = rotateMatrix(lPiece, false);
      
      // After 90° counter-clockwise rotation
      expect(rotated).toEqual([
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 0, y: 0 }
      ]);
    });

    test('should return to original position after 4 rotations', () => {
      const originalPiece = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 }
      ];

      let rotated = originalPiece;
      
      // Rotate 4 times clockwise (360°)
      for (let i = 0; i < 4; i++) {
        rotated = rotateMatrix(rotated, true);
      }

      expect(rotated).toEqual(originalPiece);
    });

    test('should handle single die rotation', () => {
      const singleDie = [{ x: 0, y: 0 }];
      
      const rotated = rotateMatrix(singleDie, true);
      
      // Single die should remain at origin after rotation and normalization
      expect(rotated).toEqual([{ x: 0, y: 0 }]);
    });

    test('should handle empty positions array', () => {
      const empty: Array<{ x: number; y: number }> = [];
      
      const rotated = rotateMatrix(empty, true);
      
      expect(rotated).toEqual([]);
    });
  });

  describe('Coordinate System Compatibility', () => {
    test('should maintain bottom-left coordinate system principles', () => {
      // Test a piece that extends upward (positive Y)
      const verticalPiece = [
        { x: 0, y: 0 }, // Bottom
        { x: 0, y: 1 }, // Middle
        { x: 0, y: 2 }  // Top
      ];

      const rotated = rotateMatrix(verticalPiece, true);
      
      // After clockwise rotation, should become horizontal
      expect(rotated).toEqual([
        { x: 2, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 }
      ]);
    });

    test('should normalize negative coordinates correctly', () => {
      // Test a piece that would create negative coordinates after rotation
      const testPiece = [
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ];

      const rotated = rotateMatrix(testPiece, true);
      
      // Should be normalized to positive coordinates
      expect(rotated.every(pos => pos.x >= 0 && pos.y >= 0)).toBe(true);
      // After clockwise rotation: (1,0) -> (0,1), (2,0) -> (0,2)
      // After normalization: min values are (0,1), so subtract (0,1) from all
      expect(rotated).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 1 }
      ]);
    });

    test('should preserve relative positioning after rotation', () => {
      const squarePiece = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ];

      const rotated = rotateMatrix(squarePiece, true);
      
      // Square should remain the same shape after rotation
      expect(rotated.sort((a, b) => a.x - b.x || a.y - b.y)).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 }
      ]);
    });
  });

  describe('Boundary Conditions', () => {
    test('should handle rotation of pieces with large coordinates', () => {
      const largePiece = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 5, y: 6 }
      ];

      const rotated = rotateMatrix(largePiece, true);
      
      // Should still normalize correctly
      expect(rotated.every(pos => pos.x >= 0 && pos.y >= 0)).toBe(true);
      expect(rotated.length).toBe(3);
    });

    test('should handle rotation near coordinate boundaries', () => {
      // Test piece at edge of coordinate space
      const edgePiece = [
        { x: 0, y: 0 },
        { x: 0, y: 1 }
      ];

      const rotated = rotateMatrix(edgePiece, false);
      
      expect(rotated).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ]);
    });
  });

  describe('Rotation Consistency', () => {
    test('clockwise and counter-clockwise should be inverse operations', () => {
      const originalPiece = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 }
      ];

      // Rotate clockwise then counter-clockwise
      const clockwise = rotateMatrix(originalPiece, true);
      const backToOriginal = rotateMatrix(clockwise, false);

      expect(backToOriginal).toEqual(originalPiece);
    });

    test('should maintain piece integrity through multiple rotations', () => {
      const tPiece = [
        { x: 1, y: 0 }, // Bottom center
        { x: 0, y: 1 }, // Top left
        { x: 1, y: 1 }, // Top center
        { x: 2, y: 1 }  // Top right
      ];

      let current = tPiece;
      const rotationHistory = [current];

      // Perform 4 rotations and track each state
      for (let i = 0; i < 4; i++) {
        current = rotateMatrix(current, true);
        rotationHistory.push([...current]);
      }

      // Should return to original after 4 rotations
      expect(rotationHistory[4]).toEqual(tPiece);
      
      // Each rotation should produce a different configuration (except the last)
      for (let i = 1; i < 4; i++) {
        expect(rotationHistory[i]).not.toEqual(tPiece);
      }
    });
  });

  // Helper function to simulate collision detection
  function canPlacePieceAt(
    pieceX: number, 
    pieceY: number, 
    positions: Array<{ x: number; y: number }>,
    occupiedCells: Set<string> = new Set()
  ): boolean {
    for (const pos of positions) {
      const absoluteX = pieceX + pos.x;
      const absoluteY = pieceY + pos.y;

      // Check X bounds
      if (absoluteX < 0 || absoluteX >= GAME_CONSTANTS.GRID_WIDTH) {
        return false;
      }

      // Check Y bounds (can be above grid but not below)
      if (absoluteY < GAME_CONSTANTS.MIN_VALID_Y) {
        return false;
      }

      // Check collision with existing pieces (only within visible grid)
      if (absoluteY >= GAME_CONSTANTS.MIN_VALID_Y && 
          absoluteY <= GAME_CONSTANTS.MAX_VALID_Y) {
        const cellKey = `${absoluteX},${absoluteY}`;
        if (occupiedCells.has(cellKey)) {
          return false;
        }
      }
    }
    return true;
  }

  // Helper function to simulate wall kick offsets
  function getWallKickOffsets(): Array<{ x: number; y: number }> {
    return [
      { x: -1, y: 0 },  // Try one left
      { x: 1, y: 0 },   // Try one right
      { x: -2, y: 0 },  // Try two left
      { x: 2, y: 0 },   // Try two right
      { x: 0, y: 1 },   // Try one up
      { x: -1, y: 1 },  // Try left and up
      { x: 1, y: 1 },   // Try right and up
      { x: 0, y: -1 },  // Try one down (if above ground)
    ];
  }

  describe('Bottom-Left Coordinate System Integration', () => {

    test('should allow rotation when piece is above grid', () => {
      const iPiece = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 }
      ];

      // Place piece above grid (Y=22, so lowest die is at Y=22)
      const pieceX = 4;
      const pieceY = 22;

      // Should be able to place original piece
      expect(canPlacePieceAt(pieceX, pieceY, iPiece)).toBe(true);

      // Should be able to rotate (becomes horizontal)
      const rotated = rotateMatrix(iPiece, true);
      expect(canPlacePieceAt(pieceX, pieceY, rotated)).toBe(true);
    });

    test('should prevent rotation when it would cause collision with grid boundaries', () => {
      const iPiece = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 }
      ];

      // Place piece near right edge
      const pieceX = 9; // Right edge of grid
      const pieceY = 5;

      // Original vertical piece should fit
      expect(canPlacePieceAt(pieceX, pieceY, iPiece)).toBe(true);

      // Rotated horizontal piece should not fit (would extend beyond right edge)
      const rotated = rotateMatrix(iPiece, true);
      expect(canPlacePieceAt(pieceX, pieceY, rotated)).toBe(false);
    });

    test('should prevent rotation when it would cause collision with existing pieces', () => {
      const lPiece = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 0 }
      ];

      const pieceX = 5;
      const pieceY = 3;

      // Create occupied cells that would block rotation but not original placement
      // Place a cell that would interfere with the rotated shape
      const occupiedCells = new Set(['7,3']); // This will block the rotated L-piece
      
      // Original L-piece should fit (occupies positions 5,3 5,4 5,5 6,3)
      expect(canPlacePieceAt(pieceX, pieceY, lPiece, occupiedCells)).toBe(true);

      // Rotated L-piece should collide with occupied cell at 7,3
      const rotated = rotateMatrix(lPiece, true);
      expect(canPlacePieceAt(pieceX, pieceY, rotated, occupiedCells)).toBe(false);
    });

    test('should handle rotation near bottom boundary correctly', () => {
      const tPiece = [
        { x: 1, y: 0 }, // Bottom center
        { x: 0, y: 1 }, // Top left
        { x: 1, y: 1 }, // Top center
        { x: 2, y: 1 }  // Top right
      ];

      // Place piece at bottom of grid
      const pieceX = 4;
      const pieceY = 0; // Bottom row

      // Original T-piece should fit at bottom
      expect(canPlacePieceAt(pieceX, pieceY, tPiece)).toBe(true);

      // Rotate and check if it still fits
      const rotated = rotateMatrix(tPiece, true);
      
      // After rotation, the piece shape changes but should still be valid
      // The key is that no die goes below Y=0
      const allDiceAboveGround = rotated.every(pos => {
        const absoluteY = pieceY + pos.y;
        return absoluteY >= GAME_CONSTANTS.MIN_VALID_Y;
      });
      
      expect(allDiceAboveGround).toBe(true);
    });

    test('should maintain proper positioning after rotation near spawn area', () => {
      const sPiece = [
        { x: 1, y: 0 }, // Bottom right
        { x: 2, y: 0 }, // Bottom far right
        { x: 0, y: 1 }, // Top left
        { x: 1, y: 1 }  // Top center
      ];

      // Place piece at spawn height
      const pieceX = GAME_CONSTANTS.SPAWN_X_CENTER;
      const pieceY = GAME_CONSTANTS.SPAWN_Y;

      // Should be able to place at spawn position
      expect(canPlacePieceAt(pieceX, pieceY, sPiece)).toBe(true);

      // Should be able to rotate at spawn position
      const rotated = rotateMatrix(sPiece, true);
      expect(canPlacePieceAt(pieceX, pieceY, rotated)).toBe(true);

      // All dice should still be above the visible grid after rotation
      const allDiceAboveGrid = rotated.every(pos => {
        const absoluteY = pieceY + pos.y;
        return absoluteY > GAME_CONSTANTS.MAX_VALID_Y;
      });
      
      expect(allDiceAboveGrid).toBe(true);
    });
  });

  describe('Wall Kick Simulation', () => {

    test('should find valid wall kick position when rotation is blocked', () => {
      const iPiece = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 }
      ];

      // Place piece at right edge where rotation would fail
      const originalX = 7; // Not at the very edge, but close enough that rotation extends beyond
      const originalY = 5;
      
      // Original position should be valid
      expect(canPlacePieceAt(originalX, originalY, iPiece)).toBe(true);

      // Rotation at original position should fail (horizontal I-piece extends beyond grid)
      const rotated = rotateMatrix(iPiece, true);
      expect(canPlacePieceAt(originalX, originalY, rotated)).toBe(false);

      // Try wall kick offsets to find valid position
      const wallKickOffsets = getWallKickOffsets();
      let foundValidPosition = false;

      for (const offset of wallKickOffsets) {
        const testX = originalX + offset.x;
        const testY = originalY + offset.y;
        
        if (canPlacePieceAt(testX, testY, rotated)) {
          foundValidPosition = true;
          break;
        }
      }

      expect(foundValidPosition).toBe(true);
    });

    test('should respect bottom boundary during wall kicks', () => {
      const lPiece = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 0 }
      ];

      // Place piece near bottom where downward wall kick would be invalid
      const originalX = 5;
      const originalY = 1; // Close to bottom

      const rotated = rotateMatrix(lPiece, true);
      const wallKickOffsets = getWallKickOffsets();

      // Test each wall kick offset
      for (const offset of wallKickOffsets) {
        const testX = originalX + offset.x;
        const testY = originalY + offset.y;
        
        if (canPlacePieceAt(testX, testY, rotated)) {
          // If position is valid, ensure no dice go below ground
          const allDiceValid = rotated.every(pos => {
            const absoluteY = testY + pos.y;
            return absoluteY >= GAME_CONSTANTS.MIN_VALID_Y;
          });
          
          expect(allDiceValid).toBe(true);
        }
      }
    });
  });
});
