import { Scene } from 'phaser';
import { settings } from '../services/Settings';
import { audioHandler } from '../services/AudioHandler';
import Logger from '../../utils/Logger';
import { AudioControlsUI, AudioControlsConfig, AudioControlsCallbacks } from '../ui/AudioControlsUI';
import { SoundEffectLibrary } from '../services/SoundEffectLibrary';

export class Settings extends Scene {
  private audioControlsUI: AudioControlsUI | null = null;
  private soundEffectLibrary: SoundEffectLibrary | null = null;
  private closeButton: Phaser.GameObjects.Text | null = null;
  private backButton: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('Settings');
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

    // Close button (X in top right)
    this.closeButton = this.add
      .text(width - 60 * UI_SCALE, 60 * UI_SCALE, '✕', {
        fontSize: `${32 * UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Arial',
        backgroundColor: '#ff3366',
        padding: { x: 15 * UI_SCALE, y: 10 * UI_SCALE },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.closeButton?.setStyle({ backgroundColor: '#ff5588' }))
      .on('pointerout', () => this.closeButton?.setStyle({ backgroundColor: '#ff3366' }))
      .on('pointerdown', () => this.closeSettings());

    // Initialize AudioControlsUI with current settings and callbacks
    // Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
    const initialConfig: Partial<AudioControlsConfig> = {
      musicVolume: settings.get('audioVolume') || 0.8,
      soundVolume: settings.get('audioVolume') || 0.8,
      musicEnabled: audioHandler.getMusicEnabled(),
      soundEnabled: audioHandler.getSoundEnabled(),
      masterMute: false
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

    // Position the audio controls in the center area
    const controlsContainer = this.audioControlsUI.getContainer();
    controlsContainer.setPosition(width / 2, height * 0.5);

    // Test Audio Buttons Section
    const testButtonsY = height * 0.8;
    
    // Test Music Button
    const testMusicButton = this.add
      .text(width * 0.3, testButtonsY, 'Test Music', {
        fontSize: `${20 * UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        backgroundColor: '#0066cc',
        padding: { x: 15 * UI_SCALE, y: 8 * UI_SCALE },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => testMusicButton.setStyle({ backgroundColor: '#0088ee' }))
      .on('pointerout', () => testMusicButton.setStyle({ backgroundColor: '#0066cc' }))
      .on('pointerdown', () => this.testMusic());

    // Test SFX Button
    const testSFXButton = this.add
      .text(width * 0.7, testButtonsY, 'Test SFX', {
        fontSize: `${20 * UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        backgroundColor: '#cc6600',
        padding: { x: 15 * UI_SCALE, y: 8 * UI_SCALE },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => testSFXButton.setStyle({ backgroundColor: '#ee8800' }))
      .on('pointerout', () => testSFXButton.setStyle({ backgroundColor: '#cc6600' }))
      .on('pointerdown', () => this.testSFX());

    // Back to Menu Button
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

    Logger.log('Settings: Scene created with enhanced AudioControlsUI');
  }

  /**
   * Handle music volume changes with immediate feedback and audio preview
   * Requirements: 3.1, 3.3
   */
  private handleMusicVolumeChange(volume: number): void {
    // Update audio handler
    audioHandler.setMusicVolume(volume);
    
    // Update settings persistence
    settings.set('audioVolume', volume);
    
    // Play settings change sound for immediate feedback
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log(`Settings: Music volume changed to ${Math.round(volume * 100)}%`);
  }

  /**
   * Handle sound effects volume changes with immediate feedback and audio preview
   * Requirements: 3.1, 3.3
   */
  private handleSoundVolumeChange(volume: number): void {
    // Update audio handler
    audioHandler.setSoundVolume(volume);
    
    // Update settings persistence
    settings.set('audioVolume', volume);
    
    // Update SoundEffectLibrary volume if available
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setVolume(volume);
      // Play settings change sound for immediate feedback
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log(`Settings: Sound effects volume changed to ${Math.round(volume * 100)}%`);
  }

  /**
   * Handle music toggle changes with audio feedback
   * Requirements: 3.2, 3.5
   */
  private handleMusicToggle(enabled: boolean): void {
    // Update audio handler
    audioHandler.setMusicEnabled(enabled);
    
    // Play menu select sound for feedback
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }
    
    Logger.log(`Settings: Music ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Handle sound effects toggle changes with audio feedback
   * Requirements: 3.2, 3.5
   */
  private handleSoundToggle(enabled: boolean): void {
    // Update audio handler
    audioHandler.setSoundEnabled(enabled);
    
    // Update SoundEffectLibrary state
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setEnabled(enabled);
      
      // Play menu select sound if SFX is being enabled
      if (enabled) {
        this.soundEffectLibrary.playMenuNavigate();
      }
    }
    
    Logger.log(`Settings: Sound effects ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Handle master mute toggle that overrides all other audio settings
   * Requirements: 3.2, 3.5
   */
  private handleMasterMuteToggle(muted: boolean): void {
    if (muted) {
      // Mute all audio
      audioHandler.setMusicEnabled(false);
      audioHandler.setSoundEnabled(false);
      
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.setEnabled(false);
      }
    } else {
      // Restore audio based on individual settings
      const config = this.audioControlsUI?.getConfig();
      if (config) {
        audioHandler.setMusicEnabled(config.musicEnabled);
        audioHandler.setSoundEnabled(config.soundEnabled);
        
        if (this.soundEffectLibrary) {
          this.soundEffectLibrary.setEnabled(config.soundEnabled);
        }
      }
    }
    
    Logger.log(`Settings: Master mute ${muted ? 'enabled' : 'disabled'}`);
  }

  /**
   * Handle settings reset with confirmation and audio feedback
   * Requirements: 3.4
   */
  private handleSettingsReset(): void {
    // Reset audio handler to defaults
    audioHandler.setMusicVolume(0.8);
    audioHandler.setSoundVolume(0.8);
    audioHandler.setMusicEnabled(true);
    audioHandler.setSoundEnabled(true);
    
    // Reset settings persistence
    settings.set('audioVolume', 0.8);
    
    // Reset SoundEffectLibrary
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setVolume(0.8);
      this.soundEffectLibrary.setEnabled(true);
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log('Settings: Audio settings reset to defaults');
  }

  /**
   * Test music playback with audio preview functionality
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  private testMusic(): void {
    try {
      // Stop current music and play menu theme as test
      audioHandler.stopMusic();
      audioHandler.playMusic('menu-theme', true);
      
      // Play button click sound
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playButtonClick();
      }
      
      Logger.log('Settings: Testing music playback with audio preview');
    } catch (error) {
      Logger.log(`Settings: Failed to test music - ${error}`);
    }
  }

  /**
   * Test sound effects playback with audio preview functionality
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  private testSFX(): void {
    try {
      // Play multiple test sound effects to demonstrate functionality
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playButtonClick();
        
        // Play additional test sounds with slight delays
        this.time.delayedCall(200, () => {
          if (this.soundEffectLibrary) {
            this.soundEffectLibrary.playMenuNavigate();
          }
        });
        
        this.time.delayedCall(400, () => {
          if (this.soundEffectLibrary) {
            this.soundEffectLibrary.playSettingsChange();
          }
        });
      } else {
        // Fallback to audioHandler
        audioHandler.playSound('menu-select');
      }
      
      Logger.log('Settings: Testing SFX playback with audio preview');
    } catch (error) {
      Logger.log(`Settings: Failed to test SFX - ${error}`);
    }
  }

  /**
   * Close settings and return to appropriate scene with proper cleanup
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  private closeSettings(): void {
    try {
      // Play menu back sound
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playMenuNavigate();
      } else {
        audioHandler.playSound('menu-back');
      }
      
      // Clean up audio controls UI
      if (this.audioControlsUI) {
        this.audioControlsUI.destroy();
        this.audioControlsUI = null;
      }
      
      // Clean up sound effect library
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.destroy();
        this.soundEffectLibrary = null;
      }
      
      // Check if we came from a paused game
      const pausedGameState = this.registry.get('pausedGameState');
      if (pausedGameState) {
        // Clear the paused state and return to game
        this.registry.remove('pausedGameState');
        this.scene.start('Game', { 
          gameMode: pausedGameState.gameMode,
          resumeFromPause: true 
        });
        Logger.log('Settings: Returning to paused game');
      } else {
        // Return to StartMenu
        this.scene.start('StartMenu');
        Logger.log('Settings: Returning to StartMenu with proper cleanup');
      }
    } catch (error) {
      Logger.log(`Settings: Error during close - ${error}`);
      // Fallback to direct scene transition
      this.scene.start('StartMenu');
    }
  }

  /**
   * Scene shutdown cleanup
   */
  shutdown(): void {
    // Clean up audio controls UI
    if (this.audioControlsUI) {
      this.audioControlsUI.destroy();
      this.audioControlsUI = null;
    }
    
    // Clean up sound effect library
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.destroy();
      this.soundEffectLibrary = null;
    }
    
    Logger.log('Settings: Scene shutdown cleanup completed');
  }
}
