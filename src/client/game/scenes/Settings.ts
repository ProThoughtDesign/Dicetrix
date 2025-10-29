import { Scene } from 'phaser';
import { audioHandler } from '../services/AudioHandler';
import Logger from '../../utils/Logger';
import { AudioControlsUI, AudioControlsConfig, AudioControlsCallbacks } from '../ui/AudioControlsUI';
import { SoundEffectLibrary } from '../services/SoundEffectLibrary';
import { settingsManager } from '../../../shared/services/SettingsManager.js';
import { AudioSettings } from '../../../shared/types/settings.js';

export class Settings extends Scene {
  private audioControlsUI: AudioControlsUI | null = null;
  private soundEffectLibrary: SoundEffectLibrary | null = null;

  private backButton: Phaser.GameObjects.Text | null = null;
  
  // Game context properties
  private gameContext: 'menu' | 'game' = 'menu';
  private gameState: any = null;
  private resumeGameButton: Phaser.GameObjects.Text | null = null;
  private exitToMenuButton: Phaser.GameObjects.Text | null = null;
  
  // Confirmation dialog properties
  private confirmationDialog: Phaser.GameObjects.Container | null = null;
  private confirmationBackground: Phaser.GameObjects.Rectangle | null = null;
  private confirmationPanel: Phaser.GameObjects.Rectangle | null = null;
  private confirmationText: Phaser.GameObjects.Text | null = null;
  private confirmYesButton: Phaser.GameObjects.Text | null = null;
  private confirmCancelButton: Phaser.GameObjects.Text | null = null;

  // Settings Manager subscriptions for cleanup
  private settingsSubscriptions: (() => void)[] = [];

  constructor() {
    super('Settings');
  }

  init(data?: any): void {
    // Determine context from registry or passed data
    this.gameContext = this.registry.get('settingsContext') || data?.context || 'menu';
    this.gameState = this.registry.get('pausedGameState') || null;
    
    Logger.log(`Settings: Initialized with context '${this.gameContext}'`);
  }

