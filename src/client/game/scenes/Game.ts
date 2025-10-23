import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import GameBoard from '../logic/GameBoard';
import { settings } from '../services/Settings';
import { getMode } from '../config/GameMode';
import { drawDie } from '../visuals/DiceRenderer';
import Logger from '../../utils/Logger';

export class Game extends Scene {
  constructor() {
    super('Game');
  }

  private renderGridPlaceholder(): void {
    const l = (this as any)._layout;
    if (!l) return;

    // We already draw a filled background in updateLayout; overlay cell lines
    // read canonical metrics from layout (set in updateLayout)
    const bm = l.boardMetrics || ({} as any);
    const cols = bm.cols || 10;
    const rows = bm.rows || 20;
    const boardW = bm.boardW ?? Math.max(320, this.scale.width * 0.62 - 40);
    const boardH = bm.boardH ?? Math.max(480, this.scale.height - 80);
    const boardAreaY = bm.boardAreaY ?? 48;

    const cellW = Math.floor(boardW / cols);
    const cellH = Math.floor((boardH - boardAreaY) / rows);

    // helper to compute pixel coordinates for a grid cell (top-left)
    const cellToPixel = (gx: number, gy: number) => ({
      px: gx * cellW + 8,
      py: 48 + gy * cellH,
    });

    // draw grid lines on top (reuse if present)
    if (!l.gridLines) {
      l.gridLines = this.add.graphics();
      l.boardContainer.add(l.gridLines);
    }
    l.gridLines.clear();
    l.gridLines.lineStyle(1, 0x17f64b, 0.5); // rgb(23, 246, 75) at 50% opacity
    for (let x = 0; x <= cols; x++) {
      const px = x * cellW + 8;
      l.gridLines.moveTo(px, 48);
      l.gridLines.lineTo(px, 48 + rows * cellH);
    }
    for (let y = 0; y <= rows; y++) {
      const py = 48 + y * cellH;
      l.gridLines.moveTo(0 + 8, py);
      l.gridLines.lineTo(cols * cellW + 8, py);
    }
    l.gridLines.strokePath();

    // draw active falling piece if present (multi-die support)
    const active: any = (this as any).activePiece;
    Logger.log(
      `Active piece rendering: active=${active ? `${active.shape} at x=${active.x},y=${active.y}` : 'null'}, activeSprites=${l.activeSprites ? l.activeSprites.length : 0}`
    );

    if (active && active.dice) {
      // Ensure activeSprites container exists
      if (!l.activeSprites) {
        l.activeSprites = [];
      }

      // Clear old sprites if count doesn't match
      if (l.activeSprites.length !== active.dice.length) {
        l.activeSprites.forEach((sprite: any) => {
          try {
            sprite.destroy();
          } catch (e) {
            /* ignore */
          }
        });
        l.activeSprites = [];
      }

      // Create or update sprites for each die
      active.dice.forEach((die: any, index: number) => {
        const absoluteX = active.x + die.relativePos.x;
        const absoluteY = active.y + die.relativePos.y;
        const { px, py } = cellToPixel(absoluteX, absoluteY);

        if (!l.activeSprites[index]) {
          Logger.log(`Creating new active sprite ${index} at px=${px}, py=${py}`);
          l.activeSprites[index] = drawDie(
            this,
            px,
            py,
            cellW,
            cellH,
            die
          ) as Phaser.GameObjects.Container | null;
          if (l.activeSprites[index]) {
            l.boardContainer.add(l.activeSprites[index]);
            Logger.log(`Created active sprite ${index}`);
          }
        } else {
          // Move existing sprite
          try {
            l.activeSprites[index].setPosition(px, py);
          } catch (e) {
            Logger.log(`Error moving active sprite ${index}: ` + String(e));
            // Recreate if needed
            try {
              l.activeSprites[index].destroy();
            } catch (e2) {
              /* ignore */
            }
            l.activeSprites[index] = drawDie(
              this,
              px,
              py,
              cellW,
              cellH,
              die
            ) as Phaser.GameObjects.Container | null;
            if (l.activeSprites[index]) {
              l.boardContainer.add(l.activeSprites[index]);
            }
          }
        }
      });
    } else {
      Logger.log('No active piece to render');
      // Clear any existing active sprites
      if (l.activeSprites) {
        l.activeSprites.forEach((sprite: any) => {
          try {
            sprite.destroy();
          } catch (e) {
            /* ignore */
          }
        });
        l.activeSprites = [];
      }
    }

    // Draw locked cells from gameBoard (reuse sprite pool)
    const lg: any = (this as any).gameBoard;
    if (lg) {
      if (!l.cellGroup) {
        l.cellGroup = this.add.container(0, 0);
        l.boardContainer.add(l.cellGroup);
      }
      // Instead of clearing all locked visuals every frame, we assume locked cells
      // are persistent visuals inside l.cellGroup. When a piece gets locked we will
      // reparent the activeSprite into l.cellGroup at the locked cell coords so it
      // remains visible. Here we only ensure already-locked visuals are positioned
      // correctly (in case of resize) by scanning children and snapping them to
      // the grid if they carry a custom data property.
      // We'll also draw any missing locked visuals (for legacy or first-pass).
      const height = lg.state.height;
      const width = lg.state.width;
      // Create a quick map of occupied grid coords -> die for detecting missing visuals
      const occupied = new Map<string, any>();
      for (let y = 0; y < height; y++) {
        const row = lg.state.cells[y];
        if (!row) continue;
        for (let x = 0; x < width; x++) {
          const d = row[x];
          if (d) occupied.set(`${x},${y}`, d);
        }
      }

      // Draw Next piece preview grid (4x4) and piece if present
      if (l.nextMetrics) {
        // Draw 4x4 grid lines in the next piece area
        if (!l.nextGridLines) {
          l.nextGridLines = this.add.graphics();
          l.sideContainer.add(l.nextGridLines);
        }

        l.nextGridLines.clear();
        l.nextGridLines.lineStyle(1, 0x17f64b, 0.5); // Same color as main grid

        const nextGridCols = 4;
        const nextGridRows = 4;
        const nextCellW = Math.floor((l.nextMetrics.nextW as number) / nextGridCols);
        const nextCellH = Math.floor((l.nextMetrics.nextW as number) / nextGridRows); // Square cells
        const nextGridX = l.nextMetrics.nextBgX as number;
        const nextGridY = l.nextMetrics.nextY as number;

        // Draw vertical lines
        for (let x = 0; x <= nextGridCols; x++) {
          const px = nextGridX + x * nextCellW;
          l.nextGridLines.moveTo(px, nextGridY);
          l.nextGridLines.lineTo(px, nextGridY + nextGridRows * nextCellH);
        }

        // Draw horizontal lines
        for (let y = 0; y <= nextGridRows; y++) {
          const py = nextGridY + y * nextCellH;
          l.nextGridLines.moveTo(nextGridX, py);
          l.nextGridLines.lineTo(nextGridX + nextGridCols * nextCellW, py);
        }

        l.nextGridLines.strokePath();

        // Draw next piece in the center of the 4x4 grid (multi-die support)
        const np = (this as any).nextPiece;
        Logger.log(
          `Next piece rendering: nextMetrics=${!!l.nextMetrics}, nextPiece=${np ? `${np.shape} with ${np.dice?.length || 0} dice` : 'null'}`
        );
        if (np && np.dice) {
          // Clear previous next sprites
          if (l.nextSprites) {
            l.nextSprites.forEach((sprite: any) => {
              try {
                sprite.destroy();
              } catch (e) {
                /* ignore */
              }
            });
          }
          l.nextSprites = [];

          // Find bounding box of the piece to center it
          const minX = Math.min(...np.dice.map((die: any) => die.relativePos.x));
          const maxX = Math.max(...np.dice.map((die: any) => die.relativePos.x));
          const minY = Math.min(...np.dice.map((die: any) => die.relativePos.y));
          const maxY = Math.max(...np.dice.map((die: any) => die.relativePos.y));

          const pieceWidth = maxX - minX + 1;
          const pieceHeight = maxY - minY + 1;

          // Center the piece in the 4x4 grid
          const offsetX = (4 - pieceWidth) / 2 - minX;
          const offsetY = (4 - pieceHeight) / 2 - minY;

          // Create sprites for each die in the next piece
          np.dice.forEach((die: any, index: number) => {
            const gridX = die.relativePos.x + offsetX;
            const gridY = die.relativePos.y + offsetY;
            const nx = nextGridX + gridX * nextCellW;
            const ny = nextGridY + gridY * nextCellH;

            Logger.log(`Next piece die ${index} at grid(${gridX}, ${gridY}) pixel(${nx}, ${ny})`);

            const sprite = drawDie(
              this,
              nx,
              ny,
              nextCellW,
              nextCellH,
              die
            ) as Phaser.GameObjects.Container | null;
            if (sprite) {
              l.sideContainer.add(sprite);
              l.nextSprites.push(sprite);
              Logger.log(`Created next sprite ${index}`);
            }
          });

          Logger.log(`Created ${l.nextSprites.length} next piece sprites`);
        } else {
          Logger.log('No next piece to render');
        }
      } else {
        Logger.log('No nextMetrics available for next piece rendering');
      }

      // snap existing children that have a __gridPos data to new positions
      l.cellGroup.each((child: any) => {
        try {
          const meta = child.getData ? child.getData('__gridPos') : undefined;
          if (meta) {
            const { px, py } = cellToPixel(meta.x, meta.y);
            child.setPosition(px, py);
            // mark that this grid cell is satisfied
            occupied.delete(`${meta.x},${meta.y}`);
          } else {
            // If child lacks meta, ignore for now
          }
        } catch (e) {
          /* ignore individual child errors */
        }
      });

      // For any occupied cells that don't have visuals yet, create them
      occupied.forEach((d: any, key: string) => {
        const parts = key.split(',');
        const sx = parts.length > 0 ? Number(parts[0]) : NaN;
        const sy = parts.length > 1 ? Number(parts[1]) : NaN;
        if (Number.isNaN(sx) || Number.isNaN(sy)) return;
        const { px, py } = cellToPixel(sx, sy);
        const spr = drawDie(
          this,
          px,
          py,
          cellW,
          cellH,
          d as any
        ) as Phaser.GameObjects.Container | null;
        if (spr) {
          // tag with grid pos so we can reposition on resize and avoid re-creating
          if ((spr as any).setData) (spr as any).setData('__gridPos', { x: sx, y: sy });
          l.cellGroup.add(spr as any);
        }
      });
    }
  }

