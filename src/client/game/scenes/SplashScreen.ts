import { Scene } from 'phaser';
import Logger from '../../utils/Logger';

interface FallingDie {
  sprite: Phaser.GameObjects.Image;
  velocity: number;
  rotationSpeed: number;
  tint: number;
}

interface PooledDiceSprite {
  sprite: Phaser.GameObjects.Image;
  inUse: boolean;
}

export class SplashScreen extends Scene {
  private fallingDice: FallingDie[] = [];
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private flashText: Phaser.GameObjects.Text | null = null;
  private flashTween: Phaser.Tweens.Tween | null = null;
  private transitionInProgress: boolean = false;

  // Object pooling for dice sprites
  private dicePool: PooledDiceSprite[] = [];
  private readonly POOL_SIZE = 30; // Maximum number of pooled dice sprites
  private readonly MAX_ACTIVE_DICE = 20; // Maximum concurrent falling dice

  // Error handling and performance monitoring
  private performanceMonitor = {
    frameCount: 0,
    lastFpsCheck: 0,
    lowFpsWarningShown: false,
  };
  private readonly TARGET_FPS = 60;
  private readonly LOW_FPS_THRESHOLD = 30;

  // Mobile-specific optimizations
  private isMobile: boolean = false;
  private touchFeedbackSprite: Phaser.GameObjects.Graphics | null = null;
  private batteryOptimizedMode: boolean = false;

  constructor() {
    super('SplashScreen');
  }

  preload(): void {
    Logger.log('SplashScreen: Scene loaded');
    // No additional assets needed - dice textures are already loaded in Preloader
  }

  create(): void {
    // Set background color to match game theme
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Detect mobile device and optimize accordingly
    this.detectMobileDevice();

    // Initialize dice object pool
    this.initializeDicePool();

    // Create interactive flash text
    this.createFlashText();

    // Start dice spawning system
    this.startDiceSpawning();

    // Set up multi-platform input detection
    this.setupInputHandling();

    // Create touch feedback for mobile
    if (this.isMobile) {
      this.createTouchFeedback();
    }

    Logger.log('SplashScreen: Scene created');
  }

  override update(): void {
    try {
      // Update falling dice physics
      this.updateFallingDice();

      // Monitor performance
      this.monitorPerformance();
    } catch (error) {
      Logger.log(`SplashScreen: Error in update loop - ${error}`);
      // Continue execution to prevent scene from breaking
    }
  }

  private createFlashText(): void {
    try {
      const { width, height } = this.scale;

      // Create text object with "Press any key to play Dicetrix" content
      this.flashText = this.add.text(
        width / 2, // Center horizontally
        height / 2, // Center vertically
        'Press any key to play Dicetrix',
        {
          fontFamily: 'Asimovian', // Apply Asimovian font
          fontSize: '48px', // Initial size, will be scaled
          color: '#ffffff', // White color
          stroke: '#000000', // Black stroke for contrast
          strokeThickness: 4,
          align: 'center',
        }
      );

      // Center the text origin for proper positioning
      this.flashText.setOrigin(0.5, 0.5);

      // Scale text to occupy 80% of screen width with appropriate height
      const textWidth = this.flashText.width;
      const targetWidth = width * 0.8;
      const scaleRatio = targetWidth / textWidth;
      this.flashText.setScale(scaleRatio);

      // Create pulsing animation with alpha oscillation
      this.createFlashTextAnimation();

      Logger.log('SplashScreen: Flash text created and styled');
    } catch (error) {
      Logger.log(`SplashScreen: Error creating flash text - ${error}`);
      // Fallback: Create simple text without custom font
      this.createFallbackText();
    }
  }

  private createFallbackText(): void {
    try {
      const { width, height } = this.scale;

      // Fallback text with system font
      this.flashText = this.add.text(width / 2, height / 2, 'Press any key to play Dicetrix', {
        fontFamily: 'Arial, sans-serif', // Fallback to system font
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      });

      this.flashText.setOrigin(0.5, 0.5);

      // Scale text appropriately
      const textWidth = this.flashText.width;
      const targetWidth = width * 0.8;
      const scaleRatio = Math.min(targetWidth / textWidth, 1.5); // Limit maximum scale
      this.flashText.setScale(scaleRatio);

      this.createFlashTextAnimation();

      Logger.log('SplashScreen: Fallback text created successfully');
    } catch (error) {
      Logger.log(`SplashScreen: Critical error creating fallback text - ${error}`);
      // Last resort: create minimal text
      const { width, height } = this.scale;
      this.flashText = this.add.text(width / 2, height / 2, 'Press any key to play', {
        fontSize: '24px',
        color: '#ffffff',
      });
      this.flashText.setOrigin(0.5, 0.5);
    }
  }

