# Responsive UI System Design

## Overview

The Responsive UI System is a comprehensive layout management solution that ensures Dicetrix provides optimal user experience across all device types and screen sizes. The system dynamically calculates layouts, scales elements, and adapts interfaces based on real-time screen dimensions and device capabilities.

## Architecture

### Core Components

```
ResponsiveUISystem
├── DisplayModeDetector
├── LayoutManager
├── ScalingCalculator
├── UIZoneManager
├── AdaptiveTypography
└── PerformanceOptimizer
```

### Component Responsibilities

- **DisplayModeDetector**: Monitors screen dimensions and classifies display modes
- **LayoutManager**: Calculates and applies responsive layouts
- **ScalingCalculator**: Determines scaling factors for all UI elements
- **UIZoneManager**: Manages screen real estate allocation
- **AdaptiveTypography**: Handles dynamic text sizing and readability
- **PerformanceOptimizer**: Ensures efficient layout updates and rendering

## Components and Interfaces

### DisplayModeDetector

```typescript
interface DisplayModeDetector {
  detectDisplayMode(width: number, height: number): DisplayMode;
  onDisplayModeChange(callback: (mode: DisplayMode) => void): void;
  getCurrentMode(): DisplayMode;
}

type DisplayMode = 'mobile' | 'desktop' | 'fullscreen';

interface DisplayModeConfig {
  mobile: { maxDimension: 1080, cellSize: 24 };
  desktop: { maxDimension: 1600, cellSize: 32 };
  fullscreen: { minDimension: 1601, cellSizeRange: [32, 128] };
}
```

### LayoutManager

```typescript
interface LayoutManager {
  calculateLayout(screenWidth: number, screenHeight: number, mode: DisplayMode): LayoutConfig;
  applyLayout(config: LayoutConfig): void;
  updateExistingElements(config: LayoutConfig): void;
}

interface LayoutConfig {
  displayMode: DisplayMode;
  cellSize: number;
  gridOffset: { x: number; y: number };
  uiZones: UIZoneConfig;
  scalingFactor: number;
}

interface UIZoneConfig {
  gameGrid: Rectangle;
  scoreArea: Rectangle;
  nextPiece: Rectangle;
  boosterArea?: Rectangle; // Desktop/Fullscreen only
  statisticsArea?: Rectangle; // Desktop/Fullscreen only
}
```

### ScalingCalculator

```typescript
interface ScalingCalculator {
  calculateCellSize(screenDimensions: Dimensions, mode: DisplayMode): number;
  calculateFontSize(baseSize: number, mode: DisplayMode, importance: FontImportance): number;
  calculateSpacing(baseSpacing: number, cellSize: number): number;
  calculateTouchTargetSize(baseSize: number, mode: DisplayMode): number;
}

type FontImportance = 'critical' | 'primary' | 'secondary' | 'tertiary';

interface ScalingRules {
  mobile: { fontMultiplier: 0.75, minFontSize: 16, touchTarget: 44 };
  desktop: { fontMultiplier: 0.65, minFontSize: 20, touchTarget: 32 };
  fullscreen: { fontMultiplier: 0.6, maxFontSize: 48, touchTarget: 40 };
}
```

### UIZoneManager

```typescript
interface UIZoneManager {
  allocateZones(screenDimensions: Dimensions, mode: DisplayMode): UIZoneConfig;
  getZoneForElement(elementType: UIElementType): Rectangle;
  updateZonePositions(config: LayoutConfig): void;
}

type UIElementType = 'gameGrid' | 'score' | 'nextPiece' | 'boosters' | 'statistics';

interface ZoneAllocationRules {
  mobile: {
    gameGrid: { left: 10, centerVertical: true };
    rightPanel: { width: 'remaining', elements: ['score', 'nextPiece'] };
  };
  desktop: {
    gameGrid: { centerBoth: true };
    rightPanel: { width: 200, elements: ['score', 'nextPiece', 'boosters'] };
    bottomPanel?: { height: 100, elements: ['statistics'] };
  };
  fullscreen: {
    gameGrid: { centerBoth: true };
    rightPanel: { width: 300, elements: ['score', 'nextPiece', 'boosters'] };
    leftPanel?: { width: 200, elements: ['statistics', 'achievements'] };
    bottomPanel?: { height: 150, elements: ['detailed-stats'] };
  };
}
```

## Data Models

### Responsive Configuration

