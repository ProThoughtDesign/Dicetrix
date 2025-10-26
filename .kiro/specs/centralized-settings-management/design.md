# Centralized Settings Management System Design

## Overview

The current settings system suffers from fragmentation, with settings being managed in multiple places without proper coordination. This design implements a centralized settings management system that provides a single source of truth for all game settings, proper persistence, event-driven updates, and seamless integration with existing components.

The system will replace the current fragmented approach where settings are modified directly in multiple UI components and services, creating a clean separation of concerns and ensuring consistent behavior across all game screens.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Settings Manager                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Settings      │  │   Event         │  │ Persistence │ │
│  │   Store         │  │   System        │  │   Layer     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Events & API Calls
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Audio         │  │   UI            │  │   Game      │ │
│  │   Handler       │  │   Components    │  │   Logic     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Settings Manager Architecture

The Settings Manager will be implemented as a singleton service with the following internal structure:

- **Settings Store**: Holds the current state of all settings
- **Event System**: Manages subscriptions and notifications for settings changes
- **Persistence Layer**: Handles loading and saving settings to localStorage
- **Validation Layer**: Ensures all setting values are valid before storage
- **Migration System**: Handles schema changes and version upgrades

## Components and Interfaces

### 1. Settings Manager Core

```typescript
interface ISettingsManager {
  // Core API
  get<T>(key: string): T;
  set<T>(key: string, value: T): void;
  getAll(): SettingsState;
  reset(): void;
  resetToDefaults(keys?: string[]): void;
  
  // Event System
  subscribe(key: string, callback: SettingsChangeCallback): () => void;
  subscribeAll(callback: AllSettingsChangeCallback): () => void;
  
  // Validation
  addValidator(key: string, validator: SettingsValidator): void;
  
  // Persistence
  save(): Promise<void>;
  load(): Promise<void>;
  
  // Diagnostics
  getDiagnostics(): SettingsDiagnostics;
}
```

### 2. Settings Schema

```typescript
interface SettingsState {
  audio: {
    musicVolume: number;        // 0.0 - 1.0
    soundVolume: number;        // 0.0 - 1.0
    musicEnabled: boolean;
    soundEnabled: boolean;
    masterMute: boolean;
  };
  game: {
    selectedMode: 'easy' | 'medium' | 'hard';
    showTutorial: boolean;
  };
  ui: {
    theme: 'default' | 'dark' | 'light';
    animations: boolean;
  };
  meta: {
    version: string;
    lastModified: number;
  };
}
```

### 3. Event System

```typescript
interface SettingsChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

type SettingsChangeCallback = (event: SettingsChangeEvent) => void;
type AllSettingsChangeCallback = (events: SettingsChangeEvent[]) => void;
```

### 4. Audio Integration Adapter

```typescript
interface AudioSettingsAdapter {
  syncFromSettings(settings: AudioSettings): void;
  syncToSettings(audioState: AudioState): void;
  subscribeToChanges(): void;
}
```

## Data Models

### Settings Storage Format

```typescript
interface StoredSettings {
  version: string;
  timestamp: number;
  data: SettingsState;
  checksum?: string; // For corruption detection
}
```

### Default Values

```typescript
const DEFAULT_SETTINGS: SettingsState = {
  audio: {
    musicVolume: 0.8,
    soundVolume: 0.8,
    musicEnabled: true,
    soundEnabled: true,
    masterMute: false,
  },
  game: {
    selectedMode: 'medium',
    showTutorial: true,
  },
  ui: {
    theme: 'default',
    animations: true,
  },
  meta: {
    version: '1.0.0',
    lastModified: Date.now(),
  },
};
```

## Error Handling

### Validation System

- **Type Validation**: Ensure values match expected types
- **Range Validation**: Clamp numeric values to valid ranges
- **Enum Validation**: Validate string values against allowed options
- **Custom Validators**: Support for complex validation rules

### Error Recovery

