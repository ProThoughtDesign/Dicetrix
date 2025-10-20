import { BoosterManager } from '../models/BoosterManager.js';
import { DieColor } from '../../../shared/types/game.js';

/**
 * HUD component for displaying active boosters with icons and timers
 */
export class BoosterHUD {
  private scene: Phaser.Scene;
  private boosterManager: BoosterManager;
  private container: Phaser.GameObjects.Container;
  private boosterElements: Map<string, BoosterHUDElement>;
  private x: number;
  private y: number;
  private maxWidth: number;

  constructor(scene: Phaser.Scene, boosterManager: BoosterManager, x: number = 20, y: number = 100) {
    this.scene = scene;
    this.boosterManager = boosterManager;
    this.x = x;
    this.y = y;
    this.maxWidth = 300;
    this.boosterElements = new Map();

    this.container = scene.add.container(x, y);
    this.container.setDepth(1000); // Ensure HUD is on top
  }

  /**
   * Update the HUD display
   */
  public update(): void {
    const hudData = this.boosterManager.getHUDData();
    const currentKeys = new Set<string>();

    // Update or create booster elements
    hudData.forEach((data, index) => {
      const key = `${data.color}-${data.description}`;
      currentKeys.add(key);

      let element = this.boosterElements.get(key);
      if (!element) {
        element = this.createBoosterElement(data, index);
        this.boosterElements.set(key, element);
      } else {
        this.updateBoosterElement(element, data, index);
      }
    });

    // Remove expired booster elements
    for (const [key, element] of this.boosterElements.entries()) {
      if (!currentKeys.has(key)) {
        this.removeBoosterElement(element);
        this.boosterElements.delete(key);
      }
    }
  }