```typescript
interface ResponsiveConfig {
  breakpoints: {
    mobile: { max: 1080 };
    desktop: { min: 1081, max: 1600 };
    fullscreen: { min: 1601 };
  };
  
  cellSizes: {
    mobile: 24;
    desktop: 32;
    fullscreen: { min: 32, max: 128, calculation: 'proportional' };
  };
  
  typography: {
    mobile: { base: 16, scale: 1.2, maxSize: 32 };
    desktop: { base: 20, scale: 1.25, maxSize: 40 };
    fullscreen: { base: 24, scale: 1.3, maxSize: 48 };
  };
  
  spacing: {
    mobile: { base: 8, grid: 10 };
    desktop: { base: 12, grid: 20 };
    fullscreen: { base: 16, grid: 30 };
  };
}
```

### Layout State

```typescript
interface LayoutState {
  currentMode: DisplayMode;
  screenDimensions: Dimensions;
  layoutConfig: LayoutConfig;
  lastUpdateTime: number;
  isUpdating: boolean;
}

interface Dimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## Error Handling

### Graceful Degradation

```typescript
interface ErrorHandling {
  fallbackLayouts: {
    mobile: LayoutConfig;
    desktop: LayoutConfig;
    fullscreen: LayoutConfig;
  };
  
  errorRecovery: {
    invalidDimensions: () => Dimensions;
    calculationFailure: (lastKnownGood: LayoutConfig) => LayoutConfig;
    performanceThreshold: () => void;
  };
  
  validation: {
    validateDimensions: (dims: Dimensions) => boolean;
    validateLayoutConfig: (config: LayoutConfig) => boolean;
    validateScalingFactors: (factors: ScalingFactors) => boolean;
  };
}
```

### Performance Safeguards

```typescript
interface PerformanceConfig {
  updateThrottling: {
    minInterval: 16; // 60fps
    debounceDelay: 100;
    maxUpdatesPerSecond: 60;
  };
  
  batchingRules: {
    maxBatchSize: 50;
    batchTimeout: 8;
    priorityElements: UIElementType[];
  };
  
  caching: {
    layoutConfigs: Map<string, LayoutConfig>;
    calculatedValues: Map<string, number>;
    ttl: 30000; // 30 seconds
  };
}
```

## Testing Strategy

### Responsive Testing Matrix

| Display Mode | Screen Sizes | Key Test Cases |
|--------------|--------------|----------------|
| Mobile | 320x568 to 1080x1920 | Portrait/landscape, text readability, touch targets |
| Desktop | 1081x768 to 1600x1200 | Window resizing, keyboard controls, UI spacing |
| Fullscreen | 1601x900 to 3840x2160 | Scaling limits, performance, visual quality |

### Test Scenarios

1. **Dynamic Resizing**: Continuous window resizing during gameplay
2. **Mode Transitions**: Switching between display modes
3. **Edge Cases**: Extreme aspect ratios, minimum/maximum sizes
4. **Performance**: Layout update timing under load
5. **Accessibility**: Font sizes, contrast, touch targets

### Automated Testing

```typescript
interface ResponsiveTests {
  unitTests: {
    displayModeDetection: () => void;
    layoutCalculations: () => void;
    scalingFormulas: () => void;
    zoneAllocation: () => void;
  };
  
  integrationTests: {
    fullLayoutUpdate: () => void;
    modeTransitions: () => void;
    performanceUnderLoad: () => void;
  };
  
  visualRegressionTests: {
    screenshotComparison: (mode: DisplayMode) => void;
    elementPositioning: () => void;
    textReadability: () => void;
  };
}
```

## Implementation Phases

### Phase 1: Core Infrastructure
- DisplayModeDetector implementation
- Basic LayoutManager with fixed configurations
- ScalingCalculator with fundamental formulas

### Phase 2: Dynamic Layouts
- UIZoneManager with adaptive zone allocation
- AdaptiveTypography system
- Real-time layout updates

### Phase 3: Performance Optimization
- Update batching and throttling
- Caching mechanisms
- Performance monitoring

### Phase 4: Enhanced Features
- Advanced UI zones for desktop/fullscreen
- Accessibility improvements
- Visual polish and animations

## Integration Points

### Game Scene Integration

```typescript
interface GameSceneIntegration {
  initializeResponsiveSystem: (scene: Phaser.Scene) => ResponsiveUISystem;
  onLayoutChange: (callback: (config: LayoutConfig) => void) => void;
  updateGameElements: (config: LayoutConfig) => void;
  handleInputAdaptation: (mode: DisplayMode) => void;
}
```

### Existing Component Updates

- **TestDie**: Dynamic cell size and font scaling
- **Game Scene**: Layout-aware positioning
- **Grid System**: Responsive grid offset and sizing
- **UI Elements**: Adaptive positioning and scaling

This design provides a comprehensive foundation for implementing a robust responsive UI system that will eliminate hardcoded measurements and ensure optimal gameplay experience across all device types.
