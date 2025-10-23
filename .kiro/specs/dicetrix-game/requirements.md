# Requirements Document

## Introduction

Dicetrix is a gravity-matching puzzle game that combines Tetris-style falling pieces with dice-based matching mechanics and Candy Crush-style cascading effects. The game will be built using Phaser.js and deployed as a Reddit-embeddable app through the Devvit platform for the Kiro Community Games Challenge hackathon, with a submission deadline of October 29, 2025.

## Glossary

- **Dicetrix_System**: The complete game application including client, server, and Reddit integration
- **Game_Grid**: A 10x20 playing field where dice pieces are placed
- **Die_Piece**: Individual dice components with sides (4-20), numbers (1-max), colors, and special properties
- **Tetromino_Piece**: A group of 1-7 dice arranged in Tetris-like shapes that fall as a unit
- **Match_Group**: Three or more adjacent dice with the same number that can be cleared
- **Size_Effect**: Special clearing effects triggered by match group sizes (3, 4, 5, 7, 9+ dice)
- **Color_Booster**: Temporary game modifiers activated when matching 3+ dice of the same color
- **Wild_Die**: Special dice that can match with any number
- **Black_Die**: Rare debuff dice that remove active boosters when matched
- **Ultimate_Combo**: Special effect triggered by matching 3+ adjacent Wild dice
- **Cascade_Chain**: Sequential matches that occur after gravity applies following a clear
- **Reddit_API**: Reddit's developer API for user authentication and data storage
- **Devvit_Platform**: Reddit's developer platform for building embeddable apps
- **AI_Diary**: Documentation system tracking all agent decisions and methodologies

## Requirements

### Requirement 1

**User Story:** As a player, I want to control falling dice pieces with intuitive controls, so that I can strategically place them on the game grid.

#### Acceptance Criteria

1. WHEN a player presses left/right arrow keys or swipes left/right, THE Dicetrix_System SHALL move the active Tetromino_Piece horizontally by one grid cell
2. WHEN a player presses the down arrow key or swipes down, THE Dicetrix_System SHALL accelerate the Tetromino_Piece downward movement
3. WHEN a player presses the rotation key or taps the piece, THE Dicetrix_System SHALL rotate the Tetromino_Piece by 90 degrees clockwise
4. WHEN any Die_Piece in a Tetromino_Piece cannot move further down due to collision, THE Dicetrix_System SHALL lock that specific Die_Piece to the Game_Grid and continue collision detection for remaining dice
5. WHEN all Die_Pieces in a Tetromino_Piece are locked, THE Dicetrix_System SHALL generate a new Tetromino_Piece at the top of the Game_Grid
6. WHEN collision detection occurs, THE Dicetrix_System SHALL restart collision checks until no Die_Pieces can move further

### Requirement 2

**User Story:** As a player, I want dice matches to clear with satisfying effects and scoring, so that I feel rewarded for creating strategic combinations.

#### Acceptance Criteria

1. WHEN three or more adjacent Die_Pieces have the same number, THE Dicetrix_System SHALL identify them as a Match_Group
2. WHEN a Match_Group is detected, THE Dicetrix_System SHALL clear the matched dice and apply the appropriate Size_Effect
3. WHEN a Match_Group contains exactly 3 dice, THE Dicetrix_System SHALL clear only those dice
4. WHEN a Match_Group contains exactly 4 dice, THE Dicetrix_System SHALL clear the matched dice plus one complete row or column
5. WHEN a Match_Group contains exactly 5 dice, THE Dicetrix_System SHALL spawn a Wild_Die in a random empty cell or add it to the next piece

### Requirement 3

**User Story:** As a player, I want powerful clearing effects for large matches, so that I can create spectacular chain reactions.

#### Acceptance Criteria

1. WHEN a Match_Group contains exactly 7 dice, THE Dicetrix_System SHALL clear a 7x7 area centered on the match
2. WHEN a Match_Group contains 9 or more dice, THE Dicetrix_System SHALL clear the entire Game_Grid with a dramatic animation
3. WHEN 3 or more Wild_Die are adjacent and matched, THE Dicetrix_System SHALL trigger an Ultimate_Combo upgrading all dice to maximum values
4. WHEN an Ultimate_Combo is triggered, THE Dicetrix_System SHALL apply a 5x score multiplier to the resulting cascade
5. WHEN a Black_Die is matched in Hard or Expert mode, THE Dicetrix_System SHALL remove all active Color_Booster effects

### Requirement 4

**User Story:** As a player, I want color-based boosters to add strategic depth, so that I can plan moves beyond just number matching.

#### Acceptance Criteria

1. WHEN 3 or more dice of the same color are matched, THE Dicetrix_System SHALL activate the corresponding Color_Booster
2. WHEN multiple colors tie for most prevalent in a match, THE Dicetrix_System SHALL activate all tied Color_Booster effects
3. WHEN a Color_Booster is activated, THE Dicetrix_System SHALL display the booster icon in the HUD with remaining duration
4. WHILE a Color_Booster is active, THE Dicetrix_System SHALL apply the booster effect to gameplay mechanics
5. WHEN a Color_Booster duration expires, THE Dicetrix_System SHALL deactivate the effect and remove the HUD indicator

