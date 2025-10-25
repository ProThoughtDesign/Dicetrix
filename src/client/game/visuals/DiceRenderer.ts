import { Scene } from 'phaser';
import { BoosterEffectSystem } from '../../../shared/utils/BoosterEffectSystem.js';
import { BoosterType, EnhancedDie } from '../../../shared/types/difficulty.js';

export type DieLike = { 
  sides: number; 
  number: number; 
  color: string; 
  isTinted?: boolean; 
  glowColor?: string;
  storedGlowColor?: string; // Store the glow color when first determined
  storedTintDecision?: boolean; // Store whether this die should be tinted
  boosterType?: BoosterType; // Booster effect type
  isBlack?: boolean; // Black Die flag for infinity symbol display
  isWild?: boolean; // Wild matching capability
} | null;

// Pooled glow effect interface for performance optimization
interface PooledGlowEffect {
  graphics: Phaser.GameObjects.Graphics;
  inUse: boolean;
  layers: Phaser.GameObjects.Graphics[]; // Multiple layers for concentric circles
}

// Booster chance system - controls probability of dice being tinted
export let BOOSTER_CHANCE: number = 0.15; // 15% chance by default

export function setBoosterChance(chance: number): void {
  BOOSTER_CHANCE = Math.max(0, Math.min(1, chance)); // Clamp between 0 and 1
}

export function getBoosterChance(): number {
  return BOOSTER_CHANCE;
}

// Glow effect pooling system for performance optimization
class GlowEffectPool {
  private static instance: GlowEffectPool;
  private pool: PooledGlowEffect[] = [];
  private readonly POOL_SIZE = 50; // Maximum number of pooled glow effects
  private readonly GLOW_LAYERS = 5; // Number of concentric circles per glow effect
  private scene: Scene | null = null;

  public static getInstance(): GlowEffectPool {
    if (!GlowEffectPool.instance) {
      GlowEffectPool.instance = new GlowEffectPool();
    }
    return GlowEffectPool.instance;
  }

  public initialize(scene: Scene): void {
    this.scene = scene;
    this.initializePool();
  }

  private initializePool(): void {
    if (!this.scene) return;

    // Pre-create glow effect objects for pooling
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const mainGraphics = this.scene.add.graphics();
      const layers: Phaser.GameObjects.Graphics[] = [];
      
      // Create multiple layers for concentric circle effect
      for (let j = 0; j < this.GLOW_LAYERS; j++) {
        const layer = this.scene.add.graphics();
        layer.setVisible(false);
        layers.push(layer);
      }
      
      mainGraphics.setVisible(false);
      
      this.pool.push({
        graphics: mainGraphics,
        layers: layers,
        inUse: false
      });
    }
  }

  public getGlowEffect(): PooledGlowEffect | null {
    // Find an unused glow effect from the pool
    for (const pooledGlow of this.pool) {
      if (!pooledGlow.inUse) {
        pooledGlow.inUse = true;
        return pooledGlow;
      }
    }
    return null; // Pool exhausted
  }

  public returnGlowEffect(glowEffect: PooledGlowEffect): void {
    glowEffect.inUse = false;
    glowEffect.graphics.setVisible(false);
    glowEffect.graphics.clear();
    
    // Clear and hide all layers
    for (const layer of glowEffect.layers) {
      layer.clear();
      layer.setVisible(false);
    }
  }

  public cleanup(): void {
    // Destroy all pooled objects
    for (const pooledGlow of this.pool) {
      pooledGlow.graphics.destroy();
      for (const layer of pooledGlow.layers) {
        layer.destroy();
      }
    }
    this.pool = [];
    this.scene = null;
  }
}

// Available glow colors for tinted dice - updated to match BoosterType colors
const GLOW_COLORS: Record<string, number> = {
  red: 0xff4444,
  blue: 0x4444ff,
  yellow: 0xffff44,
  green: 0x44ff44,
  purple: 0xaa44ff,
  orange: 0xff8844,
  magenta: 0xff44aa,
  cyan: 0x44ffff,
  teal: 0x44aa88,
  none: 0x000000, // Fallback
};

