import * as Phaser from 'phaser';
import { settings } from './Settings';
import { hybridAudioService } from './HybridAudioService';
import Logger from '../../utils/Logger';

export interface IAudioHandler {
  // Initialization
  initialize(scene: Phaser.Scene): Promise<void>;
  isInitialized(): boolean;

  // Music control
  playMusic(key: string, loop?: boolean): void;
  stopMusic(): void;
  pauseMusic(): void;
  resumeMusic(): void;

  // Sound effects
  playSound(key: string, volume?: number): void;

  // Settings management
  setMusicEnabled(enabled: boolean): void;
  setSoundEnabled(enabled: boolean): void;
  getMusicEnabled(): boolean;
  getSoundEnabled(): boolean;

  // Volume control
  setMusicVolume(volume: number): void;
  setSoundVolume(volume: number): void;

  // Cleanup
  destroy(): void;
}

export interface AudioSettings {
  musicEnabled: boolean;
  soundEnabled: boolean;
  musicVolume: number;
  soundVolume: number;
}

export class AudioHandler implements IAudioHandler {
  private static instance: AudioHandler;
  private scene: Phaser.Scene | null = null;
  private audioSettings: AudioSettings;
  private initialized = false;

  private constructor() {
    // Load audio settings from the existing Settings service
    this.audioSettings = {
      musicEnabled: !settings.get('audioMuted'),
      soundEnabled: !settings.get('audioMuted'),
      musicVolume: settings.get('audioVolume'),
      soundVolume: settings.get('audioVolume'),
    };
  }

  static getInstance(): AudioHandler {
    if (!AudioHandler.instance) {
      AudioHandler.instance = new AudioHandler();
    }
    return AudioHandler.instance;
  }

  async initialize(scene: Phaser.Scene): Promise<void> {
    if (this.initialized) {
      Logger.log('AudioHandler: Already initialized');
      return;
    }

    this.scene = scene;
    
    try {
      // Initialize hybrid audio service (Strudel + Phaser)
      await hybridAudioService.initialize(scene);
      
      // Sync settings with hybrid service
      hybridAudioService.setMusicEnabled(this.audioSettings.musicEnabled);
      hybridAudioService.setSoundEnabled(this.audioSettings.soundEnabled);
      hybridAudioService.setMusicVolume(this.audioSettings.musicVolume);
      hybridAudioService.setSoundVolume(this.audioSettings.soundVolume);
      
      this.initialized = true;
      Logger.log(`AudioHandler: Initialized with scene ${scene.scene.key} using Hybrid Audio (Strudel + Phaser)`);
    } catch (error) {
      Logger.log(`AudioHandler: Failed to initialize Hybrid Audio - ${error}`);
      // Don't throw error - allow graceful degradation
      this.initialized = false;
    }
  }

  isInitialized(): boolean {
    return Logger.withSilentLogging(() => {
      return this.initialized && hybridAudioService.isInitialized();
    });
  }

  // Music control methods
  playMusic(key: string, loop: boolean = true): void {
    Logger.log(`AudioHandler: playMusic called with key='${key}', initialized=${this.initialized}`);
    
    if (!this.initialized) {
      Logger.log('AudioHandler: Not initialized, cannot play music');
      return;
    }

    Logger.log(`AudioHandler: Calling hybridAudioService.playMusic('${key}', ${loop})`);
    hybridAudioService.playMusic(key, loop);
    Logger.log(`AudioHandler: Successfully called hybridAudioService.playMusic('${key}')`);
  }

  stopMusic(): void {
    return Logger.withSilentLogging(() => {
      hybridAudioService.stopMusic();
    });
  }

  pauseMusic(): void {
    return Logger.withSilentLogging(() => {
      hybridAudioService.pauseMusic();
    });
  }

  resumeMusic(): void {
    return Logger.withSilentLogging(() => {
      hybridAudioService.resumeMusic();
    });
  }

  // Sound effects methods
  playSound(key: string, volume?: number): void {
    return Logger.withSilentLogging(() => {
      if (!this.initialized) {
        Logger.log('AudioHandler: Not initialized, cannot play sound');
        return;
      }

      hybridAudioService.playSound(key, volume);
    });
  }

  // Settings management methods
  setMusicEnabled(enabled: boolean): void {
    return Logger.withSilentLogging(() => {
      this.audioSettings.musicEnabled = enabled;

      // Update the existing Settings service
      settings.set('audioMuted', !enabled);

      // Update hybrid service
      hybridAudioService.setMusicEnabled(enabled);

      // Only log state changes
      Logger.log(`AudioHandler: Music ${enabled ? 'enabled' : 'disabled'}`);
    });
  }

  setSoundEnabled(enabled: boolean): void {
    return Logger.withSilentLogging(() => {
      this.audioSettings.soundEnabled = enabled;

      // Update the existing Settings service
      settings.set('audioMuted', !enabled);

      // Update hybrid service
      hybridAudioService.setSoundEnabled(enabled);

      // Only log state changes
      Logger.log(`AudioHandler: Sound effects ${enabled ? 'enabled' : 'disabled'}`);
    });
  }

  getMusicEnabled(): boolean {
    return Logger.withSilentLogging(() => {
      return this.audioSettings.musicEnabled;
    });
  }

  getSoundEnabled(): boolean {
    return Logger.withSilentLogging(() => {
      return this.audioSettings.soundEnabled;
    });
  }

  // Volume control methods
  setMusicVolume(volume: number): void {
    return Logger.withSilentLogging(() => {
      // Clamp volume between 0 and 1
      this.audioSettings.musicVolume = Math.max(0, Math.min(1, volume));

      // Update the existing Settings service
      settings.set('audioVolume', this.audioSettings.musicVolume);

      // Update hybrid service
      hybridAudioService.setMusicVolume(this.audioSettings.musicVolume);

      // Only log significant changes
      if (volume === 0 || volume === 1) {
        Logger.log(`AudioHandler: Music volume set to ${this.audioSettings.musicVolume}`);
      }
    });
  }

  setSoundVolume(volume: number): void {
    return Logger.withSilentLogging(() => {
      // Clamp volume between 0 and 1
      this.audioSettings.soundVolume = Math.max(0, Math.min(1, volume));

      // Update the existing Settings service
      settings.set('audioVolume', this.audioSettings.soundVolume);

      // Update hybrid service
      hybridAudioService.setSoundVolume(this.audioSettings.soundVolume);

      // Only log significant changes
      if (volume === 0 || volume === 1) {
        Logger.log(`AudioHandler: Sound volume set to ${this.audioSettings.soundVolume}`);
      }
    });
  }

  // Cleanup method
  destroy(): void {
    hybridAudioService.destroy();
    this.scene = null;
    this.initialized = false;
    Logger.log('AudioHandler: Destroyed');
  }
}

// Export singleton instance for easy access
export const audioHandler = AudioHandler.getInstance();
