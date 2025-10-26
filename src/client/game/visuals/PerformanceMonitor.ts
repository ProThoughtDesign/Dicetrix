import Logger from '../../utils/Logger';

/**
 * Performance monitor for particle system optimization
 * Tracks FPS and particle counts to maintain smooth gameplay
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export class PerformanceMonitor {
  private activeParticleCount: number = 0;
  private maxParticles: number;
  private fpsHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private performanceCheckInterval: number = 1000; // Check every second
  private lastPerformanceCheck: number = 0;
  private lowPerformanceThreshold: number = 45; // FPS threshold for quality reduction
  private criticalPerformanceThreshold: number = 30; // FPS threshold for emergency cleanup

  constructor(maxParticles: number) {
    this.maxParticles = maxParticles;
    this.lastFrameTime = performance.now();
    Logger.log(`PerformanceMonitor: Initialized with max particles: ${maxParticles}`);
  }

  /**
   * Update performance monitoring each frame
   * Requirements: 6.1, 6.3, 6.4
   */
  public update(_deltaTime: number): void {
    try {
      const currentTime = performance.now();
      
      // Calculate FPS
      if (this.lastFrameTime > 0) {
        const frameDuration = currentTime - this.lastFrameTime;
        if (frameDuration > 0) {
          const fps = 1000 / frameDuration;
          this.addFPSSample(fps);
        }
      }
      
      this.lastFrameTime = currentTime;
      this.frameCount++;
      
      // Periodic performance check
      if (currentTime - this.lastPerformanceCheck >= this.performanceCheckInterval) {
        this.performPerformanceCheck();
        this.lastPerformanceCheck = currentTime;
      }
      
    } catch (error) {
      Logger.log(`PerformanceMonitor: Update error - ${error}`);
    }
  }

  /**
   * Check if new particles can be created
   * Requirements: 1.4, 6.1, 6.3
   */
  public canCreateParticles(requestedCount: number): boolean {
    // Check particle count limit
    if (this.activeParticleCount + requestedCount > this.maxParticles) {
      Logger.log(`PerformanceMonitor: Particle limit reached (${this.activeParticleCount}/${this.maxParticles})`);
      return false;
    }

    // Check performance constraints
    const averageFPS = this.getAverageFPS();
    if (averageFPS > 0 && averageFPS < this.criticalPerformanceThreshold) {
      Logger.log(`PerformanceMonitor: Critical performance - blocking new particles (FPS: ${averageFPS.toFixed(1)})`);
      return false;
    }

    return true;
  }

  /**
   * Increment active particle count
   * Requirements: 6.1, 6.3
   */
  public incrementParticleCount(count: number): void {
    this.activeParticleCount += count;
    
    if (this.activeParticleCount > this.maxParticles) {
      Logger.log(`PerformanceMonitor: Warning - particle count exceeded limit: ${this.activeParticleCount}/${this.maxParticles}`);
    }
  }

  /**
   * Decrement active particle count
   * Requirements: 6.1, 6.3
   */
  public decrementParticleCount(count: number): void {
    this.activeParticleCount = Math.max(0, this.activeParticleCount - count);
  }

  /**
   * Get current active particle count
   * Requirements: 6.1, 6.3
   */
  public getActiveCount(): number {
    return this.activeParticleCount;
  }

  /**
   * Set maximum particle limit
   * Requirements: 6.1, 6.3
   */
  public setMaxParticles(maxParticles: number): void {
    const oldMax = this.maxParticles;
    this.maxParticles = maxParticles;
    Logger.log(`PerformanceMonitor: Max particles updated from ${oldMax} to ${maxParticles}`);
  }

  /**
   * Get average FPS over recent frames
   * Requirements: 6.1, 6.3, 6.4
   */
  public getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    
    const sum = this.fpsHistory.reduce((acc, fps) => acc + fps, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Check if quality should be reduced due to poor performance
   * Requirements: 6.1, 6.2, 6.3, 6.4
   */
  public shouldReduceQuality(): boolean {
    const averageFPS = this.getAverageFPS();
    
    // Only suggest quality reduction if we have enough FPS samples
    if (this.fpsHistory.length < 10) return false;
    
    // Check if FPS is consistently below threshold
    if (averageFPS > 0 && averageFPS < this.lowPerformanceThreshold) {
      const recentLowFrames = this.fpsHistory.slice(-5).filter(fps => fps < this.lowPerformanceThreshold).length;
      
      // If most recent frames are low, suggest quality reduction
      if (recentLowFrames >= 4) {
        Logger.log(`PerformanceMonitor: Suggesting quality reduction - Average FPS: ${averageFPS.toFixed(1)}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if emergency cleanup is needed
   * Requirements: 6.1, 6.2, 6.3, 6.4
   */
  public needsEmergencyCleanup(): boolean {
    const averageFPS = this.getAverageFPS();
    
    // Emergency cleanup if FPS is critically low or particle count is way over limit
    const criticalFPS = averageFPS > 0 && averageFPS < this.criticalPerformanceThreshold;
    const criticalParticleCount = this.activeParticleCount > this.maxParticles * 1.2;
    
    if (criticalFPS || criticalParticleCount) {
      Logger.log(`PerformanceMonitor: Emergency cleanup needed - FPS: ${averageFPS.toFixed(1)}, Particles: ${this.activeParticleCount}/${this.maxParticles}`);
      return true;
    }
    
    return false;
  }

  /**
   * Reset performance statistics
   * Requirements: 6.1, 6.3
   */
  public reset(): void {
    this.fpsHistory = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.lastPerformanceCheck = 0;
    Logger.log('PerformanceMonitor: Statistics reset');
  }

  /**
   * Get detailed performance report
   * Requirements: 6.1, 6.3, 6.4
   */
  public getPerformanceReport(): {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    activeParticles: number;
    maxParticles: number;
    utilizationPercent: number;
    frameCount: number;
  } {
    const averageFPS = this.getAverageFPS();
    const minFPS = this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory) : 0;
    const maxFPS = this.fpsHistory.length > 0 ? Math.max(...this.fpsHistory) : 0;
    const utilizationPercent = (this.activeParticleCount / this.maxParticles) * 100;

    return {
      averageFPS,
      minFPS,
      maxFPS,
      activeParticles: this.activeParticleCount,
      maxParticles: this.maxParticles,
      utilizationPercent,
      frameCount: this.frameCount
    };
  }

  // Private helper methods

  private addFPSSample(fps: number): void {
    // Clamp FPS to reasonable range to avoid outliers
    const clampedFPS = Math.min(Math.max(fps, 1), 120);
    
    this.fpsHistory.push(clampedFPS);
    
    // Keep only recent samples (last 60 frames for 1 second at 60fps)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }
  }

  private performPerformanceCheck(): void {
    try {
      const report = this.getPerformanceReport();
      
      // Log performance summary periodically
      if (this.frameCount % 300 === 0) { // Every 5 seconds at 60fps
        Logger.log(`PerformanceMonitor: FPS: ${report.averageFPS.toFixed(1)} (${report.minFPS.toFixed(1)}-${report.maxFPS.toFixed(1)}), Particles: ${report.activeParticles}/${report.maxParticles} (${report.utilizationPercent.toFixed(1)}%)`);
      }
      
      // Check for performance issues
      if (report.averageFPS > 0 && report.averageFPS < this.lowPerformanceThreshold) {
        Logger.log(`PerformanceMonitor: Performance warning - Low FPS detected: ${report.averageFPS.toFixed(1)}`);
      }
      
      if (report.utilizationPercent > 90) {
        Logger.log(`PerformanceMonitor: Performance warning - High particle utilization: ${report.utilizationPercent.toFixed(1)}%`);
      }
      
    } catch (error) {
      Logger.log(`PerformanceMonitor: Performance check error - ${error}`);
    }
  }
}
