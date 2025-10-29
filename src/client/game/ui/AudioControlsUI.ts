import * as Phaser from 'phaser';
import { BaseUI } from './BaseUI';
import Logger from '../../utils/Logger';

/**
 * Audio configuration interface for managing all audio settings
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export interface AudioControlsConfig {
  musicVolume: number;        // 0.0 to 1.0
  soundVolume: number;        // 0.0 to 1.0
  musicEnabled: boolean;
  soundEnabled: boolean;
  masterMute: boolean;
}

/**
 * Callback interface for audio control events
 */
export interface AudioControlsCallbacks {
  onMusicVolumeChange?: (volume: number) => void;
  onSoundVolumeChange?: (volume: number) => void;
  onMusicToggle?: (enabled: boolean) => void;
  onSoundToggle?: (enabled: boolean) => void;
  onMasterMuteToggle?: (muted: boolean) => void;
  onSettingsReset?: () => void;
}

/**
 * Volume slider component interface
 */
interface VolumeSlider {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  track: Phaser.GameObjects.Rectangle;
  handle: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  valueText: Phaser.GameObjects.Text;
  isDragging: boolean;
  value: number;
  onValueChange: (value: number) => void;
}

/**
 * Toggle switch component interface
 */
interface ToggleSwitch {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  handle: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * Advanced audio controls UI component with volume sliders, toggles, and settings persistence
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export class AudioControlsUI extends BaseUI {
  private config: AudioControlsConfig;
  private callbacks: AudioControlsCallbacks;
  
  // UI Components
  private titleText: Phaser.GameObjects.Text;
  private musicVolumeSlider: VolumeSlider;
  private soundVolumeSlider: VolumeSlider;
  private musicToggle: ToggleSwitch;
  private soundToggle: ToggleSwitch;
  private masterMuteToggle: ToggleSwitch;
  private resetButton: Phaser.GameObjects.Container;
  
  // Layout constants
  private readonly SLIDER_WIDTH = 200;
  private readonly SLIDER_HEIGHT = 20;
  private readonly TOGGLE_WIDTH = 60;
  private readonly TOGGLE_HEIGHT = 30;
  private readonly COMPONENT_SPACING = 40;
  private readonly SECTION_SPACING = 60;

  constructor(scene: Phaser.Scene, initialConfig?: Partial<AudioControlsConfig>, callbacks?: AudioControlsCallbacks) {
    super(scene);
    
    // Initialize configuration with defaults
    this.config = {
      musicVolume: 0.8,
      soundVolume: 0.8,
      musicEnabled: true,
      soundEnabled: true,
      masterMute: false,
      ...initialConfig
    };
    
    this.callbacks = callbacks || {};
    
    // Load saved settings
    this.loadSettings();
    
    this.createUIComponents();
    this.setupInputHandlers();
    this.updateLayout();
    
    Logger.log('AudioControlsUI: Initialized with responsive volume controls and toggles');
  }

  /**
   * Create all UI components for audio controls
   * Requirements: 3.1, 3.2
   */
  private createUIComponents(): void {
    // Title
    this.titleText = this.scene.add.text(0, 0, 'Audio Settings', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0);
    
    // Volume sliders
    this.musicVolumeSlider = this.createVolumeSlider(
      'Music Volume',
      this.config.musicVolume,
      (value) => this.handleMusicVolumeChange(value)
    );
    
    this.soundVolumeSlider = this.createVolumeSlider(
      'Sound Effects Volume',
      this.config.soundVolume,
      (value) => this.handleSoundVolumeChange(value)
    );
    
    // Toggle switches
    this.musicToggle = this.createToggleSwitch(
      'Music',
      this.config.musicEnabled,
      (enabled) => this.handleMusicToggle(enabled)
    );
    
    this.soundToggle = this.createToggleSwitch(
      'Sound Effects',
      this.config.soundEnabled,
      (enabled) => this.handleSoundToggle(enabled)
    );
    
    this.masterMuteToggle = this.createToggleSwitch(
      'Master Mute',
      this.config.masterMute,
      (muted) => this.handleMasterMuteToggle(muted)
    );
    
    // Reset button
    this.resetButton = this.createResetButton();
    
    // Add all components to container
    this.container.add([
      this.titleText,
      this.musicVolumeSlider.container,
      this.soundVolumeSlider.container,
      this.musicToggle.container,
      this.soundToggle.container,
      this.masterMuteToggle.container,
      this.resetButton
    ]);
  }

  /**
   * Create a responsive volume slider with real-time feedback
   * Requirements: 3.1, 3.3
   */
  private createVolumeSlider(labelText: string, initialValue: number, onValueChange: (value: number) => void): VolumeSlider {
    const container = this.scene.add.container(0, 0);
    
    // Label
    const label = this.scene.add.text(-this.SLIDER_WIDTH / 2, -30, labelText, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0, 0.5);
    
    // Value display
    const valueText = this.scene.add.text(this.SLIDER_WIDTH / 2, -30, `${Math.round(initialValue * 100)}%`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(1, 0.5);
    
    // Slider background
    const background = this.scene.add.rectangle(0, 0, this.SLIDER_WIDTH, this.SLIDER_HEIGHT, 0x1a1a2e, 1.0)
      .setStrokeStyle(2, 0x444444, 0.8);
    
    // Slider track (filled portion)
    const trackWidth = this.SLIDER_WIDTH * initialValue;
    const track = this.scene.add.rectangle(-this.SLIDER_WIDTH / 2 + trackWidth / 2, 0, trackWidth, this.SLIDER_HEIGHT - 4, 0x00ff88, 0.8)
      .setOrigin(0.5, 0.5);
    
    // Slider handle
    const handleX = -this.SLIDER_WIDTH / 2 + this.SLIDER_WIDTH * initialValue;
    const handle = this.scene.add.rectangle(handleX, 0, 16, this.SLIDER_HEIGHT + 8, 0x00ff88, 1.0)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });
    
    container.add([background, track, handle, label, valueText]);
    
    const slider: VolumeSlider = {
      container,
      background,
      track,
      handle,
      label,
      valueText,
      isDragging: false,
      value: initialValue,
      onValueChange
    };
    
    this.setupSliderInteraction(slider);
    
    return slider;
  }

