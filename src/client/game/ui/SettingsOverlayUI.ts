import * as Phaser from 'phaser';
import { settingsManager } from '../../../shared/services/SettingsManager';
import { SettingsChangeCallback } from '../../../shared/types/settings';
import Logger from '../../utils/Logger';
import { AudioControlsUI, AudioControlsConfig, AudioControlsCallbacks } from './AudioControlsUI';
import { SoundEffectLibrary } from '../services/SoundEffectLibrary';

export interface SettingsOverlayCallbacks {
  onClose: () => void;
  onExitToMenu: () => void;
}

/**
 * Settings overlay UI that appears on top of the game without changing scenes
 * Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5
 */
export class SettingsOverlayUI {
  private scene: Phaser.Scene;
  private callbacks: SettingsOverlayCallbacks;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private audioControlsUI: AudioControlsUI | null = null;
  private soundEffectLibrary: SoundEffectLibrary | null = null;
  private backButton: Phaser.GameObjects.Text | null = null;
  private exitToMenuButton: Phaser.GameObjects.Text | null = null;
  private confirmationDialog: Phaser.GameObjects.Container | null = null;
  
  // Settings Manager subscriptions for cleanup
  private settingsSubscriptions: (() => void)[] = [];

  constructor(scene: Phaser.Scene, callbacks: SettingsOverlayCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    
    this.createOverlay();
    Logger.log('SettingsOverlayUI: Created settings overlay');
  }

  private createOverlay(): void {
    const { width, height } = this.scene.scale;
    const UI_SCALE = 2;

    // Create main container
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000); // High depth to appear above game

    // Semi-transparent background overlay
    this.background = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    this.background.setOrigin(0, 0);
    this.background.setInteractive();
    this.container.add(this.background);

