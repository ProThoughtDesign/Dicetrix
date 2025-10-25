# Design Document

## Overview

This design updates the Dicetrix audio system to properly support dice-matching gameplay mechanics by replacing Tetris-style line-clearing sound effects with appropriate dice-matching sound effects. The solution involves updating the AUDIO_ASSETS_DOCUMENTATION.md file, modifying the SoundEffectLibrary class, and ensuring sound event triggers call the correct audio effects for dice-matching events.

## Architecture

The current audio system consists of three main components:

1. **AUDIO_ASSETS_DOCUMENTATION.md** - Specifies required audio files and their purposes
2. **SoundEffectLibrary** - Manages sound effect registration and playback with cooldown protection
3. **StrudelAudioService** - Handles low-level audio playback and Web Audio API integration

The design maintains this existing architecture while updating the sound effect mappings and documentation to reflect dice-matching mechanics.

## Components and Interfaces

### Updated Documentation Structure

The AUDIO_ASSETS_DOCUMENTATION.md will be updated to replace line-clearing terminology with dice-matching terminology:

**Current Line-Clear Effects (to be replaced):**
- `line-clear-single` → `dice-match-3` (3 dice matched)
- `line-clear-double` → `dice-match-4` (4 dice matched)  
- `line-clear-triple` → `dice-match-5` (5 dice matched)
- `line-clear-tetris` → `dice-match-7` (7 dice matched)
- Add new: `dice-match-9` (9 dice matched)

**Preserved Effects:**
- All piece movement sounds (placement, rotation, drop, hold)
- All UI sounds (button-click, menu-navigate, settings-change, mode-select)
- All game state sounds (level-up, game-over, pause, resume)
- All combo sounds (combo-2x, combo-3x, combo-4x)
- All special effects (perfect-clear, warning-alert)

### SoundEffectLibrary Updates

The `SoundEffectLibrary` class will be updated to:

1. **Replace line-clear sound registrations** with dice-match sound registrations
2. **Update the `playLineClear()` method** to `playDiceMatch()` method
3. **Maintain backward compatibility** during transition by handling both old and new sound keys
4. **Preserve all existing functionality** for non-matching sound effects

### Sound Event Mapping

**New Dice Match Method Signature:**
```typescript
playDiceMatch(diceCount: number): void
```

**Mapping Logic:**
- 3 dice matched → `dice-match-3` sound
- 4 dice matched → `dice-match-4` sound  
- 5 dice matched → `dice-match-5` sound
- 7 dice matched → `dice-match-7` sound
- 9+ dice matched → `dice-match-9` sound
- Other counts → fallback to closest match

## Data Models

### Updated Sound Effect Registry

The sound effect registry will be updated to include:

```typescript
// Dice matching sounds (replacing line-clear sounds)
this.registerSound('dice-match-3', SoundCategory.GAMEPLAY, 0.8);
this.registerSound('dice-match-4', SoundCategory.GAMEPLAY, 0.8);
this.registerSound('dice-match-5', SoundCategory.GAMEPLAY, 0.9);
this.registerSound('dice-match-7', SoundCategory.GAMEPLAY, 1.0);
this.registerSound('dice-match-9', SoundCategory.GAMEPLAY, 1.0);
```

### Audio Asset Documentation Updates

The documentation will specify new file requirements:

| Old File | New File | Description |
|----------|----------|-------------|
| `line-clear-single.mp3` | `dice-match-3.mp3` | Sound for matching 3 dice |
| `line-clear-double.mp3` | `dice-match-4.mp3` | Sound for matching 4 dice |
| `line-clear-triple.mp3` | `dice-match-5.mp3` | Sound for matching 5 dice |
| `line-clear-tetris.mp3` | `dice-match-7.mp3` | Sound for matching 7 dice |
| (new) | `dice-match-9.mp3` | Sound for matching 9 dice |

## Error Handling

### Graceful Degradation

The system will maintain graceful degradation during the transition:

1. **Missing Audio Files**: If new dice-match audio files are not present, the system will continue to function silently
2. **Backward Compatibility**: The system will temporarily accept both old and new sound keys during transition
3. **Fallback Behavior**: If a specific dice-match sound is missing, fall back to a generic match sound or silence
4. **Development Mode**: Clear logging will indicate which sound files are missing without breaking gameplay

### Error Recovery

```typescript
// Example error handling in playDiceMatch method
playDiceMatch(diceCount: number): void {
  const soundKey = this.getDiceMatchSoundKey(diceCount);
  
  try {
    this.playSound(soundKey);
  } catch (error) {
    Logger.log(`SoundEffectLibrary: Failed to play ${soundKey}, falling back to generic match sound`);
    // Fallback to generic match sound or continue silently
    this.playSound('match-clear'); // Existing fallback in StrudelAudioService
  }
}
```

## Testing Strategy

### Documentation Validation

1. **File Specification Accuracy**: Verify all new dice-match sound effects are properly documented
2. **Terminology Consistency**: Ensure all references to line-clearing are replaced with dice-matching terminology
3. **Completeness Check**: Confirm all existing non-matching sound effects are preserved

### Code Integration Testing

1. **Sound Registration**: Verify new dice-match sounds are properly registered in SoundEffectLibrary
2. **Method Functionality**: Test that `playDiceMatch()` method correctly maps dice counts to sound keys
3. **Backward Compatibility**: Ensure existing sound effects continue to work during transition
4. **Error Handling**: Test graceful degradation when audio files are missing

### System Integration Testing

1. **Audio Service Integration**: Verify SoundEffectLibrary properly calls StrudelAudioService
2. **Game Event Integration**: Test that dice-matching events trigger appropriate sound effects
3. **Settings Persistence**: Ensure audio settings continue to work with new sound effects
4. **Performance Impact**: Verify no performance degradation from sound effect changes

### Development Workflow Testing

1. **Missing File Handling**: Test game functionality when new audio files are not yet created
2. **Hot Reload Compatibility**: Ensure audio changes work with development hot reloading
3. **Build Process**: Verify new audio file references don't break build process
4. **Asset Loading**: Test that new sound effects load properly in development and production

## Implementation Phases

### Phase 1: Documentation Update
- Update AUDIO_ASSETS_DOCUMENTATION.md with new dice-match sound specifications
- Replace all line-clear terminology with dice-matching terminology
- Preserve all existing non-matching sound effect documentation

### Phase 2: Code Updates
- Update SoundEffectLibrary to register new dice-match sound effects
- Replace `playLineClear()` method with `playDiceMatch()` method
- Add backward compatibility handling for transition period

### Phase 3: Integration Testing
- Test all sound effect changes in development environment
- Verify graceful degradation with missing audio files
- Ensure existing gameplay functionality remains intact

### Phase 4: Asset Preparation
- Provide clear specifications for audio asset creation
- Update validation tools to check for new dice-match sound files
- Maintain development workflow with placeholder audio files