// Booster effect system instance
const boosterSystem = new BoosterEffectSystem();

// Get a random glow color
function getRandomGlowColor(): { name: string; hex: number } {
  const colorNames = Object.keys(GLOW_COLORS);
  const randomName = colorNames[Math.floor(Math.random() * colorNames.length)];
  return { name: randomName, hex: GLOW_COLORS[randomName] };
}

// Determine if a die should be tinted based on booster chance
function shouldDieBeTinted(): boolean {
  return Math.random() < BOOSTER_CHANCE;
}

// Check if a die should have glow (using stored decision)
export function shouldDieHaveGlow(die: DieLike): boolean {
  if (!die) return false;
  
  // If we have a stored tint decision, use it
  if (die.storedTintDecision !== undefined) {
    return die.storedTintDecision;
  }
  
  // If explicitly set, use that
  if (die.isTinted !== undefined) {
    return die.isTinted;
  }
  
  // Otherwise, determine once and store
  const shouldTint = shouldDieBeTinted();
  die.storedTintDecision = shouldTint;
  return shouldTint;
}

// Determine and store glow color for a die (only called once when die is created)
export function determineGlowColor(die: DieLike): string | undefined {
  if (!die) return undefined;
  
  // If die already has a stored glow color, use it
  if (die.storedGlowColor) {
    return die.storedGlowColor;
  }
  
  // Check if this die should have glow (this will store the decision)
  if (!shouldDieHaveGlow(die)) {
    return undefined; // No glow for this die
  }
  
  // Get glow color
  let glowColorName: string;
  if (die.glowColor) {
    glowColorName = die.glowColor;
  } else {
    const randomColor = getRandomGlowColor();
    glowColorName = randomColor.name;
  }
  
  // Store the glow color in the die object
  die.storedGlowColor = glowColorName;
  
  return glowColorName;
}

/**
 * Renders a multi-layered booster glow effect using pooled graphics objects
 * @param scene The Phaser scene
 * @param x X position of the die
 * @param y Y position of the die  
 * @param w Width of the die
 * @param h Height of the die
 * @param glowColor The color of the glow effect
 * @param container The container to add the glow effect to
 * @returns The pooled glow effect or null if pool is exhausted
 */
function renderBoosterGlow(
  scene: Scene, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  glowColor: number,
  container: Phaser.GameObjects.Container
): PooledGlowEffect | null {
  const glowPool = GlowEffectPool.getInstance();
  const pooledGlow = glowPool.getGlowEffect();
  
  if (!pooledGlow) {
    return null; // Pool exhausted, skip glow effect
  }

  // Calculate glow parameters
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const baseRadius = Math.max(w, h) * 0.4; // Base radius for glow
  const maxRadius = baseRadius * 2.0; // Maximum glow extent
  
  // Create concentric circles with varying opacity and size
  for (let i = 0; i < pooledGlow.layers.length; i++) {
    const layer = pooledGlow.layers[i];
    const progress = (i + 1) / pooledGlow.layers.length;
    
    // Calculate radius and alpha for this layer
    const radius = baseRadius + (maxRadius - baseRadius) * progress;
    const alpha = (1 - progress) * 0.4; // Fade from center outward
    
    // Clear and redraw the layer
    layer.clear();
    layer.fillStyle(glowColor, alpha);
    layer.fillCircle(centerX, centerY, radius);
    layer.setVisible(true);
    
    // Add layer to container (behind the die)
    container.add(layer);
  }
  
  return pooledGlow;
}

/**
 * Cleans up a booster glow effect and returns it to the pool
 * @param glowEffect The glow effect to cleanup
 * @param container The container to remove the glow from
 */
function cleanupBoosterGlow(glowEffect: PooledGlowEffect, container: Phaser.GameObjects.Container): void {
  // Remove layers from container
  for (const layer of glowEffect.layers) {
    container.remove(layer);
  }
  
  // Return to pool
  const glowPool = GlowEffectPool.getInstance();
  glowPool.returnGlowEffect(glowEffect);
}

