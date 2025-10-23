// Kiro-Pseudocode.txt
// Comprehensive Modular Pseudocode for Dicetrix Implementation
// Designed for Phaser 3, TypeScript, Vite, Devvit (Reddit Integration)
// Structure: Modular classes/modules with atomic details built upwards.
// Logical Pattern: 
// - Start with core utilities and models (atomic data structures).
// - Build game logic controllers and managers.
// - Integrate visuals, audio, UI in layers.
// - Add integration and optimization last.
// - Use dependency injection, interfaces for modularity to reduce technical debt.
// - Each class has init, update, destroy methods where applicable.
// - Follow Phaser best practices: Scenes for state, GameObjects for entities.
// - TypeScript: Strong typing, enums, generics.
// - Devvit: Use Reddit API, Redis for leaderboards, secure auth.
// - Reduce refactoring: Encapsulate details in methods, use events for loose coupling.

// SECTION 1: Project Setup and Foundation
// Module: setup.ts
initializeProject() {
  // Use npm create devvit@latest --template=phaser
  // Configure TypeScript: tsconfig.json with strict typing, target ES2020
  // Vite config: vite.config.ts with Phaser plugin, asset optimization
  // ESLint: .eslintrc with TypeScript rules, no-any, prefer-const
  // Folder Structure:
  // /src/client/game/
  //   - scenes/ (Boot, Preloader, Menu, Game, GameOver)
  //   - models/ (Grid, Piece, Die, etc.)
  //   - controllers/ (GameStateController, InputManager, etc.)
  //   - ui/ (GameHUD, MenuUI, etc.)
  //   - audio/ (AudioManager)
  // devvit.json: Add permissions for reddit:use, redis:use, ui:webview
}

// SECTION 2: Scene Flow Management
// Module: scenes/index.ts
class SceneManager {
  private phaser: Phaser.Game; // Injected via constructor

  initScenes() {
    // Boot Scene: Initialize Phaser config (width, height responsive, parent 'game')
    // Preloader Scene: Load assets with progress bar
    // Menu Scene: Mode selection, volume controls
    // Game Scene: Main gameplay loop
    // GameOver Scene: Score breakdown, restart/menu buttons
    this.phaser.scene.add('Boot', BootScene);
    this.phaser.scene.add('Preloader', PreloaderScene);
    // ... add others
    this.phaser.scene.start('Boot');
  }

  transitionTo(sceneKey: string, data?: object) {
    this.phaser.scene.start(sceneKey, data); // Smooth transitions with fade if needed
  }
}

// Class: scenes/PreloaderScene.ts extends Phaser.Scene
class PreloaderScene {
  preload() {
    // Load all assets from REQUIRED MEDIA ASSET LIST (dice sprites, audio, etc.)
    // Use texture atlas for dice_tints.png, particle_spritesheet.png
    // Optimize: Total < 20MB, use PNG for visuals, MP3/OGG for audio
    // Show progress bar using loading_bar.png
    this.load.image('dice_d4', 'assets/dice_d4.png');
    // ... load all dice, wild, black, patterns, grid_bg, particles, logo, ui elements, fonts
    this.load.audio('sfx_move', 'assets/sfx_move.mp3');
    // ... load all SFX, BGM, optional bgm_zen_mode
  }

  create() {
    // Transition to Menu after load
    this.scene.start('Menu');
  }
}

// SECTION 3: Grid System (Authoritative Board)
// Module: models/Grid.ts
interface GridCell {
  die?: Die; // Null if empty
}

class Grid {
  private width: number = 10;
  private height: number = 20;
  private cells: GridCell[][]; // 2D array [row][col]

  constructor() {
    this.cells = Array.from({length: this.height}, () => Array(this.width).fill({}));
  }