  private createFlashTextAnimation(): void {
    if (!this.flashText) return;

    // Create Phaser.Tweens animation for alpha oscillation
    this.flashTween = this.tweens.add({
      targets: this.flashText,
      alpha: { from: 1.0, to: 0.6 }, // Alpha oscillation between 0.6 and 1.0
      duration: 1500, // 1.5 second duration per cycle
      ease: 'Sine.easeInOut', // Smooth easing for natural pulsing effect
      yoyo: true, // Yoyo effect to reverse the animation
      repeat: -1, // Infinite loop
    });

    Logger.log('SplashScreen: Flash text pulsing animation created');
  }

  private initializeDicePool(): void {
    try {
      // Available dice types from existing assets
      const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

      // Pre-create dice sprites for object pooling
      for (let i = 0; i < this.POOL_SIZE; i++) {
        try {
          const diceType = Phaser.Utils.Array.GetRandom(diceTypes);

          // Check if texture exists before creating sprite
          if (!this.textures.exists(diceType)) {
            Logger.log(
              `SplashScreen: Warning - dice texture '${diceType}' not found, using fallback`
            );
            // Use a fallback or skip this dice
            continue;
          }

          const sprite = this.add.image(-100, -100, diceType); // Position off-screen initially
          sprite.setScale(0.5);
          sprite.setVisible(false); // Hide until needed

          this.dicePool.push({
            sprite: sprite,
            inUse: false,
          });
        } catch (spriteError) {
          Logger.log(`SplashScreen: Error creating dice sprite ${i} - ${spriteError}`);
          // Continue with next sprite
        }
      }

      // If no dice could be created, create fallback rectangles
      if (this.dicePool.length === 0) {
        this.createFallbackDicePool();
      }

      Logger.log(`SplashScreen: Dice object pool initialized with ${this.dicePool.length} sprites`);
    } catch (error) {
      Logger.log(`SplashScreen: Critical error initializing dice pool - ${error}`);
      this.createFallbackDicePool();
    }
  }

