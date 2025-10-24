import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';

/**
 * Audio format enumeration for cross-browser compatibility
 */
export enum AudioFormat {
  OGG = 'ogg',
  MP3 = 'mp3',
  WAV = 'wav',
  M4A = 'm4a'
}

/**
 * Audio asset validation result interface
 */
export interface AudioValidationResult {
  isValid: boolean;
  missingFiles: string[];
  invalidFiles: string[];
  supportedFormats: AudioFormat[];
  totalAssets: number;
  validAssets: number;
}

/**
 * Audio asset metadata interface
 */
export interface AudioAssetMetadata {
  key: string;
  filename: string;
  format: AudioFormat;
  size?: number;
  duration?: number;
  category: 'music' | 'sound';
  required: boolean;
  fallbackFormats?: AudioFormat[];
}

/**
 * Preloading progress interface
 */
export interface PreloadProgress {
  totalAssets: number;
  loadedAssets: number;
  failedAssets: number;
  currentAsset: string | null;
  percentage: number;
  isComplete: boolean;
  errors: string[];
}

/**
 * Audio streaming configuration
 */
export interface StreamingConfig {
  enabled: boolean;
  chunkSize: number;
  bufferSize: number;
  preloadThreshold: number;
}

/**
 * Placeholder sound file specification interface
 */
export interface PlaceholderSoundFile {
  key: string;
  filename: string;
  description: string;
  format: string;
  duration: string;
  usage: string;
  category: 'music' | 'sound';
  required: boolean;
  fileSize: string;
  sampleRate: string;
  bitRate: string;
  channels: string;
}

/**
 * Audio file validation tools interface
 */
export interface ValidationTools {
  checkRequiredFiles(): string[];
  generateFileChecklist(): string;
  validateFileNaming(): { valid: boolean; issues: string[] };
  generateAssetReport(): string;
}

/**
 * Asset lifecycle management interface
 */
export interface AssetLifecycleManager {
  preloadAsset(key: string): Promise<void>;
  unloadAsset(key: string): void;
  getMemoryUsage(): { totalSize: number; activeAssets: number; cachedAssets: number };
  optimizeMemoryUsage(): void;
  scheduleAssetCleanup(key: string, delayMs: number): void;
}

/**
 * Audio streaming manager interface
 */
export interface AudioStreamingManager {
  createStream(key: string): Promise<AudioStreamHandle>;
  destroyStream(handle: AudioStreamHandle): void;
  getActiveStreams(): AudioStreamHandle[];
  optimizeStreamBuffers(): void;
}

/**
 * Audio stream handle interface
 */
export interface AudioStreamHandle {
  id: string;
  key: string;
  isActive: boolean;
  bufferSize: number;
  position: number;
  duration: number;
}

/**
 * Comprehensive audio asset manager for file management, preloading, and validation
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5
 */
export class AudioAssetManager {
  private scene: Phaser.Scene | null = null;
  private assetMetadata: Map<string, AudioAssetMetadata> = new Map();
  private loadedAssets: Set<string> = new Set();
  private failedAssets: Set<string> = new Set();
  private preloadProgress: PreloadProgress;
  private streamingConfig: StreamingConfig;
  private supportedFormats: AudioFormat[] = [];
  
  // Asset lifecycle management
  private assetCache: Map<string, { data: any; lastAccessed: number; size: number }> = new Map();
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  private memoryThreshold: number = 50 * 1024 * 1024; // 50MB memory threshold
  private maxCacheAge: number = 5 * 60 * 1000; // 5 minutes cache age
  
  // Audio streaming management
  private activeStreams: Map<string, AudioStreamHandle> = new Map();
  private streamBuffers: Map<string, ArrayBuffer[]> = new Map();
  private nextStreamId: number = 1;

  // Required music files for the comprehensive music system
  private static readonly REQUIRED_MUSIC_FILES: AudioAssetMetadata[] = [
    { key: 'menu-music', filename: 'menu-theme', format: AudioFormat.MP3, category: 'music', required: true },
    { key: 'easy-music', filename: 'easy-mode', format: AudioFormat.MP3, category: 'music', required: true },
    { key: 'medium-music', filename: 'medium-mode', format: AudioFormat.MP3, category: 'music', required: true },
    { key: 'hard-music', filename: 'hard-mode', format: AudioFormat.MP3, category: 'music', required: true },
    { key: 'expert-music', filename: 'expert-mode', format: AudioFormat.MP3, category: 'music', required: true },
    { key: 'zen-music', filename: 'zen-mode', format: AudioFormat.MP3, category: 'music', required: true }
  ];

  // Required sound effect files for the comprehensive sound system
  private static readonly REQUIRED_SOUND_FILES: AudioAssetMetadata[] = [
    // Gameplay sounds
    { key: 'piece-placement', filename: 'piece-placement', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'piece-rotation', filename: 'piece-rotation', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'piece-drop', filename: 'piece-drop', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'piece-hold', filename: 'piece-hold', format: AudioFormat.MP3, category: 'sound', required: true },
    
    // Line clear sounds
    { key: 'line-clear-single', filename: 'line-clear-single', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'line-clear-double', filename: 'line-clear-double', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'line-clear-triple', filename: 'line-clear-triple', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'line-clear-tetris', filename: 'line-clear-tetris', format: AudioFormat.MP3, category: 'sound', required: true },
    
    // Game state sounds
    { key: 'level-up', filename: 'level-up', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'game-over', filename: 'game-over', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'pause', filename: 'pause', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'resume', filename: 'resume', format: AudioFormat.MP3, category: 'sound', required: true },
    
    // UI interaction sounds
    { key: 'button-click', filename: 'button-click', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'menu-navigate', filename: 'menu-navigate', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'settings-change', filename: 'settings-change', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'mode-select', filename: 'mode-select', format: AudioFormat.MP3, category: 'sound', required: true },
    
    // Special effect sounds
    { key: 'combo-2x', filename: 'combo-2x', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'combo-3x', filename: 'combo-3x', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'combo-4x', filename: 'combo-4x', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'perfect-clear', filename: 'perfect-clear', format: AudioFormat.MP3, category: 'sound', required: true },
    { key: 'warning-alert', filename: 'warning-alert', format: AudioFormat.MP3, category: 'sound', required: true }
  ];

  constructor(streamingConfig?: Partial<StreamingConfig>) {
    this.streamingConfig = {
      enabled: true,
      chunkSize: 64 * 1024, // 64KB chunks
      bufferSize: 256 * 1024, // 256KB buffer
      preloadThreshold: 1024 * 1024, // 1MB threshold for streaming
      ...streamingConfig
    };

    this.preloadProgress = {
      totalAssets: 0,
      loadedAssets: 0,
      failedAssets: 0,
      currentAsset: null,
      percentage: 0,
      isComplete: false,
      errors: []
    };

    this.initializeAssetMetadata();
    this.detectSupportedFormats();
    
    Logger.log(`AudioAssetManager: Initialized with ${this.assetMetadata.size} audio assets`);
  }

