import { Scene } from 'phaser';
import Logger from '../../utils/Logger';
import { SettingsInitializer } from '../../../shared/services/SettingsInitializer.js';
import { audioSettingsAdapter } from '../services/AudioSettingsAdapter.js';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  async preload(): Promise<void> {
    // Load minimal assets needed for the preloader
    Logger.log('Boot scene: Loading initial assets');
    
    // Initialize centralized settings system
    await this.initializeSettingsSystem();
  }

  create(): void {
    Logger.log('Boot scene: Starting preloader');
    this.scene.start('Preloader');
  }

  private async initializeSettingsSystem(): Promise<void> {
    try {
      Logger.log('Boot scene: Initializing centralized settings system');
      
      // Use SettingsInitializer for proper initialization with migration and error recovery
      await SettingsInitializer.initialize();
      
      // Initialize audio settings adapter for bidirectional synchronization
      // Note: AudioHandler will set its reference when it initializes
      audioSettingsAdapter.initialize();
      
      Logger.log('Boot scene: Settings system initialized successfully');
      
      // Log initialization status for debugging
      const status = SettingsInitializer.getStatus();
      Logger.log(`Boot scene: Settings status - initialized: ${status.isInitialized}, valid: ${status.diagnostics.isValid}`);
      
    } catch (error) {
      Logger.log(`Boot scene: Settings system initialization failed - ${error}`);
      // Continue with defaults - don't block game startup
      
      // Try to initialize audio adapter anyway with defaults
      try {
        audioSettingsAdapter.initialize();
      } catch (adapterError) {
        Logger.log(`Boot scene: Audio adapter initialization also failed - ${adapterError}`);
      }
    }
  }
}