- **Corruption Detection**: Checksum validation for stored data
- **Graceful Degradation**: Fall back to defaults on corruption
- **Partial Recovery**: Recover valid settings while resetting invalid ones
- **Error Logging**: Comprehensive logging for debugging

### Persistence Error Handling

- **Storage Quota Exceeded**: Handle localStorage limits gracefully
- **Permission Denied**: Handle private browsing mode
- **Network Issues**: Handle offline scenarios
- **Concurrent Access**: Handle multiple tab scenarios

## Testing Strategy

### Unit Tests

- **Settings Manager Core**: Test all API methods
- **Event System**: Test subscription and notification mechanisms
- **Validation**: Test all validation rules and edge cases
- **Persistence**: Test save/load operations and error scenarios

### Integration Tests

- **Audio Integration**: Test settings changes propagate to audio system
- **UI Integration**: Test visual indicators update correctly
- **Cross-Scene**: Test settings persistence across scene transitions
- **Error Recovery**: Test corruption recovery and fallback mechanisms

### Performance Tests

- **Memory Usage**: Ensure no memory leaks in event subscriptions
- **Storage Performance**: Test large settings objects
- **Event Performance**: Test high-frequency setting changes
- **Initialization Time**: Test startup performance impact

## Implementation Plan Integration

### Phase 1: Core Settings Manager
- Implement the Settings Manager singleton
- Create the event system and subscription mechanism
- Implement persistence layer with error handling
- Add validation system with default validators

### Phase 2: Audio System Integration
- Create AudioSettingsAdapter to bridge settings and audio
- Migrate AudioHandler to use centralized settings
- Update all audio-related UI components to use Settings Manager
- Ensure proper event propagation for audio changes

### Phase 3: UI Component Migration
- Update Settings scene to use centralized system
- Update SettingsOverlayUI to use centralized system
- Update PauseMenuUI to use centralized system
- Update StartMenu audio controls to use centralized system

### Phase 4: Advanced Features
- Implement settings migration system for schema changes
- Add settings export/import functionality
- Implement settings validation UI feedback
- Add settings diagnostics and debugging tools

## Migration Strategy

### Backward Compatibility

The new system will maintain compatibility with existing localStorage data:

1. **Detection**: Check for existing settings format
2. **Migration**: Convert old format to new schema
3. **Validation**: Ensure migrated data is valid
4. **Cleanup**: Remove old format data after successful migration

### Gradual Migration

Components will be migrated incrementally:

1. **Settings Manager**: Deploy core system alongside existing
2. **Audio First**: Migrate audio settings as highest priority
3. **UI Components**: Migrate UI components one by one
4. **Cleanup**: Remove old settings code after full migration

## Performance Considerations

### Memory Management

- **Weak References**: Use WeakMap for component subscriptions where possible
- **Event Cleanup**: Automatic cleanup of orphaned subscriptions
- **Lazy Loading**: Load settings only when needed
- **Debouncing**: Batch rapid setting changes to reduce event noise

### Storage Optimization

- **Compression**: Compress large settings objects before storage
- **Selective Persistence**: Only persist changed values
- **Background Saving**: Use requestIdleCallback for non-critical saves
- **Cache Management**: Implement intelligent cache invalidation

### Event System Performance

- **Event Batching**: Batch multiple changes into single notifications
- **Selective Notifications**: Only notify relevant subscribers
- **Async Processing**: Use async callbacks to prevent blocking
- **Priority Queuing**: Prioritize critical setting changes

## Security Considerations

### Data Validation

- **Input Sanitization**: Sanitize all setting values before storage
- **Type Safety**: Strict TypeScript typing for all settings
- **Range Checking**: Validate numeric ranges to prevent exploits
- **Schema Validation**: Validate entire settings object structure

### Storage Security

- **Data Integrity**: Use checksums to detect tampering
- **Sensitive Data**: Avoid storing sensitive information in settings
- **Cross-Origin**: Ensure settings are isolated per origin
- **Backup Strategy**: Implement settings backup for recovery
