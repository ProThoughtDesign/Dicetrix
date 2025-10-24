# Audio File Naming Conventions

## Overview

This document defines the naming conventions for all audio assets in the Dicetrix comprehensive music system. Consistent naming ensures proper asset loading, easy maintenance, and clear organization.

## General Rules

### 1. Case Sensitivity
- **Use lowercase only**: All filenames must use lowercase letters
- **No uppercase letters**: Avoid `PiecePlacement.mp3`, use `piece-placement.mp3`

### 2. Word Separation
- **Use hyphens (-)**: Separate words with hyphens, not spaces or underscores
- **No spaces**: Avoid `piece placement.mp3`, use `piece-placement.mp3`
- **No underscores**: Avoid `piece_placement.mp3`, use `piece-placement.mp3`

### 3. Descriptive Names
- **Clear purpose**: Names should clearly indicate the sound's function
- **Avoid abbreviations**: Use `piece-placement` not `pp` or `place`
- **Be specific**: Use `line-clear-single` not just `line-clear`

### 4. Consistent Patterns
- **Follow established patterns**: Use similar naming for related sounds
- **Maintain hierarchy**: Group related sounds with common prefixes

## Category-Specific Patterns

### Music Files
**Pattern**: `{context}-{mode}.{extension}`

| Context | Mode | Example |
|---------|------|---------|
| menu | theme | `menu-theme.mp3` |
| gameplay | easy | `easy-mode.mp3` |
| gameplay | medium | `medium-mode.mp3` |
| gameplay | hard | `hard-mode.mp3` |
| gameplay | expert | `expert-mode.mp3` |
| gameplay | zen | `zen-mode.mp3` |

### Gameplay Sound Effects
**Pattern**: `{action}-{detail}.{extension}`

| Action | Detail | Example |
|--------|--------|---------|
| piece | placement | `piece-placement.mp3` |
| piece | rotation | `piece-rotation.mp3` |
| piece | drop | `piece-drop.mp3` |
| piece | hold | `piece-hold.mp3` |
| line-clear | single | `line-clear-single.mp3` |
| line-clear | double | `line-clear-double.mp3` |
| line-clear | triple | `line-clear-triple.mp3` |
| line-clear | tetris | `line-clear-tetris.mp3` |
| level | up | `level-up.mp3` |
| game | over | `game-over.mp3` |

### UI Interaction Sounds
**Pattern**: `{interface}-{action}.{extension}`

| Interface | Action | Example |
|-----------|--------|---------|
| button | click | `button-click.mp3` |
| menu | navigate | `menu-navigate.mp3` |
| settings | change | `settings-change.mp3` |
| mode | select | `mode-select.mp3` |

### Special Effect Sounds
**Pattern**: `{effect}-{level}.{extension}`

| Effect | Level | Example |
|--------|-------|---------|
| combo | 2x | `combo-2x.mp3` |
| combo | 3x | `combo-3x.mp3` |
| combo | 4x | `combo-4x.mp3` |
| perfect | clear | `perfect-clear.mp3` |
| warning | alert | `warning-alert.mp3` |

## File Extensions

### Primary Format: MP3
- **Extension**: `.mp3`
- **Usage**: Universal format for all audio files
- **Example**: `piece-placement.mp3`
- **Extension**: `.mp3`
- **Usage**: Fallback format for broader browser support
- **Example**: `piece-placement.mp3`

## Directory Structure Integration

```
assets/audio/
├── music/
│   ├── menu-theme.mp3
│   ├── menu-theme.mp3
│   ├── easy-mode.mp3
│   ├── easy-mode.mp3
│   └── ...
└── sound/
    ├── piece-placement.mp3
    ├── piece-placement.mp3
    ├── button-click.mp3
    ├── button-click.mp3
    └── ...
```

## Validation Rules

### Automated Checks
The naming convention is enforced through automated validation:

