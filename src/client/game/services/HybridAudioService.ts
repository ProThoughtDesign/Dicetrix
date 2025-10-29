import * as Phaser from 'phaser';
import { Pattern } from '@strudel/core';
import { initAudioOnFirstClick, getAudioContext } from '@strudel/webaudio';
import { StrudelMusic } from '../music/StrudelMusic';
import { AudioAssetManager } from './AudioAssetManager';
import { SoundEffectLibrary, SoundEffectConfig } from './SoundEffectLibrary';
import Logger from '../../utils/Logger';

// Enhanced error types for comprehensive error handling
export enum AudioErrorType {
  INITIALIZATION_FAILED = 'initialization_failed',
  CONTEXT_SUSPENDED = 'context_suspended',
  ASSET_LOADING_FAILED = 'asset_loading_failed',
  PLAYBACK_FAILED = 'playback_failed',
  TIMEOUT = 'timeout',
  PERMISSION_DENIED = 'permission_denied',
  HARDWARE_UNAVAILABLE = 'hardware_unavailable',
  MEMORY_EXHAUSTED = 'memory_exhausted',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown'
}

export interface AudioError {
  type: AudioErrorType;
  message: string;
  originalError?: any;
  context?: any;
  timestamp: number;
  recoverable: boolean;
  recoveryAction?: string;
}

export interface AudioDiagnostics {
  audioContextState: string;
  audioContextSampleRate: number | null;
  userActivation: boolean;
  documentVisibility: string;
  memoryUsage?: any;
  networkStatus: string;
  browserInfo: string;
  timestamp: number;
}

// Enhanced logging utilities for audio debugging
class AudioLogger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  static logInitializationProgress(message: string, details?: any): void {
    const timestamp = this.formatTimestamp();
    const detailsStr = details ? ` | Details: ${JSON.stringify(details)}` : '';
    Logger.log(`[${timestamp}] AUDIO_INIT: ${message}${detailsStr}`);
  }

  static logAudioContextState(context: AudioContext | null, operation: string): void {
    const timestamp = this.formatTimestamp();
    if (context) {
      Logger.log(`[${timestamp}] AUDIO_CONTEXT: ${operation} | State: ${context.state} | SampleRate: ${context.sampleRate} | CurrentTime: ${context.currentTime.toFixed(3)}s`);
    } else {
      Logger.log(`[${timestamp}] AUDIO_CONTEXT: ${operation} | Context: null`);
    }
  }

  static logTimeout(operation: string, expectedMs: number, actualMs: number, diagnostics?: any): void {
    const timestamp = this.formatTimestamp();
    const diagStr = diagnostics ? ` | Diagnostics: ${JSON.stringify(diagnostics)}` : '';
    Logger.log(`[${timestamp}] AUDIO_TIMEOUT: ${operation} | Expected: ${expectedMs}ms | Actual: ${actualMs}ms${diagStr}`);
  }

  static logFallbackActivation(fromMode: AudioMode, toMode: AudioMode, reason: string): void {
    const timestamp = this.formatTimestamp();
    Logger.log(`[${timestamp}] AUDIO_FALLBACK: ${fromMode} -> ${toMode} | Reason: ${reason}`);
  }

  static logError(operation: string, error: any, context?: any): void {
    const timestamp = this.formatTimestamp();
    const errorStr = error instanceof Error ? error.message : String(error);
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    Logger.log(`[${timestamp}] AUDIO_ERROR: ${operation} | Error: ${errorStr}${contextStr}`);
  }

  static logStateTransition(from: string, to: string, trigger: string): void {
    const timestamp = this.formatTimestamp();
    Logger.log(`[${timestamp}] AUDIO_STATE: ${from} -> ${to} | Trigger: ${trigger}`);
  }

  static logRecoveryAttempt(errorType: AudioErrorType, action: string, attempt: number): void {
    const timestamp = this.formatTimestamp();
    Logger.log(`[${timestamp}] AUDIO_RECOVERY: ${errorType} | Action: ${action} | Attempt: ${attempt}`);
  }

  static logDiagnostics(operation: string, diagnostics: AudioDiagnostics): void {
    const timestamp = this.formatTimestamp();
    Logger.log(`[${timestamp}] AUDIO_DIAGNOSTICS: ${operation} | ${JSON.stringify(diagnostics)}`);
  }
}

// Audio mode enumeration
export enum AudioMode {
  STRUDEL = 'strudel',           // Full Strudel + Phaser
  PHASER_ONLY = 'phaser-only',   // Phaser audio only
  SILENT = 'silent'              // No audio
}

// Enhanced audio configuration interface
export interface AudioConfiguration {
  music: {
    volume: number;
    enabled: boolean;
    currentTrack: string | null;
    fadeInDuration: number;
    fadeOutDuration: number;
  };
  sound: SoundEffectConfig;
  system: {
    masterMute: boolean;
    audioMode: AudioMode;
    preloadComplete: boolean;
    fallbackMode: boolean;
  };
}

export interface HybridAudioService {
  initialize(scene: Phaser.Scene): Promise<void>;
  isInitialized(): boolean;
  
  // Music control (Strudel)
  playMusic(key: string, loop?: boolean): Promise<void>;
  stopMusic(): void;
  pauseMusic(): void;
  resumeMusic(): void;
  
  // Enhanced music transition and crossfading capabilities
  transitionToMusic(key: string, fadeOutDuration?: number, fadeInDuration?: number): Promise<void>;
  crossfadeMusic(fromKey: string, toKey: string, duration?: number): Promise<void>;
  
  // Sound effects (Phaser Audio)
  playSound(key: string, volume?: number): void;
  
  // SoundEffectLibrary integration
  getSoundEffectLibrary(): SoundEffectLibrary | null;
  
  // Settings
  setMusicEnabled(enabled: boolean): void;
  setSoundEnabled(enabled: boolean): void;
  getMusicEnabled(): boolean;
  getSoundEnabled(): boolean;
  setMusicVolume(volume: number): void;
  setSoundVolume(volume: number): void;
  
  // Unified audio configuration management
  getAudioConfiguration(): AudioConfiguration;
  updateAudioConfiguration(config: Partial<AudioConfiguration>): void;
  
  // State management
  resetInitializationState(): void;
  
  // Fallback mode management
  getCurrentAudioMode(): AudioMode;
  enableFallbackMode(): void;
  enableSilentMode(): void;
  getAudioDebugInfo(): string;
  
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
  
  // Audio asset management
  private audioAssetManager: AudioAssetManager | null = null;
  
  // SoundEffectLibrary integration
  private soundEffectLibrary: SoundEffectLibrary | null = null;
  
  // Settings
  private musicEnabled = true;
  private soundEnabled = true;
  private musicVolume = 0.8;
  private soundVolume = 0.8;
  
  // Enhanced music transition capabilities
  private currentMusicKey: string | null = null;
  private musicFadeInDuration = 1000; // 1 second default
  private musicFadeOutDuration = 1000; // 1 second default
  private activeMusicTransition: Promise<void> | null = null;

  // Comprehensive error handling and recovery
  private errorHistory: AudioError[] = [];
  private readonly maxErrorHistory = 50;
  private recoveryAttempts: Map<AudioErrorType, number> = new Map();
  private readonly maxRecoveryAttempts = 3;

  private autoRecoveryEnabled = true;
  private criticalErrorsCount = 0;
  private readonly maxCriticalErrors = 5;

  // Timeout protection
  private readonly initializationTimeout = 5000; // 5 seconds
  private initializationPromise: Promise<void> | null = null;
  
  // Initialization attempt tracking
  private initializationAttempts = 0;
  private readonly maxInitializationAttempts = 2;
  private lastInitializationError: string | null = null;
  private initializationHistory: Array<{
    attempt: number;
    timestamp: number;
    success: boolean;
    duration: number;
    error?: string;
  }> = [];

  // Fallback mode management
  private currentAudioMode: AudioMode = AudioMode.STRUDEL;
  private phaserMusicSounds: Map<string, Phaser.Sound.BaseSound> = new Map();

  private constructor() {}

