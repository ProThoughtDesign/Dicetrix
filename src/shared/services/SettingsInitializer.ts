import { settingsManager } from './SettingsManager.js';
import { SettingsMigration } from '../utils/SettingsMigration.js';

/**
 * Settings Initializer
 * Handles the initialization of the Settings Manager with migration and error recovery
 */
export class SettingsInitializer {
  private static isInitialized = false;

  /**
   * Initialize the Settings Manager with migration and error handling
   */
  public static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return; // Already initialized
    }

    try {
      console.log('SettingsInitializer: Starting settings initialization...');

      // Check if migration is needed
      if (SettingsMigration.needsMigration()) {
        console.log('SettingsInitializer: Migration needed, attempting to migrate...');
        const migrationSuccess = await SettingsMigration.migrateSettings();
        
        if (migrationSuccess) {
          console.log('SettingsInitializer: Migration completed successfully');
          // Clean up old settings after successful migration
          setTimeout(() => {
            SettingsMigration.cleanupOldSettings();
          }, 1000); // Delay cleanup to ensure new settings are saved
        } else {
          console.warn('SettingsInitializer: Migration failed, will use defaults');
        }
      }

      // Load settings (will use defaults if no settings exist or loading fails)
      await settingsManager.load();

      // Validate settings integrity
      const diagnostics = settingsManager.getDiagnostics();
      if (!diagnostics.isValid) {
        console.warn('SettingsInitializer: Settings validation failed:', diagnostics.validationErrors);
        
        // Reset to defaults if validation fails
        settingsManager.reset();
        console.log('SettingsInitializer: Reset to defaults due to validation errors');
      }

      if (diagnostics.corruptionDetected) {
        console.warn('SettingsInitializer: Settings corruption detected, reset to defaults');
        settingsManager.reset();
      }

      // Save settings to ensure they're persisted in the correct format
      await settingsManager.save();

      this.isInitialized = true;
      console.log('SettingsInitializer: Settings initialization completed successfully');

    } catch (error) {
      console.error('SettingsInitializer: Failed to initialize settings:', error);
      
      // Fallback: reset to defaults and try to save
      try {
        settingsManager.reset();
        await settingsManager.save();
        this.isInitialized = true;
        console.log('SettingsInitializer: Fallback initialization completed');
      } catch (fallbackError) {
        console.error('SettingsInitializer: Fallback initialization also failed:', fallbackError);
        // Continue with in-memory defaults
        this.isInitialized = true;
      }
    }
  }

  /**
   * Check if settings are initialized
   */
  public static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get initialization status and diagnostics
   */
  public static getStatus(): {
    isInitialized: boolean;
    migrationStatus: ReturnType<typeof SettingsMigration.getMigrationStatus>;
    diagnostics: ReturnType<typeof settingsManager.getDiagnostics>;
  } {
    return {
      isInitialized: this.isInitialized,
      migrationStatus: SettingsMigration.getMigrationStatus(),
      diagnostics: this.isInitialized ? settingsManager.getDiagnostics() : {
        isValid: false,
        version: 'unknown',
        lastModified: 0,
        storageSize: 0,
        validationErrors: ['Not initialized'],
        corruptionDetected: false,
      },
    };
  }

  /**
   * Force re-initialization (useful for testing or recovery)
   */
  public static async reinitialize(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }
}
