import { MatchGroup } from './MatchGroup.js';
import { GridPosition } from '../../../shared/types/game.js';

/**
 * MatchEffects class handles visual effects for match clearing
 * Provides particle effects, animations, and visual feedback
 */
export class MatchEffects {
  private scene: Phaser.Scene;
  private particleManager: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeParticleSystem();
  }

  /**
   * Initialize the particle system for match effects
   */
  private initializeParticleSystem(): void {
    // Create particle manager if it doesn't exist
    if (!this.particleManager) {
      // For now, we'll use a simple colored rectangle as particle texture
      // In a full implementation, this would use proper particle textures
      try {
        this.particleManager = this.scene.add.particles(0, 0, 'particle', {
          scale: { start: 0.3, end: 0 },
          speed: { min: 50, max: 150 },
          lifespan: 500,
          quantity: 3
        });
      } catch (error) {
        // If particle texture doesn't exist, create a simple fallback
        console.warn('Particle texture not found, effects will be limited');
        this.particleManager = null;
      }
    }
  }

  /**
   * Play match clear effect for a match group
   */
  public playMatchClearEffect(matchGroup: MatchGroup, gridToScreen: (x: number, y: number) => { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      const sizeEffect = matchGroup.getSizeEffect();
      
      switch (sizeEffect.type) {
        case 'standard':
          this.playStandardClearEffect(matchGroup, gridToScreen).then(resolve);
          break;
        case 'line_clear':
          this.playLineClearEffect(matchGroup, gridToScreen).then(resolve);
          break;
        case 'spawn_wild':
          this.playWildSpawnEffect(matchGroup, gridToScreen).then(resolve);
          break;
        case 'area_clear':
          this.playAreaClearEffect(matchGroup, gridToScreen).then(resolve);
          break;
        case 'grid_clear':
          this.playGridClearEffect(matchGroup, gridToScreen).then(resolve);
          break;
        default:
          resolve();
      }
    });
  }

  /**
   * Play standard clear effect (3 dice match)
   */
  private playStandardClearEffect(matchGroup: MatchGroup, gridToScreen: (x: number, y: number) => { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      const effects: Phaser.Tweens.Tween[] = [];
      
      // Create particle bursts at each die position
      for (const position of matchGroup.positions) {
        const screenPos = gridToScreen(position.x, position.y);
        
        // Particle burst
        if (this.particleManager) {
          this.particleManager.emitParticleAt(screenPos.x, screenPos.y, 5);
        }
        
        // Create a flash effect
        const flash = this.scene.add.circle(screenPos.x, screenPos.y, 20, 0xffffff, 0.8);
        const flashTween = this.scene.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 2,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            flash.destroy();
          }
        });
        effects.push(flashTween);
      }
      
      // Wait for all effects to complete
      if (effects.length > 0) {
        const lastEffect = effects[effects.length - 1];
        if (lastEffect) {
          lastEffect.on('complete', () => {
            resolve();
          });
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  /**
   * Play line clear effect (4 dice match)
   */
  private playLineClearEffect(matchGroup: MatchGroup, gridToScreen: (x: number, y: number) => { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      const center = matchGroup.getCenterPosition();
      const screenCenter = gridToScreen(center.x, center.y);
      
      // Create expanding line effect
      const lineGraphics = this.scene.add.graphics();
      lineGraphics.lineStyle(4, 0xffff00, 1);
      
      // Determine if it's horizontal or vertical line
      const minX = Math.min(...matchGroup.positions.map(p => p.x));
      const maxX = Math.max(...matchGroup.positions.map(p => p.x));
      const horizontalSpread = maxX - minX;
      const verticalSpread = Math.max(...matchGroup.positions.map(p => p.y)) - Math.min(...matchGroup.positions.map(p => p.y));
      
      if (horizontalSpread >= verticalSpread) {
        // Horizontal line
        lineGraphics.lineBetween(0, screenCenter.y, this.scene.scale.width, screenCenter.y);
      } else {
        // Vertical line
        lineGraphics.lineBetween(screenCenter.x, 0, screenCenter.x, this.scene.scale.height);
      }
      
      // Animate line appearance
      lineGraphics.setAlpha(0);
      this.scene.tweens.add({
        targets: lineGraphics,
        alpha: 1,
        duration: 200,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          lineGraphics.destroy();
          resolve();
        }
      });
    });
  }

  /**
   * Play wild spawn effect (5 dice match)
   */
  private playWildSpawnEffect(matchGroup: MatchGroup, gridToScreen: (x: number, y: number) => { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      // First play standard clear effect
      this.playStandardClearEffect(matchGroup, gridToScreen).then(() => {
        // Then show wild spawn indicator
        const center = matchGroup.getCenterPosition();
        const screenCenter = gridToScreen(center.x, center.y);
        
        // Create wild spawn indicator
        const wildIndicator = this.scene.add.text(screenCenter.x, screenCenter.y, 'WILD!', {
          fontSize: '24px',
          color: '#00ff00',
          stroke: '#000000',
          strokeThickness: 2
        });
        wildIndicator.setOrigin(0.5);
        wildIndicator.setAlpha(0);
        
        this.scene.tweens.add({
          targets: wildIndicator,
          alpha: 1,
          y: screenCenter.y - 50,
          duration: 800,
          ease: 'Power2',
          onComplete: () => {
            this.scene.tweens.add({
              targets: wildIndicator,
              alpha: 0,
              duration: 200,
              onComplete: () => {
                wildIndicator.destroy();
                resolve();
              }
            });
          }
        });
      });
    });
  }

  /**
   * Play area clear effect (7 dice match)
   */
  private playAreaClearEffect(matchGroup: MatchGroup, gridToScreen: (x: number, y: number) => { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      const center = matchGroup.getCenterPosition();
      const screenCenter = gridToScreen(center.x, center.y);
      
      // Create expanding circle effect
      const circle = this.scene.add.circle(screenCenter.x, screenCenter.y, 10, 0xff6600, 0.6);
      
      this.scene.tweens.add({
        targets: circle,
        radius: 150,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          circle.destroy();
          resolve();
        }
      });
      
      // Add particle explosion
      if (this.particleManager) {
        this.particleManager.emitParticleAt(screenCenter.x, screenCenter.y, 20);
      }
    });
  }

  /**
   * Play grid clear effect (9+ dice match)
   */
  private playGridClearEffect(matchGroup: MatchGroup, gridToScreen: (x: number, y: number) => { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      // Create screen-wide flash effect
      const flash = this.scene.add.rectangle(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        this.scene.scale.width,
        this.scene.scale.height,
        0xffffff,
        0.8
      );
      
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          flash.destroy();
        }
      });
      
      // Create text indicator
      const gridClearText = this.scene.add.text(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        'GRID CLEAR!',
        {
          fontSize: '48px',
          color: '#ff0000',
          stroke: '#ffffff',
          strokeThickness: 4
        }
      );
      gridClearText.setOrigin(0.5);
      gridClearText.setAlpha(0);
      
      this.scene.tweens.add({
        targets: gridClearText,
        alpha: 1,
        scale: 1.2,
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: gridClearText,
            alpha: 0,
            duration: 300,
            delay: 500,
            onComplete: () => {
              gridClearText.destroy();
              resolve();
            }
          });
        }
      });
      
      // Massive particle explosion
      if (this.particleManager) {
        const center = matchGroup.getCenterPosition();
        const screenCenter = gridToScreen(center.x, center.y);
        this.particleManager.emitParticleAt(screenCenter.x, screenCenter.y, 50);
      }
    });
  }

  /**
   * Play Ultimate Combo effect (3+ wild dice match)
   */
  public playUltimateComboEffect(matchGroup: MatchGroup, gridToScreen: (x: number, y: number) => { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      const center = matchGroup.getCenterPosition();
      const screenCenter = gridToScreen(center.x, center.y);
      
      // Create ultimate combo text
      const comboText = this.scene.add.text(
        screenCenter.x,
        screenCenter.y,
        'ULTIMATE COMBO!',
        {
          fontSize: '36px',
          color: '#ffff00',
          stroke: '#ff0000',
          strokeThickness: 3
        }
      );
      comboText.setOrigin(0.5);
      comboText.setAlpha(0);
      
      // Animate combo text
      this.scene.tweens.add({
        targets: comboText,
        alpha: 1,
        scale: 1.5,
        duration: 600,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: comboText,
            alpha: 0,
            duration: 400,
            delay: 800,
            onComplete: () => {
              comboText.destroy();
              resolve();
            }
          });
        }
      });
      
      // Create rainbow particle effect
      if (this.particleManager) {
        for (const position of matchGroup.positions) {
          const screenPos = gridToScreen(position.x, position.y);
          this.particleManager.emitParticleAt(screenPos.x, screenPos.y, 10);
        }
      }
      
      // Screen shake effect
      this.scene.cameras.main.shake(800, 0.01);
    });
  }

  /**
   * Play cascade chain effect
   */
  public playCascadeEffect(chainNumber: number, centerPosition: GridPosition, gridToScreen: (x: number, y: number) => { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      const screenCenter = gridToScreen(centerPosition.x, centerPosition.y);
      
      // Create chain indicator
      const chainText = this.scene.add.text(
        screenCenter.x,
        screenCenter.y,
        `CHAIN ${chainNumber}!`,
        {
          fontSize: '20px',
          color: '#00ffff',
          stroke: '#000000',
          strokeThickness: 2
        }
      );
      chainText.setOrigin(0.5);
      chainText.setAlpha(0);
      
      this.scene.tweens.add({
        targets: chainText,
        alpha: 1,
        y: screenCenter.y - 30,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          this.scene.tweens.add({
            targets: chainText,
            alpha: 0,
            duration: 200,
            onComplete: () => {
              chainText.destroy();
              resolve();
            }
          });
        }
      });
    });
  }

  /**
   * Play Black Die effect (removes all boosters)
   */
  public playBlackDieEffect(matchGroup: MatchGroup, gridToScreen: (x: number, y: number) => { x: number; y: number }): Promise<void> {
    return new Promise((resolve) => {
      const center = matchGroup.getCenterPosition();
      const screenCenter = gridToScreen(center.x, center.y);
      
      // Create dark energy effect
      const darkCircle = this.scene.add.circle(screenCenter.x, screenCenter.y, 20, 0x000000, 0.8);
      
      // Expanding dark wave
      this.scene.tweens.add({
        targets: darkCircle,
        radius: 200,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          darkCircle.destroy();
        }
      });
      
      // Black die warning text
      const warningText = this.scene.add.text(
        screenCenter.x,
        screenCenter.y - 50,
        'BOOSTERS REMOVED!',
        {
          fontSize: '24px',
          color: '#ff0000',
          stroke: '#000000',
          strokeThickness: 3
        }
      );
      warningText.setOrigin(0.5);
      warningText.setAlpha(0);
      
      this.scene.tweens.add({
        targets: warningText,
        alpha: 1,
        y: screenCenter.y - 80,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          this.scene.tweens.add({
            targets: warningText,
            alpha: 0,
            duration: 400,
            delay: 600,
            onComplete: () => {
              warningText.destroy();
              resolve();
            }
          });
        }
      });
      
      // Screen flash effect
      const flash = this.scene.add.rectangle(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        this.scene.scale.width,
        this.scene.scale.height,
        0x000000,
        0.3
      );
      
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          flash.destroy();
        }
      });
    });
  }

  /**
   * Clean up particle system
   */
  public destroy(): void {
    if (this.particleManager) {
      this.particleManager.destroy();
      this.particleManager = null;
    }
  }
}
