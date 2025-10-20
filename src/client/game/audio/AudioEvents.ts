import { AudioManager } from './AudioManager.js';
import { DieColor, GameMode } from '../../../shared/types/game.js';

export class AudioEvents {
  private audioManager: AudioManager;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  /**
   * Play piece movement sound
   */
  onPieceMove(): void {
    this.audioManager.playSFX('piece-move', {
      volume: 0.3
    });
  }

  /**
   * Play piece rotation sound
   */
  onPieceRotate(): void {
    this.audioManager.playSFX('piece-rotate', {
      volume: 0.4
    });
  }

  /**
   * Play piece locking sound
   */
  onPieceLock(): void {
    this.audioManager.playSFX('piece-lock', {
      volume: 0.6
    });
  }

  /**
   * Play match clearing sound based on match size
   */
  onMatchClear(matchSize: number): void {
    if (matchSize >= 9) {
      // Massive clear
      this.audioManager.playSFX('match-clear-massive', {
        volume: 1.0
      });
    } else if (matchSize >= 7) {
      // Large clear
      this.audioManager.playSFX('match-clear-large', {
        volume: 0.9
      });
    } else if (matchSize >= 5) {
      // Medium clear
      this.audioManager.playSFX('match-clear-medium', {
        volume: 0.8
      });
    } else {
      // Standard clear
      this.audioManager.playSFX('match-clear', {
        volume: 0.7
      });
    }
  }

  /**
   * Play cascade sound with increasing pitch for chain reactions
   */
  onCascade(chainLevel: number): void {
    const volume = Math.min(0.8 + (chainLevel * 0.1), 1.0);
    
    if (chainLevel >= 5) {
      this.audioManager.playSFX('cascade-epic', { volume });
    } else if (chainLevel >= 3) {
      this.audioManager.playSFX('cascade-big', { volume });
    } else {
      this.audioManager.playSFX('cascade', { volume });
    }
  }

  /**
   * Play Ultimate Combo sound effect
   */
  onUltimateCombo(): void {
    this.audioManager.playSFX('ultimate-combo', {
      volume: 1.0
    });
  }

  /**
   * Play booster activation sound
   */
  onBoosterActivate(color: DieColor): void {
    // Play general booster sound
    this.audioManager.playSFX('booster-activate', {
      volume: 0.7
    });

    // Play color-specific sound if available
    this.audioManager.playSFX(`booster-${color}`, {
      volume: 0.5,
      delay: 100
    });
  }

  /**
   * Play booster deactivation sound
   */
  onBoosterDeactivate(): void {
    this.audioManager.playSFX('booster-deactivate', {
      volume: 0.4
    });
  }

  /**
   * Play Black Die debuff sound
   */
  onBlackDieActivate(): void {
    this.audioManager.playSFX('black-die-debuff', {
      volume: 0.8
    });
  }

  /**
   * Play Wild Die spawn sound
   */
  onWildDieSpawn(): void {
    this.audioManager.playSFX('wild-die-spawn', {
      volume: 0.7
    });
  }

  /**
   * Play level up sound
   */
  onLevelUp(): void {
    this.audioManager.playSFX('level-up', {
      volume: 0.9
    });
  }

  /**
   * Play game over sound
   */
  onGameOver(): void {
    this.audioManager.playSFX('game-over', {
      volume: 0.8
    });
  }

  /**
   * Play high score achievement sound
   */
  onHighScore(): void {
    this.audioManager.playSFX('high-score', {
      volume: 1.0
    });
  }

  /**
   * Play menu navigation sounds
   */
  onMenuSelect(): void {
    this.audioManager.playSFX('menu-select', {
      volume: 0.5
    });
  }

  onMenuHover(): void {
    this.audioManager.playSFX('menu-hover', {
      volume: 0.3
    });
  }

  onMenuBack(): void {
    this.audioManager.playSFX('menu-back', {
      volume: 0.4
    });
  }

  /**
   * Play mode-specific music
   */
  onModeStart(mode: GameMode): void {
    this.audioManager.playMusic(mode);
  }

  /**
   * Play menu music
   */
  onMenuEnter(): void {
    this.audioManager.playMusic('menu');
  }

  /**
   * Handle pause/resume
   */
  onGamePause(): void {
    this.audioManager.pauseMusic();
    this.audioManager.playSFX('game-pause', {
      volume: 0.6
    });
  }

  onGameResume(): void {
    this.audioManager.resumeMusic();
    this.audioManager.playSFX('game-resume', {
      volume: 0.6
    });
  }

  /**
   * Play gravity/falling sounds
   */
  onGravityApply(): void {
    this.audioManager.playSFX('gravity-fall', {
      volume: 0.4
    });
  }

  /**
   * Play warning sound for near game over
   */
  onWarning(): void {
    this.audioManager.playSFX('warning', {
      volume: 0.7
    });
  }
}
