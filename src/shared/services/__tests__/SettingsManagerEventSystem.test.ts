import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsManager } from '../SettingsManager.js';

describe('SettingsManager Event System', () => {
  let settingsManager: SettingsManager;

  beforeEach(() => {
    // Create a fresh instance for each test
    settingsManager = new (SettingsManager as any)();
  });

  describe('Enhanced Subscription Management', () => {
    it('should track subscription counts correctly', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const globalCallback = vi.fn();

      // Initial state
      expect(settingsManager.getSubscriptionCount()).toEqual({
        keySubscriptions: 0,
        globalSubscriptions: 0,
        totalCallbacks: 0,
      });

      // Add subscriptions
      const unsubscribe1 = settingsManager.subscribe('audio.musicVolume', callback1);
      const unsubscribe2 = settingsManager.subscribe('audio.soundVolume', callback2);
      const unsubscribeGlobal = settingsManager.subscribeAll(globalCallback);

      expect(settingsManager.getSubscriptionCount()).toEqual({
        keySubscriptions: 2,
        globalSubscriptions: 1,
        totalCallbacks: 3,
      });

      // Remove subscriptions
      unsubscribe1();
      expect(settingsManager.getSubscriptionCount()).toEqual({
        keySubscriptions: 1,
        globalSubscriptions: 1,
        totalCallbacks: 2,
      });

      unsubscribe2();
      unsubscribeGlobal();
      expect(settingsManager.getSubscriptionCount()).toEqual({
        keySubscriptions: 0,
        globalSubscriptions: 0,
        totalCallbacks: 0,
      });
    });

    it('should support multi-key subscriptions', () => {
      const callback = vi.fn();
      const unsubscribe = settingsManager.subscribeToKeys(['audio.musicVolume', 'audio.soundVolume'], callback);

      // Change both keys
      settingsManager.set('audio.musicVolume', 0.5);
      settingsManager.set('audio.soundVolume', 0.7);

      // Flush events to ensure they're processed
      settingsManager.flushEvents();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        key: 'audio.musicVolume',
        newValue: 0.5,
      }));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        key: 'audio.soundVolume',
        newValue: 0.7,
      }));

      unsubscribe();
      expect(settingsManager.getSubscriptionCount().totalCallbacks).toBe(0);
    });

    it('should support conditional cleanup subscriptions', () => {
      const callback = vi.fn();
      let shouldCleanup = false;

      const unsubscribe = settingsManager.subscribeWithCleanup(
        'audio.musicVolume',
        callback,
        () => shouldCleanup
      );

      // First change should work
      settingsManager.set('audio.musicVolume', 0.5);
      settingsManager.flushEvents();
      expect(callback).toHaveBeenCalledTimes(1);

      // Set cleanup condition
      shouldCleanup = true;

      // Second change should trigger cleanup and not call callback
      settingsManager.set('audio.musicVolume', 0.7);
      settingsManager.flushEvents();
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not 2

      // Subscription should be automatically removed
      expect(settingsManager.getSubscriptionCount().totalCallbacks).toBe(0);
    });
  });

  describe('Event Batching and Debouncing', () => {
    it('should batch multiple rapid changes', async () => {
      const callback = vi.fn();
      settingsManager.subscribeAll(callback);

      // Make multiple rapid changes
      settingsManager.set('audio.musicVolume', 0.1);
      settingsManager.set('audio.musicVolume', 0.2);
      settingsManager.set('audio.musicVolume', 0.3);
      settingsManager.set('audio.soundVolume', 0.5);

      // Events should be batched
      expect(callback).not.toHaveBeenCalled();

      // Flush events manually
      settingsManager.flushEvents();

      // Should receive all events in one batch
      expect(callback).toHaveBeenCalledTimes(1);
      const events = callback.mock.calls[0][0];
      expect(events).toHaveLength(4);
    });

    it('should handle immediate flush correctly', () => {
      const callback = vi.fn();
      settingsManager.subscribe('audio.musicVolume', callback);

      settingsManager.set('audio.musicVolume', 0.5);
      expect(callback).not.toHaveBeenCalled();

      settingsManager.flushEvents();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        key: 'audio.musicVolume',
        newValue: 0.5,
      }));
    });
  });

  describe('Memory Management and Cleanup', () => {
    it('should clear subscribers for specific keys', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      settingsManager.subscribe('audio.musicVolume', callback1);
      settingsManager.subscribe('audio.soundVolume', callback2);

      expect(settingsManager.getSubscriptionCount().keySubscriptions).toBe(2);

      settingsManager.clearSubscribersForKey('audio.musicVolume');
      expect(settingsManager.getSubscriptionCount().keySubscriptions).toBe(1);

      // Test that only the remaining subscription works
      settingsManager.set('audio.soundVolume', 0.5);
      settingsManager.flushEvents();
      expect(callback2).toHaveBeenCalled();
      expect(callback1).not.toHaveBeenCalled();
    });

    it('should clear all global subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      settingsManager.subscribeAll(callback1);
      settingsManager.subscribeAll(callback2);

      expect(settingsManager.getSubscriptionCount().globalSubscriptions).toBe(2);

      settingsManager.clearGlobalSubscribers();
      expect(settingsManager.getSubscriptionCount().globalSubscriptions).toBe(0);

      // Test that no global callbacks are called
      settingsManager.set('audio.musicVolume', 0.5);
      settingsManager.flushEvents();
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should handle destroy correctly', () => {
      const callback = vi.fn();
      settingsManager.subscribe('audio.musicVolume', callback);
      settingsManager.subscribeAll(callback);

      expect(settingsManager.getSubscriptionCount().totalCallbacks).toBe(2);

      settingsManager.destroy();

      // All subscriptions should be cleared
      expect(settingsManager.getSubscriptionCount().totalCallbacks).toBe(0);

      // New subscriptions should be rejected
      const unsubscribe = settingsManager.subscribe('audio.musicVolume', callback);
      expect(settingsManager.getSubscriptionCount().totalCallbacks).toBe(0);

      // Unsubscribe should be a no-op
      unsubscribe();
    });
  });

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', () => {
      const goodCallback = vi.fn();
      const badCallback = vi.fn(() => {
        throw new Error('Test error');
      });

      settingsManager.subscribe('audio.musicVolume', goodCallback);
      settingsManager.subscribe('audio.musicVolume', badCallback);

      // Should not throw despite bad callback
      expect(() => {
        settingsManager.set('audio.musicVolume', 0.5);
        settingsManager.flushEvents();
      }).not.toThrow();

      // Good callback should still be called
      expect(goodCallback).toHaveBeenCalled();
      expect(badCallback).toHaveBeenCalled();

      // Bad callback should be removed after error
      goodCallback.mockClear();
      badCallback.mockClear();

      settingsManager.set('audio.musicVolume', 0.7);
      settingsManager.flushEvents();

      expect(goodCallback).toHaveBeenCalled();
      expect(badCallback).not.toHaveBeenCalled(); // Should be removed
    });
  });

  describe('Diagnostics', () => {
    it('should include event system information in diagnostics', () => {
      const callback = vi.fn();
      settingsManager.subscribe('audio.musicVolume', callback);
      settingsManager.subscribeAll(callback);

      const diagnostics = settingsManager.getDiagnostics();

      expect(diagnostics.eventSystem).toEqual({
        keySubscriptions: 1,
        globalSubscriptions: 1,
        totalCallbacks: 2,
        pendingChanges: 0,
        batchingActive: false,
        isDestroyed: false,
      });

      // Add pending changes
      settingsManager.set('audio.musicVolume', 0.5);
      const diagnosticsWithPending = settingsManager.getDiagnostics();
      expect(diagnosticsWithPending.eventSystem.pendingChanges).toBe(1);
      expect(diagnosticsWithPending.eventSystem.batchingActive).toBe(true);
    });
  });
});
