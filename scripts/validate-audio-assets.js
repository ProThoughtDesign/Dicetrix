#!/usr/bin/env node

/**
 * Audio Asset Validation Script
 * 
 * This script validates that all required audio assets are present and properly formatted
 * for the Dicetrix comprehensive music system.
 * 
 * Usage:
 *   node scripts/validate-audio-assets.js
 *   npm run validate-audio
 */

import fs from 'fs';
import path from 'path';

// Audio asset definitions (matches AudioAssetManager.ts)
const REQUIRED_MUSIC_FILES = [
  { key: 'menu-music', filename: 'menu-theme', category: 'music', required: true },
  { key: 'easy-music', filename: 'easy-mode', category: 'music', required: true },
  { key: 'medium-music', filename: 'medium-mode', category: 'music', required: true },
  { key: 'hard-music', filename: 'hard-mode', category: 'music', required: true },
  { key: 'expert-music', filename: 'expert-mode', category: 'music', required: true },
  { key: 'zen-music', filename: 'zen-mode', category: 'music', required: true }
];

const REQUIRED_SOUND_FILES = [
  // Gameplay sounds
  { key: 'piece-placement', filename: 'piece-placement', category: 'sound', required: true },
  { key: 'piece-rotation', filename: 'piece-rotation', category: 'sound', required: true },
  { key: 'piece-drop', filename: 'piece-drop', category: 'sound', required: true },
  { key: 'piece-hold', filename: 'piece-hold', category: 'sound', required: true },
  
  // Line clear sounds
  { key: 'line-clear-single', filename: 'line-clear-single', category: 'sound', required: true },
  { key: 'line-clear-double', filename: 'line-clear-double', category: 'sound', required: true },
  { key: 'line-clear-triple', filename: 'line-clear-triple', category: 'sound', required: true },
  { key: 'line-clear-tetris', filename: 'line-clear-tetris', category: 'sound', required: true },
  
  // Game state sounds
  { key: 'level-up', filename: 'level-up', category: 'sound', required: true },
  { key: 'game-over', filename: 'game-over', category: 'sound', required: true },
  { key: 'pause', filename: 'pause', category: 'sound', required: true },
  { key: 'resume', filename: 'resume', category: 'sound', required: true },
  
  // UI interaction sounds
  { key: 'button-click', filename: 'button-click', category: 'sound', required: true },
  { key: 'menu-navigate', filename: 'menu-navigate', category: 'sound', required: true },
  { key: 'settings-change', filename: 'settings-change', category: 'sound', required: true },
  { key: 'mode-select', filename: 'mode-select', category: 'sound', required: true },
  
  // Special effect sounds
  { key: 'combo-2x', filename: 'combo-2x', category: 'sound', required: true },
  { key: 'combo-3x', filename: 'combo-3x', category: 'sound', required: true },
  { key: 'combo-4x', filename: 'combo-4x', category: 'sound', required: true },
  { key: 'perfect-clear', filename: 'perfect-clear', category: 'sound', required: true },
  { key: 'warning-alert', filename: 'warning-alert', category: 'sound', required: true }
];

const SUPPORTED_FORMATS = ['mp3'];
const AUDIO_BASE_PATH = 'src/client/public/assets/audio';

class AudioAssetValidator {
  constructor() {
    this.results = {
      totalAssets: 0,
      foundAssets: 0,
      missingAssets: [],
      invalidNaming: [],
      formatIssues: [],
      sizeWarnings: [],
      errors: []
    };
  }

  /**
   * Main validation method
   */
  validate() {
    console.log('🎵 Audio Asset Validation Starting...\n');
    
    try {
      this.checkDirectoryStructure();
      this.validateMusicFiles();
      this.validateSoundFiles();
      this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check if the required directory structure exists
   */
  checkDirectoryStructure() {
    const requiredDirs = [
      AUDIO_BASE_PATH,
      path.join(AUDIO_BASE_PATH, 'music'),
      path.join(AUDIO_BASE_PATH, 'sound')
    ];

    console.log('📁 Checking directory structure...');
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        console.log(`   ⚠️  Missing directory: ${dir}`);
        console.log(`   💡 Create with: mkdir -p ${dir}`);
      } else {
        console.log(`   ✅ Found: ${dir}`);
      }
    }
    console.log();
  }

  /**
   * Validate music files
   */
  validateMusicFiles() {
    console.log('🎼 Validating music files...');
    
    for (const asset of REQUIRED_MUSIC_FILES) {
      this.validateAsset(asset);
    }
    console.log();
  }

  /**
   * Validate sound effect files
   */
  validateSoundFiles() {
    console.log('🔊 Validating sound effect files...');
    
    for (const asset of REQUIRED_SOUND_FILES) {
      this.validateAsset(asset);
    }
    console.log();
  }

  /**
   * Validate a single asset
   */
  validateAsset(asset) {
    this.results.totalAssets++;
    
    // Map category to actual directory structure
    const categoryDir = asset.category === 'sound' ? 'sfx' : asset.category;
    const assetPath = path.join(AUDIO_BASE_PATH, categoryDir);
    let foundFormats = [];
    let hasValidFormat = false;

    // Check each supported format
    for (const format of SUPPORTED_FORMATS) {
      const filename = `${asset.filename}.${format}`;
      const fullPath = path.join(assetPath, filename);
      
      if (fs.existsSync(fullPath)) {
        foundFormats.push(format);
        hasValidFormat = true;
        
        // Check file size
        const stats = fs.statSync(fullPath);
        this.checkFileSize(asset, format, stats.size);
        
        console.log(`   ✅ ${filename} (${this.formatFileSize(stats.size)})`);
      }
    }

    if (!hasValidFormat) {
      this.results.missingAssets.push({
        key: asset.key,
        filename: asset.filename,
        category: asset.category,
        expectedFormats: SUPPORTED_FORMATS
      });
      console.log(`   ❌ Missing: ${asset.filename}.{${SUPPORTED_FORMATS.join('|')}}`);
    } else {
      this.results.foundAssets++;
      
      // MP3 is the only supported format - no recommendations needed
    }

    // Validate naming convention
    this.validateNaming(asset);
  }