```javascript
// Valid naming pattern
const validPattern = /^[a-z0-9-]+\.(ogg|mp3)$/;

// Examples
validPattern.test('piece-placement.mp3'); // ✅ true
validPattern.test('PiecePlacement.mp3');  // ❌ false (uppercase)
validPattern.test('piece_placement.mp3'); // ❌ false (underscore)
validPattern.test('piece placement.mp3'); // ❌ false (space)
```

### Manual Review Checklist
- [ ] All lowercase letters
- [ ] Hyphens for word separation
- [ ] No spaces or underscores
- [ ] Descriptive and clear purpose
- [ ] Follows category pattern
- [ ] Consistent with related files

## Examples

### ✅ Correct Examples
```
menu-theme.mp3
easy-mode.mp3
piece-placement.mp3
line-clear-single.mp3
button-click.mp3
combo-2x.mp3
perfect-clear.mp3
warning-alert.mp3
```

### ❌ Incorrect Examples
```
MenuTheme.mp3          → menu-theme.mp3 (lowercase)
piece_placement.mp3    → piece-placement.mp3 (hyphens)
piece placement.mp3    → piece-placement.mp3 (no spaces)
pp.mp3                 → piece-placement.mp3 (descriptive)
lineclear1.mp3         → line-clear-single.mp3 (clear pattern)
btn-click.mp3          → button-click.mp3 (no abbreviations)
```

## Key Mapping

The audio system maps filenames to internal keys:

| Filename | Internal Key | Usage |
|----------|--------------|-------|
| `piece-placement.mp3` | `piece-placement` | `soundLibrary.playPiecePlacement()` |
| `line-clear-single.mp3` | `line-clear-single` | `soundLibrary.playLineClear(1)` |
| `button-click.mp3` | `button-click` | `soundLibrary.playButtonClick()` |
| `menu-theme.mp3` | `menu-music` | `strudelMusic.createMenuTheme()` |

## Development Tools

### Validation Script
Use the provided validation script to check naming conventions:

```bash
node scripts/validate-audio-assets.js
```

### Naming Helper Function
```javascript
function validateAudioFileName(filename) {
  const pattern = /^[a-z0-9-]+\.(ogg|mp3)$/;
  const issues = [];
  
  if (!pattern.test(filename)) {
    if (/[A-Z]/.test(filename)) {
      issues.push('Contains uppercase letters');
    }
    if (/_/.test(filename)) {
      issues.push('Contains underscores (use hyphens)');
    }
    if (/ /.test(filename)) {
      issues.push('Contains spaces (use hyphens)');
    }
    if (!/\.(ogg|mp3)$/.test(filename)) {
      issues.push('Invalid file extension (use .mp3 or .mp3)');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  };
}
```

## Migration Guide

### Renaming Existing Files
If you have existing audio files that don't follow the convention:

1. **Backup original files**
2. **Rename following the patterns above**
3. **Update any hardcoded references**
4. **Run validation script to verify**

### Batch Renaming Script
```bash
# Example bash script for renaming
for file in *.mp3; do
  # Convert to lowercase and replace underscores/spaces with hyphens
  newname=$(echo "$file" | tr '[:upper:]' '[:lower:]' | sed 's/[_ ]/-/g')
  if [ "$file" != "$newname" ]; then
    mv "$file" "$newname"
    echo "Renamed: $file → $newname"
  fi
done
```

## Best Practices

### 1. Plan Before Creating
- Review existing files for patterns
- Choose names that will scale with future additions
- Consider how the name will appear in code

### 2. Be Consistent
- Use the same pattern for similar sounds
- Maintain consistent detail levels
- Follow established prefixes and suffixes

### 3. Think Long-term
- Choose names that won't need changing
- Avoid version numbers in filenames
- Use descriptive names that new team members will understand

### 4. Document Exceptions
- If you must deviate from patterns, document why
- Update this guide with new patterns
- Ensure team consensus on changes

---

**Note**: This naming convention is enforced by the AudioAssetManager and validation tools. Following these guidelines ensures proper asset loading and maintainable code.
