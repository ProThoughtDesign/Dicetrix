import { GameMode } from '../../../shared/types/game.js';
import { GAME_MODES } from '../../../shared/config/game-modes.js';

export interface ProgressionData {
  currentMode: GameMode;
  unlockedModes: GameMode[];
  highScores: Record<GameMode, number>;
  totalPlayTime: number;
  gamesPlayed: number;
}

export interface ProgressionThresholds {
  scoreThreshold: number;
  gamesThreshold: number;
  description: string;
}

/**
 * System for managing game mode progression and unlocking
 */
export class ProgressionSystem {
  private static instance: ProgressionSystem | null = null;
  
  private progressionData: ProgressionData;
  private readonly PROGRESSION_THRESHOLDS: Record<GameMode, ProgressionThresholds> = {
    easy: {
      scoreThreshold: 0,
      gamesThreshold: 0,
      description: 'Available from start'
    },
    medium: {
      scoreThreshold: 5000,
      gamesThreshold: 3,
      description: 'Score 5,000+ points in Easy mode'
    },
    hard: {
      scoreThreshold: 15000,
      gamesThreshold: 5,
      description: 'Score 15,000+ points in Medium mode'
    },
    expert: {
      scoreThreshold: 50000,
      gamesThreshold: 10,
      description: 'Score 50,000+ points in Hard mode'
    },
    zen: {
      scoreThreshold: 10000,
      gamesThreshold: 5,
      description: 'Score 10,000+ points in any mode'
    }
  };

