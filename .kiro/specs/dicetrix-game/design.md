# Dicetrix Game Design Document

## Overview

Dicetrix is a gravity-matching puzzle game that combines Tetris-style falling mechanics with dice-based matching and Candy Crush-style cascading effects. Built on Phaser 3 with TypeScript, the game will be deployed as a Reddit-embeddable app through the Devvit platform for the Kiro Community Games Challenge hackathon.

The game features a 10x20 grid where Tetromino-shaped pieces composed of dice fall and lock into place. Players create matches by aligning 3+ dice with the same number, triggering size-based effects, color boosters, and cascading chain reactions. Multiple difficulty modes provide progression from casual to expert play.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Reddit Post   │    │  Devvit Server  │    │  Reddit API     │
│   (Webview)     │◄──►│   (Express)     │◄──►│  (Auth/Data)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Phaser Client   │    │ Redis Storage   │
│ (Game Engine)   │    │ (Leaderboards)  │
└─────────────────┘    └─────────────────┘
```

### Scene Architecture

The game follows Phaser's scene-based architecture with clear separation of concerns:

- **Boot Scene**: Initial loading and asset preloading setup
- **Preloader Scene**: Asset loading with progress indication
- **MainMenu Scene**: Mode selection, settings, and leaderboard access
- **Game Scene**: Core gameplay loop and mechanics
- **GameOver Scene**: Results display, score sharing, and leaderboard integration

### Data Flow

```
User Input → Game Scene → Game State → Grid System → Match Detection → 
Effects System → Scoring System → Server API → Reddit Integration
```

## Components and Interfaces

### Core Game Classes

#### Die Class
```typescript
class Die extends Phaser.GameObjects.Sprite {
  sides: number;        // 4, 6, 8, 10, 12, 20
  number: number;       // 1 to max for sides
  color: DieColor;      // red, blue, green, yellow, purple, orange, cyan
  isWild: boolean;      // matches any number
  isBlack: boolean;     // debuff die (Hard/Expert only)
  
  roll(): void;
  renderNumber(): void;
  getMatchValue(): number;
}
```

#### Piece Class
```typescript
class Piece extends Phaser.GameObjects.Group {
  dice: Die[];
  shape: TetrominoShape;
  rotation: number;
  gridX: number;
  gridY: number;
  
  moveLeft(): boolean;
  moveRight(): boolean;
  moveDown(): boolean;
  rotate(): boolean;
  canMoveTo(x: number, y: number): boolean;
  lockToGrid(): void;
}
```

#### Grid Class
```typescript
class Grid {
  cells: (Die | null)[][];  // 10x20 array
  width: number = 10;
  height: number = 20;
  
  addPiece(piece: Piece): void;
  detectMatches(): MatchGroup[];
  applyGravity(): boolean;
  clearCells(positions: GridPosition[]): void;
  isEmpty(x: number, y: number): boolean;
  isValidPosition(x: number, y: number): boolean;
}
```

#### MatchGroup Class
```typescript
class MatchGroup {
  dice: Die[];
  positions: GridPosition[];
  matchedNumber: number;
  size: number;
  colors: Map<DieColor, number>;
  
  getSizeEffect(): SizeEffect;
  getColorBoosters(): ColorBooster[];
  calculateBaseScore(): number;
}
```

#### Booster System
```typescript
abstract class Booster {
  type: BoosterType;
  duration: number;
  isActive: boolean;
  
  activate(): void;
  update(delta: number): void;
  deactivate(): void;
  onActivate(): void;
}

class ColorBooster extends Booster {
  color: DieColor;
  effect: BoosterEffect;
}
```

### Game State Management

```typescript
class GameState {
  score: number;
  level: number;
  mode: GameMode;
  activeBoosters: Booster[];
  chainMultiplier: number;
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  grid: Grid;
  isGameOver: boolean;
  
  updateScore(baseScore: number, multiplier: number): void;
  addBooster(booster: Booster): void;
  removeBooster(booster: Booster): void;
  incrementChain(): void;
  resetChain(): void;
}
```

### Input System

```typescript
class InputManager {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  touchControls: TouchControls;
  
  setupKeyboard(): void;
  setupTouch(): void;
  handleInput(gameState: GameState): void;
}
```

## Data Models

### Game Configuration

```typescript
interface GameModeConfig {
  name: GameMode;
  diceTypes: number[];      // Available die sides
  colors: DieColor[];       // Available colors
  maxPieceSize: number;     // Max dice per piece
  blackDieChance: number;   // Probability of black dice
  fallSpeed: number;        // Base falling speed
  hasGameOver: boolean;     // Whether game can end
}