  static getInstance(): HybridAudioServiceImpl {
    if (!HybridAudioServiceImpl.instance) {
      HybridAudioServiceImpl.instance = new HybridAudioServiceImpl();
    }
    return HybridAudioServiceImpl.instance;
  }

  async initialize(scene: Phaser.Scene): Promise<void> {
    const startTime = Date.now();
    AudioLogger.logInitializationProgress('Service initialization started', {
      sceneKey: scene.scene.key,
      currentMode: this.currentAudioMode,
      previouslyInitialized: this.initialized
    });

    if (this.initialized) {
      AudioLogger.logInitializationProgress('Already initialized, skipping');
      return;
    }

    this.scene = scene;
    AudioLogger.logStateTransition('uninitialized', 'initializing', 'initialize() called');

    try {
      // Initialize AudioAssetManager for comprehensive file management
      AudioLogger.logInitializationProgress('Starting AudioAssetManager initialization');
      this.audioAssetManager = new AudioAssetManager();
      
      // Initialize SoundEffectLibrary for comprehensive sound effects
      AudioLogger.logInitializationProgress('Starting SoundEffectLibrary initialization');
      this.initializeSoundEffectLibrary();
      
      // Initialize Strudel for music
      AudioLogger.logInitializationProgress('Starting Strudel initialization');
      await this.initializeStrudel();
      
      // Initialize Phaser audio for SFX
      AudioLogger.logInitializationProgress('Starting Phaser audio initialization');
      this.initializePhaserAudio();
      
      this.initialized = true;
      const duration = Date.now() - startTime;
      AudioLogger.logInitializationProgress(`Service initialized successfully in ${duration}ms`, {
        mode: this.currentAudioMode,
        strudelReady: this.strudelInitialized,
        phaserReady: this.phaserAudioInitialized
      });
      AudioLogger.logStateTransition('initializing', 'initialized', 'successful initialization');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Use comprehensive error handling
      await this.handleAudioSystemFailure(
        'service initialization',
        error,
        AudioErrorType.INITIALIZATION_FAILED,
        {
          duration,
          strudelReady: this.strudelInitialized,
          phaserReady: this.phaserAudioInitialized
        }
      );
      
      this.initialized = true; // Still mark as initialized to allow UI controls to work
      AudioLogger.logStateTransition('initializing', 'initialized-fallback', 'fallback mode enabled after error handling');
    }
  }

  private async initializeStrudel(): Promise<void> {
    try {
      // Don't initialize Strudel until user interaction
      // This prevents "AudioContext was not allowed to start" errors
      this.strudelInitialized = false;
      
      // Check for existing AudioContext
      const existingContext = (window as any).audioContext;
      AudioLogger.logInitializationProgress('Strudel setup complete - awaiting user interaction', {
        existingContext: !!existingContext,
        contextState: existingContext?.state || 'none'
      });
      
    } catch (error) {
      this.strudelInitialized = false;
      
      // Use comprehensive error handling for Strudel initialization
      this.handleAudioSystemFailure(
        'Strudel setup',
        error,
        AudioErrorType.INITIALIZATION_FAILED,
        { component: 'Strudel' }
      );
      
      throw error;
    }
  }

  private initializeSoundEffectLibrary(): void {
    AudioLogger.logInitializationProgress('SoundEffectLibrary initialization started');
    
    if (!this.scene) {
      AudioLogger.logError('SoundEffectLibrary initialization', 'No scene available');
      return;
    }

    try {
      // Create SoundEffectLibrary with initial configuration
      const initialConfig = {
        volume: this.soundVolume,
        enabled: this.soundEnabled,
        categories: {
          ui: true,
          gameplay: true,
          effects: true,
        },
      };

      this.soundEffectLibrary = new SoundEffectLibrary(this.scene, initialConfig);
      AudioLogger.logInitializationProgress('SoundEffectLibrary initialized successfully', {
        config: initialConfig
      });
    } catch (error) {
      AudioLogger.logError('SoundEffectLibrary initialization', error, {
        sceneKey: this.scene.scene.key
      });
      this.soundEffectLibrary = null;
    }
  }

