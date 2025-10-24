# Audio System Quick Reference

## 🎵 Essential Commands

```bash
# Validate all audio assets
npm run validate-audio

# Check audio system status (in browser console)
console.log(audioAssetManager.getDebugInfo());

# Get missing files list
console.log(audioAssetManager.getValidationTools().checkRequiredFiles());
```

## 📁 Required Directory Structure

```
assets/audio/
├── music/          # 6 files (OGG + MP3 each)
└── sound/          # 19 files (OGG + MP3 each)
```

## 🎼 Music Files (6 required)

| File | Purpose | Duration |
|------|---------|----------|
| `menu-theme.ogg/.mp3` | Main menu background | 5-10 min |
| `easy-mode.ogg/.mp3` | Easy gameplay music | 5-10 min |
| `medium-mode.ogg/.mp3` | Medium gameplay music | 5-10 min |
| `hard-mode.ogg/.mp3` | Hard gameplay music | 5-10 min |
| `expert-mode.ogg/.mp3` | Expert gameplay music | 5-10 min |
| `zen-mode.ogg/.mp3` | Zen mode music | 5-10 min |

## 🔊 Sound Effects (19 required)

### Gameplay (12 files)
- `piece-placement.ogg/.mp3` - Piece placed
- `piece-rotation.ogg/.mp3` - Piece rotated  
- `piece-drop.ogg/.mp3` - Piece dropped
- `piece-hold.ogg/.mp3` - Piece held/swapped
- `line-clear-single.ogg/.mp3` - 1 line cleared
- `line-clear-double.ogg/.mp3` - 2 lines cleared
- `line-clear-triple.ogg/.mp3` - 3 lines cleared
- `line-clear-tetris.ogg/.mp3` - 4 lines cleared
- `level-up.ogg/.mp3` - Level increased
- `game-over.ogg/.mp3` - Game ended
- `pause.ogg/.mp3` - Game paused
- `resume.ogg/.mp3` - Game resumed

### UI Interaction (4 files)
- `button-click.ogg/.mp3` - Button pressed
- `menu-navigate.ogg/.mp3` - Menu navigation
- `settings-change.ogg/.mp3` - Setting modified
- `mode-select.ogg/.mp3` - Mode selected

### Special Effects (5 files)
- `combo-2x.ogg/.mp3` - 2x combo achieved
- `combo-3x.ogg/.mp3` - 3x combo achieved
- `combo-4x.ogg/.mp3` - 4x+ combo achieved
- `perfect-clear.ogg/.mp3` - Board cleared perfectly
- `warning-alert.ogg/.mp3` - Danger/warning

## ⚙️ Format Specifications

| Format | Usage | Sample Rate | Bit Rate | Channels |
|--------|-------|-------------|----------|----------|
| **MP3** | Universal | 44.1 kHz | 128-192 kbps | Stereo |

## 📏 File Size Guidelines

| Category | MP3 Size |
|----------|----------|
| **Music** | 5-12 MB |
| **Sound Effects** | 15-150 KB |

## 🔧 Development Features

### ✅ Works Without Audio Files
- Game functions fully without any audio files
- Silent placeholders prevent errors
- Clear console messages show missing files

### 🔍 Built-in Validation
- Automatic format detection
- Browser compatibility checking
- Memory usage optimization
- Error recovery and fallbacks

### 📊 Debug Information
```javascript
// Get system status
audioAssetManager.getDebugInfo()
// → "AudioAssetManager: 25/25 loaded, 0 failed | Formats: ogg, mp3 | Streaming: ON | Progress: 100%"

// Check specific asset
audioAssetManager.isAssetLoaded('piece-placement')
// → true/false

// Get memory usage
audioAssetManager.getAssetLifecycleManager().getMemoryUsage()
// → { totalSize: 52428800, activeAssets: 25, cachedAssets: 25 }
```

## 🚀 Quick Setup

1. **Create directories**:
   ```bash
   mkdir -p assets/audio/music assets/audio/sound
   ```

2. **Validate structure**:
   ```bash
   npm run validate-audio
   ```

3. **Add audio files** (optional for development)

4. **Test in game** - should work with or without files

## 📋 Naming Rules

- ✅ `piece-placement.ogg` (lowercase, hyphens)
- ❌ `PiecePlacement.ogg` (uppercase)
- ❌ `piece_placement.ogg` (underscores)
- ❌ `piece placement.ogg` (spaces)

## 🔗 Documentation Links

- **Full Specifications**: `AUDIO_ASSETS_DOCUMENTATION.md`
- **Naming Conventions**: `AUDIO_NAMING_CONVENTIONS.md`
- **Validation Script**: `scripts/validate-audio-assets.js`

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Audio not playing | Check browser console for errors, verify file paths |
| Files not loading | Run `npm run validate-audio`, check file names |
| Performance issues | Check file sizes, enable streaming for large files |
| Format not supported | Ensure both OGG and MP3 versions exist |

## 💡 Pro Tips

- **Development**: Game works perfectly without any audio files
- **Testing**: Use browser dev tools to monitor audio loading
- **Performance**: OGG files are smaller and load faster
- **Compatibility**: MP3 ensures Safari/iOS support
- **Memory**: Large music files are automatically streamed