  create(): void {
    const { width, height } = this.scale;

    // Set background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // UI scale factor (consistent with StartMenu)
    const UI_SCALE = 2;

    // Initialize SoundEffectLibrary for audio preview functionality
    // Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
    try {
      this.soundEffectLibrary = new SoundEffectLibrary(this);
      Logger.log('Settings: SoundEffectLibrary initialized for audio preview');
    } catch (error) {
      Logger.log(`Settings: Failed to initialize SoundEffectLibrary - ${error}`);
      this.soundEffectLibrary = null;
    }

    // Title
    this.add
      .text(width / 2, height * 0.1, 'SETTINGS', {
        fontSize: `${48 * UI_SCALE}px`,
        color: '#00ff88',
        fontFamily: 'Nabla',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);



    // Initialize AudioControlsUI with current settings from Settings Manager
    // Requirements: 2.1, 2.2, 8.1, 8.2, 8.3, 8.4
    const audioSettings = settingsManager.get<AudioSettings>('audio');
    const initialConfig: Partial<AudioControlsConfig> = {
      musicVolume: audioSettings.musicVolume,
      soundVolume: audioSettings.soundVolume,
      musicEnabled: audioSettings.musicEnabled,
      soundEnabled: audioSettings.soundEnabled,
      masterMute: audioSettings.masterMute
    };

    const callbacks: AudioControlsCallbacks = {
      onMusicVolumeChange: (volume) => this.handleMusicVolumeChange(volume),
      onSoundVolumeChange: (volume) => this.handleSoundVolumeChange(volume),
      onMusicToggle: (enabled) => this.handleMusicToggle(enabled),
      onSoundToggle: (enabled) => this.handleSoundToggle(enabled),
      onMasterMuteToggle: (muted) => this.handleMasterMuteToggle(muted),
      onSettingsReset: () => this.handleSettingsReset()
    };

    this.audioControlsUI = new AudioControlsUI(this, initialConfig, callbacks);

    // Position the audio controls in the center area with 2.5x scale
    const controlsContainer = this.audioControlsUI.getContainer();
    controlsContainer.setPosition(width / 2, height * 0.5);
    controlsContainer.setScale(2.5);

    // Subscribe to Settings Manager events for external changes
    // Requirements: 2.5, 8.1, 8.2, 8.3, 8.4
    this.setupSettingsSubscriptions();



    // Create context-appropriate buttons
    this.createGameContextButtons(width, height, UI_SCALE);

    Logger.log('Settings: Scene created with enhanced AudioControlsUI and Settings Manager integration');
  }

  /**
   * Setup Settings Manager event subscriptions for external changes
   * Requirements: 2.5, 8.1, 8.2, 8.3, 8.4
   */
  private setupSettingsSubscriptions(): void {
    // Subscribe to audio settings changes
    const audioSubscription = settingsManager.subscribe('audio', (event) => {
      Logger.log(`Settings: External audio settings change detected - ${event.key}`);
      this.updateVisualIndicators();
    });
    this.settingsSubscriptions.push(audioSubscription);

    // Subscribe to specific audio property changes for granular updates
    const musicVolumeSubscription = settingsManager.subscribe('audio.musicVolume', (event) => {
      if (this.audioControlsUI) {
        this.audioControlsUI.updateConfig({ musicVolume: event.newValue });
      }
    });
    this.settingsSubscriptions.push(musicVolumeSubscription);

    const soundVolumeSubscription = settingsManager.subscribe('audio.soundVolume', (event) => {
      if (this.audioControlsUI) {
        this.audioControlsUI.updateConfig({ soundVolume: event.newValue });
      }
    });
    this.settingsSubscriptions.push(soundVolumeSubscription);

    const musicEnabledSubscription = settingsManager.subscribe('audio.musicEnabled', (event) => {
      if (this.audioControlsUI) {
        this.audioControlsUI.updateConfig({ musicEnabled: event.newValue });
      }
    });
    this.settingsSubscriptions.push(musicEnabledSubscription);

    const soundEnabledSubscription = settingsManager.subscribe('audio.soundEnabled', (event) => {
      if (this.audioControlsUI) {
        this.audioControlsUI.updateConfig({ soundEnabled: event.newValue });
      }
    });
    this.settingsSubscriptions.push(soundEnabledSubscription);

    const masterMuteSubscription = settingsManager.subscribe('audio.masterMute', (event) => {
      if (this.audioControlsUI) {
        this.audioControlsUI.updateConfig({ masterMute: event.newValue });
      }
    });
    this.settingsSubscriptions.push(masterMuteSubscription);

    Logger.log('Settings: Settings Manager subscriptions established');
  }

  /**
   * Update visual indicators to reflect current Settings Manager state
   * Requirements: 8.1, 8.2, 8.3, 8.4
   */
  private updateVisualIndicators(): void {
    if (!this.audioControlsUI) return;

    const audioSettings = settingsManager.get<AudioSettings>('audio');
    
    // Update all visual indicators to match Settings Manager state
    this.audioControlsUI.updateConfig({
      musicVolume: audioSettings.musicVolume,
      soundVolume: audioSettings.soundVolume,
      musicEnabled: audioSettings.musicEnabled,
      soundEnabled: audioSettings.soundEnabled,
      masterMute: audioSettings.masterMute
    });

    Logger.log('Settings: Visual indicators updated to match Settings Manager state');
  }

  /**
   * Handle music volume changes with immediate feedback and audio preview
   * Requirements: 2.1, 2.2, 2.5
   */
  private handleMusicVolumeChange(volume: number): void {
    // Update Settings Manager - this will trigger audio system updates via AudioSettingsAdapter
    settingsManager.set('audio.musicVolume', volume);
    
    // Play settings change sound for immediate feedback
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log(`Settings: Music volume changed to ${Math.round(volume * 100)}% via Settings Manager`);
  }

  /**
   * Handle sound effects volume changes with immediate feedback and audio preview
   * Requirements: 2.1, 2.2, 2.5
   */
  private handleSoundVolumeChange(volume: number): void {
    // Update Settings Manager - this will trigger audio system updates via AudioSettingsAdapter
    settingsManager.set('audio.soundVolume', volume);
    
    // Update SoundEffectLibrary volume if available
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setVolume(volume);
      // Play settings change sound for immediate feedback
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log(`Settings: Sound effects volume changed to ${Math.round(volume * 100)}% via Settings Manager`);
  }

  /**
   * Handle music toggle changes with audio feedback
   * Requirements: 2.1, 2.2, 2.5
   */
  private handleMusicToggle(enabled: boolean): void {
    // Update Settings Manager - this will trigger audio system updates via AudioSettingsAdapter
    settingsManager.set('audio.musicEnabled', enabled);
    
    // Play menu select sound for feedback
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }
    
    Logger.log(`Settings: Music ${enabled ? 'enabled' : 'disabled'} via Settings Manager`);
  }

