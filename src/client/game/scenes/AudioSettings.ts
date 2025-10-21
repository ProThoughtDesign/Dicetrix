import { Scene, GameObjects } from 'phaser';
import { AudioManager } from '../audio/AudioManager.js';

export interface AudioSettingsData {
  audioManager: AudioManager;
  onClose: () => void;
}

/**
 * AudioSettings Scene - Modal overlay for audio configuration
 * Launched as a separate scene to ensure proper focus management
 */
export class AudioSettings extends Scene {
  private sceneData: AudioSettingsData;
  
  // UI elements
  private container: GameObjects.Container | null = null;
  private background: GameObjects.Rectangle | null = null;
  private titleText: GameObjects.Text | null = null;
  private closeButton: GameObjects.Text | null = null;
  
  // Volume controls
  private masterVolumeSlider: VolumeSlider | null = null;
  private musicVolumeSlider: VolumeSlider | null = null;
  private sfxVolumeSlider: VolumeSlider | null = null;
  
  // Layout properties
  private panelWidth: number = 500;
  private panelHeight: number = 400;

  constructor() {
    super('AudioSettings');
  }

  public override init(data: AudioSettingsData): void {
    this.sceneData = data;
    
    // Clear previous elements
    this.container = null;
    this.background = null;
    this.titleText = null;
    this.closeButton = null;
    this.masterVolumeSlider = null;
    this.musicVolumeSlider = null;
    this.sfxVolumeSlider = null;
  }

  public override create(): void {
    this.createUI();
    this.refreshLayout();
    
    // Handle resize and input
    this.scale.on('resize', () => this.refreshLayout());
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    
    // Animate in
    this.animateIn();
  }