  /**
   * Create a new booster HUD element
   */
  private createBoosterElement(data: {
    color: DieColor;
    icon: string;
    name: string;
    description: string;
    progress: number;
    displayColor: string;
  }, index: number): BoosterHUDElement {
    const yOffset = index * 60;
    
    // Background
    const background = this.scene.add.rectangle(0, yOffset, this.maxWidth, 50, 0x000000, 0.7);
    background.setStrokeStyle(2, parseInt(data.displayColor.replace('#', '0x')));
    background.setOrigin(0, 0);

    // Icon (placeholder - will be replaced with actual icons)
    const icon = this.scene.add.circle(25, yOffset + 25, 20, parseInt(data.displayColor.replace('#', '0x')));
    
    // Icon text (temporary until we have actual icons)
    const iconText = this.scene.add.text(25, yOffset + 25, data.color.charAt(0).toUpperCase(), {
      fontFamily: 'Arial Black',
      fontSize: 16,
      color: '#ffffff'
    }).setOrigin(0.5);

    // Name text
    const nameText = this.scene.add.text(55, yOffset + 10, data.name, {
      fontFamily: 'Arial',
      fontSize: 14,
      color: '#ffffff'
    });

    // Description text
    const descriptionText = this.scene.add.text(55, yOffset + 28, data.description, {
      fontFamily: 'Arial',
      fontSize: 12,
      color: '#cccccc'
    });

    // Progress bar background
    const progressBg = this.scene.add.rectangle(55, yOffset + 42, 200, 6, 0x333333);
    progressBg.setOrigin(0, 0);

    // Progress bar fill
    const progressFill = this.scene.add.rectangle(55, yOffset + 42, 200 * data.progress, 6, parseInt(data.displayColor.replace('#', '0x')));
    progressFill.setOrigin(0, 0);

    // Timer text
    const timerText = this.scene.add.text(this.maxWidth - 10, yOffset + 25, this.formatTime(data.progress), {
      fontFamily: 'Arial',
      fontSize: 12,
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    const element: BoosterHUDElement = {
      background,
      icon,
      iconText,
      nameText,
      descriptionText,
      progressBg,
      progressFill,
      timerText,
      data
    };

    // Add all elements to container
    this.container.add([
      background,
      icon,
      iconText,
      nameText,
      descriptionText,
      progressBg,
      progressFill,
      timerText
    ]);

    return element;
  }

  /**
   * Update an existing booster HUD element
   */
  private updateBoosterElement(element: BoosterHUDElement, data: {
    color: DieColor;
    icon: string;
    name: string;
    description: string;
    progress: number;
    displayColor: string;
  }, index: number): void {
    const yOffset = index * 60;

    // Update positions
    element.background.setPosition(0, yOffset);
    element.icon.setPosition(25, yOffset + 25);
    element.iconText.setPosition(25, yOffset + 25);
    element.nameText.setPosition(55, yOffset + 10);
    element.descriptionText.setPosition(55, yOffset + 28);
    element.progressBg.setPosition(55, yOffset + 42);
    element.progressFill.setPosition(55, yOffset + 42);
    element.timerText.setPosition(this.maxWidth - 10, yOffset + 25);

    // Update progress bar
    const progressWidth = 200 * Math.max(0, data.progress);
    element.progressFill.setSize(progressWidth, 6);

    // Update timer text
    element.timerText.setText(this.formatTime(data.progress));

    // Update colors if changed
    if (data.displayColor !== element.data.displayColor) {
      const color = parseInt(data.displayColor.replace('#', '0x'));
      element.background.setStrokeStyle(2, color);
      element.icon.setFillStyle(color);
      element.progressFill.setFillStyle(color);
    }

    element.data = data;
  }

  /**
   * Remove a booster HUD element
   */
  private removeBoosterElement(element: BoosterHUDElement): void {
    // Add fade out animation
    this.scene.tweens.add({
      targets: [
        element.background,
        element.icon,
        element.iconText,
        element.nameText,
        element.descriptionText,
        element.progressBg,
        element.progressFill,
        element.timerText
      ],
      alpha: 0,
      duration: 300,
      onComplete: () => {
        // Remove from container and destroy
        this.container.remove([
          element.background,
          element.icon,
          element.iconText,
          element.nameText,
          element.descriptionText,
          element.progressBg,
          element.progressFill,
          element.timerText
        ]);

        element.background.destroy();
        element.icon.destroy();
        element.iconText.destroy();
        element.nameText.destroy();
        element.descriptionText.destroy();
        element.progressBg.destroy();
        element.progressFill.destroy();
        element.timerText.destroy();
      }
    });
  }

  /**
   * Format time for display
   */
  private formatTime(progress: number): string {
    // For time-based boosters, show remaining time
    // For count-based boosters, show remaining count
    if (progress <= 0) return '0';
    
    // This is a simplified version - in a real implementation,
    // we'd need to know the actual remaining duration from the booster
    const percentage = Math.ceil(progress * 100);
    return `${percentage}%`;
  }

  /**
   * Set the position of the HUD
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.container.setPosition(x, y);
  }

  /**
   * Set the visibility of the HUD
   */
  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Destroy the HUD
   */
  public destroy(): void {
    for (const element of this.boosterElements.values()) {
      element.background.destroy();
      element.icon.destroy();
      element.iconText.destroy();
      element.nameText.destroy();
      element.descriptionText.destroy();
      element.progressBg.destroy();
      element.progressFill.destroy();
      element.timerText.destroy();
    }
    this.boosterElements.clear();
    this.container.destroy();
  }

  /**
   * Update layout for responsive design
   */
  public updateLayout(screenWidth: number, _screenHeight: number): void {
    // Position HUD on the right side of the screen
    const hudX = Math.max(20, screenWidth - this.maxWidth - 20);
    const hudY = 100;
    this.setPosition(hudX, hudY);
  }
}

/**
 * Interface for booster HUD element components
 */
interface BoosterHUDElement {
  background: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Arc;
  iconText: Phaser.GameObjects.Text;
  nameText: Phaser.GameObjects.Text;
  descriptionText: Phaser.GameObjects.Text;
  progressBg: Phaser.GameObjects.Rectangle;
  progressFill: Phaser.GameObjects.Rectangle;
  timerText: Phaser.GameObjects.Text;
  data: {
    color: DieColor;
    icon: string;
    name: string;
    description: string;
    progress: number;
    displayColor: string;
  };
}
