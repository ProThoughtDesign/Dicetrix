import { Scene } from 'phaser';
import { audioHandler } from '../services/AudioHandler';
import Logger from '../../utils/Logger';

export class HowToPlayScene extends Scene {
  private currentPage = 0;
  private totalPages = 4;
  private contentPages: Phaser.GameObjects.Container[] = [];
  private navigationContainer: Phaser.GameObjects.Container | null = null;
  private backButton: Phaser.GameObjects.Rectangle | null = null;
  private backButtonText: Phaser.GameObjects.Text | null = null;
  private prevButton: Phaser.GameObjects.Rectangle | null = null;
  private nextButton: Phaser.GameObjects.Rectangle | null = null;
  private prevButtonText: Phaser.GameObjects.Text | null = null;
  private nextButtonText: Phaser.GameObjects.Text | null = null;
  private pageIndicator: Phaser.GameObjects.Text | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;
  private orientationChangeTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super('HowToPlayScene');
  }

  /**
   * Create the How To Play scene with game instructions
   * Requirements: 8.1, 8.2, 8.3, 8.4
   */
  create(): void {
    const { width, height } = this.scale;

    // Set background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Create title
    this.createTitle(width, height);

    // Create instruction pages
    this.createInstructionPages(width, height);

    // Create navigation controls
    this.createNavigationControls(width, height);

    // Setup responsive behavior
    this.setupResponsiveBehavior();

    // Show initial page
    this.showPage(0);

    Logger.log('HowToPlayScene: Scene created successfully');
  }

  /**
   * Create the scene title
   * Requirements: 8.1, 8.4
   */
  private createTitle(width: number, height: number): void {
    const titleFontSize = this.calculateResponsiveTitleFontSize(width);

    this.titleText = this.add
      .text(width / 2, height * 0.1, 'HOW TO PLAY', {
        fontSize: `${titleFontSize}px`,
        color: '#00ff88',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Scale title for mobile responsiveness
    const maxTitleWidth = width * 0.9;
    if (this.titleText.width > maxTitleWidth) {
      const scale = maxTitleWidth / this.titleText.width;
      this.titleText.setScale(scale);
    }
  }

  /**
   * Create multi-page instruction content
   * Requirements: 8.1, 8.2, 8.4
   */
  private createInstructionPages(width: number, height: number): void {
    const contentY = height * 0.2;
    const contentWidth = width * 0.9;
    const fontSize = this.calculateResponsiveFontSize(width);

    // Page 1: Basic Gameplay
    const page1 = this.add.container(width / 2, contentY);
    const page1Content = this.add
      .text(0, 0, this.getPage1Content(), {
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        wordWrap: { width: contentWidth, useAdvancedWrap: true },
        lineSpacing: 10,
      })
      .setOrigin(0.5, 0);
    page1.add(page1Content);
    this.contentPages.push(page1);

    // Page 2: Scoring System
    const page2 = this.add.container(width / 2, contentY);
    const page2Content = this.add
      .text(0, 0, this.getPage2Content(), {
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        wordWrap: { width: contentWidth, useAdvancedWrap: true },
        lineSpacing: 10,
      })
      .setOrigin(0.5, 0);
    page2.add(page2Content);
    this.contentPages.push(page2);

    // Page 3: Difficulty Modes
    const page3 = this.add.container(width / 2, contentY);
    const page3Content = this.add
      .text(0, 0, this.getPage3Content(), {
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        wordWrap: { width: contentWidth, useAdvancedWrap: true },
        lineSpacing: 10,
      })
      .setOrigin(0.5, 0);
    page3.add(page3Content);
    this.contentPages.push(page3);

    // Page 4: Tips and Strategies
    const page4 = this.add.container(width / 2, contentY);
    const page4Content = this.add
      .text(0, 0, this.getPage4Content(), {
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        wordWrap: { width: contentWidth, useAdvancedWrap: true },
        lineSpacing: 10,
      })
      .setOrigin(0.5, 0);
    page4.add(page4Content);
    this.contentPages.push(page4);

    // Initially hide all pages
    this.contentPages.forEach((page) => page.setVisible(false));
  }

  /**
   * Create navigation controls with mobile-friendly design
   * Requirements: 8.2, 8.3, 8.4
   */
  private createNavigationControls(width: number, height: number): void {
    const navY = height * 0.85;
    const buttonWidth = this.calculateResponsiveButtonWidth(width);
    const buttonHeight = this.calculateResponsiveButtonHeight(width);
    const fontSize = this.calculateResponsiveButtonFontSize(width);

    // Create navigation container
    this.navigationContainer = this.add.container(0, 0);

    // Back to Menu button
    this.backButton = this.add
      .rectangle(width / 2, height * 0.95, buttonWidth, buttonHeight, 0x666666)
      .setStrokeStyle(2, 0x000000)
      .setInteractive(this.createTouchFriendlyConfig(buttonWidth, buttonHeight))
      .on('pointerover', () => this.handleButtonHover(this.backButton!, 0x888888))
      .on('pointerout', () => this.handleButtonHover(this.backButton!, 0x666666))
      .on('pointerdown', () => this.returnToMenu());

    this.backButtonText = this.add
      .text(width / 2, height * 0.95, 'BACK TO MENU', {
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setInteractive(this.createTouchFriendlyConfig(buttonWidth, buttonHeight))
      .on('pointerdown', () => this.returnToMenu());

    // Previous button
    this.prevButton = this.add
      .rectangle(width * 0.2, navY, buttonWidth * 0.8, buttonHeight, 0x444444)
      .setStrokeStyle(2, 0x000000)
      .setInteractive(this.createTouchFriendlyConfig(buttonWidth * 0.8, buttonHeight))
      .on('pointerover', () => this.handleButtonHover(this.prevButton!, 0x666666))
      .on('pointerout', () => this.handleButtonHover(this.prevButton!, 0x444444))
      .on('pointerdown', () => this.previousPage());

    this.prevButtonText = this.add
      .text(width * 0.2, navY, 'PREVIOUS', {
        fontSize: `${fontSize * 0.9}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setInteractive(this.createTouchFriendlyConfig(buttonWidth * 0.8, buttonHeight))
      .on('pointerdown', () => this.previousPage());

    // Next button
    this.nextButton = this.add
      .rectangle(width * 0.8, navY, buttonWidth * 0.8, buttonHeight, 0x444444)
      .setStrokeStyle(2, 0x000000)
      .setInteractive(this.createTouchFriendlyConfig(buttonWidth * 0.8, buttonHeight))
      .on('pointerover', () => this.handleButtonHover(this.nextButton!, 0x666666))
      .on('pointerout', () => this.handleButtonHover(this.nextButton!, 0x444444))
      .on('pointerdown', () => this.nextPage());

    this.nextButtonText = this.add
      .text(width * 0.8, navY, 'NEXT', {
        fontSize: `${fontSize * 0.9}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setInteractive(this.createTouchFriendlyConfig(buttonWidth * 0.8, buttonHeight))
      .on('pointerdown', () => this.nextPage());

    // Page indicator
    this.pageIndicator = this.add
      .text(width / 2, navY, '', {
        fontSize: `${fontSize * 0.8}px`,
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    // Add all navigation elements to container
    this.navigationContainer.add([
      this.backButton,
      this.backButtonText,
      this.prevButton,
      this.prevButtonText,
      this.nextButton,
      this.nextButtonText,
      this.pageIndicator,
    ]);
  }

  /**
   * Calculate responsive font size based on screen width
   * Requirements: 8.4
   */
  private calculateResponsiveFontSize(width: number): number {
    if (width <= 480) return 24; // Very small screens - moderate increase from 20
    if (width <= 768) return 26; // Small screens - moderate increase from 22
    if (width <= 1024) return 28; // Medium screens - moderate increase from 24
    return 32; // Large screens - moderate increase from 28
  }

  /**
   * Calculate responsive title font size
   * Requirements: 8.4
   */
  private calculateResponsiveTitleFontSize(width: number): number {
    if (width <= 480) return 38; // Very small screens - moderate increase from 32
    if (width <= 768) return 44; // Small screens - moderate increase from 40
    if (width <= 1024) return 48; // Medium screens - moderate increase from 44
    return 52; // Large screens - moderate increase from 48
  }

  /**
   * Calculate responsive button width
   * Requirements: 8.4
   */
  private calculateResponsiveButtonWidth(width: number): number {
    const baseWidth = Math.min(width * 0.3, 200);
    return Math.max(baseWidth, 120); // Minimum width for touch targets
  }

  /**
   * Calculate responsive button height
   * Requirements: 8.4
   */
  private calculateResponsiveButtonHeight(width: number): number {
    const baseHeight = width <= 768 ? 50 : 40;
    return Math.max(baseHeight, 44); // Minimum 44px for touch accessibility
  }

  /**
   * Calculate responsive button font size
   * Requirements: 8.4
   */
  private calculateResponsiveButtonFontSize(width: number): number {
    if (width <= 480) return 16; // Moderate increase from 14
    if (width <= 768) return 18; // Moderate increase from 16
    return 20; // Moderate increase from 18
  }

  /**
   * Create touch-friendly interactive configuration
   * Requirements: 8.4
   */
  private createTouchFriendlyConfig(
    width: number,
    height: number
  ): Phaser.Types.Input.InputConfiguration {
    const minTouchTarget = 44;
    const touchWidth = Math.max(width, minTouchTarget);
    const touchHeight = Math.max(height, minTouchTarget);

    return {
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(
        -touchWidth / 2,
        -touchHeight / 2,
        touchWidth,
        touchHeight
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      cursor: 'pointer',
    };
  }

  /**
   * Handle button hover effects (desktop only)
   * Requirements: 8.4
   */
  private handleButtonHover(button: Phaser.GameObjects.Rectangle, color: number): void {
    // Only show hover effects on non-touch devices
    if (!this.isTouchDevice()) {
      button.setFillStyle(color);
    }
  }

  /**
   * Detect if device is touch-based
   * Requirements: 8.4
   */
  private isTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  /**
   * Show specific page with navigation controls
   * Requirements: 8.2
   */
  private showPage(pageIndex: number): void {
    // Hide all pages
    this.contentPages.forEach((page) => page.setVisible(false));

    // Show current page
    if (pageIndex >= 0 && pageIndex < this.contentPages.length) {
      const page = this.contentPages[pageIndex];
      if (page) {
        page.setVisible(true);
        this.currentPage = pageIndex;
      }
    }

    // Update navigation controls
    this.updateNavigationControls();

    Logger.log(`HowToPlayScene: Showing page ${pageIndex + 1} of ${this.totalPages}`);
  }

  /**
   * Update navigation controls based on current page
   * Requirements: 8.2
   */
  private updateNavigationControls(): void {
    if (
      !this.prevButton ||
      !this.nextButton ||
      !this.pageIndicator ||
      !this.prevButtonText ||
      !this.nextButtonText
    )
      return;

    // Update previous button
    const canGoPrev = this.currentPage > 0;
    this.prevButton.setAlpha(canGoPrev ? 1 : 0.5);
    this.prevButtonText.setAlpha(canGoPrev ? 1 : 0.5);
    this.prevButton.setInteractive(canGoPrev);
    this.prevButtonText.setInteractive(canGoPrev);

    // Update next button
    const canGoNext = this.currentPage < this.totalPages - 1;
    this.nextButton.setAlpha(canGoNext ? 1 : 0.5);
    this.nextButtonText.setAlpha(canGoNext ? 1 : 0.5);
    this.nextButton.setInteractive(canGoNext);
    this.nextButtonText.setInteractive(canGoNext);

    // Update page indicator
    this.pageIndicator.setText(`${this.currentPage + 1} / ${this.totalPages}`);
  }

  /**
   * Navigate to previous page
   * Requirements: 8.2
   */
  private previousPage(): void {
    if (this.currentPage > 0) {
      this.playNavigationSound();
      this.showPage(this.currentPage - 1);
    }
  }

  /**
   * Navigate to next page
   * Requirements: 8.2
   */
  private nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.playNavigationSound();
      this.showPage(this.currentPage + 1);
    }
  }

  /**
   * Return to start menu
   * Requirements: 8.3
   */
  private returnToMenu(): void {
    this.playNavigationSound();
    this.scene.start('StartMenu');
    Logger.log('HowToPlayScene: Returning to StartMenu');
  }

  /**
   * Play navigation sound with error handling
   */
  private playNavigationSound(): void {
    try {
      if (audioHandler.getSoundEnabled() && audioHandler.isInitialized()) {
        audioHandler.playSound('menu-select');
      }
    } catch (error) {
      Logger.log(`HowToPlayScene: Navigation sound failed - ${error}`);
      // Continue with navigation even if sound fails
    }
  }

  /**
   * Get content for page 1 - Basic Gameplay
   * Requirements: 8.1
   */
  private getPage1Content(): string {
    return `BASIC GAMEPLAY

Welcome to Dicetrix! This is a fast-paced dice-matching puzzle game.

OBJECTIVE
Match and clear dice by creating groups of 3 or more identical dice.

CONTROLS
• Click/Tap: Select and place dice
• Drag: Move dice around the board
• Double-tap: Rotate dice (where applicable)

GAME FLOW
1. Dice fall from the top of the screen
2. Arrange them to create matching groups
3. Groups of 3+ identical dice disappear
4. Clear the board to advance levels`;
  }

  /**
   * Get content for page 2 - Scoring System
   * Requirements: 8.1
   */
  private getPage2Content(): string {
    return `SCORING SYSTEM

Earn points by creating matches and combos!

BASIC SCORING
• 3 dice match: 100 points
• 4 dice match: 250 points
• 5+ dice match: 500+ points

COMBO MULTIPLIERS
• Chain matches for bonus multipliers
• Longer chains = higher multipliers
• Maximum combo: 10x multiplier

BONUS POINTS
• Speed bonus: Clear quickly for extra points
• Perfect clear: Clear entire board bonus
• Level completion: Base level × 50 points

SPECIAL DICE
Some dice have special properties that can help create bigger matches and higher scores!`;
  }

  /**
   * Get content for page 3 - Difficulty Modes
   * Requirements: 8.1
   */
  private getPage3Content(): string {
    return `DIFFICULTY MODES

Choose your challenge level!

EASY MODE
• Slower dice falling speed
• More time to think and plan
• Perfect for learning the game

MEDIUM MODE
• Balanced gameplay experience
• Good mix of challenge and fun
• Recommended for most players

HARD MODE
• Faster dice falling speed
• Quick decision making required
• For experienced players

EXPERT MODE
• Maximum challenge level
• Lightning-fast gameplay
• Only for true masters

ZEN MODE
• Relaxed, untimed gameplay
• Focus on strategy over speed
• Perfect for casual play`;
  }

  /**
   * Get content for page 4 - Tips and Strategies
   * Requirements: 8.1
   */
  private getPage4Content(): string {
    return `TIPS & STRATEGIES

Master these techniques to achieve high scores!

PLANNING AHEAD
• Look for potential matches before placing dice
• Plan your moves 2-3 steps ahead
• Keep the board organized

COMBO TECHNIQUES
• Set up multiple matches simultaneously
• Create cascading effects
• Use gravity to your advantage

HIGH SCORE TIPS
• Focus on larger matches (4+ dice)
• Maintain combo chains
• Clear the board completely when possible
• Practice speed placement

GENERAL ADVICE
• Start with easier modes to learn
• Don't rush - accuracy beats speed
• Learn the patterns of each dice type
• Have fun and keep practicing!

Good luck, and may the dice be with you!`;
  }

  /**
   * Setup responsive behavior for orientation changes and screen resizing
   * Requirements: 8.4
   */
  private setupResponsiveBehavior(): void {
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

    Logger.log('HowToPlayScene: Responsive behavior initialized');
  }

  /**
   * Handle screen orientation changes for responsive layout
   * Requirements: 8.4
   */
  private handleOrientationChange(): void {
    // Debounce orientation changes to avoid excessive recalculations
    if (this.orientationChangeTimeout) {
      clearTimeout(this.orientationChangeTimeout);
    }

    this.orientationChangeTimeout = setTimeout(() => {
      this.updateResponsiveLayout();
    }, 250);
  }

  /**
   * Update layout for responsive behavior
   * Requirements: 8.4
   */
  private updateResponsiveLayout(): void {
    const { width, height } = this.scale;

    // Update title
    if (this.titleText) {
      const titleFontSize = this.calculateResponsiveTitleFontSize(width);
      this.titleText.setFontSize(titleFontSize);
      this.titleText.setPosition(width / 2, height * 0.1);

      // Re-scale title if needed
      const maxTitleWidth = width * 0.9;
      if (this.titleText.width > maxTitleWidth) {
        const scale = maxTitleWidth / this.titleText.width;
        this.titleText.setScale(scale);
      } else {
        this.titleText.setScale(1);
      }
    }

    // Update content pages
    this.updateContentPagesLayout(width, height);

    // Update navigation controls
    this.updateNavigationLayout(width, height);

    Logger.log(`HowToPlayScene: Responsive layout updated for ${width}x${height}`);
  }

  /**
   * Update content pages layout for responsive behavior
   * Requirements: 8.4
   */
  private updateContentPagesLayout(width: number, height: number): void {
    const contentY = height * 0.2;
    const contentWidth = width * 0.9;
    const fontSize = this.calculateResponsiveFontSize(width);

    this.contentPages.forEach((page) => {
      page.setPosition(width / 2, contentY);

      // Update text properties for each page
      const textObject = page.list[0] as Phaser.GameObjects.Text;
      if (textObject && textObject.type === 'Text') {
        textObject.setFontSize(fontSize);
        textObject.setWordWrapWidth(contentWidth);
      }
    });
  }

  /**
   * Update navigation layout for responsive behavior
   * Requirements: 8.4
   */
  private updateNavigationLayout(width: number, height: number): void {
    const navY = height * 0.85;
    const buttonWidth = this.calculateResponsiveButtonWidth(width);
    const buttonHeight = this.calculateResponsiveButtonHeight(width);
    const fontSize = this.calculateResponsiveButtonFontSize(width);

    // Update back button
    if (this.backButton && this.backButtonText) {
      this.backButton.setPosition(width / 2, height * 0.95);
      this.backButton.setSize(buttonWidth, buttonHeight);
      this.backButtonText.setPosition(width / 2, height * 0.95);
      this.backButtonText.setFontSize(fontSize);
    }

    // Update previous button
    if (this.prevButton && this.prevButtonText) {
      this.prevButton.setPosition(width * 0.2, navY);
      this.prevButton.setSize(buttonWidth * 0.8, buttonHeight);
      this.prevButtonText.setPosition(width * 0.2, navY);
      this.prevButtonText.setFontSize(fontSize * 0.9);
    }

    // Update next button
    if (this.nextButton && this.nextButtonText) {
      this.nextButton.setPosition(width * 0.8, navY);
      this.nextButton.setSize(buttonWidth * 0.8, buttonHeight);
      this.nextButtonText.setPosition(width * 0.8, navY);
      this.nextButtonText.setFontSize(fontSize * 0.9);
    }

    // Update page indicator
    if (this.pageIndicator) {
      this.pageIndicator.setPosition(width / 2, navY);
      this.pageIndicator.setFontSize(fontSize * 0.8);
    }
  }

  /**
   * Handle visibility changes for better mobile app lifecycle management
   * Requirements: 8.4
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // App is being backgrounded
      Logger.log('HowToPlayScene: App backgrounded');
    } else {
      // App is being foregrounded - check if layout needs updating
      setTimeout(() => {
        this.updateResponsiveLayout();
      }, 100);
    }
  }

  /**
   * Clean up responsive behavior listeners
   * Requirements: 8.4
   */
  private cleanupResponsiveBehavior(): void {
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

    Logger.log('HowToPlayScene: Responsive behavior cleanup completed');
  }

  /**
   * Initialize scene and setup cleanup on shutdown
   * Requirements: 8.4
   */
  init(): void {
    // Setup cleanup when scene shuts down
    this.events.once('shutdown', () => {
      this.cleanupResponsiveBehavior();
    });
  }
}
