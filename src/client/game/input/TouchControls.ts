import { Scene } from 'phaser';

/**
 * Touch control zones for mobile interface
 */
export interface TouchZone {
  x: number;
  y: number;
  width: number;
  height: number;
  action: string;
  label?: string;
}

/**
 * Touch controls configuration
 */
export interface TouchControlsConfig {
  showVisualControls: boolean;
  controlOpacity: number;
  controlSize: number;
  zones: TouchZone[];
}

/**
 * Default touch controls layout
 */
export const DEFAULT_TOUCH_CONTROLS: TouchControlsConfig = {
  showVisualControls: true,
  controlOpacity: 0.3,
  controlSize: 80,
  zones: [
    { x: 50, y: -150, width: 80, height: 80, action: 'rotate', label: '↻' },
    { x: -150, y: -80, width: 80, height: 80, action: 'move_left', label: '←' },
    { x: -50, y: -80, width: 80, height: 80, action: 'move_right', label: '→' },
    { x: -100, y: -150, width: 80, height: 80, action: 'move_down', label: '↓' },
    { x: 150, y: -150, width: 80, height: 80, action: 'hard_drop', label: '⬇' }
  ]
};

/**
 * TouchControls provides visual touch controls for mobile devices
 * Complements the gesture-based input system with explicit buttons
 */
export class TouchControls {
  private scene: Scene;
  private config: TouchControlsConfig;
  private controlButtons: Map<string, Phaser.GameObjects.Container> = new Map();
  private isVisible: boolean = false;
  
  // Callbacks
  private onActionCallback: ((action: string) => void) | null = null;

  constructor(scene: Scene, config: Partial<TouchControlsConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_TOUCH_CONTROLS, ...config };
    
    // Auto-detect if we should show controls based on device
    if (this.shouldShowControls()) {
      this.createControls();
      this.show();
    }
  }

  /**
   * Determine if touch controls should be shown
   */
  private shouldShowControls(): boolean {
    // Show on touch devices or when explicitly enabled
    return this.config.showVisualControls && (
      this.scene.sys.game.device.input.touch ||
      this.scene.sys.game.device.os.android ||
      this.scene.sys.game.device.os.iOS ||
      this.scene.sys.game.device.os.windowsPhone
    );
  }

  /**
   * Create visual touch control buttons
   */
  private createControls(): void {
    const { width, height } = this.scene.scale;
    
    this.config.zones.forEach(zone => {
      const container = this.scene.add.container(0, 0);
      
      // Calculate position relative to screen edges
      const x = zone.x > 0 ? zone.x : width + zone.x;
      const y = zone.y > 0 ? zone.y : height + zone.y;
      
      container.setPosition(x, y);
      
      // Create button background
      const background = this.scene.add.circle(0, 0, zone.width / 2, 0x333333, this.config.controlOpacity);
      const border = this.scene.add.circle(0, 0, zone.width / 2, 0x666666, 0).setStrokeStyle(2, 0x666666, this.config.controlOpacity);
      
      // Create button label
      const label = this.scene.add.text(0, 0, zone.label || zone.action, {
        fontFamily: 'Arial Black',
        fontSize: Math.floor(zone.width / 3),
        color: '#ffffff'
      }).setOrigin(0.5).setAlpha(this.config.controlOpacity);
      
      // Add elements to container
      container.add([background, border, label]);
      
      // Make interactive
      background.setInteractive({ useHandCursor: true });
      
      // Handle touch events
      background.on('pointerdown', () => {
        this.handleControlPress(zone.action);
        // Visual feedback
        background.setFillStyle(0x555555, this.config.controlOpacity * 1.5);
        label.setAlpha(this.config.controlOpacity * 1.5);
      });
      
      background.on('pointerup', () => {
        this.handleControlRelease(zone.action);
        // Reset visual state
        background.setFillStyle(0x333333, this.config.controlOpacity);
        label.setAlpha(this.config.controlOpacity);
      });
      
      background.on('pointerout', () => {
        this.handleControlRelease(zone.action);
        // Reset visual state
        background.setFillStyle(0x333333, this.config.controlOpacity);
        label.setAlpha(this.config.controlOpacity);
      });
      
      // Store reference
      this.controlButtons.set(zone.action, container);
    });
  }

  /**
   * Handle control button press
   */
  private handleControlPress(action: string): void {
    if (this.onActionCallback) {
      this.onActionCallback(action);
    }
  }

  /**
   * Handle control button release
   */
  private handleControlRelease(_action: string): void {
    // Could be used for actions that need press/release distinction
  }

  /**
   * Show touch controls
   */
  public show(): void {
    if (this.isVisible) return;
    
    this.controlButtons.forEach(container => {
      container.setVisible(true);
    });
    
    this.isVisible = true;
  }

  /**
   * Hide touch controls
   */
  public hide(): void {
    if (!this.isVisible) return;
    
    this.controlButtons.forEach(container => {
      container.setVisible(false);
    });
    
    this.isVisible = false;
  }

  /**
   * Toggle touch controls visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update layout for screen resize
   */
  public updateLayout(width: number, height: number): void {
    this.config.zones.forEach(zone => {
      const container = this.controlButtons.get(zone.action);
      if (container) {
        // Recalculate position
        const x = zone.x > 0 ? zone.x : width + zone.x;
        const y = zone.y > 0 ? zone.y : height + zone.y;
        container.setPosition(x, y);
      }
    });
  }

  /**
   * Set action callback
   */
  public onAction(callback: (action: string) => void): void {
    this.onActionCallback = callback;
  }

  /**
   * Set control opacity
   */
  public setOpacity(opacity: number): void {
    this.config.controlOpacity = opacity;
    
    this.controlButtons.forEach(container => {
      container.list.forEach(child => {
        if (child instanceof Phaser.GameObjects.GameObject && 'setAlpha' in child) {
          (child as any).setAlpha(opacity);
        }
      });
    });
  }

  /**
   * Enable/disable controls
   */
  public setEnabled(enabled: boolean): void {
    this.controlButtons.forEach(container => {
      container.list.forEach(child => {
        if (child instanceof Phaser.GameObjects.Shape && child.input) {
          child.input.enabled = enabled;
        }
      });
    });
  }

  /**
   * Add custom control zone
   */
  public addControlZone(zone: TouchZone): void {
    this.config.zones.push(zone);
    
    // If controls are already created, create this new one
    if (this.controlButtons.size > 0) {
      // Implementation would create the new control button
      // For now, just add to config
    }
  }

  /**
   * Remove control zone
   */
  public removeControlZone(action: string): void {
    const container = this.controlButtons.get(action);
    if (container) {
      container.destroy();
      this.controlButtons.delete(action);
    }
    
    this.config.zones = this.config.zones.filter(zone => zone.action !== action);
  }

  /**
   * Get current configuration
   */
  public getConfig(): TouchControlsConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<TouchControlsConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Recreate controls if they exist
    if (this.controlButtons.size > 0) {
      this.destroy();
      this.createControls();
      if (this.isVisible) {
        this.show();
      }
    }
  }

  /**
   * Check if controls are currently visible
   */
  public isControlsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Destroy touch controls
   */
  public destroy(): void {
    this.controlButtons.forEach(container => {
      container.destroy();
    });
    
    this.controlButtons.clear();
    this.onActionCallback = null;
    this.isVisible = false;
  }
}