  /**
   * Create the modal UI
   */
  private createUI(): void {
    const { width, height } = this.scale;
    
    // Create main container
    this.container = this.add.container(width / 2, height / 2);
    this.container.setDepth(1000);
    
    // Main background panel
    this.background = this.add.rectangle(0, 0, this.panelWidth, this.panelHeight, 0x1a1a2e, 0.95);
    this.background.setStrokeStyle(4, 0x00ff88);
    this.container.add(this.background);
    
    // Title
    this.titleText = this.add.text(0, -this.panelHeight / 2 + 50, 'AUDIO SETTINGS', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.container.add(this.titleText);
    
    // Close button
    this.closeButton = this.add.text(this.panelWidth / 2 - 30, -this.panelHeight / 2 + 30, '✕', {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      this.closeButton!.setStyle({ color: '#ff6666' });
    })
    .on('pointerout', () => {
      this.closeButton!.setStyle({ color: '#ff4444' });
    })
    .on('pointerdown', () => {
      this.close();
    });
    this.container.add(this.closeButton);
    
    // Create volume sliders
    this.createVolumeControls();
  }

  /**
   * Create volume control sliders
   */
  private createVolumeControls(): void {
    const startY = -80;
    const spacing = 80;
    
    // Master Volume
    this.masterVolumeSlider = new VolumeSlider(this, 0, startY, 'Master Volume', 
      this.sceneData.audioManager.getSettings().masterVolume,
      (value: number) => {
        this.sceneData.audioManager.updateSettings({ masterVolume: value });
      }
    );
    this.container!.add(this.masterVolumeSlider.getContainer());
    
    // Music Volume
    this.musicVolumeSlider = new VolumeSlider(this, 0, startY + spacing, 'Music Volume',
      this.sceneData.audioManager.getSettings().musicVolume,
      (value: number) => {
        this.sceneData.audioManager.updateSettings({ musicVolume: value });
      }
    );
    this.container!.add(this.musicVolumeSlider.getContainer());
    
    // SFX Volume
    this.sfxVolumeSlider = new VolumeSlider(this, 0, startY + spacing * 2, 'SFX Volume',
      this.sceneData.audioManager.getSettings().sfxVolume,
      (value: number) => {
        this.sceneData.audioManager.updateSettings({ sfxVolume: value });
      }
    );
    this.container!.add(this.sfxVolumeSlider.getContainer());
  }

  /**
   * Close the modal
   */
  private close(): void {
    this.animateOut(() => {
      this.sceneData.onClose();
    });
  }

  /**
   * Animate modal in
   */
  private animateIn(): void {
    if (!this.container) return;
    
    this.container.setScale(0.7);
    this.container.setAlpha(0);
    
    this.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Animate modal out
   */
  private animateOut(onComplete: () => void): void {
    if (!this.container) {
      onComplete();
      return;
    }
    
    this.tweens.add({
      targets: this.container,
      scale: 0.7,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: onComplete
    });
  }

  /**
   * Update layout for responsive design
   */
  private refreshLayout(): void {
    const { width, height } = this.scale;
    
    if (this.container) {
      this.container.setPosition(width / 2, height / 2);
      
      // Scale for smaller screens
      const scale = Math.min(1, Math.min(width / 600, height / 500));
      this.container.setScale(scale);
    }
  }

  /**
   * Clean up when scene shuts down
   */
  shutdown(): void {
    this.scale.off('resize');
    this.input.keyboard?.off('keydown-ESC');
  }
}

/**
 * Volume Slider Component
 */
class VolumeSlider {
  private scene: Scene;
  private container: GameObjects.Container;
  private label: GameObjects.Text;
  private track: GameObjects.Rectangle;
  private handle: GameObjects.Rectangle;
  private valueText: GameObjects.Text;
  private onChange: (value: number) => void;
  private value: number;
  private isDragging: boolean = false;

  constructor(scene: Scene, x: number, y: number, labelText: string, initialValue: number, onChange: (value: number) => void) {
    this.scene = scene;
    this.value = initialValue;
    this.onChange = onChange;
    
    // Create container
    this.container = scene.add.container(x, y);
    
    // Label
    this.label = scene.add.text(-180, 0, labelText, {
      fontFamily: 'Arial Black',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.container.add(this.label);
    
    // Track
    this.track = scene.add.rectangle(0, 0, 200, 8, 0x444444);
    this.track.setInteractive({ useHandCursor: true });
    this.container.add(this.track);
    
    // Handle
    this.handle = scene.add.rectangle(0, 0, 16, 24, 0x00ff88);
    this.handle.setInteractive({ useHandCursor: true, draggable: true });
    this.container.add(this.handle);
    
    // Value text
    this.valueText = scene.add.text(120, 0, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cccccc',
    }).setOrigin(0, 0.5);
    this.container.add(this.valueText);
    
    // Set initial position
    this.updateSlider();
    
    // Handle interactions
    this.setupInteractions();
  }

  private setupInteractions(): void {
    // Handle dragging
    this.handle.on('dragstart', () => {
      this.isDragging = true;
    });
    
    this.handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      this.updateValueFromPosition(dragX);
    });
    
    this.handle.on('dragend', () => {
      this.isDragging = false;
    });
    
    // Track clicking
    this.track.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) {
        const localX = pointer.x - (this.container.x + this.scene.cameras.main.scrollX);
        this.updateValueFromPosition(localX);
      }
    });
  }

  private updateValueFromPosition(x: number): void {
    const trackWidth = 200;
    const clampedX = Phaser.Math.Clamp(x, -trackWidth / 2, trackWidth / 2);
    this.value = (clampedX + trackWidth / 2) / trackWidth;
    this.updateSlider();
    this.onChange(this.value);
  }

  private updateSlider(): void {
    const trackWidth = 200;
    const handleX = (this.value * trackWidth) - (trackWidth / 2);
    this.handle.setX(handleX);
    this.valueText.setText(`${Math.round(this.value * 100)}%`);
  }

  public getContainer(): GameObjects.Container {
    return this.container;
  }
}
