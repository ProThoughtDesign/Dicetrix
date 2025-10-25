import { Scene } from 'phaser';

export type DieLike = { 
  sides: number; 
  number: number; 
  color?: string; 
  isTinted?: boolean; 
  glowColor?: string;
  storedGlowColor?: string; // Store the glow color when first determined
  storedTintDecision?: boolean; // Store whether this die should be tinted
} | null;

// Booster chance system - controls probability of dice being tinted
export let BOOSTER_CHANCE: number = 0.15; // 15% chance by default

export function setBoosterChance(chance: number): void {
  BOOSTER_CHANCE = Math.max(0, Math.min(1, chance)); // Clamp between 0 and 1
}

export function getBoosterChance(): number {
  return BOOSTER_CHANCE;
}

// Available glow colors for tinted dice
const GLOW_COLORS: Record<string, number> = {
  red: 0xff4d4d,
  blue: 0x4da6ff,
  green: 0x4dff88,
  yellow: 0xffd24d,
  purple: 0xbf80ff,
  orange: 0xff884d,
  teal: 0x4dd2bf,
  cyan: 0x4dd2bf,
  pink: 0xff69b4,
  lime: 0x32cd32,
};

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

// Create glow effect around a sprite
function createGlowEffect(scene: Scene, x: number, y: number, w: number, h: number, glowColor: number): Phaser.GameObjects.Graphics {
  const glow = scene.add.graphics();
  
  // Create multiple concentric circles for glow effect
  const glowRadius = Math.max(w, h) * 0.8; // Glow extends beyond the die
  const glowSteps = 5; // Number of glow layers
  
  for (let i = glowSteps; i > 0; i--) {
    const alpha = (1 - (i / glowSteps)) * 0.6; // Fade from center outward
    const radius = glowRadius * (i / glowSteps);
    
    glow.fillStyle(glowColor, alpha);
    glow.fillCircle(x + w/2, y + h/2, radius);
  }
  
  return glow;
}

// Draw a die at pixel coordinates (x,y) with given width/height.
// If parent is provided, the created GameObject will be added to that container.
export function drawDie(scene: Scene, x: number, y: number, w: number, h: number, die: DieLike, parent?: Phaser.GameObjects.Container | null) {
  if (!die) return null;
  const key = `d${die.sides}`;
  
  // Determine and store glow color for this die (only if not already determined)
  const glowColorName = determineGlowColor(die);
  let glowColor: number | undefined;
  
  if (glowColorName) {
    glowColor = GLOW_COLORS[glowColorName] || GLOW_COLORS['blue'];
  }

  // Create a container positioned at the desired pixel coords. Children are placed
  // relative to the container so the container can be moved or reparented safely.
  const container = scene.add.container(x, y);

  try {
    if (scene.textures && scene.textures.exists(key)) {
      // Create glow effect first (behind the die) if this die should glow
      if (glowColor) {
        const glow = createGlowEffect(scene, 0, 0, w, h, glowColor);
        container.add(glow);
      }
      
      // Create the die sprite - keep original appearance, no tinting
      const img = scene.add.image(w / 2, h / 2, key);
      img.setDisplaySize(w, h);
      // NO TINTING - dice keep their original appearance
      
      // overlay number centered in the die - gold, 50% larger, with black stroke
      const baseFontSize = Math.max(12, Math.floor(w / 3));
      const enlargedFontSize = Math.floor(baseFontSize * 1.5); // 50% larger
      const txt = scene.add.text(w / 2, h / 2, String(die.number), {
        fontFamily: 'Arial',
        fontSize: `${enlargedFontSize}px`,
        color: '#FFD700', // Gold color
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5);
      
      container.add([img, txt]);
      if (parent) parent.add(container);
      return container;
    }
  } catch (e) {
    // textures may not be available in some environments
  }

  // fallback: draw simple rect with number overlay and optional glow
  const g = scene.add.graphics();
  
  // Create glow effect first (behind the die) if this die should glow
  if (glowColor) {
    const glow = createGlowEffect(scene, 0, 0, w, h, glowColor);
    container.add(glow);
  }
  
  // Draw the die rectangle - keep original gray color, no tinting
  g.fillStyle(0x333333, 1); // Default gray color, no tinting
  g.fillRect(0, 0, w, h);
  g.lineStyle(2, 0x000000, 1);
  g.strokeRect(0, 0, w, h);
  
  // Fallback text - gold, 50% larger, with black stroke
  const baseFontSize = Math.max(12, Math.floor(w / 3));
  const enlargedFontSize = Math.floor(baseFontSize * 1.5); // 50% larger
  const txt = scene.add.text(w / 2, h / 2, String(die.number), {
    fontFamily: 'Arial',
    fontSize: `${enlargedFontSize}px`,
    color: '#FFD700', // Gold color
    stroke: '#000000',
    strokeThickness: 1,
  }).setOrigin(0.5);
  
  container.add([g, txt]);
  if (parent) parent.add(container);
  return container;
}
