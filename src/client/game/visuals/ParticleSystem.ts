/**
 * Particle System - Main export file
 * Provides a unified interface for the particle system components
 * Requirements: 1.1, 1.2, 1.4, 6.1, 6.3
 */

// Core particle system components
export { ParticleSystemManager } from './ParticleSystemManager';
export { ParticlePool } from './ParticlePool';
export { PerformanceMonitor } from './PerformanceMonitor';
export { EmitterManager } from './EmitterManager';

// Configuration and types
export {
  PARTICLE_QUALITY_CONFIGS,
  EFFECT_TYPES,
  PERFORMANCE_THRESHOLDS,
  DEFAULT_PARTICLE_CONFIG,
  MOBILE_PARTICLE_CONFIG,
  EFFECT_PRIORITIES,
  EFFECT_LIFETIMES,
  getOptimalParticleConfig
} from './ParticleEffectConfig';

// Type exports
export type {
  ParticleSystemConfig,
  PerformanceStats,
  PooledParticle
} from './ParticleSystemManager';

/**
 * Factory function to create a configured particle system
 * Requirements: 1.1, 1.2, 6.1
 */
export function createParticleSystem(scene: Phaser.Scene, customConfig?: Partial<import('./ParticleSystemManager').ParticleSystemConfig>) {
  const optimalConfig = getOptimalParticleConfig();
  const config = { ...optimalConfig, ...customConfig };
  
  const particleSystem = new ParticleSystemManager();
  particleSystem.initialize(scene, config);
  
  return particleSystem;
}
