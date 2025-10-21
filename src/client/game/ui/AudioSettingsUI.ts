import { Scene } from 'phaser';
import { AudioManager } from '../audio/AudioManager.js';

export class AudioSettingsUI {
  private scene: Scene;
  private audioManager: AudioManager;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private isVisible: boolean = false;

  // UI Elements
  private titleText: Phaser.GameObjects.Text;
  private masterVolumeSlider: VolumeSlider;
  private musicVolumeSlider: VolumeSlider;
  private sfxVolumeSlider: VolumeSlider;
  private musicToggle: ToggleButton;
  private sfxToggle: ToggleButton;
  private closeButton: Phaser.GameObjects.Text;

  constructor(scene: Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.createUI();
  }

  /**
   * Show the audio settings panel
   */
  show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
    this.updateUI();
    
    // Animate in
    this.container.setAlpha(0);
    this.container.setScale(0.8);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Hide the audio settings panel
   */
  hide(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.isVisible = false;
        this.container.setVisible(false);
      }
    });
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update layout for responsive design
   */
  updateLayout(width: number, height: number): void {
    this.container.setPosition(width / 2, height / 2);
  }

  /**
   * Create the UI elements
   */
  private createUI(): void {
    const { width, height } = this.scene.scale;
    
    // Create container
    this.container = this.scene.add.container(width / 2, height / 2);
    this.container.setVisible(false);

    // Create background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.8);
    this.background.fillRoundedRect(-200, -180, 400, 360, 20);
    this.background.lineStyle(3, 0x00ff88, 1);
    this.background.strokeRoundedRect(-200, -180, 400, 360, 20);
    this.container.add(this.background);

    // Title
    this.titleText = this.scene.add.text(0, -140, 'Audio Settings', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.container.add(this.titleText);

    // Get settings safely
    let settings;
    try {
      settings = this.audioManager.getSettings();
    } catch (error) {
      console.warn('Failed to get audio settings, using defaults:', error);
      settings = {
        masterVolume: 0.7,
        musicVolume: 0.8,
        sfxVolume: 0.9,
        musicEnabled: true,
        sfxEnabled: true
      };
    }

    // Master Volume Slider
    this.masterVolumeSlider = new VolumeSlider(
      this.scene,
      0, -80,
      'Master Volume',
      settings.masterVolume,
      (value) => this.onMasterVolumeChange(value)
    );
    this.container.add(this.masterVolumeSlider.getContainer());

    // Music Volume Slider
    this.musicVolumeSlider = new VolumeSlider(
      this.scene,
      0, -30,
      'Music Volume',
      settings.musicVolume,
      (value) => this.onMusicVolumeChange(value)
    );
    this.container.add(this.musicVolumeSlider.getContainer());

    // SFX Volume Slider
    this.sfxVolumeSlider = new VolumeSlider(
      this.scene,
      0, 20,
      'SFX Volume',
      settings.sfxVolume,
      (value) => this.onSFXVolumeChange(value)
    );
    this.container.add(this.sfxVolumeSlider.getContainer());

    // Music Toggle
    this.musicToggle = new ToggleButton(
      this.scene,
      -50, 80,
      'Music',
      settings.musicEnabled,
      (enabled) => this.onMusicToggle(enabled)
    );
    this.container.add(this.musicToggle.getContainer());

    // SFX Toggle
    this.sfxToggle = new ToggleButton(
      this.scene,
      50, 80,
      'SFX',
      settings.sfxEnabled,
      (enabled) => this.onSFXToggle(enabled)
    );
    this.container.add(this.sfxToggle.getContainer());

    // Close Button
    this.closeButton = this.scene.add.text(0, 130, 'Close', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 20, y: 10 } as Phaser.Types.GameObjects.Text.TextPadding
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => this.closeButton.setStyle({ backgroundColor: '#555555' }))
    .on('pointerout', () => this.closeButton.setStyle({ backgroundColor: '#444444' }))
    .on('pointerdown', () => this.hide());
    
    this.container.add(this.closeButton);
  }

  /**
   * Update UI to reflect current settings
   */
  private updateUI(): void {
    try {
      const settings = this.audioManager.getSettings();
      
      this.masterVolumeSlider.setValue(settings.masterVolume);
      this.musicVolumeSlider.setValue(settings.musicVolume);
      this.sfxVolumeSlider.setValue(settings.sfxVolume);
      this.musicToggle.setEnabled(settings.musicEnabled);
      this.sfxToggle.setEnabled(settings.sfxEnabled);
    } catch (error) {
      console.warn('Failed to update audio settings UI:', error);
    }
  }

  /**
   * Event handlers
   */
  private onMasterVolumeChange(value: number): void {
    try {
      this.audioManager.updateSettings({ masterVolume: value });
    } catch (error) {
      console.warn('Failed to update master volume:', error);
    }
  }

  private onMusicVolumeChange(value: number): void {
    try {
      this.audioManager.updateSettings({ musicVolume: value });
    } catch (error) {
      console.warn('Failed to update music volume:', error);
    }
  }

  private onSFXVolumeChange(value: number): void {
    try {
      this.audioManager.updateSettings({ sfxVolume: value });
    } catch (error) {
      console.warn('Failed to update SFX volume:', error);
    }
  }

  private onMusicToggle(enabled: boolean): void {
    try {
      this.audioManager.updateSettings({ musicEnabled: enabled });
    } catch (error) {
      console.warn('Failed to toggle music:', error);
    }
  }

  private onSFXToggle(enabled: boolean): void {
    try {
      this.audioManager.updateSettings({ sfxEnabled: enabled });
    } catch (error) {
      console.warn('Failed to toggle SFX:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.destroy();
  }
}

/**
 * Volume Slider Component
 */
class VolumeSlider {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private label: Phaser.GameObjects.Text;
  private track: Phaser.GameObjects.Graphics;
  private handle: Phaser.GameObjects.Graphics;
  private valueText: Phaser.GameObjects.Text;
  private value: number;
  private onChange: (value: number) => void;
  private isDragging: boolean = false;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    labelText: string,
    initialValue: number,
    onChange: (value: number) => void
  ) {
    this.scene = scene;
    this.value = initialValue;
    this.onChange = onChange;
    
    this.container = scene.add.container(x, y);
    this.createSlider(labelText);
    this.setupInteraction();
  }

  private createSlider(labelText: string): void {
    // Label
    this.label = this.scene.add.text(-120, 0, labelText, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.container.add(this.label);

    // Track
    this.track = this.scene.add.graphics();
    this.track.fillStyle(0x333333);
    this.track.fillRoundedRect(0, -3, 120, 6, 3);
    this.container.add(this.track);

    // Handle
    this.handle = this.scene.add.graphics();
    this.handle.fillStyle(0x00ff88);
    this.handle.fillCircle(0, 0, 8);
    this.handle.setPosition(this.value * 120, 0);
    this.container.add(this.handle);

    // Value text
    this.valueText = this.scene.add.text(130, 0, `${Math.round(this.value * 100)}%`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);
    this.container.add(this.valueText);
  }

  private setupInteraction(): void {
    this.handle.setInteractive({ useHandCursor: true });
    
    this.handle.on('pointerdown', () => {
      this.isDragging = true;
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const localX = pointer.x - this.container.x;
        const newValue = Phaser.Math.Clamp(localX / 120, 0, 1);
        this.setValue(newValue);
        this.onChange(newValue);
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  setValue(value: number): void {
    this.value = Phaser.Math.Clamp(value, 0, 1);
    this.handle.setPosition(this.value * 120, 0);
    this.valueText.setText(`${Math.round(this.value * 100)}%`);
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}

/**
 * Toggle Button Component
 */
class ToggleButton {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private enabled: boolean;
  private onChange: (enabled: boolean) => void;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    labelText: string,
    initialEnabled: boolean,
    onChange: (enabled: boolean) => void
  ) {
    this.scene = scene;
    this.enabled = initialEnabled;
    this.onChange = onChange;
    
    this.container = scene.add.container(x, y);
    this.createButton(labelText);
    this.setupInteraction();
    this.updateAppearance();
  }

  private createButton(labelText: string): void {
    // Background
    this.background = this.scene.add.graphics();
    this.container.add(this.background);

    // Label
    this.label = this.scene.add.text(0, 0, labelText, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(this.label);
  }

  private setupInteraction(): void {
    this.container.setSize(80, 30);
    this.container.setInteractive({ useHandCursor: true });
    
    this.container.on('pointerdown', () => {
      this.setEnabled(!this.enabled);
      this.onChange(this.enabled);
    });

    this.container.on('pointerover', () => {
      this.container.setScale(1.05);
    });

    this.container.on('pointerout', () => {
      this.container.setScale(1);
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.updateAppearance();
  }

  private updateAppearance(): void {
    this.background.clear();
    
    if (this.enabled) {
      this.background.fillStyle(0x00aa44);
      this.background.fillRoundedRect(-40, -15, 80, 30, 15);
      this.label.setColor('#ffffff');
    } else {
      this.background.fillStyle(0x444444);
      this.background.fillRoundedRect(-40, -15, 80, 30, 15);
      this.label.setColor('#888888');
    }
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}
