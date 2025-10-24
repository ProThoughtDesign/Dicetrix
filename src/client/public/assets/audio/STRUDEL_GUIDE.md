# Dicetrix Strudel Audio Generation Guide

This guide explains how to use the provided Strudel files to generate audio assets for the Dicetrix game.

## What is Strudel?

Strudel is a live coding environment for algorithmic music composition that runs in the browser. It's based on TidalCycles and allows you to create music and sound effects using code patterns.

**Website:** https://strudel.tidalcycles.org/

## Files Included

- `dicetrix-music.strudel` - Background music patterns for all game modes
- `dicetrix-sfx.strudel` - Sound effect patterns for game interactions
- This guide (`STRUDEL_GUIDE.md`)

## Quick Start

### 1. Open Strudel
1. Go to https://strudel.tidalcycles.org/
2. You'll see the Strudel editor interface

### 2. Load Patterns
1. Copy the contents of `dicetrix-music.strudel` or `dicetrix-sfx.strudel`
2. Paste into the Strudel editor
3. The patterns are now available to use

### 3. Play Patterns
```javascript
// Play the menu theme
menuTheme.play()

// Play a sound effect once
menuSelect.once()

// Stop playback
menuTheme.stop()
```

## Generating Music Files

### Menu Theme
```javascript
// Load dicetrix-music.strudel first, then:
menuTheme.play()
// Record for 30-60 seconds, then:
menuTheme.stop()
```

### Game Mode Music
```javascript
// Easy mode (relaxed)
easyMode.play()

// Medium mode (upbeat)  
mediumMode.play()

// Hard mode (intense)
hardMode.play()

// Expert mode (complex)
expertMode.play()

// Zen mode (ambient)
zenMode.play()
```

### Dynamic Music Examples
```javascript
// Cascade music with high intensity
cascadeMusic(3).play()

// Level 15 complexity music
levelMusic(15).play()

// High tension music (80% grid filled)
tensionMusic(0.8).play()
```

## Generating Sound Effects

### UI Sounds
```javascript
// Load dicetrix-sfx.strudel first, then:
menuSelect.once()    // Menu selection click
menuHover.once()     // Menu hover feedback
menuBack.once()      // Menu back/cancel
```

### Game Sounds
```javascript
// Piece movement
pieceMove.once()     // Piece moves left/right/down
pieceRotate.once()   // Piece rotates
pieceLock.once()     // Piece locks to grid

// Match clearing (different sizes)
matchClear.once()         // 3-dice match
matchClearMedium.once()   // 4-5 dice match  
matchClearLarge.once()    // 6-7 dice match
matchClearMassive.once()  // 8+ dice match

// Cascades
cascade.once()       // Basic cascade
cascadeBig.once()    // 3-4 chain cascade
cascadeEpic.once()   // 5+ chain cascade
```

### Special Events
```javascript
ultimateCombo.once()     // Ultimate combo activation
wildDieSpawn.once()      // Wild die spawning
blackDieDebuff.once()    // Black die debuff
levelUp.once()           // Level progression
gameOver.once()          // Game over
highScore.once()         // High score achievement
```

## Recording Audio

### Browser Recording (Recommended)
1. Use browser extensions like "Audio Recorder" or "Screen Recorder"
2. Start recording
3. Play the pattern in Strudel
4. Stop recording after desired length
5. Download the audio file

### Audio Interface Method
1. Connect audio interface to computer
2. Route browser audio to recording software (Audacity, Reaper, etc.)
3. Record while playing patterns in Strudel
4. Export as MP3

### Mobile Recording
1. Use screen recording with audio on mobile device
2. Extract audio from video file
3. Convert to MP3 format

## File Naming and Organization

After recording, rename files according to the audio README:

### Music Files (save to `/assets/audio/music/`)
- `menu-theme.mp3`
- `easy-mode.mp3`
- `medium-mode.mp3`
- `hard-mode.mp3`
- `expert-mode.mp3`
- `zen-mode.mp3`

