# 🎵 Dicetrix Audio Integration Guide

## Overview

Your Dicetrix game now uses a **hybrid audio system**:
- **Strudel** for algorithmic music generation
- **Placeholder MP3 files** for sound effects

## 🎼 Where to Put Your Strudel Music Code

### File Location: `src/client/game/music/StrudelMusic.ts`

This is where you should place your Strudel music patterns. The file contains placeholder methods that you can replace with your actual Strudel compositions:

```typescript
// Replace the placeholder patterns with your Strudel code
static createMenuTheme(): Pattern {
  // PUT YOUR MENU MUSIC STRUDEL CODE HERE
  return your_strudel_pattern;
}

static createEasyMode(): Pattern {
  // PUT YOUR EASY MODE MUSIC STRUDEL CODE HERE
  return your_strudel_pattern;
}

// ... and so on for other modes
```

### Available Music Slots:
- `createMenuTheme()` - Main menu background music
- `createEasyMode()` - Easy difficulty music
- `createMediumMode()` - Medium difficulty music  
- `createHardMode()` - Hard difficulty music
- `createExpertMode()` - Expert difficulty music
- `createZenMode()` - Zen mode ambient music

## 🔊 Sound Effects (SFX) Files

### File Location: `src/client/public/assets/audio/sfx/`

Place your MP3 sound effect files in this directory with these exact names:

#### UI Sounds:
- `menu-select.mp3` - Menu button clicks
- `menu-hover.mp3` - Menu button hover
- `menu-back.mp3` - Back/cancel actions

#### Game Actions:
- `piece-move.mp3` - Piece movement
- `piece-rotate.mp3` - Piece rotation
- `piece-lock.mp3` - Piece locking to grid

#### Match Events:
- `match-clear.mp3` - Basic match clear (3 dice)
- `match-clear-medium.mp3` - Medium match (4-5 dice)
- `match-clear-large.mp3` - Large match (6-7 dice)
- `match-clear-massive.mp3` - Massive match (8+ dice)

#### Cascades:
- `cascade.mp3` - Basic cascade
- `cascade-big.mp3` - Big cascade (3-4 chains)
- `cascade-epic.mp3` - Epic cascade (5+ chains)

#### Game Events:
- `level-up.mp3` - Level progression
- `game-over.mp3` - Game over
- `high-score.mp3` - High score achievement
- `warning.mp3` - Near game over warning

## 🚀 How It Works

### Music System (Strudel):
1. **Initialization**: Strudel initializes when user first interacts with the game
2. **Pattern Loading**: Your patterns from `StrudelMusic.ts` are loaded dynamically
3. **Playback**: Music plays continuously with looping
4. **Volume Control**: Integrated with game settings

### SFX System (Phaser Audio):
1. **Preloading**: MP3 files are loaded during the Preloader scene
2. **Playback**: Sound effects play on-demand via `audioHandler.playSound(key)`
3. **Volume Control**: Separate volume control from music

## 🎯 Integration Points

### Playing Music:
```typescript
// The game automatically calls these based on context:
audioHandler.playMusic('menu-theme');     // Main menu
audioHandler.playMusic('easy-mode');      // Easy difficulty
audioHandler.playMusic('medium-mode');    // Medium difficulty
// etc.
```

### Playing Sound Effects:
```typescript
// The game calls these during gameplay:
audioHandler.playSound('piece-move');     // When piece moves
audioHandler.playSound('match-clear');    // When matches clear
audioHandler.playSound('level-up');       // When level increases
// etc.
```

## 🔧 Settings Integration

The audio system is fully integrated with the game settings:
- **Settings Scene**: Accessible via Settings button on main menu
- **Volume Controls**: Separate sliders for music and SFX
- **Enable/Disable**: Toggle buttons for music and sound effects
- **Test Buttons**: Preview audio settings

## 📝 Next Steps

1. **Replace Strudel Patterns**: Edit `src/client/game/music/StrudelMusic.ts` with your actual Strudel code
2. **Add SFX Files**: Place your MP3 sound effect files in `src/client/public/assets/audio/sfx/`
3. **Test**: Run `npm run dev` and test the audio system
4. **Adjust**: Modify patterns and settings as needed

## ✅ **ERRORS FIXED**

The following audio errors have been resolved:
- **"Unable to decode audio data"** - Removed placeholder MP3 files that caused decode errors
- **"AudioContext was not allowed to start"** - Strudel now initializes only on user interaction
- **Excessive logging** - Reduced console noise from audio operations
- **TypeScript errors** - Added proper type declarations for Strudel

## 🐛 Troubleshooting

### Music Not Playing:
- Music will only start after first user interaction (click Settings or Start Game)
- Check browser console for Strudel initialization errors
- Verify your Strudel patterns are valid

### SFX Not Playing:
- SFX files are optional - the game works without them
- Add real MP3 files to `src/client/public/assets/audio/sfx/` to enable sounds
- Verify file names match exactly (case-sensitive)

### Volume Issues:
- Use the Settings scene to adjust volume levels
- Check that audio is enabled in settings
- Verify browser audio permissions

## 🎵 Example Strudel Integration

Here's how to replace a placeholder pattern with your Strudel code:

```typescript
// Before (placeholder):
static createMenuTheme(): Pattern {
  return stack(
    note("c4 e4 g4 c5").s("sawtooth").lpf(800).room(0.3).slow(2),
    // ... placeholder pattern
  ).slow(1);
}

// After (your Strudel code):
static createMenuTheme(): Pattern {
  // YOUR ACTUAL STRUDEL PATTERN HERE
  return stack(
    // Your composition
    note("your pattern here"),
    s("your drums here"),
    // etc.
  );
}
```

The system will automatically use your patterns and handle volume, looping, and integration with the game!
