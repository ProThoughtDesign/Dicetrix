import * as Phaser from 'phaser';
import { BaseUI } from './BaseUI';
import { settingsManager } from '../../../shared/services/SettingsManager';
import { SettingsChangeCallback } from '../../../shared/types/settings';
import { SoundEffectLibrary } from '../services/SoundEffectLibrary';
import Logger from '../../utils/Logger';

/**
 * Compact audio control configuration for pause menu
 * Requirements: 3.3, 3.4
 * Note: This interface is maintained for backward compatibility but values are now sourced from Settings Manager
 */
export interface CompactAudioConfig {
  musicVolume: number;
  soundVolume: number;
  musicEnabled: boolean;
  soundEnabled: boolean;
}

/**
 * Callback interface for pause menu actions
 */
export interface PauseMenuCallbacks {
  onResume?: () => void;
  onSettings?: () => void;
  onMainMenu?: () => void;
  onRestart?: () => void;
}

/**
 * Compact volume slider for limited space
 */
interface CompactSlider {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  track: Phaser.GameObjects.Rectangle;
  handle: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  isDragging: boolean;
  value: number;
  onValueChange: (value: number) => void;
}

/**
 * Compact toggle switch for limited space
 */
interface CompactToggle {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  handle: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * Compact pause menu with quick audio controls for in-game adjustments
 * Requirements: 3.3, 3.4
 */
export class PauseMenuUI extends BaseUI {
  private callbacks: PauseMenuCallbacks;
  private soundEffectLibrary: SoundEffectLibrary | null = null;
  
  // Settings Manager subscriptions for cleanup
  private settingsSubscriptions: (() => void)[] = [];
  
  // UI Components
  private overlay: Phaser.GameObjects.Rectangle;
  private menuContainer: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;
  
  // Compact audio controls
  private musicVolumeSlider: CompactSlider;
  private soundVolumeSlider: CompactSlider;
  private musicToggle: CompactToggle;
  private soundToggle: CompactToggle;
  
  // Menu buttons
  private resumeButton: Phaser.GameObjects.Container;
  private settingsButton: Phaser.GameObjects.Container;
  private mainMenuButton: Phaser.GameObjects.Container;
  private restartButton: Phaser.GameObjects.Container;
  
  // Compact layout constants
  private readonly MENU_WIDTH = 320;
  private readonly MENU_HEIGHT = 400;
  private readonly SLIDER_WIDTH = 120;
  private readonly SLIDER_HEIGHT = 16;
  private readonly TOGGLE_WIDTH = 40;
  private readonly TOGGLE_HEIGHT = 20;
  private readonly BUTTON_WIDTH = 200;
  private readonly BUTTON_HEIGHT = 35;
  private readonly COMPONENT_SPACING = 25;

  constructor(scene: Phaser.Scene, callbacks?: PauseMenuCallbacks) {
    super(scene);
    
    this.callbacks = callbacks || {};
    
    // Initialize SoundEffectLibrary for immediate audio changes
    try {
      this.soundEffectLibrary = new SoundEffectLibrary(scene);
      Logger.log('PauseMenuUI: SoundEffectLibrary initialized for immediate audio feedback');
    } catch (error) {
      Logger.log(`PauseMenuUI: Failed to initialize SoundEffectLibrary - ${error}`);
      this.soundEffectLibrary = null;
    }
    
    this.createUIComponents();
    this.setupInputHandlers();
    this.setupSettingsSubscriptions();
    this.updateLayout();
    
    Logger.log('PauseMenuUI: Compact pause menu with audio controls initialized');
  }

