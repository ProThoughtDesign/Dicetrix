/**
 * Game constants for the grid coordinate system refactor.
 * Defines spawn positions, grid boundaries, and coordinate system parameters.
 */
export const GAME_CONSTANTS = {
  // Grid dimensions
  GRID_WIDTH: 8,
  GRID_HEIGHT: 16,
  
  // Coordinate system boundaries
  GROUND_Y: 0,        // Bottom of the grid (Y = 0)
  TOP_Y: 15,          // Top of the visible grid (Y = 15)
  SPAWN_Y: 16,        // Pieces spawn so bottom die is at Y = 16 (above visible grid)
  
  // Spawn positions
  SPAWN_X_CENTER: 3,  // Center X position for spawning (grid width / 2 - 1)
  
  // Movement constants
  FALL_STEP: -1,      // Y change when falling (decrease Y to move down)
  RISE_STEP: 1,       // Y change when moving up (increase Y to move up)
  
  // Collision detection
  MIN_VALID_Y: 0,     // Minimum valid Y coordinate
  MAX_VALID_Y: 15,    // Maximum valid Y coordinate in visible grid
  
  // Visual rendering
  SCREEN_ORIGIN_BOTTOM: true,  // Screen coordinates have bottom-left origin
} as const;

/**
 * Spawn position calculations based on piece configuration
 */
export const SPAWN_POSITIONS = {
  /**
   * Calculate spawn Y position for a piece based on its lowest die
   * @param minRelativeY Minimum relative Y coordinate of dice in the piece
   * @returns Y position where piece should spawn
   */
  calculateSpawnY: (minRelativeY: number): number => {
    return GAME_CONSTANTS.SPAWN_Y - minRelativeY;
  },
  
  /**
   * Get default spawn position for pieces
   * @returns Default spawn coordinates
   */
  getDefaultSpawn: (): { x: number; y: number } => ({
    x: GAME_CONSTANTS.SPAWN_X_CENTER,
    y: GAME_CONSTANTS.SPAWN_Y
  }),
} as const;
