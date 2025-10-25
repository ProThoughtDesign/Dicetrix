import { Scene } from 'phaser';
import { GameMode } from '../../../shared/types/game';
import { AllLeaderboardsResponse, LeaderboardResponse, LeaderboardEntry } from '../../../shared/types/api';
import { audioHandler } from '../services/AudioHandler';
import Logger from '../../utils/Logger';

export class LeaderboardScene extends Scene {
  // UI Components
  private difficultyTabs: Map<GameMode, Phaser.GameObjects.Container> = new Map();
  private leaderboardDisplay: Phaser.GameObjects.Container | null = null;
  private userStatsPanel: Phaser.GameObjects.Container | null = null;
  private refreshButton: Phaser.GameObjects.Rectangle | null = null;
  private backButton: Phaser.GameObjects.Rectangle | null = null;
  private loadingText: Phaser.GameObjects.Text | null = null;
  private errorText: Phaser.GameObjects.Text | null = null;

  // State management
  private currentMode: GameMode = 'medium';
  private leaderboardData: Record<GameMode, LeaderboardResponse> = {} as Record<GameMode, LeaderboardResponse>;
  private userStats: { totalGamesPlayed: number; bestDifficulty: GameMode; overallRank: number } | undefined;
  private isLoading = false;

  // Pagination and scrolling support for large datasets (Requirements 7.2, 7.3, 7.5)
  private currentPage = 0;
  private entriesPerPage = 10;
  private maxVisibleEntries = 8; // Adjust based on screen size
  private scrollContainer: Phaser.GameObjects.Container | null = null;
  private paginationControls: Phaser.GameObjects.Container | null = null;
  private scrollY = 0;
  private maxScrollY = 0;

