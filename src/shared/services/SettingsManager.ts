import {
  ISettingsManager,
  SettingsState,
  SettingsChangeEvent,
  SettingsChangeCallback,
  AllSettingsChangeCallback,
  SettingsValidator,
  StoredSettings,
  SettingsDiagnostics,
  EventSystemDiagnostics,
  ErrorSeverity,
  ErrorLogEntry,
  RecoveryResult,
  CorruptionAnalysis,
  DEFAULT_SETTINGS,
} from '../types/settings.js';
import { BrowserUtils } from '../utils/BrowserUtils.js';

/**
 * Centralized Settings Manager implementation
 * Provides a single source of truth for all game settings with event system,
 * persistence, validation, and error handling.
 */
export class SettingsManager implements ISettingsManager {
  private static instance: SettingsManager;
  private settings: SettingsState;
  private subscribers: Map<string, Set<SettingsChangeCallback>> = new Map();
  private globalSubscribers: Set<AllSettingsChangeCallback> = new Set();
  private validators: Map<string, SettingsValidator> = new Map();
  private readonly storageKey = 'dicetrix_settings_v2';
  private pendingChanges: SettingsChangeEvent[] = [];
  private batchTimeout: number | null = null;
  private readonly debounceDelay = 16; // ~60fps for smooth UI updates
  private readonly maxBatchSize = 50; // Prevent excessive event batching
  private subscriberCleanupCallbacks: Set<() => void> = new Set();
  private isDestroyed = false;
  private errorLog: ErrorLogEntry[] = [];
  private readonly maxErrorLogSize = 100; // Prevent memory buildup
  private lastRecoveryResult?: RecoveryResult;



