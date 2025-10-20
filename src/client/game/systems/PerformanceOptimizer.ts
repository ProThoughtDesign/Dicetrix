import { PerformanceMonitor, PerformanceMetrics } from './PerformanceMonitor.js';
import { GameObjectPoolManager } from './ObjectPool.js';
import { MatchDetectionOptimizer } from './MatchDetectionOptimizer.js';
import { MemoryManager, MemoryStats } from './MemoryManager.js';

/**
 * Main performance optimization coordinator
 * Integrates all performance systems and provides unified interface
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  
  private performanceMonitor: PerformanceMonitor;
  private poolManager: GameObjectPoolManager;
  private matchOptimizer: MatchDetectionOptimizer;
  private memoryManager: MemoryManager;
  
  private scene: Phaser.Scene;
  private isInitialized: boolean = false;
  
  // Performance optimization settings
  private settings: PerformanceSettings = {
    enableObjectPooling: true,
    enableMatchOptimization: true,
    enableMemoryManagement: true,
    enablePerformanceMonitoring: true,
    targetFrameTime: 60, // 60ms target as per requirement 8.5
    memoryThreshold: 100 * 1024 * 1024, // 100MB
    autoOptimization: true
  };
  
  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  public static getInstance(scene?: Phaser.Scene): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance && scene) {
      PerformanceOptimizer.instance = new PerformanceOptimizer(scene);
    }
    return PerformanceOptimizer.instance;
  }
  
  /**
   * Initialize all performance systems
   */
  public initialize(settings?: Partial<PerformanceSettings>): void {
    if (this.isInitialized) {
      console.warn('PerformanceOptimizer already initialized');
      return;
    }
    
    // Merge settings
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
    
    console.log('Initializing PerformanceOptimizer with settings:', this.settings);
    
    // Initialize subsystems
    if (this.settings.enablePerformanceMonitoring) {
      this.performanceMonitor = PerformanceMonitor.getInstance();
      this.setupPerformanceCallbacks();
    }
    
    if (this.settings.enableObjectPooling) {
      this.poolManager = GameObjectPoolManager.getInstance(this.scene);
      this.poolManager.prewarmPools();
    }
    
    if (this.settings.enableMatchOptimization) {
      this.matchOptimizer = MatchDetectionOptimizer.getInstance();
    }
    
    if (this.settings.enableMemoryManagement) {
      this.memoryManager = MemoryManager.getInstance(this.scene);
    }
    
    this.isInitialized = true;
    console.log('PerformanceOptimizer initialized successfully');
  }
  
  /**
   * Setup performance monitoring callbacks
   */
  private setupPerformanceCallbacks(): void {
    this.performanceMonitor.onWarning((metrics) => {
      console.warn('Performance warning detected:', metrics);
      
      if (this.settings.autoOptimization) {
        this.applyPerformanceOptimizations('warning');
      }
    });
    
    this.performanceMonitor.onCritical((metrics) => {
      console.error('Critical performance issue detected:', metrics);
      
      if (this.settings.autoOptimization) {
        this.applyPerformanceOptimizations('critical');
      }
    });
  }
  
  /**
   * Apply performance optimizations based on severity
   */
  private applyPerformanceOptimizations(severity: 'warning' | 'critical'): void {
    console.log(`Applying ${severity} level performance optimizations`);
    
    if (severity === 'warning') {
      // Light optimizations
      this.poolManager?.clearAllPools();
      this.matchOptimizer?.clear();
    } else if (severity === 'critical') {
      // Aggressive optimizations
      this.memoryManager?.forceCleanup();
      this.poolManager?.clearAllPools();
      this.matchOptimizer?.clear();
      
      // Reduce quality settings
      this.reduceQualitySettings();
    }
  }
  
  /**
   * Reduce quality settings for better performance
   */
  private reduceQualitySettings(): void {
    console.log('Reducing quality settings for performance');
    
    // Reduce particle effects
    const particleEmitters = this.scene.children.list.filter(
      child => child instanceof Phaser.GameObjects.Particles.ParticleEmitter
    ) as Phaser.GameObjects.Particles.ParticleEmitter[];
    
    particleEmitters.forEach(emitter => {
      // Reduce particle quantity if possible
      if (emitter.quantity && typeof emitter.quantity === 'number') {
        emitter.setQuantity(Math.max(1, Math.floor(emitter.quantity / 2)));
      }
    });
    
    // Reduce animation frame rates
    this.scene.anims.globalTimeScale = 0.5;
  }
  
  /**
   * Update all performance systems (call this in scene update)
   */
  public update(_time: number, delta: number): void {
    if (!this.isInitialized) return;
    
    // Track frame time
    if (this.settings.enablePerformanceMonitoring) {
      this.performanceMonitor.trackFrameTime(delta);
    }
    
    // Update object pools
    if (this.settings.enableObjectPooling) {
      this.poolManager.update();
    }
  }
  
  /**
   * Optimize match detection for a grid
   */
  public optimizeMatchDetection(grid: (any | null)[][]): any[] {
    if (!this.settings.enableMatchOptimization || !this.matchOptimizer) {
      return [];
    }
    
    return this.matchOptimizer.detectMatches(grid);
  }
  
  /**
   * Get a pooled dice sprite
   */
  public acquireDiceSprite(): Phaser.GameObjects.Sprite | null {
    if (!this.settings.enableObjectPooling || !this.poolManager) {
      return null;
    }
    
    return this.poolManager.acquireDiceSprite();
  }
  
  /**
   * Return a dice sprite to the pool
   */
  public releaseDiceSprite(sprite: Phaser.GameObjects.Sprite): void {
    if (this.settings.enableObjectPooling && this.poolManager) {
      this.poolManager.releaseDiceSprite(sprite);
    }
  }
  
  /**
   * Get comprehensive performance report
   */
  public getPerformanceReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      settings: this.settings,
      isInitialized: this.isInitialized
    };
    
    if (this.performanceMonitor) {
      report.performanceMetrics = this.performanceMonitor.getMetrics();
    }
    
    if (this.poolManager) {
      report.poolStats = this.poolManager.getAllStats();
    }
    
    if (this.matchOptimizer) {
      report.matchDetectionStats = this.matchOptimizer.getPerformanceStats();
    }
    
    if (this.memoryManager) {
      report.memoryStats = this.memoryManager.getStats();
    }
    
    return report;
  }
  
  /**
   * Check if performance is acceptable
   */
  public isPerformanceAcceptable(): boolean {
    if (!this.performanceMonitor) return true;
    
    return this.performanceMonitor.isPerformanceAcceptable();
  }
  
  /**
   * Get current FPS
   */
  public getCurrentFPS(): number {
    if (!this.performanceMonitor) return 60;
    
    return this.performanceMonitor.getMetrics().currentFPS;
  }
  
  /**
   * Force performance optimization
   */
  public forceOptimization(): void {
    console.log('Forcing performance optimization');
    this.applyPerformanceOptimizations('critical');
  }
  
  /**
   * Reset all performance tracking
   */
  public reset(): void {
    console.log('Resetting performance tracking');
    
    this.performanceMonitor?.reset();
    this.matchOptimizer?.resetPerformanceStats();
    this.poolManager?.clearAllPools();
  }
  
  /**
   * Update performance settings
   */
  public updateSettings(newSettings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Updated performance settings:', this.settings);
  }
  
  /**
   * Get current settings
   */
  public getSettings(): PerformanceSettings {
    return { ...this.settings };
  }
  
  /**
   * Cleanup and destroy all systems
   */
  public destroy(): void {
    console.log('Destroying PerformanceOptimizer');
    
    this.poolManager?.clearAllPools();
    this.matchOptimizer?.clear();
    this.memoryManager?.forceCleanup();
    
    this.isInitialized = false;
  }
}

/**
 * Performance settings interface
 */
export interface PerformanceSettings {
  enableObjectPooling: boolean;
  enableMatchOptimization: boolean;
  enableMemoryManagement: boolean;
  enablePerformanceMonitoring: boolean;
  targetFrameTime: number;
  memoryThreshold: number;
  autoOptimization: boolean;
}

/**
 * Comprehensive performance report interface
 */
export interface PerformanceReport {
  timestamp: number;
  settings: PerformanceSettings;
  isInitialized: boolean;
  performanceMetrics?: PerformanceMetrics;
  poolStats?: Record<string, any>;
  matchDetectionStats?: any;
  memoryStats?: MemoryStats;
}
