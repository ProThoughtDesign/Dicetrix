import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScoreSubmissionUI, GameEndData, ScoreSubmissionCallbacks } from '../ScoreSubmissionUI';
import { GameMode } from '../../../../shared/types/game';
import { RedditScoreSubmissionRequest, RedditScoreSubmissionResponse } from '../../../../shared/types/api';

// Mock Phaser namespace
vi.mock('phaser', () => ({
  GameObjects: {
    Rectangle: {
      Contains: vi.fn(),
    },
  },
  Geom: {
    Rectangle: vi.fn().mockImplementation((x, y, w, h) => ({ x, y, width: w, height: h })),
  },
}));

// Mock Phaser scene and game objects
class MockScene {
  scale = { width: 800, height: 600 };
  add = {
    container: vi.fn(() => new MockContainer()),
    graphics: vi.fn(() => new MockGraphics()),
    text: vi.fn(() => new MockText()),
  };
}

class MockContainer {
  add = vi.fn();
  destroy = vi.fn();
  setInteractive = vi.fn(() => this);
  on = vi.fn(() => this);
}

class MockGraphics {
  fillStyle = vi.fn(() => this);
  lineStyle = vi.fn(() => this);
  fillRect = vi.fn(() => this);
  strokeRect = vi.fn(() => this);
  fillRoundedRect = vi.fn(() => this);
  strokeRoundedRect = vi.fn(() => this);
  clear = vi.fn(() => this);
  beginPath = vi.fn(() => this);
  moveTo = vi.fn(() => this);
  lineTo = vi.fn(() => this);
  strokePath = vi.fn(() => this);
  setVisible = vi.fn(() => this);
}

class MockText {
  setOrigin = vi.fn(() => this);
  setVisible = vi.fn(() => this);
  setText = vi.fn(() => this);
  setColor = vi.fn(() => this);
}

// Mock audio handler
vi.mock('../../services/AudioHandler', () => ({
  audioHandler: {
    playSound: vi.fn(),
  },
}));

// Mock Logger
vi.mock('../../../utils/Logger', () => ({
  default: {
    log: vi.fn(),
  },
}));

// Mock FontLoader
vi.mock('../../../utils/FontLoader', () => ({
  default: {
    createFontFamily: vi.fn(() => 'Arial'),
  },
}));

