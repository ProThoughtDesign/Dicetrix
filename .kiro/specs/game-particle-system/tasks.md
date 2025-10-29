# Particle System Implementation Plan

- [x] 1. Create core particle system infrastructure

  - Create ParticleSystemManager class with Phaser integration
  - Implement basic particle pooling system for performance
  - Set up particle count limits and cleanup mechanisms
  - Create base particle effect configuration system
  - _Requirements: 1.1, 1.2, 1.4, 6.1, 6.3_

- [x] 2. Implement match explosion effects

  - Create MatchEffectManager for dice match explosions
  - Implement color-coded particle explosions based on dice colors
  - Add particle scaling based on match size (larger matches = more particles)
  - Integrate with existing match detection system in Game scene
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Add cascade and movement particle effects

  - Create CascadeEffectManager for falling piece trails
  - Implement particle trails that follow moving dice during gravity
  - Add PlacementEffectManager for piece placement impact effects
  - Create subtle rotation and movement feedback particles
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4_

- [x] 4. Implement combo celebration effects

  - Create ComboEffectManager for multiplier-based celebrations
  - Add escalating particle effects based on combo multiplier level
  - Implement special fireworks effects for high combo chains (5x+)
  - Integrate with existing scoring and combo systems
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 5. Add special dice particle effects

  - Create SpecialDiceEffectManager for booster and special dice
  - Implement glowing aura effects around enhanced dice
  - Add energy burst effects for booster activation
  - Create magical transformation effects for black dice (wild cards)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6. Integrate particle system with Game scene


  - Add ParticleSystemManager to Game scene initialization
  - Connect particle effects to existing game event systems
  - Ensure particles don't interfere with gameplay visibility
  - Add proper cleanup when scene transitions occur
  - _Requirements: 1.3, 2.5, 4.5, 5.5_

- [ ]\* 7. Create particle system tests

  - Write unit tests for ParticleSystemManager core functionality
  - Test particle creation, pooling, and cleanup mechanisms
  - Verify integration with game events and proper effect triggering
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 8. Performance optimization and polish
  - Implement performance monitoring and particle count limits
  - Add automatic cleanup of expired particle effects
  - Fine-tune particle configurations for optimal performance
  - Ensure smooth 60fps performance with multiple simultaneous effects
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
