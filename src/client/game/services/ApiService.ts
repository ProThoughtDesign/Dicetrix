import { 
  GameInitResponse, 
  ScoreSubmissionRequest, 
  ScoreSubmissionResponse,
  LeaderboardResponse,
  ShareScoreRequest,
  ShareScoreResponse,
  ErrorResponse 
} from '../../../shared/types/api.js';
import { GameMode } from '../../../shared/types/game.js';

export class ApiService {
  private static instance: ApiService;

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private constructor() {}

  /**
   * Initialize game session
   */
  public async initializeGame(): Promise<GameInitResponse> {
    const response = await fetch('/api/game/init');
    if (!response.ok) {
      throw new Error(`Failed to initialize game: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Submit score to leaderboard
   */
  public async submitScore(scoreData: ScoreSubmissionRequest): Promise<ScoreSubmissionResponse> {
    const response = await fetch('/api/game/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || `Failed to submit score: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get leaderboard for a specific mode
   */
  public async getLeaderboard(mode: GameMode): Promise<LeaderboardResponse> {
    const response = await fetch(`/api/leaderboards/${mode}`);
    if (!response.ok) {
      throw new Error(`Failed to get leaderboard: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Share score to subreddit
   */
  public async shareScore(shareData: ShareScoreRequest): Promise<ShareScoreResponse> {
    const response = await fetch('/api/share-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shareData),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || `Failed to share score: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Handle API errors gracefully
   */
  private handleError(error: unknown, operation: string): never {
    console.error(`API Error during ${operation}:`, error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Unknown error during ${operation}`);
  }
}
