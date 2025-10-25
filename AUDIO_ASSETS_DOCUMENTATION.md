# Audio Assets Documentation

**Generated**: 2024-10-24  
**Project**: Dicetrix - Comprehensive Music System  
**Version**: 1.0

## Overview

This document provides comprehensive specifications for all audio assets required by the Dicetrix game's audio system. The system includes complete musical compositions, comprehensive sound effects, and advanced audio controls with proper file management.

## Table of Contents

1. [Format Requirements](#format-requirements)
2. [File Organization](#file-organization)
3. [Audio Asset Specifications](#audio-asset-specifications)
4. [Development Workflow](#development-workflow)
5. [Validation Checklist](#validation-checklist)
6. [Naming Conventions](#naming-conventions)
7. [Technical Specifications](#technical-specifications)

## Format Requirements

### Primary Format: MP3 (.mp3)

- **Universal Compatibility**: Supported by all browsers and platforms
- **Quality**: Use 128 kbps for sound effects, 192 kbps for music
- **Simplicity**: Single format reduces complexity and loading issues
- **Reliability**: No fallback logic needed, guaranteed to work everywhere

### Technical Specifications

- **Sample Rate**: 44.1 kHz (CD quality)
- **Bit Rate**: 128 kbps (sound effects), 192 kbps (music)
- **Channels**: Stereo (2 channels)
- **Format**: MP3 only - no format detection or fallback needed

## File Organization

```
assets/audio/
├── music/                    # Background music files (5-10 minutes each)
│   ├── menu-theme.mp3       # Main menu background music
│   ├── easy-mode.mp3        # Easy difficulty gameplay music
│   ├── medium-mode.mp3      # Medium difficulty gameplay music
│   ├── hard-mode.mp3        # Hard difficulty gameplay music
│   ├── expert-mode.mp3      # Expert difficulty gameplay music
│   └── zen-mode.mp3         # Zen mode gameplay music
└── sfx/                     # Sound effect files (0.05-3 seconds each)
    ├── piece-placement.mp3
    │   ├── Xpiece-rotation.ogg
    │   ├── Xpiece-rotation.mp3
    │   ├── Xpiece-drop.ogg
    │   ├── Xpiece-drop.mp3
    │   ├── piece-hold.ogg
    │   ├── piece-hold.mp3
    │   ├── dice-match-3.ogg
    │   ├── Xdice-match-3.mp3
    │   ├── dice-match-4.ogg
    │   ├── dice-match-4.mp3
    │   ├── dice-match-5.ogg
    │   ├── dice-match-5.mp3
    │   ├── dice-match-7.ogg
    │   ├── dice-match-7.mp3
    │   ├── dice-match-9.ogg
    │   ├── dice-match-9.mp3
    │   ├── level-up.ogg
    │   ├── level-up.mp3
    │   ├── game-over.ogg
    │   ├── game-over.mp3
    │   ├── pause.ogg
    │   ├── pause.mp3
    │   ├── resume.ogg
    │   └── resume.mp3
    ├── button-click.ogg
    ├── button-click.mp3
    │   ├── menu-navigate.ogg
    │   ├── menu-navigate.mp3
    │   ├── settings-change.ogg
    │   ├── settings-change.mp3
    │   ├── mode-select.ogg
    │   └── mode-select.mp3
    ├── combo-2x.ogg
    ├── combo-2x.mp3
        ├── combo-3x.ogg
        ├── combo-3x.mp3
        ├── combo-4x.ogg
        ├── combo-4x.mp3
        ├── ultimate-combo.ogg
        ├── ultimate-combo.mp3
        ├── perfect-clear.ogg
        ├── perfect-clear.mp3
        ├── warning-alert.ogg
        └── warning-alert.mp3
```

## Audio Asset Specifications

### Music Files (6 files total)

| File              | Description                                                                 | Duration               | Expected Size | Usage Context                                                     |
| ----------------- | --------------------------------------------------------------------------- | ---------------------- | ------------- | ----------------------------------------------------------------- |
| `menu-theme.ogg`  | Welcoming ambient background music for the main menu and navigation screens | 5-10 minutes (looping) | 3-8 MB        | Background music - loops continuously during menu navigation      |
| `easy-mode.ogg`   | Relaxed, encouraging background music for Easy difficulty gameplay          | 5-10 minutes (looping) | 3-8 MB        | Background music - loops continuously during Easy mode gameplay   |
| `medium-mode.ogg` | Moderately energetic background music for Medium difficulty gameplay        | 5-10 minutes (looping) | 3-8 MB        | Background music - loops continuously during Medium mode gameplay |
| `hard-mode.ogg`   | Intense, driving background music for Hard difficulty gameplay              | 5-10 minutes (looping) | 3-8 MB        | Background music - loops continuously during Hard mode gameplay   |
| `expert-mode.ogg` | Complex, challenging background music for Expert difficulty gameplay        | 5-10 minutes (looping) | 3-8 MB        | Background music - loops continuously during Expert mode gameplay |
| `zen-mode.ogg`    | Calm, meditative background music for Zen mode gameplay                     | 5-10 minutes (looping) | 3-8 MB        | Background music - loops continuously during Zen mode gameplay    |

### Sound Effect Files (19 files total)

#### Gameplay Sounds (13 files)

| File                | Description                                                                  | Duration        | Expected Size | Usage Context                                   |
| ------------------- | ---------------------------------------------------------------------------- | --------------- | ------------- | ----------------------------------------------- |
| `piece-placement.ogg` | Sound effect played when a game piece is successfully placed on the board    | 0.1-0.3 seconds | 10-100 KB     | Triggered on every piece placement action       |
| `piece-rotation.ogg`  | Sound effect played when a game piece is rotated by the player               | 0.1-0.2 seconds | 10-100 KB     | Triggered on every piece rotation action        |
| `piece-drop.ogg`      | Sound effect played when a game piece drops quickly to the bottom            | 0.2-0.5 seconds | 10-100 KB     | Triggered when piece drops or hard drop is used |
| `piece-hold.ogg`      | Sound effect played when a game piece is held or swapped with the hold piece | 0.1-0.3 seconds | 10-100 KB     | Triggered when hold/swap functionality is used  |
| `dice-match-3.ogg`    | Sound effect played when exactly 3 dice are matched and cleared from the board | 0.5-1.0 seconds | 10-100 KB     | Triggered when matching exactly 3 dice          |
| `dice-match-4.ogg`    | Sound effect played when exactly 4 dice are matched and cleared simultaneously | 0.7-1.2 seconds | 10-100 KB     | Triggered when matching exactly 4 dice         |
| `dice-match-5.ogg`    | Sound effect played when exactly 5 dice are matched and cleared simultaneously | 0.9-1.5 seconds | 10-100 KB     | Triggered when matching exactly 5 dice         |
| `dice-match-7.ogg`    | Sound effect played when exactly 7 dice are matched and cleared simultaneously | 1.0-2.0 seconds | 10-100 KB     | Triggered when matching exactly 7 dice         |
| `dice-match-9.ogg`    | Sound effect played when 9 or more dice are matched and cleared simultaneously | 1.2-2.5 seconds | 10-100 KB     | Triggered when matching 9 or more dice         |
| `level-up.ogg`        | Sound effect played when the player advances to the next difficulty level    | 1.0-2.5 seconds | 10-100 KB     | Triggered on level progression                  |
| `game-over.ogg`       | Sound effect played when the game ends due to the board filling up           | 2.0-4.0 seconds | 10-100 KB     | Triggered when game ends                        |
| `pause.ogg`           | Sound effect played when the game is paused by the player                    | 0.3-0.8 seconds | 10-100 KB     | Triggered when game is paused                   |
| `resume.ogg`          | Sound effect played when the game is resumed from a paused state             | 0.3-0.8 seconds | 10-100 KB     | Triggered when game is resumed                  |

#### UI Interaction Sounds (4 files)

| File                  | Description                                                           | Duration          | Expected Size | Usage Context                                                  |
| --------------------- | --------------------------------------------------------------------- | ----------------- | ------------- | -------------------------------------------------------------- |
| `button-click.ogg`    | Sound effect played when any button or interactive element is clicked | 0.05-0.15 seconds | 10-100 KB     | Triggered on UI button interactions (with cooldown protection) |
| `menu-navigate.ogg`   | Sound effect played when navigating between menu items or options     | 0.1-0.25 seconds  | 10-100 KB     | Triggered on menu navigation (with cooldown protection)        |
| `settings-change.ogg` | Sound effect played when a game setting is modified or saved          | 0.2-0.5 seconds   | 10-100 KB     | Triggered when settings are modified                           |
| `mode-select.ogg`     | Sound effect played when selecting a game mode or difficulty level    | 0.3-0.8 seconds   | 10-100 KB     | Triggered when selecting game modes                            |

#### Special Effect Sounds (6 files)

| File                | Description                                                              | Duration        | Expected Size | Usage Context                           |
| ------------------- | ------------------------------------------------------------------------ | --------------- | ------------- | --------------------------------------- |
| `combo-2x.ogg`      | Sound effect played when achieving a 2x chain multiplier from consecutive dice-matching sequences | 0.5-1.0 seconds | 10-100 KB     | Triggered on 2x dice-matching chain multiplier       |
| `combo-3x.ogg`      | Sound effect played when achieving a 3x chain multiplier from consecutive dice-matching sequences | 0.7-1.2 seconds | 10-100 KB     | Triggered on 3x dice-matching chain multiplier       |
| `combo-4x.ogg`      | Sound effect played when achieving a 4x or higher chain multiplier from consecutive dice-matching sequences | 1.0-1.5 seconds | 10-100 KB     | Triggered on 4x+ dice-matching chain multiplier      |
| `ultimate-combo.ogg` | Sound effect played when achieving Ultimate Combo by matching 3+ Wild dice, creating spectacular dice-matching effects | 2.0-3.5 seconds | 10-100 KB     | Triggered on Ultimate Combo achievement with Wild dice matches |
| `perfect-clear.ogg` | Sound effect played when the entire game board is cleared perfectly through strategic dice-matching combinations | 2.0-3.0 seconds | 10-100 KB     | Triggered on perfect board clear via dice-matching        |
| `warning-alert.ogg` | Sound effect played to alert the player of danger or critical situations | 0.5-1.5 seconds | 10-100 KB     | Triggered for danger/warning situations |

## Development Workflow

### Phase 1: Asset Creation

1. **Create Directory Structure**: Set up the `assets/audio/` folder structure as shown above
2. **Generate Placeholder Files**: Create silent placeholder files for development
3. **Implement Core Functionality**: Ensure the audio system works with missing files
4. **Test Graceful Degradation**: Verify the game functions without audio assets

### Phase 2: Audio Production

1. **Music Composition**: Create full-length musical compositions for each game mode
2. **Sound Effect Creation**: Design and record all required sound effects
3. **Format Conversion**: Convert all assets to both OGG and MP3 formats
4. **Quality Assurance**: Test audio quality and file sizes

### Phase 3: Integration and Testing

1. **Asset Integration**: Replace placeholder files with final audio assets
2. **Cross-Browser Testing**: Verify audio playback across different browsers
3. **Performance Testing**: Ensure audio loading doesn't impact game performance
4. **User Experience Testing**: Validate audio enhances gameplay experience

### Graceful Degradation During Development

The audio system is designed to work seamlessly during development even when audio files are missing:

- **Silent Fallbacks**: Missing audio files are replaced with silent placeholders
- **Error Logging**: Clear development messages indicate which files are missing
- **Continued Functionality**: Game remains fully playable without audio assets
- **Hot Reloading**: Audio files can be added during development without restart

## Validation Checklist

### Pre-Development Checklist

- [ ] Directory structure created (`assets/audio/music/` and `assets/audio/sound/`)
- [ ] Development environment configured for audio asset loading
- [ ] AudioAssetManager integrated into game scenes
- [ ] Graceful degradation tested with missing files

### Audio Asset Checklist

#### Music Files (Required)

- [ ] `menu-theme.ogg` - Main menu background music
- [ ] `menu-theme.mp3` - MP3 fallback for menu music
- [ ] `easy-mode.ogg` - Easy difficulty gameplay music
- [ ] `easy-mode.mp3` - MP3 fallback for easy mode
- [ ] `medium-mode.ogg` - Medium difficulty gameplay music
- [ ] `medium-mode.mp3` - MP3 fallback for medium mode
- [ ] `hard-mode.ogg` - Hard difficulty gameplay music
- [ ] `hard-mode.mp3` - MP3 fallback for hard mode
- [ ] `expert-mode.ogg` - Expert difficulty gameplay music
- [ ] `expert-mode.mp3` - MP3 fallback for expert mode
- [ ] `zen-mode.ogg` - Zen mode gameplay music
- [ ] `zen-mode.mp3` - MP3 fallback for zen mode

#### Gameplay Sound Effects (Required)

- [ ] `piece-placement.ogg` - Piece placement sound
- [ ] `piece-placement.mp3` - MP3 fallback
- [ ] `piece-rotation.ogg` - Piece rotation sound
- [ ] `piece-rotation.mp3` - MP3 fallback
- [ ] `piece-drop.ogg` - Piece drop sound
- [ ] `piece-drop.mp3` - MP3 fallback
- [ ] `piece-hold.ogg` - Piece hold sound
- [ ] `piece-hold.mp3` - MP3 fallback
- [ ] `dice-match-3.ogg` - 3 dice match sound
- [ ] `dice-match-3.mp3` - MP3 fallback
- [ ] `dice-match-4.ogg` - 4 dice match sound
- [ ] `dice-match-4.mp3` - MP3 fallback
- [ ] `dice-match-5.ogg` - 5 dice match sound
- [ ] `dice-match-5.mp3` - MP3 fallback
- [ ] `dice-match-7.ogg` - 7 dice match sound
- [ ] `dice-match-7.mp3` - MP3 fallback
- [ ] `dice-match-9.ogg` - 9+ dice match sound
- [ ] `dice-match-9.mp3` - MP3 fallback
- [ ] `level-up.ogg` - Level up sound
- [ ] `level-up.mp3` - MP3 fallback
- [ ] `game-over.ogg` - Game over sound
- [ ] `game-over.mp3` - MP3 fallback
- [ ] `pause.ogg` - Pause sound
- [ ] `pause.mp3` - MP3 fallback
- [ ] `resume.ogg` - Resume sound
- [ ] `resume.mp3` - MP3 fallback

#### UI Interaction Sound Effects (Required)

- [ ] `button-click.ogg` - Button click sound
- [ ] `button-click.mp3` - MP3 fallback
- [ ] `menu-navigate.ogg` - Menu navigation sound
- [ ] `menu-navigate.mp3` - MP3 fallback
- [ ] `settings-change.ogg` - Settings change sound
- [ ] `settings-change.mp3` - MP3 fallback
- [ ] `mode-select.ogg` - Mode selection sound
- [ ] `mode-select.mp3` - MP3 fallback

#### Special Effect Sound Effects (Required)

- [ ] `combo-2x.ogg` - 2x dice-matching chain multiplier sound
- [ ] `combo-2x.mp3` - MP3 fallback
- [ ] `combo-3x.ogg` - 3x dice-matching chain multiplier sound
- [ ] `combo-3x.mp3` - MP3 fallback
- [ ] `combo-4x.ogg` - 4x+ dice-matching chain multiplier sound
- [ ] `combo-4x.mp3` - MP3 fallback
- [ ] `ultimate-combo.ogg` - Ultimate Combo Wild dice-matching sound
- [ ] `ultimate-combo.mp3` - MP3 fallback
- [ ] `perfect-clear.ogg` - Perfect board clear via dice-matching sound
- [ ] `perfect-clear.mp3` - MP3 fallback
- [ ] `warning-alert.ogg` - Warning alert sound
- [ ] `warning-alert.mp3` - MP3 fallback

### Quality Assurance Checklist

- [ ] All files follow correct naming convention (lowercase, hyphens)
- [ ] All files are in correct format (OGG primary, MP3 fallback)
- [ ] Audio quality meets specifications (44.1kHz sample rate)
- [ ] File sizes are within expected ranges
- [ ] All files load without errors in target browsers
- [ ] Audio levels are consistent across all files
- [ ] No audio clipping or distortion present
- [ ] Looping music files have seamless transitions
- [ ] Sound effects have appropriate duration and timing

### Integration Testing Checklist

- [ ] AudioAssetManager successfully loads all assets
- [ ] SoundEffectLibrary plays all sound effects correctly
- [ ] StrudelMusic compositions play without errors
- [ ] AudioControlsUI volume controls affect all audio
- [ ] Settings persistence works correctly
- [ ] Cross-browser compatibility verified
- [ ] Performance impact is acceptable
- [ ] Memory usage is within limits

## Naming Conventions

### File Naming Rules

1. **Lowercase Only**: All filenames must use lowercase letters
2. **Hyphen Separation**: Use hyphens (-) to separate words, no spaces or underscores
3. **Descriptive Names**: Names should clearly indicate the sound's purpose
4. **Consistent Patterns**: Follow established patterns for similar sounds

### Examples of Correct Naming

- ✅ `piece-placement.ogg`
- ✅ `dice-match-3.ogg`
- ✅ `menu-navigate.ogg`
- ✅ `combo-2x.ogg`

### Examples of Incorrect Naming

- ❌ `PiecePlacement.ogg` (uppercase letters)
- ❌ `piece_placement.ogg` (underscores)
- ❌ `piece placement.ogg` (spaces)
- ❌ `pp.ogg` (not descriptive)

### Category-Based Naming Patterns

#### Music Files

- Pattern: `{context}-{mode}.{ext}`
- Examples: `menu-theme.ogg`, `easy-mode.ogg`, `zen-mode.ogg`

#### Gameplay Sounds

- Pattern: `{action}-{detail}.{ext}`
- Examples: `piece-placement.ogg`, `dice-match-3.ogg`, `level-up.ogg`

#### UI Sounds

- Pattern: `{interface}-{action}.{ext}`
- Examples: `button-click.ogg`, `menu-navigate.ogg`, `settings-change.ogg`

#### Effect Sounds

- Pattern: `{effect}-{level}.{ext}` or `{effect}-{type}.{ext}`
- Examples: `combo-2x.ogg`, `ultimate-combo.ogg`, `perfect-clear.ogg`, `warning-alert.ogg`

## Technical Specifications

### Audio Encoding Guidelines

#### OGG Vorbis Settings

- **Quality Level**: -q 4 to -q 6 (equivalent to 128-192 kbps)
- **Variable Bitrate**: Recommended for optimal compression
- **Channel Coupling**: Enabled for stereo files
- **Sample Rate**: 44100 Hz

#### MP3 Settings

- **Bitrate**: 128 kbps (sound effects), 192 kbps (music)
- **Mode**: Joint Stereo for optimal compression
- **Quality**: High quality encoding (LAME encoder recommended)
- **Sample Rate**: 44100 Hz

### Performance Considerations

#### File Size Optimization

- **Music Files**: Target 3-8 MB for OGG, 5-12 MB for MP3
- **Sound Effects**: Target 10-100 KB for OGG, 15-150 KB for MP3
- **Compression**: Use variable bitrate for optimal size/quality ratio
- **Streaming**: Large music files are automatically streamed to reduce memory usage

#### Loading Strategy

- **Preloading**: All required assets are preloaded during game initialization
- **Fallback Handling**: Automatic format selection based on browser support
- **Memory Management**: Automatic cleanup of unused assets
- **Error Recovery**: Graceful handling of missing or corrupted files

### Browser Compatibility

#### Format Support Matrix

| Browser | OGG Vorbis   | MP3          | WAV     | M4A          |
| ------- | ------------ | ------------ | ------- | ------------ |
| Chrome  | ✅ Excellent | ✅ Good      | ✅ Good | ✅ Good      |
| Firefox | ✅ Excellent | ✅ Good      | ✅ Good | ❌ Limited   |
| Safari  | ❌ Limited   | ✅ Excellent | ✅ Good | ✅ Excellent |
| Edge    | ✅ Good      | ✅ Excellent | ✅ Good | ✅ Good      |

#### Automatic Fallback Strategy

1. **Primary**: Try OGG Vorbis (best compression)
2. **Secondary**: Try MP3 (universal compatibility)
3. **Tertiary**: Try other supported formats
4. **Fallback**: Silent placeholder for development

## Development Tools and Validation

### AudioAssetManager Methods

The `AudioAssetManager` class provides several methods for development and validation:

```typescript
// Validate all audio assets
const validation = audioAssetManager.validateAudioAssets();
console.log(`Valid assets: ${validation.validAssets}/${validation.totalAssets}`);

// Get comprehensive documentation
const documentation = audioAssetManager.generatePlaceholderDocumentation();

// Get validation tools
const tools = audioAssetManager.getValidationTools();
const missingFiles = tools.checkRequiredFiles();
const checklist = tools.generateFileChecklist();
const report = tools.generateAssetReport();

// Check individual assets
const isLoaded = audioAssetManager.isAssetLoaded('piece-placement');
const metadata = audioAssetManager.getAssetMetadata('menu-music');
```

### Development Commands

```javascript
// In browser console during development:

// Check audio system status
console.log(audioAssetManager.getDebugInfo());

// Validate all assets
console.log(audioAssetManager.validateAudioAssets());

// Get missing files list
console.log(audioAssetManager.getValidationTools().checkRequiredFiles());

// Generate asset report
console.log(audioAssetManager.getValidationTools().generateAssetReport());
```

## Troubleshooting

### Common Issues and Solutions

#### Audio Files Not Loading

1. **Check File Paths**: Ensure files are in correct directory structure
2. **Verify File Names**: Confirm filenames match exactly (case-sensitive)
3. **Test File Formats**: Try both OGG and MP3 versions
4. **Browser Console**: Check for loading errors in developer tools

#### Audio Not Playing

1. **Check Volume Settings**: Verify audio is not muted in game settings
2. **Browser Autoplay Policy**: Some browsers require user interaction before audio
3. **File Corruption**: Test files in audio player outside the game
4. **Format Support**: Verify browser supports the audio format

#### Performance Issues

1. **File Sizes**: Ensure files are within recommended size limits
2. **Memory Usage**: Monitor memory consumption with large music files
3. **Concurrent Loading**: Avoid loading too many assets simultaneously
4. **Streaming**: Large files should use streaming for better performance

### Debug Information

The audio system provides comprehensive debug information:

```javascript
// Get detailed system status
const debugInfo = audioAssetManager.getDebugInfo();
// Output: "AudioAssetManager: 25/25 loaded, 0 failed | Formats: ogg, mp3 | Streaming: ON | Progress: 100%"

// Get memory usage information
const memoryInfo = audioAssetManager.getAssetLifecycleManager().getMemoryUsage();
console.log(`Memory usage: ${Math.round(memoryInfo.totalSize / 1024 / 1024)}MB`);

// Get active streams information
const streams = audioAssetManager.getAudioStreamingManager().getActiveStreams();
console.log(`Active streams: ${streams.length}`);
```

---

**Note**: This documentation is automatically generated and should be updated whenever audio asset requirements change. The audio system is designed to be development-friendly, allowing the game to function fully even when audio files are missing during development phases.
