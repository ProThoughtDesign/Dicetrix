import * as Phaser from 'phaser';
import { hybridAudioService } from './HybridAudioService';
import Logger from '../../utils/Logger';
import { audioSettingsAdapter } from './AudioSettingsAdapter.js';
import { AudioSettings } from '../../../shared/types/settings.js';

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

// AudioSettings interface is now imported from shared types

export class AudioHandler implements IAudioHandler {
  private static instance: AudioHandler;
  private scene: Phaser.Scene | null = null;
  private audioSettings: AudioSettings;
  private initialized = false;
  private settingsUnsubscribeFunctions: (() => void)[] = [];

  private constructor() {
    // Load audio settings from the centralized Settings Manager via AudioSettingsAdapter
    this.audioSettings = audioSettingsAdapter.getAudioSettings();
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
      
      // Initialize AudioSettingsAdapter if not already initialized
      if (!audioSettingsAdapter.isReady()) {
        audioSettingsAdapter.initialize();
      }
      
      // Set the audio handler reference to break circular dependency
      audioSettingsAdapter.setAudioHandlerRef(this);
      
      // Get current settings from centralized Settings Manager
      this.audioSettings = audioSettingsAdapter.getAudioSettings();
      
      // Sync settings with hybrid service
      hybridAudioService.setMusicEnabled(this.audioSettings.musicEnabled && !this.audioSettings.masterMute);
      hybridAudioService.setSoundEnabled(this.audioSettings.soundEnabled && !this.audioSettings.masterMute);
      hybridAudioService.setMusicVolume(this.audioSettings.musicVolume);
      hybridAudioService.setSoundVolume(this.audioSettings.soundVolume);
      
      // Set up Settings Manager event subscriptions
      this.setupSettingsSubscriptions();
      
      this.initialized = true;
      Logger.log(`AudioHandler: Initialized with scene ${scene.scene.key} using Hybrid Audio (Strudel + Phaser) and centralized settings`);
      
      // Notify AudioSettingsAdapter that AudioHandler is ready
      // This ensures proper synchronization between centralized settings and audio state
      this.notifyAudioSettingsAdapter();
      
    } catch (error) {
      Logger.log(`AudioHandler: Failed to initialize Hybrid Audio - ${error}`);
      // Don't throw error - allow graceful degradation
      this.initialized = false;
    }
  }

  /**
   * Set up subscriptions to Settings Manager changes through AudioSettingsAdapter
   * This ensures AudioHandler updates when settings change externally
   */
  private setupSettingsSubscriptions(): void {
    try {
      // Import settingsManager to subscribe to changes
      import('../../../shared/services/SettingsManager.js').then(({ settingsManager }) => {
        // Subscribe to audio setting changes
        const musicVolumeUnsub = settingsManager.subscribe('audio.musicVolume', (event) => {
          this.handleExternalMusicVolumeChange(event.newValue as number);
        });

        const soundVolumeUnsub = settingsManager.subscribe('audio.soundVolume', (event) => {
          this.handleExternalSoundVolumeChange(event.newValue as number);
        });

        const musicEnabledUnsub = settingsManager.subscribe('audio.musicEnabled', (event) => {
          this.handleExternalMusicEnabledChange(event.newValue as boolean);
        });

        const soundEnabledUnsub = settingsManager.subscribe('audio.soundEnabled', (event) => {
          this.handleExternalSoundEnabledChange(event.newValue as boolean);
        });

        const masterMuteUnsub = settingsManager.subscribe('audio.masterMute', (event) => {
          this.handleExternalMasterMuteChange(event.newValue as boolean);
        });

        // Store unsubscribe functions for cleanup
        this.settingsUnsubscribeFunctions.push(
          musicVolumeUnsub,
          soundVolumeUnsub,
          musicEnabledUnsub,
          soundEnabledUnsub,
          masterMuteUnsub
        );

        Logger.log('AudioHandler: Set up Settings Manager subscriptions');
      }).catch(error => {
        Logger.log(`AudioHandler: Failed to set up Settings Manager subscriptions - ${error}`);
      });
    } catch (error) {
      Logger.log(`AudioHandler: Error setting up Settings Manager subscriptions - ${error}`);
    }
  }

  /**
   * Handle external music volume changes from Settings Manager
   */
  private handleExternalMusicVolumeChange(volume: number): void {
    return Logger.withSilentLogging(() => {
      this.audioSettings.musicVolume = volume;
      hybridAudioService.setMusicVolume(volume);
      Logger.log(`AudioHandler: External music volume change to ${Math.round(volume * 100)}%`);
    });
  }

  /**
   * Handle external sound volume changes from Settings Manager
   */
  private handleExternalSoundVolumeChange(volume: number): void {
    return Logger.withSilentLogging(() => {
      this.audioSettings.soundVolume = volume;
      hybridAudioService.setSoundVolume(volume);
      Logger.log(`AudioHandler: External sound volume change to ${Math.round(volume * 100)}%`);
    });
  }

  /**
   * Handle external music enabled changes from Settings Manager
   */
  private handleExternalMusicEnabledChange(enabled: boolean): void {
    return Logger.withSilentLogging(() => {
      this.audioSettings.musicEnabled = enabled;
      // Apply master mute override
      const effectiveEnabled = enabled && !this.audioSettings.masterMute;
      hybridAudioService.setMusicEnabled(effectiveEnabled);
      Logger.log(`AudioHandler: External music ${enabled ? 'enabled' : 'disabled'}`);
    });
  }

  /**
   * Handle external sound enabled changes from Settings Manager
   */
  private handleExternalSoundEnabledChange(enabled: boolean): void {
    return Logger.withSilentLogging(() => {
      this.audioSettings.soundEnabled = enabled;
      // Apply master mute override
      const effectiveEnabled = enabled && !this.audioSettings.masterMute;
      hybridAudioService.setSoundEnabled(effectiveEnabled);
      Logger.log(`AudioHandler: External sound ${enabled ? 'enabled' : 'disabled'}`);
    });
  }

  /**
   * Handle external master mute changes from Settings Manager
   */
  private handleExternalMasterMuteChange(masterMute: boolean): void {
    return Logger.withSilentLogging(() => {
      this.audioSettings.masterMute = masterMute;
      
      if (masterMute) {
        // Mute all audio
        hybridAudioService.setMusicEnabled(false);
        hybridAudioService.setSoundEnabled(false);
      } else {
        // Restore audio based on individual settings
        hybridAudioService.setMusicEnabled(this.audioSettings.musicEnabled);
        hybridAudioService.setSoundEnabled(this.audioSettings.soundEnabled);
      }
      
      Logger.log(`AudioHandler: External master mute ${masterMute ? 'enabled' : 'disabled'}`);
    });
  }

  /**
   * Notify AudioSettingsAdapter that AudioHandler is ready for synchronization
   * This ensures the adapter can properly sync settings when AudioHandler becomes available
   */
  private notifyAudioSettingsAdapter(): void {
    try {
      if (audioSettingsAdapter.isReady()) {
        // Sync current settings from centralized Settings Manager to AudioHandler
        audioSettingsAdapter.syncFromSettings();
        Logger.log('AudioHandler: Synchronized with AudioSettingsAdapter');
      }
    } catch (error) {
      Logger.log(`AudioHandler: Error notifying AudioSettingsAdapter - ${error}`);
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

      // Update settings through AudioSettingsAdapter (centralized settings)
      audioSettingsAdapter.updateAudioSettings({ musicEnabled: enabled });

      // Update hybrid service
      hybridAudioService.setMusicEnabled(enabled);

      // Only log state changes
      Logger.log(`AudioHandler: Music ${enabled ? 'enabled' : 'disabled'}`);
    });
  }

  setSoundEnabled(enabled: boolean): void {
    return Logger.withSilentLogging(() => {
      this.audioSettings.soundEnabled = enabled;

      // Update settings through AudioSettingsAdapter (centralized settings)
      audioSettingsAdapter.updateAudioSettings({ soundEnabled: enabled });

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

      // Update settings through AudioSettingsAdapter (centralized settings)
      audioSettingsAdapter.updateAudioSettings({ musicVolume: this.audioSettings.musicVolume });

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

      // Update settings through AudioSettingsAdapter (centralized settings)
      audioSettingsAdapter.updateAudioSettings({ soundVolume: this.audioSettings.soundVolume });

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
    // Clean up Settings Manager subscriptions
    this.settingsUnsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.settingsUnsubscribeFunctions = [];
    
    hybridAudioService.destroy();
    this.scene = null;
    this.initialized = false;
    Logger.log('AudioHandler: Destroyed and cleaned up Settings Manager subscriptions');
  }
}

// Export singleton instance for easy access
export const audioHandler = AudioHandler.getInstance();