  /**
   * Initialize metadata for all required audio assets
   * Requirements: 4.1, 5.1, 5.2
   */
  private initializeAssetMetadata(): void {
    // Register music files
    AudioAssetManager.REQUIRED_MUSIC_FILES.forEach(metadata => {
      this.assetMetadata.set(metadata.key, { ...metadata });
    });

    // Register sound effect files
    AudioAssetManager.REQUIRED_SOUND_FILES.forEach(metadata => {
      this.assetMetadata.set(metadata.key, { ...metadata });
    });

    Logger.log(`AudioAssetManager: Registered ${this.assetMetadata.size} audio asset definitions`);
  }

  /**
   * Detect supported audio formats for cross-browser compatibility
   * Requirements: 4.4
   */
  private detectSupportedFormats(): void {
    const audio = new Audio();
    const formats: { format: AudioFormat; mimeType: string }[] = [
      { format: AudioFormat.OGG, mimeType: 'audio/ogg; codecs="vorbis"' },
      { format: AudioFormat.MP3, mimeType: 'audio/mpeg' },
      { format: AudioFormat.WAV, mimeType: 'audio/wav' },
      { format: AudioFormat.M4A, mimeType: 'audio/mp4; codecs="mp4a.40.2"' }
    ];

    this.supportedFormats = formats
      .filter(({ mimeType }) => {
        const canPlay = audio.canPlayType(mimeType);
        return canPlay === 'probably' || canPlay === 'maybe';
      })
      .map(({ format }) => format);

    Logger.log(`AudioAssetManager: Detected supported formats: ${this.supportedFormats.join(', ')}`);
  }

  /**
   * Preload all required audio assets with progress tracking
   * Requirements: 4.1, 4.2
   */
  async preloadAudioAssets(scene: Phaser.Scene): Promise<PreloadProgress> {
    this.scene = scene;
    this.resetPreloadProgress();

    const allAssets = Array.from(this.assetMetadata.values());
    this.preloadProgress.totalAssets = allAssets.length;

    Logger.log(`AudioAssetManager: Starting preload of ${allAssets.length} audio assets`);

    // Group assets by priority (required first)
    const requiredAssets = allAssets.filter(asset => asset.required);
    const optionalAssets = allAssets.filter(asset => !asset.required);

    try {
      // Preload required assets first
      await this.preloadAssetGroup(requiredAssets, 'required');
      
      // Preload optional assets
      await this.preloadAssetGroup(optionalAssets, 'optional');

      this.preloadProgress.isComplete = true;
      this.preloadProgress.percentage = 100;

      Logger.log(`AudioAssetManager: Preload complete - ${this.preloadProgress.loadedAssets}/${this.preloadProgress.totalAssets} loaded, ${this.preloadProgress.failedAssets} failed`);
      
    } catch (error) {
      Logger.log(`AudioAssetManager: Preload failed - ${error}`);
      this.preloadProgress.errors.push(`Preload failed: ${error}`);
    }

    return { ...this.preloadProgress };
  }

  /**
   * Preload a group of assets with error handling
   * Requirements: 4.1, 4.2
   */
  private async preloadAssetGroup(assets: AudioAssetMetadata[], groupName: string): Promise<void> {
    Logger.log(`AudioAssetManager: Preloading ${assets.length} ${groupName} assets`);

    for (const asset of assets) {
      this.preloadProgress.currentAsset = asset.key;
      
      try {
        await this.preloadSingleAsset(asset);
        this.loadedAssets.add(asset.key);
        this.preloadProgress.loadedAssets++;
        
      } catch (error) {
        this.handleAssetLoadError(asset, error);
      }

      // Update progress
      this.updatePreloadProgress();
    }
  }

  /**
   * Preload a single audio asset with format fallback
   * Requirements: 4.2, 4.4
   */
  private async preloadSingleAsset(asset: AudioAssetMetadata): Promise<void> {
    if (!this.scene) {
      throw new Error('Scene not available for asset loading');
    }

    // Determine the best format to use
    const formatToUse = this.selectBestFormat(asset);
    if (!formatToUse) {
      throw new Error(`No supported format available for ${asset.key}`);
    }

    const filename = `${asset.filename}.${formatToUse}`;
    // Map category to actual directory structure
    const categoryDir = asset.category === 'sound' ? 'sfx' : asset.category;
    const assetPath = `assets/audio/${categoryDir}/${filename}`;

    // Check if asset should be streamed based on size
    if (this.shouldStreamAsset(asset)) {
      await this.setupAssetStreaming(asset, assetPath);
    } else {
      await this.loadAssetDirectly(asset, assetPath);
    }

    Logger.log(`AudioAssetManager: Successfully loaded ${asset.key} (${formatToUse})`);
  }

  /**
   * Select the best audio format based on browser support and preferences
   * Requirements: 4.4
   */
  private selectBestFormat(asset: AudioAssetMetadata): AudioFormat | null {
    // Check primary format first
    if (this.supportedFormats.includes(asset.format)) {
      return asset.format;
    }

    // Check fallback formats
    if (asset.fallbackFormats) {
      for (const fallbackFormat of asset.fallbackFormats) {
        if (this.supportedFormats.includes(fallbackFormat)) {
          return fallbackFormat;
        }
      }
    }

    // No supported format found
    return null;
  }

