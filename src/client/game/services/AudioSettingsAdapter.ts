import { settingsManager } from '../../../shared/services/SettingsManager.js';
import { AudioSettings, SettingsChangeEvent } from '../../../shared/types/settings.js';
import Logger from '../../utils/Logger.js';

/**
 * Audio Settings Adapter
 * Bridges the centralized Settings Manager with the AudioHandler
 * Provides bidirectional synchronization between settings and audio state
 */
// Interface for audio handler to avoid circular dependency
interface IAudioHandlerRef {
  isInitialized(): boolean;
  setMusicVolume(volume: number): void;
  setSoundVolume(volume: number): void;
  setMusicEnabled(enabled: boolean): void;
  setSoundEnabled(enabled: boolean): void;
}

export class AudioSettingsAdapter {
  private static instance: AudioSettingsAdapter;
  private unsubscribeFunctions: (() => void)[] = [];
  private isInitialized = false;
  private audioHandlerRef: IAudioHandlerRef | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AudioSettingsAdapter {
    if (!AudioSettingsAdapter.instance) {
      AudioSettingsAdapter.instance = new AudioSettingsAdapter();
    }
    return AudioSettingsAdapter.instance;
  }

  /**
   * Initialize the adapter and set up bidirectional synchronization
   */
  public initialize(audioHandlerRef?: IAudioHandlerRef): void {
    if (this.isInitialized) {
      Logger.log('AudioSettingsAdapter: Already initialized');
      return;
    }

    // Store reference to audio handler if provided
    if (audioHandlerRef) {
      this.audioHandlerRef = audioHandlerRef;
    }

    // Sync current settings to AudioHandler
    this.syncFromSettings();

    // Subscribe to settings changes
    this.setupSettingsSubscriptions();

    this.isInitialized = true;
    Logger.log('AudioSettingsAdapter: Initialized with bidirectional synchronization');
  }

  /**
   * Set the audio handler reference (used to break circular dependency)
   */
  public setAudioHandlerRef(audioHandlerRef: IAudioHandlerRef): void {
    this.audioHandlerRef = audioHandlerRef;
    
    // Sync settings now that we have the audio handler reference
    if (this.isInitialized) {
      this.syncFromSettings();
    }
  }

  /**
   * Sync settings from Settings Manager to AudioHandler
   */
  public syncFromSettings(): void {
    const audioSettings = this.getAudioSettings();
    
    // Check if AudioHandler is initialized before syncing
    if (!this.audioHandlerRef || !this.audioHandlerRef.isInitialized()) {
      Logger.log('AudioSettingsAdapter: AudioHandler not initialized yet, settings will sync when AudioHandler becomes available');
      return;
    }
    
    // Apply settings to AudioHandler
    this.audioHandlerRef.setMusicVolume(audioSettings.musicVolume);
    this.audioHandlerRef.setSoundVolume(audioSettings.soundVolume);
    this.audioHandlerRef.setMusicEnabled(audioSettings.musicEnabled && !audioSettings.masterMute);
    this.audioHandlerRef.setSoundEnabled(audioSettings.soundEnabled && !audioSettings.masterMute);

    Logger.log(`AudioSettingsAdapter: Synced settings to AudioHandler - Music: ${audioSettings.musicEnabled}, Sound: ${audioSettings.soundEnabled}, MusicVol: ${audioSettings.musicVolume}, SoundVol: ${audioSettings.soundVolume}`);
  }

  /**
   * Sync audio state from AudioHandler to Settings Manager
   */
  public syncToSettings(audioState: Partial<AudioSettings>): void {
    // Update Settings Manager with audio state changes
    if (audioState.musicVolume !== undefined) {
      settingsManager.set('audio.musicVolume', audioState.musicVolume);
    }
    
    if (audioState.soundVolume !== undefined) {
      settingsManager.set('audio.soundVolume', audioState.soundVolume);
    }
    
    if (audioState.musicEnabled !== undefined) {
      settingsManager.set('audio.musicEnabled', audioState.musicEnabled);
    }
    
    if (audioState.soundEnabled !== undefined) {
      settingsManager.set('audio.soundEnabled', audioState.soundEnabled);
    }
    
    if (audioState.masterMute !== undefined) {
      settingsManager.set('audio.masterMute', audioState.masterMute);
    }

    Logger.log(`AudioSettingsAdapter: Synced audio state to Settings Manager - ${JSON.stringify(audioState)}`);
  }

  /**
   * Get current audio settings from Settings Manager
   */
  public getAudioSettings(): AudioSettings {
    return {
      musicVolume: settingsManager.get<number>('audio.musicVolume'),
      soundVolume: settingsManager.get<number>('audio.soundVolume'),
      musicEnabled: settingsManager.get<boolean>('audio.musicEnabled'),
      soundEnabled: settingsManager.get<boolean>('audio.soundEnabled'),
      masterMute: settingsManager.get<boolean>('audio.masterMute'),
    };
  }

  /**
   * Update audio settings through Settings Manager
   */
  public updateAudioSettings(settings: Partial<AudioSettings>): void {
    if (settings.musicVolume !== undefined) {
      settingsManager.set('audio.musicVolume', settings.musicVolume);
    }
    
    if (settings.soundVolume !== undefined) {
      settingsManager.set('audio.soundVolume', settings.soundVolume);
    }
    
    if (settings.musicEnabled !== undefined) {
      settingsManager.set('audio.musicEnabled', settings.musicEnabled);
    }
    
    if (settings.soundEnabled !== undefined) {
      settingsManager.set('audio.soundEnabled', settings.soundEnabled);
    }
    
    if (settings.masterMute !== undefined) {
      settingsManager.set('audio.masterMute', settings.masterMute);
    }

    Logger.log(`AudioSettingsAdapter: Updated audio settings - ${JSON.stringify(settings)}`);
  }

