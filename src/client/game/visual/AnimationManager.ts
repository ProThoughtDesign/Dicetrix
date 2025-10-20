/**
 * AnimationManager handles smooth animations for piece movement, grid clearing, and UI transitions
 * Provides neon-themed tweens and visual feedback for game actions
 */
export class AnimationManager {
  private scene: Phaser.Scene;
  private activeTweens: Phaser.Tweens.Tween[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Animate piece falling movement
   */
  public animatePieceFall(
    piece: Phaser.GameObjects.Group,
    fromY: number,
    toY: number,
    duration: number = 300
  ): Promise<void> {
    return new Promise((resolve) => {
      const tween = this.scene.tweens.add({
        targets: piece.children.entries,
        y: `+=${toY - fromY}`,
        duration: duration,
        ease: 'Power2',
        onComplete: () => {
          this.removeTween(tween);
          resolve();
        }
      });
      
      this.activeTweens.push(tween);
    });
  }

  /**
   * Animate piece horizontal movement
   */
  public animatePieceMove(
    piece: Phaser.GameObjects.Group,
    direction: 'left' | 'right',
    distance: number,
    duration: number = 150
  ): Promise<void> {
    return new Promise((resolve) => {
      const offset = direction === 'left' ? -distance : distance;
      
      const tween = this.scene.tweens.add({
        targets: piece.children.entries,
        x: `+=${offset}`,
        duration: duration,
        ease: 'Power1',
        onComplete: () => {
          this.removeTween(tween);
          resolve();
        }
      });
      
      this.activeTweens.push(tween);
    });
  }

  /**
   * Animate piece rotation
   */
  public animatePieceRotation(
    piece: Phaser.GameObjects.Group,
    angle: number,
    duration: number = 200
  ): Promise<void> {
    return new Promise((resolve) => {
      const tween = this.scene.tweens.add({
        targets: piece,
        rotation: `+=${angle}`,
        duration: duration,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.removeTween(tween);
          resolve();
        }
      });
      
      this.activeTweens.push(tween);
    });
  }

