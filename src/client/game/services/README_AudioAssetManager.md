# AudioAssetManager Usage Guide

The AudioAssetManager provides comprehensive audio file management, preloading, validation, and optimization for the Dicetrix game's audio system.

## Basic Usage

```typescript
import { AudioAssetManager } from './AudioAssetManager';

// Get the AudioAssetManager from HybridAudioService
const audioService = hybridAudioService;
const assetManager = audioService.getAudioAssetManager();

if (assetManager) {
  // Preload all audio assets
  const progress = await assetManager.preloadAudioAssets(scene);
  console.log(`Loaded ${progress.loadedAssets}/${progress.totalAssets} assets`);
  
  // Validate assets
  const validation = assetManager.validateAudioAssets();
  if (!validation.isValid) {
    console.log('Missing files:', validation.missingFiles);
  }
}
```

## Asset Lifecycle Management

```typescript
// Get lifecycle manager for memory optimization
const lifecycleManager = assetManager.getAssetLifecycleManager();

// Check memory usage
const usage = lifecycleManager.getMemoryUsage();
console.log(`Memory usage: ${usage.totalSize / 1024 / 1024}MB`);

// Optimize memory usage
lifecycleManager.optimizeMemoryUsage();

// Schedule cleanup for unused assets
lifecycleManager.scheduleAssetCleanup('unused-sound', 30000); // 30 seconds
```

## Audio Streaming for Large Files

```typescript
// Get streaming manager for large music files
const streamingManager = assetManager.getAudioStreamingManager();

// Create stream for large music file
const stream = await streamingManager.createStream('zen-music');
console.log(`Created stream ${stream.id} for ${stream.key}`);

// Optimize stream buffers
streamingManager.optimizeStreamBuffers();

// Cleanup when done
streamingManager.destroyStream(stream);
```

## Placeholder File Management

```typescript
// Generate comprehensive documentation for all required audio files
const documentation = assetManager.generatePlaceholderDocumentation();
console.log(documentation); // Full markdown documentation

// Get list of placeholder files with specifications
const placeholderFiles = assetManager.getPlaceholderSoundList();
placeholderFiles.forEach(file => {
  console.log(`${file.filename}: ${file.description} (${file.duration})`);
});

// Handle missing assets gracefully during development
const validation = assetManager.validateAudioAssets();
if (validation.missingFiles.length > 0) {
  assetManager.handleMissingAssets(validation.missingFiles);
}
```

## Validation Tools

```typescript
// Get validation tools
const tools = assetManager.getValidationTools();

// Check for missing required files
const missingRequired = tools.checkRequiredFiles();
if (missingRequired.length > 0) {
  console.log('Missing required files:', missingRequired);
}

// Generate file checklist
const checklist = tools.generateFileChecklist();
console.log(checklist); // Markdown checklist with status

// Validate file naming conventions
const namingValidation = tools.validateFileNaming();
if (!namingValidation.valid) {
  console.log('Naming issues:', namingValidation.issues);
}

// Generate comprehensive asset report
const report = tools.generateAssetReport();
console.log(report); // Full status report
```

## Format Detection and Fallback

```typescript
// Get supported audio formats
const supportedFormats = assetManager.getSupportedFormats();
console.log('Supported formats:', supportedFormats);

// The system automatically selects the best format based on:
// - Browser compatibility
// - Network conditions
// - Performance characteristics
// - File size considerations
```

## Integration with Game Scenes

```typescript
// In your Phaser scene's preload method
class GameScene extends Phaser.Scene {
  async preload() {
    const audioService = hybridAudioService;
    const assetManager = audioService.getAudioAssetManager();
    
    if (assetManager) {
      // Preload all audio assets with progress tracking
      const progress = await assetManager.preloadAudioAssets(this);
      
      // Update loading screen
      this.updateLoadingProgress(progress.percentage);
      
      // Handle any missing files gracefully
      if (progress.failedAssets > 0) {
        console.log(`${progress.failedAssets} assets failed to load - continuing with fallbacks`);
      }
    }
  }
}
```

## Development Workflow

1. **Setup**: The AudioAssetManager automatically registers all required audio files
2. **Development**: Missing files are handled gracefully with silent fallbacks
3. **Validation**: Use validation tools to check which files are missing
4. **Documentation**: Generate placeholder documentation to see file specifications
5. **Implementation**: Add actual audio files following the specifications
6. **Optimization**: The system automatically optimizes memory usage and streaming

## File Organization

The AudioAssetManager expects files to be organized as follows:

```
assets/audio/
├── music/          # Background music files (5-10 minutes, looping)
│   ├── menu-theme.ogg
│   ├── easy-mode.ogg
│   ├── medium-mode.ogg
│   ├── hard-mode.ogg
│   ├── expert-mode.ogg
│   └── zen-mode.ogg
└── sound/          # Sound effect files (0.1-3 seconds)
    ├── piece-placement.ogg
    ├── piece-rotation.ogg
    ├── line-clear-single.ogg
    ├── button-click.ogg
    └── ... (see full list in documentation)
```

## Error Handling

The AudioAssetManager provides comprehensive error handling:

- **Missing files**: Silent fallbacks during development
- **Format incompatibility**: Automatic format selection and fallback
- **Memory constraints**: Automatic cleanup and optimization
- **Network issues**: Graceful degradation and retry logic
- **Loading timeouts**: Skip problematic assets and continue

All errors are logged with detailed context for debugging while maintaining game functionality.
