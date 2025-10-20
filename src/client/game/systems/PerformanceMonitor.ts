/**
 * Performance monitoring system for tracking frame rates and performance metrics
 * Ensures 60ms frame time target compliance as per requirement 8.5
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  // Frame time tracking
  private frameTimeHistory: number[] = [];
  private readonly maxHistorySize = 60; // Track last 60 frames
  private readonly targetFrameTime = 60; // 60ms target
  
  // Performance metrics
  private averageFrameTime = 0;
  private minFrameTime = Infinity;
  private maxFrameTime = 0;
  private frameCount = 0;
  private startTime = 0;
  
  // Warning thresholds
  private readonly warningThreshold = 50; // Warn at 50ms
  private readonly criticalThreshold = 80; // Critical at 80ms
  
  // Performance callbacks
  private onWarningCallback?: (metrics: PerformanceMetrics) => void;
  private onCriticalCallback?: (metrics: PerformanceMetrics) => void;
  
  // Memory tracking
  private memoryUsage: MemoryInfo[] = [];
  private readonly memoryHistorySize = 30; // Track last 30 memory snapshots
  
  private constructor() {
    this.startTime = performance.now();
  }
  
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Track frame time and update performance metrics
   */
  public trackFrameTime(deltaTime: number): void {
    this.frameCount++;
    
    // Add to history
    this.frameTimeHistory.push(deltaTime);
    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
    }
    
    // Update min/max
    this.minFrameTime = Math.min(this.minFrameTime, deltaTime);
    this.maxFrameTime = Math.max(this.maxFrameTime, deltaTime);
    
    // Calculate average
    this.averageFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    
    // Check thresholds
    this.checkPerformanceThresholds();
    
    // Track memory every 60 frames (roughly once per second at 60fps)
    if (this.frameCount % 60 === 0) {
      this.trackMemoryUsage();
    }
  }
  
  /**
   * Check if performance is below acceptable thresholds
   */
  private checkPerformanceThresholds(): void {
    const metrics = this.getMetrics();
    
    if (this.averageFrameTime > this.criticalThreshold) {
      this.onCriticalCallback?.(metrics);
    } else if (this.averageFrameTime > this.warningThreshold) {
      this.onWarningCallback?.(metrics);
    }
  }
  
  /**
   * Track memory usage if available
   */
  private trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryInfo: MemoryInfo = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: performance.now()
      };
      
      this.memoryUsage.push(memoryInfo);
      if (this.memoryUsage.length > this.memoryHistorySize) {
        this.memoryUsage.shift();
      }
    }
  }
  
  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const currentTime = performance.now();
    const totalTime = currentTime - this.startTime;
    const fps = this.frameCount / (totalTime / 1000);
    
    return {
      averageFrameTime: this.averageFrameTime,
      minFrameTime: this.minFrameTime,
      maxFrameTime: this.maxFrameTime,
      currentFPS: fps,
      targetFPS: 1000 / this.targetFrameTime,
      frameCount: this.frameCount,
      totalTime,
      isPerformanceGood: this.averageFrameTime < this.warningThreshold,
      memoryUsage: this.getLatestMemoryInfo()
    };
  }
  
  /**
   * Get latest memory information
   */
  private getLatestMemoryInfo(): MemoryInfo | null {
    const lastIndex = this.memoryUsage.length - 1;
    if (lastIndex >= 0) {
      return this.memoryUsage[lastIndex] || null;
    }
    return null;
  }
  
  /**
   * Set callback for performance warnings
   */
  public onWarning(callback: (metrics: PerformanceMetrics) => void): void {
    this.onWarningCallback = callback;
  }
  
  /**
   * Set callback for critical performance issues
   */
  public onCritical(callback: (metrics: PerformanceMetrics) => void): void {
    this.onCriticalCallback = callback;
  }
  
  /**
   * Reset performance tracking
   */
  public reset(): void {
    this.frameTimeHistory = [];
    this.averageFrameTime = 0;
    this.minFrameTime = Infinity;
    this.maxFrameTime = 0;
    this.frameCount = 0;
    this.startTime = performance.now();
    this.memoryUsage = [];
  }
  
  /**
   * Get performance report as string
   */
  public getReport(): string {
    const metrics = this.getMetrics();
    const memoryMB = metrics.memoryUsage ? 
      (metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A';
    
    return `Performance Report:
Average Frame Time: ${metrics.averageFrameTime.toFixed(2)}ms
Current FPS: ${metrics.currentFPS.toFixed(1)}
Min/Max Frame Time: ${metrics.minFrameTime.toFixed(2)}ms / ${metrics.maxFrameTime.toFixed(2)}ms
Memory Usage: ${memoryMB}MB
Performance Status: ${metrics.isPerformanceGood ? 'Good' : 'Poor'}
Total Frames: ${metrics.frameCount}
Total Time: ${(metrics.totalTime / 1000).toFixed(1)}s`;
  }
  
  /**
   * Log performance warning to console
   */
  public logWarning(context: string): void {
    const metrics = this.getMetrics();
    console.warn(`Performance Warning in ${context}:`, {
      averageFrameTime: metrics.averageFrameTime,
      currentFPS: metrics.currentFPS,
      memoryUsage: metrics.memoryUsage
    });
  }
  
  /**
   * Check if current performance meets target
   */
  public isPerformanceAcceptable(): boolean {
    return this.averageFrameTime < this.targetFrameTime;
  }
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  averageFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  currentFPS: number;
  targetFPS: number;
  frameCount: number;
  totalTime: number;
  isPerformanceGood: boolean;
  memoryUsage: MemoryInfo | null;
}

/**
 * Memory information interface
 */
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}
