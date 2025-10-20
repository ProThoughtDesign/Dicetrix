# Dicetrix Audio Assets

This directory contains all audio assets for the Dicetrix game. The audio system supports both sound effects and background music with volume controls and mode-specific themes.

## Directory Structure

```
audio/
├── sfx/          # Sound effects
└── music/        # Background music tracks
```

## Required Sound Effect Files (sfx/)

### Piece Actions
- `piece-move.mp3` - Sound when piece moves left/right/down
- `piece-rotate.mp3` - Sound when piece rotates
- `piece-lock.mp3` - Sound when piece locks to grid

### Match Clearing (different sizes)
- `match-clear.mp3` - Standard 3-dice match clear
- `match-clear-medium.mp3` - 4-5 dice match clear
- `match-clear-large.mp3` - 6-7 dice match clear
- `match-clear-massive.mp3` - 8+ dice match clear

### Cascades
- `cascade.mp3` - Basic cascade sound
- `cascade-big.mp3` - 3-4 chain cascade
- `cascade-epic.mp3` - 5+ chain cascade

### Special Events
- `ultimate-combo.mp3` - Ultimate combo activation
- `wild-die-spawn.mp3` - Wild die spawning
- `black-die-debuff.mp3` - Black die debuff activation

### Boosters
- `booster-activate.mp3` - General booster activation
- `booster-deactivate.mp3` - Booster expiration
- `booster-red.mp3` - Red booster specific sound
- `booster-blue.mp3` - Blue booster specific sound
- `booster-green.mp3` - Green booster specific sound
- `booster-yellow.mp3` - Yellow booster specific sound
- `booster-purple.mp3` - Purple booster specific sound
- `booster-orange.mp3` - Orange booster specific sound
- `booster-cyan.mp3` - Cyan booster specific sound

### Game Events
- `level-up.mp3` - Level progression sound
- `game-over.mp3` - Game over sound
- `high-score.mp3` - High score achievement
- `warning.mp3` - Near game over warning
- `gravity-fall.mp3` - Gravity application sound

### UI Sounds
- `menu-select.mp3` - Menu selection sound
- `menu-hover.mp3` - Menu hover sound
- `menu-back.mp3` - Menu back/cancel sound
- `game-pause.mp3` - Game pause sound
- `game-resume.mp3` - Game resume sound

## Required Music Files (music/)

### Menu
- `menu-theme.mp3` - Main menu background music

### Game Modes
- `easy-mode.mp3` - Easy mode background music
- `medium-mode.mp3` - Medium mode background music
- `hard-mode.mp3` - Hard mode background music
- `expert-mode.mp3` - Expert mode background music
- `zen-mode.mp3` - Zen mode background music

## Audio Format Requirements

- **Format**: MP3 (recommended for web compatibility)
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps minimum, 320kbps maximum
- **Channels**: Stereo preferred, mono acceptable
- **Duration**: 
  - SFX: 0.1-3 seconds (short and punchy)
  - Music: 1-5 minutes (loopable)

## Audio Design Guidelines

### Sound Effects
- **Piece Movement**: Subtle, low-pitched sounds that don't become annoying with repetition
- **Match Clearing**: Satisfying, bright sounds that scale with match size
- **Cascades**: Building intensity with each chain level
- **Special Events**: Distinctive, memorable sounds for rare events
- **UI Sounds**: Clean, modern interface sounds

### Background Music
- **Menu**: Welcoming, energetic theme that sets the game mood
- **Easy Mode**: Relaxed, friendly melody
- **Medium Mode**: Upbeat, engaging rhythm
- **Hard Mode**: Intense, driving beat
- **Expert Mode**: Complex, challenging composition
- **Zen Mode**: Calm, meditative ambient music

## Volume Levels

The audio system includes separate volume controls for:
- **Master Volume**: Overall game audio (default: 70%)
- **Music Volume**: Background music only (default: 80%)
- **SFX Volume**: Sound effects only (default: 90%)

## Implementation Notes

- All audio files are loaded during the Preloader scene
- Audio settings are saved to localStorage
- The system gracefully handles missing audio files
- Mobile devices may have audio restrictions that require user interaction before playing

## Placeholder Files

Currently, the audio system is implemented but audio files are not included. To add audio:

1. Create or obtain audio files matching the specifications above
2. Place them in the appropriate directories (sfx/ or music/)
3. Ensure filenames match exactly what's listed in this document
4. Test in-game to verify proper loading and playback

## Testing Audio

Use the audio settings button (🔊) in the main menu or game screen to:
- Test volume controls
- Enable/disable music and sound effects
- Verify audio system functionality