  // Atomic: Coordinate system (0,0 top-left, y increases down)
  getCell(x: number, y: number): GridCell | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.cells[y][x];
  }

  setCell(x: number, y: number, die: Die) {
    if (this.isValidPosition(x, y)) this.cells[y][x].die = die;
  }

  // Collision detection: Check if position occupied or out of bounds
  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height && !this.cells[y][x].die;
  }

  // Boundary validation for pieces
  validatePiece(piece: Piece): boolean {
    for (let die of piece.dice) {
      let absX = piece.position.x + die.relativeX;
      let absY = piece.position.y + die.relativeY;
      if (!this.isValidPosition(absX, absY)) return false;
    }
    return true;
  }

  // Debug overlay: Render grid state visually (toggle-hidden in production)
  renderDebug(graphics: Phaser.GameObjects.Graphics) {
    // Draw grid lines, cell values
  }

  // Integration with visuals: Use grid_bg.png as background
}

// SECTION 4: Piece and Die Systems
// Module: models/Die.ts
enum DieType { D4, D6, D8, D10, D12, D20, WILD, BLACK }

class Die {
  public type: DieType;
  public value: number; // 1- faces, or special for wild/black
  public color: string; // For boosters, tinting
  public isWild: boolean = false;
  public isBlack: boolean = false;

  constructor(type: DieType) {
    this.type = type;
    this.value = this.generateValue(); // Random based on type, per mode
    if (type === DieType.WILD) this.isWild = true;
    if (type === DieType.BLACK) this.isBlack = true;
  }

  private generateValue(): number {
    // Based on type: d4=1-4, etc.
    // Mode-specific: Random die types per difficulty
  }

  // Visuals: Gold accent for wild, matte black for black
  // Colorblind: Use die_patterns.png overlays
}

// Module: models/Piece.ts
enum PieceShape { I, O, T, L, J, S, Z, PLUS } // All base shapes

class Piece {
  public shape: PieceShape;
  public dice: Die[]; // Matrix-based structure, e.g., 4 dice for tetromino-like
  public position: {x: number, y: number};
  public rotation: number = 0;

  constructor(shape: PieceShape, mode: GameMode) {
    this.shape = shape;
    this.dice = this.generateDice(mode); // Assign values on spawn
    this.position = {x: Math.floor(grid.width / 2) - 1, y: 0}; // Spawn position
  }

  private generateDice(mode: GameMode): Die[] {
    // Create 2-5 dice based on shape (e.g., I=4 vertical)
    // Assign random types/values per mode (e.g., more wild in Easy)
    // Include black die mechanic: Random chance to include black die removing boosters
  }

  rotate(clockwise: boolean) {
    // Update relative positions of dice in matrix
    // Validate with grid
  }

  move(dx: number, dy: number) {
    // Update position, validate collision/boundaries
  }
}

// SECTION 5: Input Management
// Module: controllers/InputManager.ts
class InputManager {
  private scene: Phaser.Scene;
  private keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  private pointer: Phaser.Input.Pointer;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.keyboard = scene.input.keyboard;
  }

  init() {
    // Keyboard: arrows for move, space for hard drop, escape for pause
    // Touch: Swipe left/right/down, tap for rotate
    // Responsive: Consistent on desktop/mobile
  }

  update() {
    // Poll inputs, emit events: 'move_left', 'rotate', 'hard_drop'
    if (this.keyboard.isDown(Phaser.Input.Keyboard.KeyCodes.LEFT)) {
      eventEmitter.emit('move', -1, 0);
    }
    // Handle gestures: Swipe detection with velocity thresholds
  }
}

// SECTION 6: Game State Controller
// Module: controllers/GameStateController.ts
enum GameState { SPAWN, DROP_CONTROL, LOCK, MATCH, CLEAR_MATCH, CASCADE, GAME_OVER }

class GameStateController {
  private currentState: GameState = GameState.SPAWN;
  private grid: Grid;
  private activePiece: Piece;
  private nextPiece: Piece;
  private fallTimer: Phaser.Time.TimerEvent;
  private lockDelay: number = 0.4; // Seconds

  constructor(scene: Phaser.Scene, mode: GameMode) {
    // Init with mode: Adjust fall speed, die types
  }

