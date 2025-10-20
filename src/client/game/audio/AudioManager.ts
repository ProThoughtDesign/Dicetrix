import { Scene } from 'phaser';
import { GameMode } from '../../../shared/types/game.js';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export interface AudioEvent {
  key: string;
  volume?: number;
  loop?: boolean;
  delay?: number;
}

export class AudioManager {
  private scene: Scene;
  private settings: AudioSettings;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private soundEffects: Map<string, Phaser.Sound.BaseSound> = new Map();
  private musicTracks: Map<GameMode | 'menu', string> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
    this.settings = this.loadSettings();
    this.initializeMusicTracks();
  }

  /**
   * Initialize the audio system
   */
  initialize(): void {
    // Set up global audio settings
    this.scene.sound.volume = this.settings.masterVolume;
    
    // Initialize music tracks mapping
    this.initializeMusicTracks();
    
    // Preload commonly used sound effects
    this.preloadSoundEffects();
  }

  /**
   * Play a sound effect
   */
  playSFX(key: string, options: Partial<AudioEvent> = {}): Phaser.Sound.BaseSound | null {
    if (!this.settings.sfxEnabled) return null;

    try {
      const sound = this.scene.sound.add(key, {
        volume: (options.volume || 1) * this.settings.sfxVolume * this.settings.masterVolume,
        loop: options.loop || false
      });

      if (options.delay) {
        this.scene.time.delayedCall(options.delay, () => {
          sound.play();
        });
      } else {
        sound.play();
      }

      // Store reference for potential stopping
      this.soundEffects.set(key, sound);

      // Clean up when sound completes
      sound.once('complete', () => {
        this.soundEffects.delete(key);
        sound.destroy();
      });

      return sound;
    } catch (error) {
      console.warn(`Failed to play sound effect: ${key}`, error);
      return null;
    }
  }

  /**
   * Play background music for a specific mode
   */
  playMusic(mode: GameMode | 'menu'): void {
    if (!this.settings.musicEnabled) return;

    const musicKey = this.musicTracks.get(mode);
    if (!musicKey) {
      console.warn(`No music track found for mode: ${mode}`);
      return;
    }

    // Stop current music if playing
    this.stopMusic();

    try {
      this.currentMusic = this.scene.sound.add(musicKey, {
        volume: this.settings.musicVolume * this.settings.masterVolume,
        loop: true
      });

      this.currentMusic.play();
    } catch (error) {
      console.warn(`Failed to play music: ${musicKey}`, error);
    }
  }

  /**
   * Stop current background music
   */
  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
    }
  }

  /**
   * Pause/resume current music
   */
  pauseMusic(): void {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.pause();
    }
  }

  resumeMusic(): void {
    if (this.currentMusic && this.currentMusic.isPaused) {
      this.currentMusic.resume();
    }
  }

  /**
   * Stop all sound effects
   */
  stopAllSFX(): void {
    this.soundEffects.forEach(sound => {
      sound.stop();
      sound.destroy();
    });
    this.soundEffects.clear();
  }

  /**
   * Update audio settings
   */
  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.applySettings();
  }

  /**
   * Get current audio settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Apply current settings to active audio
   */
  private applySettings(): void {
    // Update global volume
    this.scene.sound.volume = this.settings.masterVolume;

    // Update current music volume
    if (this.currentMusic) {
      if (this.settings.musicEnabled) {
        (this.currentMusic as any).setVolume(this.settings.musicVolume * this.settings.masterVolume);
      } else {
        this.stopMusic();
      }
    }

    // Update sound effects volume
    this.soundEffects.forEach(sound => {
      if (this.settings.sfxEnabled) {
        (sound as any).setVolume(this.settings.sfxVolume * this.settings.masterVolume);
      } else {
        sound.stop();
      }
    });
  }

  /**
   * Initialize music track mappings
   */
  private initializeMusicTracks(): void {
    this.musicTracks.set('menu', 'menu-music');
    this.musicTracks.set('easy', 'game-music-easy');
    this.musicTracks.set('medium', 'game-music-medium');
    this.musicTracks.set('hard', 'game-music-hard');
    this.musicTracks.set('expert', 'game-music-expert');
    this.musicTracks.set('zen', 'game-music-zen');
  }

  /**
   * Preload commonly used sound effects
   */
  private preloadSoundEffects(): void {
    // This method can be used to create sound instances that are frequently used
    // to avoid the overhead of creating them each time
  }

  /**
   * Load audio settings from localStorage
   */
  private loadSettings(): AudioSettings {
    try {
      const saved = localStorage.getItem('dicetrix-audio-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          masterVolume: parsed.masterVolume ?? 0.7,
          musicVolume: parsed.musicVolume ?? 0.8,
          sfxVolume: parsed.sfxVolume ?? 0.9,
          musicEnabled: parsed.musicEnabled ?? true,
          sfxEnabled: parsed.sfxEnabled ?? true
        };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }

    // Default settings
    return {
      masterVolume: 0.7,
      musicVolume: 0.8,
      sfxVolume: 0.9,
      musicEnabled: true,
      sfxEnabled: true
    };
  }

  /**
   * Save audio settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('dicetrix-audio-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  /**
   * Cleanup when scene is destroyed
   */
  destroy(): void {
    this.stopMusic();
    this.stopAllSFX();
    this.soundEffects.clear();
  }
}