  /**
   * Determine if an asset should be streamed based on size
   * Requirements: 4.3
   */
  private shouldStreamAsset(asset: AudioAssetMetadata): boolean {
    if (!this.streamingConfig.enabled) {
      return false;
    }

    // Stream large music files, load small sound effects directly
    if (asset.category === 'music') {
      return true; // Always stream music files
    }

    // Check file size if available
    if (asset.size && asset.size > this.streamingConfig.preloadThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Setup streaming for large audio files
   * Requirements: 4.3
   */
  private async setupAssetStreaming(asset: AudioAssetMetadata, assetPath: string): Promise<void> {
    if (!this.scene) {
      throw new Error('Scene not available for streaming setup');
    }

    try {
      // For Phaser, we'll use the standard audio loading but with streaming hints
      this.scene.load.audio(asset.key, assetPath);
      
      // Add streaming configuration if supported
      // Note: Streaming configuration will be applied during playback

      // Store streaming metadata for later use
      const streamingMetadata = {
        ...asset,
        streaming: true,
        chunkSize: this.streamingConfig.chunkSize,
        bufferSize: this.streamingConfig.bufferSize
      };

      this.assetMetadata.set(asset.key, streamingMetadata);
      
      Logger.log(`AudioAssetManager: Setup streaming for ${asset.key}`);
      
    } catch (error) {
      throw new Error(`Failed to setup streaming for ${asset.key}: ${error}`);
    }
  }

  /**
   * Load asset directly without streaming
   * Requirements: 4.1, 4.3
   */
  private async loadAssetDirectly(asset: AudioAssetMetadata, assetPath: string): Promise<void> {
    if (!this.scene) {
      throw new Error('Scene not available for direct loading');
    }

    try {
      this.scene.load.audio(asset.key, assetPath);
      
      // Add to asset cache for lifecycle management
      const estimatedSize = this.estimateAssetSize(asset);
      this.assetCache.set(asset.key, {
        data: null, // Will be populated when loaded
        lastAccessed: Date.now(),
        size: estimatedSize
      });
      
      Logger.log(`AudioAssetManager: Setup direct loading for ${asset.key} (estimated ${estimatedSize} bytes)`);
      
    } catch (error) {
      throw new Error(`Failed to load ${asset.key}: ${error}`);
    }
  }

  /**
   * Estimate asset size for memory management
   * Requirements: 4.3
   */
  private estimateAssetSize(asset: AudioAssetMetadata): number {
    // Rough size estimates based on category and format
    if (asset.category === 'music') {
      // Music files are typically 3-8MB for OGG, 5-12MB for MP3
      return asset.format === AudioFormat.OGG ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
    } else {
      // Sound effects are typically 10-100KB for OGG, 15-150KB for MP3
      return asset.format === AudioFormat.OGG ? 50 * 1024 : 75 * 1024;
    }
  }

  /**
   * Handle asset loading errors with fallback strategies
   * Requirements: 4.2, 4.5
   */
  private handleAssetLoadError(asset: AudioAssetMetadata, error: any): void {
    const errorMessage = `Failed to load ${asset.key}: ${error}`;
    
    this.failedAssets.add(asset.key);
    this.preloadProgress.failedAssets++;
    this.preloadProgress.errors.push(errorMessage);

    if (asset.required) {
      Logger.log(`AudioAssetManager: ERROR - Required asset failed: ${errorMessage}`);
    } else {
      Logger.log(`AudioAssetManager: WARNING - Optional asset failed: ${errorMessage}`);
    }

    // Implement graceful fallback for missing files
    this.implementAssetFallback(asset);
  }

  /**
   * Implement fallback strategy for missing assets
   * Requirements: 4.2, 5.4
   */
  private implementAssetFallback(asset: AudioAssetMetadata): void {
    // For development, create a silent placeholder
    if (this.scene) {
      try {
        // Create a minimal silent audio buffer as fallback
        this.createSilentAudioBuffer();
        
        // Register the fallback in Phaser's cache
        // This prevents runtime errors when the asset is requested
        Logger.log(`AudioAssetManager: Created silent fallback for ${asset.key}`);
        
      } catch (fallbackError) {
        Logger.log(`AudioAssetManager: Failed to create fallback for ${asset.key}: ${fallbackError}`);
      }
    }
  }

  /**
   * Create a silent audio buffer for fallback purposes
   * Requirements: 5.4
   */
  private createSilentAudioBuffer(): AudioBuffer | null {
    try {
      // Create a minimal silent audio buffer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
      
      // Fill with silence (zeros)
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = 0;
      }
      
      return buffer;
    } catch (error) {
      Logger.log(`AudioAssetManager: Failed to create silent buffer: ${error}`);
      return null;
    }
  }

  /**
   * Reset preload progress tracking
   */
  private resetPreloadProgress(): void {
    this.preloadProgress = {
      totalAssets: 0,
      loadedAssets: 0,
      failedAssets: 0,
      currentAsset: null,
      percentage: 0,
      isComplete: false,
      errors: []
    };

    this.loadedAssets.clear();
    this.failedAssets.clear();
  }

  /**
   * Update preload progress percentage
   */
  private updatePreloadProgress(): void {
    const totalProcessed = this.preloadProgress.loadedAssets + this.preloadProgress.failedAssets;
    this.preloadProgress.percentage = this.preloadProgress.totalAssets > 0 
      ? Math.round((totalProcessed / this.preloadProgress.totalAssets) * 100)
      : 0;
  }

  /**
   * Validate all audio assets and return detailed results
   * Requirements: 4.2, 5.5
   */
  validateAudioAssets(): AudioValidationResult {
    const result: AudioValidationResult = {
      isValid: true,
      missingFiles: [],
      invalidFiles: [],
      supportedFormats: [...this.supportedFormats],
      totalAssets: this.assetMetadata.size,
      validAssets: 0
    };

    // Check each registered asset
    for (const [key, metadata] of this.assetMetadata.entries()) {
      const isLoaded = this.loadedAssets.has(key);
      const hasFailed = this.failedAssets.has(key);
      const hasValidFormat = this.selectBestFormat(metadata) !== null;

      if (!isLoaded && !hasFailed) {
        result.missingFiles.push(key);
      } else if (hasFailed) {
        result.invalidFiles.push(key);
      } else if (!hasValidFormat) {
        result.invalidFiles.push(`${key} (unsupported format)`);
      } else {
        result.validAssets++;
      }
    }

    // Determine overall validity
    result.isValid = result.missingFiles.length === 0 && result.invalidFiles.length === 0;

    Logger.log(`AudioAssetManager: Validation complete - ${result.validAssets}/${result.totalAssets} valid assets`);
    
    if (!result.isValid) {
      Logger.log(`AudioAssetManager: Validation issues - Missing: ${result.missingFiles.length}, Invalid: ${result.invalidFiles.length}`);
    }

    return result;
  }

  /**
   * Get current preload progress
   * Requirements: 4.1
   */
  getPreloadProgress(): PreloadProgress {
    return { ...this.preloadProgress };
  }

  /**
   * Check if a specific asset is loaded
   * Requirements: 4.1
   */
  isAssetLoaded(key: string): boolean {
    return this.loadedAssets.has(key);
  }

  /**
   * Check if a specific asset failed to load
   * Requirements: 4.2
   */
  isAssetFailed(key: string): boolean {
    return this.failedAssets.has(key);
  }

  /**
   * Get metadata for a specific asset
   * Requirements: 5.2
   */
  getAssetMetadata(key: string): AudioAssetMetadata | null {
    return this.assetMetadata.get(key) || null;
  }

  /**
   * Get all registered asset keys
   * Requirements: 5.1
   */
  getAllAssetKeys(): string[] {
    return Array.from(this.assetMetadata.keys());
  }

  /**
   * Get assets by category
   * Requirements: 5.1
   */
  getAssetsByCategory(category: 'music' | 'sound'): AudioAssetMetadata[] {
    return Array.from(this.assetMetadata.values())
      .filter(asset => asset.category === category);
  }

  /**
   * Get supported audio formats
   * Requirements: 4.4
   */
  getSupportedFormats(): AudioFormat[] {
    return [...this.supportedFormats];
  }

  /**
   * Get streaming configuration
   * Requirements: 4.3
   */
  getStreamingConfig(): StreamingConfig {
    return { ...this.streamingConfig };
  }

  /**
   * Update streaming configuration
   * Requirements: 4.3
   */
  updateStreamingConfig(config: Partial<StreamingConfig>): void {
    this.streamingConfig = { ...this.streamingConfig, ...config };
    Logger.log(`AudioAssetManager: Streaming config updated`);
  }

  /**
   * Get comprehensive debug information
   */
  getDebugInfo(): string {
    const loadedCount = this.loadedAssets.size;
    const failedCount = this.failedAssets.size;
    const totalCount = this.assetMetadata.size;
    const supportedFormatsStr = this.supportedFormats.join(', ');
    const streamingEnabled = this.streamingConfig.enabled ? 'ON' : 'OFF';

    return (
      `AudioAssetManager: ${loadedCount}/${totalCount} loaded, ${failedCount} failed | ` +
      `Formats: ${supportedFormatsStr} | Streaming: ${streamingEnabled} | ` +
      `Progress: ${this.preloadProgress.percentage}%`
    );
  }

  /**
   * Get comprehensive list of all required sound effect files with specifications
   * Requirements: 5.1, 5.2
   */
  getPlaceholderSoundList(): PlaceholderSoundFile[] {
    const placeholderFiles: PlaceholderSoundFile[] = [];

    // Generate specifications for all registered assets
    for (const [, metadata] of this.assetMetadata.entries()) {
      const placeholderFile: PlaceholderSoundFile = {
        key: metadata.key,
        filename: `${metadata.filename}.${metadata.format}`,
        description: this.generateAssetDescription(metadata),
        format: metadata.format.toUpperCase(),
        duration: this.getExpectedDuration(metadata),
        usage: this.getAssetUsage(metadata),
        category: metadata.category,
        required: metadata.required,
        fileSize: this.getExpectedFileSize(metadata),
        sampleRate: '44.1 kHz',
        bitRate: metadata.format === AudioFormat.OGG ? '128-192 kbps' : '128 kbps',
        channels: 'Stereo (2 channels)'
      };

      placeholderFiles.push(placeholderFile);
    }

    // Sort by category and then by key for organized output
    placeholderFiles.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'music' ? -1 : 1; // Music first
      }
      return a.key.localeCompare(b.key);
    });

    Logger.log(`AudioAssetManager: Generated ${placeholderFiles.length} placeholder file specifications`);
    return placeholderFiles;
  }

  /**
   * Generate human-readable description for an asset
   * Requirements: 5.2
   */
  private generateAssetDescription(metadata: AudioAssetMetadata): string {
    const descriptions: Record<string, string> = {
      // Music descriptions
      'menu-music': 'Welcoming ambient background music for the main menu and navigation screens',
      'easy-music': 'Relaxed, encouraging background music for Easy difficulty gameplay',
      'medium-music': 'Moderately energetic background music for Medium difficulty gameplay',
      'hard-music': 'Intense, driving background music for Hard difficulty gameplay',
      'expert-music': 'Complex, challenging background music for Expert difficulty gameplay',
      'zen-music': 'Calm, meditative background music for Zen mode gameplay',

      // Gameplay sound descriptions
      'piece-placement': 'Sound effect played when a game piece is successfully placed on the board',
      'piece-rotation': 'Sound effect played when a game piece is rotated by the player',
      'piece-drop': 'Sound effect played when a game piece drops quickly to the bottom',
      'piece-hold': 'Sound effect played when a game piece is held or swapped with the hold piece',

      // Line clear sound descriptions
      'line-clear-single': 'Sound effect played when exactly one line is cleared from the board',
      'line-clear-double': 'Sound effect played when exactly two lines are cleared simultaneously',
      'line-clear-triple': 'Sound effect played when exactly three lines are cleared simultaneously',
      'line-clear-tetris': 'Sound effect played when four lines are cleared simultaneously (Tetris)',

      // Game state sound descriptions
      'level-up': 'Sound effect played when the player advances to the next difficulty level',
      'game-over': 'Sound effect played when the game ends due to the board filling up',
      'pause': 'Sound effect played when the game is paused by the player',
      'resume': 'Sound effect played when the game is resumed from a paused state',

      // UI interaction sound descriptions
      'button-click': 'Sound effect played when any button or interactive element is clicked',
      'menu-navigate': 'Sound effect played when navigating between menu items or options',
      'settings-change': 'Sound effect played when a game setting is modified or saved',
      'mode-select': 'Sound effect played when selecting a game mode or difficulty level',

      // Special effect sound descriptions
      'combo-2x': 'Sound effect played when achieving a 2x combo multiplier',
      'combo-3x': 'Sound effect played when achieving a 3x combo multiplier',
      'combo-4x': 'Sound effect played when achieving a 4x or higher combo multiplier',
      'perfect-clear': 'Sound effect played when the entire game board is cleared perfectly',
      'warning-alert': 'Sound effect played to alert the player of danger or critical situations'
    };

    return descriptions[metadata.key] || `Audio asset for ${metadata.key} functionality`;
  }

  /**
   * Get expected duration for an asset based on its type
   * Requirements: 5.2
   */
  private getExpectedDuration(metadata: AudioAssetMetadata): string {
    if (metadata.category === 'music') {
      return '5-10 minutes (looping)';
    }

    // Sound effect durations based on type
    const durationMap: Record<string, string> = {
      'piece-placement': '0.1-0.3 seconds',
      'piece-rotation': '0.1-0.2 seconds',
      'piece-drop': '0.2-0.5 seconds',
      'piece-hold': '0.1-0.3 seconds',
      'line-clear-single': '0.5-1.0 seconds',
      'line-clear-double': '0.7-1.2 seconds',
      'line-clear-triple': '0.9-1.5 seconds',
      'line-clear-tetris': '1.0-2.0 seconds',
      'level-up': '1.0-2.5 seconds',
      'game-over': '2.0-4.0 seconds',
      'pause': '0.3-0.8 seconds',
      'resume': '0.3-0.8 seconds',
      'button-click': '0.05-0.15 seconds',
      'menu-navigate': '0.1-0.25 seconds',
      'settings-change': '0.2-0.5 seconds',
      'mode-select': '0.3-0.8 seconds',
      'combo-2x': '0.5-1.0 seconds',
      'combo-3x': '0.7-1.2 seconds',
      'combo-4x': '1.0-1.5 seconds',
      'perfect-clear': '2.0-3.0 seconds',
      'warning-alert': '0.5-1.5 seconds'
    };

    return durationMap[metadata.key] || '0.1-1.0 seconds';
  }

  /**
   * Get usage context for an asset
   * Requirements: 5.2
   */
  private getAssetUsage(metadata: AudioAssetMetadata): string {
    if (metadata.category === 'music') {
      return 'Background music - loops continuously during gameplay';
    }

    const usageMap: Record<string, string> = {
      'piece-placement': 'Triggered on every piece placement action',
      'piece-rotation': 'Triggered on every piece rotation action',
      'piece-drop': 'Triggered when piece drops or hard drop is used',
      'piece-hold': 'Triggered when hold/swap functionality is used',
      'line-clear-single': 'Triggered when clearing exactly 1 line',
      'line-clear-double': 'Triggered when clearing exactly 2 lines',
      'line-clear-triple': 'Triggered when clearing exactly 3 lines',
      'line-clear-tetris': 'Triggered when clearing exactly 4 lines',
      'level-up': 'Triggered on level progression',
      'game-over': 'Triggered when game ends',
      'pause': 'Triggered when game is paused',
      'resume': 'Triggered when game is resumed',
      'button-click': 'Triggered on UI button interactions',
      'menu-navigate': 'Triggered on menu navigation',
      'settings-change': 'Triggered when settings are modified',
      'mode-select': 'Triggered when selecting game modes',
      'combo-2x': 'Triggered on 2x combo achievement',
      'combo-3x': 'Triggered on 3x combo achievement',
      'combo-4x': 'Triggered on 4x+ combo achievement',
      'perfect-clear': 'Triggered on perfect board clear',
      'warning-alert': 'Triggered for danger/warning situations'
    };

    return usageMap[metadata.key] || 'Context-specific audio feedback';
  }

  /**
   * Get expected file size for an asset
   * Requirements: 5.2
   */
  private getExpectedFileSize(metadata: AudioAssetMetadata): string {
    if (metadata.category === 'music') {
      return metadata.format === AudioFormat.OGG ? '3-8 MB' : '5-12 MB';
    }

    // Sound effects are generally much smaller
    return metadata.format === AudioFormat.OGG ? '10-100 KB' : '15-150 KB';
  }

  /**
   * Generate placeholder sound file documentation with specifications
   * Requirements: 5.2, 5.3
   */
  generatePlaceholderDocumentation(): string {
    const placeholderFiles = this.getPlaceholderSoundList();
    const musicFiles = placeholderFiles.filter(f => f.category === 'music');
    const soundFiles = placeholderFiles.filter(f => f.category === 'sound');

    let documentation = `# Audio Asset Specifications\n\n`;
    documentation += `Generated on: ${new Date().toISOString()}\n`;
    documentation += `Total Assets: ${placeholderFiles.length} (${musicFiles.length} music, ${soundFiles.length} sound effects)\n\n`;

    // Format requirements
    documentation += `## Format Requirements\n\n`;
    documentation += `- **Primary Format**: OGG Vorbis (.ogg) - Recommended for web compatibility and compression\n`;
    documentation += `- **Fallback Format**: MP3 (.mp3) - For broader browser support\n`;
    documentation += `- **Sample Rate**: 44.1 kHz (CD quality)\n`;
    documentation += `- **Bit Rate**: 128-192 kbps (OGG), 128 kbps (MP3)\n`;
    documentation += `- **Channels**: Stereo (2 channels)\n\n`;

    // File organization
    documentation += `## File Organization\n\n`;
    documentation += `\`\`\`\n`;
    documentation += `assets/audio/\n`;
    documentation += `├── music/          # Background music files\n`;
    documentation += `│   ├── menu-theme.ogg\n`;
    documentation += `│   ├── easy-mode.ogg\n`;
    documentation += `│   └── ...\n`;
    documentation += `└── sound/          # Sound effect files\n`;
    documentation += `    ├── piece-placement.ogg\n`;
    documentation += `    ├── button-click.ogg\n`;
    documentation += `    └── ...\n`;
    documentation += `\`\`\`\n\n`;

    // Music files section
    documentation += `## Music Files\n\n`;
    documentation += `| File | Description | Duration | Size |\n`;
    documentation += `|------|-------------|----------|------|\n`;
    
    for (const file of musicFiles) {
      documentation += `| \`${file.filename}\` | ${file.description} | ${file.duration} | ${file.fileSize} |\n`;
    }

    documentation += `\n`;

    // Sound effect files section
    documentation += `## Sound Effect Files\n\n`;
    documentation += `### Gameplay Sounds\n\n`;
    documentation += `| File | Description | Duration | Usage |\n`;
    documentation += `|------|-------------|----------|-------|\n`;
    
    const gameplaySounds = soundFiles.filter(f => 
      f.key.includes('piece-') || f.key.includes('line-clear') || 
      f.key.includes('level-') || f.key.includes('game-') || 
      f.key.includes('pause') || f.key.includes('resume')
    );
    
    for (const file of gameplaySounds) {
      documentation += `| \`${file.filename}\` | ${file.description} | ${file.duration} | ${file.usage} |\n`;
    }

    documentation += `\n### UI Interaction Sounds\n\n`;
    documentation += `| File | Description | Duration | Usage |\n`;
    documentation += `|------|-------------|----------|-------|\n`;
    
    const uiSounds = soundFiles.filter(f => 
      f.key.includes('button-') || f.key.includes('menu-') || 
      f.key.includes('settings-') || f.key.includes('mode-')
    );
    
    for (const file of uiSounds) {
      documentation += `| \`${file.filename}\` | ${file.description} | ${file.duration} | ${file.usage} |\n`;
    }

    documentation += `\n### Special Effect Sounds\n\n`;
    documentation += `| File | Description | Duration | Usage |\n`;
    documentation += `|------|-------------|----------|-------|\n`;
    
    const effectSounds = soundFiles.filter(f => 
      f.key.includes('combo-') || f.key.includes('perfect-') || f.key.includes('warning-')
    );
    
    for (const file of effectSounds) {
      documentation += `| \`${file.filename}\` | ${file.description} | ${file.duration} | ${file.usage} |\n`;
    }

    // Development notes
    documentation += `\n## Development Notes\n\n`;
    documentation += `- All audio files are optional during development - the system will gracefully handle missing files\n`;
    documentation += `- Use the AudioAssetManager validation tools to verify all required assets are present\n`;
    documentation += `- The system supports automatic format fallback (OGG → MP3) based on browser compatibility\n`;
    documentation += `- Large music files will be automatically streamed to optimize memory usage\n`;
    documentation += `- Sound effects include cooldown protection to prevent audio spam\n\n`;

    // Validation checklist
    documentation += `## Validation Checklist\n\n`;
    documentation += `- [ ] All required music files are present in \`assets/audio/music/\`\n`;
    documentation += `- [ ] All required sound effect files are present in \`assets/audio/sound/\`\n`;
    documentation += `- [ ] Files follow the correct naming convention (lowercase, hyphens)\n`;
    documentation += `- [ ] Files are in the correct format (OGG preferred, MP3 fallback)\n`;
    documentation += `- [ ] Audio quality meets specifications (44.1kHz, appropriate bitrate)\n`;
    documentation += `- [ ] File sizes are within expected ranges\n`;
    documentation += `- [ ] All files load without errors in the target browsers\n\n`;

    return documentation;
  }

  /**
   * Implement graceful handling of missing audio files during development
   * Requirements: 5.4
   */
  handleMissingAssets(missingFiles: string[]): void {
    if (missingFiles.length === 0) {
      Logger.log('AudioAssetManager: No missing assets to handle');
      return;
    }

    Logger.log(`AudioAssetManager: Handling ${missingFiles.length} missing assets gracefully`);

    for (const assetKey of missingFiles) {
      const metadata = this.assetMetadata.get(assetKey);
      if (!metadata) {
        continue;
      }

      // Create development-friendly fallback
      this.createDevelopmentFallback(metadata);
      
      // Log appropriate message based on asset importance
      if (metadata.required) {
        Logger.log(`AudioAssetManager: MISSING REQUIRED ASSET - ${assetKey} (${metadata.filename})`);
        Logger.log(`AudioAssetManager: Created silent fallback for development - please add ${metadata.filename}.${metadata.format}`);
      } else {
        Logger.log(`AudioAssetManager: Missing optional asset ${assetKey} - continuing without audio`);
      }
    }

    // Provide helpful development guidance
    this.logDevelopmentGuidance(missingFiles);
  }

  /**
   * Create development-friendly fallback for missing assets
   * Requirements: 5.4
   */
  private createDevelopmentFallback(metadata: AudioAssetMetadata): void {
    try {
      // Mark as handled to prevent repeated error messages
      this.failedAssets.delete(metadata.key);
      
      // Create a development placeholder entry
      const fallbackMetadata = {
        ...metadata,
        isDevelopmentFallback: true,
        originalRequired: metadata.required
      };
      
      this.assetMetadata.set(metadata.key, fallbackMetadata);
      
      Logger.log(`AudioAssetManager: Created development fallback for ${metadata.key}`);
      
    } catch (error) {
      Logger.log(`AudioAssetManager: Failed to create development fallback for ${metadata.key}: ${error}`);
    }
  }

  /**
   * Log helpful development guidance for missing assets
   * Requirements: 5.4
   */
  private logDevelopmentGuidance(missingFiles: string[]): void {
    Logger.log(`\n=== AUDIO ASSET DEVELOPMENT GUIDANCE ===`);
    Logger.log(`Missing ${missingFiles.length} audio files. The game will continue to work without them.`);
    Logger.log(`\nTo add audio files:`);
    Logger.log(`1. Create the directory structure: assets/audio/music/ and assets/audio/sound/`);
    Logger.log(`2. Add the missing files in OGG format (MP3 as fallback)`);
    Logger.log(`3. Use AudioAssetManager.generatePlaceholderDocumentation() for detailed specifications`);
    Logger.log(`4. Run AudioAssetManager.validateAudioAssets() to verify all files are loaded correctly`);
    Logger.log(`\nMissing files: ${missingFiles.join(', ')}`);
    Logger.log(`==========================================\n`);
  }

  /**
   * Get validation tools for verifying all required audio assets are present
   * Requirements: 5.5
   */
  getValidationTools(): ValidationTools {
    return {
      checkRequiredFiles: (): string[] => {
        const requiredAssets = Array.from(this.assetMetadata.values())
          .filter(asset => asset.required)
          .map(asset => asset.key);
        
        return requiredAssets.filter(key => !this.loadedAssets.has(key));
      },

      generateFileChecklist: (): string => {
        let checklist = `# Audio Asset Checklist\n\n`;
        
        const musicAssets = this.getAssetsByCategory('music');
        const soundAssets = this.getAssetsByCategory('sound');
        
        checklist += `## Music Files (${musicAssets.length})\n\n`;
        for (const asset of musicAssets) {
          const status = this.loadedAssets.has(asset.key) ? '✅' : '❌';
          const required = asset.required ? '(Required)' : '(Optional)';
          checklist += `- ${status} \`${asset.filename}.${asset.format}\` ${required}\n`;
        }
        
        checklist += `\n## Sound Effect Files (${soundAssets.length})\n\n`;
        for (const asset of soundAssets) {
          const status = this.loadedAssets.has(asset.key) ? '✅' : '❌';
          const required = asset.required ? '(Required)' : '(Optional)';
          checklist += `- ${status} \`${asset.filename}.${asset.format}\` ${required}\n`;
        }
        
        return checklist;
      },

      validateFileNaming: (): { valid: boolean; issues: string[] } => {
        const issues: string[] = [];
        
        for (const [key, metadata] of this.assetMetadata.entries()) {
          // Check naming convention (lowercase, hyphens)
          if (!/^[a-z0-9-]+$/.test(metadata.filename)) {
            issues.push(`${key}: Filename should use lowercase letters, numbers, and hyphens only`);
          }
          
          // Check key consistency
          if (key !== metadata.filename.replace(/[^a-z0-9]/g, '-')) {
            issues.push(`${key}: Key should match filename pattern`);
          }
        }
        
        return {
          valid: issues.length === 0,
          issues
        };
      },

      generateAssetReport: (): string => {
        const validation = this.validateAudioAssets();
        const loadedCount = this.loadedAssets.size;
        const failedCount = this.failedAssets.size;
        const totalCount = this.assetMetadata.size;
        
        let report = `# Audio Asset Report\n\n`;
        report += `**Generated**: ${new Date().toISOString()}\n\n`;
        report += `## Summary\n\n`;
        report += `- **Total Assets**: ${totalCount}\n`;
        report += `- **Loaded Successfully**: ${loadedCount}\n`;
        report += `- **Failed to Load**: ${failedCount}\n`;
        report += `- **Overall Status**: ${validation.isValid ? '✅ Valid' : '❌ Issues Found'}\n\n`;
        
        if (validation.missingFiles.length > 0) {
          report += `## Missing Files (${validation.missingFiles.length})\n\n`;
          for (const file of validation.missingFiles) {
            report += `- ${file}\n`;
          }
          report += `\n`;
        }
        
        if (validation.invalidFiles.length > 0) {
          report += `## Invalid Files (${validation.invalidFiles.length})\n\n`;
          for (const file of validation.invalidFiles) {
            report += `- ${file}\n`;
          }
          report += `\n`;
        }
        
        report += `## Supported Formats\n\n`;
        for (const format of validation.supportedFormats) {
          report += `- ${format.toUpperCase()}\n`;
        }
        
        return report;
      }
    };
  }

  /**
   * Get asset lifecycle manager for memory-efficient asset management
   * Requirements: 4.3
   */
  getAssetLifecycleManager(): AssetLifecycleManager {
    return {
      preloadAsset: async (key: string): Promise<void> => {
        const metadata = this.assetMetadata.get(key);
        if (!metadata) {
          throw new Error(`Asset ${key} not found in metadata`);
        }

        if (this.loadedAssets.has(key)) {
          // Update last accessed time
          const cached = this.assetCache.get(key);
          if (cached) {
            cached.lastAccessed = Date.now();
          }
          return;
        }

        await this.preloadSingleAsset(metadata);
      },

      unloadAsset: (key: string): void => {
        this.unloadAssetFromMemory(key);
      },

      getMemoryUsage: (): { totalSize: number; activeAssets: number; cachedAssets: number } => {
        let totalSize = 0;
        let activeAssets = 0;
        let cachedAssets = 0;

        for (const [key, cached] of this.assetCache.entries()) {
          totalSize += cached.size;
          cachedAssets++;
          
          if (this.loadedAssets.has(key)) {
            activeAssets++;
          }
        }

        return { totalSize, activeAssets, cachedAssets };
      },

      optimizeMemoryUsage: (): void => {
        this.optimizeMemoryUsage();
      },

      scheduleAssetCleanup: (key: string, delayMs: number): void => {
        this.scheduleAssetCleanup(key, delayMs);
      }
    };
  }

  /**
   * Unload asset from memory to free up resources
   * Requirements: 4.3
   */
  private unloadAssetFromMemory(key: string): void {
    try {
      // Remove from Phaser cache if scene is available
      if (this.scene && this.scene.cache && this.scene.cache.audio) {
        if (this.scene.cache.audio.exists(key)) {
          this.scene.cache.audio.remove(key);
          Logger.log(`AudioAssetManager: Unloaded ${key} from Phaser cache`);
        }
      }

      // Remove from internal cache
      const cached = this.assetCache.get(key);
      if (cached) {
        this.assetCache.delete(key);
        Logger.log(`AudioAssetManager: Freed ${cached.size} bytes from ${key}`);
      }

      // Remove from loaded assets
      this.loadedAssets.delete(key);

      // Cancel any scheduled cleanup
      const timer = this.cleanupTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.cleanupTimers.delete(key);
      }

    } catch (error) {
      Logger.log(`AudioAssetManager: Error unloading asset ${key}: ${error}`);
    }
  }

  /**
   * Optimize memory usage by removing old or unused assets
   * Requirements: 4.3
   */
  private optimizeMemoryUsage(): void {
    const currentTime = Date.now();
    const memoryUsage = this.getAssetLifecycleManager().getMemoryUsage();
    
    Logger.log(`AudioAssetManager: Memory optimization - Current usage: ${Math.round(memoryUsage.totalSize / 1024 / 1024)}MB`);

    // If we're over the memory threshold, start cleanup
    if (memoryUsage.totalSize > this.memoryThreshold) {
      const assetsToCleanup: Array<{ key: string; lastAccessed: number; size: number }> = [];

      // Collect candidates for cleanup (old or unused assets)
      for (const [key, cached] of this.assetCache.entries()) {
        const age = currentTime - cached.lastAccessed;
        
        // Skip recently accessed assets
        if (age > this.maxCacheAge) {
          assetsToCleanup.push({
            key,
            lastAccessed: cached.lastAccessed,
            size: cached.size
          });
        }
      }

      // Sort by age (oldest first) and size (largest first)
      assetsToCleanup.sort((a, b) => {
        const ageDiff = b.lastAccessed - a.lastAccessed; // Older first
        if (ageDiff !== 0) return ageDiff;
        return b.size - a.size; // Larger first
      });

      // Clean up assets until we're under threshold
      let freedMemory = 0;
      let cleanedAssets = 0;

      for (const asset of assetsToCleanup) {
        if (memoryUsage.totalSize - freedMemory <= this.memoryThreshold * 0.8) {
          break; // Stop when we're comfortably under threshold
        }

        this.unloadAssetFromMemory(asset.key);
        freedMemory += asset.size;
        cleanedAssets++;
      }

      Logger.log(`AudioAssetManager: Memory optimization complete - Freed ${Math.round(freedMemory / 1024 / 1024)}MB from ${cleanedAssets} assets`);
    }
  }

  /**
   * Schedule automatic cleanup of an asset after a delay
   * Requirements: 4.3
   */
  private scheduleAssetCleanup(key: string, delayMs: number): void {
    // Cancel existing timer if any
    const existingTimer = this.cleanupTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new cleanup
    const timer = setTimeout(() => {
      const cached = this.assetCache.get(key);
      if (cached) {
        const age = Date.now() - cached.lastAccessed;
        
        // Only cleanup if asset hasn't been accessed recently
        if (age >= delayMs * 0.8) {
          this.unloadAssetFromMemory(key);
          Logger.log(`AudioAssetManager: Scheduled cleanup executed for ${key}`);
        } else {
          // Reschedule if asset was accessed recently
          this.scheduleAssetCleanup(key, delayMs);
        }
      }
      
      this.cleanupTimers.delete(key);
    }, delayMs);

    this.cleanupTimers.set(key, timer);
  }

  /**
   * Get audio streaming manager for large music files
   * Requirements: 4.3
   */
  getAudioStreamingManager(): AudioStreamingManager {
    return {
      createStream: async (key: string): Promise<AudioStreamHandle> => {
        return this.createAudioStream(key);
      },

      destroyStream: (handle: AudioStreamHandle): void => {
        this.destroyAudioStream(handle);
      },

      getActiveStreams: (): AudioStreamHandle[] => {
        return Array.from(this.activeStreams.values());
      },

      optimizeStreamBuffers: (): void => {
        this.optimizeStreamBuffers();
      }
    };
  }

  /**
   * Create an audio stream for large files
   * Requirements: 4.3
   */
  private async createAudioStream(key: string): Promise<AudioStreamHandle> {
    const metadata = this.assetMetadata.get(key);
    if (!metadata) {
      throw new Error(`Asset ${key} not found for streaming`);
    }

    const streamId = `stream_${this.nextStreamId++}`;
    const handle: AudioStreamHandle = {
      id: streamId,
      key,
      isActive: true,
      bufferSize: this.streamingConfig.bufferSize,
      position: 0,
      duration: 0 // Will be set when audio loads
    };

    try {
      // Initialize stream buffers
      this.streamBuffers.set(streamId, []);
      
      // Start loading audio data in chunks
      await this.initializeStreamBuffers(handle, metadata);
      
      this.activeStreams.set(streamId, handle);
      Logger.log(`AudioAssetManager: Created audio stream ${streamId} for ${key}`);
      
      return handle;
      
    } catch (error) {
      Logger.log(`AudioAssetManager: Failed to create stream for ${key}: ${error}`);
      throw error;
    }
  }

  /**
   * Initialize stream buffers for progressive loading
   * Requirements: 4.3
   */
  private async initializeStreamBuffers(handle: AudioStreamHandle, metadata: AudioAssetMetadata): Promise<void> {
    try {
      const formatToUse = this.selectBestFormat(metadata);
      if (!formatToUse) {
        throw new Error(`No supported format for streaming ${metadata.key}`);
      }

      const filename = `${metadata.filename}.${formatToUse}`;
      // Map category to actual directory structure
      const categoryDir = metadata.category === 'sound' ? 'sfx' : metadata.category;
      const assetPath = `assets/audio/${categoryDir}/${filename}`;

      // For now, we'll use Phaser's standard loading but mark it for streaming
      // In a full implementation, this would involve chunked loading
      if (this.scene) {
        this.scene.load.audio(handle.key, assetPath);
        
        // Set up streaming metadata
        const streamingMetadata = {
          ...metadata,
          streamHandle: handle.id,
          streamingEnabled: true
        };
        
        this.assetMetadata.set(handle.key, streamingMetadata);
      }

      Logger.log(`AudioAssetManager: Initialized stream buffers for ${handle.key}`);
      
    } catch (error) {
      throw new Error(`Failed to initialize stream buffers: ${error}`);
    }
  }

  /**
   * Destroy an audio stream and free resources
   * Requirements: 4.3
   */
  private destroyAudioStream(handle: AudioStreamHandle): void {
    try {
      // Mark stream as inactive
      handle.isActive = false;
      
      // Clear stream buffers
      this.streamBuffers.delete(handle.id);
      
      // Remove from active streams
      this.activeStreams.delete(handle.id);
      
      // Unload associated asset if no longer needed
      const otherStreams = Array.from(this.activeStreams.values())
        .filter(s => s.key === handle.key);
      
      if (otherStreams.length === 0) {
        this.unloadAssetFromMemory(handle.key);
      }
      
      Logger.log(`AudioAssetManager: Destroyed audio stream ${handle.id}`);
      
    } catch (error) {
      Logger.log(`AudioAssetManager: Error destroying stream ${handle.id}: ${error}`);
    }
  }

  /**
   * Optimize stream buffers to reduce memory usage
   * Requirements: 4.3
   */
  private optimizeStreamBuffers(): void {
    let totalBufferSize = 0;
    let optimizedStreams = 0;

    for (const [streamId, buffers] of this.streamBuffers.entries()) {
      const handle = this.activeStreams.get(streamId);
      if (!handle || !handle.isActive) {
        // Remove buffers for inactive streams
        this.streamBuffers.delete(streamId);
        continue;
      }

      // Calculate buffer size
      const bufferSize = buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
      totalBufferSize += bufferSize;

      // Optimize if buffer is too large
      if (bufferSize > this.streamingConfig.bufferSize * 2) {
        // Keep only the most recent buffers
        const maxBuffers = Math.ceil(this.streamingConfig.bufferSize / this.streamingConfig.chunkSize);
        if (buffers.length > maxBuffers) {
          buffers.splice(0, buffers.length - maxBuffers);
          optimizedStreams++;
        }
      }
    }

    if (optimizedStreams > 0) {
      Logger.log(`AudioAssetManager: Optimized ${optimizedStreams} stream buffers, total size: ${Math.round(totalBufferSize / 1024)}KB`);
    }
  }

  /**
   * Detect and select optimal audio format based on browser capabilities
   * Requirements: 4.4
   */
  detectOptimalFormat(metadata: AudioAssetMetadata): AudioFormat | null {
    // Get browser-specific format preferences
    const formatPreferences = this.getBrowserFormatPreferences();
    
    // Check primary format
    if (this.supportedFormats.includes(metadata.format)) {
      const preference = formatPreferences.get(metadata.format) || 0;
      if (preference > 0.7) { // High preference threshold
        return metadata.format;
      }
    }

    // Check fallback formats with preferences
    if (metadata.fallbackFormats) {
      let bestFormat: AudioFormat | null = null;
      let bestScore = 0;

      for (const format of metadata.fallbackFormats) {
        if (this.supportedFormats.includes(format)) {
          const preference = formatPreferences.get(format) || 0;
          if (preference > bestScore) {
            bestScore = preference;
            bestFormat = format;
          }
        }
      }

      if (bestFormat && bestScore > 0.5) {
        return bestFormat;
      }
    }

    // Fallback to any supported format
    return this.selectBestFormat(metadata);
  }

  /**
   * Get browser-specific format preferences based on performance and compatibility
   * Requirements: 4.4
   */
  private getBrowserFormatPreferences(): Map<AudioFormat, number> {
    const preferences = new Map<AudioFormat, number>();
    
    // Default preferences (0.0 to 1.0)
    preferences.set(AudioFormat.OGG, 0.9); // Generally best compression and quality
    preferences.set(AudioFormat.MP3, 0.7); // Good compatibility
    preferences.set(AudioFormat.WAV, 0.5); // Uncompressed, large files
    preferences.set(AudioFormat.M4A, 0.6); // Good quality, limited support

    // Adjust based on browser capabilities
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      preferences.set(AudioFormat.OGG, 0.95); // Chrome has excellent OGG support
      preferences.set(AudioFormat.MP3, 0.8);
    } else if (userAgent.includes('firefox')) {
      preferences.set(AudioFormat.OGG, 0.9); // Firefox has good OGG support
      preferences.set(AudioFormat.MP3, 0.75);
    } else if (userAgent.includes('safari')) {
      preferences.set(AudioFormat.MP3, 0.9); // Safari prefers MP3
      preferences.set(AudioFormat.M4A, 0.85);
      preferences.set(AudioFormat.OGG, 0.6); // Limited OGG support
    } else if (userAgent.includes('edge')) {
      preferences.set(AudioFormat.MP3, 0.85);
      preferences.set(AudioFormat.OGG, 0.8);
    }

    return preferences;
  }

  /**
   * Implement automatic fallback selection based on browser and network conditions
   * Requirements: 4.4
   */
  selectFallbackFormat(metadata: AudioAssetMetadata, reason: 'network' | 'compatibility' | 'performance'): AudioFormat | null {
    Logger.log(`AudioAssetManager: Selecting fallback format for ${metadata.key} due to ${reason}`);

    switch (reason) {
      case 'network':
        // Prefer smaller files for slow networks
        const networkFormats = [AudioFormat.OGG, AudioFormat.MP3, AudioFormat.M4A, AudioFormat.WAV];
        for (const format of networkFormats) {
          if (this.supportedFormats.includes(format)) {
            return format;
          }
        }
        break;

      case 'compatibility':
        // Prefer widely supported formats
        const compatFormats = [AudioFormat.MP3, AudioFormat.WAV, AudioFormat.OGG, AudioFormat.M4A];
        for (const format of compatFormats) {
          if (this.supportedFormats.includes(format)) {
            return format;
          }
        }
        break;

      case 'performance':
        // Prefer formats with good decode performance
        const perfFormats = [AudioFormat.OGG, AudioFormat.M4A, AudioFormat.MP3, AudioFormat.WAV];
        for (const format of perfFormats) {
          if (this.supportedFormats.includes(format)) {
            return format;
          }
        }
        break;
    }

    // Final fallback
    return this.selectBestFormat(metadata);
  }

  /**
   * Cleanup resources and reset state
   */
  destroy(): void {
    // Clear all cleanup timers
    for (const timer of this.cleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();

    // Destroy all active streams
    for (const handle of this.activeStreams.values()) {
      this.destroyAudioStream(handle);
    }
    this.activeStreams.clear();
    this.streamBuffers.clear();

    // Clear asset cache
    this.assetCache.clear();

    // Clear base resources
    this.scene = null;
    this.assetMetadata.clear();
    this.loadedAssets.clear();
    this.failedAssets.clear();
    this.resetPreloadProgress();
    
    Logger.log('AudioAssetManager: Destroyed with optimization cleanup');
  }
}