  /**
   * Create all UI components for the compact pause menu
   * Requirements: 3.3, 3.4
   */
  private createUIComponents(): void {
    // Semi-transparent overlay
    this.overlay = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setInteractive()
      .on('pointerdown', () => this.resumeGame()); // Click outside to resume
    
    // Main menu container
    this.menuContainer = this.scene.add.container(0, 0);
    
    // Menu background
    const menuBackground = this.scene.add.rectangle(0, 0, this.MENU_WIDTH, this.MENU_HEIGHT, 0x1a1a2e, 0.95)
      .setStrokeStyle(3, 0x00ff88, 0.8);
    
    // Title
    this.titleText = this.scene.add.text(0, -this.MENU_HEIGHT / 2 + 30, 'PAUSED', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5);
    
    // Compact audio controls section
    const audioSectionY = -this.MENU_HEIGHT / 2 + 80;
    
    const audioLabel = this.scene.add.text(0, audioSectionY, 'Quick Audio Controls', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5, 0.5);
    
    // Create compact audio controls using Settings Manager values
    this.musicVolumeSlider = this.createCompactSlider(
      'Music',
      settingsManager.get<number>('audio.musicVolume'),
      (value) => this.handleMusicVolumeChange(value)
    );
    
    this.soundVolumeSlider = this.createCompactSlider(
      'SFX',
      settingsManager.get<number>('audio.soundVolume'),
      (value) => this.handleSoundVolumeChange(value)
    );
    
    this.musicToggle = this.createCompactToggle(
      'Music',
      settingsManager.get<boolean>('audio.musicEnabled'),
      (enabled) => this.handleMusicToggle(enabled)
    );
    
    this.soundToggle = this.createCompactToggle(
      'SFX',
      settingsManager.get<boolean>('audio.soundEnabled'),
      (enabled) => this.handleSoundToggle(enabled)
    );
    
    // Create menu buttons
    this.resumeButton = this.createMenuButton('Resume Game', 0x00ff88, () => this.resumeGame());
    this.settingsButton = this.createMenuButton('Full Settings', 0x0066cc, () => this.openSettings());
    this.restartButton = this.createMenuButton('Restart Game', 0xcc6600, () => this.restartGame());
    this.mainMenuButton = this.createMenuButton('Main Menu', 0x8b0000, () => this.returnToMainMenu());
    
    // Add all components to menu container
    this.menuContainer.add([
      menuBackground,
      this.titleText,
      audioLabel,
      this.musicVolumeSlider.container,
      this.soundVolumeSlider.container,
      this.musicToggle.container,
      this.soundToggle.container,
      this.resumeButton,
      this.settingsButton,
      this.restartButton,
      this.mainMenuButton
    ]);
    
    // Add to main container
    this.container.add([this.overlay, this.menuContainer]);
  }

  /**
   * Create a compact volume slider for limited space
   * Requirements: 3.3, 3.4
   */
  private createCompactSlider(labelText: string, initialValue: number, onValueChange: (value: number) => void): CompactSlider {
    const container = this.scene.add.container(0, 0);
    
    // Label
    const label = this.scene.add.text(-this.SLIDER_WIDTH / 2 - 5, 0, labelText, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(1, 0.5);
    
    // Slider background
    const background = this.scene.add.rectangle(0, 0, this.SLIDER_WIDTH, this.SLIDER_HEIGHT, 0x333333, 1.0)
      .setStrokeStyle(1, 0x666666, 0.8)
      .setInteractive({ useHandCursor: true });
    
    // Slider track (filled portion)
    const trackWidth = this.SLIDER_WIDTH * initialValue;
    const track = this.scene.add.rectangle(-this.SLIDER_WIDTH / 2 + trackWidth / 2, 0, trackWidth, this.SLIDER_HEIGHT - 2, 0x00ff88, 0.8);
    
    // Slider handle
    const handleX = -this.SLIDER_WIDTH / 2 + this.SLIDER_WIDTH * initialValue;
    const handle = this.scene.add.rectangle(handleX, 0, 8, this.SLIDER_HEIGHT + 4, 0x00ff88, 1.0)
      .setStrokeStyle(1, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });
    
    container.add([label, background, track, handle]);
    
    const slider: CompactSlider = {
      container,
      background,
      track,
      handle,
      label,
      isDragging: false,
      value: initialValue,
      onValueChange
    };
    
    this.setupCompactSliderInteraction(slider);
    
    return slider;
  }

  /**
   * Setup interaction for compact volume sliders
   * Requirements: 3.3, 3.4
   */
  private setupCompactSliderInteraction(slider: CompactSlider): void {
    // Handle drag
    slider.handle.on('pointerdown', () => {
      slider.isDragging = true;
      this.scene.input.setDraggable(slider.handle, true);
    });
    
    slider.handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      if (!slider.isDragging) return;
      
      const minX = -this.SLIDER_WIDTH / 2;
      const maxX = this.SLIDER_WIDTH / 2;
      const constrainedX = Phaser.Math.Clamp(dragX, minX, maxX);
      
      slider.handle.x = constrainedX;
      
      const newValue = (constrainedX - minX) / this.SLIDER_WIDTH;
      slider.value = Phaser.Math.Clamp(newValue, 0, 1);
      
      this.updateCompactSliderVisuals(slider);
      slider.onValueChange(slider.value);
    });
    