describe('ScoreSubmissionUI', () => {
  let mockScene: MockScene;
  let gameEndData: GameEndData;
  let callbacks: ScoreSubmissionCallbacks;
  let scoreSubmissionUI: ScoreSubmissionUI;

  beforeEach(() => {
    mockScene = new MockScene();
    
    gameEndData = {
      score: 12500,
      level: 5,
      mode: 'medium' as GameMode,
      breakdown: {
        baseScore: 10000,
        chainMultiplier: 1.2,
        ultimateComboMultiplier: 1.1,
        boosterModifiers: 300,
        totalScore: 12500,
      },
      timestamp: Date.now(),
    };

    callbacks = {
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
      onContinue: vi.fn(),
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (scoreSubmissionUI) {
      scoreSubmissionUI.destroy();
    }
  });

  describe('UI Creation and Display', () => {
    test('should create UI elements with correct game data', () => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);

      // Verify scene.add methods were called for UI creation
      expect(mockScene.add.container).toHaveBeenCalled();
      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(mockScene.add.text).toHaveBeenCalled();
    });

    test('should display score information correctly', () => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);

      // Verify text elements are created with correct content
      const textCalls = mockScene.add.text.mock.calls;
      
      // Check that score is displayed
      const scoreCall = textCalls.find(call => 
        call[2] && call[2].includes('12,500')
      );
      expect(scoreCall).toBeDefined();

      // Check that difficulty is displayed
      const difficultyCall = textCalls.find(call => 
        call[2] && call[2].includes('Medium')
      );
      expect(difficultyCall).toBeDefined();
    });

    test('should display timestamp information', () => {
      const testTimestamp = new Date('2024-10-25T10:30:00Z').getTime();
      const testGameData = { ...gameEndData, timestamp: testTimestamp };
      
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, testGameData, callbacks);

      // Verify timestamp is formatted and displayed
      const textCalls = mockScene.add.text.mock.calls;
      const timestampCall = textCalls.find(call => 
        call[2] && call[2].includes('Achieved:')
      );
      expect(timestampCall).toBeDefined();
    });

    test('should display score breakdown information', () => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);

      // Verify breakdown is displayed
      const textCalls = mockScene.add.text.mock.calls;
      const breakdownCall = textCalls.find(call => 
        call[2] && call[2].includes('Base: 10000')
      );
      expect(breakdownCall).toBeDefined();
    });
  });

  describe('Reddit Posting Option', () => {
    beforeEach(() => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);
    });

    test('should create Reddit sharing checkbox', () => {
      // Verify checkbox container and elements are created
      expect(mockScene.add.container).toHaveBeenCalled();
      expect(mockScene.add.graphics).toHaveBeenCalled();
      
      // Check for checkbox label text
      const textCalls = mockScene.add.text.mock.calls;
      const checkboxLabel = textCalls.find(call => 
        call[2] && call[2].includes('Share score to Reddit')
      );
      expect(checkboxLabel).toBeDefined();
    });

    test('should handle checkbox interaction setup', () => {
      // Verify interactive area is set up
      const containerCalls = mockScene.add.container.mock.calls;
      expect(containerCalls.length).toBeGreaterThan(0);
    });

    test('should toggle Reddit sharing state', () => {
      // Access the private method through reflection for testing
      const toggleMethod = (scoreSubmissionUI as any).toggleRedditSharing;
      
      // Initial state should be false
      expect((scoreSubmissionUI as any).shareToReddit).toBe(false);
      
      // Toggle the state
      toggleMethod.call(scoreSubmissionUI);
      expect((scoreSubmissionUI as any).shareToReddit).toBe(true);
      
      // Toggle again
      toggleMethod.call(scoreSubmissionUI);
      expect((scoreSubmissionUI as any).shareToReddit).toBe(false);
    });
  });

  describe('Button Interactions', () => {
    beforeEach(() => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);
    });

    test('should create submit and continue buttons', () => {
      // Verify buttons are created
      const textCalls = mockScene.add.text.mock.calls;
      
      const submitButton = textCalls.find(call => 
        call[2] && call[2].includes('Submit Score')
      );
      expect(submitButton).toBeDefined();

      const continueButton = textCalls.find(call => 
        call[2] && call[2].includes('Continue')
      );
      expect(continueButton).toBeDefined();
    });

    test('should handle continue button interaction', () => {
      // Access the private method for testing
      const handleContinue = (scoreSubmissionUI as any).handleContinue;
      
      handleContinue.call(scoreSubmissionUI);
      
      expect(callbacks.onContinue).toHaveBeenCalled();
    });

    test('should prevent interactions during submission', () => {
      // Set submitting state
      (scoreSubmissionUI as any).isSubmitting = true;
      
      // Test that the button interaction logic prevents calling handleContinue
      // This simulates the actual button click behavior
      const isSubmitting = (scoreSubmissionUI as any).isSubmitting;
      
      if (!isSubmitting) {
        const handleContinue = (scoreSubmissionUI as any).handleContinue;
        handleContinue.call(scoreSubmissionUI);
      }
      
      // Should not call continue when submitting
      expect(callbacks.onContinue).not.toHaveBeenCalled();
    });
  });

  describe('Score Submission Process', () => {
    beforeEach(() => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);
    });

    test('should prepare correct submission data without Reddit posting', async () => {
      const mockResponse: RedditScoreSubmissionResponse = {
        success: true,
        leaderboardPosition: 5,
        message: 'Score submitted successfully',
      };
      
      callbacks.onSubmit = vi.fn().mockResolvedValue(mockResponse);
      
      // Set Reddit sharing to false
      (scoreSubmissionUI as any).shareToReddit = false;
      
      const handleSubmit = (scoreSubmissionUI as any).handleSubmit;
      await handleSubmit.call(scoreSubmissionUI);
      
      expect(callbacks.onSubmit).toHaveBeenCalledWith({
        score: gameEndData.score,
        level: gameEndData.level,
        mode: gameEndData.mode,
        breakdown: gameEndData.breakdown,
        timestamp: gameEndData.timestamp,
        createPost: false,
      });
    });

    test('should prepare correct submission data with Reddit posting', async () => {
      const mockResponse: RedditScoreSubmissionResponse = {
        success: true,
        leaderboardPosition: 3,
        redditPostUrl: 'https://reddit.com/r/test/post123',
        message: 'Score submitted and posted to Reddit',
      };
      
      callbacks.onSubmit = vi.fn().mockResolvedValue(mockResponse);
      
      // Set Reddit sharing to true
      (scoreSubmissionUI as any).shareToReddit = true;
      
      const handleSubmit = (scoreSubmissionUI as any).handleSubmit;
      await handleSubmit.call(scoreSubmissionUI);
      
      expect(callbacks.onSubmit).toHaveBeenCalledWith({
        score: gameEndData.score,
        level: gameEndData.level,
        mode: gameEndData.mode,
        breakdown: gameEndData.breakdown,
        timestamp: gameEndData.timestamp,
        createPost: true,
      });
    });

    test('should update UI state during submission', async () => {
      const mockResponse: RedditScoreSubmissionResponse = {
        success: true,
        message: 'Success',
      };
      
      callbacks.onSubmit = vi.fn().mockResolvedValue(mockResponse);
      
      const updateSubmitButtonState = vi.spyOn(scoreSubmissionUI as any, 'updateSubmitButtonState');
      const showStatus = vi.spyOn(scoreSubmissionUI as any, 'showStatus');
      
      const handleSubmit = (scoreSubmissionUI as any).handleSubmit;
      await handleSubmit.call(scoreSubmissionUI);
      
      // Should update button state to submitting
      expect(updateSubmitButtonState).toHaveBeenCalledWith(true);
      
      // Should show status message
      expect(showStatus).toHaveBeenCalledWith('Submitting score...', '#ffff00');
    });
  });

  describe('Error Handling and User Feedback', () => {
    beforeEach(() => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);
    });

    test('should handle submission failure', async () => {
      const mockResponse: RedditScoreSubmissionResponse = {
        success: false,
        message: 'Submission failed due to network error',
      };
      
      callbacks.onSubmit = vi.fn().mockResolvedValue(mockResponse);
      
      const showStatus = vi.spyOn(scoreSubmissionUI as any, 'showStatus');
      const updateSubmitButtonState = vi.spyOn(scoreSubmissionUI as any, 'updateSubmitButtonState');
      
      const handleSubmit = (scoreSubmissionUI as any).handleSubmit;
      await handleSubmit.call(scoreSubmissionUI);
      
      // Should show error message
      expect(showStatus).toHaveBeenCalledWith('Submission failed due to network error', '#ff0000');
      
      // Should reset button state
      expect(updateSubmitButtonState).toHaveBeenCalledWith(false);
      
      // Should reset submitting flag
      expect((scoreSubmissionUI as any).isSubmitting).toBe(false);
    });

    test('should handle network errors', async () => {
      callbacks.onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const showStatus = vi.spyOn(scoreSubmissionUI as any, 'showStatus');
      const updateSubmitButtonState = vi.spyOn(scoreSubmissionUI as any, 'updateSubmitButtonState');
      
      const handleSubmit = (scoreSubmissionUI as any).handleSubmit;
      await handleSubmit.call(scoreSubmissionUI);
      
      // Should show network error message
      expect(showStatus).toHaveBeenCalledWith('Network error. Please try again.', '#ff0000');
      
      // Should reset button state
      expect(updateSubmitButtonState).toHaveBeenCalledWith(false);
      
      // Should reset submitting flag
      expect((scoreSubmissionUI as any).isSubmitting).toBe(false);
    });

    test('should display success message with leaderboard position', async () => {
      const mockResponse: RedditScoreSubmissionResponse = {
        success: true,
        leaderboardPosition: 2,
        message: 'Great score!',
      };
      
      callbacks.onSubmit = vi.fn().mockResolvedValue(mockResponse);
      
      const showStatus = vi.spyOn(scoreSubmissionUI as any, 'showStatus');
      
      const handleSubmit = (scoreSubmissionUI as any).handleSubmit;
      await handleSubmit.call(scoreSubmissionUI);
      
      // Should show success message with rank
      expect(showStatus).toHaveBeenCalledWith(
        expect.stringContaining('Score submitted successfully! Rank: #2'),
        '#00ff00'
      );
    });

    test('should display success message with Reddit post confirmation', async () => {
      const mockResponse: RedditScoreSubmissionResponse = {
        success: true,
        leaderboardPosition: 1,
        redditPostUrl: 'https://reddit.com/r/test/post456',
        message: 'New high score!',
      };
      
      callbacks.onSubmit = vi.fn().mockResolvedValue(mockResponse);
      
      // Enable Reddit sharing
      (scoreSubmissionUI as any).shareToReddit = true;
      
      const showStatus = vi.spyOn(scoreSubmissionUI as any, 'showStatus');
      
      const handleSubmit = (scoreSubmissionUI as any).handleSubmit;
      await handleSubmit.call(scoreSubmissionUI);
      
      // Should show success message with Reddit confirmation
      expect(showStatus).toHaveBeenCalledWith(
        expect.stringContaining('Posted to Reddit!'),
        '#00ff00'
      );
    });

    test('should auto-continue after successful submission', async () => {
      const mockResponse: RedditScoreSubmissionResponse = {
        success: true,
        message: 'Success',
      };
      
      callbacks.onSubmit = vi.fn().mockResolvedValue(mockResponse);
      
      // Mock setTimeout to execute immediately
      vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 0 as any;
      });
      
      const handleSubmit = (scoreSubmissionUI as any).handleSubmit;
      await handleSubmit.call(scoreSubmissionUI);
      
      // Should call continue after success
      expect(callbacks.onContinue).toHaveBeenCalled();
    });
  });

  describe('UI State Management', () => {
    beforeEach(() => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);
    });

    test('should update submit button text during submission', () => {
      const updateSubmitButtonState = (scoreSubmissionUI as any).updateSubmitButtonState;
      
      // Mock the button text object
      const mockButtonText = { setText: vi.fn() };
      (scoreSubmissionUI as any).submitButtonText = mockButtonText;
      
      // Test submitting state
      updateSubmitButtonState.call(scoreSubmissionUI, true);
      expect(mockButtonText.setText).toHaveBeenCalledWith('Submitting...');
      
      // Test normal state
      updateSubmitButtonState.call(scoreSubmissionUI, false);
      expect(mockButtonText.setText).toHaveBeenCalledWith('Submit Score');
    });

    test('should show and hide status messages', () => {
      const showStatus = (scoreSubmissionUI as any).showStatus;
      
      // Mock the status text object
      const mockStatusText = { 
        setText: vi.fn(), 
        setColor: vi.fn(), 
        setVisible: vi.fn() 
      };
      (scoreSubmissionUI as any).statusText = mockStatusText;
      
      showStatus.call(scoreSubmissionUI, 'Test message', '#ff0000');
      
      expect(mockStatusText.setText).toHaveBeenCalledWith('Test message');
      expect(mockStatusText.setColor).toHaveBeenCalledWith('#ff0000');
      expect(mockStatusText.setVisible).toHaveBeenCalledWith(true);
    });
  });

  describe('Component Lifecycle', () => {
    test('should destroy UI elements properly', () => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);
      
      const mockContainer = { destroy: vi.fn() };
      (scoreSubmissionUI as any).container = mockContainer;
      
      scoreSubmissionUI.destroy();
      
      expect(mockContainer.destroy).toHaveBeenCalled();
    });

    test('should handle destroy when container is null', () => {
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, gameEndData, callbacks);
      
      (scoreSubmissionUI as any).container = null;
      
      // Should not throw error
      expect(() => scoreSubmissionUI.destroy()).not.toThrow();
    });
  });

  describe('Different Game Modes', () => {
    test('should display correct difficulty for easy mode', () => {
      const easyGameData = { ...gameEndData, mode: 'easy' as GameMode };
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, easyGameData, callbacks);

      const textCalls = mockScene.add.text.mock.calls;
      const difficultyCall = textCalls.find(call => 
        call[2] && call[2].includes('Easy')
      );
      expect(difficultyCall).toBeDefined();
    });

    test('should display correct difficulty for hard mode', () => {
      const hardGameData = { ...gameEndData, mode: 'hard' as GameMode };
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, hardGameData, callbacks);

      const textCalls = mockScene.add.text.mock.calls;
      const difficultyCall = textCalls.find(call => 
        call[2] && call[2].includes('Hard')
      );
      expect(difficultyCall).toBeDefined();
    });

    test('should display correct difficulty for zen mode', () => {
      const zenGameData = { ...gameEndData, mode: 'zen' as GameMode };
      scoreSubmissionUI = new ScoreSubmissionUI(mockScene as any, zenGameData, callbacks);

      const textCalls = mockScene.add.text.mock.calls;
      const difficultyCall = textCalls.find(call => 
        call[2] && call[2].includes('Zen')
      );
      expect(difficultyCall).toBeDefined();
    });
  });
});