const GAME_MODES: Record<GameMode, GameModeConfig> = {
  easy: {
    name: 'easy',
    diceTypes: [4, 6],
    colors: ['red', 'blue', 'green'],
    maxPieceSize: 5,
    blackDieChance: 0,
    fallSpeed: 1000,
    hasGameOver: true
  },
  medium: {
    name: 'medium',
    diceTypes: [4, 6, 8, 10],
    colors: ['red', 'blue', 'green', 'yellow'],
    maxPieceSize: 5,
    blackDieChance: 0,
    fallSpeed: 800,
    hasGameOver: true
  },
  hard: {
    name: 'hard',
    diceTypes: [4, 6, 8, 10, 12],
    colors: ['red', 'blue', 'green', 'yellow', 'purple'],
    maxPieceSize: 6,
    blackDieChance: 0.01,
    fallSpeed: 600,
    hasGameOver: true
  },
  expert: {
    name: 'expert',
    diceTypes: [4, 6, 8, 10, 12, 20],
    colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    maxPieceSize: 7,
    blackDieChance: 0.02,
    fallSpeed: 400,
    hasGameOver: true
  },
  zen: {
    name: 'zen',
    diceTypes: [4, 6, 8, 10],
    colors: ['red', 'blue', 'green', 'yellow'],
    maxPieceSize: 5,
    blackDieChance: 0,
    fallSpeed: 1200,
    hasGameOver: false
  }
};
```

### Piece Shapes (Tetromino-based)

```typescript
const PIECE_SHAPES: Record<string, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  L: [[1, 0, 0], [1, 1, 1]],
  J: [[0, 0, 1], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  // Custom shapes for higher difficulties
  PLUS: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
  CROSS: [[1, 0, 1], [0, 1, 0], [1, 0, 1]]
};
```

### Size Effects Configuration

```typescript
const SIZE_EFFECTS: Record<number, SizeEffect> = {
  3: { type: 'standard', description: 'Clear matched dice' },
  4: { type: 'line_clear', description: 'Clear row or column' },
  5: { type: 'spawn_wild', description: 'Spawn wild die' },
  7: { type: 'area_clear', description: 'Clear 7x7 area' },
  9: { type: 'grid_clear', description: 'Clear entire grid' }
};
```

### Color Booster Effects

```typescript
const COLOR_BOOSTERS: Record<DieColor, BoosterEffect> = {
  red: { type: 'score_multiplier', value: 1.5, duration: 10000 },
  blue: { type: 'slow_fall', value: 0.5, duration: 15000 },
  green: { type: 'wild_chance', value: 0.1, duration: 3 }, // 3 pieces
  yellow: { type: 'extra_time', value: 5000, duration: 1 },
  purple: { type: 'chain_bonus', value: 2, duration: 8000 },
  orange: { type: 'size_boost', value: 1, duration: 5000 },
  cyan: { type: 'gravity_delay', value: 2000, duration: 12000 }
};
```

## Error Handling

### Client-Side Error Handling

```typescript
class ErrorHandler {
  static handleGameError(error: Error, context: string): void {
    console.error(`Game Error in ${context}:`, error);
    // Show user-friendly message
    // Log to server for analytics
  }
  
  static handleNetworkError(error: Error): void {
    // Handle API call failures
    // Show offline mode or retry options
  }
  
  static handleInvalidMove(move: string): void {
    // Handle invalid piece movements
    // Provide visual feedback
  }
}
```

### Server-Side Error Handling

```typescript
// Middleware for error handling
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Specific error handlers for game operations
class GameServerError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GameServerError';
  }
}
```

### Cascade Loop Prevention

```typescript
class CascadeManager {
  private maxCascades = 10;
  private cascadeCount = 0;
  
  processCascade(grid: Grid): boolean {
    if (this.cascadeCount >= this.maxCascades) {
      console.warn('Cascade limit reached, stopping to prevent infinite loop');
      return false;
    }
    
    this.cascadeCount++;
    // Process cascade logic
    return true;
  }
  
  reset(): void {
    this.cascadeCount = 0;
  }
}
```

## Testing Strategy

### Unit Testing Approach

**Core Logic Testing:**
- Grid operations (placement, collision detection, match finding)
- Scoring calculations (base score, multipliers, chain bonuses)
- Piece generation and rotation logic
- Booster activation and effects

**Test Structure:**
```typescript
describe('Grid System', () => {
  test('should detect horizontal matches correctly', () => {
    // Test match detection logic
  });
  
  test('should apply gravity after clearing matches', () => {
    // Test gravity application
  });
  
  test('should prevent infinite cascade loops', () => {
    // Test cascade limiting
  });
});

