import { Scene } from 'phaser';
import Logger from '../../utils/Logger';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Load minimal assets needed for the preloader
    Logger.log('Boot scene: Loading initial assets');
  }

  create(): void {
    Logger.log('Boot scene: Starting preloader');
    this.scene.start('Preloader');
  }
}
