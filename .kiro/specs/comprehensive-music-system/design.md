# Design Document

## Overview

The Comprehensive Music System builds upon the existing HybridAudioService to provide complete musical compositions and a comprehensive sound effect library. The system will feature full Strudel-based musical compositions for each game mode, a complete set of sound effects for game interactions, and advanced audio controls for user customization.

## Architecture

### Core Components

1. **Enhanced StrudelMusic Class**: Expanded with complete musical compositions
2. **SoundEffectLibrary Class**: New component managing all game sound effects
3. **AudioControlsUI Class**: Advanced user interface for audio settings
4. **AudioAssetManager Class**: Comprehensive audio file management system
5. **Enhanced HybridAudioService**: Extended with new capabilities

### Integration Points

- **Phaser Scene Integration**: All scenes will have access to the enhanced audio system
- **Settings Persistence**: Audio preferences stored in localStorage
- **Asset Preloading**: Integration with Phaser's asset loading system
- **UI Integration**: Audio controls embedded in settings and pause menus

## Components and Interfaces

### Enhanced StrudelMusic Class

```typescript
export class StrudelMusic {
  // Complete musical compositions (5-10 minutes each)
  static createMenuTheme(): Pattern;           // Welcoming, ambient menu music
  static createEasyModeMusic(): Pattern;       // Relaxed, encouraging gameplay music
  static createMediumModeMusic(): Pattern;     // Moderately energetic music
  static createHardModeMusic(): Pattern;       // Intense, driving music
  static createExpertModeMusic(): Pattern;     // Complex, challenging music
  static createZenModeMusic(): Pattern;        // Calm, meditative music
  
  // Transition and special compositions
  static createGameOverMusic(): Pattern;       // Sympathetic game over music
  static createVictoryMusic(): Pattern;        // Celebratory completion music
  static createPauseMusic(): Pattern;          // Subdued pause state music
}
```

### SoundEffectLibrary Class

```typescript
export class SoundEffectLibrary {
  private scene: Phaser.Scene;
  private soundEnabled: boolean;
  private soundVolume: number;
  
  // Piece interaction sounds
  playPiecePlacement(): void;
  playPieceRotation(): void;
  playPieceDrop(): void;
  playPieceHold(): void;
  
  // Game event sounds
  playLineClear(linesCleared: number): void;
  playLevelUp(): void;
  playGameOver(): void;
  playPause(): void;
  playResume(): void;
  
  // UI interaction sounds
  playButtonClick(): void;
  playMenuNavigate(): void;
  playSettingsChange(): void;
  playModeSelect(): void;
  
  // Special effect sounds
  playComboEffect(comboLevel: number): void;
  playPerfectClear(): void;
  playWarningAlert(): void;
}
```

### AudioControlsUI Class

```typescript
export interface AudioControlsConfig {
  musicVolume: number;
  soundVolume: number;
  musicEnabled: boolean;
  soundEnabled: boolean;
  masterMute: boolean;
}

export class AudioControlsUI {
  private config: AudioControlsConfig;
  
  createVolumeSlider(type: 'music' | 'sound'): Phaser.GameObjects.Container;
  createToggleSwitch(type: 'music' | 'sound' | 'master'): Phaser.GameObjects.Container;
  createPresetButtons(): Phaser.GameObjects.Container;
  
  saveSettings(): void;
  loadSettings(): AudioControlsConfig;
  resetToDefaults(): void;
}
```

### AudioAssetManager Class

```typescript
export class AudioAssetManager {
  private static readonly REQUIRED_MUSIC_FILES: string[];
  private static readonly REQUIRED_SOUND_FILES: string[];
  
  preloadAudioAssets(scene: Phaser.Scene): void;
  validateAudioAssets(): AudioValidationResult;
  getPlaceholderSoundList(): PlaceholderSoundFile[];
  handleMissingAssets(missingFiles: string[]): void;
}

export interface PlaceholderSoundFile {
  key: string;
  filename: string;
  description: string;
  format: string;
  duration: string;
  usage: string;
}
```

## Data Models

### Audio Configuration Model

```typescript
export interface AudioConfiguration {
  music: {
    volume: number;        // 0.0 to 1.0
    enabled: boolean;
    currentTrack: string | null;
    fadeInDuration: number;
    fadeOutDuration: number;
  };
  
  sound: {
    volume: number;        // 0.0 to 1.0
    enabled: boolean;
    categories: {
      ui: boolean;
      gameplay: boolean;
      effects: boolean;
    };
  };
  
  system: {
    masterMute: boolean;
    audioMode: AudioMode;
    preloadComplete: boolean;
    fallbackMode: boolean;
  };
}
```

