import { SettingsState, DEFAULT_SETTINGS } from '../types/settings.js';
import { BrowserUtils } from './BrowserUtils.js';

/**
 * Settings migration utilities
 * Handles migration from old settings format to new centralized format
 */
export class SettingsMigration {
  private static readonly OLD_STORAGE_KEY = 'dicetrix_settings_v1';
  private static readonly NEW_STORAGE_KEY = 'dicetrix_settings_v2';



  /**
   * Migrate settings from old format to new format
   */
  public static async migrateSettings(): Promise<boolean> {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (!localStorage) {
        return false; // No storage available
      }

      // Check if new settings already exist
      const newSettings = localStorage.getItem(this.NEW_STORAGE_KEY);
      if (newSettings) {
        return false; // Already migrated
      }

      // Check for old settings
      const oldSettings = localStorage.getItem(this.OLD_STORAGE_KEY);
      if (!oldSettings) {
        return false; // No old settings to migrate
      }

      // Parse old settings
      const oldData = JSON.parse(oldSettings);
      
      // Convert to new format
      const migratedSettings = this.convertOldToNewFormat(oldData);
      
      // Validate migrated settings
      const validatedSettings = this.validateAndCleanSettings(migratedSettings);
      
      // Save migrated settings in new format
      const newStoredSettings = {
        version: validatedSettings.meta.version,
        timestamp: Date.now(),
        data: validatedSettings,
        checksum: this.generateChecksum(validatedSettings),
      };

      localStorage.setItem(this.NEW_STORAGE_KEY, JSON.stringify(newStoredSettings));
      
      // Keep old settings for backup (don't delete immediately)
      console.log('SettingsMigration: Successfully migrated settings from v1 to v2');
      return true;

    } catch (error) {
      console.error('SettingsMigration: Failed to migrate settings:', error);
      return false;
    }
  }

  /**
   * Convert old settings format to new format
   */
  private static convertOldToNewFormat(oldData: any): SettingsState {
    const newSettings: SettingsState = {
      ...DEFAULT_SETTINGS,
      meta: {
        version: '1.0.0',
        lastModified: Date.now(),
      },
    };

    // Map old settings to new structure
    if (oldData.selectedMode) {
      newSettings.game.selectedMode = this.validateGameMode(oldData.selectedMode);
    }

    if (typeof oldData.audioVolume === 'number') {
      // Old format had single volume for both music and sound
      const volume = Math.max(0, Math.min(1, oldData.audioVolume));
      newSettings.audio.musicVolume = volume;
      newSettings.audio.soundVolume = volume;
    }

    if (typeof oldData.audioMuted === 'boolean') {
      // Old format had single mute for both music and sound
      const enabled = !oldData.audioMuted;
      newSettings.audio.musicEnabled = enabled;
      newSettings.audio.soundEnabled = enabled;
      newSettings.audio.masterMute = oldData.audioMuted;
    }

    return newSettings;
  }

  /**
   * Validate and clean migrated settings
   */
  private static validateAndCleanSettings(settings: SettingsState): SettingsState {
    const cleaned: SettingsState = { ...DEFAULT_SETTINGS };

    // Validate audio settings
    if (settings.audio) {
      cleaned.audio.musicVolume = this.validateVolume(settings.audio.musicVolume);
      cleaned.audio.soundVolume = this.validateVolume(settings.audio.soundVolume);
      cleaned.audio.musicEnabled = this.validateBoolean(settings.audio.musicEnabled, true);
      cleaned.audio.soundEnabled = this.validateBoolean(settings.audio.soundEnabled, true);
      cleaned.audio.masterMute = this.validateBoolean(settings.audio.masterMute, false);
    }

    // Validate game settings
    if (settings.game) {
      cleaned.game.selectedMode = this.validateGameMode(settings.game.selectedMode);
      cleaned.game.showTutorial = this.validateBoolean(settings.game.showTutorial, true);
    }

    // Validate UI settings
    if (settings.ui) {
      cleaned.ui.theme = this.validateTheme(settings.ui.theme);
      cleaned.ui.animations = this.validateBoolean(settings.ui.animations, true);
    }

    // Preserve meta information
    if (settings.meta) {
      cleaned.meta.version = settings.meta.version || DEFAULT_SETTINGS.meta.version;
      cleaned.meta.lastModified = Date.now();
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
   * Check if migration is needed
   */
  public static needsMigration(): boolean {
    const localStorage = BrowserUtils.getLocalStorage();
    if (!localStorage) {
      return false;
    }

    const hasOldSettings = !!localStorage.getItem(this.OLD_STORAGE_KEY);
    const hasNewSettings = !!localStorage.getItem(this.NEW_STORAGE_KEY);

    return hasOldSettings && !hasNewSettings;
  }

  /**
   * Clean up old settings after successful migration
   */
  public static cleanupOldSettings(): void {
    try {
      const localStorage = BrowserUtils.getLocalStorage();
      if (localStorage) {
        localStorage.removeItem(this.OLD_STORAGE_KEY);
        console.log('SettingsMigration: Cleaned up old settings');
      }
    } catch (error) {
      console.warn('SettingsMigration: Failed to cleanup old settings:', error);
    }
  }

  /**
   * Get migration status information
   */
  public static getMigrationStatus(): {
    needsMigration: boolean;
    hasOldSettings: boolean;
    hasNewSettings: boolean;
  } {
    const localStorage = BrowserUtils.getLocalStorage();
    if (!localStorage) {
      return {
        needsMigration: false,
        hasOldSettings: false,
        hasNewSettings: false,
      };
    }

    const hasOldSettings = !!localStorage.getItem(this.OLD_STORAGE_KEY);
    const hasNewSettings = !!localStorage.getItem(this.NEW_STORAGE_KEY);

    return {
      needsMigration: hasOldSettings && !hasNewSettings,
      hasOldSettings,
      hasNewSettings,
    };
  }
}
