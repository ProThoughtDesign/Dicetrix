/**
 * VisualConfig contains all configuration for visual effects, animations, and styling
 * Centralizes visual parameters for easy tweaking and consistency
 */

export const VISUAL_CONFIG = {
  // Dice rendering
  DICE: {
    BASE_SIZE: 64,
    DISPLAY_SIZE: 32,
    GLOW_INTENSITY: 0.5,
    BORDER_RADIUS: 0.1,
    GLOW_SCALE_MULTIPLIER: 1.2
  },

  // Color palette for neon theme
  COLORS: {
    PALETTE: {
      red: 0xff3366,
      blue: 0x3366ff,
      green: 0x33ff66,
      yellow: 0xffff33,
      purple: 0xcc33ff,
      orange: 0xff9933,
      cyan: 0x33ffff
    },
    DARK_VARIANTS: {
      red: 0xaa1144,
      blue: 0x1144aa,
      green: 0x11aa44,
      yellow: 0xaaaa11,
      purple: 0x8811aa,
      orange: 0xaa6611,
      cyan: 0x11aaaa
    },
    SPECIAL: {
      wild: 0xffffff,
      black: 0xff0000,
      background: 0x0a0a1a,
      grid: 0x003366
    }
  },

  // Animation durations and easing
  ANIMATIONS: {
    PIECE_FALL: {
      duration: 300,
      ease: 'Power2'
    },
    PIECE_MOVE: {
      duration: 150,
      ease: 'Power1'
    },
    PIECE_ROTATE: {
      duration: 200,
      ease: 'Back.easeOut'
    },
    PIECE_LOCK: {
      duration: 100,
      ease: 'Power2'
    },
    DICE_CLEAR: {
      duration: 400,
      stagger: 50,
      ease: 'Power2'
    },
    GRAVITY: {
      duration: 300,
      stagger: 30,
      ease: 'Bounce.easeOut'
    },
    MATCH_HIGHLIGHT: {
      duration: 500,
      ease: 'Sine.easeInOut'
    },
    UI_SLIDE: {
      duration: 400,
      ease: 'Back.easeOut'
    },
    SCORE_POPUP: {
      duration: 1200,
      ease: 'Power2'
    },
    LEVEL_UP: {
      duration: 2000,
      ease: 'Power2'
    }
  },

  // Particle effect settings
  PARTICLES: {
    MATCH_EFFECT: {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 600,
      quantityMultiplier: 3
    },
    CASCADE_EFFECT: {
      speed: { min: 100, max: 300 },
      scale: { start: 0.6, end: 0.1 },
      lifespan: 500,
      quantityMultiplier: 2
    },
    ULTIMATE_COMBO: {
      speed: { min: 200, max: 500 },
      scale: { start: 1.5, end: 0 },
      lifespan: 1500,
      quantity: 50
    },
    WILD_SPAWN: {
      speed: { min: 20, max: 80 },
      scale: { start: 0.6, end: 0.1 },
      lifespan: 1000,
      quantity: 5
    }
  },

  // Screen effects
  SCREEN_EFFECTS: {
    SHAKE: {
      small: { intensity: 0.01, duration: 200 },
      medium: { intensity: 0.02, duration: 500 },
      large: { intensity: 0.03, duration: 1000 }
    },
    FLASH: {
      match: { alpha: 0.3, duration: 300 },
      combo: { alpha: 0.5, duration: 500 },
      levelUp: { alpha: 0.3, duration: 500 }
    }
  },

  // Neon theme settings
  NEON_THEME: {
    BACKGROUND_GRID: {
      lineWidth: 1,
      color: 0x003366,
      alpha: 0.3,
      spacing: 40
    },
    AMBIENT_GLOW: {
      zones: [
        { x: 0.2, y: 0.3, color: 0x003366, alpha: 0.1 },
        { x: 0.8, y: 0.7, color: 0x330066, alpha: 0.1 },
        { x: 0.5, y: 0.1, color: 0x006633, alpha: 0.1 }
      ],
      radius: 200,
      pulseSpeed: 3000
    },
    GLOW_EFFECTS: {
      intensity: 0.5,
      pulseSpeed: 1000,
      scaleMultiplier: 1.4
    }
  },

  // UI styling
  UI: {
    FONTS: {
      primary: 'Arial Black',
      secondary: 'Arial'
    },
    TEXT_STYLES: {
      title: {
        fontSize: '48px',
        color: '#00ff88',
        stroke: '#000000',
        strokeThickness: 6
      },
      score: {
        fontSize: '24px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3
      },
      chain: {
        fontSize: '20px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3
      },
      combo: {
        fontSize: '32px',
        color: '#ff0066',
        stroke: '#ffffff',
        strokeThickness: 4
      },
      loading: {
        fontSize: '32px',
        color: '#00ff88',
        stroke: '#000000',
        strokeThickness: 4
      }
    },
    PANELS: {
      background: 0x222222,
      border: 0x00ff88,
      borderWidth: 3,
      alpha: 0.8,
      radius: 10
    }
  },

  // Performance settings
  PERFORMANCE: {
    MAX_PARTICLES: 200,
    MAX_ACTIVE_TWEENS: 50,
    PARTICLE_CLEANUP_DELAY: 100,
    EFFECT_CLEANUP_DELAY: 500
  }
} as const;

// Type definitions for visual config
export type VisualConfigType = typeof VISUAL_CONFIG;
export type ColorName = keyof typeof VISUAL_CONFIG.COLORS.PALETTE;
export type AnimationType = keyof typeof VISUAL_CONFIG.ANIMATIONS;