### Sound Effect Mapping Model

```typescript
export interface SoundEffectMapping {
  [key: string]: {
    file: string;
    volume: number;
    category: 'ui' | 'gameplay' | 'effects';
    variations?: string[];
    cooldown?: number;
  };
}
```

## Error Handling

### Audio Asset Loading Errors

1. **Missing Files**: Graceful degradation with placeholder sounds
2. **Format Incompatibility**: Automatic fallback to supported formats
3. **Loading Timeouts**: Skip problematic assets and continue
4. **Memory Constraints**: Implement asset streaming for large files

### Runtime Audio Errors

1. **Playback Failures**: Silent failure with error logging
2. **Context Suspension**: Automatic resume on user interaction
3. **Volume Control Errors**: Maintain last known good state
4. **Strudel Pattern Errors**: Fallback to simple audio files

## Testing Strategy

### Unit Testing

- **StrudelMusic Patterns**: Verify pattern creation and playback
- **SoundEffectLibrary**: Test all sound effect methods
- **AudioControlsUI**: Validate UI component behavior
- **AudioAssetManager**: Test asset loading and validation

### Integration Testing

- **Scene Integration**: Test audio system across all game scenes
- **Settings Persistence**: Verify configuration save/load functionality
- **Fallback Modes**: Test graceful degradation scenarios
- **Performance Testing**: Validate memory usage and loading times

### User Experience Testing

- **Volume Control Responsiveness**: Test immediate audio changes
- **Music Transitions**: Verify smooth scene-to-scene audio
- **Sound Effect Timing**: Ensure audio feedback feels responsive
- **Accessibility**: Test with various audio hardware configurations

## Implementation Phases

### Phase 1: Enhanced Music Compositions
- Expand StrudelMusic with complete compositions
- Implement music transition system
- Add composition variation support

### Phase 2: Comprehensive Sound Effects
- Create SoundEffectLibrary class
- Implement all game interaction sounds
- Add sound effect categorization

### Phase 3: Advanced Audio Controls
- Build AudioControlsUI component
- Implement volume sliders and toggles
- Add settings persistence

### Phase 4: Asset Management System
- Create AudioAssetManager class
- Implement preloading and validation
- Generate placeholder sound documentation

### Phase 5: Integration and Polish
- Integrate all components with existing scenes
- Implement error handling and fallbacks
- Performance optimization and testing

## Placeholder Sound Files Required

The system will require the following placeholder sound effect files:

### Gameplay Sounds
- `piece-placement.ogg` - Sound when piece is placed
- `piece-rotation.ogg` - Sound when piece is rotated
- `piece-drop.ogg` - Sound when piece drops quickly
- `piece-hold.ogg` - Sound when piece is held/swapped
- `line-clear-single.ogg` - Single line clear sound
- `line-clear-double.ogg` - Double line clear sound
- `line-clear-triple.ogg` - Triple line clear sound
- `line-clear-tetris.ogg` - Four line clear sound
- `level-up.ogg` - Level progression sound
- `game-over.ogg` - Game end sound
- `pause.ogg` - Game pause sound
- `resume.ogg` - Game resume sound

### UI Sounds
- `button-click.ogg` - General button press sound
- `menu-navigate.ogg` - Menu navigation sound
- `settings-change.ogg` - Settings modification sound
- `mode-select.ogg` - Game mode selection sound

### Special Effects
- `combo-2x.ogg` - 2x combo effect
- `combo-3x.ogg` - 3x combo effect
- `combo-4x.ogg` - 4x+ combo effect
- `perfect-clear.ogg` - Perfect board clear sound
- `warning-alert.ogg` - Warning/danger sound

### Fallback Music Files
- `menu-theme.ogg` - Menu background music
- `easy-mode.ogg` - Easy difficulty music
- `medium-mode.ogg` - Medium difficulty music
- `hard-mode.ogg` - Hard difficulty music
- `expert-mode.ogg` - Expert difficulty music
- `zen-mode.ogg` - Zen mode music

All audio files should be in OGG Vorbis format for optimal web compatibility, with MP3 fallbacks for broader browser support.
