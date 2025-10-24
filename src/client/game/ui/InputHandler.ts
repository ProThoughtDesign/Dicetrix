import * as Phaser from 'phaser';
import Logger from '../../utils/Logger';

export interface InputCallbacks {
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onMoveDown?: () => void;
  onRotateClockwise?: () => void;
  onRotateCounterClockwise?: () => void;
  onHardDrop?: () => void;
  onPause?: () => void;
}

export interface TouchDragCallbacks {
  onDragStart?: (x: number, y: number) => void;
  onDragMove?: (x: number, y: number, deltaX: number, deltaY: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  onTap?: (x: number, y: number) => void;
}

export class InputHandler {
  private scene: Phaser.Scene;
  private callbacks: InputCallbacks;
  private touchCallbacks: TouchDragCallbacks;
  private keys: { [key: string]: Phaser.Input.Keyboard.Key | undefined } = {};
  private gamepadConnected = false;
  
  // Touch/drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastDragX = 0;
  private lastDragY = 0;

  constructor(scene: Phaser.Scene, callbacks: InputCallbacks = {}, touchCallbacks: TouchDragCallbacks = {}) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.touchCallbacks = touchCallbacks;
    
    this.setupKeyboardInput();
    this.setupGamepadInput();
    this.setupTouchInput();
  }

  private setupKeyboardInput(): void {
    try {
      if (this.scene.input.keyboard) {
        // Arrow keys and WASD for movement
        this.keys.left = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keys.right = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.keys.down = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.keys.up = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        
        // Alternative keys
        this.keys.a = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keys.d = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keys.s = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keys.w = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        
        // Rotation and special keys
        this.keys.q = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keys.r = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.keys.space = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keys.esc = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Set up key event listeners
        this.setupKeyEvents();
        
        Logger.log('Keyboard input initialized');
      } else {
        Logger.log('Keyboard not available, using fallback');
        this.setupFallbackKeyboard();
      }
    } catch (error) {
      Logger.log('Keyboard setup failed: ' + String(error));
      this.setupFallbackKeyboard();
    }
  }

  private setupKeyEvents(): void {
    // Movement keys
    this.keys.left?.on('down', () => this.callbacks.onMoveLeft?.());
    this.keys.a?.on('down', () => this.callbacks.onMoveLeft?.());
    
    this.keys.right?.on('down', () => this.callbacks.onMoveRight?.());
    this.keys.d?.on('down', () => this.callbacks.onMoveRight?.());
    
    this.keys.down?.on('down', () => this.callbacks.onMoveDown?.());
    this.keys.s?.on('down', () => this.callbacks.onMoveDown?.());
    
    // Rotation keys
    this.keys.up?.on('down', () => this.callbacks.onRotateClockwise?.());
    this.keys.w?.on('down', () => this.callbacks.onRotateClockwise?.());
    this.keys.r?.on('down', () => this.callbacks.onRotateClockwise?.());
    
    this.keys.q?.on('down', () => this.callbacks.onRotateCounterClockwise?.());
    
    // Special keys
    this.keys.space?.on('down', () => this.callbacks.onHardDrop?.());
    this.keys.esc?.on('down', () => this.callbacks.onPause?.());
  }

  private setupFallbackKeyboard(): void {
    window.addEventListener('keydown', (event) => {
      switch (event.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          this.callbacks.onMoveLeft?.();
          break;
        case 'arrowright':
        case 'd':
          this.callbacks.onMoveRight?.();
          break;
        case 'arrowdown':
        case 's':
          this.callbacks.onMoveDown?.();
          break;
        case 'arrowup':
        case 'w':
        case 'r':
          this.callbacks.onRotateClockwise?.();
          break;
        case 'q':
          this.callbacks.onRotateCounterClockwise?.();
          break;
        case ' ':
          this.callbacks.onHardDrop?.();
          break;
        case 'escape':
          this.callbacks.onPause?.();
          break;
      }
    });
  }

  private setupGamepadInput(): void {
    // Listen for gamepad connection events
    window.addEventListener('gamepadconnected', (event) => {
      this.gamepadConnected = true;
      Logger.log(`Gamepad connected: ${event.gamepad.id}`);
      // Show system message (could be implemented as a toast notification)
      console.log(`🎮 Gamepad Connected: ${event.gamepad.id}`);
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      this.gamepadConnected = false;
      Logger.log(`Gamepad disconnected: ${event.gamepad.id}`);
      console.log(`🎮 Gamepad Disconnected: ${event.gamepad.id}`);
    });

    // TODO: Implement gamepad input polling in update loop
    // For now, just detect connection/disconnection
  }

  private setupTouchInput(): void {
    // Enable touch input on the scene
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.lastDragX = pointer.x;
      this.lastDragY = pointer.y;
      
      this.touchCallbacks.onDragStart?.(pointer.x, pointer.y);
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = pointer.x - this.lastDragX;
        const deltaY = pointer.y - this.lastDragY;
        
        this.touchCallbacks.onDragMove?.(pointer.x, pointer.y, deltaX, deltaY);
        
        this.lastDragX = pointer.x;
        this.lastDragY = pointer.y;
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const totalDeltaX = pointer.x - this.dragStartX;
        const totalDeltaY = pointer.y - this.dragStartY;
        const distance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);
        
        // If it was a small movement, treat as tap
        if (distance < 10) {
          this.touchCallbacks.onTap?.(pointer.x, pointer.y);
        } else {
          this.touchCallbacks.onDragEnd?.(pointer.x, pointer.y);
        }
        
        this.isDragging = false;
      }
    });
  }

  public updateCallbacks(callbacks: Partial<InputCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public updateTouchCallbacks(callbacks: Partial<TouchDragCallbacks>): void {
    this.touchCallbacks = { ...this.touchCallbacks, ...callbacks };
  }

  public update(): void {
    // TODO: Poll gamepad input here when implemented
    if (this.gamepadConnected) {
      // Gamepad polling logic will go here
    }
  }

  public destroy(): void {
    // Clean up event listeners
    Object.values(this.keys).forEach(key => {
      if (key) {
        key.removeAllListeners();
      }
    });
  }
}
