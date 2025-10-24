import * as Phaser from 'phaser';
import { Pattern } from '@strudel/core';
import { initAudioOnFirstClick, getAudioContext } from '@strudel/webaudio';
import { StrudelMusic } from '../music/StrudelMusic';
import Logger from '../../utils/Logger';

export interface HybridAudioService {
  initialize(scene: Phaser.Scene): Promise<void>;
  isInitialized(): boolean;
  
  // Music control (Strudel)
  playMusic(key: string, loop?: boolean): void;
  stopMusic(): void;
  pauseMusic(): void;
  resumeMusic(): void;
  
  // Sound effects (Phaser Audio)
  playSound(key: string, volume?: number): void;
  
  // Settings
  setMusicEnabled(enabled: boolean): void;
  setSoundEnabled(enabled: boolean): void;
  getMusicEnabled(): boolean;
  getSoundEnabled(): boolean;
  setMusicVolume(volume: number): void;
  setSoundVolume(volume: number): void;
  
  destroy(): void;
}

export class HybridAudioServiceImpl implements HybridAudioService {
  private static instance: HybridAudioServiceImpl;
  private scene: Phaser.Scene | null = null;
  private initialized = false;
  
  // Strudel for music
  private strudelInitialized = false;
  private currentMusicPattern: any = null;
  
  // Phaser for SFX
  private phaserAudioInitialized = false;
  
  // Settings
  private musicEnabled = true;
  private soundEnabled = true;
  private musicVolume = 0.8;
  private soundVolume = 0.8;

  private constructor() {}

  static getInstance(): HybridAudioServiceImpl {
    if (!HybridAudioServiceImpl.instance) {
      HybridAudioServiceImpl.instance = new HybridAudioServiceImpl();
    }
    return HybridAudioServiceImpl.instance;
  }

  async initialize(scene: Phaser.Scene): Promise<void> {
    if (this.initialized) {
      Logger.log('HybridAudioService: Already initialized');
      return;
    }

    this.scene = scene;

    try {
      // Initialize Strudel for music
      await this.initializeStrudel();
      
      // Initialize Phaser audio for SFX
      this.initializePhaserAudio();
      
      this.initialized = true;
      Logger.log('HybridAudioService: Initialized successfully');
    } catch (error) {
      Logger.log(`HybridAudioService: Initialization failed - ${error}`);
      this.initialized = false;
    }
  }

  private async initializeStrudel(): Promise<void> {
    try {
      // Don't initialize Strudel until user interaction
      // This prevents "AudioContext was not allowed to start" errors
      this.strudelInitialized = false;
      Logger.log('HybridAudioService: Strudel will initialize on first user interaction');
    } catch (error) {
      Logger.log(`HybridAudioService: Strudel initialization failed - ${error}`);
      this.strudelInitialized = false;
    }
  }

  private initializePhaserAudio(): void {
    if (this.scene && this.scene.sound) {
      // Check if Phaser's AudioContext is properly initialized
      try {
        if ('context' in this.scene.sound) {
          const phaserContext = (this.scene.sound as any).context;
          if (phaserContext) {
            Logger.log(`HybridAudioService: Phaser AudioContext state: ${phaserContext.state}`);
            
            // If suspended, it will be resumed by the SplashScreen
            this.phaserAudioInitialized = true;
            Logger.log('HybridAudioService: Phaser audio initialized for SFX');
          } else {
            Logger.log('HybridAudioService: Phaser AudioContext not available');
            this.phaserAudioInitialized = false;
          }
        } else {
          Logger.log('HybridAudioService: Phaser sound manager does not support AudioContext');
          this.phaserAudioInitialized = true; // Still allow SFX with other sound managers
        }
      } catch (error) {
        Logger.log(`HybridAudioService: Error checking Phaser audio - ${error}`);
        this.phaserAudioInitialized = false;
      }
    } else {
      Logger.log('HybridAudioService: Phaser audio not available');
      this.phaserAudioInitialized = false;
    }
  }

  isInitialized(): boolean {
    return Logger.withSilentLogging(() => {
      // Check both service initialization and AudioContext state
      const basicInit = this.initialized;
      
      // Also verify AudioContext is in a good state
      const existingContext = (window as any).audioContext;
      const contextReady = !existingContext || existingContext.state === 'running';
      
      return basicInit && contextReady;
    });
  }

  // Music methods using Strudel
  playMusic(key: string, loop: boolean = true): void {
    if (!this.musicEnabled) {
      return;
    }

    // Initialize Strudel on first music play (user interaction)
    if (!this.strudelInitialized) {
      this.initializeStrudelOnUserInteraction().then(() => {
        this.playMusicAfterInit(key, loop);
      }).catch(error => {
        Logger.log(`HybridAudioService: Failed to initialize Strudel on user interaction - ${error}`);
      });
      return;
    }

    this.playMusicAfterInit(key, loop);
  }

  private async initializeStrudelOnUserInteraction(): Promise<void> {
    try {
      // Check if AudioContext was already initialized by SplashScreen
      const existingContext = (window as any).audioContext;
      
      if (existingContext && existingContext.state === 'running') {
        Logger.log('HybridAudioService: Using existing AudioContext for Strudel');
        // Use the existing context instead of creating a new one
        await initAudioOnFirstClick();
      } else {
        // Fallback to Strudel's initialization
        Logger.log('HybridAudioService: Initializing Strudel with new AudioContext');
        await initAudioOnFirstClick();
      }
      
      this.strudelInitialized = true;
      Logger.log('HybridAudioService: Strudel initialized on user interaction');
    } catch (error) {
      Logger.log(`HybridAudioService: Failed to initialize Strudel - ${error}`);
      throw error;
    }
  }