  private constructor() {
    this.progressionData = this.loadProgressionData();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProgressionSystem {
    if (!ProgressionSystem.instance) {
      ProgressionSystem.instance = new ProgressionSystem();
    }
    return ProgressionSystem.instance;
  }

  /**
   * Load progression data from localStorage
   */
  private loadProgressionData(): ProgressionData {
    try {
      const saved = localStorage.getItem('dicetrix_progression');
      if (saved) {
        const data = JSON.parse(saved) as ProgressionData;
        
        // Validate and ensure all required fields exist
        return {
          currentMode: data.currentMode || 'easy',
          unlockedModes: data.unlockedModes || ['easy'],
          highScores: data.highScores || { easy: 0, medium: 0, hard: 0, expert: 0, zen: 0 },
          totalPlayTime: data.totalPlayTime || 0,
          gamesPlayed: data.gamesPlayed || 0
        };
      }
    } catch (error) {
      console.warn('Failed to load progression data:', error);
    }

    // Return default progression data
    return {
      currentMode: 'easy',
      unlockedModes: ['easy'],
      highScores: { easy: 0, medium: 0, hard: 0, expert: 0, zen: 0 },
      totalPlayTime: 0,
      gamesPlayed: 0
    };
  }

  /**
   * Save progression data to localStorage
   */
  private saveProgressionData(): void {
    try {
      localStorage.setItem('dicetrix_progression', JSON.stringify(this.progressionData));
    } catch (error) {
      console.error('Failed to save progression data:', error);
    }
  }

  /**
   * Get current progression data
   */
  public getProgressionData(): ProgressionData {
    return { ...this.progressionData };
  }

  /**
   * Get unlocked modes
   */
  public getUnlockedModes(): GameMode[] {
    return [...this.progressionData.unlockedModes];
  }

  /**
   * Get current mode
   */
  public getCurrentMode(): GameMode {
    return this.progressionData.currentMode;
  }

  /**
   * Set current mode
   */
  public setCurrentMode(mode: GameMode): void {
    if (this.progressionData.unlockedModes.includes(mode)) {
      this.progressionData.currentMode = mode;
      this.saveProgressionData();
    }
  }

  /**
   * Get high score for a mode
   */
  public getHighScore(mode: GameMode): number {
    return this.progressionData.highScores[mode] || 0;
  }

  /**
   * Update high score and check for new unlocks
   */
  public updateScore(mode: GameMode, score: number): GameMode[] {
    const previousHighScore = this.progressionData.highScores[mode] || 0;
    
    // Update high score if new record
    if (score > previousHighScore) {
      this.progressionData.highScores[mode] = score;
    }

    // Increment games played
    this.progressionData.gamesPlayed++;

    // Check for new unlocks
    const newlyUnlocked = this.checkForNewUnlocks();
    
    this.saveProgressionData();
    return newlyUnlocked;
  }

  /**
   * Check for newly unlocked modes based on current progression
   */
  private checkForNewUnlocks(): GameMode[] {
    const newlyUnlocked: GameMode[] = [];
    const modes: GameMode[] = ['easy', 'medium', 'hard', 'expert', 'zen'];

    for (const mode of modes) {
      if (!this.progressionData.unlockedModes.includes(mode)) {
        if (this.isModeUnlocked(mode)) {
          this.progressionData.unlockedModes.push(mode);
          newlyUnlocked.push(mode);
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Check if a specific mode should be unlocked
   */
  private isModeUnlocked(mode: GameMode): boolean {
    const threshold = this.PROGRESSION_THRESHOLDS[mode];
    
    switch (mode) {
      case 'easy':
        return true; // Always unlocked
        
      case 'medium':
        return this.progressionData.highScores.easy >= threshold.scoreThreshold &&
               this.progressionData.gamesPlayed >= threshold.gamesThreshold;
               
      case 'hard':
        return this.progressionData.highScores.medium >= threshold.scoreThreshold &&
               this.progressionData.gamesPlayed >= threshold.gamesThreshold;
               
      case 'expert':
        return this.progressionData.highScores.hard >= threshold.scoreThreshold &&
               this.progressionData.gamesPlayed >= threshold.gamesThreshold;
               
      case 'zen':
        // Zen mode unlocks when player reaches threshold in any mode
        const anyModeScore = Math.max(
          this.progressionData.highScores.easy,
          this.progressionData.highScores.medium,
          this.progressionData.highScores.hard,
          this.progressionData.highScores.expert
        );
        return anyModeScore >= threshold.scoreThreshold &&
               this.progressionData.gamesPlayed >= threshold.gamesThreshold;
               
      default:
        return false;
    }
  }

  /**
   * Get progression requirements for a mode
   */
  public getProgressionRequirements(mode: GameMode): ProgressionThresholds {
    return { ...this.PROGRESSION_THRESHOLDS[mode] };
  }

  /**
   * Get progress towards unlocking a mode (0-1)
   */
  public getUnlockProgress(mode: GameMode): number {
    if (this.progressionData.unlockedModes.includes(mode)) {
      return 1.0;
    }

    const threshold = this.PROGRESSION_THRESHOLDS[mode];
    
    switch (mode) {
      case 'medium': {
        const scoreProgress = Math.min(1, this.progressionData.highScores.easy / threshold.scoreThreshold);
        const gamesProgress = Math.min(1, this.progressionData.gamesPlayed / threshold.gamesThreshold);
        return Math.min(scoreProgress, gamesProgress);
      }
      
      case 'hard': {
        const scoreProgress = Math.min(1, this.progressionData.highScores.medium / threshold.scoreThreshold);
        const gamesProgress = Math.min(1, this.progressionData.gamesPlayed / threshold.gamesThreshold);
        return Math.min(scoreProgress, gamesProgress);
      }
      
      case 'expert': {
        const scoreProgress = Math.min(1, this.progressionData.highScores.hard / threshold.scoreThreshold);
        const gamesProgress = Math.min(1, this.progressionData.gamesPlayed / threshold.gamesThreshold);
        return Math.min(scoreProgress, gamesProgress);
      }
      
      case 'zen': {
        const anyModeScore = Math.max(
          this.progressionData.highScores.easy,
          this.progressionData.highScores.medium,
          this.progressionData.highScores.hard,
          this.progressionData.highScores.expert
        );
        const scoreProgress = Math.min(1, anyModeScore / threshold.scoreThreshold);
        const gamesProgress = Math.min(1, this.progressionData.gamesPlayed / threshold.gamesThreshold);
        return Math.min(scoreProgress, gamesProgress);
      }
      
      default:
        return 0;
    }
  }

  /**
   * Get next mode to unlock
   */
  public getNextModeToUnlock(): GameMode | null {
    const modes: GameMode[] = ['medium', 'hard', 'expert', 'zen'];
    
    for (const mode of modes) {
      if (!this.progressionData.unlockedModes.includes(mode)) {
        return mode;
      }
    }
    
    return null; // All modes unlocked
  }

  /**
   * Get suggested next mode based on current progression
   */
  public getSuggestedMode(): GameMode {
    const unlockedModes = this.progressionData.unlockedModes;
    
    // If only easy is unlocked, suggest easy
    if (unlockedModes.length === 1 && unlockedModes.includes('easy')) {
      return 'easy';
    }
    
    // If zen is unlocked and player wants relaxed gameplay
    if (unlockedModes.includes('zen')) {
      // Suggest zen if player has played many games (might want to relax)
      if (this.progressionData.gamesPlayed > 20) {
        return 'zen';
      }
    }
    
    // Otherwise suggest the highest unlocked difficulty mode
    const difficultyOrder: GameMode[] = ['expert', 'hard', 'medium', 'easy'];
    for (const mode of difficultyOrder) {
      if (unlockedModes.includes(mode) && mode !== 'zen') {
        return mode;
      }
    }
    
    return 'easy';
  }

  /**
   * Reset progression data (for testing or new player)
   */
  public resetProgression(): void {
    this.progressionData = {
      currentMode: 'easy',
      unlockedModes: ['easy'],
      highScores: { easy: 0, medium: 0, hard: 0, expert: 0, zen: 0 },
      totalPlayTime: 0,
      gamesPlayed: 0
    };
    this.saveProgressionData();
  }

  /**
   * Add playtime tracking
   */
  public addPlayTime(milliseconds: number): void {
    this.progressionData.totalPlayTime += milliseconds;
    this.saveProgressionData();
  }

  /**
   * Get total playtime in milliseconds
   */
  public getTotalPlayTime(): number {
    return this.progressionData.totalPlayTime;
  }

  /**
   * Get formatted playtime string
   */
  public getFormattedPlayTime(): string {
    const totalSeconds = Math.floor(this.progressionData.totalPlayTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Export progression data for backup
   */
  public exportProgressionData(): string {
    return JSON.stringify(this.progressionData, null, 2);
  }

  /**
   * Import progression data from backup
   */
  public importProgressionData(data: string): boolean {
    try {
      const imported = JSON.parse(data) as ProgressionData;
      
      // Validate imported data
      if (imported.currentMode && imported.unlockedModes && imported.highScores) {
        this.progressionData = imported;
        this.saveProgressionData();
        return true;
      }
    } catch (error) {
      console.error('Failed to import progression data:', error);
    }
    
    return false;
  }
}
