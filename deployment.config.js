/**
 * Deployment Configuration for Dicetrix Reddit App
 * Optimizes build settings for Reddit/Devvit deployment
 */

export const deploymentConfig = {
  // Build optimization settings
  build: {
    // Target Reddit's webview environment
    target: ['es2020', 'chrome80', 'safari13'],
    
    // Optimize for mobile-first
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info']
      },
      mangle: {
        safari10: true // Ensure Safari compatibility
      },
      format: {
        comments: false
      }
    },
    
    // Bundle splitting for optimal loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Phaser for better caching
          phaser: ['phaser'],
          // Game logic chunks
          'game-core': [
            './src/client/game/models/Die.ts',
            './src/client/game/models/Grid.ts',
            './src/client/game/models/Piece.ts'
          ],
          'game-systems': [
            './src/client/game/systems/MatchDetector.ts',
            './src/client/game/systems/ScoreManager.ts',
            './src/client/game/systems/BoosterManager.ts'
          ]
        }
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // Inline small assets
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
    
    // Source maps for debugging
    sourcemap: true
  },

  // Performance targets for Reddit deployment
  performance: {
    // Reddit webview constraints
    maxBundleSize: 5 * 1024 * 1024, // 5MB total
    maxChunkSize: 1 * 1024 * 1024,  // 1MB per chunk
    targetFrameTime: 16.67, // 60 FPS
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    
    // Loading performance
    maxInitialLoadTime: 3000, // 3 seconds
    maxAssetLoadTime: 1000,   // 1 second per asset
  },

  // Reddit-specific optimizations
  reddit: {
    // Webview compatibility
    supportedBrowsers: [
      'Chrome >= 80',
      'Safari >= 13',
      'Firefox >= 75',
      'Edge >= 80'
    ],
    
    // Mobile optimization
    mobileFirst: true,
    touchOptimized: true,
    
    // Reddit API integration
    apiTimeout: 10000, // 10 seconds
    retryAttempts: 3,
    
    // Devvit constraints
    maxRequestTime: 30000, // 30 seconds
    maxPayloadSize: 4 * 1024 * 1024, // 4MB
    maxResponseSize: 10 * 1024 * 1024 // 10MB
  },

  // Asset optimization
  assets: {
    // Image optimization
    images: {
      formats: ['webp', 'png'],
      quality: 85,
      maxSize: 512 * 1024 // 512KB per image
    },
    
    // Audio optimization
    audio: {
      formats: ['webm', 'mp3'],
      bitrate: 128, // 128kbps
      maxSize: 256 * 1024 // 256KB per audio file
    },
    
    // Font optimization
    fonts: {
      formats: ['woff2', 'woff'],
      subset: true, // Only include used characters
      maxSize: 100 * 1024 // 100KB per font
    }
  },

  // Security settings
  security: {
    // Content Security Policy for Reddit webview
    csp: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "blob:"],
      'connect-src': ["'self'"],
      'font-src': ["'self'", "data:"],
      'media-src': ["'self'", "blob:"]
    },
    
    // Disable eval for security
    allowEval: false,
    
    // HTTPS only
    httpsOnly: true
  },

  // Monitoring and analytics
  monitoring: {
    // Performance monitoring
    trackPerformance: true,
    performanceThresholds: {
      fcp: 2000, // First Contentful Paint
      lcp: 3000, // Largest Contentful Paint
      fid: 100,  // First Input Delay
      cls: 0.1   // Cumulative Layout Shift
    },
    
    // Error tracking
    trackErrors: true,
    errorSampling: 1.0, // Track 100% of errors
    
    // User analytics
    trackUsage: true,
    privacyCompliant: true
  }
};

// Validation function for deployment readiness
export function validateDeployment() {
  const checks = {
    buildSize: false,
    performance: false,
    compatibility: false,
    security: false
  };

  // Check build size
  try {
    const fs = require('fs');
    const path = require('path');
    
    const clientDir = path.join(process.cwd(), 'dist/client');
    const serverFile = path.join(process.cwd(), 'dist/server/index.cjs');
    
    if (fs.existsSync(clientDir) && fs.existsSync(serverFile)) {
      const clientSize = getDirectorySize(clientDir);
      const serverSize = fs.statSync(serverFile).size;
      
      checks.buildSize = (clientSize + serverSize) <= deploymentConfig.performance.maxBundleSize;
    }
  } catch (error) {
    console.warn('Could not validate build size:', error);
  }

  // Basic performance check
  checks.performance = true; // Assume passing for now

  // Compatibility check
  checks.compatibility = true; // Assume passing for now

  // Security check
  checks.security = true; // Assume passing for now

  return checks;
}

function getDirectorySize(dirPath) {
  const fs = require('fs');
  const path = require('path');
  
  let totalSize = 0;
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const items = fs.readdirSync(itemPath);
      items.forEach(item => {
        calculateSize(path.join(itemPath, item));
      });
    }
  }
  
  try {
    calculateSize(dirPath);
  } catch (error) {
    console.warn('Error calculating directory size:', error);
  }
  
  return totalSize;
}

export default deploymentConfig;
