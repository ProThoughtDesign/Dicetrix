/**
 * Object pooling system for optimizing memory allocation and garbage collection
 * Provides reusable objects for dice, effects, and other frequently created/destroyed objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: ((obj: T) => void) | undefined;
  private maxSize: number;
  private activeObjects = new Set<T>();
  
  constructor(
    createFunction: () => T,
    resetFunction?: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.createFn = createFunction;
    this.resetFn = resetFunction || undefined;
    this.maxSize = maxSize;
  }
  
  /**
   * Get an object from the pool or create a new one
   */
  public acquire(): T {
    let obj: T;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.createFn();
    }
    
    this.activeObjects.add(obj);
    return obj;
  }
  
  /**
   * Return an object to the pool
   */
  public release(obj: T): void {
    if (!this.activeObjects.has(obj)) {
      console.warn('Attempting to release object not acquired from this pool');
      return;
    }
    
    this.activeObjects.delete(obj);
    
    // Reset object if reset function provided
    if (this.resetFn) {
      this.resetFn(obj);
    }
    
    // Only add back to pool if under max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }
  
  /**
   * Pre-populate the pool with objects
   */
  public prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.pool.length < this.maxSize) {
        this.pool.push(this.createFn());
      }
    }
  }
  
  /**
   * Clear the pool and release all objects
   */
  public clear(): void {
    this.pool = [];
    this.activeObjects.clear();
  }
  
  /**
   * Get pool statistics
   */
  public getStats(): PoolStats {
    return {
      poolSize: this.pool.length,
      activeObjects: this.activeObjects.size,
      maxSize: this.maxSize,
      utilizationRate: this.activeObjects.size / (this.pool.length + this.activeObjects.size)
    };
  }
}

/**
 * Pool statistics interface
 */
export interface PoolStats {
  poolSize: number;
  activeObjects: number;
  maxSize: number;
  utilizationRate: number;
}

/**
 * Specialized object pool manager for game objects
 */
export class GameObjectPoolManager {
  private static instance: GameObjectPoolManager;
  
  // Pools for different object types
  private dicePool: ObjectPool<Phaser.GameObjects.Sprite>;
  private particlePool: ObjectPool<Phaser.GameObjects.Particles.ParticleEmitter>;
  private textPool: ObjectPool<Phaser.GameObjects.Text>;
  
  private scene: Phaser.Scene;
  
  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializePools();
  }
  
  public static getInstance(scene?: Phaser.Scene): GameObjectPoolManager {
    if (!GameObjectPoolManager.instance && scene) {
      GameObjectPoolManager.instance = new GameObjectPoolManager(scene);
    }
    return GameObjectPoolManager.instance;
  }
  
  /**
   * Initialize all object pools
   */
  private initializePools(): void {
    // Dice sprite pool
    this.dicePool = new ObjectPool<Phaser.GameObjects.Sprite>(
      () => this.scene.add.sprite(0, 0, 'die-placeholder').setVisible(false),
      (sprite) => {
        sprite.setVisible(false);
        sprite.setPosition(0, 0);
        sprite.setAlpha(1);
        sprite.setScale(1);
        sprite.setRotation(0);
        sprite.clearTint();
      },
      50 // Max 50 dice sprites in pool
    );
    
    // Particle emitter pool
    this.particlePool = new ObjectPool<Phaser.GameObjects.Particles.ParticleEmitter>(
      () => this.scene.add.particles(0, 0, 'particle', {}).setVisible(false),
      (emitter) => {
        emitter.setVisible(false);
        emitter.stop();
        emitter.setPosition(0, 0);
      },
      20 // Max 20 particle emitters
    );
    
    // Text object pool
    this.textPool = new ObjectPool<Phaser.GameObjects.Text>(
      () => this.scene.add.text(0, 0, '', { fontSize: '16px' }).setVisible(false),
      (text) => {
        text.setVisible(false);
        text.setPosition(0, 0);
        text.setText('');
        text.setAlpha(1);
        text.setScale(1);
      },
      30 // Max 30 text objects
    );
  }
  
  /**
   * Get a dice sprite from the pool
   */
  public acquireDiceSprite(): Phaser.GameObjects.Sprite {
    const sprite = this.dicePool.acquire();
    sprite.setVisible(true);
    return sprite;
  }
  
  /**
   * Return a dice sprite to the pool
   */
  public releaseDiceSprite(sprite: Phaser.GameObjects.Sprite): void {
    this.dicePool.release(sprite);
  }
  
  /**
   * Get a particle emitter from the pool
   */
  public acquireParticleEmitter(): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = this.particlePool.acquire();
    emitter.setVisible(true);
    return emitter;
  }
  
  /**
   * Return a particle emitter to the pool
   */
  public releaseParticleEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    this.particlePool.release(emitter);
  }
  
  /**
   * Get a text object from the pool
   */
  public acquireText(): Phaser.GameObjects.Text {
    const text = this.textPool.acquire();
    text.setVisible(true);
    return text;
  }
  
  /**
   * Return a text object to the pool
   */
  public releaseText(text: Phaser.GameObjects.Text): void {
    this.textPool.release(text);
  }
  
  /**
   * Prewarm all pools
   */
  public prewarmPools(): void {
    this.dicePool.prewarm(20);
    this.particlePool.prewarm(5);
    this.textPool.prewarm(10);
  }
  
  /**
   * Get statistics for all pools
   */
  public getAllStats(): Record<string, PoolStats> {
    return {
      dice: this.dicePool.getStats(),
      particles: this.particlePool.getStats(),
      text: this.textPool.getStats()
    };
  }
  
  /**
   * Clear all pools
   */
  public clearAllPools(): void {
    this.dicePool.clear();
    this.particlePool.clear();
    this.textPool.clear();
  }
  
  /**
   * Update pools (call this periodically to manage memory)
   */
  public update(): void {
    // Could implement periodic cleanup or optimization here
    // For now, just log stats if performance is poor
    const performanceMonitor = PerformanceMonitor.getInstance();
    if (!performanceMonitor.isPerformanceAcceptable()) {
      console.log('Pool stats during poor performance:', this.getAllStats());
    }
  }
}

/**
 * Import PerformanceMonitor for type checking
 */
import { PerformanceMonitor } from './PerformanceMonitor.js';