  private createFallbackDicePool(): void {
    try {
      // Create simple colored rectangles as fallback dice
      for (let i = 0; i < Math.min(this.POOL_SIZE, 10); i++) {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 20, 20);
        graphics.setPosition(-100, -100);
        graphics.setVisible(false);

        // Treat graphics object as image for compatibility
        this.dicePool.push({
          sprite: graphics as any,
          inUse: false,
        });
      }

      Logger.log(
        `SplashScreen: Fallback dice pool created with ${this.dicePool.length} rectangles`
      );
    } catch (error) {
      Logger.log(`SplashScreen: Failed to create fallback dice pool - ${error}`);
    }
  }

  private getPooledDiceSprite(): Phaser.GameObjects.Image | null {
    // Find an unused sprite from the pool
    for (const pooledSprite of this.dicePool) {
      if (!pooledSprite.inUse) {
        pooledSprite.inUse = true;
        pooledSprite.sprite.setVisible(true);
        return pooledSprite.sprite;
      }
    }

    // Pool exhausted, return null
    Logger.log('SplashScreen: Dice pool exhausted, cannot spawn more dice');
    return null;
  }

  private returnDiceToPool(sprite: Phaser.GameObjects.Image): void {
    try {
      // Find the sprite in the pool and mark as available
      for (const pooledSprite of this.dicePool) {
        if (pooledSprite.sprite === sprite) {
          pooledSprite.inUse = false;
          pooledSprite.sprite.setVisible(false);
          pooledSprite.sprite.setPosition(-100, -100); // Move off-screen

          // Safely reset properties
          if (pooledSprite.sprite.setTint) {
            pooledSprite.sprite.setTint(0xffffff); // Reset tint
          }
          if (pooledSprite.sprite.setRotation) {
            pooledSprite.sprite.setRotation(0); // Reset rotation
          }
          break;
        }
      }
    } catch (error) {
      Logger.log(`SplashScreen: Error returning dice to pool - ${error}`);
    }
  }

  private monitorPerformance(): void {
    try {
      this.performanceMonitor.frameCount++;
      const currentTime = this.time.now;

      // Initialize lastFpsCheck if not set
      if (this.performanceMonitor.lastFpsCheck === 0) {
        this.performanceMonitor.lastFpsCheck = currentTime;
        return;
      }

      // Check FPS every 2 seconds (more stable measurement)
      if (currentTime - this.performanceMonitor.lastFpsCheck >= 2000) {
        const fps = Math.round(this.performanceMonitor.frameCount / 2); // Average over 2 seconds
        this.performanceMonitor.frameCount = 0;
        this.performanceMonitor.lastFpsCheck = currentTime;

        // Only log performance issues if FPS is consistently low and we have enough data
        if (
          fps < this.LOW_FPS_THRESHOLD &&
          fps > 0 &&
          !this.performanceMonitor.lowFpsWarningShown
        ) {
          Logger.log(
            `SplashScreen: Performance warning - FPS dropped to ${fps} (target: ${this.TARGET_FPS})`
          );
          this.performanceMonitor.lowFpsWarningShown = true;

          // Reduce dice count if performance is poor
          this.optimizeForPerformance();
        }

        // Reset warning flag if performance improves
        if (fps >= this.TARGET_FPS * 0.8) {
          this.performanceMonitor.lowFpsWarningShown = false;
        }
      }
    } catch (error) {
      Logger.log(`SplashScreen: Error in performance monitoring - ${error}`);
    }
  }

  private optimizeForPerformance(): void {
    try {
      // Reduce active dice count for better performance
      const targetReduction = Math.floor(this.fallingDice.length * 0.3); // Remove 30% of dice

      for (let i = 0; i < targetReduction && this.fallingDice.length > 0; i++) {
        const die = this.fallingDice.pop();
        if (die && die.sprite) {
          this.returnDiceToPool(die.sprite);
        }
      }

      // Enable battery optimization mode on mobile if performance is poor
      if (this.isMobile && !this.batteryOptimizedMode) {
        this.enableBatteryOptimization();
      }

      Logger.log(
        `SplashScreen: Performance optimization - reduced dice count by ${targetReduction}`
      );
    } catch (error) {
      Logger.log(`SplashScreen: Error optimizing performance - ${error}`);
    }
  }

  private detectMobileDevice(): void {
    try {
      // Check for mobile device using multiple methods
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;

      this.isMobile = isMobileUA || (isTouchDevice && isSmallScreen);

      if (this.isMobile) {
        Logger.log('SplashScreen: Mobile device detected, enabling mobile optimizations');
        this.applyMobileOptimizations();
      }
    } catch (error) {
      Logger.log(`SplashScreen: Error detecting mobile device - ${error}`);
      // Default to mobile-safe settings
      this.isMobile = true;
      this.applyMobileOptimizations();
    }
  }

  private applyMobileOptimizations(): void {
    try {
      // Reduce maximum active dice for mobile performance
      (this as any).MAX_ACTIVE_DICE = Math.min(this.MAX_ACTIVE_DICE, 12);

      // Reduce pool size for mobile memory constraints
      (this as any).POOL_SIZE = Math.min(this.POOL_SIZE, 20);

      // Enable battery-conscious mode by default on mobile
      this.batteryOptimizedMode = true;

      Logger.log('SplashScreen: Mobile optimizations applied');
    } catch (error) {
      Logger.log(`SplashScreen: Error applying mobile optimizations - ${error}`);
    }
  }

  private enableBatteryOptimization(): void {
    try {
      this.batteryOptimizedMode = true;

      // Reduce animation frequency for battery conservation
      if (this.flashTween) {
        // Restart tween with slower timing
        this.flashTween.destroy();
        if (this.flashText) {
          this.flashTween = this.tweens.add({
            targets: this.flashText,
            alpha: { from: 1.0, to: 0.6 },
            duration: 2000, // Slower pulsing for battery conservation
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
          });
        }
      }

      // Reduce dice spawn frequency
      if (this.spawnTimer) {
        this.spawnTimer.destroy();
        this.scheduleNextSpawn(true); // Use battery-optimized timing
      }

      Logger.log('SplashScreen: Battery optimization mode enabled');
    } catch (error) {
      Logger.log(`SplashScreen: Error enabling battery optimization - ${error}`);
    }
  }

  private createTouchFeedback(): void {
    try {
      // Create invisible graphics object for touch feedback
      this.touchFeedbackSprite = this.add.graphics();
      this.touchFeedbackSprite.setVisible(false);

      Logger.log('SplashScreen: Touch feedback system created');
    } catch (error) {
      Logger.log(`SplashScreen: Error creating touch feedback - ${error}`);
    }
  }

  private showTouchFeedback(x: number, y: number): void {
    try {
      if (!this.touchFeedbackSprite || !this.isMobile) return;

      // Clear previous feedback
      this.touchFeedbackSprite.clear();

      // Draw touch feedback circle
      this.touchFeedbackSprite.fillStyle(0xffffff, 0.3);
      this.touchFeedbackSprite.fillCircle(x, y, 30);
      this.touchFeedbackSprite.setVisible(true);

      // Animate feedback
      this.tweens.add({
        targets: this.touchFeedbackSprite,
        alpha: { from: 0.3, to: 0 },
        scaleX: { from: 1, to: 2 },
        scaleY: { from: 1, to: 2 },
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          if (this.touchFeedbackSprite) {
            this.touchFeedbackSprite.setVisible(false);
          }
        },
      });
    } catch (error) {
      Logger.log(`SplashScreen: Error showing touch feedback - ${error}`);
    }
  }

  private startDiceSpawning(): void {
    // Create initial spawn timer with random interval
    this.scheduleNextSpawn();
  }

  private scheduleNextSpawn(batteryOptimized: boolean = false): void {
    try {
      // Adjust interval based on battery optimization mode
      let minInterval = 200;
      let maxInterval = 800;

      if (batteryOptimized || this.batteryOptimizedMode) {
        // Longer intervals for battery conservation
        minInterval = 400;
        maxInterval = 1200;
      }

      // Random interval between min-max as per requirements
      const interval = Phaser.Math.Between(minInterval, maxInterval);

      this.spawnTimer = this.time.delayedCall(interval, () => {
        this.spawnDice();
        // Schedule next spawn
        this.scheduleNextSpawn(batteryOptimized);
      });
    } catch (error) {
      Logger.log(`SplashScreen: Error scheduling next spawn - ${error}`);
    }
  }

  private spawnDice(): void {
    try {
      // Check if we've reached the maximum active dice limit
      if (this.fallingDice.length >= this.MAX_ACTIVE_DICE) {
        return;
      }

      // Spawn 1-3 dice per spawn as per requirements
      const diceCount = Phaser.Math.Between(1, 3);
      const { width } = this.scale;

      // Predefined color palette from design document
      const colorPalette = [
        0x00ff88, // Green
        0xffff33, // Yellow
        0xff3366, // Red
        0xff9933, // Orange
        0xcc33ff, // Purple
        0x3366ff, // Blue
      ];

      for (let i = 0; i < diceCount && this.fallingDice.length < this.MAX_ACTIVE_DICE; i++) {
        try {
          // Get a sprite from the object pool
          const sprite = this.getPooledDiceSprite();
          if (!sprite) {
            break; // Pool exhausted
          }

          // Random horizontal position across screen width
          const x = Phaser.Math.Between(50, Math.max(width - 50, 100));
          const y = -50; // Start above screen

          // Random color tint
          const tint = Phaser.Utils.Array.GetRandom(colorPalette);

          // Configure the pooled sprite
          sprite.setPosition(x, y);
          if (sprite.setTint) {
            sprite.setTint(tint); // Apply random color tint
          }

          // Create falling die object with physics properties
          const fallingDie: FallingDie = {
            sprite: sprite,
            velocity: Phaser.Math.Between(200, 300), // Downward velocity in pixels/second
            rotationSpeed: Phaser.Math.FloatBetween(-2, 2), // Random rotation speed
            tint: tint,
          };

          // Add to tracking array
          this.fallingDice.push(fallingDie);
        } catch (diceError) {
          Logger.log(`SplashScreen: Error spawning individual dice - ${diceError}`);
          // Continue with next dice
        }
      }
    } catch (error) {
      Logger.log(`SplashScreen: Error in spawnDice - ${error}`);
    }
  }

  private updateFallingDice(): void {
    const deltaTime = this.game.loop.delta / 1000; // Convert to seconds
    const { height } = this.scale;

    for (let i = this.fallingDice.length - 1; i >= 0; i--) {
      const die = this.fallingDice[i];
      if (!die || !die.sprite) continue;

      // Apply gravity effect - move dice downward
      die.sprite.y += die.velocity * deltaTime;

      // Apply rotation animation for visual appeal
      die.sprite.rotation += die.rotationSpeed * deltaTime;

      // Boundary checking - return off-screen dice to pool
      if (die.sprite.y > height + 100) {
        // Add buffer to ensure dice is completely off-screen
        // Return the sprite to the pool instead of destroying
        this.returnDiceToPool(die.sprite);

        // Remove from tracking array
        this.fallingDice.splice(i, 1);
      }
    }
  }

  private setupInputHandling(): void {
    try {
      // Add keyboard event listeners for any key press
      this.input.keyboard?.on('keydown', this.handleUserInteraction, this);

      // Implement mouse click detection for full screen area
      this.input.on(
        'pointerdown',
        (pointer: Phaser.Input.Pointer) => {
          // Show touch feedback on mobile devices
          if (this.isMobile) {
            this.showTouchFeedback(pointer.x, pointer.y);
          }
          this.handleUserInteraction();
        },
        this
      );

      // Touch event handling is automatically handled by Phaser's pointer events
      // which includes both mouse clicks and touch events

      Logger.log('SplashScreen: Multi-platform input detection set up');
    } catch (error) {
      Logger.log(`SplashScreen: Error setting up input handling - ${error}`);
    }
  }

  private handleUserInteraction = (): void => {
    // Create transition prevention flag to avoid multiple triggers
    if (this.transitionInProgress) {
      return;
    }

    this.transitionInProgress = true;
    Logger.log('SplashScreen: User interaction detected, starting transition');

    // Proceed with audio initialization and scene transition
    this.initializeAudioAndTransition();
  };

  private async initializeAudioAndTransition(): Promise<void> {
    try {
      // Audio initialization moved to StartMenu after user interaction
      // This ensures proper AudioContext activation per browser requirements
      Logger.log('SplashScreen: Deferring audio initialization to StartMenu');
    } catch (error) {
      // Handle any unexpected errors
      Logger.log(`SplashScreen: Error in transition - ${error}`);
    }

    // Proceed to scene cleanup and transition
    this.cleanupAndTransition();
  }

  private cleanupAndTransition(): void {
    Logger.log('SplashScreen: Starting cleanup and transition');

    // Stop all dice spawning timers and animations
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
      Logger.log('SplashScreen: Dice spawning timer stopped');
    }

    // Clean up falling dice objects and return to pool
    this.fallingDice.forEach((die) => {
      if (die.sprite && die.sprite.active) {
        this.returnDiceToPool(die.sprite);
      }
    });
    this.fallingDice = [];

    // Clean up dice pool
    this.dicePool.forEach((pooledSprite) => {
      if (pooledSprite.sprite && pooledSprite.sprite.active) {
        pooledSprite.sprite.destroy();
      }
    });
    this.dicePool = [];
    Logger.log('SplashScreen: Falling dice objects and pool cleaned up');

    // Stop flash text animation tween
    if (this.flashTween) {
      this.flashTween.destroy();
      this.flashTween = null;
      Logger.log('SplashScreen: Flash text animation stopped');
    }

    // Clean up flash text object
    if (this.flashText) {
      this.flashText.destroy();
      this.flashText = null;
      Logger.log('SplashScreen: Flash text object cleaned up');
    }

    // Clean up touch feedback sprite
    if (this.touchFeedbackSprite) {
      this.touchFeedbackSprite.destroy();
      this.touchFeedbackSprite = null;
      Logger.log('SplashScreen: Touch feedback sprite cleaned up');
    }

    // Transition to StartMenu scene after audio initialization
    // Preserve existing game registry data and settings
    Logger.log('SplashScreen: Transitioning to StartMenu scene');
    this.scene.start('StartMenu');
  }
}