    // Settings panel
    const panelWidth = 600 * UI_SCALE;
    const panelHeight = 500 * UI_SCALE;
    this.panel = this.scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x1a1a2e);
    this.panel.setStrokeStyle(4, 0x00ff88);
    this.container.add(this.panel);

    // Title
    const title = this.scene.add.text(width / 2, height / 2 - 200 * UI_SCALE, 'SETTINGS', {
      fontSize: `${32 * UI_SCALE}px`,
      color: '#00ff88',
      fontFamily: 'Nabla',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add(title);

    // Initialize SoundEffectLibrary for audio preview functionality
    try {
      this.soundEffectLibrary = new SoundEffectLibrary(this.scene);
      Logger.log('SettingsOverlayUI: SoundEffectLibrary initialized for audio preview');
    } catch (error) {
      Logger.log(`SettingsOverlayUI: Failed to initialize SoundEffectLibrary - ${error}`);
      this.soundEffectLibrary = null;
    }

    // Initialize AudioControlsUI with Settings Manager values
    const initialConfig: Partial<AudioControlsConfig> = {
      musicVolume: settingsManager.get<number>('audio.musicVolume'),
      soundVolume: settingsManager.get<number>('audio.soundVolume'),
      musicEnabled: settingsManager.get<boolean>('audio.musicEnabled'),
      soundEnabled: settingsManager.get<boolean>('audio.soundEnabled'),
      masterMute: settingsManager.get<boolean>('audio.masterMute')
    };

    const audioCallbacks: AudioControlsCallbacks = {
      onMusicVolumeChange: (volume) => this.handleMusicVolumeChange(volume),
      onSoundVolumeChange: (volume) => this.handleSoundVolumeChange(volume),
      onMusicToggle: (enabled) => this.handleMusicToggle(enabled),
      onSoundToggle: (enabled) => this.handleSoundToggle(enabled),
      onMasterMuteToggle: (muted) => this.handleMasterMuteToggle(muted),
      onSettingsReset: () => this.handleSettingsReset()
    };

    this.audioControlsUI = new AudioControlsUI(this.scene, initialConfig, audioCallbacks);
    const controlsContainer = this.audioControlsUI.getContainer();
    controlsContainer.setPosition(width / 2, height / 2);
    controlsContainer.setScale(2);
    this.container.add(controlsContainer);

    // Subscribe to Settings Manager changes for external updates
    this.setupSettingsSubscriptions();

    // Back button
    this.backButton = this.scene.add.text(width / 2 - 100 * UI_SCALE, height / 2 + 180 * UI_SCALE, 'BACK', {
      fontSize: `${20 * UI_SCALE}px`,
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
    .on('pointerdown', () => this.handleBack());
    this.container.add(this.backButton);

    // Exit to Menu button
    this.exitToMenuButton = this.scene.add.text(width / 2 + 100 * UI_SCALE, height / 2 + 180 * UI_SCALE, 'EXIT TO MENU', {
      fontSize: `${16 * UI_SCALE}px`,
      color: '#ffffff',
      fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
      backgroundColor: '#cc6600',
      padding: { x: 20 * UI_SCALE, y: 12 * UI_SCALE },
      stroke: '#000000',
      strokeThickness: 1,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => this.exitToMenuButton?.setStyle({ backgroundColor: '#dd7711' }))
    .on('pointerout', () => this.exitToMenuButton?.setStyle({ backgroundColor: '#cc6600' }))
    .on('pointerdown', () => this.handleExitToMenu());
    this.container.add(this.exitToMenuButton);
  }

  private handleMusicVolumeChange(volume: number): void {
    settingsManager.set('audio.musicVolume', volume);
    
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log(`SettingsOverlayUI: Music volume changed to ${Math.round(volume * 100)}%`);
  }

  private handleSoundVolumeChange(volume: number): void {
    settingsManager.set('audio.soundVolume', volume);
    
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setVolume(volume);
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log(`SettingsOverlayUI: Sound effects volume changed to ${Math.round(volume * 100)}%`);
  }

  private handleMusicToggle(enabled: boolean): void {
    settingsManager.set('audio.musicEnabled', enabled);
    
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }
    
    Logger.log(`SettingsOverlayUI: Music ${enabled ? 'enabled' : 'disabled'}`);
  }

  private handleSoundToggle(enabled: boolean): void {
    settingsManager.set('audio.soundEnabled', enabled);
    
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setEnabled(enabled);
      
      if (enabled) {
        this.soundEffectLibrary.playMenuNavigate();
      }
    }
    
    Logger.log(`SettingsOverlayUI: Sound effects ${enabled ? 'enabled' : 'disabled'}`);
  }

  private handleMasterMuteToggle(muted: boolean): void {
    settingsManager.set('audio.masterMute', muted);
    
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setEnabled(!muted && settingsManager.get<boolean>('audio.soundEnabled'));
    }
    
    Logger.log(`SettingsOverlayUI: Master mute ${muted ? 'enabled' : 'disabled'}`);
  }

  private handleSettingsReset(): void {
    // Reset audio settings to defaults using Settings Manager
    settingsManager.resetToDefaults([
      'audio.musicVolume',
      'audio.soundVolume', 
      'audio.musicEnabled',
      'audio.soundEnabled',
      'audio.masterMute'
    ]);
    
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setVolume(0.8);
      this.soundEffectLibrary.setEnabled(true);
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log('SettingsOverlayUI: Audio settings reset to defaults');
  }

  private handleBack(): void {
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }
    
    this.callbacks.onClose();
    Logger.log('SettingsOverlayUI: Back button pressed');
  }

  private handleExitToMenu(): void {
    this.showExitConfirmation();
  }

  private showExitConfirmation(): void {
    const { width, height } = this.scene.scale;
    const UI_SCALE = 2;

    // Create confirmation dialog container
    this.confirmationDialog = this.scene.add.container(0, 0);
    this.confirmationDialog.setDepth(1100); // Above the settings overlay

    // Background overlay
    const confirmBg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.5);
    confirmBg.setOrigin(0, 0);
    confirmBg.setInteractive();
    this.confirmationDialog.add(confirmBg);

    // Confirmation panel
    const panelWidth = 400 * UI_SCALE;
    const panelHeight = 250 * UI_SCALE;
    const confirmPanel = this.scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x1a1a2e);
    confirmPanel.setStrokeStyle(4, 0x00ff88);
    this.confirmationDialog.add(confirmPanel);

    // Confirmation text
    const confirmText = this.scene.add.text(width / 2, height / 2 - 40 * UI_SCALE, 'Exit to Menu?\n\nYour current game\nwill be lost.', {
      fontSize: `${18 * UI_SCALE}px`,
      color: '#ffffff',
      fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
      align: 'center',
      lineSpacing: 8 * UI_SCALE,
    }).setOrigin(0.5);
    this.confirmationDialog.add(confirmText);

    // Yes button
    const yesButton = this.scene.add.text(width / 2 - 80 * UI_SCALE, height / 2 + 60 * UI_SCALE, 'YES', {
      fontSize: `${16 * UI_SCALE}px`,
      color: '#ffffff',
      fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
      backgroundColor: '#ff3366',
      padding: { x: 25 * UI_SCALE, y: 12 * UI_SCALE },
      stroke: '#000000',
      strokeThickness: 1,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => yesButton.setStyle({ backgroundColor: '#ff5588' }))
    .on('pointerout', () => yesButton.setStyle({ backgroundColor: '#ff3366' }))
    .on('pointerdown', () => this.confirmExitToMenu());
    this.confirmationDialog.add(yesButton);

    // Cancel button
    const cancelButton = this.scene.add.text(width / 2 + 80 * UI_SCALE, height / 2 + 60 * UI_SCALE, 'CANCEL', {
      fontSize: `${16 * UI_SCALE}px`,
      color: '#ffffff',
      fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
      backgroundColor: '#666666',
      padding: { x: 20 * UI_SCALE, y: 12 * UI_SCALE },
      stroke: '#000000',
      strokeThickness: 1,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => cancelButton.setStyle({ backgroundColor: '#888888' }))
    .on('pointerout', () => cancelButton.setStyle({ backgroundColor: '#666666' }))
    .on('pointerdown', () => this.hideExitConfirmation());
    this.confirmationDialog.add(cancelButton);

    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }

    Logger.log('SettingsOverlayUI: Exit confirmation dialog shown');
  }

  private hideExitConfirmation(): void {
    if (this.confirmationDialog) {
      this.confirmationDialog.destroy();
      this.confirmationDialog = null;
    }

    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }

    Logger.log('SettingsOverlayUI: Exit confirmation dialog hidden');
  }

  private confirmExitToMenu(): void {
    this.hideExitConfirmation();

    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }

    this.callbacks.onExitToMenu();
    Logger.log('SettingsOverlayUI: Confirmed exit to menu');
  }

  /**
   * Setup Settings Manager subscriptions for external changes
   * Requirements: 2.5, 8.1, 8.2, 8.3, 8.4
   */
  private setupSettingsSubscriptions(): void {
    // Subscribe to audio setting changes to keep UI in sync
    const audioKeys = [
      'audio.musicVolume',
      'audio.soundVolume', 
      'audio.musicEnabled',
      'audio.soundEnabled',
      'audio.masterMute'
    ];

    const handleSettingsChange: SettingsChangeCallback = (event) => {
      if (!this.audioControlsUI) return;

      // Update AudioControlsUI to reflect external changes
      const currentConfig = this.audioControlsUI.getConfig();
      const updatedConfig = { ...currentConfig };

      switch (event.key) {
        case 'audio.musicVolume':
          updatedConfig.musicVolume = event.newValue;
          break;
        case 'audio.soundVolume':
          updatedConfig.soundVolume = event.newValue;
          if (this.soundEffectLibrary) {
            this.soundEffectLibrary.setVolume(event.newValue);
          }
          break;
        case 'audio.musicEnabled':
          updatedConfig.musicEnabled = event.newValue;
          break;
        case 'audio.soundEnabled':
          updatedConfig.soundEnabled = event.newValue;
          if (this.soundEffectLibrary) {
            const masterMute = settingsManager.get<boolean>('audio.masterMute');
            this.soundEffectLibrary.setEnabled(event.newValue && !masterMute);
          }
          break;
        case 'audio.masterMute':
          updatedConfig.masterMute = event.newValue;
          if (this.soundEffectLibrary) {
            const soundEnabled = settingsManager.get<boolean>('audio.soundEnabled');
            this.soundEffectLibrary.setEnabled(soundEnabled && !event.newValue);
          }
          break;
      }

      // Update the AudioControlsUI with new configuration
      this.audioControlsUI.updateConfig(updatedConfig);
      
      Logger.log(`SettingsOverlayUI: Updated UI for external settings change: ${event.key} = ${event.newValue}`);
    };

    // Subscribe to all audio-related settings
    const unsubscribe = settingsManager.subscribeToKeys(audioKeys, handleSettingsChange);
    this.settingsSubscriptions.push(unsubscribe);

    Logger.log('SettingsOverlayUI: Settings Manager subscriptions established');
  }

  public destroy(): void {
    try {
      // Clean up Settings Manager subscriptions first
      this.settingsSubscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          Logger.log(`SettingsOverlayUI: Error unsubscribing from settings - ${error}`);
        }
      });
      this.settingsSubscriptions = [];

      if (this.confirmationDialog) {
        this.confirmationDialog.destroy();
        this.confirmationDialog = null;
      }

      if (this.audioControlsUI) {
        this.audioControlsUI.destroy();
        this.audioControlsUI = null;
      }

      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.destroy();
        this.soundEffectLibrary = null;
      }

      if (this.container) {
        this.container.destroy();
      }

      Logger.log('SettingsOverlayUI: Destroyed successfully with proper cleanup');
    } catch (error) {
      Logger.log(`SettingsOverlayUI: Error during destroy - ${error}`);
    }
  }
}