    slider.handle.on('pointerup', () => {
      slider.isDragging = false;
      this.scene.input.setDraggable(slider.handle, false);
    });
    
    // Click on background for quick adjustment
    slider.background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (slider.isDragging) return;
      
      const localX = pointer.x - slider.container.x - slider.background.x;
      const newValue = Phaser.Math.Clamp((localX + this.SLIDER_WIDTH / 2) / this.SLIDER_WIDTH, 0, 1);
      
      this.setCompactSliderValue(slider, newValue);
      slider.onValueChange(slider.value);
    });
  }

  /**
   * Update visuals for compact slider
   * Requirements: 3.3, 3.4
   */
  private updateCompactSliderVisuals(slider: CompactSlider): void {
    const trackWidth = this.SLIDER_WIDTH * slider.value;
    slider.track.setSize(trackWidth, this.SLIDER_HEIGHT - 2);
    slider.track.x = -this.SLIDER_WIDTH / 2 + trackWidth / 2;
  }

  /**
   * Set compact slider value programmatically
   * Requirements: 3.3, 3.4
   */
  private setCompactSliderValue(slider: CompactSlider, value: number): void {
    slider.value = Phaser.Math.Clamp(value, 0, 1);
    
    const handleX = -this.SLIDER_WIDTH / 2 + this.SLIDER_WIDTH * slider.value;
    slider.handle.x = handleX;
    
    this.updateCompactSliderVisuals(slider);
  }

  /**
   * Create a compact toggle switch for limited space
   * Requirements: 3.3, 3.4
   */
  private createCompactToggle(labelText: string, initialState: boolean, onToggle: (enabled: boolean) => void): CompactToggle {
    const container = this.scene.add.container(0, 0);
    
    // Label
    const label = this.scene.add.text(-this.TOGGLE_WIDTH / 2 - 5, 0, labelText, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(1, 0.5);
    
    // Toggle background
    const background = this.scene.add.rectangle(0, 0, this.TOGGLE_WIDTH, this.TOGGLE_HEIGHT, 0x333333, 1.0)
      .setStrokeStyle(1, 0x666666, 0.8)
      .setInteractive({ useHandCursor: true });
    
    // Toggle handle
    const handleX = initialState ? this.TOGGLE_WIDTH / 4 : -this.TOGGLE_WIDTH / 4;
    const handle = this.scene.add.rectangle(handleX, 0, this.TOGGLE_WIDTH / 2 - 2, this.TOGGLE_HEIGHT - 2, 0x00ff88, 1.0);
    
    container.add([label, background, handle]);
    
    const toggle: CompactToggle = {
      container,
      background,
      handle,
      label,
      isEnabled: initialState,
      onToggle
    };
    
    this.setupCompactToggleInteraction(toggle);
    this.updateCompactToggleVisuals(toggle);
    
    return toggle;
  }

  /**
   * Setup interaction for compact toggle switches
   * Requirements: 3.3, 3.4
   */
  private setupCompactToggleInteraction(toggle: CompactToggle): void {
    toggle.background.on('pointerdown', () => {
      toggle.isEnabled = !toggle.isEnabled;
      this.updateCompactToggleVisuals(toggle);
      toggle.onToggle(toggle.isEnabled);
    });
  }

  /**
   * Update visuals for compact toggle
   * Requirements: 3.3, 3.4
   */
  private updateCompactToggleVisuals(toggle: CompactToggle): void {
    const targetX = toggle.isEnabled ? this.TOGGLE_WIDTH / 4 : -this.TOGGLE_WIDTH / 4;
    
    this.scene.tweens.add({
      targets: toggle.handle,
      x: targetX,
      duration: 150,
      ease: 'Power2'
    });
    
    if (toggle.isEnabled) {
      toggle.handle.setFillStyle(0x00ff88, 1.0);
      toggle.background.setFillStyle(0x0d4d20, 1.0);
    } else {
      toggle.handle.setFillStyle(0x666666, 1.0);
      toggle.background.setFillStyle(0x333333, 1.0);
    }
  }

  /**
   * Create a menu button with consistent styling
   */
  private createMenuButton(text: string, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    
    const background = this.scene.add.rectangle(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT, color, 1.0)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });
    
    const label = this.scene.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5, 0.5);
    
    container.add([background, label]);
    
    // Setup interaction
    background.on('pointerdown', onClick);
    
    background.on('pointerover', () => {
      background.setStrokeStyle(2, 0xffffff, 1.0);
      container.setScale(1.05);
    });
    
    background.on('pointerout', () => {
      background.setStrokeStyle(2, 0xffffff, 0.8);
      container.setScale(1.0);
    });
    
    return container;
  }

  /**
   * Handle music volume changes with immediate feedback
   * Requirements: 2.1, 2.2, 3.3, 3.4
   */
  private handleMusicVolumeChange(volume: number): void {
    settingsManager.set('audio.musicVolume', volume);
    
    // Immediate audio feedback
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log(`PauseMenuUI: Music volume changed to ${Math.round(volume * 100)}%`);
  }

  /**
   * Handle sound effects volume changes with immediate feedback
   * Requirements: 2.1, 2.2, 3.3, 3.4
   */
  private handleSoundVolumeChange(volume: number): void {
    settingsManager.set('audio.soundVolume', volume);
    
    // Update SoundEffectLibrary volume and provide immediate feedback
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setVolume(volume);
      this.soundEffectLibrary.playSettingsChange();
    }
    
    Logger.log(`PauseMenuUI: Sound volume changed to ${Math.round(volume * 100)}%`);
  }

  /**
   * Handle music toggle changes with immediate feedback
   * Requirements: 2.1, 2.2, 3.3, 3.4
   */
  private handleMusicToggle(enabled: boolean): void {
    settingsManager.set('audio.musicEnabled', enabled);
    
    // Immediate audio feedback
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.playMenuNavigate();
    }
    
    Logger.log(`PauseMenuUI: Music ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Handle sound effects toggle changes with immediate feedback
   * Requirements: 2.1, 2.2, 3.3, 3.4
   */
  private handleSoundToggle(enabled: boolean): void {
    settingsManager.set('audio.soundEnabled', enabled);
    
    // Update SoundEffectLibrary state and provide immediate feedback
    if (this.soundEffectLibrary) {
      this.soundEffectLibrary.setEnabled(enabled);
      if (enabled) {
        this.soundEffectLibrary.playMenuNavigate();
      }
    }
    
    Logger.log(`PauseMenuUI: Sound effects ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Resume the game and close pause menu
   * Requirements: 3.3, 3.4
   */
  private resumeGame(): void {
    try {
      // Play resume sound
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playResume();
      }
      
      // Trigger callback
      this.callbacks.onResume?.();
      
      Logger.log('PauseMenuUI: Game resumed');
    } catch (error) {
      Logger.log(`PauseMenuUI: Error resuming game - ${error}`);
    }
  }

  /**
   * Open full settings menu
   * Requirements: 3.3, 3.4
   */
  private openSettings(): void {
    try {
      // Play menu navigation sound
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playMenuNavigate();
      }
      
      // Trigger callback
      this.callbacks.onSettings?.();
      
      Logger.log('PauseMenuUI: Opening full settings');
    } catch (error) {
      Logger.log(`PauseMenuUI: Error opening settings - ${error}`);
    }
  }

  /**
   * Restart the current game
   * Requirements: 3.3, 3.4
   */
  private restartGame(): void {
    try {
      // Play menu navigation sound
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playMenuNavigate();
      }
      
      // Trigger callback
      this.callbacks.onRestart?.();
      
      Logger.log('PauseMenuUI: Restarting game');
    } catch (error) {
      Logger.log(`PauseMenuUI: Error restarting game - ${error}`);
    }
  }

  /**
   * Return to main menu
   * Requirements: 3.3, 3.4
   */
  private returnToMainMenu(): void {
    try {
      // Play menu navigation sound
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.playMenuNavigate();
      }
      
      // Trigger callback
      this.callbacks.onMainMenu?.();
      
      Logger.log('PauseMenuUI: Returning to main menu');
    } catch (error) {
      Logger.log(`PauseMenuUI: Error returning to main menu - ${error}`);
    }
  }

  /**
   * Update layout for responsive design
   * Requirements: 3.3, 3.4
   */
  protected updateLayout(): void {
    const { screenWidth, screenHeight } = this.layout;
    
    // Center the pause menu on screen
    this.container.setPosition(0, 0);
    this.menuContainer.setPosition(screenWidth / 2, screenHeight / 2);
    
    // Position compact audio controls
    let currentY = -this.MENU_HEIGHT / 2 + 120;
    
    this.musicVolumeSlider.container.setPosition(-60, currentY);
    this.soundVolumeSlider.container.setPosition(60, currentY);
    currentY += this.COMPONENT_SPACING;
    
    this.musicToggle.container.setPosition(-60, currentY);
    this.soundToggle.container.setPosition(60, currentY);
    currentY += this.COMPONENT_SPACING + 10;
    
    // Position menu buttons
    this.resumeButton.setPosition(0, currentY);
    currentY += this.COMPONENT_SPACING;
    
    this.settingsButton.setPosition(0, currentY);
    currentY += this.COMPONENT_SPACING;
    
    this.restartButton.setPosition(0, currentY);
    currentY += this.COMPONENT_SPACING;
    
    this.mainMenuButton.setPosition(0, currentY);
    
    Logger.log(`PauseMenuUI: Layout updated for ${screenWidth}x${screenHeight}`);
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
      'audio.soundEnabled'
    ];

    const handleSettingsChange: SettingsChangeCallback = (event) => {
      // Update visual indicators to reflect external changes
      switch (event.key) {
        case 'audio.musicVolume':
          this.setCompactSliderValue(this.musicVolumeSlider, event.newValue);
          break;
        case 'audio.soundVolume':
          this.setCompactSliderValue(this.soundVolumeSlider, event.newValue);
          if (this.soundEffectLibrary) {
            this.soundEffectLibrary.setVolume(event.newValue);
          }
          break;
        case 'audio.musicEnabled':
          this.musicToggle.isEnabled = event.newValue;
          this.updateCompactToggleVisuals(this.musicToggle);
          break;
        case 'audio.soundEnabled':
          this.soundToggle.isEnabled = event.newValue;
          this.updateCompactToggleVisuals(this.soundToggle);
          if (this.soundEffectLibrary) {
            this.soundEffectLibrary.setEnabled(event.newValue);
          }
          break;
      }
      
      Logger.log(`PauseMenuUI: Updated UI for external settings change: ${event.key} = ${event.newValue}`);
    };

    // Subscribe to all audio-related settings
    const unsubscribe = settingsManager.subscribeToKeys(audioKeys, handleSettingsChange);
    this.settingsSubscriptions.push(unsubscribe);

    Logger.log('PauseMenuUI: Settings Manager subscriptions established');
  }

  /**
   * Setup input handlers
   */
  public setupInputHandlers(): void {
    // ESC key to resume game
    this.scene.input.keyboard?.on('keydown-ESC', () => {
      this.resumeGame();
    });
  }

  /**
   * Get current audio configuration from Settings Manager
   * Requirements: 8.1, 8.2, 8.3, 8.4
   */
  getConfig(): CompactAudioConfig {
    return {
      musicVolume: settingsManager.get<number>('audio.musicVolume'),
      soundVolume: settingsManager.get<number>('audio.soundVolume'),
      musicEnabled: settingsManager.get<boolean>('audio.musicEnabled'),
      soundEnabled: settingsManager.get<boolean>('audio.soundEnabled')
    };
  }

  /**
   * Cleanup resources
   */
  public override destroy(): void {
    try {
      // Clean up Settings Manager subscriptions first
      this.settingsSubscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          Logger.log(`PauseMenuUI: Error unsubscribing from settings - ${error}`);
        }
      });
      this.settingsSubscriptions = [];

      // Clean up sound effect library
      if (this.soundEffectLibrary) {
        this.soundEffectLibrary.destroy();
        this.soundEffectLibrary = null;
      }
      
      // Clean up tweens
      this.scene.tweens.killTweensOf([
        this.musicToggle.handle,
        this.soundToggle.handle
      ]);
      
      super.destroy();
      Logger.log('PauseMenuUI: Destroyed successfully with proper cleanup');
    } catch (error) {
      Logger.log(`PauseMenuUI: Error during destroy - ${error}`);
    }
  }
}
