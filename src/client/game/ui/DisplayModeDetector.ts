import { DisplayMode } from './ResponsiveUISystem.js';

export interface DisplayModeConfig {
  mobile: { maxDimension: number };
  desktop: { maxDimension: number };
  fullscreen: { minDimension: number };
}

/**
 * DisplayModeDetector - Classifies screen sizes into display modes
 * Determines whether the current screen should use mobile, desktop, or fullscreen layout
 */
export class DisplayModeDetector {
  private readonly config: DisplayModeConfig = {
    mobile: { maxDimension: 1080 },
    desktop: { maxDimension: 1600 },
    fullscreen: { minDimension: 1601 },
  };

  private currentMode: DisplayMode | null = null;
  private modeChangeCallbacks: ((mode: DisplayMode) => void)[] = [];

  /**
   * Detect display mode based on screen dimensions
   */
  public detectDisplayMode(width: number, height: number): DisplayMode {
    let newMode: DisplayMode;

    // Mobile: 1080px or below in either dimension
    if (width <= this.config.mobile.maxDimension || height <= this.config.mobile.maxDimension) {
      newMode = 'mobile';
    }
    // Fullscreen: above 1600px in either dimension
    else if (
      width > this.config.fullscreen.minDimension ||
      height > this.config.fullscreen.minDimension
    ) {
      newMode = 'fullscreen';
    }
    // Desktop: between 1081-1600px in both dimensions
    else {
      newMode = 'desktop';
    }

    // Notify if mode changed
    if (this.currentMode !== newMode) {
      const previousMode = this.currentMode;
      this.currentMode = newMode;

      console.log(`Display mode changed: ${previousMode} -> ${newMode} (${width}x${height})`);
      this.notifyModeChange(newMode);
    }

    return newMode;
  }

  /**
   * Get the current display mode
   */
  public getCurrentMode(): DisplayMode | null {
    return this.currentMode;
  }

  /**
   * Register callback for display mode changes
   */
  public onDisplayModeChange(callback: (mode: DisplayMode) => void): void {
    this.modeChangeCallbacks.push(callback);
  }

  /**
   * Remove display mode change callback
   */
  public removeDisplayModeChangeCallback(callback: (mode: DisplayMode) => void): void {
    const index = this.modeChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.modeChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Check if current screen dimensions indicate mobile device
   */
  public isMobileDevice(): boolean {
    // Check user agent for mobile indicators
    if (typeof navigator === 'undefined') return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'mobile',
      'android',
      'iphone',
      'ipad',
      'ipod',
      'blackberry',
      'windows phone',
      'webos',
    ];

    const isMobileUA = mobileKeywords.some((keyword) => userAgent.includes(keyword));

    // Check for touch support
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check screen size (mobile-like dimensions)
    const screenWidth = window.screen?.width || 0;
    const screenHeight = window.screen?.height || 0;
    const isMobileScreen = Math.min(screenWidth, screenHeight) <= this.config.mobile.maxDimension;

    return isMobileUA || (hasTouch && isMobileScreen);
  }

  /**
   * Get display mode configuration
   */
  public getConfig(): DisplayModeConfig {
    return { ...this.config };
  }

  /**
   * Update display mode configuration (for testing or customization)
   */
  public updateConfig(newConfig: Partial<DisplayModeConfig>): void {
    Object.assign(this.config, newConfig);
    console.log('Display mode configuration updated:', this.config);
  }

  /**
   * Get breakpoint information for current dimensions
   */
  public getBreakpointInfo(
    width: number,
    height: number
  ): {
    mode: DisplayMode;
    isNearBreakpoint: boolean;
    distanceToNextBreakpoint: number;
  } {
    const mode = this.detectDisplayMode(width, height);
    const maxDimension = Math.max(width, height);

    let distanceToNextBreakpoint: number;
    let isNearBreakpoint: boolean;

    switch (mode) {
      case 'mobile':
        distanceToNextBreakpoint = this.config.desktop.maxDimension - maxDimension;
        break;
      case 'desktop':
        distanceToNextBreakpoint = this.config.fullscreen.minDimension - maxDimension;
        break;
      case 'fullscreen':
        distanceToNextBreakpoint = Infinity;
        break;
    }

    // Consider "near" if within 100px of a breakpoint
    isNearBreakpoint = distanceToNextBreakpoint < 100 && distanceToNextBreakpoint > 0;

    return {
      mode,
      isNearBreakpoint,
      distanceToNextBreakpoint,
    };
  }

  /**
   * Notify registered callbacks of mode change
   */
  private notifyModeChange(mode: DisplayMode): void {
    this.modeChangeCallbacks.forEach((callback) => {
      try {
        callback(mode);
      } catch (error) {
        console.error('Error in display mode change callback:', error);
      }
    });
  }

  /**
   * Get recommended settings for current mode
   */
  public getRecommendedSettings(mode: DisplayMode): {
    cellSize: number;
    fontSize: { min: number; base: number; max: number };
    spacing: { base: number; grid: number };
    touchTarget: number;
  } {
    switch (mode) {
      case 'mobile':
        return {
          cellSize: 24,
          fontSize: { min: 16, base: 18, max: 32 },
          spacing: { base: 8, grid: 10 },
          touchTarget: 44,
        };

      case 'desktop':
        return {
          cellSize: 32,
          fontSize: { min: 20, base: 22, max: 40 },
          spacing: { base: 12, grid: 20 },
          touchTarget: 32,
        };

      case 'fullscreen':
        return {
          cellSize: 64, // Will be calculated dynamically
          fontSize: { min: 24, base: 28, max: 48 },
          spacing: { base: 16, grid: 30 },
          touchTarget: 40,
        };
    }
  }
}
