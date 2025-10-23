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
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [Boot, Preloader, StartMenu, Game, GameOver],
};

const StartGame = (parent: string) => {
  return new Phaser.Game({ ...config, parent });
};

export default StartGame;
