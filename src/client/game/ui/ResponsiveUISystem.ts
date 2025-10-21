import { DisplayModeDetector } from './DisplayModeDetector.js';
import { LayoutManager } from './LayoutManager.js';
import { ScalingCalculator } from './ScalingCalculator.js';
import { UIZoneManager } from './UIZoneManager.js';

export type DisplayMode = 'mobile' | 'desktop' | 'fullscreen';

export interface Dimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface LayoutConfig {
  displayMode: DisplayMode;
  cellSize: number;
  gridOffset: { x: number; y: number };
  uiZones: UIZoneConfig;
  scalingFactor: number;
  screenDimensions: Dimensions;
}

export interface UIZoneConfig {
  gameGrid: Rectangle;
  scoreArea: Rectangle;
  nextPiece: Rectangle;
  boosterArea?: Rectangle;
  statisticsArea?: Rectangle;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * ResponsiveUISystem - Main coordinator for adaptive UI layouts
 * Manages dynamic scaling and positioning across all display modes
 */
export class ResponsiveUISystem {
  private displayModeDetector: DisplayModeDetector;
  private layoutManager: LayoutManager;
  private scalingCalculator: ScalingCalculator;
  private uiZoneManager: UIZoneManager;
  
  private currentLayout: LayoutConfig | null = null;
  private layoutChangeCallbacks: ((config: LayoutConfig) => void)[] = [];
  private isUpdating: boolean = false;
  private lastUpdateTime: number = 0;
  
  // Performance optimization
  private readonly UPDATE_THROTTLE_MS = 16; // 60fps
  private readonly DEBOUNCE_DELAY_MS = 100;
  private debounceTimer: number | null = null;

  constructor() {
    this.displayModeDetector = new DisplayModeDetector();
    this.scalingCalculator = new ScalingCalculator();
    this.uiZoneManager = new UIZoneManager();
    this.layoutManager = new LayoutManager(this.scalingCalculator, this.uiZoneManager);
    
    this.setupEventListeners();
  }

  /**
   * Initialize the responsive system with current screen dimensions
   */
  public initialize(width: number, height: number): LayoutConfig {
    console.log(`ResponsiveUISystem initializing with dimensions: ${width}x${height}`);
    
    const layout = this.calculateLayout(width, height);
    this.currentLayout = layout;
    
    console.log(`Initialized with ${layout.displayMode} mode, ${layout.cellSize}px cells`);
    return layout;
  }

  /**
   * Get the current layout configuration
   */
  public getCurrentLayout(): LayoutConfig | null {
    return this.currentLayout;
  }

  /**
   * Register callback for layout changes
   */
  public onLayoutChange(callback: (config: LayoutConfig) => void): void {
    this.layoutChangeCallbacks.push(callback);
  }

  /**
   * Remove layout change callback
   */
  public removeLayoutChangeCallback(callback: (config: LayoutConfig) => void): void {
    const index = this.layoutChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.layoutChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Force a layout update with new dimensions
   */
  public updateLayout(width: number, height: number): LayoutConfig {
    if (this.isUpdating) {
      console.log('Layout update already in progress, skipping');
      return this.currentLayout!;
    }

    const now = Date.now();
    if (now - this.lastUpdateTime < this.UPDATE_THROTTLE_MS) {
      console.log('Layout update throttled');
      return this.currentLayout!;
    }

    this.isUpdating = true;
    this.lastUpdateTime = now;

    try {
      const newLayout = this.calculateLayout(width, height);
      const layoutChanged = this.hasLayoutChanged(this.currentLayout, newLayout);

      if (layoutChanged) {
        console.log(`Layout changing from ${this.currentLayout?.displayMode} to ${newLayout.displayMode}`);
        this.currentLayout = newLayout;
        this.notifyLayoutChange(newLayout);
      }

      return newLayout;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Calculate layout configuration for given dimensions
   */
  private calculateLayout(width: number, height: number): LayoutConfig {
    const dimensions: Dimensions = {
      width,
      height,
      aspectRatio: width / height
    };

    const displayMode = this.displayModeDetector.detectDisplayMode(width, height);
    const cellSize = this.scalingCalculator.calculateCellSize(dimensions, displayMode);
    const uiZones = this.uiZoneManager.allocateZones(dimensions, displayMode);
    const gridOffset = this.layoutManager.calculateGridOffset(dimensions, displayMode, cellSize);
    const scalingFactor = this.scalingCalculator.calculateScalingFactor(displayMode, cellSize);

    return {
      displayMode,
      cellSize,
      gridOffset,
      uiZones,
      scalingFactor,
      screenDimensions: dimensions
    };
  }

  /**
   * Check if layout has meaningfully changed
   */
  private hasLayoutChanged(oldLayout: LayoutConfig | null, newLayout: LayoutConfig): boolean {
    if (!oldLayout) return true;
    
    return (
      oldLayout.displayMode !== newLayout.displayMode ||
      oldLayout.cellSize !== newLayout.cellSize ||
      Math.abs(oldLayout.gridOffset.x - newLayout.gridOffset.x) > 1 ||
      Math.abs(oldLayout.gridOffset.y - newLayout.gridOffset.y) > 1
    );
  }

  /**
   * Notify all registered callbacks of layout change
   */
  private notifyLayoutChange(config: LayoutConfig): void {
    this.layoutChangeCallbacks.forEach(callback => {
      try {
        callback(config);
      } catch (error) {
        console.error('Error in layout change callback:', error);
      }
    });
  }

  /**
   * Setup event listeners for screen changes
   */
  private setupEventListeners(): void {
    // Listen for window resize events with debouncing
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.debouncedLayoutUpdate();
      });

      // Listen for orientation changes on mobile
      window.addEventListener('orientationchange', () => {
        // Delay to allow orientation change to complete
        setTimeout(() => {
          this.debouncedLayoutUpdate();
        }, 200);
      });
    }
  }

  /**
   * Debounced layout update to prevent excessive updates
   */
  private debouncedLayoutUpdate(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      if (typeof window !== 'undefined') {
        this.updateLayout(window.innerWidth, window.innerHeight);
      }
      this.debounceTimer = null;
    }, this.DEBOUNCE_DELAY_MS);
  }

  /**
   * Get display mode for current layout
   */
  public getCurrentDisplayMode(): DisplayMode | null {
    return this.currentLayout?.displayMode || null;
  }

  /**
   * Get current cell size
   */
  public getCurrentCellSize(): number {
    return this.currentLayout?.cellSize || 32;
  }

  /**
   * Get current grid offset
   */
  public getCurrentGridOffset(): { x: number; y: number } {
    return this.currentLayout?.gridOffset || { x: 0, y: 0 };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    this.layoutChangeCallbacks = [];
    this.currentLayout = null;
  }
}
