import { Scene } from 'phaser';
import Logger from '../../utils/Logger';

export class GameOver extends Scene {
  constructor() {
    super('GameOver');
  }

  create(): void {
    const { width, height } = this.scale;
    
    // Set background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Game over text
    this.add.text(width / 2, height * 0.4, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      fontFamily: 'Arial',
      stroke: '#ffffff',
      strokeThickness: 1,
    }).setOrigin(0.5);

    // Return to menu button
    this.add.text(width / 2, height * 0.6, 'RETURN TO MENU', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: '#666666',
      padding: { x: 15, y: 8 },
      stroke: '#000000',
      strokeThickness: 1,
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.scene.start('StartMenu'));

    Logger.log('GameOver scene: Ready');
  }
}
