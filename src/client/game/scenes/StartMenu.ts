import { Scene } from 'phaser';
import { settings } from '../services/Settings';
import { audioHandler } from '../services/AudioHandler';
import Logger from '../../utils/Logger';

export class StartMenu extends Scene {
  // Audio button state management
  private audioButton: Phaser.GameObjects.Rectangle | null = null;
  private audioIcon: Phaser.GameObjects.Text | null = null;
  private audioButtonState: 'muted' | 'unmuted' | 'loading' = 'muted';
  private isAudioInitializing = false;

  constructor() {
    super('StartMenu');
  }

  /**
   * Calculate button positioning layout based on dropdown alignment with responsive behavior
   * Requirements: 6.1, 6.2, 6.4, 6.5
   * @param screenWidth - Canvas width
   * @param screenHeight - Canvas height
   * @param dropdownWidth - Width of the difficulty dropdown
   * @param uiScale - UI scaling factor
   * @returns Layout calculations for button positioning
   */
  private calculateButtonLayout(screenWidth: number, screenHeight: number, dropdownWidth: number, uiScale: number) {
    // Dropdown position (existing)
    const dropdownX = screenWidth / 2;
    const dropdownY = screenHeight * 0.45;
    const dropdownLeft = dropdownX - dropdownWidth / 2;

    // Settings button dimensions and positioning
    const settingsFontSize = 24 * uiScale;
    const settingsPaddingX = 25 * uiScale;
    const settingsPaddingY = 12 * uiScale;
    
    // Calculate approximate settings button width (text width estimation + padding)
    // Using rough character width estimation for 'SETTINGS' text
    const settingsTextWidth = settingsFontSize * 0.6 * 8; // 8 characters in 'SETTINGS'
    const settingsButtonWidth = settingsTextWidth + (settingsPaddingX * 2);
    const settingsButtonHeight = settingsFontSize + (settingsPaddingY * 2);

    // Position settings button to align left edge with dropdown left edge
    const settingsButtonLeft = dropdownLeft;
    const settingsButtonX = settingsButtonLeft + settingsButtonWidth / 2;
    const settingsButtonY = screenHeight * 0.75;

    // Audio button positioning with responsive behavior (Requirements 6.1, 6.2, 6.4, 6.5)
    const audioButtonSize = this.calculateResponsiveAudioButtonSize(settingsButtonHeight, screenWidth, screenHeight, uiScale);
    const buttonSpacing = this.calculateResponsiveButtonSpacing(screenWidth, uiScale);
    const audioButtonLeft = settingsButtonLeft + settingsButtonWidth + buttonSpacing;
    const audioButtonX = audioButtonLeft + audioButtonSize / 2;
    const audioButtonY = settingsButtonY;

    return {
      // Dropdown reference
      dropdownX,
      dropdownY,
      dropdownLeft,
      dropdownWidth,
      
      // Settings button layout
      settingsButtonX,
      settingsButtonY,
      settingsButtonLeft,
      settingsButtonWidth,
      settingsButtonHeight,
      
      // Audio button layout
      audioButtonX,
      audioButtonY,
      audioButtonLeft,
      audioButtonSize,
      
      // Spacing
      buttonSpacing,
      
      // UI scaling
      uiScale
    };
  }

  /**
   * Calculate responsive audio button size ensuring proper touch target size on mobile
   * Requirements: 6.1, 6.4, 6.5
   * @param baseSize - Base size from settings button height
   * @param screenWidth - Current screen width
   * @param screenHeight - Current screen height
   * @param uiScale - UI scaling factor
   * @returns Responsive button size
   */
  private calculateResponsiveAudioButtonSize(baseSize: number, screenWidth: number, screenHeight: number, uiScale: number): number {
    // Minimum touch target size for mobile accessibility (44px minimum recommended)
    const MIN_TOUCH_TARGET = 44;
    const OPTIMAL_TOUCH_TARGET = 48;
    
    // Detect if we're likely on a mobile device based on screen dimensions
    const isMobileSize = screenWidth <= 768 || screenHeight <= 1024;
    const isVerySmallScreen = screenWidth <= 480 || screenHeight <= 800;
    
    // Calculate minimum size based on UI scale and touch requirements
    const scaledMinTarget = MIN_TOUCH_TARGET * uiScale;
    const scaledOptimalTarget = OPTIMAL_TOUCH_TARGET * uiScale;
    
    // Start with base size but ensure it meets minimum requirements
    let buttonSize = Math.max(baseSize, scaledMinTarget);
    
    // On mobile devices, prefer optimal touch target size
    if (isMobileSize) {
      buttonSize = Math.max(buttonSize, scaledOptimalTarget);
    }
    
    // On very small screens, ensure button doesn't become too large relative to screen
    if (isVerySmallScreen) {
      const maxSizeRatio = 0.08; // Max 8% of screen width
      const maxSize = screenWidth * maxSizeRatio;
      buttonSize = Math.min(buttonSize, maxSize);
      
      // But still maintain minimum touch target
      buttonSize = Math.max(buttonSize, scaledMinTarget);
    }
    
    // Ensure button maintains proportions when UI scaling changes (Requirement 6.5)
    return Math.round(buttonSize);
  }