### Requirement 5

**User Story:** As a player, I want gravity and cascading matches to create chain reactions, so that I can achieve high scores through strategic play.

#### Acceptance Criteria

1. WHEN dice are cleared from the Game_Grid, THE Dicetrix_System SHALL apply gravity to make remaining dice fall down
2. WHEN gravity creates new Match_Groups, THE Dicetrix_System SHALL detect and clear them automatically
3. WHEN cascading matches occur, THE Dicetrix_System SHALL increment the chain multiplier for scoring
4. WHEN a cascade chain reaches 10 sequential matches, THE Dicetrix_System SHALL cap further chain detection to prevent infinite loops
5. WHEN all cascading is complete, THE Dicetrix_System SHALL calculate and award the final score for the sequence

### Requirement 6

**User Story:** As a player, I want multiple difficulty modes with different challenges, so that I can progress and find appropriate challenge levels.

#### Acceptance Criteria

1. WHEN Easy mode is selected, THE Dicetrix_System SHALL use only 4-sided and 6-sided dice with 3 colors
2. WHEN Medium mode is selected, THE Dicetrix_System SHALL use 4, 6, 8, and 10-sided dice with 4 colors
3. WHEN Hard mode is selected, THE Dicetrix_System SHALL use dice up to 12 sides with 5 colors and introduce Black_Die at 1% probability
4. WHEN Expert mode is selected, THE Dicetrix_System SHALL use dice up to 20 sides with 6 colors and Black_Die at 2% probability
5. WHEN Zen mode is selected, THE Dicetrix_System SHALL disable game over conditions and provide only positive Color_Booster effects

### Requirement 7

**User Story:** As a player, I want accurate scoring that reflects my skill and chain-building ability, so that I can track my improvement and compete with others.

#### Acceptance Criteria

1. WHEN a Match_Group is cleared, THE Dicetrix_System SHALL calculate base score as sum of die sides × match size × matched number
2. WHEN cascade chains occur, THE Dicetrix_System SHALL apply chain multiplier based on floor(log2(chain_index))
3. WHEN Ultimate_Combo is triggered, THE Dicetrix_System SHALL apply an additional 5x multiplier to all resulting cascades
4. WHEN Color_Booster effects modify scoring, THE Dicetrix_System SHALL apply the modifier to the final calculated score
5. WHEN a game session ends, THE Dicetrix_System SHALL display the total score with breakdown of base points and multipliers

### Requirement 8

**User Story:** As a Reddit user, I want to play the game seamlessly within Reddit posts, so that I can enjoy the game without leaving the platform.

#### Acceptance Criteria

1. WHEN a Reddit user clicks the game post, THE Dicetrix_System SHALL load within the Reddit webview
2. WHEN the game loads in Reddit, THE Dicetrix_System SHALL display a custom splash screen with a "Play" button
3. WHEN the "Play" button is clicked, THE Dicetrix_System SHALL open the game in fullscreen mode
4. WHEN running in Reddit webview, THE Dicetrix_System SHALL handle touch controls for mobile users
5. WHEN the game is embedded in Reddit, THE Dicetrix_System SHALL maintain performance under 60ms per frame

### Requirement 9

**User Story:** As a competitive player, I want to see leaderboards and share my scores, so that I can compete with other players and showcase my achievements.

#### Acceptance Criteria

1. WHEN a game session ends, THE Dicetrix_System SHALL store the score in Reddit-authenticated leaderboards by difficulty mode
2. WHEN viewing leaderboards, THE Dicetrix_System SHALL display the top 10 scores for each difficulty mode
3. WHEN a player achieves a high score, THE Dicetrix_System SHALL provide a "Share Score" button in the game over screen
4. WHEN the share button is clicked, THE Dicetrix_System SHALL post the formatted score to the designated subreddit
5. WHEN posting scores, THE Dicetrix_System SHALL include the player's score, difficulty mode, and appropriate hashtags

### Requirement 10

**User Story:** As a developer using Kiro, I want comprehensive documentation of the AI-driven development process, so that I can analyze the workflow impact and methodology effectiveness.

#### Acceptance Criteria

1. WHEN any agent makes a decision or completes a task, THE Dicetrix_System SHALL log the action to AI_Diary with timestamp and rationale
2. WHEN a development phase is completed, THE Dicetrix_System SHALL append phase summary to AI_Diary with methodology notes
3. WHEN the project reaches completion, THE Dicetrix_System SHALL compile AI_Diary entries into a structured Impact_Report
4. WHEN generating the Impact_Report, THE Dicetrix_System SHALL include sections for thought processes, methodologies, agent roles, and quantitative impact
5. WHEN the hackathon submission is prepared, THE Dicetrix_System SHALL include the Impact_Report as part of the submission documentation
