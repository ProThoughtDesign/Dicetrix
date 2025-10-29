// Basic game configuration constants

export const GAME_CONSTANTS = {
  GRID_WIDTH: 8,
  GRID_HEIGHT: 16,
  DEFAULT_CELL_SIZE: 32,
};

export const PIECE_SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  L: [[1, 0, 0], [1, 1, 1]],
  J: [[0, 0, 1], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  PLUS: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
};
