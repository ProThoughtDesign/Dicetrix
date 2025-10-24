/**
 * Game constants for the grid coordinate system refactor.
 * Defines spawn positions, grid boundaries, and coordinate system parameters.
 */
export const GAME_CONSTANTS = {
  // Grid dimensions
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  
  // Coordinate system boundaries
  GROUND_Y: 0,        // Bottom of the grid (Y = 0)
  TOP_Y: 19,          // Top of the visible grid (Y = 19)
  SPAWN_Y: 21,        // Pieces spawn above the grid (Y = 21 for bottom piece)
  
  // Spawn positions
  SPAWN_X_CENTER: 4,  // Center X position for spawning (grid width / 2 - 1)
  
  // Movement constants
  FALL_STEP: -1,      // Y change when falling (decrease Y to move down)
  RISE_STEP: 1,       // Y change when moving up (increase Y to move up)
  
  // Collision detection
  MIN_VALID_Y: 0,     // Minimum valid Y coordinate
  MAX_VALID_Y: 19,    // Maximum valid Y coordinate in visible grid
  
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
