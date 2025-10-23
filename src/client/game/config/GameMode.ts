export type GameConfig = {
  fallSpeed: number; // ms per cell drop or similar metric
  diceTypes: number[]; // available dice sides
  allowGravity?: boolean;
  scoreMultiplier?: number;
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
  readonly config: GameConfig = { fallSpeed: 1000, diceTypes: [4, 6], allowGravity: true, scoreMultiplier: 1 };
}

class MediumMode extends GameMode {
  readonly id = 'medium';
  readonly config: GameConfig = { fallSpeed: 800, diceTypes: [4, 6, 8, 10], allowGravity: true, scoreMultiplier: 1.1 };
}

class HardMode extends GameMode {
  readonly id = 'hard';
  readonly config: GameConfig = { fallSpeed: 600, diceTypes: [4, 6, 8, 10, 12], allowGravity: true, scoreMultiplier: 1.25 };
}

class ExpertMode extends GameMode {
  readonly id = 'expert';
  readonly config: GameConfig = { fallSpeed: 400, diceTypes: [4,6,8,10,12,20], allowGravity: true, scoreMultiplier: 1.5 };
}

class ZenMode extends GameMode {
  readonly id = 'zen';
  readonly config: GameConfig = { fallSpeed: 1200, diceTypes: [4,6,8,10], allowGravity: false, scoreMultiplier: 0.9 };
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
