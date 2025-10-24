import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';

export interface UILayout {
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
  leftColumnWidth: number;
  rightColumnWidth: number;
  padding: number;
}

export abstract class BaseUI {
  protected scene: Phaser.Scene;
  protected container: Phaser.GameObjects.Container;
  protected layout: UILayout;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.layout = this.calculateLayout(scene.scale.width, scene.scale.height);
    
    // Listen for resize events
    scene.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });
  }

  protected calculateLayout(width: number, height: number): UILayout {
    const isMobile = width < 768 || height < width; // Portrait or small screen
    const padding = isMobile ? 10 : 20;
    
    let leftColumnWidth: number;
    let rightColumnWidth: number;
    
    if (isMobile) {
      // Mobile: 70% left (score + board), 30% right (next + controls)
      leftColumnWidth = Math.floor(width * 0.7);
      rightColumnWidth = width - leftColumnWidth - padding * 3;
    } else {
      // Desktop: 60% left (score + board), 40% right (next + controls + leaderboard)
      leftColumnWidth = Math.floor(width * 0.6);
      rightColumnWidth = width - leftColumnWidth - padding * 3;
    }

    return {
      isMobile,
      screenWidth: width,
      screenHeight: height,
      leftColumnWidth,
      rightColumnWidth,
      padding,
    };
  }

  protected handleResize(width: number, height: number): void {
    this.layout = this.calculateLayout(width, height);
    this.updateLayout();
    Logger.log(`UI resized to ${width}x${height}, mobile: ${this.layout.isMobile}`);
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    if (this.container) {
      this.container.destroy();
    }
  }

  // Abstract methods that child classes must implement
  protected abstract updateLayout(): void;
  public abstract setupInputHandlers(): void;
}