  /**
   * Set up subscriptions to Settings Manager changes
   */
  private setupSettingsSubscriptions(): void {
    // Subscribe to individual audio setting changes
    const musicVolumeUnsub = settingsManager.subscribe('audio.musicVolume', (event) => {
      this.handleMusicVolumeChange(event);
    });

    const soundVolumeUnsub = settingsManager.subscribe('audio.soundVolume', (event) => {
      this.handleSoundVolumeChange(event);
    });

    const musicEnabledUnsub = settingsManager.subscribe('audio.musicEnabled', (event) => {
      this.handleMusicEnabledChange(event);
    });

    const soundEnabledUnsub = settingsManager.subscribe('audio.soundEnabled', (event) => {
      this.handleSoundEnabledChange(event);
    });

    const masterMuteUnsub = settingsManager.subscribe('audio.masterMute', (event) => {
      this.handleMasterMuteChange(event);
    });

    // Store unsubscribe functions for cleanup
    this.unsubscribeFunctions.push(
      musicVolumeUnsub,
      soundVolumeUnsub,
      musicEnabledUnsub,
      soundEnabledUnsub,
      masterMuteUnsub
    );

    Logger.log('AudioSettingsAdapter: Set up settings subscriptions');
  }

  /**
   * Handle music volume changes
   */
  private handleMusicVolumeChange(event: SettingsChangeEvent): void {
    const volume = event.newValue as number;
    
    if (this.audioHandlerRef && this.audioHandlerRef.isInitialized()) {
      this.audioHandlerRef.setMusicVolume(volume);
      Logger.log(`AudioSettingsAdapter: Music volume changed to ${Math.round(volume * 100)}%`);
    } else {
      Logger.log(`AudioSettingsAdapter: Music volume setting changed to ${Math.round(volume * 100)}%, will apply when AudioHandler initializes`);
    }
  }

  /**
   * Handle sound volume changes
   */
  private handleSoundVolumeChange(event: SettingsChangeEvent): void {
    const volume = event.newValue as number;
    
    if (this.audioHandlerRef && this.audioHandlerRef.isInitialized()) {
      this.audioHandlerRef.setSoundVolume(volume);
      Logger.log(`AudioSettingsAdapter: Sound volume changed to ${Math.round(volume * 100)}%`);
    } else {
      Logger.log(`AudioSettingsAdapter: Sound volume setting changed to ${Math.round(volume * 100)}%, will apply when AudioHandler initializes`);
    }
  }

  /**
   * Handle music enabled/disabled changes
   */
  private handleMusicEnabledChange(event: SettingsChangeEvent): void {
    const enabled = event.newValue as boolean;
    const masterMute = settingsManager.get<boolean>('audio.masterMute');
    
    if (this.audioHandlerRef && this.audioHandlerRef.isInitialized()) {
      // Apply master mute override
      this.audioHandlerRef.setMusicEnabled(enabled && !masterMute);
      Logger.log(`AudioSettingsAdapter: Music ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      Logger.log(`AudioSettingsAdapter: Music setting changed to ${enabled ? 'enabled' : 'disabled'}, will apply when AudioHandler initializes`);
    }
  }

  /**
   * Handle sound enabled/disabled changes
   */
  private handleSoundEnabledChange(event: SettingsChangeEvent): void {
    const enabled = event.newValue as boolean;
    const masterMute = settingsManager.get<boolean>('audio.masterMute');
    
    if (this.audioHandlerRef && this.audioHandlerRef.isInitialized()) {
      // Apply master mute override
      this.audioHandlerRef.setSoundEnabled(enabled && !masterMute);
      Logger.log(`AudioSettingsAdapter: Sound effects ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      Logger.log(`AudioSettingsAdapter: Sound setting changed to ${enabled ? 'enabled' : 'disabled'}, will apply when AudioHandler initializes`);
    }
  }

  /**
   * Handle master mute changes
   */
  private handleMasterMuteChange(event: SettingsChangeEvent): void {
    const masterMute = event.newValue as boolean;
    
    if (this.audioHandlerRef && this.audioHandlerRef.isInitialized()) {
      if (masterMute) {
        // Mute all audio
        this.audioHandlerRef.setMusicEnabled(false);
        this.audioHandlerRef.setSoundEnabled(false);
      } else {
        // Restore audio based on individual settings
        const musicEnabled = settingsManager.get<boolean>('audio.musicEnabled');
        const soundEnabled = settingsManager.get<boolean>('audio.soundEnabled');
        
        this.audioHandlerRef.setMusicEnabled(musicEnabled);
        this.audioHandlerRef.setSoundEnabled(soundEnabled);
      }
      
      Logger.log(`AudioSettingsAdapter: Master mute ${masterMute ? 'enabled' : 'disabled'}`);
    } else {
      Logger.log(`AudioSettingsAdapter: Master mute setting changed to ${masterMute ? 'enabled' : 'disabled'}, will apply when AudioHandler initializes`);
    }
  }

  /**
   * Check if adapter is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Destroy the adapter and clean up subscriptions
   */
  public destroy(): void {
    // Unsubscribe from all settings changes
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    
    this.isInitialized = false;
    Logger.log('AudioSettingsAdapter: Destroyed and cleaned up subscriptions');
  }
}

// Export singleton instance
export const audioSettingsAdapter = AudioSettingsAdapter.getInstance();