  /**
   * Check file size and warn if outside expected ranges
   */
  checkFileSize(asset, format, size) {
    let expectedMin, expectedMax;
    
    if (asset.category === 'music') {
      // Music files: 5-12MB for MP3
      expectedMin = 5 * 1024 * 1024; // 5MB
      expectedMax = 12 * 1024 * 1024; // 12MB
    } else {
      // Sound effects: 15-150KB for MP3
      expectedMin = 15 * 1024; // 15KB
      expectedMax = 150 * 1024; // 150KB
    }

    if (size < expectedMin) {
      this.results.sizeWarnings.push({
        file: `${asset.filename}.${format}`,
        issue: 'smaller than expected',
        size: size,
        expected: `${this.formatFileSize(expectedMin)}-${this.formatFileSize(expectedMax)}`
      });
    } else if (size > expectedMax) {
      this.results.sizeWarnings.push({
        file: `${asset.filename}.${format}`,
        issue: 'larger than expected',
        size: size,
        expected: `${this.formatFileSize(expectedMin)}-${this.formatFileSize(expectedMax)}`
      });
    }
  }

  /**
   * Validate naming convention
   */
  validateNaming(asset) {
    // Check if filename follows convention (lowercase, hyphens)
    if (!/^[a-z0-9-]+$/.test(asset.filename)) {
      this.results.invalidNaming.push({
        key: asset.key,
        filename: asset.filename,
        issue: 'Should use lowercase letters, numbers, and hyphens only'
      });
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('📊 Validation Report');
    console.log('='.repeat(50));
    
    // Summary
    console.log(`Total Assets: ${this.results.totalAssets}`);
    console.log(`Found Assets: ${this.results.foundAssets}`);
    console.log(`Missing Assets: ${this.results.missingAssets.length}`);
    console.log(`Success Rate: ${Math.round((this.results.foundAssets / this.results.totalAssets) * 100)}%`);
    console.log();

    // Missing assets
    if (this.results.missingAssets.length > 0) {
      console.log('❌ Missing Assets:');
      for (const asset of this.results.missingAssets) {
        console.log(`   • ${asset.filename}.{${asset.expectedFormats.join('|')}} (${asset.category})`);
      }
      console.log();
    }

    // Size warnings
    if (this.results.sizeWarnings.length > 0) {
      console.log('⚠️  Size Warnings:');
      for (const warning of this.results.sizeWarnings) {
        console.log(`   • ${warning.file}: ${this.formatFileSize(warning.size)} (${warning.issue})`);
        console.log(`     Expected: ${warning.expected}`);
      }
      console.log();
    }

    // Naming issues
    if (this.results.invalidNaming.length > 0) {
      console.log('⚠️  Naming Issues:');
      for (const issue of this.results.invalidNaming) {
        console.log(`   • ${issue.filename}: ${issue.issue}`);
      }
      console.log();
    }

    // Recommendations
    this.generateRecommendations();

    // Final status
    if (this.results.missingAssets.length === 0) {
      console.log('🎉 All required audio assets are present!');
    } else {
      console.log(`⚠️  ${this.results.missingAssets.length} assets need to be added.`);
    }

    // Exit code
    process.exit(this.results.missingAssets.length > 0 ? 1 : 0);
  }

  /**
   * Generate recommendations for developers
   */
  generateRecommendations() {
    console.log('💡 Recommendations:');
    
    if (this.results.missingAssets.length > 0) {
      console.log('   • Create missing audio files or use placeholder files for development');
      console.log('   • Refer to AUDIO_ASSETS_DOCUMENTATION.md for detailed specifications');
    }
    
    console.log('   • Use MP3 format for universal compatibility');
    console.log('   • Keep music files between 5-10 minutes for optimal looping');
    console.log('   • Keep sound effects short (0.05-3 seconds) for responsive feedback');
    console.log('   • Test audio in multiple browsers to ensure compatibility');
    console.log();
  }

  /**
   * Generate a checklist file for manual verification
   */
  generateChecklist() {
    const checklistPath = 'AUDIO_ASSET_CHECKLIST.md';
    let content = '# Audio Asset Checklist\n\n';
    content += `Generated: ${new Date().toISOString()}\n\n`;
    
    content += '## Music Files\n\n';
    for (const asset of REQUIRED_MUSIC_FILES) {
      const categoryDir = asset.category === 'sound' ? 'sfx' : asset.category;
      const mp3Exists = fs.existsSync(path.join(AUDIO_BASE_PATH, categoryDir, `${asset.filename}.mp3`));
      
      content += `- [${mp3Exists ? 'x' : ' '}] ${asset.filename}.mp3\n`;
    }
    
    content += '\n## Sound Effect Files\n\n';
    for (const asset of REQUIRED_SOUND_FILES) {
      const categoryDir = asset.category === 'sound' ? 'sfx' : asset.category;
      const mp3Exists = fs.existsSync(path.join(AUDIO_BASE_PATH, categoryDir, `${asset.filename}.mp3`));
      
      content += `- [${mp3Exists ? 'x' : ' '}] ${asset.filename}.mp3\n`;
    }
    
    fs.writeFileSync(checklistPath, content);
    console.log(`📝 Generated checklist: ${checklistPath}`);
  }
}

// Run validation if this script is executed directly
const validator = new AudioAssetValidator();
validator.validate();
validator.generateChecklist();

export default AudioAssetValidator;