  private constructor() {
    this.settings = this.deepClone(DEFAULT_SETTINGS);
    this.initializeValidators();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Initialize default validators for settings values
   */
  private initializeValidators(): void {
    // Audio volume validators (0.0 - 1.0)
    this.addValidator('audio.musicVolume', (value) => 
      typeof value === 'number' && value >= 0 && value <= 1
    );
    this.addValidator('audio.soundVolume', (value) => 
      typeof value === 'number' && value >= 0 && value <= 1
    );

    // Boolean validators
    this.addValidator('audio.musicEnabled', (value) => typeof value === 'boolean');
    this.addValidator('audio.soundEnabled', (value) => typeof value === 'boolean');
    this.addValidator('audio.masterMute', (value) => typeof value === 'boolean');
    this.addValidator('game.showTutorial', (value) => typeof value === 'boolean');
    this.addValidator('ui.animations', (value) => typeof value === 'boolean');

    // Game mode validator
    this.addValidator('game.selectedMode', (value) => 
      typeof value === 'string' && ['easy', 'medium', 'hard'].includes(value)
    );

    // UI theme validator
    this.addValidator('ui.theme', (value) => 
      typeof value === 'string' && ['default', 'dark', 'light'].includes(value)
    );
  }

  /**
   * Get a setting value by key path (e.g., 'audio.musicVolume')
   */
  public get<T>(key: string): T {
    const value = this.getNestedValue(this.settings, key);
    if (value === undefined) {
      // Return default value if key doesn't exist
      const defaultValue = this.getNestedValue(DEFAULT_SETTINGS, key);
      return defaultValue as T;
    }
    return value as T;
  }

  /**
   * Set a setting value by key path with validation and event emission
   */
  public set<T>(key: string, value: T): void {
    const oldValue = this.get(key);
    
    // Skip if value hasn't changed
    if (this.deepEqual(oldValue, value)) {
      return;
    }

    // Validate the new value
    if (!this.validateValue(key, value)) {
      this.logError(ErrorSeverity.WARNING, 'validation', `Invalid value for key '${key}'`, { key, value, oldValue });
      return;
    }

    // Apply value transformation if needed
    const transformedValue = this.transformValue(key, value);

    // Set the value
    this.setNestedValue(this.settings, key, transformedValue);

    // Update metadata
    this.settings.meta.lastModified = Date.now();

    // Create change event
    const changeEvent: SettingsChangeEvent = {
      key,
      oldValue,
      newValue: transformedValue,
      timestamp: Date.now(),
    };

    // Add to pending changes for batching
    this.pendingChanges.push(changeEvent);

    // Batch event notifications to prevent excessive updates
    this.scheduleBatchedNotification();

    // Save to persistence (async, non-blocking)
    this.save().catch(error => {
      this.logError(ErrorSeverity.ERROR, 'persistence', 'Failed to save settings after value change', { key, value, error });
    });
  }

  /**
   * Get all settings
   */
  public getAll(): SettingsState {
    return this.deepClone(this.settings);
  }

  /**
   * Reset all settings to defaults
   */
  public reset(): void {
    const oldSettings = this.deepClone(this.settings);
    this.settings = this.deepClone(DEFAULT_SETTINGS);
    this.settings.meta.lastModified = Date.now();

    // Create change events for all changed values
    const changeEvents = this.createChangeEventsForReset(oldSettings, this.settings);
    
    // Emit all change events
    this.emitChangeEvents(changeEvents);

    // Save to persistence
    this.save().catch(error => {
      this.logError(ErrorSeverity.ERROR, 'persistence', 'Failed to save settings after reset', { error });
    });
  }

  /**
   * Reset specific settings keys to defaults
   */
  public resetToDefaults(keys?: string[]): void {
    if (!keys || keys.length === 0) {
      this.reset();
      return;
    }

    const changeEvents: SettingsChangeEvent[] = [];

    for (const key of keys) {
      const oldValue = this.get(key);
      const defaultValue = this.getNestedValue(DEFAULT_SETTINGS, key);
      
      if (!this.deepEqual(oldValue, defaultValue)) {
        this.setNestedValue(this.settings, key, defaultValue);
        
        changeEvents.push({
          key,
          oldValue,
          newValue: defaultValue,
          timestamp: Date.now(),
        });
      }
    }

    if (changeEvents.length > 0) {
      this.settings.meta.lastModified = Date.now();
      this.emitChangeEvents(changeEvents);
      
      this.save().catch(error => {
        this.logError(ErrorSeverity.ERROR, 'persistence', 'Failed to save settings after partial reset', { keys, error });
      });
    }
  }

  /**
   * Subscribe to changes for a specific setting key
   * Enhanced with automatic cleanup and memory leak prevention
   */
  public subscribe(key: string, callback: SettingsChangeCallback): () => void {
    if (this.isDestroyed) {
      this.logError(ErrorSeverity.WARNING, 'subscription', 'Cannot subscribe to destroyed instance', { key });
      return () => {}; // Return no-op unsubscribe function
    }

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    const keySubscribers = this.subscribers.get(key)!;
    keySubscribers.add(callback);

    // Create unsubscribe function with enhanced cleanup
    const unsubscribe = () => {
      keySubscribers.delete(callback);
      if (keySubscribers.size === 0) {
        this.subscribers.delete(key);
      }
      // Remove from cleanup callbacks
      this.subscriberCleanupCallbacks.delete(unsubscribe);
    };

    // Track cleanup callback for automatic cleanup
    this.subscriberCleanupCallbacks.add(unsubscribe);

    return unsubscribe;
  }

  /**
   * Subscribe to all settings changes
   * Enhanced with automatic cleanup and memory leak prevention
   */
  public subscribeAll(callback: AllSettingsChangeCallback): () => void {
    if (this.isDestroyed) {
      this.logError(ErrorSeverity.WARNING, 'subscription', 'Cannot subscribe to destroyed instance');
      return () => {}; // Return no-op unsubscribe function
    }

    this.globalSubscribers.add(callback);

    // Create unsubscribe function with enhanced cleanup
    const unsubscribe = () => {
      this.globalSubscribers.delete(callback);
      // Remove from cleanup callbacks
      this.subscriberCleanupCallbacks.delete(unsubscribe);
    };

    // Track cleanup callback for automatic cleanup
    this.subscriberCleanupCallbacks.add(unsubscribe);

    return unsubscribe;
  }

  /**
   * Subscribe to multiple specific keys at once
   * Useful for components that need to listen to related settings
   */
  public subscribeToKeys(keys: string[], callback: SettingsChangeCallback): () => void {
    const unsubscribeFunctions = keys.map(key => this.subscribe(key, callback));
    
    // Return combined unsubscribe function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Subscribe with automatic cleanup when a condition is met
   * Useful for component lifecycle management
   */
  public subscribeWithCleanup(
    key: string, 
    callback: SettingsChangeCallback,
    cleanupCondition: () => boolean
  ): () => void {
    const unsubscribe = this.subscribe(key, (event) => {
      // Check cleanup condition before calling callback
      if (cleanupCondition()) {
        unsubscribe();
        return;
      }
      callback(event);
    });

    return unsubscribe;
  }

  /**
   * Add a validator for a specific setting key
   */
  public addValidator(key: string, validator: SettingsValidator): void {
    this.validators.set(key, validator);
  }

  /**
   * Save settings to persistent storage with comprehensive error handling
   */
  public async save(): Promise<void> {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) {
        this.logError(ErrorSeverity.WARNING, 'storage', 'No localStorage available, cannot save settings');
        return; // No storage available
      }

      // Validate settings before saving
      const validationErrors: string[] = [];
      this.validateAllSettings(this.settings, '', validationErrors);
      
      if (validationErrors.length > 0) {
        this.logError(ErrorSeverity.ERROR, 'validation', 'Settings validation failed before save', { validationErrors });
        throw new Error(`Settings validation failed: ${validationErrors.join(', ')}`);
      }

      const storedSettings: StoredSettings = {
        version: this.settings.meta.version,
        timestamp: Date.now(),
        data: this.settings,
        checksum: this.generateChecksum(this.settings),
      };

      const serialized = JSON.stringify(storedSettings);
      
      // Check storage quota before saving
      try {
        localStorage.setItem(this.storageKey, serialized);
        this.logError(ErrorSeverity.INFO, 'storage', 'Settings saved successfully', { size: serialized.length });
      } catch (storageError) {
        // Handle specific storage errors
        if (storageError instanceof Error) {
          if (storageError.name === 'QuotaExceededError' || storageError.message.includes('quota')) {
            this.logError(ErrorSeverity.ERROR, 'storage', 'Storage quota exceeded', { size: serialized.length });
            
            // Try to clear old data and retry
            try {
              this.clearOldStorageData();
              localStorage.setItem(this.storageKey, serialized);
              this.logError(ErrorSeverity.WARNING, 'storage', 'Settings saved after clearing old data');
            } catch (retryError) {
              this.logError(ErrorSeverity.CRITICAL, 'storage', 'Failed to save even after clearing old data', { retryError });
              throw retryError;
            }
          } else {
            this.logError(ErrorSeverity.ERROR, 'storage', 'Storage error during save', { storageError });
            throw storageError;
          }
        } else {
          throw storageError;
        }
      }

    } catch (error) {
      this.logError(ErrorSeverity.ERROR, 'saving', 'Failed to save settings', { error });
      throw error;
    }
  }

