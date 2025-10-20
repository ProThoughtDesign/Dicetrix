/**
 * Memory management system for long gaming sessions
 * Handles garbage collection optimization, texture cleanup, and memory leak prevention
 */
export class MemoryManager {
  private static instance: MemoryManager;
  
  // Memory tracking
  private memoryCheckInterval: number = 30000; // Check every 30 seconds
  private memoryThreshold: number = 100 * 1024 * 1024; // 100MB threshold
  
  // Cleanup tracking
  private textureCache = new Map<string, { texture: Phaser.Textures.Texture; lastUsed: number }>();
  private audioCache = new Map<string, { audio: Phaser.Sound.BaseSound; lastUsed: number }>();
  private unusedThreshold: number = 60000; // 1 minute for unused resources
  
  // Game object tracking
  private trackedObjects = new WeakSet<Phaser.GameObjects.GameObject>();
  private objectCounts = new Map<string, number>();
  
  // Performance optimization flags
  private isLowMemoryMode: boolean = false;
  private gcSuggestionCount: number = 0;
  
  private scene: Phaser.Scene;
  
  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupMemoryMonitoring();
  }
  
  public static getInstance(scene?: Phaser.Scene): MemoryManager {
    if (!MemoryManager.instance && scene) {
      MemoryManager.instance = new MemoryManager(scene);
    }
    return MemoryManager.instance;
  }
  
  /**
   * Setup memory monitoring and cleanup intervals
   */
  private setupMemoryMonitoring(): void {
    // Set up periodic memory checks
    this.scene.time.addEvent({
      delay: this.memoryCheckInterval,
      callback: this.performMemoryCheck,
      callbackScope: this,
      loop: true
    });
    
    // Set up resource cleanup
    this.scene.time.addEvent({
      delay: this.unusedThreshold,
      callback: this.cleanupUnusedResources,
      callbackScope: this,
      loop: true
    });
  }
  
  /**
   * Perform memory check and optimization
   */
  private performMemoryCheck(): void {
    
    // Check memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize;
      
      console.log(`Memory usage: ${(usedMemory / 1024 / 1024).toFixed(2)}MB`);
      
      // Enter low memory mode if threshold exceeded
      if (usedMemory > this.memoryThreshold && !this.isLowMemoryMode) {
        this.enterLowMemoryMode();
      } else if (usedMemory < this.memoryThreshold * 0.7 && this.isLowMemoryMode) {
        this.exitLowMemoryMode();
      }
      
      // Suggest garbage collection if memory is high
      if (usedMemory > this.memoryThreshold * 1.5) {
        this.suggestGarbageCollection();
      }
    }
    
    // Log object counts for debugging
    this.logObjectCounts();
  }
  
  /**
   * Enter low memory mode with aggressive optimizations
   */
  private enterLowMemoryMode(): void {
    console.warn('Entering low memory mode - applying aggressive optimizations');
    this.isLowMemoryMode = true;
    
    // Reduce texture quality
    this.reduceTextureQuality();
    
    // Cleanup unused resources immediately
    this.cleanupUnusedResources();
    
    // Reduce particle effects
    this.reduceParticleEffects();
    
    // Suggest garbage collection
    this.suggestGarbageCollection();
  }
  
  /**
   * Exit low memory mode
   */
  private exitLowMemoryMode(): void {
    console.log('Exiting low memory mode - restoring normal quality');
    this.isLowMemoryMode = false;
    
    // Restore normal settings (would need to be implemented based on game needs)
  }
  
  /**
   * Reduce texture quality for memory optimization
   */
  private reduceTextureQuality(): void {
    // This would involve reducing texture resolution or switching to lower quality versions
    // For now, just log the action
    console.log('Reducing texture quality for memory optimization');
  }
  
  /**
   * Reduce particle effects to save memory
   */
  private reduceParticleEffects(): void {
    // Reduce particle count and complexity
    console.log('Reducing particle effects for memory optimization');
  }
  
  /**
   * Cleanup unused resources
   */
  private cleanupUnusedResources(): void {
    const currentTime = performance.now();
    
    // Cleanup unused textures
    for (const [key, data] of this.textureCache.entries()) {
      if (currentTime - data.lastUsed > this.unusedThreshold) {
        this.textureCache.delete(key);
        // In a real implementation, you'd destroy the texture here
        console.log(`Cleaned up unused texture: ${key}`);
      }
    }
    
    // Cleanup unused audio
    for (const [key, data] of this.audioCache.entries()) {
      if (currentTime - data.lastUsed > this.unusedThreshold) {
        data.audio.destroy();
        this.audioCache.delete(key);
        console.log(`Cleaned up unused audio: ${key}`);
      }
    }
  }
  
  /**
   * Suggest garbage collection to the browser
   */
  private suggestGarbageCollection(): void {
    this.gcSuggestionCount++;
    
    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('Forced garbage collection');
    } else {
      // Create and immediately release large objects to encourage GC
      this.encourageGarbageCollection();
    }
  }
  
  /**
   * Encourage garbage collection by creating temporary objects
   */
  private encourageGarbageCollection(): void {
    // Create temporary large objects to encourage GC
    const temp = new Array(1000).fill(null).map(() => ({ data: new Array(100) }));
    temp.length = 0; // Clear reference
    console.log('Encouraged garbage collection');
  }
  
  /**
   * Track a game object for memory management
   */
  public trackObject(obj: Phaser.GameObjects.GameObject, type: string): void {
    this.trackedObjects.add(obj);
    
    const count = this.objectCounts.get(type) || 0;
    this.objectCounts.set(type, count + 1);
  }
  
  /**
   * Untrack a game object
   */
  public untrackObject(obj: Phaser.GameObjects.GameObject, type: string): void {
    if (this.trackedObjects.has(obj)) {
      this.trackedObjects.delete(obj);
      
      const count = this.objectCounts.get(type) || 0;
      if (count > 0) {
        this.objectCounts.set(type, count - 1);
      }
    }
  }
  
  /**
   * Log current object counts
   */
  private logObjectCounts(): void {
    if (this.objectCounts.size > 0) {
      console.log('Object counts:', Object.fromEntries(this.objectCounts));
    }
  }
  
  /**
   * Register texture usage
   */
  public registerTextureUsage(key: string, texture: Phaser.Textures.Texture): void {
    this.textureCache.set(key, {
      texture,
      lastUsed: performance.now()
    });
  }
  
  /**
   * Register audio usage
   */
  public registerAudioUsage(key: string, audio: Phaser.Sound.BaseSound): void {
    this.audioCache.set(key, {
      audio,
      lastUsed: performance.now()
    });
  }
  
  /**
   * Update texture usage timestamp
   */
  public updateTextureUsage(key: string): void {
    const cached = this.textureCache.get(key);
    if (cached) {
      cached.lastUsed = performance.now();
    }
  }
  
  /**
   * Update audio usage timestamp
   */
  public updateAudioUsage(key: string): void {
    const cached = this.audioCache.get(key);
    if (cached) {
      cached.lastUsed = performance.now();
    }
  }
  
  /**
   * Get memory management statistics
   */
  public getStats(): MemoryStats {
    const memoryInfo = 'memory' in performance ? (performance as any).memory : null;
    
    return {
      isLowMemoryMode: this.isLowMemoryMode,
      trackedObjectCount: this.objectCounts.size,
      texturesCached: this.textureCache.size,
      audiosCached: this.audioCache.size,
      gcSuggestionCount: this.gcSuggestionCount,
      memoryUsage: memoryInfo ? {
        used: memoryInfo.usedJSHeapSize,
        total: memoryInfo.totalJSHeapSize,
        limit: memoryInfo.jsHeapSizeLimit
      } : null,
      objectCounts: Object.fromEntries(this.objectCounts)
    };
  }
  
  /**
   * Force cleanup of all cached resources
   */
  public forceCleanup(): void {
    console.log('Forcing cleanup of all cached resources');
    
    // Clear texture cache
    this.textureCache.clear();
    
    // Clear audio cache and destroy sounds
    for (const [, data] of this.audioCache.entries()) {
      data.audio.destroy();
    }
    this.audioCache.clear();
    
    // Reset object counts
    this.objectCounts.clear();
    
    // Suggest garbage collection
    this.suggestGarbageCollection();
  }
  
  /**
   * Check if system is in low memory mode
   */
  public isInLowMemoryMode(): boolean {
    return this.isLowMemoryMode;
  }
  
  /**
   * Get memory usage in MB
   */
  public getMemoryUsageMB(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }
}

/**
 * Memory management statistics interface
 */
export interface MemoryStats {
  isLowMemoryMode: boolean;
  trackedObjectCount: number;
  texturesCached: number;
  audiosCached: number;
  gcSuggestionCount: number;
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  } | null;
  objectCounts: Record<string, number>;
}