  private initializePhaserAudio(): void {
    AudioLogger.logInitializationProgress('Phaser audio initialization started');
    
    if (!this.scene) {
      AudioLogger.logError('Phaser audio initialization', 'No scene available');
      this.phaserAudioInitialized = false;
      return;
    }

    if (!this.scene.sound) {
      AudioLogger.logError('Phaser audio initialization', 'Scene sound manager not available');
      this.phaserAudioInitialized = false;
      return;
    }

    try {
      if ('context' in this.scene.sound) {
        const phaserContext = (this.scene.sound as any).context;
        if (phaserContext) {
          AudioLogger.logAudioContextState(phaserContext, 'Phaser initialization');
          
          // Monitor context state changes
          if (phaserContext.state === 'suspended') {
            AudioLogger.logInitializationProgress('Phaser AudioContext suspended - will resume on user interaction');
          } else if (phaserContext.state === 'running') {
            AudioLogger.logInitializationProgress('Phaser AudioContext already running');
          }
          
          this.phaserAudioInitialized = true;
          AudioLogger.logInitializationProgress('Phaser audio initialized successfully', {
            contextState: phaserContext.state,
            sampleRate: phaserContext.sampleRate
          });
        } else {
          AudioLogger.logInitializationProgress('Phaser AudioContext not available - using fallback sound manager');
          this.phaserAudioInitialized = false;
        }
      } else {
        AudioLogger.logInitializationProgress('Phaser sound manager without AudioContext - using basic sound support');
        this.phaserAudioInitialized = true; // Still allow SFX with other sound managers
      }
    } catch (error) {
      this.phaserAudioInitialized = false;
      
      // Use comprehensive error handling for Phaser initialization
      this.handleAudioSystemFailure(
        'Phaser audio initialization',
        error,
        AudioErrorType.INITIALIZATION_FAILED,
        {
          sceneKey: this.scene.scene.key,
          soundManagerType: typeof this.scene.sound,
          component: 'Phaser'
        }
      );
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

  // Music methods using Strudel or fallback modes
  async playMusic(key: string, loop: boolean = true): Promise<void> {
    Logger.log(`HybridAudioService: playMusic called with key='${key}', musicEnabled=${this.musicEnabled}, mode=${this.currentAudioMode}`);
    
    if (!this.musicEnabled) {
      Logger.log('HybridAudioService: Music disabled, not playing');
      return;
    }

    // Update current music key for tracking
    this.currentMusicKey = key;

    // Handle different audio modes with consistent behavior (Requirement 3.3)
    if (this.currentAudioMode === AudioMode.SILENT) {
      Logger.log('HybridAudioService: Silent mode active, not playing music');
      return;
    }

    if (this.currentAudioMode === AudioMode.PHASER_ONLY) {
      Logger.log('HybridAudioService: Using Phaser-only mode for music playback (simple audio files)');
      await this.playMusicAfterInit(key, loop);
      return;
    }

    // Strudel mode - initialize if needed with timeout protection (Requirement 1.3)
    // This prevents hanging when StartMenu scene loads by using timeout and fallback
    if (this.currentAudioMode === AudioMode.STRUDEL && !this.strudelInitialized) {
      Logger.log(`HybridAudioService: Strudel not initialized, initializing now with timeout protection (attempt ${this.initializationAttempts + 1}/${this.maxInitializationAttempts})...`);
      
      this.initializeStrudelWithTimeout().then(async () => {
        Logger.log('HybridAudioService: Strudel initialization complete, playing music without hanging');
        await this.playMusicAfterInit(key, loop);
      }).catch(async (error) => {
        const isTimeout = error instanceof Error && error.message.includes('timed out');
        const isMaxAttempts = error instanceof Error && error.message.includes('Maximum initialization attempts');
        
        if (isTimeout) {
          Logger.log(`HybridAudioService: Strudel initialization timed out - ${error.message}`);
          Logger.log('HybridAudioService: Fallback mode automatically enabled to prevent hanging');
        } else if (isMaxAttempts) {
          Logger.log(`HybridAudioService: Maximum initialization attempts reached - ${error.message}`);
          Logger.log('HybridAudioService: Fallback mode automatically enabled');
        } else {
          Logger.log(`HybridAudioService: Failed to initialize Strudel - ${error}`);
        }
        
        // The timeout protection automatically handles fallback mode switching
        // Retry music playback which should now use the fallback mode (Requirement 1.3)
        if (this.currentAudioMode !== AudioMode.STRUDEL) {
          Logger.log('HybridAudioService: Retrying music playback in fallback mode to ensure music plays without hanging');
          await this.playMusic(key, loop);
        }
      });
      return;
    }

    Logger.log('HybridAudioService: Strudel already initialized, playing music directly');
    await this.playMusicAfterInit(key, loop);
  }

  /**
   * Enhanced music transition with fade effects
   * Requirements: 1.3, 1.4
   */
  async transitionToMusic(key: string, fadeOutDuration?: number, fadeInDuration?: number): Promise<void> {
    Logger.log(`HybridAudioService: Transitioning to music '${key}' with fade effects`);
    
    if (!this.musicEnabled) {
      Logger.log('HybridAudioService: Music disabled, not transitioning');
      return;
    }

    // Prevent multiple simultaneous transitions
    if (this.activeMusicTransition) {
      Logger.log('HybridAudioService: Music transition already in progress, waiting for completion');
      await this.activeMusicTransition;
    }

    const fadeOut = fadeOutDuration !== undefined ? fadeOutDuration : this.musicFadeOutDuration;
    const fadeIn = fadeInDuration !== undefined ? fadeInDuration : this.musicFadeInDuration;

    this.activeMusicTransition = this.performMusicTransition(key, fadeOut, fadeIn);
    
    try {
      await this.activeMusicTransition;
      Logger.log(`HybridAudioService: Music transition to '${key}' completed successfully`);
    } catch (error) {
      // Use comprehensive error handling for music transitions
      await this.handleAudioSystemFailure(
        `music transition to ${key}`,
        error,
        AudioErrorType.PLAYBACK_FAILED,
        {
          targetKey: key,
          fadeOutDuration: fadeOut,
          fadeInDuration: fadeIn
        }
      );
      throw error;
    } finally {
      this.activeMusicTransition = null;
    }
  }

  /**
   * Crossfade between two music tracks
   * Requirements: 1.3, 1.4
   */
  async crossfadeMusic(_fromKey: string, toKey: string, duration?: number): Promise<void> {
    Logger.log(`HybridAudioService: Crossfading from '${_fromKey}' to '${toKey}'`);
    
    if (!this.musicEnabled) {
      Logger.log('HybridAudioService: Music disabled, not crossfading');
      return;
    }

    const crossfadeDuration = duration !== undefined ? duration : Math.max(this.musicFadeInDuration, this.musicFadeOutDuration);
    
    // Prevent multiple simultaneous transitions
    if (this.activeMusicTransition) {
      Logger.log('HybridAudioService: Music transition already in progress, waiting for completion');
      await this.activeMusicTransition;
    }

    this.activeMusicTransition = this.performMusicCrossfade(_fromKey, toKey, crossfadeDuration);
    
    try {
      await this.activeMusicTransition;
      Logger.log(`HybridAudioService: Crossfade from '${_fromKey}' to '${toKey}' completed successfully`);
    } catch (error) {
      // Use comprehensive error handling for crossfade
      await this.handleAudioSystemFailure(
        `crossfade from ${_fromKey} to ${toKey}`,
        error,
        AudioErrorType.PLAYBACK_FAILED,
        {
          fromKey: _fromKey,
          toKey,
          duration: crossfadeDuration
        }
      );
      throw error;
    } finally {
      this.activeMusicTransition = null;
    }
  }

  /**
   * Perform the actual music transition with fade effects
   */
  private async performMusicTransition(key: string, fadeOutDuration: number, fadeInDuration: number): Promise<void> {
    try {
      // Phase 1: Fade out current music
      if (this.currentMusicPattern || this.phaserMusicSounds.size > 0) {
        Logger.log(`HybridAudioService: Fading out current music over ${fadeOutDuration}ms`);
        await this.fadeOutCurrentMusic(fadeOutDuration);
      }

      // Phase 2: Stop current music completely
      this.stopMusic();

      // Phase 3: Start new music with fade in
      Logger.log(`HybridAudioService: Starting new music '${key}' with fade in over ${fadeInDuration}ms`);
      await this.fadeInNewMusic(key, fadeInDuration);
      
    } catch (error) {
      Logger.log(`HybridAudioService: Error during music transition - ${error}`);
      throw error;
    }
  }

  /**
   * Perform crossfade between two music tracks
   */
  private async performMusicCrossfade(_fromKey: string, toKey: string, duration: number): Promise<void> {
    try {
      Logger.log(`HybridAudioService: Starting crossfade over ${duration}ms`);
      
      // Start the new music at low volume
      const originalVolume = this.musicVolume;
      this.setMusicVolume(0);
      await this.playMusic(toKey, true);
      
      // Gradually fade out old and fade in new
      const steps = 20; // Number of volume adjustment steps
      const stepDuration = duration / steps;
      
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const newVolume = originalVolume * progress;
        
        // Update volume for new music
        this.setMusicVolume(newVolume);
        
        // Wait for next step
        if (i < steps) {
          await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
      }
      
      // Ensure final volume is correct
      this.setMusicVolume(originalVolume);
      this.currentMusicKey = toKey;
      
    } catch (error) {
      Logger.log(`HybridAudioService: Error during crossfade - ${error}`);
      throw error;
    }
  }

  /**
   * Fade out current music
   */
  private async fadeOutCurrentMusic(duration: number): Promise<void> {
    const originalVolume = this.musicVolume;
    const steps = 10;
    const stepDuration = duration / steps;
    
    for (let i = steps; i >= 0; i--) {
      const progress = i / steps;
      const newVolume = originalVolume * progress;
      this.setMusicVolume(newVolume);
      
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  }

  /**
   * Fade in new music
   */
  private async fadeInNewMusic(key: string, duration: number): Promise<void> {
    const targetVolume = this.musicVolume;
    const steps = 10;
    const stepDuration = duration / steps;
    
    // Start at zero volume
    this.setMusicVolume(0);
    await this.playMusic(key, true);
    
    // Gradually increase volume
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const newVolume = targetVolume * progress;
      this.setMusicVolume(newVolume);
      
      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  }

  /**
   * Creates a timeout promise that rejects after the specified duration
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutError = new Error(`Strudel initialization timed out after ${timeoutMs}ms`);
        
        // Collect timeout diagnostics
        const timeoutDiagnostics = {
          timeoutMs,
          contextState: (window as any).audioContext?.state || 'unknown',
          documentHidden: document.hidden,
          visibilityState: document.visibilityState,
          timestamp: new Date().toISOString()
        };
        
        AudioLogger.logTimeout('Strudel initialization', timeoutMs, timeoutMs, timeoutDiagnostics);
        reject(timeoutError);
      }, timeoutMs);
    });
  }

  /**
   * Initializes Strudel with timeout protection and automatic fallback mode switching
   * This replaces the previous initializeStrudelOnUserInteraction method with enhanced error handling
   */
  private async initializeStrudelWithTimeout(): Promise<void> {
    // Prevent multiple simultaneous initialization attempts
    if (this.initializationPromise) {
      AudioLogger.logInitializationProgress('Initialization already in progress, waiting for completion');
      return this.initializationPromise;
    }

    // Check initialization attempt limit
    if (this.initializationAttempts >= this.maxInitializationAttempts) {
      const error = new Error(`Maximum initialization attempts (${this.maxInitializationAttempts}) exceeded. Use resetInitializationState() to retry.`);
      AudioLogger.logError('Strudel initialization limit exceeded', error, {
        attempts: this.initializationAttempts,
        maxAttempts: this.maxInitializationAttempts,
        history: this.getInitializationHistorySummary()
      });
      this.lastInitializationError = error.message;
      
      // Automatically switch to fallback mode when attempts are exhausted
      AudioLogger.logInitializationProgress('Switching to fallback mode due to exhausted attempts');
      this.enableFallbackMode();
      throw error;
    }

    this.initializationAttempts++;
    const startTime = Date.now();
    const attemptTimestamp = startTime;
    
    AudioLogger.logInitializationProgress(`Starting Strudel initialization attempt ${this.initializationAttempts}/${this.maxInitializationAttempts}`, {
      timestamp: new Date(startTime).toISOString(),
      timeoutMs: this.initializationTimeout
    });

    // Pre-initialization diagnostics
    const preInitDiagnostics = {
      windowAudioContext: !!(window as any).audioContext,
      contextState: (window as any).audioContext?.state || 'none',
      userActivation: (navigator as any).userActivation?.hasBeenActive || 'unknown',
      documentHidden: document.hidden,
      documentVisibility: document.visibilityState
    };
    AudioLogger.logInitializationProgress('Pre-initialization diagnostics', preInitDiagnostics);

    try {
      // Check if AudioContext was already initialized
      const existingContext = (window as any).audioContext;
      
      if (existingContext) {
        AudioLogger.logAudioContextState(existingContext, 'Pre-Strudel check');
        if (existingContext.state === 'running') {
          AudioLogger.logInitializationProgress('Using existing running AudioContext for Strudel');
        } else {
          AudioLogger.logInitializationProgress(`Existing AudioContext in ${existingContext.state} state - Strudel will attempt to resume`);
        }
      } else {
        AudioLogger.logInitializationProgress('No existing AudioContext found - Strudel will create new one');
      }
      
      AudioLogger.logInitializationProgress('Calling initAudioOnFirstClick() with timeout protection');
      
      // Create the initialization promise with timeout protection
      this.initializationPromise = Promise.race([
        initAudioOnFirstClick(),
        this.createTimeoutPromise(this.initializationTimeout)
      ]);
      
      // Wait for initialization or timeout
      await this.initializationPromise;
      
      const duration = Date.now() - startTime;
      AudioLogger.logInitializationProgress(`initAudioOnFirstClick() completed successfully in ${duration}ms`);
      
      // Post-initialization verification
      const audioContext = getAudioContext();
      if (audioContext) {
        AudioLogger.logAudioContextState(audioContext, 'Post-Strudel initialization');
        
        // Additional context diagnostics
        const contextDiagnostics = {
          baseLatency: audioContext.baseLatency || 'unknown',
          outputLatency: (audioContext as any).outputLatency || 'unknown',
          destination: !!audioContext.destination,
          listener: !!audioContext.listener
        };
        AudioLogger.logInitializationProgress('AudioContext diagnostics', contextDiagnostics);
      } else {
        AudioLogger.logError('Post-initialization verification', 'No AudioContext returned by Strudel');
        throw new Error('AudioContext verification failed after Strudel initialization');
      }
      
      this.strudelInitialized = true;
      this.lastInitializationError = null;
      
      // Record successful initialization
      this.initializationHistory.push({
        attempt: this.initializationAttempts,
        timestamp: attemptTimestamp,
        success: true,
        duration: duration
      });
      
      AudioLogger.logInitializationProgress(`Strudel initialized successfully`, {
        duration: `${duration}ms`,
        attempt: this.initializationAttempts,
        contextState: audioContext?.state || 'unknown'
      });
      AudioLogger.logStateTransition('strudel-initializing', 'strudel-ready', 'successful initialization');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTimeout = errorMessage.includes('timed out');
      
      this.lastInitializationError = errorMessage;
      this.strudelInitialized = false;
      
      // Collect error diagnostics
      const errorDiagnostics = {
        duration: `${duration}ms`,
        attempt: this.initializationAttempts,
        isTimeout,
        contextState: (window as any).audioContext?.state || 'unknown',
        errorType: error instanceof Error ? error.constructor.name : typeof error
      };
      
      // Record failed initialization
      this.initializationHistory.push({
        attempt: this.initializationAttempts,
        timestamp: attemptTimestamp,
        success: false,
        duration: duration,
        error: errorMessage
      });
      
      if (isTimeout) {
        AudioLogger.logTimeout('Strudel initialization', this.initializationTimeout, duration, errorDiagnostics);
        AudioLogger.logError('Strudel initialization timeout', error, {
          expectedMs: this.initializationTimeout,
          actualMs: duration,
          contextState: (window as any).audioContext?.state || 'unknown'
        });
        
        // Automatic fallback on timeout
        AudioLogger.logInitializationProgress('Timeout detected, switching to fallback mode');
        this.enableFallbackMode();
      } else {
        AudioLogger.logError('Strudel initialization failed', error, errorDiagnostics);
        
        // Automatic fallback on other errors if this is the last attempt
        if (this.initializationAttempts >= this.maxInitializationAttempts) {
          AudioLogger.logInitializationProgress('Max attempts reached, switching to fallback mode');
          this.enableFallbackMode();
        }
      }
      
      // Log comprehensive attempt history for debugging
      AudioLogger.logInitializationProgress('Initialization history summary', {
        totalAttempts: this.initializationAttempts,
        history: this.getInitializationHistorySummary(),
        lastError: errorMessage
      });
      
      AudioLogger.logStateTransition('strudel-initializing', 'strudel-failed', `attempt ${this.initializationAttempts} failed`);
      
      throw error;
      
    } finally {
      // Clear the initialization promise to allow future attempts
      this.initializationPromise = null;
      
      const finalDuration = Date.now() - startTime;
      AudioLogger.logInitializationProgress(`Initialization attempt ${this.initializationAttempts} completed`, {
        duration: `${finalDuration}ms`,
        success: this.strudelInitialized
      });
    }
  }

  private async playMusicAfterInit(key: string, loop: boolean): Promise<void> {
    try {
      Logger.log(`HybridAudioService: Attempting to play music '${key}' in ${this.currentAudioMode} mode`);
      this.stopMusic();
      
      // Mode-specific pattern creation and playback (Requirements 1.3, 3.2, 3.3)
      // Ensures consistent behavior across all audio modes with appropriate fallbacks
      switch (this.currentAudioMode) {
        case AudioMode.STRUDEL:
          if (this.strudelInitialized) {
            // Use algorithmic music generation (Strudel patterns)
            await this.playStrudelMusic(key, loop);
          } else {
            Logger.log(`HybridAudioService: Strudel mode selected but not initialized, switching to fallback`);
            this.enableFallbackMode();
            await this.playPhaserMusic(key, loop);
          }
          break;
          
        case AudioMode.PHASER_ONLY:
          // Use simple audio files instead of algorithmic music (Requirement 3.2)
          await this.playPhaserMusic(key, loop);
          break;
          
        case AudioMode.SILENT:
          // Maintain consistent API behavior even in silent mode (Requirement 3.3)
          Logger.log(`HybridAudioService: Silent mode active, not playing music '${key}' but maintaining consistent behavior`);
          break;
          
        default:
          Logger.log(`HybridAudioService: Unknown audio mode '${this.currentAudioMode}', defaulting to silent`);
          this.enableSilentMode();
          break;
      }
    } catch (error) {
      // Use comprehensive error handling for music playback failures
      await this.handleAudioSystemFailure(
        `music playback (${key})`,
        error,
        AudioErrorType.PLAYBACK_FAILED,
        {
          musicKey: key,
          loop,
          audioMode: this.currentAudioMode
        }
      );
    }
  }

  private async playStrudelMusic(key: string, loop: boolean): Promise<void> {
    if (this.currentAudioMode !== AudioMode.STRUDEL) {
      Logger.log(`HybridAudioService: Cannot play Strudel music in ${this.currentAudioMode} mode`);
      return;
    }

    if (!this.strudelInitialized) {
      Logger.log(`HybridAudioService: Cannot play Strudel music - not initialized`);
      throw new Error('Strudel not initialized');
    }

    try {
      const pattern = this.createMusicPattern(key);
      if (pattern) {
        Logger.log(`HybridAudioService: Pattern created for '${key}', starting Strudel playback (loop: ${loop})`);
        
        // Apply current volume and start playback
        const volumeAdjustedPattern = pattern.gain(this.musicVolume);
        this.currentMusicPattern = volumeAdjustedPattern.play();
        
        Logger.log(`HybridAudioService: Successfully started Strudel music '${key}' with volume ${this.musicVolume}`);
      } else {
        Logger.log(`HybridAudioService: No Strudel pattern created for '${key}'`);
        throw new Error(`Failed to create Strudel pattern for '${key}'`);
      }
    } catch (error) {
      // Use comprehensive error handling for Strudel playback
      await this.handleAudioSystemFailure(
        `Strudel music playback (${key})`,
        error,
        AudioErrorType.PLAYBACK_FAILED,
        {
          musicKey: key,
          component: 'Strudel',
          strudelInitialized: this.strudelInitialized
        }
      );
      throw error;
    }
  }

  private async playPhaserMusic(key: string, loop: boolean): Promise<void> {
    if (this.currentAudioMode === AudioMode.SILENT) {
      Logger.log(`HybridAudioService: Cannot play Phaser music in silent mode`);
      return;
    }

    if (!this.scene || !this.phaserAudioInitialized) {
      Logger.log('HybridAudioService: Phaser audio not available for music playback');
      throw new Error('Phaser audio not initialized or scene not available');
    }

    try {
      // Create simple audio file patterns using Phaser audio (Requirement 3.2)
      // This provides simple audio files instead of algorithmic music in fallback mode
      const musicPattern = this.createPhaserMusicPattern(key);
      if (musicPattern) {
        Logger.log(`HybridAudioService: Creating Phaser sound for '${key}' (soundKey: '${musicPattern.soundKey}', loop: ${loop}) - using simple audio file instead of algorithmic music`);
        
        const sound = this.scene.sound.add(musicPattern.soundKey, {
          volume: this.musicVolume,
          loop: loop
        });
        
        // Add error handling for sound playback
        sound.once('looped', () => {
          Logger.log(`HybridAudioService: Phaser music '${key}' looped successfully`);
        });
        
        sound.once('complete', () => {
          Logger.log(`HybridAudioService: Phaser music '${key}' completed`);
          if (!loop) {
            this.phaserMusicSounds.delete(key);
          }
        });

        sound.play();
        this.phaserMusicSounds.set(key, sound);
        Logger.log(`HybridAudioService: Successfully started Phaser music '${key}' with volume ${this.musicVolume} and loop=${loop}`);
      } else {
        Logger.log(`HybridAudioService: No Phaser music pattern available for '${key}'`);
        throw new Error(`Failed to create Phaser pattern for '${key}'`);
      }
    } catch (error) {
      // Use comprehensive error handling for Phaser music playback
      await this.handleAudioSystemFailure(
        `Phaser music playback (${key})`,
        error,
        AudioErrorType.PLAYBACK_FAILED,
        {
          musicKey: key,
          component: 'Phaser',
          phaserInitialized: this.phaserAudioInitialized
        }
      );
      throw error;
    }
  }

  private createMusicPattern(key: string): Pattern | null {
    // Only create Strudel patterns when in Strudel mode and initialized
    if (this.currentAudioMode !== AudioMode.STRUDEL || !this.strudelInitialized) {
      Logger.log(`HybridAudioService: Cannot create Strudel pattern in ${this.currentAudioMode} mode (initialized: ${this.strudelInitialized})`);
      return null;
    }

    try {
      Logger.log(`HybridAudioService: Creating Strudel pattern for '${key}'`);
      let pattern: Pattern;
      
      switch (key) {
        case 'menu-theme':
          Logger.log('HybridAudioService: Creating menu theme pattern');
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
          Logger.log(`HybridAudioService: Unknown Strudel music pattern '${key}', attempting to create default pattern`);
          // Try to create a simple default pattern
          pattern = StrudelMusic.createMenuTheme(); // Use menu theme as fallback
          break;
      }
      
      // Apply volume to the pattern
      const volumeAdjustedPattern = pattern.gain(this.musicVolume);
      Logger.log(`HybridAudioService: Successfully created Strudel pattern for '${key}' with volume ${this.musicVolume}`);
      return volumeAdjustedPattern;
    } catch (error) {
      Logger.log(`HybridAudioService: Error creating Strudel music pattern '${key}' - ${error}`);
      return null;
    }
  }

  private createPhaserMusicPattern(key: string): { soundKey: string } | null {
    // Only create Phaser patterns when in appropriate modes
    if (this.currentAudioMode === AudioMode.SILENT) {
      Logger.log(`HybridAudioService: Cannot create Phaser pattern in silent mode`);
      return null;
    }

    if (!this.phaserAudioInitialized) {
      Logger.log(`HybridAudioService: Cannot create Phaser pattern - Phaser audio not initialized`);
      return null;
    }

    try {
      Logger.log(`HybridAudioService: Creating Phaser music pattern for '${key}' in ${this.currentAudioMode} mode`);
      
      // Map music keys to simple audio file keys for fallback mode (Requirement 3.2)
      // In fallback mode, we use simple audio files instead of algorithmic music
      const soundKeyMap: Record<string, string> = {
        'menu-theme': 'menu-music',
        'easy-mode': 'easy-music',
        'medium-mode': 'medium-music',
        'hard-mode': 'hard-music',
        'expert-mode': 'expert-music',
        'zen-mode': 'zen-music'
      };

      let soundKey = soundKeyMap[key];
      
      if (!soundKey) {
        Logger.log(`HybridAudioService: Unknown Phaser music pattern '${key}', using fallback strategy`);
        // Try to use a default sound or the first available sound
        soundKey = 'menu-music'; // Default fallback
      }

      // Verify the sound exists in the cache if scene is available
      if (this.scene && this.scene.cache && this.scene.cache.audio) {
        if (!this.scene.cache.audio.exists(soundKey)) {
          Logger.log(`HybridAudioService: Sound '${soundKey}' not found in cache, trying fallback sounds`);
          
          // Try fallback sounds in order of preference
          const fallbackSounds = ['menu-music', 'default-music', 'background-music'];
          for (const fallback of fallbackSounds) {
            if (this.scene.cache.audio.exists(fallback)) {
              soundKey = fallback;
              Logger.log(`HybridAudioService: Using fallback sound '${soundKey}' for '${key}'`);
              break;
            }
          }
          
          // If no fallback found, return null
          if (!this.scene.cache.audio.exists(soundKey)) {
            Logger.log(`HybridAudioService: No suitable Phaser audio found for '${key}'`);
            return null;
          }
        }
      }

      Logger.log(`HybridAudioService: Successfully mapped '${key}' to Phaser sound '${soundKey}'`);
      return { soundKey };
      
    } catch (error) {
      Logger.log(`HybridAudioService: Error creating Phaser music pattern '${key}' - ${error}`);
      return null;
    }
  }

  stopMusic(): void {
    Logger.log(`HybridAudioService: Stopping music in ${this.currentAudioMode} mode`);
    
    // Stop Strudel music
    if (this.currentMusicPattern) {
      try {
        this.currentMusicPattern.stop();
        this.currentMusicPattern = null;
        Logger.log('HybridAudioService: Strudel music stopped');
      } catch (error) {
        Logger.log(`HybridAudioService: Error stopping Strudel music - ${error}`);
      }
    }

    // Stop all Phaser music
    if (this.phaserMusicSounds.size > 0) {
      this.phaserMusicSounds.forEach((sound, key) => {
        try {
          if (sound.isPlaying) {
            sound.stop();
          }
          sound.destroy();
          Logger.log(`HybridAudioService: Phaser music '${key}' stopped and destroyed`);
        } catch (error) {
          Logger.log(`HybridAudioService: Error stopping Phaser music '${key}' - ${error}`);
        }
      });
      this.phaserMusicSounds.clear();
    }

    // Silent mode doesn't need any action but we log for consistency
    if (this.currentAudioMode === AudioMode.SILENT) {
      Logger.log('HybridAudioService: Stop music called in silent mode (no action needed)');
    }
  }

  pauseMusic(): void {
    Logger.log(`HybridAudioService: Pausing music in ${this.currentAudioMode} mode`);
    
    switch (this.currentAudioMode) {
      case AudioMode.STRUDEL:
        if (this.currentMusicPattern) {
          try {
            this.currentMusicPattern.pause();
            Logger.log('HybridAudioService: Strudel music paused');
          } catch (error) {
            Logger.log(`HybridAudioService: Error pausing Strudel music - ${error}`);
          }
        } else {
          Logger.log('HybridAudioService: No Strudel music pattern to pause');
        }
        break;
        
      case AudioMode.PHASER_ONLY:
        if (this.phaserMusicSounds.size > 0) {
          this.phaserMusicSounds.forEach((sound, key) => {
            try {
              if (sound.isPlaying) {
                sound.pause();
                Logger.log(`HybridAudioService: Phaser music '${key}' paused`);
              }
            } catch (error) {
              Logger.log(`HybridAudioService: Error pausing Phaser music '${key}' - ${error}`);
            }
          });
        } else {
          Logger.log('HybridAudioService: No Phaser music to pause');
        }
        break;
        
      case AudioMode.SILENT:
        Logger.log('HybridAudioService: Pause music called in silent mode (no action needed)');
        break;
        
      default:
        Logger.log(`HybridAudioService: Unknown audio mode '${this.currentAudioMode}' for pause operation`);
        break;
    }
  }

  resumeMusic(): void {
    Logger.log(`HybridAudioService: Resuming music in ${this.currentAudioMode} mode`);
    
    switch (this.currentAudioMode) {
      case AudioMode.STRUDEL:
        if (this.currentMusicPattern) {
          try {
            this.currentMusicPattern.resume();
            Logger.log('HybridAudioService: Strudel music resumed');
          } catch (error) {
            Logger.log(`HybridAudioService: Error resuming Strudel music - ${error}`);
          }
        } else {
          Logger.log('HybridAudioService: No Strudel music pattern to resume');
        }
        break;
        
      case AudioMode.PHASER_ONLY:
        if (this.phaserMusicSounds.size > 0) {
          this.phaserMusicSounds.forEach((sound, key) => {
            try {
              if (sound.isPaused) {
                sound.resume();
                Logger.log(`HybridAudioService: Phaser music '${key}' resumed`);
              } else if (!sound.isPlaying) {
                Logger.log(`HybridAudioService: Phaser music '${key}' was not paused, attempting to play`);
                sound.play();
              }
            } catch (error) {
              Logger.log(`HybridAudioService: Error resuming Phaser music '${key}' - ${error}`);
            }
          });
        } else {
          Logger.log('HybridAudioService: No Phaser music to resume');
        }
        break;
        
      case AudioMode.SILENT:
        Logger.log('HybridAudioService: Resume music called in silent mode (no action needed)');
        break;
        
      default:
        Logger.log(`HybridAudioService: Unknown audio mode '${this.currentAudioMode}' for resume operation`);
        break;
    }
  }

  // Sound effects using Phaser Audio (legacy method)
  playSound(key: string, volume?: number): void {
    // Handle silent mode gracefully
    if (this.currentAudioMode === AudioMode.SILENT) {
      // In silent mode, accept the call but don't play anything
      return;
    }

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

  /**
   * Get the SoundEffectLibrary instance for comprehensive sound effect management
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  getSoundEffectLibrary(): SoundEffectLibrary | null {
    return this.soundEffectLibrary;
  }

  /**
   * Get unified audio configuration
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  getAudioConfiguration(): AudioConfiguration {
    const soundConfig = this.soundEffectLibrary?.getConfig() || {
      volume: this.soundVolume,
      enabled: this.soundEnabled,
      categories: {
        ui: true,
        gameplay: true,
        effects: true,
      },
    };

    return {
      music: {
        volume: this.musicVolume,
        enabled: this.musicEnabled,
        currentTrack: this.currentMusicKey,
        fadeInDuration: this.musicFadeInDuration,
        fadeOutDuration: this.musicFadeOutDuration,
      },
      sound: soundConfig,
      system: {
        masterMute: !this.musicEnabled && !this.soundEnabled,
        audioMode: this.currentAudioMode,
        preloadComplete: this.audioAssetManager !== null,
        fallbackMode: this.currentAudioMode !== AudioMode.STRUDEL,
      },
    };
  }

  /**
   * Update unified audio configuration
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  updateAudioConfiguration(config: Partial<AudioConfiguration>): void {
    Logger.log(`HybridAudioService: Updating audio configuration: ${JSON.stringify(config)}`);

    // Update music configuration
    if (config.music) {
      if (config.music.volume !== undefined) {
        this.setMusicVolume(config.music.volume);
      }
      if (config.music.enabled !== undefined) {
        this.setMusicEnabled(config.music.enabled);
      }
      if (config.music.fadeInDuration !== undefined) {
        this.musicFadeInDuration = Math.max(0, config.music.fadeInDuration);
      }
      if (config.music.fadeOutDuration !== undefined) {
        this.musicFadeOutDuration = Math.max(0, config.music.fadeOutDuration);
      }
    }

    // Update sound configuration
    if (config.sound && this.soundEffectLibrary) {
      this.soundEffectLibrary.updateConfig(config.sound);
      
      // Sync with internal settings
      if (config.sound.volume !== undefined) {
        this.setSoundVolume(config.sound.volume);
      }
      if (config.sound.enabled !== undefined) {
        this.setSoundEnabled(config.sound.enabled);
      }
    }

    // Update system configuration
    if (config.system) {
      if (config.system.masterMute !== undefined) {
        const masterMute = config.system.masterMute;
        this.setMusicEnabled(!masterMute);
        this.setSoundEnabled(!masterMute);
      }
      
      if (config.system.audioMode !== undefined && config.system.audioMode !== this.currentAudioMode) {
        switch (config.system.audioMode) {
          case AudioMode.STRUDEL:
            // Reset to Strudel mode (will require re-initialization)
            this.resetInitializationState();
            break;
          case AudioMode.PHASER_ONLY:
            this.enableFallbackMode();
            break;
          case AudioMode.SILENT:
            this.enableSilentMode();
            break;
        }
      }
    }

    Logger.log(`HybridAudioService: Audio configuration updated successfully`);
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
        Logger.log(`HybridAudioService: Music disabled (mode: ${this.currentAudioMode})`);
      }
    });
  }

  setSoundEnabled(enabled: boolean): void {
    return Logger.withSilentLogging(() => {
      this.soundEnabled = enabled;
      
      // Sync with SoundEffectLibrary
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.setEnabled(enabled);
      }
      
      // Only log important state changes
      if (!enabled) {
        Logger.log(`HybridAudioService: Sound effects disabled (mode: ${this.currentAudioMode})`);
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
      
      // Update current music volume based on audio mode
      if (this.currentAudioMode === AudioMode.STRUDEL && this.currentMusicPattern) {
        try {
          this.currentMusicPattern.gain(this.musicVolume);
        } catch (error) {
          Logger.log(`HybridAudioService: Error updating Strudel music volume - ${error}`);
        }
      } else if (this.currentAudioMode === AudioMode.PHASER_ONLY) {
        // Update Phaser music volume
        this.phaserMusicSounds.forEach((sound, key) => {
          try {
            if ('setVolume' in sound) {
              (sound as any).setVolume(this.musicVolume);
            } else if ('volume' in sound) {
              (sound as any).volume = this.musicVolume;
            }
          } catch (error) {
            Logger.log(`HybridAudioService: Error updating Phaser music volume for '${key}' - ${error}`);
          }
        });
      }
      // Silent mode: volume changes are stored but not applied
      
      // Only log significant volume changes
      if (volume === 0 || volume === 1) {
        Logger.log(`HybridAudioService: Music volume set to ${this.musicVolume} (mode: ${this.currentAudioMode})`);
      }
    });
  }

  setSoundVolume(volume: number): void {
    return Logger.withSilentLogging(() => {
      this.soundVolume = Math.max(0, Math.min(1, volume));
      
      // Sync with SoundEffectLibrary
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.setVolume(this.soundVolume);
      }
      
      // Only log significant volume changes
      if (volume === 0 || volume === 1) {
        Logger.log(`HybridAudioService: Sound volume set to ${this.soundVolume}`);
      }
    });
  }

  /**
   * Resets initialization state for scene changes or manual retry
   */
  resetInitializationState(): void {
    Logger.log('HybridAudioService: Resetting initialization state');
    Logger.log(`HybridAudioService: Previous state - Attempts: ${this.initializationAttempts}, Last error: ${this.lastInitializationError || 'none'}`);
    
    this.strudelInitialized = false;
    this.initializationAttempts = 0;
    this.initializationPromise = null;
    this.lastInitializationError = null;
    this.currentAudioMode = AudioMode.STRUDEL; // Reset to default mode
    this.stopMusic();
    
    Logger.log('HybridAudioService: Initialization state reset - ready for new attempts');
  }

  /**
   * Get initialization attempt tracking information
   */
  getInitializationAttempts(): number {
    return this.initializationAttempts;
  }

  /**
   * Get maximum allowed initialization attempts
   */
  getMaxInitializationAttempts(): number {
    return this.maxInitializationAttempts;
  }

  /**
   * Get the last initialization error
   */
  getLastInitializationError(): string | null {
    return this.lastInitializationError;
  }

  /**
   * Check if initialization attempts have been exhausted
   */
  isInitializationAttemptsExhausted(): boolean {
    return this.initializationAttempts >= this.maxInitializationAttempts;
  }

  /**
   * Get a summary of initialization history for debugging
   */
  private getInitializationHistorySummary(): string {
    if (this.initializationHistory.length === 0) {
      return 'No attempts yet';
    }

    const summary = this.initializationHistory.map(entry => {
      const status = entry.success ? 'SUCCESS' : 'FAILED';
      const error = entry.error ? ` (${entry.error})` : '';
      return `#${entry.attempt}: ${status} in ${entry.duration}ms${error}`;
    }).join(', ');

    return summary;
  }

  /**
   * Get full initialization history for detailed debugging
   */
  getInitializationHistory(): Array<{
    attempt: number;
    timestamp: number;
    success: boolean;
    duration: number;
    error?: string;
  }> {
    return [...this.initializationHistory]; // Return a copy to prevent external modification
  }

  /**
   * Get the current audio mode
   */
  getCurrentAudioMode(): AudioMode {
    return this.currentAudioMode;
  }

  /**
   * Enable fallback mode using Phaser-only audio
   */
  enableFallbackMode(): void {
    const previousMode = this.currentAudioMode;
    AudioLogger.logFallbackActivation(previousMode, AudioMode.PHASER_ONLY, 'Manual fallback activation');
    AudioLogger.logStateTransition(previousMode, AudioMode.PHASER_ONLY, 'enableFallbackMode() called');
    
    this.currentAudioMode = AudioMode.PHASER_ONLY;
    this.strudelInitialized = false; // Disable Strudel
    
    // Stop any current Strudel music
    if (this.currentMusicPattern) {
      try {
        AudioLogger.logInitializationProgress('Stopping Strudel music during fallback transition');
        this.currentMusicPattern.stop();
        this.currentMusicPattern = null;
      } catch (error) {
        AudioLogger.logError('Stopping Strudel during fallback', error);
      }
    }
    
    AudioLogger.logInitializationProgress('Fallback mode enabled', {
      mode: AudioMode.PHASER_ONLY,
      phaserAvailable: this.phaserAudioInitialized,
      previousMode
    });
  }

  /**
   * Enable silent mode (no audio)
   */
  enableSilentMode(): void {
    const previousMode = this.currentAudioMode;
    AudioLogger.logFallbackActivation(previousMode, AudioMode.SILENT, 'Silent mode activation');
    AudioLogger.logStateTransition(previousMode, AudioMode.SILENT, 'enableSilentMode() called');
    
    this.currentAudioMode = AudioMode.SILENT;
    this.strudelInitialized = false;
    this.stopMusic();
    
    AudioLogger.logInitializationProgress('Silent mode enabled', {
      mode: AudioMode.SILENT,
      previousMode,
      reason: 'All audio systems failed or disabled'
    });
  }

  /**
   * Get the AudioAssetManager instance for advanced asset management
   */
  getAudioAssetManager(): AudioAssetManager | null {
    return this.audioAssetManager;
  }

  /**
   * Collect comprehensive audio diagnostics
   * Requirements: 4.2, 4.5
   */
  private collectAudioDiagnostics(): AudioDiagnostics {
    const audioContext = getAudioContext() || (window as any).audioContext;
    
    const diagnostics: AudioDiagnostics = {
      audioContextState: audioContext?.state || 'unavailable',
      audioContextSampleRate: audioContext?.sampleRate || null,
      userActivation: (navigator as any).userActivation?.hasBeenActive || false,
      documentVisibility: document.visibilityState,
      networkStatus: (navigator as any).onLine ? 'online' : 'offline',
      browserInfo: `${navigator.userAgent.split(' ')[0]} ${navigator.userAgent.split(' ')[1] || ''}`,
      timestamp: Date.now()
    };

    // Add memory usage if available
    if ('memory' in performance) {
      diagnostics.memoryUsage = {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      };
    }


    return diagnostics;
  }

  /**
   * Create a structured audio error with diagnostics
   * Requirements: 4.2, 4.5
   */
  private createAudioError(
    type: AudioErrorType,
    message: string,
    originalError?: any,
    context?: any
  ): AudioError {
    const diagnostics = this.collectAudioDiagnostics();
    
    const audioError: AudioError = {
      type,
      message,
      originalError,
      context: { ...context, diagnostics },
      timestamp: Date.now(),
      recoverable: this.isErrorRecoverable(type),
      recoveryAction: this.getRecoveryAction(type)
    };

    // Add to error history
    this.errorHistory.push(audioError);
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }

    // Log the error with full context
    AudioLogger.logError(`${type}`, originalError || message, audioError.context);
    AudioLogger.logDiagnostics(`Error: ${type}`, diagnostics);

    return audioError;
  }

  /**
   * Determine if an error type is recoverable
   * Requirements: 4.2, 4.5
   */
  private isErrorRecoverable(type: AudioErrorType): boolean {
    switch (type) {
      case AudioErrorType.CONTEXT_SUSPENDED:
      case AudioErrorType.TIMEOUT:
      case AudioErrorType.NETWORK_ERROR:
      case AudioErrorType.ASSET_LOADING_FAILED:
        return true;
      case AudioErrorType.PERMISSION_DENIED:
      case AudioErrorType.HARDWARE_UNAVAILABLE:
      case AudioErrorType.MEMORY_EXHAUSTED:
        return false;
      case AudioErrorType.INITIALIZATION_FAILED:
      case AudioErrorType.PLAYBACK_FAILED:
        return this.criticalErrorsCount < this.maxCriticalErrors;
      default:
        return true;
    }
  }

  /**
   * Get recovery action for error type
   * Requirements: 4.2, 4.5
   */
  private getRecoveryAction(type: AudioErrorType): string {
    switch (type) {
      case AudioErrorType.CONTEXT_SUSPENDED:
        return 'Resume AudioContext on user interaction';
      case AudioErrorType.TIMEOUT:
        return 'Retry with increased timeout or fallback mode';
      case AudioErrorType.INITIALIZATION_FAILED:
        return 'Switch to fallback audio mode';
      case AudioErrorType.ASSET_LOADING_FAILED:
        return 'Use placeholder audio or silent mode';
      case AudioErrorType.PLAYBACK_FAILED:
        return 'Retry playback or use alternative audio method';
      case AudioErrorType.NETWORK_ERROR:
        return 'Retry when network is available';
      case AudioErrorType.PERMISSION_DENIED:
        return 'Request user permission or use silent mode';
      case AudioErrorType.HARDWARE_UNAVAILABLE:
        return 'Switch to silent mode';
      case AudioErrorType.MEMORY_EXHAUSTED:
        return 'Clear audio cache and use minimal audio';
      default:
        return 'Switch to fallback mode or silent mode';
    }
  }

  /**
   * Attempt automatic recovery from audio errors
   * Requirements: 4.2, 4.5
   */
  private async attemptAutoRecovery(error: AudioError): Promise<boolean> {
    if (!this.autoRecoveryEnabled || !error.recoverable) {
      AudioLogger.logRecoveryAttempt(error.type, 'skipped - not recoverable or disabled', 0);
      return false;
    }

    const currentAttempts = this.recoveryAttempts.get(error.type) || 0;
    if (currentAttempts >= this.maxRecoveryAttempts) {
      AudioLogger.logRecoveryAttempt(error.type, 'skipped - max attempts reached', currentAttempts);
      return false;
    }

    this.recoveryAttempts.set(error.type, currentAttempts + 1);
    AudioLogger.logRecoveryAttempt(error.type, error.recoveryAction || 'unknown', currentAttempts + 1);

    try {
      switch (error.type) {
        case AudioErrorType.CONTEXT_SUSPENDED:
          return await this.recoverFromSuspendedContext();
        
        case AudioErrorType.TIMEOUT:
          return await this.recoverFromTimeout();
        
        case AudioErrorType.INITIALIZATION_FAILED:
          return await this.recoverFromInitializationFailure();
        
        case AudioErrorType.ASSET_LOADING_FAILED:
          return await this.recoverFromAssetLoadingFailure();
        
        case AudioErrorType.PLAYBACK_FAILED:
          return await this.recoverFromPlaybackFailure();
        
        case AudioErrorType.NETWORK_ERROR:
          return await this.recoverFromNetworkError();
        
        default:
          // Generic recovery: switch to fallback mode
          this.enableFallbackMode();
          return true;
      }
    } catch (recoveryError) {
      AudioLogger.logError(`Recovery failed for ${error.type}`, recoveryError);
      return false;
    }
  }

  /**
   * Recovery methods for specific error types
   * Requirements: 4.2, 4.5
   */
  private async recoverFromSuspendedContext(): Promise<boolean> {
    const audioContext = getAudioContext() || (window as any).audioContext;
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        AudioLogger.logInitializationProgress('AudioContext resumed successfully');
        return true; // Resume was successful
      } catch (error) {
        AudioLogger.logError('AudioContext resume failed', error);
        return false;
      }
    }
    return false;
  }

  private async recoverFromTimeout(): Promise<boolean> {
    // Increase timeout and retry, or switch to fallback mode
    if (this.currentAudioMode === AudioMode.STRUDEL) {
      AudioLogger.logInitializationProgress('Timeout recovery: switching to fallback mode');
      this.enableFallbackMode();
      return true;
    }
    return false;
  }

  private async recoverFromInitializationFailure(): Promise<boolean> {
    // Reset initialization state and try fallback mode
    this.resetInitializationState();
    if (this.currentAudioMode === AudioMode.STRUDEL) {
      this.enableFallbackMode();
      return true;
    } else if (this.currentAudioMode === AudioMode.PHASER_ONLY) {
      this.enableSilentMode();
      return true;
    }
    return false;
  }

  private async recoverFromAssetLoadingFailure(): Promise<boolean> {
    // Continue with available assets or use placeholders
    AudioLogger.logInitializationProgress('Asset loading failure recovery: continuing with available assets');
    return true; // Always recoverable - we can work without some assets
  }

  private async recoverFromPlaybackFailure(): Promise<boolean> {
    // Try alternative playback method or switch modes
    if (this.currentAudioMode === AudioMode.STRUDEL) {
      this.enableFallbackMode();
      return true;
    }
    return false;
  }

  private async recoverFromNetworkError(): Promise<boolean> {
    // Wait for network or use cached assets
    if ((navigator as any).onLine) {
      AudioLogger.logInitializationProgress('Network recovered, retrying audio operations');
      return true;
    }
    return false;
  }

  /**
   * Handle audio system failures with comprehensive error handling
   * Requirements: 4.2, 4.5
   */
  private async handleAudioSystemFailure(
    operation: string,
    originalError: any,
    errorType: AudioErrorType = AudioErrorType.UNKNOWN,
    context?: any
  ): Promise<void> {
    // Create structured error
    const audioError = this.createAudioError(
      errorType,
      `Audio system failure during ${operation}`,
      originalError,
      { operation, ...context }
    );

    // Track critical errors
    if (!audioError.recoverable) {
      this.criticalErrorsCount++;
    }

    // Attempt automatic recovery
    const recovered = await this.attemptAutoRecovery(audioError);
    
    if (!recovered) {
      // If recovery failed, ensure we're in a safe state
      if (this.criticalErrorsCount >= this.maxCriticalErrors) {
        AudioLogger.logError('Critical error threshold reached', 'Switching to silent mode');
        this.enableSilentMode();
      } else if (this.currentAudioMode === AudioMode.STRUDEL) {
        AudioLogger.logError('Recovery failed', 'Switching to fallback mode');
        this.enableFallbackMode();
      }
    }
  }

  /**
   * Get comprehensive error history and diagnostics
   * Requirements: 4.2, 4.5
   */
  getErrorHistory(): AudioError[] {
    return [...this.errorHistory];
  }

  /**
   * Get current audio diagnostics
   * Requirements: 4.2, 4.5
   */
  getCurrentDiagnostics(): AudioDiagnostics {
    return this.collectAudioDiagnostics();
  }

  /**
   * Enable or disable automatic error recovery
   * Requirements: 4.2, 4.5
   */
  setAutoRecoveryEnabled(enabled: boolean): void {
    this.autoRecoveryEnabled = enabled;
    AudioLogger.logInitializationProgress(`Auto recovery ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear error history and reset recovery attempts
   * Requirements: 4.2, 4.5
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.recoveryAttempts.clear();
    this.criticalErrorsCount = 0;
    AudioLogger.logInitializationProgress('Error history cleared');
  }

  /**
   * Get debug information about the current audio state
   */
  getAudioDebugInfo(): string {
    const debugInfo = {
      mode: this.currentAudioMode,
      initialized: this.initialized,
      strudelInitialized: this.strudelInitialized,
      phaserAudioInitialized: this.phaserAudioInitialized,
      musicEnabled: this.musicEnabled,
      soundEnabled: this.soundEnabled,
      musicVolume: this.musicVolume,
      soundVolume: this.soundVolume,
      initializationAttempts: this.initializationAttempts,
      maxAttempts: this.maxInitializationAttempts,
      lastError: this.lastInitializationError,
      attemptsExhausted: this.isInitializationAttemptsExhausted(),
      activePhaserSounds: this.phaserMusicSounds.size,
      hasStrudelPattern: !!this.currentMusicPattern,
      historyCount: this.initializationHistory.length,
      errorHistoryCount: this.errorHistory.length,
      criticalErrors: this.criticalErrorsCount,
      autoRecovery: this.autoRecoveryEnabled
    };
    
    const errorInfo = debugInfo.lastError ? ` | LastError: ${debugInfo.lastError.substring(0, 30)}...` : '';
    const exhaustedInfo = debugInfo.attemptsExhausted ? ' | EXHAUSTED' : '';
    const criticalInfo = debugInfo.criticalErrors > 0 ? ` | Critical: ${debugInfo.criticalErrors}` : '';
    
    return `AudioMode: ${debugInfo.mode} | Init: ${debugInfo.initialized} | Strudel: ${debugInfo.strudelInitialized} | Phaser: ${debugInfo.phaserAudioInitialized} | Music: ${debugInfo.musicEnabled} | Sound: ${debugInfo.soundEnabled} | Attempts: ${debugInfo.initializationAttempts}/${debugInfo.maxAttempts}${exhaustedInfo} | History: ${debugInfo.historyCount} | Errors: ${debugInfo.errorHistoryCount}${criticalInfo} | AutoRecovery: ${debugInfo.autoRecovery}${errorInfo}`;
  }

  destroy(): void {
    this.stopMusic();
    this.phaserMusicSounds.clear();
    
    // Cleanup AudioAssetManager
    if (this.audioAssetManager) {
      this.audioAssetManager.destroy();
      this.audioAssetManager = null;
    }
    
    // Cleanup SoundEffectLibrary
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.destroy();
      this.soundEffectLibrary = null;
    }
    
    this.scene = null;
    this.initialized = false;
    this.strudelInitialized = false;
    this.phaserAudioInitialized = false;
    this.initializationAttempts = 0;
    this.initializationPromise = null;
    this.lastInitializationError = null;
    this.initializationHistory = [];
    this.currentAudioMode = AudioMode.STRUDEL;
    this.currentMusicKey = null;
    this.activeMusicTransition = null;
    
    // Clear error handling state
    this.errorHistory = [];
    this.recoveryAttempts.clear();
    this.criticalErrorsCount = 0;
    
    Logger.log('HybridAudioService: Destroyed');
  }
}

// Export singleton instance
export const hybridAudioService = HybridAudioServiceImpl.getInstance();
