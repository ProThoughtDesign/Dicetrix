import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HybridAudioServiceImpl, AudioMode } from '../HybridAudioService';

// Mock Strudel imports
vi.mock('@strudel/webaudio', () => ({
  initAudioOnFirstClick: vi.fn(),
  getAudioContext: vi.fn(() => ({
    state: 'running',
    sampleRate: 44100,
    currentTime: 0,
    baseLatency: 0.01,
    destination: {},
    listener: {}
  }))
}));

// Mock Phaser completely to avoid canvas issues
vi.mock('phaser', () => ({
  Scene: vi.fn().mockImplementation(() => ({
    sound: {
      context: { state: 'running' },
      add: vi.fn(() => ({
        play: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        once: vi.fn(),
        isPlaying: false,
        isPaused: false,
        setVolume: vi.fn(),
        volume: 1
      }))
    },
    scene: { key: 'test' },
    cache: {
      audio: {
        exists: vi.fn(() => true)
      }
    }
  }))
}));

// Mock StrudelMusic
vi.mock('../music/StrudelMusic', () => ({
  StrudelMusic: {
    createMenuTheme: vi.fn(() => ({
      gain: vi.fn(() => ({ 
        play: vi.fn(() => ({
          stop: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn()
        }))
      }))
    })),
    createEasyMode: vi.fn(() => ({
      gain: vi.fn(() => ({ 
        play: vi.fn(() => ({
          stop: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock Logger
vi.mock('../../../utils/Logger', () => ({
  default: {
    log: vi.fn(),
    withSilentLogging: vi.fn((fn) => fn())
  }
}));

describe('HybridAudioService Audio Fix Validation', () => {
  let service: HybridAudioServiceImpl;
  let mockScene: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create fresh service instance
    service = (HybridAudioServiceImpl as any).getInstance();
    
    // Reset service state
    service.resetInitializationState();
    
    // Create mock scene with proper Phaser audio setup
    mockScene = {
      sound: {
        context: { 
          state: 'running',
          sampleRate: 44100,
          currentTime: 0,
          baseLatency: 0.01,
          destination: {},
          listener: {}
        },
        add: vi.fn(() => ({
          play: vi.fn(),
          stop: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          destroy: vi.fn(),
          once: vi.fn(),
          isPlaying: false,
          isPaused: false,
          setVolume: vi.fn(),
          volume: 1
        }))
      },
      scene: { key: 'test' },
      cache: {
        audio: {
          exists: vi.fn(() => true)
        }
      }
    };
  });

  afterEach(() => {
    service.destroy();
  });

  describe('5.1 Timeout Scenarios', () => {
    it('should timeout Strudel initialization after 5 seconds', async () => {
      const { initAudioOnFirstClick } = await import('@strudel/webaudio');
      
      // Mock initAudioOnFirstClick to hang indefinitely
      vi.mocked(initAudioOnFirstClick).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      await service.initialize(mockScene);

      const startTime = Date.now();
      
      // Trigger initialization that should timeout
      service.playMusic('menu-theme');
      
      // Wait for timeout to occur
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      const duration = Date.now() - startTime;
      
      // Should timeout around 5 seconds (allow some tolerance)
      expect(duration).toBeGreaterThan(4900);
      expect(duration).toBeLessThan(6500);
      
      // Should have switched to fallback mode after timeout
      expect(service.getCurrentAudioMode()).toBe(AudioMode.PHASER_ONLY);
    }, 10000);

    it('should activate fallback mode after timeout', async () => {
      const { initAudioOnFirstClick } = await import('@strudel/webaudio');
      
      // Mock initAudioOnFirstClick to timeout
      vi.mocked(initAudioOnFirstClick).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      await service.initialize(mockScene);
      
      // Initially should be in Strudel mode
      expect(service.getCurrentAudioMode()).toBe(AudioMode.STRUDEL);
      
      // Trigger initialization
      service.playMusic('menu-theme');
      
      // Wait for timeout and fallback activation
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Should have switched to fallback mode
      expect(service.getCurrentAudioMode()).toBe(AudioMode.PHASER_ONLY);
    }, 10000);

    it('should validate state transitions and logging during timeout', async () => {
      const { initAudioOnFirstClick } = await import('@strudel/webaudio');
      const Logger = (await import('../../../utils/Logger')).default;
      
      // Mock initAudioOnFirstClick to timeout
      vi.mocked(initAudioOnFirstClick).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      await service.initialize(mockScene);
      
      // Clear previous logs
      vi.mocked(Logger.log).mockClear();
      
      // Trigger initialization
      service.playMusic('menu-theme');
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Verify timeout logging occurred
      const logCalls = vi.mocked(Logger.log).mock.calls;
      const timeoutLogs = logCalls.filter(call => 
        call[0].includes('AUDIO_TIMEOUT') || call[0].includes('timed out')
      );
      
      expect(timeoutLogs.length).toBeGreaterThan(0);
      
      // Verify fallback activation logging
      const fallbackLogs = logCalls.filter(call => 
        call[0].includes('AUDIO_FALLBACK') || call[0].includes('fallback mode')
      );
      
      expect(fallbackLogs.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('5.2 Fallback Modes', () => {
    it('should verify Phaser-only audio functionality works correctly', async () => {
      // Force fallback mode
      service.enableFallbackMode();
      await service.initialize(mockScene);
      
      expect(service.getCurrentAudioMode()).toBe(AudioMode.PHASER_ONLY);
      
      // Test music playback in Phaser-only mode
      service.playMusic('menu-theme');
      
      // Verify Phaser sound.add was called
      expect(mockScene.sound.add).toHaveBeenCalled();
      
      // Test sound effects still work
      service.playSound('click');
      expect(mockScene.sound.add).toHaveBeenCalledWith('click', expect.any(Object));
    });

    it('should test silent mode operation and UI behavior', async () => {
      // Force silent mode
      service.enableSilentMode();
      await service.initialize(mockScene);
      
      expect(service.getCurrentAudioMode()).toBe(AudioMode.SILENT);
      
      // Test that music calls are handled gracefully
      expect(() => service.playMusic('menu-theme')).not.toThrow();
      expect(() => service.stopMusic()).not.toThrow();
      expect(() => service.pauseMusic()).not.toThrow();
      expect(() => service.resumeMusic()).not.toThrow();
      
      // Test that sound calls are handled gracefully
      expect(() => service.playSound('click')).not.toThrow();
      
      // Test that settings still work
      expect(() => service.setMusicEnabled(false)).not.toThrow();
      expect(() => service.setSoundEnabled(false)).not.toThrow();
      expect(() => service.setMusicVolume(0.5)).not.toThrow();
      expect(() => service.setSoundVolume(0.5)).not.toThrow();
      
      // Verify settings are preserved
      expect(service.getMusicEnabled()).toBe(false);
      expect(service.getSoundEnabled()).toBe(false);
    });

    it('should validate mode switching during runtime', async () => {
      await service.initialize(mockScene);
      
      // Start in Strudel mode
      expect(service.getCurrentAudioMode()).toBe(AudioMode.STRUDEL);
      
      // Switch to fallback mode
      service.enableFallbackMode();
      expect(service.getCurrentAudioMode()).toBe(AudioMode.PHASER_ONLY);
      
      // Clear previous calls and test music playback works in new mode
      vi.mocked(mockScene.sound.add).mockClear();
      
      // Mock that the audio cache exists for the sound - need to mock specific sound keys
      mockScene.cache.audio.exists.mockImplementation((key: string) => {
        return key === 'menu-music' || key === 'menu-theme'; // Both original and mapped keys
      });
      
      service.playMusic('menu-theme');
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockScene.sound.add).toHaveBeenCalled();
      
      // Switch to silent mode
      service.enableSilentMode();
      expect(service.getCurrentAudioMode()).toBe(AudioMode.SILENT);
      
      // Test graceful handling in silent mode
      expect(() => service.playMusic('menu-theme')).not.toThrow();
    });
  });

  describe('5.3 Integration Testing with Game Scenes', () => {
    it('should test audio initialization from SplashScreen scene', async () => {
      // Mock SplashScreen scene
      const splashScene = {
        ...mockScene,
        scene: { key: 'SplashScreen' },
        sound: {
          ...mockScene.sound,
          context: { state: 'suspended' } // Typical initial state
        }
      };
      
      await service.initialize(splashScene);
      
      // Should initialize successfully even with suspended context
      expect(service.isInitialized()).toBe(true);
      
      // Should handle user interaction for audio context resume
      service.playMusic('menu-theme');
      
      // Should not throw errors
      expect(() => service.playSound('click')).not.toThrow();
    });

    it('should verify StartMenu music playback works in all modes', async () => {
      await service.initialize(mockScene);
      
      // Test Strudel mode
      expect(service.getCurrentAudioMode()).toBe(AudioMode.STRUDEL);
      service.playMusic('menu-theme');
      
      // Switch to Phaser-only mode and test
      service.enableFallbackMode();
      vi.mocked(mockScene.sound.add).mockClear();
      
      // Mock that the audio cache exists for the sound - need to mock specific sound keys
      mockScene.cache.audio.exists.mockImplementation((key: string) => {
        return key === 'menu-music' || key === 'menu-theme'; // Both original and mapped keys
      });
      
      service.playMusic('menu-theme');
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockScene.sound.add).toHaveBeenCalled();
      
      // Switch to silent mode and test
      service.enableSilentMode();
      expect(() => service.playMusic('menu-theme')).not.toThrow();
      
      // Test music controls in all modes
      expect(() => service.stopMusic()).not.toThrow();
      expect(() => service.pauseMusic()).not.toThrow();
      expect(() => service.resumeMusic()).not.toThrow();
    });

    it('should test Settings scene audio controls with different modes', async () => {
      // Mock Settings scene
      const settingsScene = {
        ...mockScene,
        scene: { key: 'Settings' }
      };
      
      await service.initialize(settingsScene);
      
      // Test audio controls in Strudel mode
      expect(service.getCurrentAudioMode()).toBe(AudioMode.STRUDEL);
      
      service.setMusicEnabled(false);
      expect(service.getMusicEnabled()).toBe(false);
      
      service.setMusicVolume(0.5);
      service.setSoundVolume(0.7);
      
      // Switch to fallback mode and test controls
      service.enableFallbackMode();
      
      service.setMusicEnabled(true);
      expect(service.getMusicEnabled()).toBe(true);
      
      vi.mocked(mockScene.sound.add).mockClear();
      service.playMusic('menu-theme');
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockScene.sound.add).toHaveBeenCalled();
      
      // Switch to silent mode and test controls
      service.enableSilentMode();
      
      // Controls should still work without errors
      expect(() => service.setMusicEnabled(false)).not.toThrow();
      expect(() => service.setMusicVolume(0.3)).not.toThrow();
      expect(() => service.setSoundEnabled(false)).not.toThrow();
      expect(() => service.setSoundVolume(0.8)).not.toThrow();
      
      // Settings should be preserved
      expect(service.getMusicEnabled()).toBe(false);
      expect(service.getSoundEnabled()).toBe(false);
    });

    it('should handle scene transitions and state management', async () => {
      // Test initialization with different scenes
      const scenes = [
        { scene: { key: 'SplashScreen' } },
        { scene: { key: 'StartMenu' } },
        { scene: { key: 'Settings' } },
        { scene: { key: 'Game' } }
      ];
      
      for (const sceneConfig of scenes) {
        const testScene = {
          ...mockScene,
          ...sceneConfig
        };
        
        // Reset and initialize with new scene
        service.resetInitializationState();
        await service.initialize(testScene);
        
        expect(service.isInitialized()).toBe(true);
        
        // Test basic functionality
        expect(() => service.playMusic('menu-theme')).not.toThrow();
        expect(() => service.playSound('click')).not.toThrow();
      }
    });
  });

  describe('Error Recovery and State Management', () => {
    it('should prevent multiple simultaneous initialization attempts', async () => {
      const { initAudioOnFirstClick } = await import('@strudel/webaudio');
      
      // Mock initAudioOnFirstClick to take 2 seconds
      vi.mocked(initAudioOnFirstClick).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );

      await service.initialize(mockScene);
      
      // Ensure Strudel is not initialized so playMusic will trigger initialization
      expect(service.getCurrentAudioMode()).toBe(AudioMode.STRUDEL);
      
      // Clear any previous calls
      vi.mocked(initAudioOnFirstClick).mockClear();

      // Start multiple music requests simultaneously that should trigger initialization
      service.playMusic('menu-theme');
      service.playMusic('menu-theme');
      service.playMusic('menu-theme');
      
      // Wait for initialization attempts to complete
      await new Promise(resolve => setTimeout(resolve, 2500));

      // initAudioOnFirstClick should only be called once due to deduplication
      expect(initAudioOnFirstClick).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum initialization attempts', async () => {
      const { initAudioOnFirstClick } = await import('@strudel/webaudio');
      
      // Mock initAudioOnFirstClick to always fail
      vi.mocked(initAudioOnFirstClick).mockRejectedValue(new Error('Initialization failed'));

      await service.initialize(mockScene);
      
      // Ensure we start in Strudel mode
      expect(service.getCurrentAudioMode()).toBe(AudioMode.STRUDEL);
      
      // Clear any previous calls
      vi.mocked(initAudioOnFirstClick).mockClear();

      // First attempt should fail
      service.playMusic('menu-theme');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Second attempt should fail
      service.playMusic('menu-theme');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Third attempt should be rejected immediately due to max attempts
      service.playMusic('menu-theme');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have been called exactly 2 times (max attempts)
      expect(initAudioOnFirstClick).toHaveBeenCalledTimes(2);
      
      // Should be in fallback mode after exhausting attempts
      expect(service.getCurrentAudioMode()).toBe(AudioMode.PHASER_ONLY);
    });

    it('should allow retry after resetInitializationState', async () => {
      const { initAudioOnFirstClick } = await import('@strudel/webaudio');
      
      // Mock initAudioOnFirstClick to fail initially, then succeed
      vi.mocked(initAudioOnFirstClick)
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce(undefined); // Third attempt succeeds

      await service.initialize(mockScene);
      
      // Ensure we start in Strudel mode
      expect(service.getCurrentAudioMode()).toBe(AudioMode.STRUDEL);
      
      // Clear any previous calls
      vi.mocked(initAudioOnFirstClick).mockClear();

      // Exhaust max attempts
      service.playMusic('menu-theme');
      await new Promise(resolve => setTimeout(resolve, 200));

      service.playMusic('menu-theme');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should be in fallback mode after exhausting attempts
      expect(service.getCurrentAudioMode()).toBe(AudioMode.PHASER_ONLY);

      // Reset state to allow retry
      service.resetInitializationState();
      expect(service.getCurrentAudioMode()).toBe(AudioMode.STRUDEL);

      // This should now work
      service.playMusic('menu-theme');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have been called 3 times total (2 failed + 1 success after reset)
      expect(initAudioOnFirstClick).toHaveBeenCalledTimes(3);
    });
  });
});
