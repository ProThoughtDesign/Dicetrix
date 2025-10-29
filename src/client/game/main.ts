import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { SplashScreen } from './scenes/SplashScreen';
import { StartMenu } from './scenes/StartMenu';
import { Settings } from './scenes/Settings';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';
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
  // Physics system removed - all movement now uses manual calculations
  // Background bouncing uses BackgroundBouncer utility class
  // Falling dice in SplashScreen use manual velocity calculations
  audio: {
    // Configure Phaser audio to work with browser autoplay policies
    // AudioContext will be properly initialized after user interaction
    disableWebAudio: false,
    noAudio: false,
    context: null, // Let Phaser create context but we'll manage it properly
  },
  scene: [Boot, Preloader, SplashScreen, StartMenu, Settings, Game, GameOver, LeaderboardScene, HowToPlayScene],
};

const StartGame = (parent: string) => {
  return new Phaser.Game({ ...config, parent });
};

export default StartGame;
