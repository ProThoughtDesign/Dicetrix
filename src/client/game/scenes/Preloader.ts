import { Scene } from 'phaser';
import Logger from '../../utils/Logger';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload(): void {
    Logger.log('Preloader: Loading game assets');
    // Create a simple loading screen
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0a1a');
    
    this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    // apply 1px black stroke for white text to increase contrast
    // replace previous loading text with stroked one for contrast
    this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);

    // Preload dice images (public assets path)
    const dice = [4,6,8,10,12,20];
    for (const s of dice) {
      // key: d4, d6, ... path from client root (Vite serves public/) 
      const key = `d${s}`;
      const path = `/assets/dice/d${s}.png`;
      this.load.image(key, path);
    }
  }

  create(): void {
    Logger.log('Preloader: Assets loaded, starting menu');
    this.scene.start('StartMenu');
  }
}