  private playMusicAfterInit(key: string, loop: boolean): void {
    try {
      this.stopMusic();
      
      const pattern = this.createMusicPattern(key);
      if (pattern) {
        this.currentMusicPattern = pattern.play();
        Logger.log(`HybridAudioService: Playing Strudel music '${key}' with loop=${loop}`);
      }
    } catch (error) {
      Logger.log(`HybridAudioService: Failed to play music '${key}' - ${error}`);
    }
  }

  private createMusicPattern(key: string): Pattern | null {
    // Use your Strudel music patterns from StrudelMusic.ts
    try {
      let pattern: Pattern;
      
      switch (key) {
        case 'menu-theme':
          pattern = StrudelMusic.createMenuTheme();
          break;
        case 'easy-mode':
          pattern = StrudelMusic.createEasyMode();
          break;
        case 'medium-mode':
          pattern = StrudelMusic.createMediumMode();
          break;
        case 'hard-mode':
          pattern = StrudelMusic.createHardMode();
          break;
        case 'expert-mode':
          pattern = StrudelMusic.createExpertMode();
          break;
        case 'zen-mode':
          pattern = StrudelMusic.createZenMode();
          break;
        default:
          Logger.log(`HybridAudioService: Unknown music pattern '${key}'`);
          return null;
      }
      
      // Apply volume to the pattern
      return pattern.gain(this.musicVolume);
    } catch (error) {
      Logger.log(`HybridAudioService: Error creating music pattern '${key}' - ${error}`);
      return null;
    }
  }

  stopMusic(): void {
    if (this.currentMusicPattern) {
      try {
        this.currentMusicPattern.stop();
        this.currentMusicPattern = null;
        Logger.log('HybridAudioService: Strudel music stopped');
      } catch (error) {
        Logger.log(`HybridAudioService: Error stopping music - ${error}`);
      }
    }
  }

  pauseMusic(): void {
    if (this.currentMusicPattern) {
      try {
        this.currentMusicPattern.pause();
        Logger.log('HybridAudioService: Music paused');
      } catch (error) {
        Logger.log(`HybridAudioService: Error pausing music - ${error}`);
      }
    }
  }

  resumeMusic(): void {
    if (this.currentMusicPattern) {
      try {
        this.currentMusicPattern.resume();
        Logger.log('HybridAudioService: Music resumed');
      } catch (error) {
        Logger.log(`HybridAudioService: Error resuming music - ${error}`);
      }
    }
  }

  // Sound effects using Phaser Audio
  playSound(key: string, volume?: number): void {
    // Silently fail if audio not ready or disabled
    if (!this.phaserAudioInitialized || !this.soundEnabled || !this.scene) {
      return;
    }

    try {
      // Check if the sound exists before trying to play it
      if (!this.scene.cache.audio.exists(key)) {
        // Silently fail for missing audio files - they're optional
        return;
      }

      const effectiveVolume = volume !== undefined ? volume : this.soundVolume;
      
      const sound = this.scene.sound.add(key, {
        volume: effectiveVolume,
      });

      sound.play();
      
      // Clean up sound after it finishes playing
      sound.once('complete', () => {
        sound.destroy();
      });

    } catch (error) {
      // Silently fail for sound errors - they're not critical
    }
  }

  // Settings methods
  setMusicEnabled(enabled: boolean): void {
    return Logger.withSilentLogging(() => {
      this.musicEnabled = enabled;
      if (!enabled) {
        this.stopMusic();
      }
      // Only log important state changes
      if (!enabled) {
        Logger.log(`HybridAudioService: Music disabled`);
      }
    });
  }

  setSoundEnabled(enabled: boolean): void {
    return Logger.withSilentLogging(() => {
      this.soundEnabled = enabled;
      // Only log important state changes
      if (!enabled) {
        Logger.log(`HybridAudioService: Sound effects disabled`);
      }
    });
  }

  getMusicEnabled(): boolean {
    return Logger.withSilentLogging(() => {
      return this.musicEnabled;
    });
  }

  getSoundEnabled(): boolean {
    return Logger.withSilentLogging(() => {
      return this.soundEnabled;
    });
  }

  setMusicVolume(volume: number): void {
    return Logger.withSilentLogging(() => {
      this.musicVolume = Math.max(0, Math.min(1, volume));
      
      // Update current music volume if playing
      if (this.currentMusicPattern) {
        try {
          this.currentMusicPattern.gain(this.musicVolume);
        } catch (error) {
          Logger.log(`HybridAudioService: Error updating music volume - ${error}`);
        }
      }
      
      // Only log significant volume changes
      if (volume === 0 || volume === 1) {
        Logger.log(`HybridAudioService: Music volume set to ${this.musicVolume}`);
      }
    });
  }

  setSoundVolume(volume: number): void {
    return Logger.withSilentLogging(() => {
      this.soundVolume = Math.max(0, Math.min(1, volume));
      // Only log significant volume changes
      if (volume === 0 || volume === 1) {
        Logger.log(`HybridAudioService: Sound volume set to ${this.soundVolume}`);
      }
    });
  }

  destroy(): void {
    this.stopMusic();
    this.scene = null;
    this.initialized = false;
    this.strudelInitialized = false;
    this.phaserAudioInitialized = false;
    Logger.log('HybridAudioService: Destroyed');
  }
}

// Export singleton instance
export const hybridAudioService = HybridAudioServiceImpl.getInstance();
