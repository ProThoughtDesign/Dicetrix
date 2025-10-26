import { SettingsState, DEFAULT_SETTINGS, StoredSettings } from '../types/settings.js';
import { BrowserUtils } from './BrowserUtils.js';

/**
 * Old settings format interfaces for migration
 */
interface OldSettingsV1 {
  selectedMode: string;
  audioVolume: number;
  audioMuted: boolean;
}

interface OldSettingsV0 {
  // Even older format - just in case
  volume?: number;
  muted?: boolean;
  difficulty?: string;
}

/**
 * Migration result information
 */
interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  errors: string[];
  warnings: string[];
  recoveredSettings: Partial<SettingsState>;
}

/**
 * Settings migration utilities
 * Handles migration from old settings format to new centralized format
 * with comprehensive error handling and recovery
 */
export class SettingsMigration {
  private static readonly OLD_STORAGE_KEYS = [
    'dicetrix_settings_v1',
    'dicetrix_settings_v0',
    'dicetrix_settings', // Legacy key without version
    'game_settings', // Alternative legacy key
  ];
  private static readonly NEW_STORAGE_KEY = 'dicetrix_settings_v2';
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly BACKUP_SUFFIX = '_backup';



  /**
   * Migrate settings from old format to new format with comprehensive error handling
   */
  public static async migrateSettings(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      fromVersion: 'unknown',
      toVersion: this.CURRENT_VERSION,
      errors: [],
      warnings: [],
      recoveredSettings: {},
    };

    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) {
        result.errors.push('No localStorage available');
        return result;
      }

      // Check if new settings already exist
      const existingNewSettings = localStorage.getItem(this.NEW_STORAGE_KEY);
      if (existingNewSettings) {
        result.warnings.push('New settings already exist, migration skipped');
        return result;
      }

      // Find and migrate from the first available old format
      const migrationSource = this.findOldSettings(localStorage);
      if (!migrationSource) {
        result.warnings.push('No old settings found to migrate');
        return result;
      }

      result.fromVersion = migrationSource.version;

      // Create backup of old settings before migration
      this.createBackup(localStorage, migrationSource.key, migrationSource.data);

      // Convert to new format with error recovery
      const migratedSettings = this.convertOldToNewFormatWithRecovery(
        migrationSource.data, 
        migrationSource.version,
        result
      );
      
      // Validate and clean migrated settings
      const validatedSettings = this.validateAndCleanSettings(migratedSettings, result);
      
      // Save migrated settings in new format
      const newStoredSettings: StoredSettings = {
        version: this.CURRENT_VERSION,
        timestamp: Date.now(),
        data: validatedSettings,
        checksum: this.generateChecksum(validatedSettings),
      };

      localStorage.setItem(this.NEW_STORAGE_KEY, JSON.stringify(newStoredSettings));
      
      result.success = true;
      result.recoveredSettings = validatedSettings;
      
      console.log(`SettingsMigration: Successfully migrated settings from ${result.fromVersion} to ${result.toVersion}`);
      
      if (result.warnings.length > 0) {
        console.warn('SettingsMigration: Migration completed with warnings:', result.warnings);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Migration failed: ${errorMessage}`);
      console.error('SettingsMigration: Failed to migrate settings:', error);
      
      // Attempt partial recovery
      try {
        const partialRecovery = this.attemptPartialRecovery();
        if (partialRecovery) {
          result.recoveredSettings = partialRecovery;
          result.warnings.push('Partial recovery successful, some settings may be reset to defaults');
        }
      } catch (recoveryError) {
        result.errors.push(`Recovery also failed: ${recoveryError}`);
      }

      return result;
    }
  }

  /**
   * Find old settings in localStorage
   */
  private static findOldSettings(localStorage: any): {
    key: string;
    data: any;
    version: string;
  } | null {
    for (const key of this.OLD_STORAGE_KEYS) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          const version = this.detectVersion(key, data);
          return { key, data, version };
        }
      } catch (error) {
        console.warn(`SettingsMigration: Failed to parse settings from key '${key}':`, error);
        // Continue checking other keys
      }
    }
    return null;
  }

  /**
   * Detect version from storage key and data structure
   */
  private static detectVersion(key: string, data: any): string {
    if (key.includes('_v1')) return 'v1';
    if (key.includes('_v0')) return 'v0';
    
    // Detect version from data structure
    if (data && typeof data === 'object') {
      if ('selectedMode' in data && 'audioVolume' in data && 'audioMuted' in data) {
        return 'v1';
      }
      if ('volume' in data || 'difficulty' in data) {
        return 'v0';
      }
    }
    
    return 'unknown';
  }

  /**
   * Create backup of old settings
   */
  private static createBackup(localStorage: any, key: string, data: any): void {
    try {
      const backupKey = key + this.BACKUP_SUFFIX;
      const backupData = {
        originalKey: key,
        timestamp: Date.now(),
        data: data,
      };
      localStorage.setItem(backupKey, JSON.stringify(backupData));
    } catch (error) {
      console.warn('SettingsMigration: Failed to create backup:', error);
    }
  }

  /**
   * Convert old settings format to new format with comprehensive error recovery
   */
  private static convertOldToNewFormatWithRecovery(
    oldData: any, 
    version: string, 
    result: MigrationResult
  ): SettingsState {
    const newSettings: SettingsState = {
      ...DEFAULT_SETTINGS,
      meta: {
        version: this.CURRENT_VERSION,
        lastModified: Date.now(),
      },
    };

    try {
      if (version === 'v1') {
        this.migrateFromV1(oldData as OldSettingsV1, newSettings, result);
      } else if (version === 'v0') {
        this.migrateFromV0(oldData as OldSettingsV0, newSettings, result);
      } else {
        this.migrateFromUnknown(oldData, newSettings, result);
      }
    } catch (error) {
      result.errors.push(`Conversion error: ${error}`);
      result.warnings.push('Using default settings due to conversion errors');
    }

    return newSettings;
  }

  /**
   * Migrate from v1 format (SettingsShape)
   */
  private static migrateFromV1(oldData: OldSettingsV1, newSettings: SettingsState, result: MigrationResult): void {
    try {
      // Map game mode
      if (oldData.selectedMode) {
        const validMode = this.validateGameMode(oldData.selectedMode);
        newSettings.game.selectedMode = validMode;
        if (validMode !== oldData.selectedMode) {
          result.warnings.push(`Invalid game mode '${oldData.selectedMode}' reset to '${validMode}'`);
        }
      }

      // Map audio settings
      if (typeof oldData.audioVolume === 'number') {
        const volume = this.validateVolume(oldData.audioVolume);
        newSettings.audio.musicVolume = volume;
        newSettings.audio.soundVolume = volume;
        if (volume !== oldData.audioVolume) {
          result.warnings.push(`Audio volume ${oldData.audioVolume} clamped to ${volume}`);
        }
      }

      if (typeof oldData.audioMuted === 'boolean') {
        const enabled = !oldData.audioMuted;
        newSettings.audio.musicEnabled = enabled;
        newSettings.audio.soundEnabled = enabled;
        newSettings.audio.masterMute = oldData.audioMuted;
      }
    } catch (error) {
      result.errors.push(`V1 migration error: ${error}`);
    }
  }

  /**
   * Migrate from v0 format (legacy)
   */
  private static migrateFromV0(oldData: OldSettingsV0, newSettings: SettingsState, result: MigrationResult): void {
    try {
      if (typeof oldData.volume === 'number') {
        const volume = this.validateVolume(oldData.volume);
        newSettings.audio.musicVolume = volume;
        newSettings.audio.soundVolume = volume;
      }

      if (typeof oldData.muted === 'boolean') {
        const enabled = !oldData.muted;
        newSettings.audio.musicEnabled = enabled;
        newSettings.audio.soundEnabled = enabled;
        newSettings.audio.masterMute = oldData.muted;
      }

      if (oldData.difficulty) {
        const validMode = this.validateGameMode(oldData.difficulty);
        newSettings.game.selectedMode = validMode;
      }

      result.warnings.push('Migrated from very old format, some settings may be reset to defaults');
    } catch (error) {
      result.errors.push(`V0 migration error: ${error}`);
    }
  }

  /**
   * Migrate from unknown format - attempt best-effort recovery
   */
  private static migrateFromUnknown(oldData: any, newSettings: SettingsState, result: MigrationResult): void {
    result.warnings.push('Unknown settings format, attempting best-effort recovery');

    if (!oldData || typeof oldData !== 'object') {
      result.warnings.push('Invalid data structure, using defaults');
      return;
    }

    // Try to extract any recognizable values
    const keys = Object.keys(oldData);
    for (const key of keys) {
      try {
        const value = oldData[key];
        
        // Look for volume-related settings
        if (key.toLowerCase().includes('volume') && typeof value === 'number') {
          const volume = this.validateVolume(value);
          newSettings.audio.musicVolume = volume;
          newSettings.audio.soundVolume = volume;
          result.warnings.push(`Recovered volume setting: ${volume}`);
        }
        
        // Look for mute-related settings
        if (key.toLowerCase().includes('mute') && typeof value === 'boolean') {
          newSettings.audio.masterMute = value;
          newSettings.audio.musicEnabled = !value;
          newSettings.audio.soundEnabled = !value;
          result.warnings.push(`Recovered mute setting: ${value}`);
        }
        
        // Look for difficulty/mode settings
        if ((key.toLowerCase().includes('mode') || key.toLowerCase().includes('difficulty')) && 
            typeof value === 'string') {
          const validMode = this.validateGameMode(value);
          newSettings.game.selectedMode = validMode;
          result.warnings.push(`Recovered game mode: ${validMode}`);
        }
      } catch (error) {
        result.warnings.push(`Failed to recover setting '${key}': ${error}`);
      }
    }
  }



  /**
   * Attempt partial recovery when full migration fails
   */
  private static attemptPartialRecovery(): SettingsState | null {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) return null;

      // Try to recover any valid settings from any source
      const recovered: SettingsState = { ...DEFAULT_SETTINGS };
      let hasRecoveredData = false;

      for (const key of this.OLD_STORAGE_KEYS) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            
            // Try to extract any valid values
            if (data && typeof data === 'object') {
              // Audio settings recovery
              if (typeof data.audioVolume === 'number') {
                const volume = this.validateVolume(data.audioVolume);
                recovered.audio.musicVolume = volume;
                recovered.audio.soundVolume = volume;
                hasRecoveredData = true;
              }
              
              if (typeof data.audioMuted === 'boolean') {
                recovered.audio.masterMute = data.audioMuted;
                recovered.audio.musicEnabled = !data.audioMuted;
                recovered.audio.soundEnabled = !data.audioMuted;
                hasRecoveredData = true;
              }
              
              // Game settings recovery
              if (data.selectedMode) {
                recovered.game.selectedMode = this.validateGameMode(data.selectedMode);
                hasRecoveredData = true;
              }
            }
          }
        } catch (error) {
          // Continue trying other keys
          continue;
        }
      }

      return hasRecoveredData ? recovered : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate and clean migrated settings with error reporting
   */
  private static validateAndCleanSettings(settings: SettingsState, result?: MigrationResult): SettingsState {
    const cleaned: SettingsState = { ...DEFAULT_SETTINGS };


    try {
      // Validate audio settings
      if (settings.audio) {
        const originalMusicVolume = settings.audio.musicVolume;
        const originalSoundVolume = settings.audio.soundVolume;
        
        cleaned.audio.musicVolume = this.validateVolume(settings.audio.musicVolume);
        cleaned.audio.soundVolume = this.validateVolume(settings.audio.soundVolume);
        cleaned.audio.musicEnabled = this.validateBoolean(settings.audio.musicEnabled, true);
        cleaned.audio.soundEnabled = this.validateBoolean(settings.audio.soundEnabled, true);
        cleaned.audio.masterMute = this.validateBoolean(settings.audio.masterMute, false);
        
        // Report validation corrections
        if (result) {
          if (originalMusicVolume !== cleaned.audio.musicVolume) {
            result.warnings.push(`Music volume corrected from ${originalMusicVolume} to ${cleaned.audio.musicVolume}`);
          }
          if (originalSoundVolume !== cleaned.audio.soundVolume) {
            result.warnings.push(`Sound volume corrected from ${originalSoundVolume} to ${cleaned.audio.soundVolume}`);
          }
        }
      }

      // Validate game settings
      if (settings.game) {
        const originalMode = settings.game.selectedMode;
        cleaned.game.selectedMode = this.validateGameMode(settings.game.selectedMode);
        cleaned.game.showTutorial = this.validateBoolean(settings.game.showTutorial, true);
        
        if (result && originalMode !== cleaned.game.selectedMode) {
          result.warnings.push(`Game mode corrected from ${originalMode} to ${cleaned.game.selectedMode}`);
        }
      }

      // Validate UI settings
      if (settings.ui) {
        const originalTheme = settings.ui.theme;
        cleaned.ui.theme = this.validateTheme(settings.ui.theme);
        cleaned.ui.animations = this.validateBoolean(settings.ui.animations, true);
        
        if (result && originalTheme !== cleaned.ui.theme) {
          result.warnings.push(`UI theme corrected from ${originalTheme} to ${cleaned.ui.theme}`);
        }
      }

      // Preserve meta information
      if (settings.meta) {
        cleaned.meta.version = settings.meta.version || this.CURRENT_VERSION;
        cleaned.meta.lastModified = Date.now();
      }
    } catch (error) {
      if (result) {
        result.errors.push(`Validation error: ${error}`);
        result.warnings.push('Some settings were reset to defaults due to validation errors');
      }
    }

    return cleaned;
  }

  /**
   * Validate volume value (0.0 - 1.0)
   */
  private static validateVolume(value: any): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return Math.max(0, Math.min(1, value));
    }
    return DEFAULT_SETTINGS.audio.musicVolume;
  }

  /**
   * Validate boolean value
   */
  private static validateBoolean(value: any, defaultValue: boolean): boolean {
    return typeof value === 'boolean' ? value : defaultValue;
  }

  /**
   * Validate game mode
   */
  private static validateGameMode(value: any): 'easy' | 'medium' | 'hard' {
    const validModes = ['easy', 'medium', 'hard'];
    return validModes.includes(value) ? value : DEFAULT_SETTINGS.game.selectedMode;
  }

  /**
   * Validate UI theme
   */
  private static validateTheme(value: any): 'default' | 'dark' | 'light' {
    const validThemes = ['default', 'dark', 'light'];
    return validThemes.includes(value) ? value : DEFAULT_SETTINGS.ui.theme;
  }

  /**
   * Generate simple checksum for settings
   */
  private static generateChecksum(data: SettingsState): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Handle corrupted settings with recovery attempts
   */
  public static async handleCorruptedSettings(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      fromVersion: 'corrupted',
      toVersion: this.CURRENT_VERSION,
      errors: [],
      warnings: [],
      recoveredSettings: {},
    };

    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) {
        result.errors.push('No localStorage available');
        return result;
      }

      console.log('SettingsMigration: Attempting to recover from corrupted settings...');

      // Try to restore from backup first
      if (this.restoreFromBackup()) {
        result.warnings.push('Restored from backup due to corruption');
        // Try migration again after restoration
        return await this.migrateSettings();
      }

      // If no backup available, attempt partial recovery
      const partialRecovery = this.attemptPartialRecovery();
      if (partialRecovery) {
        // Save the recovered settings
        const newStoredSettings: StoredSettings = {
          version: this.CURRENT_VERSION,
          timestamp: Date.now(),
          data: partialRecovery,
          checksum: this.generateChecksum(partialRecovery),
        };

        localStorage.setItem(this.NEW_STORAGE_KEY, JSON.stringify(newStoredSettings));
        
        result.success = true;
        result.recoveredSettings = partialRecovery;
        result.warnings.push('Partial recovery successful, some settings reset to defaults');
        
        console.log('SettingsMigration: Partial recovery completed');
        return result;
      }

      // If all else fails, clean up corrupted data and use defaults
      this.cleanupCorruptedData();
      result.warnings.push('All settings reset to defaults due to unrecoverable corruption');
      result.recoveredSettings = { ...DEFAULT_SETTINGS };

      return result;

    } catch (error) {
      result.errors.push(`Corruption recovery failed: ${error}`);
      console.error('SettingsMigration: Failed to handle corrupted settings:', error);
      return result;
    }
  }

  /**
   * Clean up corrupted data entries
   */
  private static cleanupCorruptedData(): void {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) return;

      const status = this.getMigrationStatus();
      
      // Remove corrupted entries
      for (const corruptedKey of status.corruptedEntries) {
        try {
          localStorage.removeItem(corruptedKey);
          console.log(`SettingsMigration: Removed corrupted entry: ${corruptedKey}`);
        } catch (error) {
          console.warn(`SettingsMigration: Failed to remove corrupted entry ${corruptedKey}:`, error);
        }
      }

    } catch (error) {
      console.error('SettingsMigration: Failed to cleanup corrupted data:', error);
    }
  }

  /**
   * Export settings for debugging or manual backup
   */
  public static exportSettings(): string | null {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) return null;

      const exportData = {
        timestamp: Date.now(),
        newSettings: localStorage.getItem(this.NEW_STORAGE_KEY),
        oldSettings: {} as Record<string, string | null>,
        backups: {} as Record<string, string | null>,
      };

      // Export old settings
      for (const key of this.OLD_STORAGE_KEYS) {
        exportData.oldSettings[key] = localStorage.getItem(key);
      }

      // Export backups
      for (const key of this.OLD_STORAGE_KEYS) {
        const backupKey = key + this.BACKUP_SUFFIX;
        exportData.backups[backupKey] = localStorage.getItem(backupKey);
      }

      return JSON.stringify(exportData, null, 2);

    } catch (error) {
      console.error('SettingsMigration: Failed to export settings:', error);
      return null;
    }
  }

  /**
   * Import settings from exported data (use with caution)
   */
  public static importSettings(exportedData: string): boolean {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) return false;

      const data = JSON.parse(exportedData);
      
      if (!data.timestamp) {
        console.error('SettingsMigration: Invalid export data format');
        return false;
      }

      // Import new settings if available
      if (data.newSettings) {
        localStorage.setItem(this.NEW_STORAGE_KEY, data.newSettings);
      }

      // Import old settings
      if (data.oldSettings) {
        for (const [key, value] of Object.entries(data.oldSettings)) {
          if (value && this.OLD_STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, value as string);
          }
        }
      }

      // Import backups
      if (data.backups) {
        for (const [key, value] of Object.entries(data.backups)) {
          if (value && key.endsWith(this.BACKUP_SUFFIX)) {
            localStorage.setItem(key, value as string);
          }
        }
      }

      console.log('SettingsMigration: Settings imported successfully');
      return true;

    } catch (error) {
      console.error('SettingsMigration: Failed to import settings:', error);
      return false;
    }
  }

  /**
   * Check if migration is needed
   */
  public static needsMigration(): boolean {
    const localStorage = BrowserUtils.getLocalStorage();
    if (!localStorage) {
      return false;
    }

    const hasNewSettings = !!localStorage.getItem(this.NEW_STORAGE_KEY);
    if (hasNewSettings) {
      return false; // Already migrated
    }

    // Check if any old settings exist
    return this.OLD_STORAGE_KEYS.some(key => !!localStorage.getItem(key));
  }

  /**
   * Clean up old settings after successful migration
   */
  public static cleanupOldSettings(): void {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) return;

      let cleanedCount = 0;
      for (const key of this.OLD_STORAGE_KEYS) {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`SettingsMigration: Cleaned up ${cleanedCount} old settings entries`);
      }
    } catch (error) {
      console.warn('SettingsMigration: Failed to cleanup old settings:', error);
    }
  }

  /**
   * Clean up backup settings (use with caution)
   */
  public static cleanupBackups(): void {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) return;

      let cleanedCount = 0;
      for (const key of this.OLD_STORAGE_KEYS) {
        const backupKey = key + this.BACKUP_SUFFIX;
        if (localStorage.getItem(backupKey)) {
          localStorage.removeItem(backupKey);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`SettingsMigration: Cleaned up ${cleanedCount} backup entries`);
      }
    } catch (error) {
      console.warn('SettingsMigration: Failed to cleanup backups:', error);
    }
  }

  /**
   * Restore from backup (emergency recovery)
   */
  public static restoreFromBackup(backupKey?: string): boolean {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) return false;

      // If no specific backup key provided, find the most recent one
      if (!backupKey) {
        let mostRecentBackup: { key: string; timestamp: number } | null = null;
        
        for (const key of this.OLD_STORAGE_KEYS) {
          const candidateKey = key + this.BACKUP_SUFFIX;
          const backup = localStorage.getItem(candidateKey);
          if (backup) {
            try {
              const backupData = JSON.parse(backup);
              if (backupData.timestamp && 
                  (!mostRecentBackup || backupData.timestamp > mostRecentBackup.timestamp)) {
                mostRecentBackup = { key: candidateKey, timestamp: backupData.timestamp };
              }
            } catch (error) {
              continue;
            }
          }
        }
        
        if (!mostRecentBackup) {
          console.warn('SettingsMigration: No backups found for restoration');
          return false;
        }
        
        backupKey = mostRecentBackup.key;
      }

      const backup = localStorage.getItem(backupKey);
      if (!backup) {
        console.warn(`SettingsMigration: Backup not found: ${backupKey}`);
        return false;
      }

      const backupData = JSON.parse(backup);
      const originalKey = backupData.originalKey || backupKey.replace(this.BACKUP_SUFFIX, '');
      
      // Restore the original settings
      localStorage.setItem(originalKey, JSON.stringify(backupData.data));
      
      console.log(`SettingsMigration: Restored settings from backup: ${backupKey}`);
      return true;

    } catch (error) {
      console.error('SettingsMigration: Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Get comprehensive migration status information
   */
  public static getMigrationStatus(): {
    needsMigration: boolean;
    hasOldSettings: boolean;
    hasNewSettings: boolean;
    oldSettingsFound: string[];
    backupsFound: string[];
    corruptedEntries: string[];
  } {
    const localStorage = BrowserUtils.getLocalStorage();
    if (!localStorage) {
      return {
        needsMigration: false,
        hasOldSettings: false,
        hasNewSettings: false,
        oldSettingsFound: [],
        backupsFound: [],
        corruptedEntries: [],
      };
    }

    const hasNewSettings = !!localStorage.getItem(this.NEW_STORAGE_KEY);
    const oldSettingsFound: string[] = [];
    const backupsFound: string[] = [];
    const corruptedEntries: string[] = [];

    // Check for old settings
    for (const key of this.OLD_STORAGE_KEYS) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          JSON.parse(stored); // Test if it's valid JSON
          oldSettingsFound.push(key);
        }
      } catch (error) {
        if (localStorage.getItem(key)) {
          corruptedEntries.push(key);
        }
      }

      // Check for backups
      const backupKey = key + this.BACKUP_SUFFIX;
      try {
        const backup = localStorage.getItem(backupKey);
        if (backup) {
          JSON.parse(backup); // Test if it's valid JSON
          backupsFound.push(backupKey);
        }
      } catch (error) {
        if (localStorage.getItem(backupKey)) {
          corruptedEntries.push(backupKey);
        }
      }
    }

    return {
      needsMigration: oldSettingsFound.length > 0 && !hasNewSettings,
      hasOldSettings: oldSettingsFound.length > 0,
      hasNewSettings,
      oldSettingsFound,
      backupsFound,
      corruptedEntries,
    };
  }

  /**
   * Validate stored settings for corruption
   */
  public static validateStoredSettings(key?: string): {
    isValid: boolean;
    errors: string[];
    data?: any;
  } {
    const result = {
      isValid: false,
      errors: [] as string[],
      data: undefined as any,
    };

    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) {
        result.errors.push('No localStorage available');
        return result;
      }

      const targetKey = key || this.NEW_STORAGE_KEY;
      const stored = localStorage.getItem(targetKey);
      
      if (!stored) {
        result.errors.push(`No data found for key: ${targetKey}`);
        return result;
      }

      // Parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(stored);
      } catch (error) {
        result.errors.push(`Invalid JSON format: ${error}`);
        return result;
      }

      // Validate structure for new format
      if (targetKey === this.NEW_STORAGE_KEY) {
        if (!parsedData.version || !parsedData.data || !parsedData.timestamp) {
          result.errors.push('Missing required fields in stored settings');
          return result;
        }

        // Validate checksum if present
        if (parsedData.checksum) {
          const expectedChecksum = this.generateChecksum(parsedData.data);
          if (parsedData.checksum !== expectedChecksum) {
            result.errors.push('Checksum validation failed - data may be corrupted');
            return result;
          }
        }
      }

      result.isValid = true;
      result.data = parsedData;
      return result;

    } catch (error) {
      result.errors.push(`Validation error: ${error}`);
      return result;
    }
  }
}