  /**
   * Calculate responsive button spacing based on screen size
   * Requirements: 6.2, 6.4
   * @param screenWidth - Current screen width
   * @param uiScale - UI scaling factor
   * @returns Responsive spacing value
   */
  private calculateResponsiveButtonSpacing(screenWidth: number, uiScale: number): number {
    const BASE_SPACING = 20;
    
    // Adjust spacing based on screen width for better layout
    let spacing = BASE_SPACING * uiScale;
    
    // On smaller screens, reduce spacing to fit better
    if (screenWidth <= 480) {
      spacing = Math.max(10 * uiScale, spacing * 0.6);
    } else if (screenWidth <= 768) {
      spacing = Math.max(15 * uiScale, spacing * 0.8);
    }
    
    return Math.round(spacing);
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
          fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
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
          fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
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

    // Calculate button layout positions
    const layout = this.calculateButtonLayout(width, height, SCALED_DROPDOWN_WIDTH, UI_SCALE);

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
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
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
              fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
              stroke: '#000000',
              strokeThickness: 1,
            })
            .setOrigin(0, 0.5);

          const onSelect = () => {
            // This user interaction enables audio context with enhanced error handling
            this.enableAudioOnUserInteraction().then(() => {
              // Play menu select sound after audio is initialized
              try {
                audioHandler.playSound('menu-select');
              } catch (soundError) {
                Logger.log(`StartMenu: Menu select sound failed in dropdown - ${soundError}`);
                // Continue with dropdown functionality even if sound fails
              }
            }).catch(error => {
              Logger.log(`StartMenu: Audio initialization failed in dropdown - ${error}`);
              // Continue with dropdown functionality even if audio fails
            });
            
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

    // Settings button (repositioned to align with dropdown)
    const settingsButton = this.add
      .text(layout.settingsButtonX, layout.settingsButtonY, 'SETTINGS', {
        fontSize: `${24 * UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        backgroundColor: '#666666',
        padding: { x: 25 * UI_SCALE, y: 12 * UI_SCALE },
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => settingsButton.setStyle({ backgroundColor: '#888888' }))
      .on('pointerout', () => settingsButton.setStyle({ backgroundColor: '#666666' }))
      .on('pointerdown', () => this.openSettings());

    // Audio button with cross-platform support (Requirements 6.1, 6.2, 6.4)
    this.audioButton = this.add
      .rectangle(layout.audioButtonX, layout.audioButtonY, layout.audioButtonSize, layout.audioButtonSize, 0x666666)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x000000, 0.2)
      .setInteractive(this.createCrossPlatformInteractiveConfig(layout.audioButtonSize))
      .on('pointerover', () => this.handleAudioButtonHover(true))
      .on('pointerout', () => this.handleAudioButtonHover(false))
      .on('pointerdown', () => this.handleAudioButtonClick())
      .on('pointerup', () => this.handleAudioButtonRelease());

    // Audio button icon with responsive sizing (Requirements 6.1, 6.4, 6.5)
    const iconSize = this.calculateResponsiveIconSize(layout.audioButtonSize, UI_SCALE);
    this.audioIcon = this.add
      .text(layout.audioButtonX, layout.audioButtonY, '🔇', {
        fontSize: `${iconSize}px`,
        color: '#ffffff',
        fontFamily: 'Arial', // Use Arial for better emoji support
      })
      .setOrigin(0.5)
      .setInteractive(this.createCrossPlatformInteractiveConfig(layout.audioButtonSize))
      .on('pointerdown', () => this.handleAudioButtonClick())
      .on('pointerup', () => this.handleAudioButtonRelease());

    // Initialize audio button state
    this.updateAudioButtonState('muted');

    // Setup responsive behavior and cross-platform support (Requirements 6.1, 6.2, 6.4, 6.5)
    this.setupResponsiveBehavior();

    // Audio will be enabled on first user interaction through the audio button
  }

  /**
   * Enable audio on user interaction with enhanced error handling and browser compatibility
   * Requirements: 3.1, 3.5, 5.1, 5.2, 5.3, 6.3
   */
  private async enableAudioOnUserInteraction(): Promise<void> {
    return Logger.withSilentLogging(async () => {
      const startTime = Date.now();
      
      try {
        Logger.log('StartMenu: enableAudioOnUserInteraction called with enhanced error handling');
        
        // Initialize AudioContext properly after user gesture with timeout protection
        // This follows Chrome's autoplay policy requirements (Requirement 6.3)
        await this.initializeAudioContextWithTimeout();
        
        // Use existing enableAudioOnUserInteraction method and integrate with audioHandler service (Requirements 5.1, 5.3)
        if (!audioHandler.isInitialized()) {
          Logger.log('StartMenu: Initializing audio on user interaction using audioHandler service');
          
          // Initialize with timeout protection (Requirement 3.5)
          await this.initializeAudioHandlerWithTimeout();
          
          if (audioHandler.isInitialized()) {
            Logger.log('StartMenu: AudioHandler initialized successfully');
          } else {
            Logger.log('StartMenu: AudioHandler initialization completed but not marked as initialized');
          }
        } else {
          // Audio already initialized
          Logger.log('StartMenu: Audio already initialized via audioHandler service');
        }
        
        const duration = Date.now() - startTime;
        Logger.log(`StartMenu: Audio initialization completed in ${duration}ms`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Enhanced error handling with graceful degradation (Requirements 3.5, 5.2)
        await this.handleAudioInitializationError(error, duration);
      }
    });
  }

  /**
   * Initialize AudioContext with timeout protection and browser compatibility
   * Requirements: 3.5, 6.3
   */
  private async initializeAudioContextWithTimeout(): Promise<void> {
    const AUDIO_CONTEXT_TIMEOUT = 5000; // 5 seconds timeout protection
    
    try {
      // Create timeout promise for protection against hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`AudioContext initialization timed out after ${AUDIO_CONTEXT_TIMEOUT}ms`));
        }, AUDIO_CONTEXT_TIMEOUT);
      });
      
      // Create initialization promise
      const initPromise = this.performAudioContextInitialization();
      
      // Race between initialization and timeout
      await Promise.race([initPromise, timeoutPromise]);
      
      Logger.log('StartMenu: AudioContext initialization completed successfully');
      
    } catch (error) {
      Logger.log(`StartMenu: AudioContext initialization failed - ${error}`);
      
      // Enhanced browser compatibility - try fallback methods
      await this.tryAudioContextFallbacks();
    }
  }

  /**
   * Perform the actual AudioContext initialization with browser compatibility
   * Requirements: 6.3
   */
  private async performAudioContextInitialization(): Promise<void> {
    // Check browser compatibility for AudioContext
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }
    
    // Browser compatibility check - support multiple AudioContext implementations
    const AudioContextClass = window.AudioContext || 
                             (window as any).webkitAudioContext || 
                             (window as any).mozAudioContext ||
                             (window as any).msAudioContext;
    
    if (!AudioContextClass) {
      throw new Error('AudioContext not supported in this browser');
    }
    
    // Check if there's an existing AudioContext
    const existingContext = (window as any).audioContext;
    
    if (existingContext) {
      // Resume existing context if suspended
      if (existingContext.state === 'suspended') {
        Logger.log('StartMenu: Resuming suspended AudioContext');
        await existingContext.resume();
        Logger.log(`StartMenu: AudioContext resumed, state: ${existingContext.state}`);
      } else {
        Logger.log(`StartMenu: AudioContext already active, state: ${existingContext.state}`);
      }
    } else {
      // Create new AudioContext with browser compatibility
      Logger.log('StartMenu: Creating new AudioContext with browser compatibility');
      const audioContext = new AudioContextClass();
      
      // Store reference for other services to use
      (window as any).audioContext = audioContext;
      
      // Ensure context is running (required by autoplay policies)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      Logger.log(`StartMenu: AudioContext created and started, state: ${audioContext.state}`);
    }
    
    // Also initialize Phaser's audio system with error handling
    await this.initializePhaserAudioContext();
  }

  /**
   * Initialize Phaser's AudioContext with error handling
   * Requirements: 6.3
   */
  private async initializePhaserAudioContext(): Promise<void> {
    try {
      if (this.sound && 'context' in this.sound) {
        const phaserContext = (this.sound as any).context;
        if (phaserContext) {
          if (phaserContext.state === 'suspended') {
            Logger.log('StartMenu: Resuming Phaser AudioContext');
            await phaserContext.resume();
            Logger.log(`StartMenu: Phaser AudioContext resumed, state: ${phaserContext.state}`);
          } else {
            Logger.log(`StartMenu: Phaser AudioContext already active, state: ${phaserContext.state}`);
          }
        }
      }
    } catch (error) {
      Logger.log(`StartMenu: Phaser AudioContext initialization failed - ${error}`);
      // Don't throw - Phaser audio is optional
    }
  }

  /**
   * Try fallback methods for AudioContext initialization
   * Requirements: 6.3
   */
  private async tryAudioContextFallbacks(): Promise<void> {
    Logger.log('StartMenu: Attempting AudioContext fallback methods');
    
    try {
      // Fallback 1: Try creating a minimal AudioContext for compatibility testing
      if (typeof window !== 'undefined' && window.AudioContext) {
        const testContext = new window.AudioContext();
        if (testContext.state !== 'suspended') {
          (window as any).audioContext = testContext;
          Logger.log('StartMenu: Fallback AudioContext created successfully');
          return;
        }
        testContext.close();
      }
      
      // Fallback 2: Try webkit prefixed version
      if ((window as any).webkitAudioContext) {
        const webkitContext = new (window as any).webkitAudioContext();
        (window as any).audioContext = webkitContext;
        Logger.log('StartMenu: WebKit AudioContext fallback successful');
        return;
      }
      
      Logger.log('StartMenu: All AudioContext fallback methods failed - continuing without AudioContext');
      
    } catch (error) {
      Logger.log(`StartMenu: AudioContext fallback methods failed - ${error}`);
      // Continue without AudioContext - graceful degradation
    }
  }

  /**
   * Handle audio button click with enhanced error handling and browser compatibility
   * Requirements: 3.1, 3.2, 3.5, 4.1, 4.2, 4.4, 5.1, 5.2, 6.3
   */
  private async handleAudioButtonClick(): Promise<void> {
    return Logger.withSilentLogging(async () => {
      Logger.log('StartMenu: Audio button clicked with enhanced error handling');
      
      // Prevent multiple simultaneous initialization attempts
      if (this.isAudioInitializing) {
        Logger.log('StartMenu: Audio initialization already in progress, ignoring click');
        return;
      }

      try {
        // Provide immediate visual feedback for button press (Requirement 4.4)
        this.showButtonPressEffect();

        if (this.audioButtonState === 'muted') {
          // Attempt to enable audio and start music with enhanced error handling (Requirements 3.1, 3.2, 3.5, 4.1, 5.1, 5.2)
          await this.enableAudioAndStartMusicWithErrorHandling();
        } else if (this.audioButtonState === 'unmuted') {
          // Implement toggle functionality to stop music and return to muted state (Requirement 4.2)
          this.stopMusicAndMuteWithErrorHandling();
        }
        // If state is 'loading', do nothing (initialization in progress)
        
      } catch (error) {
        Logger.log(`StartMenu: Audio button click handler failed - ${error}`);
        
        // Enhanced error handling with graceful degradation (Requirements 3.5, 5.2)
        await this.handleAudioButtonError(error);
      }
    });
  }

  /**
   * Create cross-platform interactive configuration for buttons
   * Requirements: 6.1, 6.2, 6.4
   * @param buttonSize - Size of the button for touch target calculation
   * @returns Phaser interactive configuration
   */
  private createCrossPlatformInteractiveConfig(buttonSize: number): Phaser.Types.Input.InputConfiguration {
    // Ensure minimum touch target size for mobile accessibility
    const MIN_TOUCH_TARGET = 44;
    const touchTargetSize = Math.max(buttonSize, MIN_TOUCH_TARGET);
    
    return {
      useHandCursor: true,
      // Expand hit area for better touch accessibility on mobile
      hitArea: new Phaser.Geom.Rectangle(
        -touchTargetSize / 2,
        -touchTargetSize / 2,
        touchTargetSize,
        touchTargetSize
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      // Enable both mouse and touch interactions
      draggable: false,
      dropZone: false,
      cursor: 'pointer'
    };
  }

  /**
   * Calculate responsive icon size based on button size and UI scale
   * Requirements: 6.4, 6.5
   * @param buttonSize - Current button size
   * @param uiScale - UI scaling factor
   * @returns Appropriate icon size
   */
  private calculateResponsiveIconSize(buttonSize: number, uiScale: number): number {
    // Icon should be proportional to button size but with reasonable limits
    const baseIconRatio = 0.4; // Icon takes up 40% of button size
    let iconSize = buttonSize * baseIconRatio;
    
    // Ensure icon size is reasonable for readability
    const minIconSize = 16 * uiScale;
    const maxIconSize = 32 * uiScale;
    
    iconSize = Math.max(minIconSize, Math.min(maxIconSize, iconSize));
    
    return Math.round(iconSize);
  }

  /**
   * Handle audio button hover effects with cross-platform support
   * Requirements: 6.2, 6.4
   * @param isHovering - Whether the button is being hovered
   */
  private handleAudioButtonHover(isHovering: boolean): void {
    return Logger.withSilentLogging(() => {
      if (!this.audioButton) return;

      // Only show hover effects on desktop (mouse-based interactions)
      // Touch devices don't have hover states, so we skip this for better UX
      const isTouchDevice = this.detectTouchDevice();
      
      if (!isTouchDevice) {
        if (isHovering) {
          this.audioButton.setFillStyle(0x888888);
        } else {
          this.audioButton.setFillStyle(0x666666);
        }
      }
    });
  }

  /**
   * Handle audio button release for better touch feedback
   * Requirements: 6.1, 6.4
   */
  private handleAudioButtonRelease(): void {
    return Logger.withSilentLogging(() => {
      if (!this.audioButton) return;

      // Reset button appearance after release
      // This provides better feedback for touch interactions
      this.audioButton.setFillStyle(0x666666);
    });
  }

  /**
   * Detect if the current device is primarily touch-based
   * Requirements: 6.1, 6.2, 6.4
   * @returns True if touch device is detected
   */
  private detectTouchDevice(): boolean {
    // Multiple detection methods for better accuracy
    const hasTouchScreen = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 || 
                          (navigator as any).msMaxTouchPoints > 0;
    
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    
    // Consider it a touch device if any of these conditions are true
    return hasTouchScreen || isMobileUserAgent || hasCoarsePointer;
  }

  /**
   * Handle screen orientation changes for responsive layout
   * Requirements: 6.4, 6.5
   */
  private handleOrientationChange(): void {
    return Logger.withSilentLogging(() => {
      // Debounce orientation changes to avoid excessive recalculations
      if (this.orientationChangeTimeout) {
        clearTimeout(this.orientationChangeTimeout);
      }
      
      this.orientationChangeTimeout = setTimeout(() => {
        this.updateResponsiveLayout();
      }, 250);
    });
  }

  /**
   * Update layout for responsive behavior
   * Requirements: 6.2, 6.4, 6.5
   */
  private updateResponsiveLayout(): void {
    return Logger.withSilentLogging(() => {
      if (!this.audioButton || !this.audioIcon) return;

      const { width, height } = this.scale;
      const UI_SCALE = 2;
      const SCALED_DROPDOWN_WIDTH = 220 * UI_SCALE;
      
      // Recalculate layout with current screen dimensions
      const layout = this.calculateButtonLayout(width, height, SCALED_DROPDOWN_WIDTH, UI_SCALE);
      
      // Update audio button position and size
      this.audioButton.setPosition(layout.audioButtonX, layout.audioButtonY);
      this.audioButton.setSize(layout.audioButtonSize, layout.audioButtonSize);
      
      // Update icon position and size
      const iconSize = this.calculateResponsiveIconSize(layout.audioButtonSize, UI_SCALE);
      this.audioIcon.setPosition(layout.audioButtonX, layout.audioButtonY);
      this.audioIcon.setFontSize(iconSize);
      
      // Update interactive areas for new size
      const interactiveConfig = this.createCrossPlatformInteractiveConfig(layout.audioButtonSize);
      this.audioButton.setInteractive(interactiveConfig);
      this.audioIcon.setInteractive(interactiveConfig);
      
      Logger.log(`StartMenu: Responsive layout updated - button size: ${layout.audioButtonSize}, icon size: ${iconSize}`);
    });
  }

  // Add property for orientation change timeout
  private orientationChangeTimeout: NodeJS.Timeout | null = null;

  /**
   * Update the audio button's visual state and icon
   * Requirements: 4.1, 4.3, 4.4
   */
  private updateAudioButtonState(newState: 'muted' | 'unmuted' | 'loading'): void {
    return Logger.withSilentLogging(() => {
      this.audioButtonState = newState;
      
      if (!this.audioIcon) {
        Logger.log('StartMenu: Audio icon not available for state update');
        return;
      }

      // Update icon based on state
      switch (newState) {
        case 'muted':
          this.audioIcon.setText('🔇'); // Muted speaker
          Logger.log('StartMenu: Audio button state updated to muted');
          break;
        case 'unmuted':
          // Update button icon to unmuted speaker (🔊) when audio is successfully activated (Requirement 4.1)
          this.audioIcon.setText('🔊'); // Unmuted speaker with sound waves
          Logger.log('StartMenu: Audio button state updated to unmuted');
          break;
        case 'loading':
          this.audioIcon.setText('⏳'); // Hourglass for loading state
          Logger.log('StartMenu: Audio button state updated to loading');
          break;
      }
    });
  }

  /**
   * Setup responsive behavior and cross-platform support
   * Requirements: 6.1, 6.2, 6.4, 6.5
   */
  private setupResponsiveBehavior(): void {
    return Logger.withSilentLogging(() => {
      // Listen for orientation changes on mobile devices
      if (typeof window !== 'undefined') {
        // Modern approach using screen.orientation API
        if (screen && screen.orientation) {
          screen.orientation.addEventListener('change', () => this.handleOrientationChange());
        }
        
        // Fallback for older browsers
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
        
        // Also listen for resize events for desktop responsive behavior
        window.addEventListener('resize', () => this.handleOrientationChange());
        
        // Listen for visibility changes to handle app backgrounding/foregrounding
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
      }
      
      // Setup scale manager listeners for Phaser-specific scaling events
      this.scale.on('resize', () => this.handleOrientationChange());
      
      Logger.log('StartMenu: Responsive behavior and cross-platform support initialized');
    });
  }

  /**
   * Handle visibility changes for better mobile app lifecycle management
   * Requirements: 6.1, 6.4
   */
  private handleVisibilityChange(): void {
    return Logger.withSilentLogging(() => {
      if (document.hidden) {
        // App is being backgrounded - pause any ongoing audio operations
        if (this.isAudioInitializing) {
          Logger.log('StartMenu: App backgrounded during audio initialization');
        }
      } else {
        // App is being foregrounded - check if layout needs updating
        setTimeout(() => {
          this.updateResponsiveLayout();
        }, 100);
      }
    });
  }

  /**
   * Provide enhanced visual feedback for button press with cross-platform support
   * Requirements: 6.1, 6.4
   */
  private showButtonPressEffect(): void {
    return Logger.withSilentLogging(() => {
      if (!this.audioButton) return;

      // Enhanced feedback for touch devices vs desktop
      const isTouchDevice = this.detectTouchDevice();
      const originalColor = 0x666666;
      const pressColor = 0x444444;
      
      // More pronounced feedback for touch devices
      const feedbackDuration = isTouchDevice ? 150 : 100;
      const scaleEffect = isTouchDevice ? 0.95 : 0.98;
      
      // Color and scale feedback
      this.audioButton.setFillStyle(pressColor);
      this.audioButton.setScale(scaleEffect);
      
      // Return to normal state after feedback duration
      this.time.delayedCall(feedbackDuration, () => {
        if (this.audioButton) {
          this.audioButton.setFillStyle(originalColor);
          this.audioButton.setScale(1.0);
        }
      });
    });
  }

  /**
   * Clean up responsive behavior listeners
   * Requirements: 6.4
   */
  private cleanupResponsiveBehavior(): void {
    return Logger.withSilentLogging(() => {
      if (this.orientationChangeTimeout) {
        clearTimeout(this.orientationChangeTimeout);
        this.orientationChangeTimeout = null;
      }
      
      // Remove event listeners to prevent memory leaks
      if (typeof window !== 'undefined') {
        if (screen && screen.orientation) {
          screen.orientation.removeEventListener('change', () => this.handleOrientationChange());
        }
        window.removeEventListener('orientationchange', () => this.handleOrientationChange());
        window.removeEventListener('resize', () => this.handleOrientationChange());
        document.removeEventListener('visibilitychange', () => this.handleVisibilityChange());
      }
      
      Logger.log('StartMenu: Responsive behavior cleanup completed');
    });
  }

  /**
   * Initialize AudioHandler with timeout protection
   * Requirements: 3.5, 5.2
   */
  private async initializeAudioHandlerWithTimeout(): Promise<void> {
    const AUDIO_HANDLER_TIMEOUT = 5000; // 5 seconds timeout protection
    
    // Create timeout promise for protection against hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`AudioHandler initialization timed out after ${AUDIO_HANDLER_TIMEOUT}ms`));
      }, AUDIO_HANDLER_TIMEOUT);
    });
    
    // Create initialization promise
    const initPromise = audioHandler.initialize(this);
    
    // Race between initialization and timeout
    await Promise.race([initPromise, timeoutPromise]);
  }

  /**
   * Handle audio initialization errors with graceful degradation
   * Requirements: 3.5, 5.2, 5.4, 6.3
   */
  private async handleAudioInitializationError(error: any, duration: number): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timed out');
    const isPermissionDenied = errorMessage.includes('permission') || errorMessage.includes('denied');
    const isBrowserPolicy = errorMessage.includes('autoplay') || errorMessage.includes('policy');
    
    Logger.log(`StartMenu: Audio initialization failed after ${duration}ms - ${errorMessage}`);
    
    // Log browser and system information for debugging
    this.logBrowserCompatibilityInfo();
    
    if (isTimeout) {
      Logger.log('StartMenu: Audio initialization timed out - maintaining button functionality with graceful degradation');
    } else if (isPermissionDenied) {
      Logger.log('StartMenu: Audio permission denied - button will remain functional but silent');
    } else if (isBrowserPolicy) {
      Logger.log('StartMenu: Browser autoplay policy prevented audio - button functionality maintained');
    } else {
      Logger.log('StartMenu: Audio system failure - graceful degradation enabled');
    }
    
    // Maintain button functionality even when audio systems fail (Requirement 5.4)
    // The button remains interactive and provides visual feedback
  }

  /**
   * Log browser compatibility information for debugging
   * Requirements: 6.3
   */
  private logBrowserCompatibilityInfo(): void {
    try {
      const browserInfo = {
        userAgent: navigator.userAgent,
        audioContextSupport: !!(window.AudioContext || (window as any).webkitAudioContext),
        webAudioSupport: typeof AudioContext !== 'undefined',
        autoplayPolicy: 'unknown', // Cannot directly detect, but logged for context
        documentHidden: document.hidden,
        visibilityState: document.visibilityState,
        online: navigator.onLine
      };
      
      Logger.log(`StartMenu: Browser compatibility info - ${JSON.stringify(browserInfo)}`);
    } catch (error) {
      Logger.log(`StartMenu: Could not collect browser compatibility info - ${error}`);
    }
  }

  /**
   * Enable audio and start playing menu music with enhanced error handling
   * Requirements: 3.3, 3.4, 3.5, 4.1, 4.2, 5.2, 5.3, 5.4
   */
  private async enableAudioAndStartMusicWithErrorHandling(): Promise<void> {
    return Logger.withSilentLogging(async () => {
      this.isAudioInitializing = true;
      this.updateAudioButtonState('loading');

      try {
        Logger.log('StartMenu: Attempting to enable audio and start music with enhanced error handling');
        
        // Call enhanced enableAudioOnUserInteraction method with timeout protection
        await this.enableAudioOnUserInteraction();
        
        // Check if audio was successfully initialized
        if (audioHandler.isInitialized()) {
          // Audio is initialized, start menu music using audioHandler service (Requirement 3.3)
          Logger.log('StartMenu: Audio initialized, starting menu music via audioHandler');
          
          try {
            audioHandler.playMusic('menu-theme', true);
            
            // Update button icon to unmuted speaker when audio is successfully activated (Requirement 4.1)
            this.updateAudioButtonState('unmuted');
            Logger.log('StartMenu: Audio successfully enabled and music started');
            
            // Add appropriate sound effects for button interactions when audio is enabled (Requirement 4.5)
            audioHandler.playSound('menu-select');
            
          } catch (musicError) {
            Logger.log(`StartMenu: Music playback failed but audio is initialized - ${musicError}`);
            // Still update to unmuted state since audio system is working
            this.updateAudioButtonState('unmuted');
          }
        } else {
          // Audio initialization failed but maintain button functionality (Requirement 5.4)
          Logger.log('StartMenu: Audio initialization completed but handler not marked as initialized - maintaining button functionality');
          this.updateAudioButtonState('muted');
        }
        
      } catch (error) {
        Logger.log(`StartMenu: Failed to enable audio - ${error}`);
        
        // Handle audio initialization failures gracefully with appropriate logging (Requirements 3.5, 5.2)
        await this.handleAudioInitializationError(error, Date.now());
        
        // Maintain button functionality even when audio systems fail (Requirement 5.4)
        this.updateAudioButtonState('muted');
        
      } finally {
        this.isAudioInitializing = false;
      }
    });
  }

  /**
   * Stop music and return to muted state with enhanced error handling
   * Requirements: 4.2, 4.3, 4.5, 5.2, 5.3, 5.4
   */
  private stopMusicAndMuteWithErrorHandling(): void {
    return Logger.withSilentLogging(() => {
      Logger.log('StartMenu: Stopping music and returning to muted state with enhanced error handling');
      
      try {
        // Add appropriate sound effects for button interactions when audio is enabled (Requirement 4.5)
        if (audioHandler.isInitialized()) {
          try {
            audioHandler.playSound('menu-select');
          } catch (soundError) {
            Logger.log(`StartMenu: Sound effect failed during music stop - ${soundError}`);
            // Continue with music stop even if sound effect fails
          }
        }
        
        // Stop music playback using existing audioHandler service (Requirement 4.2, 5.3)
        try {
          audioHandler.stopMusic();
          Logger.log('StartMenu: Music stopped successfully');
        } catch (stopError) {
          Logger.log(`StartMenu: Music stop failed - ${stopError}`);
          // Continue to update button state even if stop fails
        }
        
        // Change icon back to muted speaker when music is stopped (Requirement 4.3)
        this.updateAudioButtonState('muted');
        
        Logger.log('StartMenu: Music stopped and button returned to muted state');
        
      } catch (error) {
        Logger.log(`StartMenu: Error during music stop operation - ${error}`);
        
        // Maintain button functionality even when audio systems fail (Requirement 5.4)
        this.updateAudioButtonState('muted');
      }
    });
  }

  /**
   * Handle audio button errors with graceful degradation
   * Requirements: 3.5, 5.2, 5.4, 6.3
   */
  private async handleAudioButtonError(error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timed out');
    const isPermissionDenied = errorMessage.includes('permission') || errorMessage.includes('denied');
    const isBrowserPolicy = errorMessage.includes('autoplay') || errorMessage.includes('policy');
    const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch');
    
    Logger.log(`StartMenu: Audio button error - ${errorMessage}`);
    
    // Ensure compatibility with browser autoplay policies (Requirement 6.3)
    if (isBrowserPolicy || isPermissionDenied) {
      Logger.log('StartMenu: Browser autoplay policy or permission issue - button remains functional');
      // Button stays functional but audio won't work until user grants permission
    } else if (isTimeout) {
      Logger.log('StartMenu: Audio operation timed out - implementing timeout protection');
      // Reset button state and allow user to retry
    } else if (isNetworkError) {
      Logger.log('StartMenu: Network error during audio operation - graceful degradation');
      // Audio assets may not load but button remains functional
    } else {
      Logger.log('StartMenu: Unknown audio error - maintaining button functionality');
    }
    
    // Maintain button functionality even when audio systems fail (Requirement 5.4)
    this.updateAudioButtonState('muted');
    
    // Log additional diagnostics for troubleshooting
    this.logAudioSystemDiagnostics();
  }

  /**
   * Log audio system diagnostics for troubleshooting
   * Requirements: 5.2, 6.3
   */
  private logAudioSystemDiagnostics(): void {
    try {
      const diagnostics = {
        audioHandlerInitialized: audioHandler.isInitialized(),
        audioContextExists: !!(window as any).audioContext,
        audioContextState: (window as any).audioContext?.state || 'none',
        phaserSoundExists: !!this.sound,
        phaserSoundContext: this.sound && 'context' in this.sound ? (this.sound as any).context?.state : 'none',
        documentHidden: document.hidden,
        visibilityState: document.visibilityState,
        userActivation: (navigator as any).userActivation?.hasBeenActive || 'unknown',
        timestamp: new Date().toISOString()
      };
      
      Logger.log(`StartMenu: Audio system diagnostics - ${JSON.stringify(diagnostics)}`);
    } catch (error) {
      Logger.log(`StartMenu: Could not collect audio diagnostics - ${error}`);
    }
  }

  private openSettings(): void {
    return Logger.withSilentLogging(() => {
      // This user interaction enables audio context with enhanced error handling
      this.enableAudioOnUserInteraction().then(() => {
        // Play menu select sound after audio is initialized
        try {
          audioHandler.playSound('menu-select');
        } catch (soundError) {
          Logger.log(`StartMenu: Menu select sound failed in openSettings - ${soundError}`);
          // Continue with settings navigation even if sound fails
        }
      }).catch(error => {
        Logger.log(`StartMenu: Audio initialization failed in openSettings - ${error}`);
        // Continue with settings navigation even if audio fails
      });
      
      // Switch to Settings scene (don't wait for audio)
      this.scene.start('Settings');
      Logger.log('StartMenu: Opening Settings');
    });
  }

  private startGame(): void {
    return Logger.withSilentLogging(() => {
      // This user interaction enables audio context with enhanced error handling
      this.enableAudioOnUserInteraction().then(() => {
        // Play menu select sound after audio is initialized
        try {
          audioHandler.playSound('menu-select');
        } catch (soundError) {
          Logger.log(`StartMenu: Menu select sound failed in startGame - ${soundError}`);
          // Continue with game start even if sound fails
        }
      }).catch(error => {
        Logger.log(`StartMenu: Audio initialization failed in startGame - ${error}`);
        // Continue with game start even if audio fails
      });
      
      Logger.log('Starting game...');
      // Determine selected mode (default to 'medium') and pass progressionData if available
      const registry = this.registry;
      const mode =
        (registry.get('selectedMode') as string) || (registry.get('gameMode') as string) || 'medium';
      const progressionData = registry.get('progressionData') || null;

      // Stop menu music before transitioning to game with error handling
      try {
        audioHandler.stopMusic();
      } catch (stopError) {
        Logger.log(`StartMenu: Failed to stop menu music - ${stopError}`);
        // Continue with game start even if music stop fails
      }

      // Start Game scene with initial data payload (don't wait for audio)
      this.scene.start('Game', { gameMode: mode, progressionData });
    });
  }

  /**
   * Initialize scene and setup cleanup on shutdown
   * Requirements: 6.4
   */
  init(): void {
    // Setup cleanup when scene shuts down
    this.events.once('shutdown', () => {
      this.cleanupResponsiveBehavior();
    });
  }
}
