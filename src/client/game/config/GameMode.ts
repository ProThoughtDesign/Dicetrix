export type GameConfig = {
  fallSpeed: number; // ms per cell drop or similar metric
  diceTypes: number[]; // available dice sides
  allowGravity?: boolean;
  scoreMultiplier?: number;
  
  // Dimensional Constraints
  maxPieceWidth: number;
  maxPieceHeight: number;
  maxDicePerPiece: number;
  
  // Dice Configuration
  allowBlackDice: boolean;
  uniformDiceRule: boolean; // Zen mode only
  
  // Booster System
  boosterChance: number; // 0.0 to 1.0
};

export abstract class GameMode {
  abstract readonly id: string;
  abstract readonly config: GameConfig;

  getConfig(): GameConfig {
    return this.config;
  }
}

class EasyMode extends GameMode {
  readonly id = 'easy';
  readonly config: GameConfig = { 
    fallSpeed: 1000, 
    diceTypes: [4, 6, 8], 
    allowGravity: true, 
    scoreMultiplier: 1.0,
    maxPieceWidth: 3,
    maxPieceHeight: 3,
    maxDicePerPiece: 5,
    allowBlackDice: false,
    uniformDiceRule: false,
    boosterChance: 0.5
  };
}

class MediumMode extends GameMode {
  readonly id = 'medium';
  readonly config: GameConfig = { 
    fallSpeed: 800, 
    diceTypes: [6, 8, 10, 12], 
    allowGravity: true, 
    scoreMultiplier: 1.1,
    maxPieceWidth: 4,
    maxPieceHeight: 4,
    maxDicePerPiece: 8,
    allowBlackDice: false,
    uniformDiceRule: false,
    boosterChance: 0.35
  };
}

class HardMode extends GameMode {
  readonly id = 'hard';
  readonly config: GameConfig = { 
    fallSpeed: 600, 
    diceTypes: [8, 10, 12, 20], 
    allowGravity: true, 
    scoreMultiplier: 1.25,
    maxPieceWidth: 5,
    maxPieceHeight: 5,
    maxDicePerPiece: 10,
    allowBlackDice: true,
    uniformDiceRule: false,
    boosterChance: 0.25
  };
}

class ExpertMode extends GameMode {
  readonly id = 'expert';
  readonly config: GameConfig = { 
    fallSpeed: 400, 
    diceTypes: [10, 12, 20], 
    allowGravity: true, 
    scoreMultiplier: 1.5,
    maxPieceWidth: 5,
    maxPieceHeight: 5,
    maxDicePerPiece: 16,
    allowBlackDice: true,
    uniformDiceRule: false,
    boosterChance: 0.15
  };
}

class ZenMode extends GameMode {
  readonly id = 'zen';
  readonly config: GameConfig = { 
    fallSpeed: 1200, 
    diceTypes: [4, 6, 8], 
    allowGravity: false, 
    scoreMultiplier: 0.9,
    maxPieceWidth: 3,
    maxPieceHeight: 3,
    maxDicePerPiece: 5,
    allowBlackDice: false,
    uniformDiceRule: true,
    boosterChance: 0.5
  };
}

const MODES: Record<string, GameMode> = {
  easy: new EasyMode(),
  medium: new MediumMode(),
  hard: new HardMode(),
  expert: new ExpertMode(),
  zen: new ZenMode(),
};

export function getMode(id: string | undefined): GameMode {
  const key = id || 'medium';
  const m = MODES[key];
  return m ? m : MODES['medium']!;
}

export function listModes(): string[] {
  return Object.keys(MODES);
}