  private generateMultiDiePiece(): any {
    // Define piece shapes (relative positions from origin)
    const pieceShapes = [
      // Single die
      { name: 'single', positions: [{ x: 0, y: 0 }] },
      // Line pieces
      {
        name: 'line2',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      },
      {
        name: 'line3',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
      },
      {
        name: 'line4',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
        ],
      },
      // L-shapes
      {
        name: 'L3',
        positions: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
      },
      {
        name: 'L4',
        positions: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: 2 },
          { x: 1, y: 2 },
        ],
      },
      // Square
      {
        name: 'square',
        positions: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
      },
      // T-shape
      {
        name: 'T',
        positions: [
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
      },
    ];

    const diceTypes: number[] = (this.registry.get('gameConfig') as any)?.diceTypes || [6];
    const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'teal', 'gray'];

    // Select random shape
    const shape = pieceShapes[Math.floor(Math.random() * pieceShapes.length)];
    if (!shape) {
      // Fallback to single die if no shape found
      const fallbackShape = { name: 'single', positions: [{ x: 0, y: 0 }] };
      const dice = fallbackShape.positions.map((pos, index) => {
        const sides = diceTypes[Math.floor(Math.random() * diceTypes.length)] || 6;
        const color =
          palette[sides % palette.length || 0] ||
          palette[Math.floor(Math.random() * palette.length)];
        return {
          id: `p-${Date.now()}-${index}`,
          sides,
          number: Math.ceil(Math.random() * sides),
          color,
          relativePos: pos,
        };
      });
      return {
        id: `piece-${Date.now()}`,
        shape: fallbackShape.name,
        dice,
        rotation: 0,
      };
    }

    // Create dice for each position
    const dice = shape.positions.map((pos, index) => {
      const sides = diceTypes[Math.floor(Math.random() * diceTypes.length)] || 6;
      const color =
        palette[sides % palette.length || 0] || palette[Math.floor(Math.random() * palette.length)];
      return {
        id: `p-${Date.now()}-${index}`,
        sides,
        number: Math.ceil(Math.random() * sides),
        color,
        relativePos: pos,
      };
    });

    return {
      id: `piece-${Date.now()}`,
      shape: shape.name,
      dice,
      rotation: 0, // 0, 90, 180, 270 degrees
    };
  }

  private spawnPiece(): void {
    Logger.log('spawnPiece() called');
    const gb: any = (this as any).gameBoard;
    if (!gb) {
      Logger.log('ERROR: No gameBoard in spawnPiece');
      return;
    }

    const w = gb.state.width;
    Logger.log(`Grid width: ${w}`);

    // If there's a nextPiece preview, promote it to active; otherwise generate new
    const next = (this as any).nextPiece;
    let pieceToUse = next || this.generateMultiDiePiece();

    if (next) {
      Logger.log(`Using next piece: ${next.shape} with ${next.dice.length} dice`);
    } else {
      Logger.log('Generated new piece');
    }

    // Position piece at top center
    const x = Math.floor(w / 2) - 1; // Offset for multi-die pieces
    const newActivePiece = {
      ...pieceToUse,
      x,
      y: 0,
    };
    (this as any).activePiece = newActivePiece;
    Logger.log(`Spawned active piece at x=${x}, y=0: ${newActivePiece.shape}`);

    // Generate fresh nextPiece for preview
    (this as any).nextPiece = this.generateMultiDiePiece();
    Logger.log(`Generated next piece: ${(this as any).nextPiece.shape}`);

    // render update
    this.renderGridPlaceholder();
    Logger.log('spawnPiece() completed');
  }

  private stepDrop(): void {
    Logger.log('stepDrop() called');
    const lg: any = (this as any).gameBoard;
    if (!lg) {
      Logger.log('ERROR: No gameBoard found');
      return;
    }

    let active: any = (this as any).activePiece;
    if (!active) {
      Logger.log('No active piece, spawning new one');
      this.spawnPiece();
      return;
    }

    Logger.log(`Active piece at: x=${active.x}, y=${active.y}`);
    const belowY = active.y + 1;
    const h = lg.state.height;

    // Check if piece should lock (multi-die support)
    const shouldLock = !this.canPlacePiece(active, active.x, belowY);
    Logger.log(
      `Checking if piece should lock: belowY=${belowY}, height=${h}, shouldLock=${shouldLock}`
    );

    if (shouldLock) {
      Logger.log(`Locking piece at x=${active.x}, y=${active.y}`);

      // Lock all dice in the multi-die piece
      Logger.log(`Locking ${active.dice.length} dice from piece ${active.shape}`);
      active.dice.forEach((die: any, index: number) => {
        const absoluteX = active.x + die.relativePos.x;
        const absoluteY = active.y + die.relativePos.y;
        const lockResult = lg.lockAt({ x: absoluteX, y: absoluteY }, die);
        Logger.log(
          `Locked die ${index} at (${absoluteX}, ${absoluteY}): matches=${lockResult.matches.length}`
        );
      });

      // Reparent active sprites into locked cell visuals so they don't jump.
      const l = (this as any)._layout;
      if (l && l.activeSprites && l.activeSprites.length > 0) {
        try {
          // Ensure cellGroup exists
          if (!l.cellGroup) {
            l.cellGroup = this.add.container(0, 0);
            l.boardContainer.add(l.cellGroup);
          }

          // Reparent each active sprite to the locked cells
          active.dice.forEach((die: any, index: number) => {
            const sprite = l.activeSprites[index];
            if (sprite) {
              const absoluteX = active.x + die.relativePos.x;
              const absoluteY = active.y + die.relativePos.y;

              // Tag with grid pos for future repositioning
              if ((sprite as any).setData) {
                (sprite as any).setData('__gridPos', { x: absoluteX, y: absoluteY });
              }

              // Move to cellGroup
              l.cellGroup.add(sprite);
              Logger.log(
                `Reparented sprite ${index} to locked cells at (${absoluteX}, ${absoluteY})`
              );
            }
          });

          // Clear the activeSprites array so new ones will be created for the next piece
          l.activeSprites = [];
          Logger.log('Successfully reparented all sprites to locked cells');
        } catch (e) {
          Logger.log('Failed to reparent sprites: ' + String(e));
        }
      }

      (this as any).activePiece = undefined;
      Logger.log('Cleared active piece, about to spawn new one');

      // re-render grid and spawn a new piece
      this.renderGridPlaceholder();
      this.spawnPiece();
      return;
    }

    // otherwise advance piece down
    Logger.log(`Moving piece down from y=${active.y} to y=${active.y + 1}`);
    active.y += 1;
    (this as any).activePiece = active;
    this.renderGridPlaceholder();
  }

  create(): void {
    const { width, height } = this.scale;

    // Set background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Root containers
    this.registry.set('gameSceneReady', true);

    // Create containers for left (board) and right (side panel)
    const root = this.add.container(0, 0);

    // Board group (left)
    const boardContainer = this.add.container(0, 0);
    // Score label (left) and value (right) placeholders (top of board)
    const SCORE_LABEL_SIZE = '28px';
    const scoreLabel = this.add
      .text(0, 0, 'Score:', {
        fontFamily: 'Arial Black',
        fontSize: SCORE_LABEL_SIZE,
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0, 0);

    const scoreValue = this.add
      .text(0, 0, '0', {
        fontFamily: 'Arial Black',
        fontSize: SCORE_LABEL_SIZE,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0);

    // Board area placeholder (will be resized)
    const boardBg = this.add.graphics();
    boardBg.fillStyle(0x0f1720, 1);
    // initial placeholder rect; will be redrawn in updateLayout
    boardBg.fillRect(0, 0, 400, 600);

    // Border graphics for the board group
    const boardBorder = this.add.graphics();

    boardContainer.add([boardBg, boardBorder, scoreLabel, scoreValue]);

    // Side panel (right) - Next Piece + Boosters
    const sideContainer = this.add.container(0, 0);

    // Next label (one size larger)
    const nextLabel = this.add
      .text(0, 0, 'Next Piece', {
        fontFamily: 'Arial Black',
        fontSize: '24px',
        color: '#00ff88',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5, 0);

    // Next piece area placeholder (4x4 grid)
    const nextBg = this.add.graphics();
    nextBg.fillStyle(0x071021, 1);
    nextBg.fillRect(0, 0, 160, 160); // Larger for 4x4 grid
    const nextBorder = this.add.graphics();

    // Boosters grid container (3x3 larger slots)
    const boostersContainer = this.add.container(0, 0);
    const boosterSlots: Phaser.GameObjects.Rectangle[] = [];
    const boosterSlotSize = 128; // Much larger booster icons (2x scale)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const slot = this.add
          .rectangle(
            col * (boosterSlotSize + 8),
            row * (boosterSlotSize + 8),
            boosterSlotSize,
            boosterSlotSize,
            0x000000,
            0.0
          )
          .setStrokeStyle(1, 0x00ff88, 0.25)
          .setOrigin(0, 0);
        boostersContainer.add(slot);
        boosterSlots.push(slot);
      }
    }

    // Border for boosters
    const boostersBorder = this.add.graphics();

    // Control buttons grid (3x2 layout)
    const controlsContainer = this.add.container(0, 0);
    const controlButtons: Phaser.GameObjects.Rectangle[] = [];
    const controlLabels: Phaser.GameObjects.Text[] = [];
    const controlSize = 112; // Much larger control buttons (2x scale)
    const controlGap = 12; // Slightly larger gap too

    // Control button data: [row, col, symbol, action]
    const controlData: Array<[number, number, string, string]> = [
      [0, 0, '↺', 'rotateLeft'], // Rotate Counter-Clockwise
      [0, 1, '⇊', 'softDrop'], // 2-Down Arrows (soft drop)
      [0, 2, '↻', 'rotateRight'], // Rotate Clockwise
      [1, 0, '←', 'moveLeft'], // Move Left
      [1, 1, '⇓', 'hardDrop'], // 3-Down Arrows (hard drop)
      [1, 2, '→', 'moveRight'], // Move Right
    ];

    controlData.forEach(([row, col, symbol, action]) => {
      const x = col * (controlSize + controlGap);
      const y = row * (controlSize + controlGap);

      // Button background
      const button = this.add
        .rectangle(x, y, controlSize, controlSize, 0x1a1a2e, 1.0)
        .setStrokeStyle(2, 0x00ff88, 0.8)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });

      // Button label
      const label = this.add
        .text(x + controlSize / 2, y + controlSize / 2, symbol, {
          fontFamily: 'Arial Black',
          fontSize: '48px', // Larger font for bigger buttons
          color: '#00ff88',
          stroke: '#000000',
          strokeThickness: 2, // Thicker stroke for larger text
        })
        .setOrigin(0.5, 0.5);

      // Store action for later use
      (button as any).controlAction = action;

      controlsContainer.add([button, label]);
      controlButtons.push(button);
      controlLabels.push(label);
    });

    // Border for controls
    const controlsBorder = this.add.graphics();

    // Add children to sideContainer in order
    sideContainer.add([
      nextLabel,
      nextBg,
      nextBorder,
      boostersContainer,
      boostersBorder,
      controlsContainer,
      controlsBorder,
    ]);

    // Add the two major containers to root
    root.add([boardContainer, sideContainer]);

    // Store references for layout update
    (this as any)._layout = {
      root,
      boardContainer,
      boardBg,
      boardBorder,
      scoreLabel,
      scoreValue,
      sideContainer,
      nextLabel,
      nextBg,
      nextBorder,
      nextGridLines: undefined, // Will be created in renderGridPlaceholder
      activeSprites: [], // Array of sprites for multi-die active piece
      nextSprites: [], // Array of sprites for multi-die next piece
      boostersContainer,
      boostersBorder,
      boosterSlots,
      controlsContainer,
      controlsBorder,
      controlButtons,
      controlLabels,
    };

    // Initial layout
    this.updateLayout(width, height);

    // Listen for resize
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
      this.updateLayout(width, height);
    });

    // Add escape key to return to menu
    try {
      const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey?.on('down', () => {
        this.scene.start('StartMenu');
      });
      if (!escKey) {
        window.addEventListener('keydown', (ev) => {
          if ((ev as KeyboardEvent).key === 'Escape') this.scene.start('StartMenu');
        });
      }
    } catch (err) {
      Logger.log('Keyboard setup failed, falling back to window listener ' + String(err));
      window.addEventListener('keydown', (ev) => {
        if ((ev as KeyboardEvent).key === 'Escape') this.scene.start('StartMenu');
      });
    }

    Logger.log('Game scene: Layout initialized');

    // Read selected mode from registry and apply config via GameMode factory
    const selectedMode =
      (this.registry.get('selectedMode') as string) || settings.get('selectedMode') || 'medium';
    const mode = getMode(selectedMode);
    const cfg = mode.getConfig();
    this.registry.set('gameMode', mode.id);
    this.registry.set('gameConfig', cfg);

    // Initialize authoritative game board and render placeholder dice
    const gameBoard = new GameBoard(10, 20);
    // Save board reference
    (this as any).gameBoard = gameBoard;

    // Spawn an initial piece and start the timed drop according to config
    Logger.log('About to spawn initial piece and start timer');
    this.spawnPiece();
    const cfgAny: any = cfg;
    const ms = Number(cfgAny?.fallSpeed) || 800;
    Logger.log(`Setting up drop timer with ${ms}ms delay`);

    // clear previous timer if any
    if ((this as any).dropTimer) {
      Logger.log('Removing existing timer');
      (this as any).dropTimer.remove(false);
    }

    (this as any).dropTimer = this.time.addEvent({
      delay: ms,
      callback: () => this.stepDrop(),
      loop: true,
    });
    Logger.log('Drop timer created successfully');

    // Set up control button handlers
    this.setupControlHandlers();

    // Render an initial empty grid placeholder (draw cell outlines)
    this.renderGridPlaceholder();
  }

  private updateLayout(width: number, height: number): void {
    const l = (this as any)._layout;
    if (!l) return;

    // Layout math
    const padding = 20;
    const leftWidth = Math.floor(width * 0.62);

    // Board area
    const boardX = padding;
    const boardY = padding;
    const boardW = leftWidth - padding;
    const boardH = height - padding * 2;

    // persist canonical board metrics for rendering to consume
    if (!l.boardMetrics) l.boardMetrics = {};
    l.boardMetrics.boardW = boardW;
    l.boardMetrics.boardH = boardH;
    l.boardMetrics.cols = 10;
    l.boardMetrics.rows = 20;

    l.boardContainer.setPosition(boardX, boardY);

    // Score at top inside board: left label and right-aligned value
    const scorePadding = 12;
    const scoreLabelX = 12;
    const scoreLabelY = 8;
    l.scoreLabel.setPosition(scoreLabelX, scoreLabelY);
    const scoreValueX = boardW - scorePadding;
    l.scoreValue.setPosition(scoreValueX, scoreLabelY);

    // Board background under score
    l.boardBg.clear();
    l.boardBg.fillStyle(0x071021, 1);
    const boardAreaY = 48; // leave space for score
    l.boardMetrics.boardAreaY = boardAreaY;
    l.boardBg.fillRect(0, boardAreaY, boardW, boardH - boardAreaY);

    // Board border - removed since grid lines provide sufficient visual structure

    // Side container position
    const sideX = boardX + leftWidth + padding;
    const sideY = padding;
    l.sideContainer.setPosition(sideX, sideY);

    // Compute right panel width available for side content
    const rightPanelWidth = Math.max(0, width - sideX - padding);

    // Next label centered vertically aligned with score label; Next piece top aligns with board area top
    const nextLabelY = scoreLabelY;
    l.nextLabel.setPosition(rightPanelWidth / 2, nextLabelY);

    // Next piece area: align top with board area Y so it lines up with grid (4x4 grid)
    const nextY = boardAreaY;
    l.nextBg.clear();
    l.nextBg.fillStyle(0x071021, 1);
    const nextW = Math.min(180, rightPanelWidth - 40); // Larger for 4x4 grid
    const nextBgX = Math.max(0, Math.floor((rightPanelWidth - nextW) / 2));
    l.nextBg.fillRect(nextBgX, nextY, nextW, nextW);
    l.nextBorder.clear();
    l.nextBorder.lineStyle(2, 0x00ff88, 0.25);
    l.nextBorder.strokeRect(nextBgX - 4, nextY - 4, nextW + 8, nextW + 8);
    // store next-panel metrics for renderer
    l.nextMetrics = { nextBgX, nextW, nextY };

    // Boosters group below next piece
    const boostersY = nextY + nextW + 20;

    // Calculate boosters grid sizing (larger icons)
    const boosterCols = 3;
    const boosterRows = 3;
    const boosterGap = 12; // Larger gap for bigger icons
    const boosterSlotSize = 128; // Much larger size (2x scale)

    const boostersW = boosterCols * boosterSlotSize + (boosterCols - 1) * boosterGap;
    const boostersH = boosterRows * boosterSlotSize + (boosterRows - 1) * boosterGap;
    const boostersX = Math.max(0, Math.floor((rightPanelWidth - boostersW) / 2));

    l.boostersContainer.setPosition(boostersX, boostersY);

    // Update individual booster slots to new size and positions
    l.boosterSlots.forEach((slot: Phaser.GameObjects.Rectangle, idx: number) => {
      const col = idx % boosterCols;
      const row = Math.floor(idx / boosterCols);
      slot.setSize(boosterSlotSize, boosterSlotSize);
      slot.setPosition(col * (boosterSlotSize + boosterGap), row * (boosterSlotSize + boosterGap));
    });

    // boosters border (global coords)
    l.boostersBorder.clear();
    l.boostersBorder.lineStyle(2, 0x00ff88, 0.25);
    const borderGlobalX = sideX + boostersX - 4;
    const borderGlobalY = sideY + boostersY - 4;
    l.boostersBorder.strokeRect(borderGlobalX, borderGlobalY, boostersW + 8, boostersH + 8);

    // Controls group below boosters
    const controlsY = boostersY + boostersH + 20;
    const controlSize = 112; // Much larger control buttons (2x scale)
    const controlGap = 12; // Larger gap for bigger buttons
    const controlCols = 3;
    const controlRows = 2;

    const controlsW = controlCols * controlSize + (controlCols - 1) * controlGap;
    const controlsH = controlRows * controlSize + (controlRows - 1) * controlGap;
    const controlsX = Math.max(0, Math.floor((rightPanelWidth - controlsW) / 2));

    l.controlsContainer.setPosition(controlsX, controlsY);

    // Update control button positions and sizes
    l.controlButtons.forEach((button: Phaser.GameObjects.Rectangle, idx: number) => {
      const col = idx % controlCols;
      const row = Math.floor(idx / controlCols);
      const x = col * (controlSize + controlGap);
      const y = row * (controlSize + controlGap);

      button.setSize(controlSize, controlSize);
      button.setPosition(x, y);

      // Update corresponding label position
      const label = l.controlLabels[idx];
      if (label) {
        label.setPosition(x + controlSize / 2, y + controlSize / 2);
      }
    });

    // controls border (global coords)
    l.controlsBorder.clear();
    l.controlsBorder.lineStyle(2, 0x00ff88, 0.25);
    const controlBorderGlobalX = sideX + controlsX - 4;
    const controlBorderGlobalY = sideY + controlsY - 4;
    l.controlsBorder.strokeRect(
      controlBorderGlobalX,
      controlBorderGlobalY,
      controlsW + 8,
      controlsH + 8
    );
    // Update root position to (0,0) - already set
  }

  private setupControlHandlers(): void {
    const l = (this as any)._layout;
    if (!l || !l.controlButtons) return;

    l.controlButtons.forEach((button: any) => {
      button.on('pointerdown', () => {
        const action = button.controlAction;
        Logger.log(`Control button pressed: ${action}`);
        this.handleControlAction(action);
      });

      // Visual feedback
      button.on('pointerover', () => {
        button.setStrokeStyle(2, 0x00ff88, 1.0);
      });

      button.on('pointerout', () => {
        button.setStrokeStyle(2, 0x00ff88, 0.8);
      });
    });
  }

  private handleControlAction(action: string): void {
    const active = (this as any).activePiece;
    if (!active) return;

    Logger.log(`Handling control action: ${action}`);

    switch (action) {
      case 'moveLeft':
        this.movePiece(-1, 0);
        break;
      case 'moveRight':
        this.movePiece(1, 0);
        break;
      case 'softDrop':
        this.movePiece(0, 1);
        break;
      case 'hardDrop':
        this.hardDrop();
        break;
      case 'rotateLeft':
        this.rotatePiece(-1);
        break;
      case 'rotateRight':
        this.rotatePiece(1);
        break;
    }
  }

  private movePiece(dx: number, dy: number): void {
    const active = (this as any).activePiece;
    const lg = (this as any).gameBoard;
    if (!active || !lg) return;

    const newX = active.x + dx;
    const newY = active.y + dy;

    // Check if the new position is valid for multi-die piece
    if (this.canPlacePiece(active, newX, newY)) {
      active.x = newX;
      active.y = newY;
      this.renderGridPlaceholder();
      Logger.log(`Moved piece to x=${newX}, y=${newY}`);
    } else {
      Logger.log(`Cannot move piece to x=${newX}, y=${newY} - blocked`);
    }
  }

  private hardDrop(): void {
    const active = (this as any).activePiece;
    const lg = (this as any).gameBoard;
    if (!active || !lg) return;

    // Find the lowest valid position
    let dropY = active.y;
    while (dropY + 1 < lg.state.height && lg.isEmpty(active.x, dropY + 1)) {
      dropY++;
    }

    active.y = dropY;
    Logger.log(`Hard dropped piece to y=${dropY}`);

    // Force immediate lock by calling stepDrop
    this.stepDrop();
  }

  private rotateMatrix(
    positions: Array<{ x: number; y: number }>,
    clockwise: boolean
  ): Array<{ x: number; y: number }> {
    if (positions.length === 0) return positions;

    // Find bounding box to determine matrix size
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y));

    // Use largest dimension for square matrix
    const size = Math.max(maxX - minX + 1, maxY - minY + 1);

    // Normalize positions to 0-based matrix
    const normalized = positions.map((p) => ({
      x: p.x - minX,
      y: p.y - minY,
    }));

    // Rotate around center of square matrix
    const center = (size - 1) / 2;
    const rotated = normalized.map((p) => {
      const relX = p.x - center;
      const relY = p.y - center;

      let newX, newY;
      if (clockwise) {
        // 90° clockwise: (x,y) -> (-y, x)
        newX = -relY + center;
        newY = relX + center;
      } else {
        // 90° counter-clockwise: (x,y) -> (y, -x)
        newX = relY + center;
        newY = -relX + center;
      }

      return {
        x: Math.round(newX),
        y: Math.round(newY),
      };
    });

    // Find the lowest Y position in the rotated piece
    const rotatedMinY = Math.min(...rotated.map((p) => p.y));
    const originalMinY = Math.min(...normalized.map((p) => p.y));

    // Adjust Y positions to maintain the same lowest point
    const yOffset = originalMinY - rotatedMinY;

    // Convert back to absolute positions
    return rotated.map((p) => ({
      x: p.x + minX,
      y: p.y + minY + yOffset,
    }));
  }

  private canPlacePiece(
    piece: any,
    newX: number,
    newY: number,
    newPositions?: Array<{ x: number; y: number }>
  ): boolean {
    const gb = (this as any).gameBoard;
    if (!gb) return false;

    const positions =
      newPositions ||
      piece.dice.map((die: any) => ({
        x: die.relativePos.x,
        y: die.relativePos.y,
      }));

    // Check each die position
    for (const pos of positions) {
      const absoluteX = newX + pos.x;
      const absoluteY = newY + pos.y;

      // Check bounds
      if (
        absoluteX < 0 ||
        absoluteX >= gb.state.width ||
        absoluteY < 0 ||
        absoluteY >= gb.state.height
      ) {
        return false;
      }

      // Check collision with existing pieces
      if (!gb.isEmpty(absoluteX, absoluteY)) {
        return false;
      }
    }

    return true;
  }

  private rotatePiece(direction: number): void {
    const active = (this as any).activePiece;
    if (!active || !active.dice) {
      Logger.log('No active multi-die piece to rotate');
      return;
    }

    Logger.log(`Rotating piece ${direction > 0 ? 'clockwise' : 'counter-clockwise'}`);

    // Get current relative positions
    const currentPositions = active.dice.map((die: any) => die.relativePos);

    // Calculate rotated positions
    const rotatedPositions = this.rotateMatrix(currentPositions, direction > 0);

    // Check if rotation is valid
    if (this.canPlacePiece(active, active.x, active.y, rotatedPositions)) {
      // Apply rotation
      active.dice.forEach((die: any, index: number) => {
        die.relativePos = rotatedPositions[index];
      });

      // Update rotation angle for reference
      active.rotation = (active.rotation + (direction > 0 ? 90 : -90) + 360) % 360;

      this.renderGridPlaceholder();
      Logger.log(`Piece rotated successfully to ${active.rotation}°`);
    } else {
      Logger.log('Rotation blocked - would cause collision or go out of bounds');
    }
  }

  override update(): void {
    // Game loop will go here
  }
}
