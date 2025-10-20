import { DieColor } from '../../../shared/types/game.js';

/**
 * DiceRenderer handles the creation and rendering of dice sprites
 * Generates procedural dice textures with neon-themed styling
 */
export class DiceRenderer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  
  // Color palette for neon theme
  private static readonly COLOR_PALETTE: Record<DieColor, number> = {
    red: 0xff3366,
    blue: 0x3366ff,
    green: 0x33ff66,
    yellow: 0xffff33,
    purple: 0xcc33ff,
    orange: 0xff9933,
    cyan: 0x33ffff
  };

  // Darker variants for depth
  private static readonly COLOR_DARK: Record<DieColor, number> = {
    red: 0xaa1144,
    blue: 0x1144aa,
    green: 0x11aa44,
    yellow: 0xaaaa11,
    purple: 0x8811aa,
    orange: 0xaa6611,
    cyan: 0x11aaaa
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
  }

  /**
   * Generate all dice textures for the game
   */
  public generateAllDiceTextures(): void {
    const diceTypes = [4, 6, 8, 10, 12, 20];
    const colors: DieColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];

    // Generate regular dice for each color and type
    for (const sides of diceTypes) {
      for (const color of colors) {
        this.generateDiceTexture(sides, color, false, false);
      }
    }

    // Generate wild dice for each color
    for (const color of colors) {
      this.generateDiceTexture(6, color, true, false); // Wild dice use 6-sided base
    }

    // Generate black dice for each type
    for (const sides of diceTypes) {
      this.generateDiceTexture(sides, 'red', false, true); // Black dice use red as base but override
    }

    // Generate placeholder texture
    this.generatePlaceholderTexture();
  }

  /**
   * Generate a single dice texture
   */
  private generateDiceTexture(
    sides: number,
    color: DieColor,
    isWild: boolean,
    isBlack: boolean
  ): void {
    const size = 64; // Base texture size
    const textureKey = this.getTextureKey(sides, color, isWild, isBlack);

    // Create render texture
    const renderTexture = this.scene.add.renderTexture(0, 0, size, size);
    
    // Clear graphics
    this.graphics.clear();

    if (isBlack) {
      this.drawBlackDie(size);
    } else if (isWild) {
      this.drawWildDie(size, color);
    } else {
      this.drawRegularDie(size, color, sides);
    }

    // Render to texture
    renderTexture.draw(this.graphics, size / 2, size / 2);
    
    // Generate texture from render texture
    renderTexture.saveTexture(textureKey);
    
    // Clean up
    renderTexture.destroy();
  }

  /**
   * Draw a regular die with neon styling
   */
  private drawRegularDie(size: number, color: DieColor, sides: number): void {
    const radius = size * 0.1;
    const mainColor = DiceRenderer.COLOR_PALETTE[color];
    const darkColor = DiceRenderer.COLOR_DARK[color];

    // Draw main body with gradient effect
    this.graphics.fillGradientStyle(mainColor, mainColor, darkColor, darkColor, 1);
    this.graphics.fillRoundedRect(-size/2, -size/2, size, size, radius);

    // Draw neon glow border
    this.graphics.lineStyle(3, mainColor, 0.8);
    this.graphics.strokeRoundedRect(-size/2, -size/2, size, size, radius);

    // Draw inner glow
    this.graphics.lineStyle(1, 0xffffff, 0.6);
    const innerRadius = typeof radius === 'number' ? radius : 0;
    this.graphics.strokeRoundedRect(-size/2 + 4, -size/2 + 4, size - 8, size - 8, innerRadius);

    // Draw side indicator (number of sides)
    this.drawSideIndicator(size, sides, 0xffffff);
  }

  /**
   * Draw a wild die with special rainbow effect
   */
  private drawWildDie(size: number, baseColor: DieColor): void {
    const radius = size * 0.1;
    const mainColor = DiceRenderer.COLOR_PALETTE[baseColor];

    // Draw main body
    this.graphics.fillStyle(0x222222, 1);
    this.graphics.fillRoundedRect(-size/2, -size/2, size, size, radius);

    // Draw rainbow border effect
    const colors = [0xff3366, 0xffff33, 0x33ff66, 0x33ffff, 0x3366ff, 0xcc33ff];
    for (let i = 0; i < colors.length; i++) {
      const angle = (i / colors.length) * Math.PI * 2;
      const x = Math.cos(angle) * size * 0.3;
      const y = Math.sin(angle) * size * 0.3;
      
      this.graphics.fillStyle(colors[i], 0.7);
      this.graphics.fillCircle(x, y, size * 0.08);
    }

    // Draw "WILD" symbol (diamond shape)
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(0, -size * 0.2);
    this.graphics.lineTo(size * 0.15, 0);
    this.graphics.lineTo(0, size * 0.2);
    this.graphics.lineTo(-size * 0.15, 0);
    this.graphics.closePath();
    this.graphics.fillPath();

    // Outer glow
    this.graphics.lineStyle(4, mainColor, 0.6);
    this.graphics.strokeRoundedRect(-size/2, -size/2, size, size, radius);
  }

  /**
   * Draw a black die with ominous styling
   */
  private drawBlackDie(size: number): void {
    const radius = size * 0.1;

    // Draw main body - very dark with red accents
    this.graphics.fillGradientStyle(0x111111, 0x111111, 0x000000, 0x000000, 1);
    this.graphics.fillRoundedRect(-size/2, -size/2, size, size, radius);

    // Draw red warning border
    this.graphics.lineStyle(3, 0xff0000, 0.8);
    this.graphics.strokeRoundedRect(-size/2, -size/2, size, size, radius);

    // Draw skull or X symbol
    this.graphics.fillStyle(0xff0000, 1);
    // Draw X
    this.graphics.fillRect(-size * 0.3, -size * 0.05, size * 0.6, size * 0.1);
    this.graphics.fillRect(-size * 0.05, -size * 0.3, size * 0.1, size * 0.6);
    
    // Rotate for X effect
    const tempGraphics = this.scene.add.graphics();
    tempGraphics.fillStyle(0xff0000, 1);
    tempGraphics.fillRect(-size * 0.3, -size * 0.05, size * 0.6, size * 0.1);
    tempGraphics.setRotation(Math.PI / 4);
    
    // Ominous glow
    this.graphics.lineStyle(2, 0x660000, 0.4);
    this.graphics.strokeRoundedRect(-size/2 - 2, -size/2 - 2, size + 4, size + 4, radius);
  }

  /**
   * Draw side indicator (small number showing die type)
   */
  private drawSideIndicator(size: number, _sides: number, color: number): void {
    // Draw small number in corner to indicate die type
    const fontSize = size * 0.2;
    const x = size * 0.3;
    const y = -size * 0.3;

    // Draw simple indicator for die type
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(x, y, fontSize * 0.6);
    
    // Draw number as simple shapes (for procedural generation)
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillCircle(x, y, fontSize * 0.3);
  }

  /**
   * Generate placeholder texture for unloaded dice
   */
  private generatePlaceholderTexture(): void {
    const size = 64;
    const renderTexture = this.scene.add.renderTexture(0, 0, size, size);
    
    this.graphics.clear();
    this.graphics.fillStyle(0x444444, 1);
    this.graphics.fillRoundedRect(-size/2, -size/2, size, size, size * 0.1);
    
    this.graphics.lineStyle(2, 0x888888, 1);
    this.graphics.strokeRoundedRect(-size/2, -size/2, size, size, size * 0.1);
    
    renderTexture.draw(this.graphics, size / 2, size / 2);
    renderTexture.saveTexture('die-placeholder');
    renderTexture.destroy();
  }

  /**
   * Get texture key for a die configuration
   */
  private getTextureKey(sides: number, color: DieColor, isWild: boolean, isBlack: boolean): string {
    if (isBlack) {
      return `die-black-${sides}`;
    } else if (isWild) {
      return `die-wild-${color}`;
    } else {
      return `die-${color}-${sides}`;
    }
  }

  /**
   * Create glow effect for a die sprite
   */
  public static addGlowEffect(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite,
    color: number = 0xffffff,
    intensity: number = 0.5
  ): Phaser.GameObjects.Sprite {
    // Create glow sprite behind the main sprite
    const glow = scene.add.sprite(sprite.x, sprite.y, sprite.texture.key);
    glow.setTint(color);
    glow.setAlpha(intensity);
    glow.setScale(sprite.scaleX * 1.2, sprite.scaleY * 1.2);
    glow.setDepth(sprite.depth - 1);

    // Add pulsing animation
    scene.tweens.add({
      targets: glow,
      scaleX: sprite.scaleX * 1.4,
      scaleY: sprite.scaleY * 1.4,
      alpha: intensity * 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return glow;
  }

  /**
   * Clean up graphics resources
   */
  public destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
