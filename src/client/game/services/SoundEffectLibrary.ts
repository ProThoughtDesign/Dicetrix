import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';

/**
 * Sound effect categories for organization and control
 */
export enum SoundCategory {
  UI = 'ui',
  GAMEPLAY = 'gameplay',
  EFFECTS = 'effects',
}

/**
 * Configuration interface for sound effect settings
 */
export interface SoundEffectConfig {
  volume: number;
  enabled: boolean;
  categories: {
    [SoundCategory.UI]: boolean;
    [SoundCategory.GAMEPLAY]: boolean;
    [SoundCategory.EFFECTS]: boolean;
  };
}

/**
 * Sound effect metadata for tracking and management
 */
export interface SoundEffectMetadata {
  key: string;
  category: SoundCategory;
  volume: number;
  variations?: string[] | undefined;
  cooldownMs?: number | undefined;
  lastPlayedTime?: number | undefined;
}

/**
 * Comprehensive sound effect library for the Dicetrix game
 * Provides categorized sound effects with volume control and enable/disable functionality
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export class SoundEffectLibrary {
  private scene: Phaser.Scene;
  private config: SoundEffectConfig;
  private soundMetadata: Map<string, SoundEffectMetadata> = new Map();
  private activeSounds: Map<string, Phaser.Sound.BaseSound> = new Map();

  constructor(scene: Phaser.Scene, initialConfig?: Partial<SoundEffectConfig>) {
    this.scene = scene;
    this.config = {
      volume: 0.8,
      enabled: true,
      categories: {
        [SoundCategory.UI]: true,
        [SoundCategory.GAMEPLAY]: true,
        [SoundCategory.EFFECTS]: true,
      },
      ...initialConfig,
    };

    this.initializeSoundMetadata();
    Logger.log(`SoundEffectLibrary: Initialized with config ${JSON.stringify(this.config)}`);
  }

  /**
   * Initialize metadata for all sound effects
   */
  private initializeSoundMetadata(): void {
    // Gameplay sounds metadata
    this.registerSound('piece-placement', SoundCategory.GAMEPLAY, 0.6);
    this.registerSound('piece-rotation', SoundCategory.GAMEPLAY, 0.5);
    this.registerSound('piece-drop', SoundCategory.GAMEPLAY, 0.7);
    this.registerSound('piece-hold', SoundCategory.GAMEPLAY, 0.5);

    // Line clear sounds with variations
    this.registerSound('line-clear-single', SoundCategory.GAMEPLAY, 0.8);
    this.registerSound('line-clear-double', SoundCategory.GAMEPLAY, 0.8);
    this.registerSound('line-clear-triple', SoundCategory.GAMEPLAY, 0.9);
    this.registerSound('line-clear-tetris', SoundCategory.GAMEPLAY, 1.0);

    // Game state sounds
    this.registerSound('level-up', SoundCategory.GAMEPLAY, 0.9);
    this.registerSound('game-over', SoundCategory.GAMEPLAY, 0.8);
    this.registerSound('pause', SoundCategory.GAMEPLAY, 0.6);
    this.registerSound('resume', SoundCategory.GAMEPLAY, 0.6);

    // UI interaction sounds
    this.registerSound('button-click', SoundCategory.UI, 0.5, undefined, 100);
    this.registerSound('menu-navigate', SoundCategory.UI, 0.4, undefined, 150);
    this.registerSound('settings-change', SoundCategory.UI, 0.6);
    this.registerSound('mode-select', SoundCategory.UI, 0.7);

    // Special effect sounds
    this.registerSound('combo-2x', SoundCategory.EFFECTS, 0.7);
    this.registerSound('combo-3x', SoundCategory.EFFECTS, 0.8);
    this.registerSound('combo-4x', SoundCategory.EFFECTS, 0.9);
    this.registerSound('perfect-clear', SoundCategory.EFFECTS, 1.0);
    this.registerSound('warning-alert', SoundCategory.EFFECTS, 0.8);

    Logger.log(`SoundEffectLibrary: Registered ${this.soundMetadata.size} sound effects`);
  }

  /**
   * Register a sound effect with metadata
   */
  private registerSound(
    key: string,
    category: SoundCategory,
    volume: number = 0.8,
    variations?: string[] | undefined,
    cooldownMs?: number | undefined
  ): void {
    this.soundMetadata.set(key, {
      key,
      category,
      volume,
      variations,
      cooldownMs,
      lastPlayedTime: 0,
    });
  }

  /**
   * Play a sound effect with category and cooldown checks
   */
  private playSound(key: string, volumeOverride?: number): void {
    // Check if sound effects are globally enabled
    if (!this.config.enabled) {
      return;
    }

    const metadata = this.soundMetadata.get(key);
    if (!metadata) {
      Logger.log(`SoundEffectLibrary: Unknown sound effect '${key}'`);
      return;
    }

    // Check if category is enabled
    if (!this.config.categories[metadata.category]) {
      return;
    }

    // Check cooldown
    if (metadata.cooldownMs && metadata.lastPlayedTime) {
      const timeSinceLastPlay = Date.now() - metadata.lastPlayedTime;
      if (timeSinceLastPlay < metadata.cooldownMs) {
        return; // Still in cooldown period
      }
    }

    // Check if sound exists in cache
    if (!this.scene.cache.audio.exists(key)) {
      // Gracefully handle missing audio files during development
      Logger.log(`SoundEffectLibrary: Audio file '${key}' not found in cache`);
      return;
    }

    try {
      // Calculate effective volume
      const baseVolume = volumeOverride !== undefined ? volumeOverride : metadata.volume;
      const effectiveVolume = baseVolume * this.config.volume;

      // Create and play sound
      const sound = this.scene.sound.add(key, {
        volume: effectiveVolume,
      });

      sound.play();

      // Update last played time
      metadata.lastPlayedTime = Date.now();

      // Clean up sound after completion
      sound.once('complete', () => {
        sound.destroy();
        this.activeSounds.delete(key);
      });

      // Track active sound
      this.activeSounds.set(key, sound);
    } catch (error) {
      Logger.log(`SoundEffectLibrary: Error playing sound '${key}' - ${error}`);
    }
  }

  // Configuration methods

  /**
   * Enable or disable all sound effects
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    }
    Logger.log(`SoundEffectLibrary: Sound effects ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current enabled state
   */
  getEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Set master volume for all sound effects (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    Logger.log(`SoundEffectLibrary: Volume set to ${this.config.volume}`);
  }

  /**
   * Get current master volume
   */
  getVolume(): number {
    return this.config.volume;
  }

  /**
   * Enable or disable a specific sound category
   */
  setCategoryEnabled(category: SoundCategory, enabled: boolean): void {
    this.config.categories[category] = enabled;

    if (!enabled) {
      // Stop all sounds in this category
      this.activeSounds.forEach((sound, key) => {
        const metadata = this.soundMetadata.get(key);
        if (metadata && metadata.category === category) {
          sound.stop();
          sound.destroy();
          this.activeSounds.delete(key);
        }
      });
    }

    Logger.log(`SoundEffectLibrary: Category '${category}' ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if a category is enabled
   */
  getCategoryEnabled(category: SoundCategory): boolean {
    return this.config.categories[category];
  }

  /**
   * Get current configuration
   */
  getConfig(): SoundEffectConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SoundEffectConfig>): void {
    this.config = { ...this.config, ...newConfig };
    Logger.log(`SoundEffectLibrary: Configuration updated ${JSON.stringify(this.config)}`);
  }

  /**
   * Stop all currently playing sounds
   */
  private stopAllSounds(): void {
    this.activeSounds.forEach((sound, key) => {
      try {
        sound.stop();
        sound.destroy();
      } catch (error) {
        Logger.log(`SoundEffectLibrary: Error stopping sound '${key}' - ${error}`);
      }
    });
    this.activeSounds.clear();
  }

  /**
   * Get debug information about the sound library
   */
  getDebugInfo(): string {
    const activeSoundCount = this.activeSounds.size;
    const registeredSoundCount = this.soundMetadata.size;
    const enabledCategories = Object.entries(this.config.categories)
      .filter(([_, enabled]) => enabled)
      .map(([category, _]) => category)
      .join(', ');

    return (
      `SoundEffectLibrary: ${registeredSoundCount} registered, ${activeSoundCount} active | ` +
      `Enabled: ${this.config.enabled} | Volume: ${this.config.volume} | ` +
      `Categories: ${enabledCategories}`
    );
  }

  // Gameplay sound effect methods

  /**
   * Play piece placement sound when a piece is placed on the board
   * Requirements: 2.1, 2.2
   */
  playPiecePlacement(): void {
    this.playSound('piece-placement');
  }

  /**
   * Play piece rotation sound when a piece is rotated
   * Requirements: 2.1, 2.2
   */
  playPieceRotation(): void {
    this.playSound('piece-rotation');
  }

  /**
   * Play piece drop sound when a piece drops quickly
   * Requirements: 2.1, 2.2
   */
  playPieceDrop(): void {
    this.playSound('piece-drop');
  }

  /**
   * Play piece hold sound when a piece is held/swapped
   * Requirements: 2.1, 2.2
   */
  playPieceHold(): void {
    this.playSound('piece-hold');
  }

  /**
   * Play line clear sound based on number of lines cleared
   * Different sounds for 1-4 lines (single, double, triple, tetris)
   * Requirements: 2.2, 2.4
   */
  playLineClear(linesCleared: number): void {
    let soundKey: string;

    switch (linesCleared) {
      case 1:
        soundKey = 'line-clear-single';
        break;
      case 2:
        soundKey = 'line-clear-double';
        break;
      case 3:
        soundKey = 'line-clear-triple';
        break;
      case 4:
        soundKey = 'line-clear-tetris';
        break;
      default:
        Logger.log(`SoundEffectLibrary: Invalid line clear count: ${linesCleared}`);
        return;
    }

    this.playSound(soundKey);
  }

  /**
   * Play level up sound when player advances to next level
   * Requirements: 2.2, 2.4
   */
  playLevelUp(): void {
    this.playSound('level-up');
  }

  /**
   * Play game over sound when the game ends
   * Requirements: 2.2, 2.4
   */
  playGameOver(): void {
    this.playSound('game-over');
  }

  /**
   * Play pause sound when the game is paused
   * Requirements: 2.2, 2.4
   */
  playPause(): void {
    this.playSound('pause');
  }

  /**
   * Play resume sound when the game is resumed
   * Requirements: 2.2, 2.4
   */
  playResume(): void {
    this.playSound('resume');
  }

  // UI interaction sound effect methods

  /**
   * Play button click sound for general button interactions
   * Includes cooldown system to prevent audio spam
   * Requirements: 2.5
   */
  playButtonClick(): void {
    this.playSound('button-click');
  }

  /**
   * Play menu navigation sound when moving between menu items
   * Includes cooldown system to prevent audio spam
   * Requirements: 2.5
   */
  playMenuNavigate(): void {
    this.playSound('menu-navigate');
  }

  /**
   * Play settings change sound when modifying game settings
   * Requirements: 2.5
   */
  playSettingsChange(): void {
    this.playSound('settings-change');
  }

  /**
   * Play mode selection sound when choosing a game mode
   * Requirements: 2.5
   */
  playModeSelect(): void {
    this.playSound('mode-select');
  }

  // Special effect sound methods

  /**
   * Play combo effect sound based on combo level
   * Different sounds for different combo levels with dynamic variations
   * Requirements: 2.3
   */
  playComboEffect(comboLevel: number): void {
    let soundKey: string;
    let volumeBoost = 1.0;

    if (comboLevel >= 4) {
      soundKey = 'combo-4x';
      volumeBoost = 1.2; // Boost volume for higher combos
    } else if (comboLevel === 3) {
      soundKey = 'combo-3x';
      volumeBoost = 1.1;
    } else if (comboLevel === 2) {
      soundKey = 'combo-2x';
      volumeBoost = 1.0;
    } else {
      // No sound for single combos
      return;
    }

    const metadata = this.soundMetadata.get(soundKey);
    if (metadata) {
      const adjustedVolume = metadata.volume * volumeBoost;
      this.playSound(soundKey, adjustedVolume);
    }
  }

  /**
   * Play perfect clear sound when the board is completely cleared
   * Requirements: 2.3
   */
  playPerfectClear(): void {
    this.playSound('perfect-clear');
  }

  /**
   * Play warning alert sound for danger situations
   * Requirements: 2.3
   */
  playWarningAlert(): void {
    this.playSound('warning-alert');
  }

  /**
   * Play dynamic sound effect variations based on game state
   * Adjusts volume and timing based on current game conditions
   * Requirements: 2.3
   */
  playDynamicEffect(effectType: 'tension' | 'excitement' | 'calm', intensity: number = 1.0): void {
    let soundKey: string;
    let volumeMultiplier = intensity;

    switch (effectType) {
      case 'tension':
        soundKey = 'warning-alert';
        volumeMultiplier *= 0.8; // Slightly quieter for tension
        break;
      case 'excitement':
        soundKey = 'combo-4x';
        volumeMultiplier *= 1.2; // Louder for excitement
        break;
      case 'calm':
        soundKey = 'piece-hold';
        volumeMultiplier *= 0.6; // Much quieter for calm
        break;
      default:
        Logger.log(`SoundEffectLibrary: Unknown dynamic effect type: ${effectType}`);
        return;
    }

    const metadata = this.soundMetadata.get(soundKey);
    if (metadata) {
      const adjustedVolume = metadata.volume * volumeMultiplier;
      this.playSound(soundKey, adjustedVolume);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAllSounds();
    this.soundMetadata.clear();
    Logger.log('SoundEffectLibrary: Destroyed');
  }
}
