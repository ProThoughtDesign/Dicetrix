import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { StartMenu } from './scenes/StartMenu';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import * as Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
  // Target a 1080x1920 portrait design resolution and scale to fit the available screen.
  // Using FIT will scale the canvas to fit entirely within the parent while preserving aspect ratio
  // (may letterbox/pillarbox when aspect ratios differ). This avoids cropping content.
  mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 1920,
  },
  scene: [Boot, Preloader, StartMenu, Game, GameOver],
};

const StartGame = (parent: string) => {
  return new Phaser.Game({ ...config, parent });
};

export default StartGame;
