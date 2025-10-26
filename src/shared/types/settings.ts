// Settings Manager types and interfaces

/**
 * Core settings state structure
 */
export interface SettingsState {
  audio: {
    musicVolume: number;        // 0.0 - 1.0
    soundVolume: number;        // 0.0 - 1.0
    musicEnabled: boolean;
    soundEnabled: boolean;
    masterMute: boolean;
  };
  game: {
    selectedMode: 'easy' | 'medium' | 'hard';
    showTutorial: boolean;
  };
  ui: {
    theme: 'default' | 'dark' | 'light';
    animations: boolean;
  };
  meta: {
    version: string;
    lastModified: number;
  };
}

/**
 * Audio-specific settings subset
 */
export interface AudioSettings {
  musicVolume: number;
  soundVolume: number;
  musicEnabled: boolean;
  soundEnabled: boolean;
  masterMute: boolean;
}

/**
 * Settings change event structure
 */
export interface SettingsChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

/**
 * Settings change callback types
 */
export type SettingsChangeCallback = (event: SettingsChangeEvent) => void;
export type AllSettingsChangeCallback = (events: SettingsChangeEvent[]) => void;

/**
 * Settings validation function type
 */
export type SettingsValidator = (value: any) => boolean;

/**
 * Storage format for persisted settings
 */
export interface StoredSettings {
  version: string;
  timestamp: number;
  data: SettingsState;
  checksum?: string; // For corruption detection
}

/**
 * Settings diagnostics information
 */
export interface SettingsDiagnostics {
  isValid: boolean;
  version: string;
  lastModified: number;
  storageSize: number;
  validationErrors: string[];
  corruptionDetected: boolean;
}

/**
 * Core Settings Manager interface
 */
export interface ISettingsManager {
  // Core API
  get<T>(key: string): T;
  set<T>(key: string, value: T): void;
  getAll(): SettingsState;
  reset(): void;
  resetToDefaults(keys?: string[]): void;
  
  // Event System
  subscribe(key: string, callback: SettingsChangeCallback): () => void;
  subscribeAll(callback: AllSettingsChangeCallback): () => void;
  
  // Validation
  addValidator(key: string, validator: SettingsValidator): void;
  
  // Persistence
  save(): Promise<void>;
  load(): Promise<void>;
  
  // Diagnostics
  getDiagnostics(): SettingsDiagnostics;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: SettingsState = {
  audio: {
    musicVolume: 0.8,
    soundVolume: 0.8,
    musicEnabled: true,
    soundEnabled: true,
    masterMute: false,
  },
  game: {
    selectedMode: 'medium',
    showTutorial: true,
  },
  ui: {
    theme: 'default',
    animations: true,
  },
  meta: {
    version: '1.0.0',
    lastModified: Date.now(),
  },
};