  /**
   * Handle sound effects toggle changes with audio feedback
   * Requirements: 2.1, 2.2, 2.5
   */
  private handleSoundToggle(enabled: boolean): void {
    // Update Settings Manager - this will trigger audio system updates via AudioSettingsAdapter
    settingsManager.set('audio.soundEnabled', enabled);
    
    // Update SoundEffectLibrary state
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setEnabled(enabled);
      
      // Play menu select sound if SFX is being enabled
      if (enabled) {
        this.soundEffectLibrary.playMenuNavigate();
      }
    }
    
    Logger.log(`Settings: Sound effects ${enabled ? 'enabled' : 'disabled'} via Settings Manager`);
  }

  /**
   * Handle master mute toggle that overrides all other audio settings
   * Requirements: 2.1, 2.2, 2.5
   */
  private handleMasterMuteToggle(muted: boolean): void {
    // Update Settings Manager - this will trigger audio system updates via AudioSettingsAdapter
    settingsManager.set('audio.masterMute', muted);
    
    // Update SoundEffectLibrary state based on effective sound state
    if (this.soundEffectLibrary) {
      const audioSettings = settingsManager.get<AudioSettings>('audio');
      const effectiveSoundEnabled = !muted && audioSettings.soundEnabled;
      this.soundEffectLibrary.setEnabled(effectiveSoundEnabled);
    }
    
    Logger.log(`Settings: Master mute ${muted ? 'enabled' : 'disabled'} via Settings Manager`);
  }

  /**
   * Handle settings reset with confirmation and audio feedback
   * Requirements: 2.1, 2.2, 2.5
   */
  private handleSettingsReset(): void {
    // Reset audio settings to defaults via Settings Manager
    // This will trigger audio system updates via AudioSettingsAdapter
    settingsManager.set('audio.musicVolume', 0.8);
    settingsManager.set('audio.soundVolume', 0.8);
    settingsManager.set('audio.musicEnabled', true);
    settingsManager.set('audio.soundEnabled', true);
    settingsManager.set('audio.masterMute', false);
    
    // Reset SoundEffectLibrary
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setVolume(0.8);
      this.soundEffectLibrary.setEnabled(true);
      this.soundEffectLibrary.playSettingsChange();
    }
    
    // Update visual indicators to reflect reset values
    this.updateVisualIndicators();
    
    Logger.log('Settings: Audio settings reset to defaults via Settings Manager');
  }



  /**
   * Create context-appropriate buttons based on where Settings was opened from
   * Requirements: 2.1, 2.2
   */
  private createGameContextButtons(width: number, height: number, UI_SCALE: number): void {
    if (this.gameContext === 'game' && this.gameState) {
      // Game context: Show Resume Game and Exit to Menu buttons
      this.resumeGameButton = this.add
        .text(width / 2, height * 0.8, 'RESUME GAME', {
          fontSize: `${32 * UI_SCALE}px`,
          color: '#ffffff',
          fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
          backgroundColor: '#00ff88',
          padding: { x: 40 * UI_SCALE, y: 20 * UI_SCALE },
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.resumeGameButton?.setStyle({ backgroundColor: '#00dd70' }))
        .on('pointerout', () => this.resumeGameButton?.setStyle({ backgroundColor: '#00ff88' }))
        .on('pointerdown', () => this.handleResumeGame());

      this.exitToMenuButton = this.add
        .text(width / 2, height * 0.9, 'EXIT TO MENU', {
          fontSize: `${24 * UI_SCALE}px`,
          color: '#ffffff',
          fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
          backgroundColor: '#cc6600',
          padding: { x: 30 * UI_SCALE, y: 15 * UI_SCALE },
          stroke: '#000000',
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.exitToMenuButton?.setStyle({ backgroundColor: '#dd7711' }))
        .on('pointerout', () => this.exitToMenuButton?.setStyle({ backgroundColor: '#cc6600' }))
        .on('pointerdown', () => this.handleExitToMenu());
    } else {
      // Menu context: Show Back to Menu button
      this.backButton = this.add
        .text(width / 2, height * 0.9, 'BACK TO MENU', {
          fontSize: `${28 * UI_SCALE}px`,
          color: '#ffffff',
          fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
          backgroundColor: '#00ff88',
          padding: { x: 30 * UI_SCALE, y: 15 * UI_SCALE },
          stroke: '#000000',
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.backButton?.setStyle({ backgroundColor: '#00dd70' }))
        .on('pointerout', () => this.backButton?.setStyle({ backgroundColor: '#00ff88' }))
        .on('pointerdown', () => this.closeSettings());
    }
  }

  /**
   * Handle Resume Game action - return to paused game
   * Requirements: 2.1, 2.2
   */
  private handleResumeGame(): void {
    try {
      // Play menu select sound
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playMenuNavigate();
      }

      // Clean up UI
      this.cleanupUI();

      // Set flag to indicate game is being resumed from Settings
      this.registry.set('gameResumedFromSettings', true);

      // Return to game with resume flag
      this.scene.start('Game', { 
        gameMode: this.gameState.gameMode,
        resumeFromPause: true 
      });
      
      Logger.log('Settings: Resuming game from Settings with state restoration');
    } catch (error) {
      Logger.log(`Settings: Error resuming game - ${error}`);
      // Fallback to direct game restart
      this.scene.start('Game', { gameMode: this.gameState?.gameMode || 'medium' });
    }
  }

  /**
   * Handle Exit to Menu action with confirmation
   * Requirements: 2.2
   */
  private handleExitToMenu(): void {
    // Show confirmation dialog before exiting
    this.showExitConfirmation();
  }

  /**
   * Show exit confirmation dialog
   * Requirements: 2.2
   */
  private showExitConfirmation(): void {
    const { width, height } = this.scale;
    const UI_SCALE = 2;

    // Create semi-transparent background overlay
    this.confirmationBackground = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setInteractive();

    // Create confirmation panel
    const panelWidth = 400 * UI_SCALE;
    const panelHeight = 250 * UI_SCALE;
    
    this.confirmationPanel = this.add
      .rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x1a1a2e)
      .setStrokeStyle(4, 0x00ff88);

    // Create confirmation text
    this.confirmationText = this.add
      .text(width / 2, height / 2 - 40 * UI_SCALE, 'Exit to Menu?\n\nYour current game\nwill be lost.', {
        fontSize: `${20 * UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        align: 'center',
        lineSpacing: 8 * UI_SCALE,
      })
      .setOrigin(0.5);

    // Create Yes button
    this.confirmYesButton = this.add
      .text(width / 2 - 80 * UI_SCALE, height / 2 + 60 * UI_SCALE, 'YES', {
        fontSize: `${18 * UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        backgroundColor: '#ff3366',
        padding: { x: 25 * UI_SCALE, y: 12 * UI_SCALE },
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.confirmYesButton?.setStyle({ backgroundColor: '#ff5588' }))
      .on('pointerout', () => this.confirmYesButton?.setStyle({ backgroundColor: '#ff3366' }))
      .on('pointerdown', () => this.confirmExitToMenu());

    // Create Cancel button
    this.confirmCancelButton = this.add
      .text(width / 2 + 80 * UI_SCALE, height / 2 + 60 * UI_SCALE, 'CANCEL', {
        fontSize: `${18 * UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        backgroundColor: '#666666',
        padding: { x: 20 * UI_SCALE, y: 12 * UI_SCALE },
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.confirmCancelButton?.setStyle({ backgroundColor: '#888888' }))
      .on('pointerout', () => this.confirmCancelButton?.setStyle({ backgroundColor: '#666666' }))
      .on('pointerdown', () => this.hideExitConfirmation());

    // Create container for all dialog elements
    this.confirmationDialog = this.add.container(0, 0, [
      this.confirmationBackground,
      this.confirmationPanel,
      this.confirmationText,
      this.confirmYesButton,
      this.confirmCancelButton
    ]);

    // Bring dialog to front
    this.confirmationDialog.setDepth(1000);

    // Play dialog open sound
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }

    Logger.log('Settings: Exit confirmation dialog shown');
  }

  /**
   * Hide exit confirmation dialog
   * Requirements: 2.2
   */
  private hideExitConfirmation(): void {
    if (this.confirmationDialog) {
      this.confirmationDialog.destroy();
      this.confirmationDialog = null;
    }

    // Clear individual references
    this.confirmationBackground = null;
    this.confirmationPanel = null;
    this.confirmationText = null;
    this.confirmYesButton = null;
    this.confirmCancelButton = null;

    // Play cancel sound
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }

    Logger.log('Settings: Exit confirmation dialog hidden');
  }

  /**
   * Confirm exit to menu action
   * Requirements: 2.2
   */
  private confirmExitToMenu(): void {
    try {
      // Hide confirmation dialog
      this.hideExitConfirmation();

      // Play menu select sound
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playMenuNavigate();
      }

      // Clean up UI
      this.cleanupUI();

      // Clear registry entries
      this.registry.remove('pausedGameState');
      this.registry.remove('settingsContext');

      // Return to StartMenu
      this.scene.start('StartMenu');
      
      Logger.log('Settings: Confirmed exit to menu from Settings');
    } catch (error) {
      Logger.log(`Settings: Error confirming exit to menu - ${error}`);
      // Fallback to direct menu transition
      this.scene.start('StartMenu');
    }
  }



  /**
   * Clean up UI elements and Settings Manager subscriptions
   */
  private cleanupUI(): void {
    // Clean up Settings Manager subscriptions
    this.settingsSubscriptions.forEach(unsubscribe => unsubscribe());
    this.settingsSubscriptions = [];
    
    if (this.audioControlsUI) {
      this.audioControlsUI.destroy();
      this.audioControlsUI = null;
    }
    
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.destroy();
      this.soundEffectLibrary = null;
    }

    // Clean up confirmation dialog if it exists
    if (this.confirmationDialog) {
      this.confirmationDialog.destroy();
      this.confirmationDialog = null;
    }

    // Clear individual confirmation dialog references
    this.confirmationBackground = null;
    this.confirmationPanel = null;
    this.confirmationText = null;
    this.confirmYesButton = null;
    this.confirmCancelButton = null;
  }

  /**
   * Close settings and return to appropriate scene with proper cleanup
   * Requirements: 2.1, 2.2, 2.5, 8.1, 8.2, 8.3, 8.4
   */
  private closeSettings(): void {
    try {
      // Play menu back sound
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playMenuNavigate();
      } else {
        audioHandler.playSound('menu-back');
      }
      
      // Clean up UI and Settings Manager subscriptions
      this.cleanupUI();
      
      // Clean up any lingering registry state to prevent interference with new games
      this.registry.remove('pausedGameState');
      this.registry.remove('settingsContext');
      this.registry.remove('gameResumedFromSettings');
      this.registry.remove('restoredGameBoardState');
      this.registry.remove('restoredTimerDelays');
      
      // Always return to StartMenu when using closeSettings (menu context)
      this.scene.start('StartMenu');
      Logger.log('Settings: Returning to StartMenu with proper cleanup, Settings Manager subscriptions cleared, and registry cleared');
    } catch (error) {
      Logger.log(`Settings: Error during close - ${error}`);
      // Fallback to direct scene transition with cleanup
      this.cleanupUI(); // Ensure Settings Manager subscriptions are cleaned up
      this.registry.remove('pausedGameState');
      this.registry.remove('settingsContext');
      this.registry.remove('gameResumedFromSettings');
      this.scene.start('StartMenu');
    }
  }

  /**
   * Scene shutdown cleanup
   */
  shutdown(): void {
    // Clean up UI and Settings Manager subscriptions
    this.cleanupUI();
    
    // Reset context
    this.gameContext = 'menu';
    this.gameState = null;
    
    Logger.log('Settings: Scene shutdown cleanup completed with Settings Manager subscriptions cleared');
  }
}
