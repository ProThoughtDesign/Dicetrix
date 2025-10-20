import { vi } from 'vitest';

// Mock Phaser globally for all tests
global.Phaser = {
  Scene: class MockScene {
    tweens = {
      add: vi.fn().mockImplementation((config) => {
        if (config.onComplete) {
          setTimeout(config.onComplete, 0);
        }
        return { on: vi.fn(), complete: vi.fn() };
      })
    };
    time = {
      delayedCall: vi.fn().mockImplementation((delay, callback) => {
        setTimeout(callback, 0);
      })
    };
    events = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };
    add = {
      existing: vi.fn().mockReturnThis(),
      particles: vi.fn().mockReturnValue({
        emitParticleAt: vi.fn(),
        destroy: vi.fn()
      }),
      circle: vi.fn().mockReturnValue({
        destroy: vi.fn(),
        setAlpha: vi.fn(),
        setPosition: vi.fn()
      }),
      graphics: vi.fn().mockReturnValue({
        lineStyle: vi.fn(),
        lineBetween: vi.fn(),
        setAlpha: vi.fn(),
        destroy: vi.fn()
      }),
      text: vi.fn().mockReturnValue({
        setOrigin: vi.fn(),
        setAlpha: vi.fn(),
        destroy: vi.fn()
      }),
      rectangle: vi.fn().mockReturnValue({
        destroy: vi.fn()
      }),
      sprite: vi.fn().mockReturnValue({
        setPosition: vi.fn(),
        setTexture: vi.fn(),
        setTint: vi.fn(),
        setAlpha: vi.fn(),
        setScale: vi.fn(),
        destroy: vi.fn()
      })
    };
    scale = {
      width: 800,
      height: 600
    };
    cameras = {
      main: {
        shake: vi.fn()
      }
    };
  },
  GameObjects: {
    Sprite: class MockSprite {
      x = 0;
      y = 0;
      setPosition = vi.fn().mockReturnThis();
      setTexture = vi.fn().mockReturnThis();
      setTint = vi.fn().mockReturnThis();
      setAlpha = vi.fn().mockReturnThis();
      setScale = vi.fn().mockReturnThis();
      destroy = vi.fn();
    },
    Group: class MockGroup {
      children = {
        entries: []
      };
      add = vi.fn();
      remove = vi.fn();
      destroy = vi.fn();
    }
  }
} as any;

// Mock performance API for performance tests
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
} as any;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};