// Initialize the glow effect pool if not already done
let glowPoolInitialized = false;

/**
 * Initializes the glow effect pool for the given scene
 * @param scene The Phaser scene to initialize the pool for
 */
export function initializeGlowPool(scene: Scene): void {
  if (!glowPoolInitialized) {
    const glowPool = GlowEffectPool.getInstance();
    glowPool.initialize(scene);
    glowPoolInitialized = true;
  }
}

/**
 * Cleans up the glow effect pool resources
 */
export function cleanupGlowPool(): void {
  const glowPool = GlowEffectPool.getInstance();
  glowPool.cleanup();
  glowPoolInitialized = false;
}

// Draw a die at pixel coordinates (x,y) with given width/height.
// If parent is provided, the created GameObject will be added to that container.
export function drawDie(scene: Scene, x: number, y: number, w: number, h: number, die: DieLike, parent?: Phaser.GameObjects.Container | null) {
  if (!die) return null;
  
  // Initialize glow pool if needed
  initializeGlowPool(scene);
  
  const key = `d${die.sides}`;
  
  // Determine glow color based on booster type or legacy system
  let glowColor: number | undefined;
  let pooledGlow: PooledGlowEffect | null = null;
  
  if (die.boosterType && die.boosterType !== BoosterType.NONE) {
    // Use new booster system
    const colorName = die.boosterType;
    glowColor = GLOW_COLORS[colorName] || GLOW_COLORS['blue'];
  } else {
    // Fallback to legacy glow system for backward compatibility
    const glowColorName = determineGlowColor(die);
    if (glowColorName) {
      glowColor = GLOW_COLORS[glowColorName] || GLOW_COLORS['blue'];
    }
  }

  // Create a container positioned at the desired pixel coords. Children are placed
  // relative to the container so the container can be moved or reparented safely.
  const container = scene.add.container(x, y);
  
  // Store reference to pooled glow for cleanup
  (container as any).pooledGlow = null;

  try {
    if (scene.textures && scene.textures.exists(key)) {
      // Create booster glow effect first (behind the die) if this die should glow
      if (glowColor !== undefined) {
        pooledGlow = renderBoosterGlow(scene, 0, 0, w, h, glowColor, container);
        (container as any).pooledGlow = pooledGlow;
      }
      
      // Create the die sprite - keep original appearance, no tinting
      const img = scene.add.image(w / 2, h / 2, key);
      img.setDisplaySize(w, h);
      // NO TINTING - dice keep their original appearance to maintain visual clarity
      
      // overlay number centered in the die - gold, 50% larger, very bold with drop shadow
      // For Black dice, display infinity symbol instead of number
      const displayText = die.isBlack ? '∞' : String(die.number);
      const baseFontSize = Math.max(12, Math.floor(w / 3));
      const enlargedFontSize = Math.floor(baseFontSize * 1.5); // 50% larger
      
      // Create drop shadow text first (positioned slightly offset)
      const shadowOffset = Math.max(2, Math.floor(enlargedFontSize * 0.08)); // Shadow offset based on font size
      const shadowTxt = scene.add.text(w / 2 + shadowOffset, h / 2 + shadowOffset, displayText, {
        fontFamily: 'Arial Black', // Very bold font
        fontSize: `${enlargedFontSize}px`,
        color: '#000000', // Black shadow
        fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.6); // Semi-transparent shadow
      
      // Create main text with very bold styling and thick stroke
      const txt = scene.add.text(w / 2, h / 2, displayText, {
        fontFamily: 'Arial Black', // Very bold font
        fontSize: `${enlargedFontSize}px`,
        color: '#FFD700', // Gold color
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: Math.max(2, Math.floor(enlargedFontSize * 0.12)), // Thicker stroke based on font size
      }).setOrigin(0.5);
      
      container.add([img, shadowTxt, txt]); // Add shadow first, then main text
      if (parent) parent.add(container);
      return container;
    }
  } catch (e) {
    // textures may not be available in some environments
  }

  // fallback: draw simple rect with number overlay and optional glow
  const g = scene.add.graphics();
  
  // Create booster glow effect first (behind the die) if this die should glow
  if (glowColor !== undefined) {
    pooledGlow = renderBoosterGlow(scene, 0, 0, w, h, glowColor, container);
    (container as any).pooledGlow = pooledGlow;
  }
  
  // Draw the die rectangle - keep original gray color, no tinting to maintain visual clarity
  g.fillStyle(0x333333, 1); // Default gray color, no tinting
  g.fillRect(0, 0, w, h);
  g.lineStyle(2, 0x000000, 1);
  g.strokeRect(0, 0, w, h);
  
  // Fallback text - gold, 50% larger, very bold with drop shadow
  // For Black dice, display infinity symbol instead of number
  const displayText = die.isBlack ? '∞' : String(die.number);
  const baseFontSize = Math.max(12, Math.floor(w / 3));
  const enlargedFontSize = Math.floor(baseFontSize * 1.5); // 50% larger
  
  // Create drop shadow text first (positioned slightly offset)
  const shadowOffset = Math.max(2, Math.floor(enlargedFontSize * 0.08)); // Shadow offset based on font size
  const shadowTxt = scene.add.text(w / 2 + shadowOffset, h / 2 + shadowOffset, displayText, {
    fontFamily: 'Arial Black', // Very bold font
    fontSize: `${enlargedFontSize}px`,
    color: '#000000', // Black shadow
    fontStyle: 'bold',
  }).setOrigin(0.5).setAlpha(0.6); // Semi-transparent shadow
  
  // Create main text with very bold styling and thick stroke
  const txt = scene.add.text(w / 2, h / 2, displayText, {
    fontFamily: 'Arial Black', // Very bold font
    fontSize: `${enlargedFontSize}px`,
    color: '#FFD700', // Gold color
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: Math.max(2, Math.floor(enlargedFontSize * 0.12)), // Thicker stroke based on font size
  }).setOrigin(0.5);
  
  container.add([g, shadowTxt, txt]); // Add shadow first, then main text
  if (parent) parent.add(container);
  return container;
}

/**
 * Applies booster effects to a die using the BoosterEffectSystem
 * @param die The die to apply booster effects to
 * @param boosterChance The probability of applying a booster effect (0.0 to 1.0)
 */
export function applyBoosterEffectToDie(die: EnhancedDie, boosterChance: number): void {
  boosterSystem.applyBoosterEffect(die, boosterChance);
}

/**
 * Checks if a die has a booster effect applied
 * @param die The die to check
 * @returns True if the die has a booster effect, false otherwise
 */
export function hasBoosterEffect(die: DieLike): boolean {
  if (!die) return false;
  return die.boosterType !== undefined && die.boosterType !== BoosterType.NONE;
}

/**
 * Gets the glow color for a die's booster type
 * @param die The die to get the glow color for
 * @returns The glow color as a hex number, or undefined if no booster effect
 */
export function getBoosterGlowColor(die: DieLike): number | undefined {
  if (!die || !die.boosterType || die.boosterType === BoosterType.NONE) {
    return undefined;
  }
  
  return GLOW_COLORS[die.boosterType] || GLOW_COLORS['blue'];
}

/**
 * Cleans up a die container and returns any pooled glow effects
 * @param container The die container to cleanup
 */
export function cleanupDie(container: Phaser.GameObjects.Container): void {
  if (!container) return;
  
  // Clean up pooled glow effect if it exists
  const pooledGlow = (container as any).pooledGlow as PooledGlowEffect | null;
  if (pooledGlow) {
    cleanupBoosterGlow(pooledGlow, container);
    (container as any).pooledGlow = null;
  }
  
  // Destroy the container and all its children
  container.destroy();
}
