import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystemManager, ParticleSystemConfig } from '../ParticleSystemManager';

// Mock Phaser completely to avoid canvas issues
vi.mock('phaser', () => ({
  Math: {
    Vector2: class MockVector2 {
      constructor(public x: number, public y: number) {}
    }
  }
}));

// Mock Logger
vi.mock('../../../utils/Logger', () => ({
  default: {
    log: vi.fn()
  }
}));

// Mock all particle system components
vi.mock('../ParticlePool', () => ({
  ParticlePool: class MockParticlePool {
    constructor() {}
    cleanup() {}
    destroy() {}
    getTotalParticleCount() { return 0; }
    getActiveParticleCount() { return 0; }
  }
}));

vi.mock('../PerformanceMonitor', () => ({
  PerformanceMonitor: class MockPerformanceMonitor {
    constructor() {}
    update() {}
    canCreateParticles() { return true; }
    incrementParticleCount() {}
    decrementParticleCount() {}
    getActiveCount() { return 0; }
    setMaxParticles() {}
    getAverageFPS() { return 60; }
    shouldReduceQuality() { return false; }
  }
}));

vi.mock('../EmitterManager', () => ({
  EmitterManager: class MockEmitterManager {
    constructor() {}
    createMatchExplosion() { return {}; }
    createCascadeTrail() { return {}; }
    createComboEffect() { return {}; }
    createPlacementImpact() { return {}; }
    createSpecialDiceAura() { return {}; }
    destroy() {}
  }
}));

vi.mock('../CascadeEffectManager', () => ({
  CascadeEffectManager: class MockCascadeEffectManager {
    constructor() {}
    startCascadeTrail() {}
    updateTrailPosition() {}
    endCascadeTrail() {}
    cleanup() {}
    destroy() {}
    getActiveTrailCount() { return 0; }
  }
}));

vi.mock('../PlacementEffectManager', () => ({
  PlacementEffectManager: class MockPlacementEffectManager {
    constructor() {}
    createPlacementImpact() {}
    createRotationFeedback() {}
    createMovementTrail() {}
    createHorizontalMovementFeedback() {}
    createHardDropImpact() {}
    cleanup() {}
    destroy() {}
    getActiveEffectCount() { return 0; }
  }
}));

describe('ParticleSystemManager', () => {
  let particleSystem: ParticleSystemManager;
  let config: ParticleSystemConfig;
  let mockScene: any;

  beforeEach(() => {
    particleSystem = new ParticleSystemManager();
    config = {
      maxParticles: 100,
      qualityLevel: 'medium',
      enableEffects: true,
      performanceMode: false
    };
    
    mockScene = {}; // Minimal mock scene
    
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should create instance successfully', () => {
    expect(particleSystem).toBeDefined();
  });

  it('should initialize with config', () => {
    particleSystem.initialize(mockScene, config);
    
    const stats = particleSystem.getPerformanceStats();
    expect(stats.maxParticles).toBe(100);
    expect(stats.qualityLevel).toBe('medium');
  });

  it('should adjust quality level', () => {
    particleSystem.initialize(mockScene, config);
    
    particleSystem.adjustQuality('low');
    
    const stats = particleSystem.getPerformanceStats();
    expect(stats.qualityLevel).toBe('low');
    expect(stats.maxParticles).toBe(50);
  });

  it('should handle uninitialized state gracefully', () => {
    const stats = particleSystem.getPerformanceStats();
    expect(stats.activeParticleCount).toBe(0);
    expect(stats.maxParticles).toBe(0);
    expect(stats.qualityLevel).toBe('low');
  });

  it('should destroy cleanly', () => {
    particleSystem.initialize(mockScene, config);
    
    expect(() => {
      particleSystem.destroy();
    }).not.toThrow();
  });
});
