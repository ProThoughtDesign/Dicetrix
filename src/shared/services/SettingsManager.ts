import {
  ISettingsManager,
  SettingsState,
  SettingsChangeEvent,
  SettingsChangeCallback,
  AllSettingsChangeCallback,
  SettingsValidator,
  StoredSettings,
  SettingsDiagnostics,
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
      console.warn(`SettingsManager: Invalid value for key '${key}':`, value);
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
      console.error('SettingsManager: Failed to save settings:', error);
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
      console.error('SettingsManager: Failed to save settings after reset:', error);
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
        console.error('SettingsManager: Failed to save settings after partial reset:', error);
      });
    }
  }

  /**
   * Subscribe to changes for a specific setting key
   */
  public subscribe(key: string, callback: SettingsChangeCallback): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    const keySubscribers = this.subscribers.get(key)!;
    keySubscribers.add(callback);

    // Return unsubscribe function
    return () => {
      keySubscribers.delete(callback);
      if (keySubscribers.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  /**
   * Subscribe to all settings changes
   */
  public subscribeAll(callback: AllSettingsChangeCallback): () => void {
    this.globalSubscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  /**
   * Add a validator for a specific setting key
   */
  public addValidator(key: string, validator: SettingsValidator): void {
    this.validators.set(key, validator);
  }

  /**
   * Save settings to persistent storage
   */
  public async save(): Promise<void> {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) {
        return; // No storage available
      }

      const storedSettings: StoredSettings = {
        version: this.settings.meta.version,
        timestamp: Date.now(),
        data: this.settings,
        checksum: this.generateChecksum(this.settings),
      };

      const serialized = JSON.stringify(storedSettings);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('SettingsManager: Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Load settings from persistent storage
   */
  public async load(): Promise<void> {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) {
        return; // No storage available, use defaults
      }

      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return; // No stored settings, use defaults
      }

      const storedSettings: StoredSettings = JSON.parse(stored);
      
      // Validate checksum if present
      if (storedSettings.checksum) {
        const expectedChecksum = this.generateChecksum(storedSettings.data);
        if (storedSettings.checksum !== expectedChecksum) {
          console.warn('SettingsManager: Settings corruption detected, using defaults');
          return;
        }
      }

      // Merge stored settings with defaults to handle missing keys
      this.settings = this.mergeWithDefaults(storedSettings.data);
      this.settings.meta.lastModified = Date.now();

    } catch (error) {
      console.error('SettingsManager: Failed to load settings, using defaults:', error);
      // Continue with defaults on error
    }
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

    return {
      isValid: validationErrors.length === 0,
      version: this.settings.meta.version,
      lastModified: this.settings.meta.lastModified,
      storageSize,
      validationErrors,
      corruptionDetected,
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

    const timeoutId = BrowserUtils.setTimeout(() => {
      const events = [...this.pendingChanges];
      this.pendingChanges = [];
      this.batchTimeout = null;
      
      this.emitChangeEvents(events);
    }, 0);

    if (timeoutId !== null) {
      this.batchTimeout = timeoutId;
    } else {
      // Non-browser environment - emit immediately
      const events = [...this.pendingChanges];
      this.pendingChanges = [];
      this.emitChangeEvents(events);
    }
  }

  private emitChangeEvents(events: SettingsChangeEvent[]): void {
    // Emit individual key events
    for (const event of events) {
      const keySubscribers = this.subscribers.get(event.key);
      if (keySubscribers) {
        keySubscribers.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error(`SettingsManager: Error in subscriber callback for key '${event.key}':`, error);
          }
        });
      }
    }

    // Emit global events
    if (this.globalSubscribers.size > 0 && events.length > 0) {
      this.globalSubscribers.forEach(callback => {
        try {
          callback(events);
        } catch (error) {
          console.error('SettingsManager: Error in global subscriber callback:', error);
        }
      });
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
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance();