  update(delta: number) {
    switch (this.currentState) {
      case GameState.SPAWN:
        this.spawnPiece();
        this.transitionTo(GameState.DROP_CONTROL);
        break;
      case GameState.DROP_CONTROL:
        // Handle inputs: move, rotate, drop
        // Auto-fall based on mode speed
        // If grounded, start lock delay timer
        break;
      case GameState.LOCK:
        this.lockPiece();
        this.transitionTo(GameState.MATCH);
        break;
      // ... other states
      case GameState.GAME_OVER:
        // Check top row overflow, transition to GameOver scene
        break;
    }
  }

  private spawnPiece() {
    this.activePiece = this.nextPiece || new Piece(randomShape(), mode);
    this.nextPiece = new Piece(randomShape(), mode);
    // Display next piece in HUD
  }

  private lockPiece() {
    // Transfer dice to grid, apply positions
    // Hard drop: Instant lock, score bonus
  }

  transitionTo(newState: GameState) {
    this.currentState = newState;
    // Emit events for visuals/audio
  }
}

// SECTION 7: Matching and Cascading
// Module: controllers/MatchProcessor.ts
class MatchProcessor {
  processMatches(grid: Grid) {
    // 4-directional flood-fill: Check adjacent same-value (or wild joins any)
    // Min 3 same-number dice to match
    // Wild: Joins any match, gold visuals
    // Return matched groups
  }

  clearMatches(matches: Die[][]) {
    // Remove dice from grid
    // Trigger particles, SFX (sfx_match_small/large based on size)
    // Activate boosters from color-based matches (Red-Cyan effects)
  }
}

// Module: controllers/CascadeManager.ts
class CascadeManager {
  applyCascade(grid: Grid) {
    // Apply gravity: Drop dice above cleared spaces
    // Re-check matches, up to 10 iterations max (prevent infinite)
    // Chain multipliers for scoring
    // Visuals: Animation easing, chained effects
  }
}

// SECTION 8: Scoring and Boosters
// Enum: BoosterType { RED, ORANGE, YELLOW, GREEN, BLUE, INDIGO, CYAN } // Color-based

interface Booster {
  type: BoosterType;
  duration: number; // Seconds, track with countdown
  effect: () => void; // e.g., Red: Extra score, etc.
}

class BoosterManager {
  private activeBoosters: Booster[] = [];
  private hudIndicators: Phaser.GameObjects.Group;

  activate(booster: Booster) {
    this.activeBoosters.push(booster);
    // HUD: Show icons with countdown rings
    // SFX: sfx_booster_activate
    // Black die: Remove active boosters on lock
  }

  update(delta: number) {
    // Tick durations, expire (sfx_booster_expire)
    // Apply effects in scoring
  }
}

class ScoreManager {
  private score: number = 0;
  private chain: number = 0;

  calculate(clearSize: number, chain: number, boosters: Booster[]) {
    // Base * chain * booster multipliers
    // Ultimate combo: sfx_ultimate_combo for large chains
    // Update HUD immediately
  }

  getScore(): number { return this.score; }
}

// Game Modes
enum GameMode { EASY, MEDIUM, HARD, EXPERT, ZEN } // Config: Fall speed, die types, boosters

// SECTION 9: Visuals and Rendering
// Module: visuals/DiceRenderer.ts
class DiceRenderer {
  render(die: Die, x: number, y: number, scene: Phaser.Scene): Phaser.GameObjects.Sprite {
    let sprite = scene.add.sprite(x, y, getTextureKey(die.type));
    // Apply color tinting, number overlays (text or image)
    // Wild: gold accent, Black: matte
    // Colorblind: Add patterns
    return sprite;
  }
}

// Module: visuals/ParticleEffects.ts
class ParticleEffects {
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[];

  init(scene: Phaser.Scene) {
    // Optimized emitters for clears (explosions), cascades (sparks), boosters (glows)
    // Cap dynamically if FPS <50
    // Use particle_spritesheet.png
  }