### Sound Effect Files (save to `/assets/audio/sfx/`)
- `menu-select.mp3`
- `menu-hover.mp3`
- `menu-back.mp3`
- `piece-move.mp3`
- `piece-rotate.mp3`
- `piece-lock.mp3`
- `match-clear.mp3`
- `match-clear-medium.mp3`
- `match-clear-large.mp3`
- `match-clear-massive.mp3`
- `cascade.mp3`
- `cascade-big.mp3`
- `cascade-epic.mp3`
- `level-up.mp3`
- `game-over.mp3`
- `high-score.mp3`
- `warning.mp3`
- And more...

## Customization Tips

### Adjusting Tempo
```javascript
// Slower
menuTheme.slow(2).play()

// Faster  
menuTheme.fast(1.5).play()
```

### Changing Volume
```javascript
// Quieter
menuSelect.gain(0.3).once()

// Louder
menuSelect.gain(0.9).once()
```

### Adding Effects
```javascript
// Add reverb
menuTheme.room(0.5).play()

// Add delay
pieceMove.delay(0.2).once()

// Add filter sweep
cascade.lpf(sine.range(400, 1600).slow(4)).once()
```

### Creating Variations
```javascript
// Reverse occasionally
menuTheme.sometimes(rev).play()

// Add randomness
pieceMove.degradeBy(0.1).once()

// Transpose
matchClear.add(note("2")).once() // Up 2 semitones
```

## Audio Specifications

Ensure your recordings meet these requirements:

### Music Files
- **Duration:** 30-120 seconds (loopable)
- **Format:** MP3
- **Sample Rate:** 44.1kHz or 48kHz
- **Bit Rate:** 128-320 kbps
- **Channels:** Stereo preferred

### Sound Effect Files  
- **Duration:** 0.1-3 seconds
- **Format:** MP3
- **Sample Rate:** 44.1kHz or 48kHz
- **Bit Rate:** 128-320 kbps
- **Channels:** Mono or Stereo

## Troubleshooting

### Pattern Not Playing
- Check browser audio permissions
- Ensure Strudel has loaded completely
- Try refreshing the page and reloading patterns

### No Sound Output
- Check system volume and browser audio settings
- Verify audio output device is working
- Try different browser if issues persist

### Recording Issues
- Test recording setup with simple audio first
- Ensure proper audio routing in system settings
- Check recording software input levels

## Advanced Techniques

### Layering Sounds
```javascript
// Combine multiple patterns
stack(
  menuSelect,
  menuHover.gain(0.3).delay(0.1)
).once()
```

### Conditional Patterns
```javascript
// Different sounds based on conditions
const dynamicSound = (intensity) => {
  if (intensity > 0.8) return cascadeEpic;
  if (intensity > 0.5) return cascadeBig;
  return cascade;
};
```

### Procedural Generation
```javascript
// Generate variations automatically
const randomPieceSound = choose([
  pieceMove,
  pieceMove.add(note("2")),
  pieceMove.add(note("-2"))
]);
```

## Integration with Game

Once you have generated and saved the audio files:

1. Place files in appropriate directories (`/assets/audio/music/` or `/assets/audio/sfx/`)
2. Ensure filenames match exactly what's expected by the AudioHandler
3. Test in-game using `npm run dev`
4. The Preloader will automatically load the new audio files
5. Use AudioHandler methods to play music and sound effects

## Resources

- **Strudel Documentation:** https://strudel.tidalcycles.org/learn/
- **TidalCycles Patterns:** https://tidalcycles.org/docs/
- **Audio Editing:** Audacity (free) - https://www.audacityteam.org/
- **File Conversion:** Online converters or VLC media player

## Support

If you encounter issues with the Strudel patterns:

1. Check the Strudel documentation for syntax updates
2. Test patterns individually to isolate problems
3. Modify parameters (tempo, volume, effects) as needed
4. The patterns are designed to be flexible and customizable

Happy music making! 🎵🎲