  /**
   * Load settings from persistent storage with comprehensive error handling
   */
  public async load(): Promise<void> {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) {
        this.logError(ErrorSeverity.INFO, 'storage', 'No localStorage available, using defaults');
        return; // No storage available, use defaults
      }

      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        this.logError(ErrorSeverity.INFO, 'storage', 'No stored settings found, using defaults');
        return; // No stored settings, use defaults
      }

      let storedSettings: StoredSettings;
      try {
        storedSettings = JSON.parse(stored);
      } catch (parseError) {
        this.logError(ErrorSeverity.ERROR, 'parsing', 'Failed to parse stored settings JSON', { parseError });
        await this.recoverFromCorruption();
        return;
      }

      // Analyze for corruption
      const analysis = this.analyzeCorruption(storedSettings);
      
      if (analysis.isCorrupted) {
        this.logError(ErrorSeverity.WARNING, 'corruption', 'Settings corruption detected', analysis);
        
        // Attempt recovery
        const recoveryResult = await this.recoverFromCorruption(storedSettings);
        
        if (!recoveryResult.success) {
          this.logError(ErrorSeverity.ERROR, 'recovery', 'Failed to recover from corruption, using defaults', recoveryResult);
          this.settings = this.deepClone(DEFAULT_SETTINGS);
          this.settings.meta.lastModified = Date.now();
        }
        return;
      }

      // Settings are valid, merge with defaults to handle missing keys
      this.settings = this.mergeWithDefaults(storedSettings.data);
      this.settings.meta.lastModified = Date.now();
      
      this.logError(ErrorSeverity.INFO, 'storage', 'Settings loaded successfully');

    } catch (error) {
      this.logError(ErrorSeverity.ERROR, 'loading', 'Failed to load settings', { error });
      
      // Attempt recovery as last resort
      try {
        await this.recoverFromCorruption();
      } catch (recoveryError) {
        this.logError(ErrorSeverity.CRITICAL, 'recovery', 'Complete failure to load or recover settings', { error, recoveryError });
        // Use defaults as final fallback
        this.settings = this.deepClone(DEFAULT_SETTINGS);
        this.settings.meta.lastModified = Date.now();
      }
    }
  }

  /**
   * Clean up all subscriptions and resources
   * Should be called when the settings manager is no longer needed
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    // Clear any pending batch timeout
    if (this.batchTimeout !== null) {
      BrowserUtils.clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Clear all pending changes
    this.pendingChanges = [];

    // Call all cleanup callbacks
    this.subscriberCleanupCallbacks.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        this.logError(ErrorSeverity.ERROR, 'cleanup', 'Error during subscription cleanup', { error });
      }
    });
    this.subscriberCleanupCallbacks.clear();

    // Clear all subscribers
    this.subscribers.clear();
    this.globalSubscribers.clear();

    // Mark as destroyed
    this.isDestroyed = true;
  }

  /**
   * Get the number of active subscriptions for monitoring memory usage
   */
  public getSubscriptionCount(): { keySubscriptions: number; globalSubscriptions: number; totalCallbacks: number } {
    let totalCallbacks = 0;
    for (const subscribers of this.subscribers.values()) {
      totalCallbacks += subscribers.size;
    }
    totalCallbacks += this.globalSubscribers.size;

    return {
      keySubscriptions: this.subscribers.size,
      globalSubscriptions: this.globalSubscribers.size,
      totalCallbacks,
    };
  }

  /**
   * Remove all subscribers for a specific key
   * Useful for cleaning up when a component type is no longer used
   */
  public clearSubscribersForKey(key: string): void {
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.clear();
      this.subscribers.delete(key);
    }
  }

  /**
   * Remove all global subscribers
   * Useful for cleaning up global listeners
   */
  public clearGlobalSubscribers(): void {
    this.globalSubscribers.clear();
  }

  /**
   * Log an error with severity and details
   */
  private logError(severity: ErrorSeverity, category: string, message: string, details?: any, error?: Error): void {
    const entry: ErrorLogEntry = {
      timestamp: Date.now(),
      severity,
      category,
      message,
      details,
      stack: error?.stack || undefined,
    };

    this.errorLog.push(entry);

    // Prevent memory buildup by limiting log size
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog.shift(); // Remove oldest entry
    }

    // Also log to console based on severity
    const consoleMessage = `SettingsManager [${category}]: ${message}`;
    switch (severity) {
      case ErrorSeverity.INFO:
        console.info(consoleMessage, details);
        break;
      case ErrorSeverity.WARNING:
        console.warn(consoleMessage, details);
        break;
      case ErrorSeverity.ERROR:
        console.error(consoleMessage, details, error);
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`CRITICAL - ${consoleMessage}`, details, error);
        break;
    }
  }

  /**
   * Analyze data for corruption and structural issues
   */
  public analyzeCorruption(data?: any): CorruptionAnalysis {
    const analysis: CorruptionAnalysis = {
      isCorrupted: false,
      corruptedKeys: [],
      recoverableKeys: [],
      checksumMismatch: false,
      structuralDamage: false,
      details: [],
    };

    try {
      if (!data) {
        // Try to load from storage for analysis
        const localStorage = BrowserUtils.getLocalStorage();
        if (!localStorage) {
          analysis.details.push('No storage available for analysis');
          return analysis;
        }

        const stored = localStorage.getItem(this.storageKey);
        if (!stored) {
          analysis.details.push('No stored data found');
          return analysis;
        }

        data = JSON.parse(stored);
      }

      // Check if it's a StoredSettings object
      if (!data.data || !data.version) {
        analysis.structuralDamage = true;
        analysis.isCorrupted = true;
        analysis.details.push('Missing required StoredSettings structure');
        return analysis;
      }

      // Verify checksum if present
      if (data.checksum) {
        const expectedChecksum = this.generateChecksum(data.data);
        if (data.checksum !== expectedChecksum) {
          analysis.checksumMismatch = true;
          analysis.isCorrupted = true;
          analysis.details.push(`Checksum mismatch: expected ${expectedChecksum}, got ${data.checksum}`);
        }
      }

      // Analyze individual settings for corruption
      this.analyzeSettingsStructure(data.data, '', analysis);

      // Determine recoverable keys
      this.identifyRecoverableKeys(data.data, analysis);

    } catch (error) {
      analysis.isCorrupted = true;
      analysis.structuralDamage = true;
      analysis.details.push(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logError(ErrorSeverity.ERROR, 'corruption-analysis', 'Failed to analyze corruption', { error });
    }

    return analysis;
  }

  /**
   * Attempt to recover from corrupted settings data
   */
  public async recoverFromCorruption(corruptedData?: any): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: false,
      recoveredKeys: [],
      failedKeys: [],
      fallbacksUsed: [],
      message: 'Recovery not attempted',
    };

    try {
      this.logError(ErrorSeverity.WARNING, 'recovery', 'Starting corruption recovery process');

      // Analyze the corruption first
      const analysis = this.analyzeCorruption(corruptedData);
      
      if (!analysis.isCorrupted) {
        result.success = true;
        result.message = 'No corruption detected, no recovery needed';
        return result;
      }

      // Start with a clean slate based on defaults
      const recoveredSettings = this.deepClone(DEFAULT_SETTINGS);
      
      // Try to recover individual settings if data exists
      if (corruptedData?.data) {
        this.attemptPartialRecovery(corruptedData.data, recoveredSettings, result);
      }

      // Apply the recovered settings
      const oldSettings = this.deepClone(this.settings);
      this.settings = recoveredSettings;
      this.settings.meta.lastModified = Date.now();

      // Save the recovered settings
      await this.save();

      // Create change events for recovered settings
      const changeEvents = this.createChangeEventsForReset(oldSettings, this.settings);
      this.emitChangeEvents(changeEvents);

      result.success = true;
      result.message = `Recovery completed: ${result.recoveredKeys.length} keys recovered, ${result.failedKeys.length} keys failed, ${result.fallbacksUsed.length} fallbacks used`;
      
      this.lastRecoveryResult = result;
      this.logError(ErrorSeverity.INFO, 'recovery', result.message, result);

    } catch (error) {
      result.success = false;
      result.message = `Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logError(ErrorSeverity.CRITICAL, 'recovery', 'Recovery process failed', { error });
    }

    return result;
  }

  /**
   * Clear the error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
    this.logError(ErrorSeverity.INFO, 'maintenance', 'Error log cleared');
  }

  /**
   * Export the current error log
   */
  public exportErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog]; // Return a copy
  }

  /**
   * Get diagnostics information
   */
  public getDiagnostics(): SettingsDiagnostics {
    const validationErrors: string[] = [];
    
    // Validate all current settings
    this.validateAllSettings(this.settings, '', validationErrors);

    let storageSize = 0;
    let corruptionDetected = false;

    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (localStorage) {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const blob = BrowserUtils.createBlob([stored]);
          storageSize = blob ? blob.size : stored.length;
          
          // Check for corruption
          const storedSettings: StoredSettings = JSON.parse(stored);
          if (storedSettings.checksum) {
            const expectedChecksum = this.generateChecksum(storedSettings.data);
            corruptionDetected = storedSettings.checksum !== expectedChecksum;
          }
        }
      }
    } catch (error) {
      validationErrors.push(`Storage access error: ${error}`);
    }

    const subscriptionInfo = this.getSubscriptionCount();

    // Analyze current settings for corruption
    let corruptionAnalysis: CorruptionAnalysis | undefined;
    try {
      corruptionAnalysis = this.analyzeCorruption({ data: this.settings, version: this.settings.meta.version, timestamp: Date.now() });
    } catch (error) {
      this.logError(ErrorSeverity.WARNING, 'diagnostics', 'Failed to analyze corruption during diagnostics', { error });
    }

    return {
      isValid: validationErrors.length === 0,
      version: this.settings.meta.version,
      lastModified: this.settings.meta.lastModified,
      storageSize,
      validationErrors,
      corruptionDetected,
      corruptionAnalysis,
      lastRecovery: this.lastRecoveryResult,
      errorLog: [...this.errorLog], // Return a copy
      eventSystem: {
        keySubscriptions: subscriptionInfo.keySubscriptions,
        globalSubscriptions: subscriptionInfo.globalSubscriptions,
        totalCallbacks: subscriptionInfo.totalCallbacks,
        pendingChanges: this.pendingChanges.length,
        batchingActive: this.batchTimeout !== null,
        isDestroyed: this.isDestroyed,
      },
    };
  }

  // Private helper methods

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private validateValue(key: string, value: any): boolean {
    const validator = this.validators.get(key);
    return validator ? validator(value) : true;
  }

  private transformValue(key: string, value: any): any {
    // Apply transformations based on key type
    if (key.includes('Volume') && typeof value === 'number') {
      // Clamp volume values to 0-1 range
      return Math.max(0, Math.min(1, value));
    }
    return value;
  }

  private scheduleBatchedNotification(): void {
    if (this.batchTimeout !== null) {
      return; // Already scheduled
    }

    // If we have too many pending changes, emit immediately to prevent memory buildup
    if (this.pendingChanges.length >= this.maxBatchSize) {
      this.flushPendingChanges();
      return;
    }

    const timeoutId = BrowserUtils.setTimeout(() => {
      this.flushPendingChanges();
    }, this.debounceDelay);

    if (timeoutId !== null) {
      this.batchTimeout = timeoutId;
    } else {
      // Non-browser environment - emit immediately
      this.flushPendingChanges();
    }
  }

  /**
   * Flush all pending changes and emit events
   */
  private flushPendingChanges(): void {
    if (this.pendingChanges.length === 0) {
      return;
    }

    const events = [...this.pendingChanges];
    this.pendingChanges = [];
    this.batchTimeout = null;
    
    this.emitChangeEvents(events);
  }

  /**
   * Force immediate emission of all pending changes
   * Useful for critical updates that shouldn't be debounced
   */
  public flushEvents(): void {
    if (this.batchTimeout !== null) {
      BrowserUtils.clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.flushPendingChanges();
  }

  private emitChangeEvents(events: SettingsChangeEvent[]): void {
    if (this.isDestroyed || events.length === 0) {
      return;
    }

    // Group events by key for more efficient processing
    const eventsByKey = new Map<string, SettingsChangeEvent[]>();
    for (const event of events) {
      if (!eventsByKey.has(event.key)) {
        eventsByKey.set(event.key, []);
      }
      eventsByKey.get(event.key)!.push(event);
    }

    // Emit individual key events
    for (const [key, keyEvents] of eventsByKey) {
      const keySubscribers = this.subscribers.get(key);
      if (keySubscribers && keySubscribers.size > 0) {
        // Create a copy of subscribers to avoid issues if callbacks modify the set
        const subscribersCopy = Array.from(keySubscribers);
        
        for (const callback of subscribersCopy) {
          try {
            // For multiple events on the same key, emit the latest one
            const latestEvent = keyEvents[keyEvents.length - 1];
            if (latestEvent) {
              callback(latestEvent);
            }
          } catch (error) {
            this.logError(ErrorSeverity.ERROR, 'event-emission', `Error in subscriber callback for key '${key}'`, { key, error });
            // Remove problematic callback to prevent repeated errors
            keySubscribers.delete(callback);
          }
        }
      }
    }

    // Emit global events
    if (this.globalSubscribers.size > 0) {
      // Create a copy of global subscribers to avoid issues if callbacks modify the set
      const globalSubscribersCopy = Array.from(this.globalSubscribers);
      
      for (const callback of globalSubscribersCopy) {
        try {
          callback(events);
        } catch (error) {
          this.logError(ErrorSeverity.ERROR, 'event-emission', 'Error in global subscriber callback', { error });
          // Remove problematic callback to prevent repeated errors
          this.globalSubscribers.delete(callback);
        }
      }
    }
  }

  private createChangeEventsForReset(oldSettings: SettingsState, newSettings: SettingsState): SettingsChangeEvent[] {
    const events: SettingsChangeEvent[] = [];
    const timestamp = Date.now();

    // Compare all settings and create events for changes
    this.compareObjects(oldSettings, newSettings, '', events, timestamp);
    
    return events;
  }

  private compareObjects(oldObj: any, newObj: any, prefix: string, events: SettingsChangeEvent[], timestamp: number): void {
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
    
    for (const key of allKeys) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const oldValue = oldObj?.[key];
      const newValue = newObj?.[key];

      if (typeof oldValue === 'object' && typeof newValue === 'object' && 
          oldValue !== null && newValue !== null && !Array.isArray(oldValue)) {
        // Recursively compare objects
        this.compareObjects(oldValue, newValue, fullKey, events, timestamp);
      } else if (!this.deepEqual(oldValue, newValue)) {
        events.push({
          key: fullKey,
          oldValue,
          newValue,
          timestamp,
        });
      }
    }
  }

  private validateAllSettings(obj: any, prefix: string, errors: string[]): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.validateAllSettings(value, fullKey, errors);
      } else {
        if (!this.validateValue(fullKey, value)) {
          errors.push(`Invalid value for '${fullKey}': ${value}`);
        }
      }
    }
  }

  private mergeWithDefaults(stored: SettingsState): SettingsState {
    return {
      audio: { ...DEFAULT_SETTINGS.audio, ...stored.audio },
      game: { ...DEFAULT_SETTINGS.game, ...stored.game },
      ui: { ...DEFAULT_SETTINGS.ui, ...stored.ui },
      meta: { ...DEFAULT_SETTINGS.meta, ...stored.meta },
    };
  }

  private generateChecksum(data: SettingsState): string {
    // Simple checksum using JSON string hash
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return a === b;
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }

  /**
   * Analyze settings structure for corruption
   */
  private analyzeSettingsStructure(data: any, prefix: string, analysis: CorruptionAnalysis): void {
    if (!data || typeof data !== 'object') {
      analysis.corruptedKeys.push(prefix || 'root');
      analysis.details.push(`Invalid data structure at ${prefix || 'root'}`);
      return;
    }

    // Check required top-level structure
    if (!prefix) {
      const requiredSections = ['audio', 'game', 'ui', 'meta'];
      for (const section of requiredSections) {
        if (!(section in data)) {
          analysis.corruptedKeys.push(section);
          analysis.details.push(`Missing required section: ${section}`);
          analysis.isCorrupted = true;
        }
      }
    }

    // Recursively check each property
    for (const [key, value] of Object.entries(data)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      // Validate against expected structure
      const expectedValue = this.getNestedValue(DEFAULT_SETTINGS, fullKey);
      
      if (expectedValue === undefined) {
        analysis.details.push(`Unexpected key: ${fullKey}`);
        continue;
      }

      // Type validation
      if (typeof value !== typeof expectedValue) {
        analysis.corruptedKeys.push(fullKey);
        analysis.details.push(`Type mismatch for ${fullKey}: expected ${typeof expectedValue}, got ${typeof value}`);
        analysis.isCorrupted = true;
        continue;
      }

      // Value validation using existing validators
      if (!this.validateValue(fullKey, value)) {
        analysis.corruptedKeys.push(fullKey);
        analysis.details.push(`Invalid value for ${fullKey}: ${value}`);
        analysis.isCorrupted = true;
        continue;
      }

      // Recursive analysis for objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.analyzeSettingsStructure(value, fullKey, analysis);
      }
    }
  }

  /**
   * Identify which keys can potentially be recovered
   */
  private identifyRecoverableKeys(data: any, analysis: CorruptionAnalysis): void {
    if (!data || typeof data !== 'object') {
      return;
    }

    this.identifyRecoverableKeysRecursive(data, '', analysis);
  }

  private identifyRecoverableKeysRecursive(data: any, prefix: string, analysis: CorruptionAnalysis): void {
    for (const [key, value] of Object.entries(data)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      // Skip if already marked as corrupted
      if (analysis.corruptedKeys.includes(fullKey)) {
        continue;
      }

      // Check if this key exists in defaults and has valid type
      const expectedValue = this.getNestedValue(DEFAULT_SETTINGS, fullKey);
      if (expectedValue !== undefined && typeof value === typeof expectedValue) {
        // Additional validation
        if (this.validateValue(fullKey, value)) {
          analysis.recoverableKeys.push(fullKey);
        }
      }

      // Recursive check for objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.identifyRecoverableKeysRecursive(value, fullKey, analysis);
      }
    }
  }

  /**
   * Attempt to recover individual settings from corrupted data
   */
  private attemptPartialRecovery(corruptedData: any, recoveredSettings: SettingsState, result: RecoveryResult): void {
    this.attemptPartialRecoveryRecursive(corruptedData, recoveredSettings, '', result);
  }

  private attemptPartialRecoveryRecursive(corruptedData: any, recoveredSettings: any, prefix: string, result: RecoveryResult): void {
    if (!corruptedData || typeof corruptedData !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(corruptedData)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      try {
        // Check if this key exists in the expected structure
        const expectedValue = this.getNestedValue(DEFAULT_SETTINGS, fullKey);
        if (expectedValue === undefined) {
          continue; // Skip unknown keys
        }

        // Type check
        if (typeof value !== typeof expectedValue) {
          result.failedKeys.push(fullKey);
          result.fallbacksUsed.push(fullKey);
          continue;
        }

        // Validation check
        if (!this.validateValue(fullKey, value)) {
          result.failedKeys.push(fullKey);
          result.fallbacksUsed.push(fullKey);
          continue;
        }

        // If it's an object, recurse
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          this.attemptPartialRecoveryRecursive(value, this.getNestedValue(recoveredSettings, prefix) || recoveredSettings, fullKey, result);
        } else {
          // Recover this value
          this.setNestedValue(recoveredSettings, fullKey, value);
          result.recoveredKeys.push(fullKey);
        }

      } catch (error) {
        result.failedKeys.push(fullKey);
        result.fallbacksUsed.push(fullKey);
        this.logError(ErrorSeverity.WARNING, 'recovery', `Failed to recover key ${fullKey}`, { error });
      }
    }
  }

  /**
   * Clear old storage data to free up space
   */
  private clearOldStorageData(): void {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) {
        return;
      }

      // List of old storage keys that might exist
      const oldKeys = [
        'dicetrix_settings', // Old version without version suffix
        'dicetrix_settings_v1', // Previous version
        'game_settings', // Generic old key
        'audio_settings', // Old audio-specific key
      ];

      let clearedCount = 0;
      for (const key of oldKeys) {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        this.logError(ErrorSeverity.INFO, 'storage', `Cleared ${clearedCount} old storage entries to free space`);
      }

    } catch (error) {
      this.logError(ErrorSeverity.WARNING, 'storage', 'Failed to clear old storage data', { error });
    }
  }
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance();