  // Layout constants
  private readonly UI_SCALE = 2;
  private readonly MODES: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];
  private readonly MODE_COLORS = {
    easy: 0x00ff88,
    medium: 0xffff33,
    hard: 0xff3366,
    expert: 0xff9933,
    zen: 0xcc33ff
  };

  constructor() {
    super('LeaderboardScene');
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;

    // Set background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Create title
    this.createTitle(width, height);

    // Create back button
    this.createBackButton(width, height);

    // Create refresh button
    this.createRefreshButton(width, height);

    // Create difficulty tabs
    this.createDifficultyTabs(width, height);

    // Create loading indicator
    this.createLoadingIndicator(width, height);

    // Create error display
    this.createErrorDisplay(width, height);

    // Create leaderboard display container with scrolling support
    this.createLeaderboardDisplay(width, height);

    // Create pagination controls for large datasets
    this.createPaginationControls(width, height);

    // Create user stats panel
    this.createUserStatsPanel(width, height);

    // Setup mobile-specific interactions
    this.setupMobileInteractions();

    // Load initial data
    await this.loadLeaderboardData();

    // Setup responsive behavior
    this.setupResponsiveBehavior();
  }

  /**
   * Create the scene title
   * Requirements: 7.1, 7.2
   */
  private createTitle(width: number, _height: number): void {
    this.add
      .text(width / 2, _height * 0.08, 'LEADERBOARDS', {
        fontSize: `${48 * this.UI_SCALE}px`,
        color: '#00ff88',
        fontFamily: 'Nabla, Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
  }

  /**
   * Create back button to return to start menu
   * Requirements: 7.4
   */
  private createBackButton(width: number, _height: number): void {
    const buttonSize = 40 * this.UI_SCALE;
    
    this.backButton = this.add
      .rectangle(width - 50 * this.UI_SCALE, 50 * this.UI_SCALE, buttonSize, buttonSize, 0x666666)
      .setOrigin(1, 0)
      .setStrokeStyle(2, 0x000000, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.backButton?.setFillStyle(0x888888))
      .on('pointerout', () => this.backButton?.setFillStyle(0x666666))
      .on('pointerdown', () => this.returnToMenu());

    this.add
      .text(width - 50 * this.UI_SCALE - buttonSize / 2, 50 * this.UI_SCALE + buttonSize / 2, '✕', {
        fontSize: `${20 * this.UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.returnToMenu());
  }

  /**
   * Create refresh button to reload leaderboard data
   * Requirements: 7.2, 7.5
   */
  private createRefreshButton(_width: number, _height: number): void {
    const buttonWidth = 120 * this.UI_SCALE;
    const buttonHeight = 40 * this.UI_SCALE;
    
    this.refreshButton = this.add
      .rectangle(50 * this.UI_SCALE, 50 * this.UI_SCALE, buttonWidth, buttonHeight, 0x666666)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x000000, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.refreshButton?.setFillStyle(0x888888))
      .on('pointerout', () => this.refreshButton?.setFillStyle(0x666666))
      .on('pointerdown', () => this.refreshData());

    this.add
      .text(50 * this.UI_SCALE + buttonWidth / 2, 50 * this.UI_SCALE + buttonHeight / 2, 'REFRESH', {
        fontSize: `${18 * this.UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.refreshData());
  }

  /**
   * Create difficulty selection tabs
   * Requirements: 7.1, 7.2, 7.3
   */
  private createDifficultyTabs(width: number, height: number): void {
    const tabWidth = (width - 100 * this.UI_SCALE) / this.MODES.length;
    const tabHeight = 50 * this.UI_SCALE;
    const startX = 50 * this.UI_SCALE;
    const tabY = height * 0.18;

    this.MODES.forEach((mode, index) => {
      const tabX = startX + index * tabWidth;
      const isActive = mode === this.currentMode;
      const color = isActive ? this.MODE_COLORS[mode] : 0x444444;

      // Tab background
      const tabBg = this.add
        .rectangle(tabX, tabY, tabWidth - 4 * this.UI_SCALE, tabHeight, color)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x000000, 0.8)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          if (mode !== this.currentMode) {
            tabBg.setFillStyle(0x666666);
          }
        })
        .on('pointerout', () => {
          if (mode !== this.currentMode) {
            tabBg.setFillStyle(0x444444);
          }
        })
        .on('pointerdown', () => this.switchDifficulty(mode));

      // Tab label
      const tabLabel = this.add
        .text(tabX + tabWidth / 2 - 2 * this.UI_SCALE, tabY + tabHeight / 2, mode.toUpperCase(), {
          fontSize: `${14 * this.UI_SCALE}px`,
          color: isActive ? this.getContrastColor(this.MODE_COLORS[mode]) : '#ffffff',
          fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
          stroke: '#000000',
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.switchDifficulty(mode));

      // Store tab components
      const tabContainer = this.add.container(0, 0, [tabBg, tabLabel]);
      this.difficultyTabs.set(mode, tabContainer);
    });
  }

  /**
   * Create loading indicator
   * Requirements: 7.5
   */
  private createLoadingIndicator(width: number, height: number): void {
    this.loadingText = this.add
      .text(width / 2, height / 2, 'Loading leaderboards...', {
        fontSize: `${24 * this.UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  /**
   * Create error display
   * Requirements: 7.5
   */
  private createErrorDisplay(width: number, height: number): void {
    this.errorText = this.add
      .text(width / 2, height / 2, '', {
        fontSize: `${20 * this.UI_SCALE}px`,
        color: '#ff3366',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        align: 'center',
        wordWrap: { width: width - 100 * this.UI_SCALE }
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  /**
   * Create leaderboard display container with scrolling support
   * Requirements: 7.2, 7.3, 7.5
   */
  private createLeaderboardDisplay(width: number, height: number): void {
    this.leaderboardDisplay = this.add.container(0, 0);
    
    // Create scroll container for large datasets
    this.scrollContainer = this.add.container(0, 0);
    this.leaderboardDisplay.add(this.scrollContainer);
    
    // Calculate max visible entries based on screen size for responsive design
    this.calculateResponsiveLayout(width, height);
  }

  /**
   * Create pagination controls for large datasets
   * Requirements: 7.2, 7.5
   */
  private createPaginationControls(width: number, height: number): void {
    this.paginationControls = this.add.container(0, 0);
    
    const controlsY = height * 0.82;
    const buttonSize = 40 * this.UI_SCALE;
    const buttonSpacing = 60 * this.UI_SCALE;
    
    // Previous page button
    const prevButton = this.add
      .rectangle(width / 2 - buttonSpacing, controlsY, buttonSize, buttonSize, 0x666666)
      .setStrokeStyle(2, 0x000000, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => prevButton.setFillStyle(0x888888))
      .on('pointerout', () => prevButton.setFillStyle(0x666666))
      .on('pointerdown', () => this.previousPage());

    const prevIcon = this.add
      .text(width / 2 - buttonSpacing, controlsY, '◀', {
        fontSize: `${20 * this.UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.previousPage());

    // Next page button
    const nextButton = this.add
      .rectangle(width / 2 + buttonSpacing, controlsY, buttonSize, buttonSize, 0x666666)
      .setStrokeStyle(2, 0x000000, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => nextButton.setFillStyle(0x888888))
      .on('pointerout', () => nextButton.setFillStyle(0x666666))
      .on('pointerdown', () => this.nextPage());

    const nextIcon = this.add
      .text(width / 2 + buttonSpacing, controlsY, '▶', {
        fontSize: `${20 * this.UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.nextPage());

    // Page indicator
    const pageIndicator = this.add
      .text(width / 2, controlsY, '', {
        fontSize: `${16 * this.UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
      })
      .setOrigin(0.5);

    this.paginationControls.add([prevButton, prevIcon, nextButton, nextIcon, pageIndicator]);
  }

  /**
   * Create user stats panel
   * Requirements: 7.3
   */
  private createUserStatsPanel(_width: number, _height: number): void {
    this.userStatsPanel = this.add.container(0, 0);
  }

  /**
   * Load leaderboard data from server
   * Requirements: 7.2, 7.5
   */
  async loadLeaderboardData(mode?: GameMode): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading(true);
    this.hideError();

    try {
      Logger.log(`LeaderboardScene: Loading leaderboard data for ${mode || 'all modes'}`);

      const response = await fetch('/api/leaderboards/all');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboards: ${response.status} ${response.statusText}`);
      }

      const data: AllLeaderboardsResponse = await response.json();
      
      this.leaderboardData = data.leaderboards;
      this.userStats = data.userStats;

      Logger.log(`LeaderboardScene: Successfully loaded leaderboard data`);

      // Update display
      this.updateLeaderboardDisplay();
      this.updateUserStatsDisplay();

    } catch (error) {
      Logger.log(`LeaderboardScene: Error loading leaderboard data: ${String(error)}`);
      this.showError('Failed to load leaderboards. Please check your connection and try again.');
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Switch to a different difficulty mode
   * Requirements: 7.1, 7.2, 7.3
   */
  switchDifficulty(mode: GameMode): void {
    if (mode === this.currentMode || this.isLoading) return;

    Logger.log(`LeaderboardScene: Switching to ${mode} difficulty`);

    // Play sound effect
    try {
      audioHandler.playSound('menu-select');
    } catch (error) {
      Logger.log(`LeaderboardScene: Sound effect failed: ${String(error)}`);
    }

    // Update current mode and reset pagination
    this.currentMode = mode;
    this.currentPage = 0;

    // Update tab appearance
    this.updateTabAppearance();

    // Update leaderboard display
    this.updateLeaderboardDisplay();
  }

  /**
   * Refresh leaderboard data
   * Requirements: 7.2, 7.5
   */
  async refreshData(): Promise<void> {
    Logger.log('LeaderboardScene: Refreshing leaderboard data');

    // Play sound effect
    try {
      audioHandler.playSound('menu-select');
    } catch (error) {
      Logger.log(`LeaderboardScene: Sound effect failed: ${String(error)}`);
    }

    await this.loadLeaderboardData();
  }

  /**
   * Return to start menu
   * Requirements: 7.4
   */
  private returnToMenu(): void {
    Logger.log('LeaderboardScene: Returning to start menu');

    // Play sound effect
    try {
      audioHandler.playSound('menu-select');
    } catch (error) {
      Logger.log(`LeaderboardScene: Sound effect failed: ${String(error)}`);
    }

    this.scene.start('StartMenu');
  }

  /**
   * Update tab appearance based on current mode
   * Requirements: 7.1, 7.3
   */
  private updateTabAppearance(): void {
    this.MODES.forEach((mode) => {
      const tabContainer = this.difficultyTabs.get(mode);
      if (!tabContainer) return;

      const [tabBg, tabLabel] = tabContainer.list as [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text];
      const isActive = mode === this.currentMode;
      
      if (isActive) {
        tabBg.setFillStyle(this.MODE_COLORS[mode]);
        tabLabel.setColor(this.getContrastColor(this.MODE_COLORS[mode]));
      } else {
        tabBg.setFillStyle(0x444444);
        tabLabel.setColor('#ffffff');
      }
    });
  }

  /**
   * Update leaderboard display for current mode with pagination support
   * Requirements: 7.2, 7.3, 7.5
   */
  private updateLeaderboardDisplay(): void {
    if (!this.leaderboardDisplay || !this.scrollContainer) return;

    // Clear existing display
    this.scrollContainer.removeAll(true);

    const currentData = this.leaderboardData[this.currentMode];
    if (!currentData || !currentData.entries.length) {
      this.showEmptyLeaderboard();
      this.updatePaginationControls();
      return;
    }

    const { width, height } = this.scale;
    const startY = height * 0.3;
    const entryHeight = 60 * this.UI_SCALE;
    
    // Calculate pagination
    const startIndex = this.currentPage * this.entriesPerPage;
    const endIndex = Math.min(startIndex + this.entriesPerPage, currentData.entries.length);
    const visibleEntries = currentData.entries.slice(startIndex, endIndex);
    
    // Limit visible entries for mobile devices
    const maxDisplayEntries = Math.min(visibleEntries.length, this.maxVisibleEntries);

    // Create header
    this.createLeaderboardHeader(width, startY - 40 * this.UI_SCALE);

    // Create entries with pagination
    for (let i = 0; i < maxDisplayEntries; i++) {
      const entry = visibleEntries[i];
      if (entry) {
        const entryY = startY + i * entryHeight;
        const globalRank = startIndex + i + 1; // Global rank across all pages
        this.createLeaderboardEntry(entry, width, entryY, globalRank);
      }
    }

    // Calculate scroll bounds for touch scrolling
    this.maxScrollY = Math.max(0, (visibleEntries.length - this.maxVisibleEntries) * entryHeight);

    // Show reset info if available and space permits
    if (currentData.resetInfo && maxDisplayEntries < this.maxVisibleEntries) {
      this.createResetInfo(currentData.resetInfo, width, startY + maxDisplayEntries * entryHeight + 40 * this.UI_SCALE);
    }

    // Update pagination controls
    this.updatePaginationControls();

    // Reset scroll position when switching modes or pages
    this.scrollY = 0;
    this.scrollContainer.setY(0);
  }

  /**
   * Create leaderboard header
   * Requirements: 7.2, 7.3
   */
  private createLeaderboardHeader(width: number, y: number): void {
    const headerBg = this.add
      .rectangle(width / 2, y, width - 100 * this.UI_SCALE, 40 * this.UI_SCALE, 0x333333)
      .setStrokeStyle(2, 0x000000, 0.8);

    const rankText = this.add
      .text(120 * this.UI_SCALE, y, 'RANK', {
        fontSize: `${16 * this.UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    const playerText = this.add
      .text(width / 2, y, 'PLAYER', {
        fontSize: `${16 * this.UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    const scoreText = this.add
      .text(width - 120 * this.UI_SCALE, y, 'SCORE', {
        fontSize: `${16 * this.UI_SCALE}px`,
        color: '#ffffff',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    this.scrollContainer?.add([headerBg, rankText, playerText, scoreText]);
  }

  /**
   * Create individual leaderboard entry
   * Requirements: 7.2, 7.3
   */
  private createLeaderboardEntry(entry: LeaderboardEntry, width: number, y: number, rank: number): void {
    const isCurrentUser = entry.isCurrentUser;
    const bgColor = isCurrentUser ? 0x004400 : (rank % 2 === 0 ? 0x2a2a2a : 0x1a1a1a);
    const textColor = isCurrentUser ? '#00ff88' : '#ffffff';

    const entryBg = this.add
      .rectangle(width / 2, y, width - 100 * this.UI_SCALE, 50 * this.UI_SCALE, bgColor)
      .setStrokeStyle(1, 0x000000, 0.5);

    const rankText = this.add
      .text(120 * this.UI_SCALE, y, `#${rank}`, {
        fontSize: `${18 * this.UI_SCALE}px`,
        color: textColor,
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    const playerText = this.add
      .text(width / 2, y, entry.username, {
        fontSize: `${16 * this.UI_SCALE}px`,
        color: textColor,
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    const scoreText = this.add
      .text(width - 120 * this.UI_SCALE, y, entry.score.toLocaleString(), {
        fontSize: `${18 * this.UI_SCALE}px`,
        color: textColor,
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    this.scrollContainer?.add([entryBg, rankText, playerText, scoreText]);
  }

  /**
   * Show empty leaderboard message
   * Requirements: 7.5
   */
  private showEmptyLeaderboard(): void {
    const { width, height } = this.scale;
    
    const emptyText = this.add
      .text(width / 2, height * 0.5, `No scores yet for ${this.currentMode.toUpperCase()} mode.\nBe the first to play!`, {
        fontSize: `${20 * this.UI_SCALE}px`,
        color: '#888888',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

    this.scrollContainer?.add(emptyText);
  }

  /**
   * Create reset info display
   * Requirements: 7.2
   */
  private createResetInfo(resetInfo: any, width: number, y: number): void {
    const nextReset = new Date(resetInfo.nextReset).toLocaleString();
    
    const resetText = this.add
      .text(width / 2, y, `Next Reset: ${nextReset} (${resetInfo.resetInterval})`, {
        fontSize: `${14 * this.UI_SCALE}px`,
        color: '#cccccc',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

    this.scrollContainer?.add(resetText);
  }

  /**
   * Update user stats display
   * Requirements: 7.3
   */
  private updateUserStatsDisplay(): void {
    if (!this.userStatsPanel || !this.userStats) return;

    // Clear existing stats
    this.userStatsPanel.removeAll(true);

    const { width, height } = this.scale;
    const statsY = height * 0.85;

    const statsText = this.add
      .text(width / 2, statsY, 
        `Games Played: ${this.userStats.totalGamesPlayed} | ` +
        `Best Mode: ${this.userStats.bestDifficulty.toUpperCase()} | ` +
        `Overall Rank: #${this.userStats.overallRank}`, {
        fontSize: `${14 * this.UI_SCALE}px`,
        color: '#00ff88',
        fontFamily: 'Asimovian, "Arial Black", Arial, sans-serif',
        align: 'center',
      })
      .setOrigin(0.5);

    this.userStatsPanel.add(statsText);
  }

  /**
   * Show/hide loading indicator
   * Requirements: 7.5
   */
  private showLoading(show: boolean): void {
    if (this.loadingText) {
      this.loadingText.setVisible(show);
    }
    
    // Hide other elements when loading
    if (this.leaderboardDisplay) {
      this.leaderboardDisplay.setVisible(!show);
    }
    if (this.userStatsPanel) {
      this.userStatsPanel.setVisible(!show);
    }
  }

  /**
   * Show error message
   * Requirements: 7.5
   */
  private showError(message: string): void {
    if (this.errorText) {
      this.errorText.setText(message);
      this.errorText.setVisible(true);
    }
    
    // Hide other elements when showing error
    if (this.leaderboardDisplay) {
      this.leaderboardDisplay.setVisible(false);
    }
    if (this.userStatsPanel) {
      this.userStatsPanel.setVisible(false);
    }
  }

  /**
   * Hide error message
   * Requirements: 7.5
   */
  private hideError(): void {
    if (this.errorText) {
      this.errorText.setVisible(false);
    }
  }

  /**
   * Get contrast color for text on colored backgrounds
   */
  private getContrastColor(color: number): string {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 140 ? '#ffffff' : '#000000';
  }

  /**
   * Setup responsive behavior for mobile support
   * Requirements: 7.5
   */
  private setupResponsiveBehavior(): void {
    // Listen for orientation changes and resize events
    this.scale.on('resize', () => {
      this.handleResize();
    });

    // Handle visibility changes for mobile app lifecycle
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // Refresh data when app becomes visible again
          setTimeout(() => {
            this.refreshData();
          }, 500);
        }
      });
    }
  }

  /**
   * Setup mobile-specific interactions including touch scrolling
   * Requirements: 7.2, 7.5
   */
  private setupMobileInteractions(): void {
    // Enable touch scrolling for mobile devices
    if (this.isMobileDevice()) {
      this.setupTouchScrolling();
    }
    
    // Setup swipe gestures for tab switching on mobile
    this.setupSwipeGestures();
  }

  /**
   * Calculate responsive layout based on screen size
   * Requirements: 7.2, 7.5
   */
  private calculateResponsiveLayout(width: number, height: number): void {
    // Adjust entries per page based on screen size
    const availableHeight = height * 0.5; // Available space for leaderboard entries
    const entryHeight = 60 * this.UI_SCALE;
    
    this.maxVisibleEntries = Math.floor(availableHeight / entryHeight);
    this.entriesPerPage = Math.max(5, this.maxVisibleEntries); // Minimum 5 entries
    
    // Adjust UI scale for very small screens
    if (width < 600 || height < 800) {
      this.maxVisibleEntries = Math.max(4, Math.floor(this.maxVisibleEntries * 0.8));
    }
    
    Logger.log(`LeaderboardScene: Responsive layout - ${this.maxVisibleEntries} visible entries, ${this.entriesPerPage} per page`);
  }

  /**
   * Setup touch scrolling for mobile devices
   * Requirements: 7.2, 7.5
   */
  private setupTouchScrolling(): void {
    if (!this.scrollContainer) return;

    let isDragging = false;
    let startY = 0;
    let startScrollY = 0;

    // Make the entire leaderboard area scrollable
    const { width, height } = this.scale;
    const scrollArea = this.add
      .rectangle(width / 2, height * 0.55, width - 100 * this.UI_SCALE, height * 0.4, 0x000000, 0)
      .setInteractive({ draggable: true });

    scrollArea.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      startY = pointer.y;
      startScrollY = this.scrollY;
    });

    scrollArea.on('drag', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      
      const deltaY = pointer.y - startY;
      const newScrollY = startScrollY - deltaY;
      
      // Constrain scroll within bounds
      this.scrollY = Math.max(0, Math.min(this.maxScrollY, newScrollY));
      
      if (this.scrollContainer) {
        this.scrollContainer.setY(-this.scrollY);
      }
    });

    scrollArea.on('dragend', () => {
      isDragging = false;
    });

    // Add scroll area to leaderboard display
    this.leaderboardDisplay?.add(scrollArea);
  }

  /**
   * Setup swipe gestures for tab switching on mobile
   * Requirements: 7.2, 7.5
   */
  private setupSwipeGestures(): void {
    if (!this.isMobileDevice()) return;

    const { width, height } = this.scale;
    let startX = 0;
    let startTime = 0;

    // Create swipe detection area over the tabs
    const swipeArea = this.add
      .rectangle(width / 2, height * 0.18, width, 50 * this.UI_SCALE, 0x000000, 0)
      .setInteractive();

    swipeArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      startX = pointer.x;
      startTime = Date.now();
    });

    swipeArea.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const deltaX = pointer.x - startX;
      const deltaTime = Date.now() - startTime;
      
      // Detect swipe (minimum distance and maximum time)
      if (Math.abs(deltaX) > 50 && deltaTime < 500) {
        const currentIndex = this.MODES.indexOf(this.currentMode);
        
        if (deltaX > 0 && currentIndex > 0) {
          // Swipe right - previous tab
          const prevMode = this.MODES[currentIndex - 1];
          if (prevMode) {
            this.switchDifficulty(prevMode);
          }
        } else if (deltaX < 0 && currentIndex < this.MODES.length - 1) {
          // Swipe left - next tab
          const nextMode = this.MODES[currentIndex + 1];
          if (nextMode) {
            this.switchDifficulty(nextMode);
          }
        }
      }
    });
  }

  /**
   * Detect if current device is mobile
   * Requirements: 7.5
   */
  private isMobileDevice(): boolean {
    const { width, height } = this.scale;
    
    // Multiple detection methods for better accuracy
    const hasTouchScreen = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 || 
                          (navigator as any).msMaxTouchPoints > 0;
    
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    
    const isMobileSize = width <= 768 || height <= 1024;
    
    return hasTouchScreen || isMobileUserAgent || hasCoarsePointer || isMobileSize;
  }

  /**
   * Navigate to previous page
   * Requirements: 7.2, 7.5
   */
  private previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateLeaderboardDisplay();
      this.updatePaginationControls();
      
      // Play sound effect
      try {
        audioHandler.playSound('menu-select');
      } catch (error) {
        Logger.log(`LeaderboardScene: Sound effect failed: ${String(error)}`);
      }
    }
  }

  /**
   * Navigate to next page
   * Requirements: 7.2, 7.5
   */
  private nextPage(): void {
    const currentData = this.leaderboardData[this.currentMode];
    if (!currentData) return;
    
    const maxPages = Math.ceil(currentData.entries.length / this.entriesPerPage);
    
    if (this.currentPage < maxPages - 1) {
      this.currentPage++;
      this.updateLeaderboardDisplay();
      this.updatePaginationControls();
      
      // Play sound effect
      try {
        audioHandler.playSound('menu-select');
      } catch (error) {
        Logger.log(`LeaderboardScene: Sound effect failed: ${String(error)}`);
      }
    }
  }

  /**
   * Update pagination controls display
   * Requirements: 7.2, 7.5
   */
  private updatePaginationControls(): void {
    if (!this.paginationControls) return;
    
    const currentData = this.leaderboardData[this.currentMode];
    if (!currentData || currentData.entries.length <= this.entriesPerPage) {
      this.paginationControls.setVisible(false);
      return;
    }
    
    this.paginationControls.setVisible(true);
    
    const maxPages = Math.ceil(currentData.entries.length / this.entriesPerPage);
    const pageIndicator = this.paginationControls.list[4] as Phaser.GameObjects.Text;
    
    if (pageIndicator) {
      pageIndicator.setText(`Page ${this.currentPage + 1} of ${maxPages}`);
    }
    
    // Enable/disable buttons based on current page
    const prevButton = this.paginationControls.list[0] as Phaser.GameObjects.Rectangle;
    const nextButton = this.paginationControls.list[2] as Phaser.GameObjects.Rectangle;
    
    if (prevButton) {
      prevButton.setAlpha(this.currentPage > 0 ? 1 : 0.5);
    }
    
    if (nextButton) {
      nextButton.setAlpha(this.currentPage < maxPages - 1 ? 1 : 0.5);
    }
  }

  /**
   * Handle screen resize for responsive layout
   * Requirements: 7.5
   */
  private handleResize(): void {
    // Debounce resize events
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      this.updateResponsiveLayout();
    }, 250);
  }

  private resizeTimeout: NodeJS.Timeout | null = null;

  /**
   * Update layout for responsive behavior
   * Requirements: 7.5
   */
  private updateResponsiveLayout(): void {
    // Recreate the entire layout with new dimensions
    const { width, height } = this.scale;
    
    // Recalculate responsive layout parameters
    this.calculateResponsiveLayout(width, height);
    
    // Update difficulty tabs
    this.difficultyTabs.clear();
    this.createDifficultyTabs(width, height);
    
    // Recreate scroll container with new dimensions
    if (this.scrollContainer) {
      this.scrollContainer.destroy();
      this.scrollContainer = this.add.container(0, 0);
      this.leaderboardDisplay?.add(this.scrollContainer);
    }
    
    // Recreate pagination controls
    if (this.paginationControls) {
      this.paginationControls.destroy();
      this.createPaginationControls(width, height);
    }
    
    // Update leaderboard display
    this.updateLeaderboardDisplay();
    
    // Update user stats
    this.updateUserStatsDisplay();
    
    // Reapply mobile interactions
    this.setupMobileInteractions();
    
    Logger.log('LeaderboardScene: Responsive layout updated');
  }

  /**
   * Cleanup when scene shuts down
   */
  shutdown(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', () => {});
    }
  }
}
