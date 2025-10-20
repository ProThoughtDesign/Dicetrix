import { Scene } from 'phaser';
import { TouchControls } from './TouchControls.js';

/**
 * Input configuration for customizable controls
 */
export interface InputConfig {
  moveLeftKey: string;
  moveRightKey: string;
  moveDownKey: string;
  rotateKey: string;
  hardDropKey: string;
  pauseKey: string;
  
  // Touch sensitivity settings
  swipeThreshold: number;
  tapTimeout: number;
  doubleTapTimeout: number;
  
  // Timing settings
  autoRepeatDelay: number;
  autoRepeatRate: number;
  softDropRate: number;
}

/**
 * Default input configuration
 */
export const DEFAULT_INPUT_CONFIG: InputConfig = {
  moveLeftKey: 'LEFT',
  moveRightKey: 'RIGHT',
  moveDownKey: 'DOWN',
  rotateKey: 'UP',
  hardDropKey: 'SPACE',
  pauseKey: 'ESC',
  
  swipeThreshold: 50,
  tapTimeout: 200,
  doubleTapTimeout: 300,
  
  autoRepeatDelay: 150,
  autoRepeatRate: 50,
  softDropRate: 50
};

/**
 * Touch gesture types
 */
export type TouchGesture = 'tap' | 'swipe_left' | 'swipe_right' | 'swipe_down' | 'swipe_up' | 'double_tap';

/**
 * Input event interface
 */
export interface InputEvent {
  type: 'move_left' | 'move_right' | 'move_down' | 'rotate' | 'hard_drop' | 'pause';
  timestamp: number;
  source: 'keyboard' | 'touch';
}

/**
 * InputManager handles all user input for the Dicetrix game
 * Supports both keyboard and touch controls with customizable settings
 */
export class InputManager {
  private scene: Scene;
  private config: InputConfig;
  
  // Keyboard input
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  
  // Touch input
  private touchStartPos: { x: number; y: number } | null = null;
  private touchStartTime: number = 0;
  private lastTapTime: number = 0;
  private isPointerDown: boolean = false;
  private touchControls: TouchControls;
  
  // Auto-repeat for held keys
  private heldKeys: Set<string> = new Set();
  private keyHoldTimers: Map<string, number> = new Map();
  private keyRepeatTimers: Map<string, number> = new Map();
  
  // Input validation
  private lastInputTime: number = 0;
  private inputCooldown: number = 50; // Minimum time between inputs (ms)
  
  // Event callbacks
  private inputCallbacks: Map<string, (event: InputEvent) => void> = new Map();
  
  constructor(scene: Scene, config: Partial<InputConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_INPUT_CONFIG, ...config };
    