  trigger(type: string, x: number, y: number) {
    // Emit at position, chain for heavy cascades without stacking
  }
}

// Module: visuals/AnimationManager.ts
class AnimationManager {
  animateMovement(piece: Piece, from: Pos, to: Pos) {
    // Easing for drops, rotates
    // Chained for cascades
  }
}

// SECTION 10: Audio Management
// Module: audio/AudioManager.ts
class AudioManager {
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private bgm: Phaser.Sound.BaseSound;

  init(scene: Phaser.Scene) {
    // Load categorized: SFX (move, rotate, lock, match, cascade, booster), UI (click), BGM (menu_loop, game_loop, zen)
    // Limit concurrent voices to 8
  }

  play(key: string, config?: object) {
    // Trigger at events: e.g., sfx_lock on lock
    // Volume controls in Menu
  }

  playBGM(mode: GameMode) {
    // Loop menu/game, ambient for Zen
  }
}

// SECTION 11: User Interface
// Module: ui/GameHUD.ts
class GameHUD {
  private elements: Phaser.GameObjects.Group;

  init(scene: Phaser.Scene) {
    // Score text, next piece preview_box, booster icons_boosters.png with timers
    // Mode indicator
    // Use hud_panel.png
    // Responsive: Scale for mobile/desktop, portrait/landscape
  }

  update(score: number, nextPiece: Piece, boosters: Booster[]) {
    // Real-time updates
  }
}

// Module: ui/MenuUI.ts
class MenuUI {
  // Mode buttons (ui_button_primary), volume sliders (ui_slider)
  // Toggle ui_toggle for options
}

// Module: ui/GameOverUI.ts
class GameOverUI {
  // Score breakdown text
  // Restart/menu buttons (ui_button_secondary)
}

// Module: ui/ResponsiveUISystem.ts
class ResponsiveUISystem {
  resize(width: number, height: number) {
    // Scale elements, maintain readability
    // Target 60 FPS desktop, 40+ mobile
  }
}

// SECTION 12: Reddit Integration and Leaderboards
// Module: integration/RedditIntegration.ts (Server-side in Devvit)
class RedditIntegration {
  private reddit: Devvit.RedditAPI;
  private redis: Devvit.Redis;

  init() {
    // OAuth for authentication
    // Endpoints: /api/update-score, /api/get-leaderboard, /api/share-score
  }

  async updateScore(mode: GameMode, score: number, userId: string) {
    // Secure verification: Check auth, prevent duplicates/invalids
    // Store in Redis per-mode leaderboards
    // Offline: Queue in local storage, sync on connect
  }

  async getLeaderboard(mode: GameMode): Promise<ScoreEntry[]> {
    // Top 10 per mode
  }

  shareScore(score: number, thumbnail?: string) {
    // Post formatted text to subreddit, optional share_thumbnail_template.png
  }
}

// UI: Leaderboard panel showing top 10

// SECTION 13: Playtest Launch Preparation
// Module: build.ts
buildProduction() {
  // npm run build: Package for Devvit, itch.io zip backup
  // Finalize all assets, remove debug
  // Quality check: Visuals, input, performance
  // Balance difficulties: Test each mode
  // Upload to Devvit, verify in-post playable
}

// SECTION 14: Performance and Testing
// Global Optimizations:
useObjectPool(Die, 200); // Reuse dice instances
monitorFPS() {
  if (fps < 50) reduceParticles();
}
// Testing: 
// - Cascades <=10 iterations
// - Boosters expire correctly
// - Grid sync after clears
// - No memory leaks (monitor heap after games)
// - Leaderboard under latency

// SECTION 15: Event System for Loose Coupling
// Use Phaser.Events.EventEmitter for 'match_found', 'booster_activated', 'score_updated', etc.
// Reduces refactoring by decoupling logic from visuals/audio/UI

// Overall Game Entry: index.ts
main() {
  const config: Phaser.Types.Core.GameConfig = { /* responsive, etc. */ };
  const game = new Phaser.Game(config);
  // Inject dependencies, start SceneManager
}
