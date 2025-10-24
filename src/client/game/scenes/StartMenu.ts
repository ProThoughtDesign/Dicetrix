import { Scene } from 'phaser';
import { settings } from '../services/Settings';
import Logger from '../../utils/Logger';

export class StartMenu extends Scene {
  constructor() {
    super('StartMenu');
  }

  preload(): void {
    // Load the Start button image from public assets
    // public assets are served from /assets/... when running the client
    this.load.image('start-btn-img', 'assets/startmenu/Dicetrix-StartGame.png');
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;

    // Set background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Ensure fonts are loaded before rendering text
    try {
      // Wait for document.fonts if available (most browsers). Use several fallbacks.
      const fontPromises: Promise<void>[] = [];
      // Nabla for title
      if (document && (document as any).fonts && (document as any).fonts.load) {
        fontPromises.push((document as any).fonts.load('16px "Nabla"'));
        fontPromises.push((document as any).fonts.load('16px "Asimovian"'));
      }
      // Also wait for the font system to be ready
      if ((document as any).fonts && (document as any).fonts.ready) {
        fontPromises.push((document as any).fonts.ready.then(() => {}));
      }
      if (fontPromises.length > 0) await Promise.all(fontPromises);
    } catch (e) {
      // If font loading fails, continue and let the browser fallback
      Logger.log('Font preloading failed or not supported: ' + e);
    }

    // Title using Nabla font. We will scale the text so its rendered width is ~900px.
    const title = this.add
      .text(width / 2, height * 0.3, 'DICETRIX', {
        fontSize: '200px',
        color: '#00ff88',
        fontFamily: 'Nabla',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    // Scale title to approximately 900px width
    try {
      const measuredWidth = title.width || title.getBounds().width || 1;
      const target = 900;
      const scale = target / measuredWidth;
      title.setScale(scale, scale);
    } catch (e) {
      // ignore scaling issues
    }

    // UI scale factor for buttons/dropdowns (scale up by 2x as requested)
    const UI_SCALE = 2;

    // Create start button as an image (preloaded in preload)
    let startImg: Phaser.GameObjects.Image | null = null;
    try {
      startImg = this.add.image(width / 2, height * 0.6, 'start-btn-img');
      startImg.setInteractive({ useHandCursor: true });
      startImg.on('pointerdown', () => this.startGame());
      // center origin
      startImg.setOrigin(0.5, 0.5);
      // Optionally scale the image if it's too large for screen width
      const maxImgW = Math.min(width * 0.8, 800);
      let s = 1;
      if (startImg.width > maxImgW) {
        s = maxImgW / startImg.width;
        startImg.setScale(s);
      }
      // Now scale to 2x current display size per request
      startImg.setScale((startImg.scaleX || 1) * UI_SCALE, (startImg.scaleY || 1) * UI_SCALE);

      // Add a centered label on top of the image
      const labelFontSize = Math.max(20, Math.floor(startImg.displayHeight * 0.25));
      const startLabel = this.add
        .text(startImg.x, startImg.y, 'START GAME', {
          fontSize: `${labelFontSize}px`,
          color: '#ffffff',
          fontFamily: 'Asimovian',
          stroke: '#000000',
          strokeThickness: 2,
        })
        .setOrigin(0.5);
      // Ensure clicking the text also starts the game
      startLabel.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.startGame());
    } catch (e) {
      // Fallback: text button if image missing
      const startButton = this.add
        .text(width / 2, height * 0.6, 'START GAME', {
          fontSize: '40px',
          color: '#ffffff',
          fontFamily: 'Asimovian',
          backgroundColor: '#00ff88',
          padding: { x: 20, y: 10 },
          stroke: '#000000',
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => startButton.setStyle({ backgroundColor: '#00dd70' }))
        .on('pointerout', () => startButton.setStyle({ backgroundColor: '#00ff88' }))
        .on('pointerdown', () => this.startGame());
    }

    // Difficulty dropdown
    const modes = ['easy', 'medium', 'hard', 'expert', 'zen'];
    const modeLabels = {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert',
      zen: 'Zen',
    } as Record<string, string>;
    // User-specified palette (ordered). We'll map first five colors to the five modes.
    const palette = [0x00ff88, 0xffff33, 0xff3366, 0xff9933, 0xcc33ff];
    // Load persisted selection from Settings service if present
    const persisted = settings.get('selectedMode');
    const defaultMode = (this.registry.get('selectedMode') as string) || persisted || 'medium';

    const dropdownX = width / 2;
    const dropdownY = height * 0.45;

    // Fixed dropdown width (children will match this width)
  const DROPDOWN_WIDTH = 220;
  const DROPDOWN_HEIGHT = 36;
  const SCALED_DROPDOWN_WIDTH = DROPDOWN_WIDTH * UI_SCALE;
  const SCALED_DROPDOWN_HEIGHT = DROPDOWN_HEIGHT * UI_SCALE;

    const contrastTextColor = (n: number) => {
      const r = (n >> 16) & 0xff;
      const g = (n >> 8) & 0xff;
      const b = n & 0xff;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      return lum < 140 ? '#ffffff' : '#0b0b0b';
    };
    const darken = (n: number, factor = 0.85) => {
      const r = Math.max(0, Math.min(255, Math.floor(((n >> 16) & 0xff) * factor)));
      const g = Math.max(0, Math.min(255, Math.floor(((n >> 8) & 0xff) * factor)));
      const b = Math.max(0, Math.min(255, Math.floor((n & 0xff) * factor)));
      return (r << 16) | (g << 8) | b;
    };

    // Determine initial color from persisted/default mode
    const initialIndex = Math.max(0, modes.indexOf(defaultMode));
    const initialColor = palette[initialIndex % palette.length] ?? 0x222222;

    // Background rectangle for dropdown (fixed size)
    const dropdownBg = this.add
      .rectangle(
        dropdownX - SCALED_DROPDOWN_WIDTH / 2,
        dropdownY - SCALED_DROPDOWN_HEIGHT / 2,
        SCALED_DROPDOWN_WIDTH,
        SCALED_DROPDOWN_HEIGHT,
        initialColor
      )
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x000000, 0.2)
      .setInteractive({ useHandCursor: true });

    const dropdownLabelColor = contrastTextColor(initialColor);
    const dropdownLabel = this.add
      .text(dropdownX, dropdownY, `Mode: ${modeLabels[defaultMode]}`, {
        fontSize: `${18 * UI_SCALE}px`,
        color: dropdownLabelColor,
        fontFamily: 'Asimovian',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    // Make clicks land on bg but keep label for display
    // toggle implementation is bound later (dropdownToggleImpl)
    dropdownBg.on('pointerdown', () => dropdownToggleImpl());
    dropdownLabel
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => dropdownToggleImpl());

    // Options group (hidden initially)
    // options stores pairs {bg, text} so we can destroy them easily
    const options: Array<{ bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = [];
    let open = false;

    // override the placeholder toggle with real implementation that has access to locals
    const dropdownToggleImpl = () => {
  open = !open;
  const parentWidth = SCALED_DROPDOWN_WIDTH;
  const optHeight = 32 * UI_SCALE;
  const startX = dropdownX - parentWidth / 2;

      if (open) {
        for (let i = 0; i < modes.length; i++) {
          const m = modes[i];
          const color = palette[i % palette.length] ?? 0x222222;
          const y = dropdownY + SCALED_DROPDOWN_HEIGHT / 2 + 8 * UI_SCALE + i * (optHeight + 6 * UI_SCALE);

          const bg = this.add
            .rectangle(startX, y, parentWidth, optHeight, color)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
          const label = modeLabels[m as keyof typeof modeLabels] || m;
          const optColor = contrastTextColor(Number(color));
          const txt = this.add
            .text(startX + 10 * UI_SCALE, y + optHeight / 2, String(label), {
              fontSize: `${18 * UI_SCALE}px`,
              color: optColor,
              fontFamily: 'Asimovian',
              stroke: '#000000',
              strokeThickness: 1,
            })
            .setOrigin(0, 0.5);

          const onSelect = () => {
            this.registry.set('selectedMode', m);
            // persist via Settings service
            try {
              settings.set('selectedMode', String(m));
            } catch (e) {}
            // update dropdown appearance
            dropdownLabel.setText(`Mode: ${modeLabels[m as keyof typeof modeLabels] || m}`);
            const selColor = palette[i % palette.length] ?? 0x222222;
            dropdownBg.setFillStyle(Number(selColor));
            dropdownLabel.setColor(contrastTextColor(Number(selColor)));

            // destroy all option objects
            options.forEach((o) => {
              o.bg.destroy();
              o.text.destroy();
            });
            options.length = 0;
            open = false;
          };

          // hover effects: darken the color on hover
          bg.on('pointerover', () => bg.setFillStyle(darken(Number(color))));
          bg.on('pointerout', () => bg.setFillStyle(Number(color)));

          bg.on('pointerdown', onSelect);
          txt.setInteractive({ useHandCursor: true }).on('pointerdown', onSelect);
          options.push({ bg, text: txt });
        }
      } else {
        options.forEach((o) => {
          o.bg.destroy();
          o.text.destroy();
        });
        options.length = 0;
      }
    };

    // no-op: dropdownToggleImpl is used directly for pointer handlers

    Logger.log('StartMenu: Ready');
  }

  private startGame(): void {
    Logger.log('Starting game...');
    // Determine selected mode (default to 'medium') and pass progressionData if available
    const registry = this.registry;
    const mode =
      (registry.get('selectedMode') as string) || (registry.get('gameMode') as string) || 'medium';
    const progressionData = registry.get('progressionData') || null;

    // Start Game scene with initial data payload
    this.scene.start('Game', { gameMode: mode, progressionData });
  }
}
