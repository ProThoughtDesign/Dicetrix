import { Scene } from 'phaser';
import Logger from '../../utils/Logger';
import { audioHandler } from '../services/AudioHandler';

export class GameOver extends Scene {
  constructor() {
    super('GameOver');
  }

  create(): void {
    const { width, height } = this.scale;
    
    // Set background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Start menu music for game over screen
    // Requirements: 1.4 - music transitions between scenes (respecting global mute state)
    try {
      audioHandler.stopMusic();
      
      // Only play music if enabled and initialized (respects global mute state)
      if (audioHandler.getMusicEnabled() && audioHandler.isInitialized()) {
        audioHandler.playMusic('menu-theme', true);
        Logger.log('GameOver: Started menu music (respecting global audio state)');
      } else {
        Logger.log('GameOver: Music disabled or not initialized, skipping menu music');
      }
    } catch (error) {
      Logger.log(`GameOver: Failed to start menu music - ${error}`);
    }

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
    .on('pointerdown', () => this.returnToMenu());

    Logger.log('GameOver scene: Ready');
  }

  private returnToMenu(): void {
    try {
      // Play menu select sound (respects global mute state)
      if (audioHandler.getSoundEnabled() && audioHandler.isInitialized()) {
        audioHandler.playSound('menu-select');
      }
      
      // Return to StartMenu (music will continue)
      this.scene.start('StartMenu');
    } catch (error) {
      Logger.log(`GameOver: Error returning to menu - ${error}`);
      // Fallback to direct scene transition
      this.scene.start('StartMenu');
    }
  }
}
