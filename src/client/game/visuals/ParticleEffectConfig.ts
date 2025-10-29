/**
 * Centralized configuration for all particle effects
 * Provides easy tuning of particle system parameters
 * Requirements: 1.1, 1.2, 1.4, 6.1, 6.3
 */

/**
 * Default particle system configurations for different quality levels
 * Requirements: 6.1, 6.2, 6.3
 */
export const PARTICLE_QUALITY_CONFIGS = {
  low: {
    maxParticles: 50,
    enableEffects: true,
    performanceMode: true,
    particleScale: 0.5,
    effectDurationScale: 0.7,
    particleCountScale: 0.5
  },
  medium: {
    maxParticles: 100,
    enableEffects: true,
    performanceMode: false,
    particleScale: 0.75,
    effectDurationScale: 0.85,
    particleCountScale: 0.75
  },
  high: {
    maxParticles: 200,
    enableEffects: true,
    performanceMode: false,
    particleScale: 1.0,
    effectDurationScale: 1.0,
    particleCountScale: 1.0
  },
  ultra: {
    maxParticles: 300,
    enableEffects: true,
    performanceMode: false,
    particleScale: 1.25,
    effectDurationScale: 1.2,
    particleCountScale: 1.25
  }
};

/**
 * Effect-specific configurations
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4
 */
export const EFFECT_TYPES = {
  MATCH_EXPLOSION: 'match_explosion',
  CASCADE_TRAIL: 'cascade_trail',
  COMBO_CELEBRATION: 'combo_celebration',
  PLACEMENT_IMPACT: 'placement_impact',
  SPECIAL_DICE_AURA: 'special_dice_aura'
} as const;

/**
 * Performance thresholds for automatic quality adjustment
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export const PERFORMANCE_THRESHOLDS = {
  LOW_FPS_WARNING: 45,
  CRITICAL_FPS: 30,
  HIGH_PARTICLE_UTILIZATION: 0.9,
  EMERGENCY_CLEANUP_THRESHOLD: 1.2,
  FPS_SAMPLE_SIZE: 60,
  PERFORMANCE_CHECK_INTERVAL: 1000
};

/**
 * Default particle system configuration
 * Requirements: 1.1, 1.2, 6.1
 */
export const DEFAULT_PARTICLE_CONFIG = {
  qualityLevel: 'medium' as const,
  maxParticles: PARTICLE_QUALITY_CONFIGS.medium.maxParticles,
  enableEffects: true,
  performanceMode: false
};

/**
 * Mobile-specific optimizations
 * Requirements: 6.1, 6.2, 6.4
 */
export const MOBILE_PARTICLE_CONFIG = {
  qualityLevel: 'low' as const,
  maxParticles: PARTICLE_QUALITY_CONFIGS.low.maxParticles,
  enableEffects: true,
  performanceMode: true
};

/**
 * Get particle configuration based on device capabilities
 * Requirements: 6.1, 6.2, 6.4
 */
export function getOptimalParticleConfig() {
  // Simple mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check for low-end device indicators
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  
  if (isMobile || isLowEnd) {
    return { ...MOBILE_PARTICLE_CONFIG };
  }
  
  return { ...DEFAULT_PARTICLE_CONFIG };
}

/**
 * Particle effect priority levels for cleanup decisions
 * Requirements: 1.4, 6.1, 6.3
 */
export const EFFECT_PRIORITIES = {
  [EFFECT_TYPES.MATCH_EXPLOSION]: 3, // High priority - core gameplay feedback
  [EFFECT_TYPES.COMBO_CELEBRATION]: 3, // High priority - important player feedback
  [EFFECT_TYPES.PLACEMENT_IMPACT]: 2, // Medium priority
  [EFFECT_TYPES.SPECIAL_DICE_AURA]: 2, // Medium priority
  [EFFECT_TYPES.CASCADE_TRAIL]: 1 // Low priority - can be sacrificed for performance
};

/**
 * Maximum effect lifetimes in milliseconds
 * Requirements: 1.2, 6.1, 6.3
 */
export const EFFECT_LIFETIMES = {
  [EFFECT_TYPES.MATCH_EXPLOSION]: 1000,
  [EFFECT_TYPES.CASCADE_TRAIL]: 800,
  [EFFECT_TYPES.COMBO_CELEBRATION]: 2000,
  [EFFECT_TYPES.PLACEMENT_IMPACT]: 500,
  [EFFECT_TYPES.SPECIAL_DICE_AURA]: 3000
};