  /**
   * Animate piece locking with bounce effect
   */
  public animatePieceLock(piece: Phaser.GameObjects.Group): Promise<void> {
    return new Promise((resolve) => {
      // Quick bounce effect
      const tween = this.scene.tweens.add({
        targets: piece.children.entries,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          this.removeTween(tween);
          resolve();
        }
      });
      
      this.activeTweens.push(tween);
    });
  }

  /**
   * Animate dice clearing with neon dissolve effect
   */
  public animateDiceClear(
    dice: Phaser.GameObjects.Sprite[],
    delay: number = 0
  ): Promise<void> {
    return new Promise((resolve) => {
      if (dice.length === 0) {
        resolve();
        return;
      }

      // Add glow effect before clearing
      dice.forEach((die, index) => {
        this.addNeonGlow(die, 0xffffff, 0.8);
        
        // Stagger the clearing animation
        const clearDelay = delay + (index * 50);
        
        const tween = this.scene.tweens.add({
          targets: die,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          rotation: Math.PI * 2,
          duration: 400,
          delay: clearDelay,
          ease: 'Power2',
          onComplete: () => {
            die.destroy();
            this.removeTween(tween);
            
            // Resolve when last die is cleared
            if (index === dice.length - 1) {
              resolve();
            }
          }
        });
        
        this.activeTweens.push(tween);
      });
    });
  }

  /**
   * Animate gravity application with cascading effect
   */
  public animateGravity(
    diceToMove: Array<{ die: Phaser.GameObjects.Sprite, fromY: number, toY: number }>,
    duration: number = 300
  ): Promise<void> {
    return new Promise((resolve) => {
      if (diceToMove.length === 0) {
        resolve();
        return;
      }

      let completedAnimations = 0;
      const totalAnimations = diceToMove.length;

      diceToMove.forEach(({ die, toY }, index) => {
        // Stagger gravity animations for visual appeal
        const delay = index * 30;
        
        const tween = this.scene.tweens.add({
          targets: die,
          y: toY,
          duration: duration,
          delay: delay,
          ease: 'Bounce.easeOut',
          onComplete: () => {
            completedAnimations++;
            this.removeTween(tween);
            
            if (completedAnimations === totalAnimations) {
              resolve();
            }
          }
        });
        
        this.activeTweens.push(tween);
      });
    });
  }

  /**
   * Animate match highlighting
   */
  public animateMatchHighlight(
    dice: Phaser.GameObjects.Sprite[],
    color: number = 0xffffff
  ): void {
    dice.forEach(die => {
      // Add pulsing glow effect
      const glow = this.addNeonGlow(die, color, 0.6);
      
      const tween = this.scene.tweens.add({
        targets: glow,
        alpha: 0.2,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.activeTweens.push(tween);
    });
  }

  /**
   * Animate UI panel slide in
   */
  public animateUISlideIn(
    panel: Phaser.GameObjects.Container | Phaser.GameObjects.GameObject,
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number,
    duration: number = 400
  ): Promise<void> {
    return new Promise((resolve) => {
      // Set initial position
      const startPos = this.getOffscreenPosition(panel, direction, distance);
      
      if ('setPosition' in panel) {
        panel.setPosition(startPos.x, startPos.y);
      }

      const tween = this.scene.tweens.add({
        targets: panel,
        x: startPos.targetX,
        y: startPos.targetY,
        duration: duration,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.removeTween(tween);
          resolve();
        }
      });
      
      this.activeTweens.push(tween);
    });
  }

  /**
   * Animate UI panel slide out
   */
  public animateUISlideOut(
    panel: Phaser.GameObjects.Container | Phaser.GameObjects.GameObject,
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number,
    duration: number = 300
  ): Promise<void> {
    return new Promise((resolve) => {
      const endPos = this.getOffscreenPosition(panel, direction, distance);
      
      const tween = this.scene.tweens.add({
        targets: panel,
        x: endPos.x,
        y: endPos.y,
        duration: duration,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.removeTween(tween);
          resolve();
        }
      });
      
      this.activeTweens.push(tween);
    });
  }

  /**
   * Animate score popup
   */
  public animateScorePopup(
    x: number,
    y: number,
    score: number,
    color: string = '#ffff00'
  ): void {
    const text = this.scene.add.text(x, y, `+${score}`, {
      fontSize: '24px',
      color: color,
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Add glow effect
    this.addNeonGlow(text, 0xffff00, 0.6);

    const tween = this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
        this.removeTween(tween);
      }
    });
    
    this.activeTweens.push(tween);
  }

  /**
   * Animate level up effect
   */
  public animateLevelUp(level: number): void {
    const { width, height } = this.scene.scale;
    
    const text = this.scene.add.text(width / 2, height / 2, `LEVEL ${level}!`, {
      fontSize: '48px',
      color: '#00ff88',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Add intense glow
    this.addNeonGlow(text, 0x00ff88, 1);

    // Scale and fade animation
    const tween = this.scene.tweens.add({
      targets: text,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
        this.removeTween(tween);
      }
    });
    
    this.activeTweens.push(tween);
  }

  /**
   * Add neon glow effect to any game object
   */
  public addNeonGlow(
    target: Phaser.GameObjects.GameObject,
    color: number = 0xffffff,
    intensity: number = 0.5
  ): Phaser.GameObjects.Sprite | null {
    if (!('texture' in target) || !target.texture) {
      return null;
    }

    const sprite = target as Phaser.GameObjects.Sprite;
    const glow = this.scene.add.sprite(sprite.x, sprite.y, sprite.texture.key);
    
    glow.setTint(color);
    glow.setAlpha(intensity);
    glow.setScale(sprite.scaleX * 1.2, sprite.scaleY * 1.2);
    glow.setDepth(sprite.depth - 1);

    // Pulsing animation
    const tween = this.scene.tweens.add({
      targets: glow,
      scaleX: sprite.scaleX * 1.4,
      scaleY: sprite.scaleY * 1.4,
      alpha: intensity * 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.activeTweens.push(tween);
    return glow;
  }

  /**
   * Create screen transition effect
   */
  public createScreenTransition(
    type: 'fade' | 'slide' | 'zoom',
    direction?: 'in' | 'out',
    duration: number = 500
  ): Promise<void> {
    return new Promise((resolve) => {
      const camera = this.scene.cameras.main;
      
      switch (type) {
        case 'fade':
          if (direction === 'out') {
            camera.fadeOut(duration, 0, 0, 0);
            camera.once('camerafadeoutcomplete', resolve);
          } else {
            camera.fadeIn(duration, 0, 0, 0);
            camera.once('camerafadeincomplete', resolve);
          }
          break;
          
        case 'slide':
          // Implement slide transition
          this.scene.time.delayedCall(duration, resolve);
          break;
          
        case 'zoom':
          const tween = this.scene.tweens.add({
            targets: camera,
            zoom: direction === 'out' ? 0.1 : 1,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
              this.removeTween(tween);
              resolve();
            }
          });
          this.activeTweens.push(tween);
          break;
      }
    });
  }

  /**
   * Get offscreen position for slide animations
   */
  private getOffscreenPosition(
    panel: any,
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number
  ): { x: number, y: number, targetX: number, targetY: number } {
    const currentX = panel.x || 0;
    const currentY = panel.y || 0;
    
    switch (direction) {
      case 'left':
        return { x: currentX - distance, y: currentY, targetX: currentX, targetY: currentY };
      case 'right':
        return { x: currentX + distance, y: currentY, targetX: currentX, targetY: currentY };
      case 'up':
        return { x: currentX, y: currentY - distance, targetX: currentX, targetY: currentY };
      case 'down':
        return { x: currentX, y: currentY + distance, targetX: currentX, targetY: currentY };
      default:
        return { x: currentX, y: currentY, targetX: currentX, targetY: currentY };
    }
  }

  /**
   * Remove tween from active list
   */
  private removeTween(tween: Phaser.Tweens.Tween): void {
    const index = this.activeTweens.indexOf(tween);
    if (index > -1) {
      this.activeTweens.splice(index, 1);
    }
  }

  /**
   * Stop all active animations
   */
  public stopAllAnimations(): void {
    this.activeTweens.forEach(tween => {
      if (tween) {
        tween.stop();
      }
    });
    this.activeTweens = [];
  }

  /**
   * Clean up animation manager
   */
  public destroy(): void {
    this.stopAllAnimations();
  }
}
