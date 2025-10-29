# AudioHandler Design Document

## Overview

The AudioHandler is a centralized audio management system for the Dicetrix game that provides consistent sound effects and background music control throughout the application. It will be implemented as a singleton service that initializes during the Preloader scene and remains accessible to all game scenes through a global registry or direct import.

## Architecture

### Core Components

1. **AudioHandler Service** - Main singleton class managing all audio operations
2. **AudioSettings** - Configuration object for audio preferences (music/sound on/off)
3. **Settings Scene** - New scene for audio configuration UI
4. **Audio Assets** - Sound files and music tracks loaded during preload

### Integration Points

- **Preloader Scene**: Loads audio assets and initializes AudioHandler
- **Game Scene**: Consumes AudioHandler for gameplay sound effects
- **Settings Scene**: Provides UI controls for audio preferences
- **Settings Service**: Persists audio preferences using existing settings system

## Components and Interfaces

### AudioHandler Class

```typescript
interface IAudioHandler {
  // Initialization
  initialize(scene: Phaser.Scene): void;
  
  // Music control
  playMusic(key: string, loop?: boolean): void;
  stopMusic(): void;
  pauseMusic(): void;
  resumeMusic(): void;
  
  // Sound effects
  playSound(key: string, volume?: number): void;
  
  // Settings management
  setMusicEnabled(enabled: boolean): void;
  setSoundEnabled(enabled: boolean): void;
  getMusicEnabled(): boolean;
  getSoundEnabled(): boolean;
  
  // Volume control
  setMusicVolume(volume: number): void;
  setSoundVolume(volume: number): void;
  
  // Cleanup
  destroy(): void;
}
```

### AudioSettings Interface

```typescript
interface AudioSettings {
  musicEnabled: boolean;
  soundEnabled: boolean;
  musicVolume: number;
  soundVolume: number;
}
```

### Settings Scene Structure

The Settings scene will be a new Phaser scene with:
- Toggle buttons for Music On/Off
- Toggle buttons for Sound Effects On/Off
- Back button to return to previous scene
- Visual feedback for current settings state

## Data Models

### Audio Asset Configuration

```typescript
interface AudioAsset {
  key: string;
  path: string;
  type: 'music' | 'sound';
  volume?: number;
  loop?: boolean;
}
```

### Audio State Management

The AudioHandler will maintain internal state for:
- Current music track reference
- Audio settings (enabled/disabled states)
- Volume levels
- Loaded audio assets registry

## Error Handling

### Audio Loading Failures
- Graceful degradation when audio files fail to load
- Fallback to silent operation without breaking game functionality
- Error logging for debugging purposes

### Browser Audio Limitations
- Handle autoplay restrictions by deferring audio until user interaction
- Provide visual indicators when audio is muted due to browser policies
- Implement audio unlock mechanism for mobile browsers

### Settings Persistence Failures
- Default to enabled state if settings cannot be loaded
- Continue operation with in-memory settings if persistence fails
- Log errors without disrupting user experience

## Testing Strategy

### Unit Tests
- AudioHandler initialization and configuration
- Settings persistence and retrieval
- Audio state management (play/pause/stop)
- Volume control functionality

### Integration Tests
- Scene transitions with audio continuity
- Settings scene interaction with AudioHandler
- Audio asset loading during preloader
- Cross-scene audio state consistency

### Manual Testing
- Audio playback across different browsers
- Mobile device audio behavior
- Settings persistence across game sessions
- Performance impact of audio operations

## Implementation Details

### Singleton Pattern
The AudioHandler will use a singleton pattern to ensure single instance across the application:

```typescript
class AudioHandler {
  private static instance: AudioHandler;
  
  static getInstance(): AudioHandler {
    if (!AudioHandler.instance) {
      AudioHandler.instance = new AudioHandler();
    }
    return AudioHandler.instance;
  }
}
```

### Scene Integration
- **Preloader**: Load audio assets and initialize AudioHandler
- **StartMenu**: Access AudioHandler for menu sounds
- **Game**: Use AudioHandler for gameplay sound effects and music
- **Settings**: New scene with AudioHandler configuration UI
- **GameOver**: Access AudioHandler for end-game sounds

### Asset Management
Audio assets will be organized in the public assets directory:
```
/assets/
  /audio/
    /music/
      - background.mp3
      - menu.mp3
    /sounds/
      - click.mp3
      - match.mp3
      - cascade.mp3
      - gameover.mp3
```

### Settings Integration
The AudioHandler will integrate with the existing Settings service to persist preferences:
- Use `settings.set('audioSettings', audioConfig)` for persistence
- Load settings during initialization with fallback defaults
- Update settings immediately when user changes preferences

### Performance Considerations
- Lazy loading of audio assets to minimize initial load time
- Audio pooling for frequently played sound effects
- Memory cleanup when scenes are destroyed
- Efficient volume control without recreating audio objects
