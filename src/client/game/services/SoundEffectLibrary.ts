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

    // Dice match sounds with variations
    this.registerSound('dice-match-3', SoundCategory.GAMEPLAY, 0.8);
    this.registerSound('dice-match-4', SoundCategory.GAMEPLAY, 0.8);
    this.registerSound('dice-match-5', SoundCategory.GAMEPLAY, 0.9);
    this.registerSound('dice-match-7', SoundCategory.GAMEPLAY, 1.0);
    this.registerSound('dice-match-9', SoundCategory.GAMEPLAY, 1.0);

    // Legacy line-clear sounds for backward compatibility (deprecated)
    // These will be removed in a future version
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
      if (key.startsWith('line-clear-')) {
        Logger.log(`SoundEffectLibrary: Legacy audio file '${key}' not found in cache (expected during transition to dice-match sounds)`);
      } else if (key.startsWith('dice-match-')) {
        Logger.log(`SoundEffectLibrary: Dice-match audio file '${key}' not found in cache (may not be implemented yet)`);
      } else {
        Logger.log(`SoundEffectLibrary: Audio file '${key}' not found in cache`);
      }
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

  /**
   * Check if legacy line-clear sounds are still being used
   * Helps identify code that needs migration to dice-match sounds
   * Requirements: 5.4
   */
  hasLegacySounds(): boolean {
    const legacySounds = ['line-clear-single', 'line-clear-double', 'line-clear-triple', 'line-clear-tetris'];
    return legacySounds.some(soundKey => this.scene.cache.audio.exists(soundKey));
  }

  /**
   * Get migration status information for the transition
   * Requirements: 5.4
   */
  getMigrationStatus(): { hasLegacySounds: boolean; hasDiceMatchSounds: boolean; migrationComplete: boolean } {
    const legacySounds = ['line-clear-single', 'line-clear-double', 'line-clear-triple', 'line-clear-tetris'];
    const diceMatchSounds = ['dice-match-3', 'dice-match-4', 'dice-match-5', 'dice-match-7', 'dice-match-9'];
    
    const hasLegacySounds = legacySounds.some(soundKey => this.scene.cache.audio.exists(soundKey));
    const hasDiceMatchSounds = diceMatchSounds.some(soundKey => this.scene.cache.audio.exists(soundKey));
    const migrationComplete = hasDiceMatchSounds && !hasLegacySounds;

    return {
      hasLegacySounds,
      hasDiceMatchSounds,
      migrationComplete
    };
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
   * Play dice match sound based on number of dice matched
   * Maps dice counts to appropriate sound effects with fallback behavior
   * Requirements: 5.1, 5.4
   */
  playDiceMatch(diceCount: number): void {
    let soundKey: string;

    // Map dice counts to sound keys according to specification
    switch (diceCount) {
      case 3:
        soundKey = 'dice-match-3';
        break;
      case 4:
        soundKey = 'dice-match-4';
        break;
      case 5:
        soundKey = 'dice-match-5';
        break;
      case 7:
        soundKey = 'dice-match-7';
        break;
      case 9:
      default:
        // For 9+ dice or any other count, use dice-match-9
        if (diceCount >= 9) {
          soundKey = 'dice-match-9';
        } else {
          // Fallback behavior for unsupported dice counts (6, 8, etc.)
          Logger.log(`SoundEffectLibrary: Unsupported dice count ${diceCount}, falling back to closest match`);
          
          // Find closest supported dice count
          if (diceCount < 3) {
            soundKey = 'dice-match-3'; // Fallback to smallest
          } else if (diceCount === 6) {
            soundKey = 'dice-match-5'; // 6 is closer to 5 than 7
          } else if (diceCount === 8) {
            soundKey = 'dice-match-7'; // 8 is closer to 7 than 9
          } else {
            soundKey = 'dice-match-9'; // Default fallback for large counts
          }
        }
        break;
    }

    // Attempt to play the sound with error handling
    try {
      this.playSound(soundKey);
    } catch (error) {
      Logger.log(`SoundEffectLibrary: Failed to play dice match sound '${soundKey}' for ${diceCount} dice - ${error}`);
      // Graceful fallback - try to play a generic match sound or continue silently
      try {
        this.playSound('dice-match-3'); // Fallback to basic match sound
      } catch (fallbackError) {
        Logger.log(`SoundEffectLibrary: Fallback sound also failed, continuing silently`);
      }
    }
  }

  /**
   * Play line clear sound based on number of lines cleared
   * @deprecated Use playDiceMatch() instead for dice-matching gameplay
   * Different sounds for 1-4 lines (single, double, triple, tetris)
   * Requirements: 2.2, 2.4, 5.4
   */
  playLineClear(linesCleared: number): void {
    // Deprecation logging with usage tracking
    Logger.log(`SoundEffectLibrary: DEPRECATED - playLineClear(${linesCleared}) called. Please migrate to playDiceMatch() for dice-matching gameplay.`);
    
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
        Logger.log(`SoundEffectLibrary: Invalid line clear count: ${linesCleared}, no sound will be played`);
        return;
    }

    // Enhanced graceful handling of missing audio files
    try {
      // Check if the old line-clear sound exists
      if (!this.scene.cache.audio.exists(soundKey)) {
        Logger.log(`SoundEffectLibrary: Legacy sound '${soundKey}' not found, attempting fallback to dice-match equivalent`);
        
        // Fallback mapping from line-clear to dice-match sounds
        const fallbackMapping: { [key: string]: number } = {
          'line-clear-single': 3,
          'line-clear-double': 4,
          'line-clear-triple': 5,
          'line-clear-tetris': 7
        };
        
        const diceCount = fallbackMapping[soundKey];
        if (diceCount) {
          Logger.log(`SoundEffectLibrary: Using dice-match fallback for ${soundKey} -> playDiceMatch(${diceCount})`);
          this.playDiceMatch(diceCount);
          return;
        }
      }
      
      // Play the original sound if it exists
      this.playSound(soundKey);
    } catch (error) {
      Logger.log(`SoundEffectLibrary: Error playing legacy sound '${soundKey}' - ${error}. Attempting dice-match fallback.`);
      
      // Final fallback to dice-match equivalent
      const fallbackDiceCount = Math.min(linesCleared + 2, 9); // Simple mapping: 1->3, 2->4, 3->5, 4->6->5
      try {
        this.playDiceMatch(fallbackDiceCount);
      } catch (fallbackError) {
        Logger.log(`SoundEffectLibrary: All fallback attempts failed for line clear ${linesCleared}, continuing silently`);
      }
    }
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
