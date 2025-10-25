import { Scene } from 'phaser';

export type DieLike = { sides: number; number: number; color?: string } | null;

function contrastTextColor(hex: number | undefined) {
  if (!hex) return '#ffffff';
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum < 140 ? '#ffffff' : '#0b0b0b';
}

const NAMED_COLORS: Record<string, number> = {
  red: 0xff4d4d,
  blue: 0x4da6ff,
  green: 0x4dff88,
  yellow: 0xffd24d,
  purple: 0xbf80ff,
  orange: 0xff884d,
  teal: 0x4dd2bf,
  gray: 0x999999,
};

// Draw a die at pixel coordinates (x,y) with given width/height.
// If parent is provided, the created GameObject will be added to that container.
export function drawDie(scene: Scene, x: number, y: number, w: number, h: number, die: DieLike, parent?: Phaser.GameObjects.Container | null) {
  if (!die) return null;
  const key = `d${die.sides}`;
  // determine a tint color from die.color if provided (hex string or named)
  let tint: number | undefined;
  if (typeof (die as any).color === 'string') {
    const c = (die as any).color.trim().toLowerCase();
    if (c.startsWith('#')) {
      tint = parseInt(c.slice(1), 16);
    } else if (/^[0-9a-f]{6}$/i.test(c)) {
      tint = parseInt(c, 16);
    } else if (NAMED_COLORS[c]) {
      tint = NAMED_COLORS[c];
    } else {
      // try simple css name fallback by checking our map
      tint = NAMED_COLORS[c] || undefined;
    }
  } else if (typeof (die as any).color === 'number') {
    tint = (die as any).color as number;
  }

  // Create a container positioned at the desired pixel coords. Children are placed
  // relative to the container so the container can be moved or reparented safely.
  const container = scene.add.container(x, y);

  try {
    if (scene.textures && scene.textures.exists(key)) {
      const img = scene.add.image(w / 2, h / 2, key);
      img.setDisplaySize(w, h);
      if (tint) img.setTint(tint);
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

  // fallback: draw simple rect with number overlay and optional tint
  const g = scene.add.graphics();
  const fill = tint ?? 0x333333;
  g.fillStyle(Number(fill), 1);
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