describe('Scoring System', () => {
  test('should calculate base score correctly', () => {
    // Test base scoring formula
  });
  
  test('should apply chain multipliers', () => {
    // Test chain bonus calculations
  });
});
```

### Integration Testing

**API Integration:**
- Server endpoint functionality
- Reddit authentication flow
- Leaderboard storage and retrieval
- Score sharing to subreddit

**Game Flow Testing:**
- Complete game sessions
- Mode transitions
- Error recovery scenarios

### Performance Testing

**Metrics to Monitor:**
- Frame rate consistency (target: <60ms per frame)
- Memory usage during long sessions
- Asset loading times
- API response times

**Testing Approach:**
```typescript
class PerformanceMonitor {
  private frameTimeHistory: number[] = [];
  
  trackFrameTime(deltaTime: number): void {
    this.frameTimeHistory.push(deltaTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }
    
    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
    if (avgFrameTime > 60) {
      console.warn('Performance warning: Average frame time exceeding 60ms');
    }
  }
}
```

### Reddit Integration Testing

**Webview Compatibility:**
- Touch controls on mobile devices
- Fullscreen mode functionality
- Asset loading in Reddit environment
- Authentication state persistence

**Social Features Testing:**
- Leaderboard accuracy
- Score posting format
- Subreddit integration
- User authentication flow

## Reddit Integration Architecture

### API Endpoints

```typescript
// Game state management
router.get('/api/game/init', async (req, res) => {
  // Initialize game session with user context
});

router.post('/api/game/score', async (req, res) => {
  // Save score to leaderboards
});

router.get('/api/leaderboards/:mode', async (req, res) => {
  // Retrieve top scores for difficulty mode
});

router.post('/api/share-score', async (req, res) => {
  // Post score to designated subreddit
});
```

### Data Storage Schema

```typescript
// Redis key patterns
const REDIS_KEYS = {
  leaderboard: (mode: string) => `dicetrix:leaderboard:${mode}`,
  userScore: (userId: string, mode: string) => `dicetrix:user:${userId}:${mode}`,
  gameSession: (sessionId: string) => `dicetrix:session:${sessionId}`
};

// Leaderboard entry structure
interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  mode: GameMode;
  timestamp: number;
  breakdown: ScoreBreakdown;
}
```

### Authentication Flow

```typescript
// Middleware to extract Reddit user context
const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const { userId, username } = context;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = { userId, username };
  next();
};
```

## AI Diary Integration

### Logging System

```typescript
class AILogger {
  private static logFile = '.kiro/specs/dicetrix-game/ai-diary.md';
  
  static logDecision(phase: string, decision: string, rationale: string): void {
    const timestamp = new Date().toISOString();
    const entry = `## ${timestamp} - ${phase}\n**Decision:** ${decision}\n**Rationale:** ${rationale}\n\n`;
    // Append to AI diary file
  }
  
  static logPhaseComplete(phase: string, summary: string): void {
    const timestamp = new Date().toISOString();
    const entry = `## ${timestamp} - Phase Complete: ${phase}\n${summary}\n\n`;
    // Append to AI diary file
  }
  
  static logMethodology(methodology: string, context: string): void {
    const timestamp = new Date().toISOString();
    const entry = `## ${timestamp} - Methodology\n**Approach:** ${methodology}\n**Context:** ${context}\n\n`;
    // Append to AI diary file
  }
}
```

### Impact Tracking

```typescript
interface WorkflowMetrics {
  phasesCompleted: number;
  iterationsPerPhase: Record<string, number>;
  timeEstimates: Record<string, number>;
  agentDecisions: number;
  codeGenerationEvents: number;
  errorResolutions: number;
}

class ImpactTracker {
  private metrics: WorkflowMetrics = {
    phasesCompleted: 0,
    iterationsPerPhase: {},
    timeEstimates: {},
    agentDecisions: 0,
    codeGenerationEvents: 0,
    errorResolutions: 0
  };
  
  trackPhaseCompletion(phase: string): void {
    this.metrics.phasesCompleted++;
    AILogger.logPhaseComplete(phase, `Phase ${phase} completed. Total phases: ${this.metrics.phasesCompleted}`);
  }
  
  generateReport(): string {
    // Compile comprehensive impact report
    return `# Kiro Workflow Impact Report\n\n## Quantitative Metrics\n...`;
  }
}
```

This design provides a comprehensive foundation for implementing Dicetrix as a sophisticated puzzle game with Reddit integration, following modern software architecture principles while maintaining the flexibility needed for rapid hackathon development.
