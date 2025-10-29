# Design Document

## Overview

The background bouncing system will be redesigned to use a logical point-based approach instead of Phaser's physics system. This design eliminates the collision detection issues that cause minimal movement and provides smooth, predictable bouncing behavior within a defined rectangular area.

## Architecture

### Current System Issues
- Uses `Phaser.Physics.Arcade.Sprite` with `setCollideWorldBounds(true)`
- Collision detection occurs at sprite edges, limiting movement to a few pixels
- Physics overhead for simple bouncing behavior
- Unpredictable collision behavior due to sprite size vs world bounds

### New System Design
- **Logical Point System**: A virtual point that moves within a bounding rectangle
- **Manual Collision Detection**: Simple mathematical boundary checks
- **Sprite Positioning**: Background sprite positioned relative to logical point
- **Frame-Rate Independence**: Delta time-based movement calculations

## Components and Interfaces

### BackgroundBouncer Class
A new utility class to encapsulate the bouncing logic:

```typescript
interface BackgroundBouncerConfig {
  screenWidth: number;
  screenHeight: number;
  boundingBoxScale: number; // 0.8 for 80% of screen
  initialSpeed: number;
}

interface LogicalPoint {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

interface BoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

class BackgroundBouncer {
  private logicalPoint: LogicalPoint;
  private boundingBox: BoundingBox;
  private config: BackgroundBouncerConfig;
  
  constructor(config: BackgroundBouncerConfig);
  update(deltaTime: number): void;
  getBackgroundPosition(): { x: number; y: number };
  reset(): void;
}
```

### Game Scene Integration
Modifications to the existing `Game.ts` scene:

```typescript
export class Game extends Scene {
  // Replace physics sprite with regular sprite
  private backgroundSprite: Phaser.GameObjects.Sprite | null = null;
  private backgroundBouncer: BackgroundBouncer | null = null;
  
  // Remove physics-related methods
  // Add new bouncing system methods
}
```

## Data Models

### LogicalPoint Structure
```typescript
interface LogicalPoint {
  x: number;        // Current X position within bounding box
  y: number;        // Current Y position within bounding box
  velocityX: number; // X velocity in pixels per second
  velocityY: number; // Y velocity in pixels per second
}
```

### BoundingBox Structure
```typescript
interface BoundingBox {
  left: number;   // Left boundary (10% from screen edge)
  right: number;  // Right boundary (90% from screen edge)
  top: number;    // Top boundary (10% from screen edge)
  bottom: number; // Bottom boundary (90% from screen edge)
}
```

### Configuration Structure
```typescript
interface BackgroundBouncerConfig {
  screenWidth: number;      // Full screen width
  screenHeight: number;     // Full screen height
  boundingBoxScale: number; // 0.8 for 80% of screen size
  initialSpeed: number;     // Initial movement speed (pixels/second)
}
```

## Error Handling

### Boundary Validation
- Validate that bounding box dimensions are positive
- Ensure logical point stays within bounds even with floating-point precision errors
- Handle edge cases where velocity becomes zero

### Sprite Management
- Graceful handling of missing background texture
- Fallback behavior if sprite creation fails
- Proper cleanup of resources on scene destruction

### Performance Safeguards
- Limit maximum velocity to prevent excessive movement
- Validate delta time to prevent large jumps during frame drops
- Early exit from update if scene is paused

## Testing Strategy

### Unit Testing Approach
- **Boundary Collision Tests**: Verify correct velocity reversal at each boundary
- **Position Calculation Tests**: Validate sprite positioning relative to logical point
- **Delta Time Tests**: Ensure frame-rate independence with various delta values
- **Configuration Tests**: Test with different screen sizes and bounding box scales

### Integration Testing
- **Scene Integration**: Verify proper initialization and cleanup in Game scene
- **Performance Testing**: Measure computational overhead vs physics system
- **Visual Testing**: Confirm smooth movement and proper sprite positioning

### Test Scenarios
1. **Normal Bouncing**: Logical point moves smoothly and bounces off all boundaries
2. **Corner Bouncing**: Proper behavior when hitting corners (both velocities reverse)
3. **Pause/Resume**: Movement stops and resumes correctly
4. **Screen Resize**: Bounding box updates appropriately
5. **Performance**: No frame rate impact during continuous bouncing

## Implementation Details

### Collision Detection Algorithm
```typescript
// Simple boundary collision detection
if (logicalPoint.x <= boundingBox.left || logicalPoint.x >= boundingBox.right) {
  velocityX = -velocityX;
  // Clamp position to prevent boundary penetration
  logicalPoint.x = Math.max(boundingBox.left, Math.min(boundingBox.right, logicalPoint.x));
}

if (logicalPoint.y <= boundingBox.top || logicalPoint.y >= boundingBox.bottom) {
  velocityY = -velocityY;
  // Clamp position to prevent boundary penetration
  logicalPoint.y = Math.max(boundingBox.top, Math.min(boundingBox.bottom, logicalPoint.y));
}
```

### Sprite Positioning
```typescript
// Position background sprite offset by half its dimensions
const spriteX = logicalPoint.x - (backgroundSprite.width * backgroundSprite.scaleX) / 2;
const spriteY = logicalPoint.y - (backgroundSprite.height * backgroundSprite.scaleY) / 2;
backgroundSprite.setPosition(spriteX, spriteY);
```

### Frame-Rate Independence
```typescript
// Update position based on delta time (in seconds)
logicalPoint.x += velocityX * (deltaTime / 1000);
logicalPoint.y += velocityY * (deltaTime / 1000);
```

## Migration Strategy

### Phase 1: Create BackgroundBouncer Class
- Implement the new bouncing logic as a separate utility class
- Add comprehensive unit tests
- Validate behavior in isolation

### Phase 2: Integrate with Game Scene
- Replace physics sprite creation with regular sprite
- Remove physics world setup for background
- Integrate BackgroundBouncer into update loop

### Phase 3: Cleanup and Optimization
- Remove unused physics-related code
- Update logging and debugging output
- Performance validation and optimization

## Performance Considerations

### Computational Efficiency
- Simple mathematical operations vs physics engine overhead
- No physics body creation or collision detection system usage
- Minimal memory allocation during runtime

### Resource Management
- Single sprite instead of physics sprite
- No physics world bounds or collision bodies
- Reduced memory footprint

### Update Loop Optimization
- Early exit conditions for paused state
- Minimal calculations per frame
- Efficient boundary checking logic