    this.setupKeyboard();
    this.setupTouch();
    this.setupTouchControls();
  }

  /**
   * Setup keyboard input handling
   */
  private setupKeyboard(): void {
    if (!this.scene.input.keyboard) {
      console.warn('Keyboard input not available');
      return;
    }

    // Create cursor keys
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // Create additional keys
    const keyNames = [
      this.config.rotateKey,
      this.config.hardDropKey,
      this.config.pauseKey
    ];
    
    keyNames.forEach(keyName => {
      try {
        if (this.scene.input.keyboard) {
          const key = this.scene.input.keyboard.addKey(keyName);
          if (key) {
            this.keys[keyName] = key;
          
            // Setup key down handler
            key.on('down', () => this.handleKeyDown(keyName));
            key.on('up', () => this.handleKeyUp(keyName));
          }
        }
      } catch (error) {
        console.warn(`Failed to create key: ${keyName}`, error);
      }
    });
    
    // Setup cursor key handlers
    if (this.cursors) {
      this.cursors.left.on('down', () => this.handleKeyDown('LEFT'));
      this.cursors.left.on('up', () => this.handleKeyUp('LEFT'));
      
      this.cursors.right.on('down', () => this.handleKeyDown('RIGHT'));
      this.cursors.right.on('up', () => this.handleKeyUp('RIGHT'));
      
      this.cursors.down.on('down', () => this.handleKeyDown('DOWN'));
      this.cursors.down.on('up', () => this.handleKeyUp('DOWN'));
      
      this.cursors.up.on('down', () => this.handleKeyDown('UP'));
      this.cursors.up.on('up', () => this.handleKeyUp('UP'));
    }
  }

  /**
   * Setup touch input handling
   */
  private setupTouch(): void {
    // Pointer down event
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });
    
    // Pointer up event
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerUp(pointer);
    });
    
    // Pointer move event (for swipe detection)
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer);
    });
  }

  /**
   * Setup visual touch controls
   */
  private setupTouchControls(): void {
    this.touchControls = new TouchControls(this.scene);
    
    // Connect touch control actions to input events
    this.touchControls.onAction((action) => {
      let eventType: InputEvent['type'] | null = null;
      
      switch (action) {
        case 'move_left':
          eventType = 'move_left';
          break;
        case 'move_right':
          eventType = 'move_right';
          break;
        case 'move_down':
          eventType = 'move_down';
          break;
        case 'rotate':
          eventType = 'rotate';
          break;
        case 'hard_drop':
          eventType = 'hard_drop';
          break;
      }
      
      if (eventType && this.canProcessInput()) {
        this.emitInputEvent({
          type: eventType,
          timestamp: Date.now(),
          source: 'touch'
        });
      }
    });
  }

  /**
   * Handle key down events
   */
  private handleKeyDown(keyName: string): void {
    if (this.heldKeys.has(keyName)) {
      return; // Already being held
    }
    
    this.heldKeys.add(keyName);
    
    // Immediate action
    this.processKeyInput(keyName);
    
    // Setup auto-repeat for movement keys
    if (this.isMovementKey(keyName)) {
      const holdTimer = this.scene.time.delayedCall(this.config.autoRepeatDelay, () => {
        this.startKeyRepeat(keyName);
      });
      this.keyHoldTimers.set(keyName, holdTimer.delay);
    }
  }

  /**
   * Handle key up events
   */
  private handleKeyUp(keyName: string): void {
    this.heldKeys.delete(keyName);
    
    // Clear timers
    const holdTimer = this.keyHoldTimers.get(keyName);
    if (holdTimer) {
      this.scene.time.removeEvent({ delay: holdTimer } as any);
      this.keyHoldTimers.delete(keyName);
    }
    
    const repeatTimer = this.keyRepeatTimers.get(keyName);
    if (repeatTimer) {
      this.scene.time.removeEvent({ delay: repeatTimer } as any);
      this.keyRepeatTimers.delete(keyName);
    }
  }

  /**
   * Start auto-repeat for held keys
   */
  private startKeyRepeat(keyName: string): void {
    if (!this.heldKeys.has(keyName)) {
      return;
    }
    
    this.processKeyInput(keyName);
    
    // Schedule next repeat
    const repeatTimer = this.scene.time.delayedCall(this.config.autoRepeatRate, () => {
      this.startKeyRepeat(keyName);
    });
    this.keyRepeatTimers.set(keyName, repeatTimer.delay);
  }

  /**
   * Process keyboard input and emit events
   */
  private processKeyInput(keyName: string): void {
    if (!this.canProcessInput()) {
      return;
    }
    
    let eventType: InputEvent['type'] | null = null;
    
    switch (keyName) {
      case 'LEFT':
        eventType = 'move_left';
        break;
      case 'RIGHT':
        eventType = 'move_right';
        break;
      case 'DOWN':
        eventType = 'move_down';
        break;
      case 'UP':
        eventType = 'rotate';
        break;
      case this.config.hardDropKey:
        eventType = 'hard_drop';
        break;
      case this.config.pauseKey:
        eventType = 'pause';
        break;
    }
    
    if (eventType) {
      this.emitInputEvent({
        type: eventType,
        timestamp: Date.now(),
        source: 'keyboard'
      });
    }
  }

  /**
   * Handle pointer down events
   */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.isPointerDown = true;
    this.touchStartPos = { x: pointer.x, y: pointer.y };
    this.touchStartTime = Date.now();
  }

  /**
   * Handle pointer up events
   */
  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isPointerDown || !this.touchStartPos) {
      return;
    }
    
    this.isPointerDown = false;
    
    const endPos = { x: pointer.x, y: pointer.y };
    const endTime = Date.now();
    const duration = endTime - this.touchStartTime;
    
    // Detect gesture type
    const gesture = this.detectTouchGesture(this.touchStartPos, endPos, duration);
    this.processTouchGesture(gesture, endTime);
    
    this.touchStartPos = null;
  }

  /**
   * Handle pointer move events (for swipe detection)
   */
  private handlePointerMove(_pointer: Phaser.Input.Pointer): void {
    // Currently not used, but could be extended for drag gestures
  }

  /**
   * Detect touch gesture based on start/end positions and duration
   */
  private detectTouchGesture(
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    duration: number
  ): TouchGesture {
    const deltaX = endPos.x - startPos.x;
    const deltaY = endPos.y - startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Check for tap vs swipe
    if (distance < this.config.swipeThreshold) {
      // Check for double tap
      if (duration < this.config.doubleTapTimeout && 
          (Date.now() - this.lastTapTime) < this.config.doubleTapTimeout) {
        return 'double_tap';
      }
      return 'tap';
    }
    
    // Determine swipe direction
    const angle = Math.atan2(deltaY, deltaX);
    const degrees = (angle * 180 / Math.PI + 360) % 360;
    
    if (degrees >= 315 || degrees < 45) {
      return 'swipe_right';
    } else if (degrees >= 45 && degrees < 135) {
      return 'swipe_down';
    } else if (degrees >= 135 && degrees < 225) {
      return 'swipe_left';
    } else {
      return 'swipe_up';
    }
  }

  /**
   * Process touch gesture and emit appropriate events
   */
  private processTouchGesture(gesture: TouchGesture, timestamp: number): void {
    if (!this.canProcessInput()) {
      return;
    }
    
    let eventType: InputEvent['type'] | null = null;
    
    switch (gesture) {
      case 'swipe_left':
        eventType = 'move_left';
        break;
      case 'swipe_right':
        eventType = 'move_right';
        break;
      case 'swipe_down':
        eventType = 'move_down';
        break;
      case 'swipe_up':
      case 'tap':
        eventType = 'rotate';
        break;
      case 'double_tap':
        eventType = 'hard_drop';
        break;
    }
    
    if (eventType) {
      this.emitInputEvent({
        type: eventType,
        timestamp,
        source: 'touch'
      });
    }
    
    // Update last tap time for double tap detection
    if (gesture === 'tap') {
      this.lastTapTime = timestamp;
    }
  }

  /**
   * Check if input can be processed (respects cooldown)
   */
  private canProcessInput(): boolean {
    const now = Date.now();
    if (now - this.lastInputTime < this.inputCooldown) {
      return false;
    }
    this.lastInputTime = now;
    return true;
  }

  /**
   * Check if a key is a movement key (for auto-repeat)
   */
  private isMovementKey(keyName: string): boolean {
    return ['LEFT', 'RIGHT', 'DOWN'].includes(keyName);
  }

  /**
   * Emit input event to registered callbacks
   */
  private emitInputEvent(event: InputEvent): void {
    const callback = this.inputCallbacks.get(event.type);
    if (callback) {
      callback(event);
    }
    
    // Also emit to generic handler if exists
    const genericCallback = this.inputCallbacks.get('*');
    if (genericCallback) {
      genericCallback(event);
    }
  }

  /**
   * Register callback for specific input type
   */
  public onInput(type: InputEvent['type'] | '*', callback: (event: InputEvent) => void): void {
    this.inputCallbacks.set(type, callback);
  }

  /**
   * Remove callback for specific input type
   */
  public offInput(type: InputEvent['type'] | '*'): void {
    this.inputCallbacks.delete(type);
  }

  /**
   * Update input manager (called from scene update loop)
   */
  public update(_delta: number): void {
    // Handle continuous soft drop when DOWN key is held
    if (this.heldKeys.has('DOWN')) {
      // Soft drop is handled by auto-repeat system
    }
  }

  /**
   * Set input configuration
   */
  public setConfig(config: Partial<InputConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current input configuration
   */
  public getConfig(): InputConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable input processing
   */
  public setEnabled(enabled: boolean): void {
    if (enabled) {
      this.inputCooldown = 50;
    } else {
      this.inputCooldown = Infinity;
      this.heldKeys.clear();
      this.keyHoldTimers.clear();
      this.keyRepeatTimers.clear();
    }
    
    // Enable/disable touch controls
    if (this.touchControls) {
      this.touchControls.setEnabled(enabled);
    }
  }

  /**
   * Check if a specific key is currently held
   */
  public isKeyHeld(keyName: string): boolean {
    return this.heldKeys.has(keyName);
  }

  /**
   * Get all currently held keys
   */
  public getHeldKeys(): string[] {
    return Array.from(this.heldKeys);
  }

  /**
   * Get touch controls for advanced configuration
   */
  public getTouchControls(): TouchControls {
    return this.touchControls;
  }

  /**
   * Update layout for responsive design
   */
  public updateLayout(width: number, height: number): void {
    if (this.touchControls) {
      this.touchControls.updateLayout(width, height);
    }
  }

  /**
   * Cleanup input manager
   */
  public destroy(): void {
    // Clear all timers
    this.keyHoldTimers.clear();
    this.keyRepeatTimers.clear();
    
    // Clear callbacks
    this.inputCallbacks.clear();
    
    // Clear held keys
    this.heldKeys.clear();
    
    // Destroy touch controls
    if (this.touchControls) {
      this.touchControls.destroy();
    }
    
    // Remove event listeners (Phaser handles this automatically when scene is destroyed)
  }
}