  /**
   * Setup interactive behavior for volume sliders
   * Requirements: 3.1, 3.3
   */
  private setupSliderInteraction(slider: VolumeSlider): void {
    // Handle drag start
    slider.handle.on('pointerdown', () => {
      slider.isDragging = true;
      this.scene.input.setDraggable(slider.handle, true);
      
      // Visual feedback
      slider.handle.setStrokeStyle(2, 0xffffff, 1.0);
      slider.handle.setScale(1.1);
    });
    
    // Handle drag
    slider.handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      if (!slider.isDragging) return;
      
      // Constrain handle position
      const minX = -this.SLIDER_WIDTH / 2;
      const maxX = this.SLIDER_WIDTH / 2;
      const constrainedX = Phaser.Math.Clamp(dragX, minX, maxX);
      
      // Update handle position
      slider.handle.x = constrainedX;
      
      // Calculate new value
      const newValue = (constrainedX - minX) / this.SLIDER_WIDTH;
      slider.value = Phaser.Math.Clamp(newValue, 0, 1);
      
      // Update visual elements
      this.updateSliderVisuals(slider);
      
      // Trigger callback for real-time feedback
      slider.onValueChange(slider.value);
    });
    
    // Handle drag end
    slider.handle.on('pointerup', () => {
      slider.isDragging = false;
      this.scene.input.setDraggable(slider.handle, false);
      
      // Reset visual feedback
      slider.handle.setStrokeStyle(2, 0xffffff, 0.8);
      slider.handle.setScale(1.0);
    });
    
    // Handle click on slider background for quick adjustment
    slider.background.setInteractive().on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (slider.isDragging) return;
      
      // Calculate click position relative to slider
      const localX = pointer.x - slider.container.x - slider.background.x;
      const newValue = Phaser.Math.Clamp((localX + this.SLIDER_WIDTH / 2) / this.SLIDER_WIDTH, 0, 1);
      
      // Update slider
      this.setSliderValue(slider, newValue);
      slider.onValueChange(slider.value);
    });
  }

  /**
   * Update visual elements of a volume slider
   * Requirements: 3.1, 3.3
   */
  private updateSliderVisuals(slider: VolumeSlider): void {
    // Update track width and position
    const trackWidth = this.SLIDER_WIDTH * slider.value;
    slider.track.setSize(trackWidth, this.SLIDER_HEIGHT - 4);
    slider.track.x = -this.SLIDER_WIDTH / 2 + trackWidth / 2;
    
    // Update value text
    slider.valueText.setText(`${Math.round(slider.value * 100)}%`);
    
    // Update track color based on value
    const intensity = Math.max(0.3, slider.value);
    
    // Simple color interpolation from green to gold based on volume
    const t = slider.value;
    const r = Math.round(0 + (255 - 0) * t);
    const g = Math.round(255 + (215 - 255) * t);
    const b = Math.round(136 + (0 - 136) * t);
    
    const color = Phaser.Display.Color.GetColor(r, g, b);
    slider.track.setFillStyle(color, intensity);
  }

  /**
   * Set slider value programmatically
   * Requirements: 3.1, 3.3
   */
  private setSliderValue(slider: VolumeSlider, value: number): void {
    slider.value = Phaser.Math.Clamp(value, 0, 1);
    
    // Update handle position
    const handleX = -this.SLIDER_WIDTH / 2 + this.SLIDER_WIDTH * slider.value;
    slider.handle.x = handleX;
    
    // Update visuals
    this.updateSliderVisuals(slider);
  }

  /**
   * Create a toggle switch with visual feedback
   * Requirements: 3.2, 3.5
   */
  private createToggleSwitch(labelText: string, initialState: boolean, onToggle: (enabled: boolean) => void): ToggleSwitch {
    const container = this.scene.add.container(0, 0);
    
    // Label
    const label = this.scene.add.text(-this.TOGGLE_WIDTH / 2 - 10, 0, labelText, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(1, 0.5);
    
    // Switch background
    const background = this.scene.add.rectangle(0, 0, this.TOGGLE_WIDTH, this.TOGGLE_HEIGHT, 0x1a1a2e, 1.0)
      .setStrokeStyle(2, 0x444444, 0.8)
      .setInteractive({ useHandCursor: true });
    
    // Switch handle
    const handleX = initialState ? this.TOGGLE_WIDTH / 4 : -this.TOGGLE_WIDTH / 4;
    const handle = this.scene.add.rectangle(handleX, 0, this.TOGGLE_WIDTH / 2 - 4, this.TOGGLE_HEIGHT - 4, 0x00ff88, 1.0)
      .setStrokeStyle(1, 0xffffff, 0.8);
    
    container.add([label, background, handle]);
    
    const toggle: ToggleSwitch = {
      container,
      background,
      handle,
      label,
      isEnabled: initialState,
      onToggle
    };
    
    this.setupToggleInteraction(toggle);
    this.updateToggleVisuals(toggle);
    
    return toggle;
  }

  /**
   * Setup interactive behavior for toggle switches
   * Requirements: 3.2, 3.5
   */
  private setupToggleInteraction(toggle: ToggleSwitch): void {
    toggle.background.on('pointerdown', () => {
      toggle.isEnabled = !toggle.isEnabled;
      this.updateToggleVisuals(toggle);
      toggle.onToggle(toggle.isEnabled);
    });
    
    // Visual feedback on hover
    toggle.background.on('pointerover', () => {
      toggle.background.setStrokeStyle(2, 0x00ff88, 1.0);
    });
    
    toggle.background.on('pointerout', () => {
      toggle.background.setStrokeStyle(2, 0x444444, 0.8);
    });
  }

  /**
   * Update visual state of toggle switch
   * Requirements: 3.2, 3.5
   */
  private updateToggleVisuals(toggle: ToggleSwitch): void {
    // Animate handle position
    const targetX = toggle.isEnabled ? this.TOGGLE_WIDTH / 4 : -this.TOGGLE_WIDTH / 4;
    
    this.scene.tweens.add({
      targets: toggle.handle,
      x: targetX,
      duration: 200,
      ease: 'Power2'
    });
    
    // Update colors
    if (toggle.isEnabled) {
      toggle.handle.setFillStyle(0x00ff88, 1.0);
      toggle.background.setFillStyle(0x0d4d20, 1.0);
      toggle.label.setColor('#00ff88');
    } else {
      toggle.handle.setFillStyle(0x666666, 1.0);
      toggle.background.setFillStyle(0x1a1a2e, 1.0);
      toggle.label.setColor('#ffffff');
    }
  }

  /**
   * Set toggle state programmatically
   * Requirements: 3.2, 3.5
   */
  private setToggleState(toggle: ToggleSwitch, enabled: boolean): void {
    toggle.isEnabled = enabled;
    this.updateToggleVisuals(toggle);
  }

  /**
   * Create reset button with confirmation dialog
   * Requirements: 3.4
   */
  private createResetButton(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    
    const background = this.scene.add.rectangle(0, 0, 120, 40, 0x8b0000, 1.0)
      .setStrokeStyle(2, 0xff4444, 0.8)
      .setInteractive({ useHandCursor: true });
    
    const label = this.scene.add.text(0, 0, 'Reset to Defaults', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5, 0.5);
    
    container.add([background, label]);
    
    // Setup interaction
    background.on('pointerdown', () => {
      this.showResetConfirmation();
    });
    
    // Visual feedback
    background.on('pointerover', () => {
      background.setStrokeStyle(2, 0xff4444, 1.0);
      background.setFillStyle(0xa00000, 1.0);
    });
    
    background.on('pointerout', () => {
      background.setStrokeStyle(2, 0xff4444, 0.8);
      background.setFillStyle(0x8b0000, 1.0);
    });
    
    return container;
  }

  /**
   * Show confirmation dialog for reset functionality
   * Requirements: 3.4
   */
  private showResetConfirmation(): void {
    // Create modal overlay
    const overlay = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      this.scene.scale.width,
      this.scene.scale.height,
      0x000000,
      0.7
    ).setInteractive();
    
    // Create dialog box
    const dialogWidth = 300;
    const dialogHeight = 150;
    const dialog = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2);
    
    const dialogBg = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x1a1a2e, 1.0)
      .setStrokeStyle(2, 0x00ff88, 0.8);
    
    const titleText = this.scene.add.text(0, -40, 'Reset Audio Settings?', {
      fontFamily: 'Arial Black',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5, 0.5);
    
    const messageText = this.scene.add.text(0, -10, 'This will restore all audio settings\nto their default values.', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 1,
      align: 'center'
    }).setOrigin(0.5, 0.5);
    
    // Buttons
    const confirmButton = this.scene.add.rectangle(-60, 40, 100, 30, 0x8b0000, 1.0)
      .setStrokeStyle(2, 0xff4444, 0.8)
      .setInteractive({ useHandCursor: true });
    
    const confirmLabel = this.scene.add.text(-60, 40, 'Reset', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    const cancelButton = this.scene.add.rectangle(60, 40, 100, 30, 0x444444, 1.0)
      .setStrokeStyle(2, 0x888888, 0.8)
      .setInteractive({ useHandCursor: true });
    
    const cancelLabel = this.scene.add.text(60, 40, 'Cancel', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    dialog.add([dialogBg, titleText, messageText, confirmButton, confirmLabel, cancelButton, cancelLabel]);
    
    // Button interactions
    confirmButton.on('pointerdown', () => {
      this.resetToDefaults();
      overlay.destroy();
      dialog.destroy();
    });
    
    cancelButton.on('pointerdown', () => {
      overlay.destroy();
      dialog.destroy();
    });
    
    // Close on overlay click
    overlay.on('pointerdown', () => {
      overlay.destroy();
      dialog.destroy();
    });
  }

  /**
   * Handle music volume changes with immediate feedback
   * Requirements: 3.1, 3.3
   */
  private handleMusicVolumeChange(volume: number): void {
    this.config.musicVolume = volume;
    this.saveSettings();
    this.callbacks.onMusicVolumeChange?.(volume);
    
    Logger.log(`AudioControlsUI: Music volume changed to ${Math.round(volume * 100)}%`);
  }

  /**
   * Handle sound effects volume changes with immediate feedback
   * Requirements: 3.1, 3.3
   */
  private handleSoundVolumeChange(volume: number): void {
    this.config.soundVolume = volume;
    this.saveSettings();
    this.callbacks.onSoundVolumeChange?.(volume);
    
    Logger.log(`AudioControlsUI: Sound effects volume changed to ${Math.round(volume * 100)}%`);
  }

  /**
   * Handle music toggle changes
   * Requirements: 3.2, 3.5
   */
  private handleMusicToggle(enabled: boolean): void {
    this.config.musicEnabled = enabled;
    this.saveSettings();
    this.callbacks.onMusicToggle?.(enabled);
    
    Logger.log(`AudioControlsUI: Music ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Handle sound effects toggle changes
   * Requirements: 3.2, 3.5
   */
  private handleSoundToggle(enabled: boolean): void {
    this.config.soundEnabled = enabled;
    this.saveSettings();
    this.callbacks.onSoundToggle?.(enabled);
    
    Logger.log(`AudioControlsUI: Sound effects ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Handle master mute toggle that overrides all other settings
   * Requirements: 3.2, 3.5
   */
  private handleMasterMuteToggle(muted: boolean): void {
    this.config.masterMute = muted;
    this.saveSettings();
    this.callbacks.onMasterMuteToggle?.(muted);
    
    // Update visual feedback for other controls when muted
    this.updateMuteStateVisuals();
    
    Logger.log(`AudioControlsUI: Master mute ${muted ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update visual feedback when master mute is active
   * Requirements: 3.2, 3.5
   */
  private updateMuteStateVisuals(): void {
    const alpha = this.config.masterMute ? 0.5 : 1.0;
    
    // Dim other controls when master mute is active
    this.musicVolumeSlider.container.setAlpha(alpha);
    this.soundVolumeSlider.container.setAlpha(alpha);
    this.musicToggle.container.setAlpha(alpha);
    this.soundToggle.container.setAlpha(alpha);
  }

  /**
   * Reset all settings to default values
   * Requirements: 3.4
   */
  private resetToDefaults(): void {
    const defaultConfig: AudioControlsConfig = {
      musicVolume: 0.8,
      soundVolume: 0.8,
      musicEnabled: true,
      soundEnabled: true,
      masterMute: false
    };
    
    this.config = { ...defaultConfig };
    
    // Update all UI components
    this.setSliderValue(this.musicVolumeSlider, this.config.musicVolume);
    this.setSliderValue(this.soundVolumeSlider, this.config.soundVolume);
    this.setToggleState(this.musicToggle, this.config.musicEnabled);
    this.setToggleState(this.soundToggle, this.config.soundEnabled);
    this.setToggleState(this.masterMuteToggle, this.config.masterMute);
    
    // Update visual state
    this.updateMuteStateVisuals();
    
    // Save and notify
    this.saveSettings();
    this.callbacks.onSettingsReset?.();
    
    Logger.log('AudioControlsUI: Settings reset to defaults');
  }

  /**
   * Save settings to localStorage for persistence between sessions
   * Requirements: 3.4
   */
  saveSettings(): void {
    try {
      const settingsData = JSON.stringify(this.config);
      localStorage.setItem('dicetrix_audio_settings', settingsData);
      Logger.log('AudioControlsUI: Settings saved to localStorage');
    } catch (error) {
      Logger.log(`AudioControlsUI: Failed to save settings - ${error}`);
    }
  }

  /**
   * Load settings from localStorage with validation and default handling
   * Requirements: 3.4
   */
  loadSettings(): void {
    try {
      const settingsData = localStorage.getItem('dicetrix_audio_settings');
      if (settingsData) {
        const loadedConfig = JSON.parse(settingsData);
        
        // Validate loaded settings
        if (this.validateSettings(loadedConfig)) {
          this.config = { ...this.config, ...loadedConfig };
          Logger.log('AudioControlsUI: Settings loaded from localStorage');
        } else {
          Logger.log('AudioControlsUI: Invalid settings in localStorage, using defaults');
        }
      } else {
        Logger.log('AudioControlsUI: No saved settings found, using defaults');
      }
    } catch (error) {
      Logger.log(`AudioControlsUI: Failed to load settings - ${error}, using defaults`);
    }
  }

  /**
   * Validate settings data to ensure it meets requirements
   * Requirements: 3.4
   */
  private validateSettings(settings: any): boolean {
    if (!settings || typeof settings !== 'object') {
      return false;
    }
    
    // Check required properties and types
    const requiredProps = [
      { key: 'musicVolume', type: 'number', min: 0, max: 1 },
      { key: 'soundVolume', type: 'number', min: 0, max: 1 },
      { key: 'musicEnabled', type: 'boolean' },
      { key: 'soundEnabled', type: 'boolean' },
      { key: 'masterMute', type: 'boolean' }
    ];
    
    for (const prop of requiredProps) {
      if (!(prop.key in settings)) {
        return false;
      }
      
      const value = settings[prop.key];
      
      if (typeof value !== prop.type) {
        return false;
      }
      
      // Validate numeric ranges
      if (prop.type === 'number' && (prop.min !== undefined || prop.max !== undefined)) {
        if (prop.min !== undefined && value < prop.min) return false;
        if (prop.max !== undefined && value > prop.max) return false;
      }
    }
    
    return true;
  }

  /**
   * Update layout for responsive design
   * Requirements: 3.1, 3.2
   */
  protected updateLayout(): void {
    const { screenWidth, screenHeight, isMobile } = this.layout;
    
    // Center the controls on screen
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    
    this.container.setPosition(centerX, centerY);
    
    // Adjust component sizes for mobile
    const scaleFactor = isMobile ? 0.8 : 1.0;
    const componentSpacing = this.COMPONENT_SPACING * scaleFactor;
    const sectionSpacing = this.SECTION_SPACING * scaleFactor;
    
    let currentY = -150; // Start above center
    
    // Title
    this.titleText.setPosition(0, currentY);
    this.titleText.setFontSize(isMobile ? '20px' : '24px');
    currentY += sectionSpacing;
    
    // Volume sliders section
    this.musicVolumeSlider.container.setPosition(0, currentY);
    this.musicVolumeSlider.container.setScale(scaleFactor);
    currentY += componentSpacing;
    
    this.soundVolumeSlider.container.setPosition(0, currentY);
    this.soundVolumeSlider.container.setScale(scaleFactor);
    currentY += sectionSpacing;
    
    // Toggle switches section
    const toggleSpacing = componentSpacing * 0.8;
    
    this.musicToggle.container.setPosition(0, currentY);
    this.musicToggle.container.setScale(scaleFactor);
    currentY += toggleSpacing;
    
    this.soundToggle.container.setPosition(0, currentY);
    this.soundToggle.container.setScale(scaleFactor);
    currentY += toggleSpacing;
    
    this.masterMuteToggle.container.setPosition(0, currentY);
    this.masterMuteToggle.container.setScale(scaleFactor);
    currentY += sectionSpacing;
    
    // Reset button
    this.resetButton.setPosition(0, currentY);
    this.resetButton.setScale(scaleFactor);
    
    Logger.log(`AudioControlsUI: Layout updated for ${isMobile ? 'mobile' : 'desktop'} (${screenWidth}x${screenHeight})`);
  }

  /**
   * Setup input handlers (required by BaseUI)
   */
  public setupInputHandlers(): void {
    // Input handling is managed by individual component interactions
    // No additional global input handlers needed for this UI
  }

  /**
   * Get current audio configuration
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  getConfig(): AudioControlsConfig {
    return { ...this.config };
  }

  /**
   * Update configuration programmatically
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  updateConfig(newConfig: Partial<AudioControlsConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    // Update UI components if values changed
    if (newConfig.musicVolume !== undefined && newConfig.musicVolume !== oldConfig.musicVolume) {
      this.setSliderValue(this.musicVolumeSlider, this.config.musicVolume);
    }
    
    if (newConfig.soundVolume !== undefined && newConfig.soundVolume !== oldConfig.soundVolume) {
      this.setSliderValue(this.soundVolumeSlider, this.config.soundVolume);
    }
    
    if (newConfig.musicEnabled !== undefined && newConfig.musicEnabled !== oldConfig.musicEnabled) {
      this.setToggleState(this.musicToggle, this.config.musicEnabled);
    }
    
    if (newConfig.soundEnabled !== undefined && newConfig.soundEnabled !== oldConfig.soundEnabled) {
      this.setToggleState(this.soundToggle, this.config.soundEnabled);
    }
    
    if (newConfig.masterMute !== undefined && newConfig.masterMute !== oldConfig.masterMute) {
      this.setToggleState(this.masterMuteToggle, this.config.masterMute);
      this.updateMuteStateVisuals();
    }
    
    this.saveSettings();
    Logger.log('AudioControlsUI: Configuration updated programmatically');
  }

  /**
   * Set music volume with validation
   * Requirements: 3.1, 3.3
   */
  setMusicVolume(volume: number): void {
    const clampedVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.setSliderValue(this.musicVolumeSlider, clampedVolume);
    this.handleMusicVolumeChange(clampedVolume);
  }

  /**
   * Set sound effects volume with validation
   * Requirements: 3.1, 3.3
   */
  setSoundVolume(volume: number): void {
    const clampedVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.setSliderValue(this.soundVolumeSlider, clampedVolume);
    this.handleSoundVolumeChange(clampedVolume);
  }

  /**
   * Set music enabled state
   * Requirements: 3.2, 3.5
   */
  setMusicEnabled(enabled: boolean): void {
    this.setToggleState(this.musicToggle, enabled);
    this.handleMusicToggle(enabled);
  }

  /**
   * Set sound effects enabled state
   * Requirements: 3.2, 3.5
   */
  setSoundEnabled(enabled: boolean): void {
    this.setToggleState(this.soundToggle, enabled);
    this.handleSoundToggle(enabled);
  }

  /**
   * Set master mute state
   * Requirements: 3.2, 3.5
   */
  setMasterMute(muted: boolean): void {
    this.setToggleState(this.masterMuteToggle, muted);
    this.handleMasterMuteToggle(muted);
  }

  /**
   * Get debug information about the audio controls
   */
  getDebugInfo(): string {
    const config = this.getConfig();
    return (
      `AudioControlsUI: Music ${Math.round(config.musicVolume * 100)}% ${config.musicEnabled ? 'ON' : 'OFF'} | ` +
      `Sound ${Math.round(config.soundVolume * 100)}% ${config.soundEnabled ? 'ON' : 'OFF'} | ` +
      `Master Mute: ${config.masterMute ? 'ON' : 'OFF'}`
    );
  }

  /**
   * Cleanup resources
   */
  public override destroy(): void {
    // Save settings before destroying
    this.saveSettings();
    
    // Clean up any remaining tweens
    this.scene.tweens.killTweensOf([
      this.musicToggle.handle,
      this.soundToggle.handle,
      this.masterMuteToggle.handle
    ]);
    
    super.destroy();
    Logger.log('AudioControlsUI: Destroyed');
  }
}
