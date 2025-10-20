import { InputEvent } from './InputManager.js';

/**
 * Input validation rules
 */
export interface ValidationRule {
  name: string;
  validate: (event: InputEvent, context: ValidationContext) => ValidationResult;
}

/**
 * Validation context provides information about current game state
 */
export interface ValidationContext {
  isPaused: boolean;
  isGameOver: boolean;
  canMove: boolean;
  lastInputTime: number;
  inputHistory: InputEvent[];
  maxInputsPerSecond: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  shouldBlock?: boolean;
}

/**
 * InputValidator ensures input events meet game constraints and rules
 */
export class InputValidator {
  private rules: ValidationRule[] = [];
  private context: ValidationContext;

  constructor(initialContext: Partial<ValidationContext> = {}) {
    this.context = {
      isPaused: false,
      isGameOver: false,
      canMove: true,
      lastInputTime: 0,
      inputHistory: [],
      maxInputsPerSecond: 20,
      ...initialContext
    };

    this.setupDefaultRules();
  }

  /**
   * Setup default validation rules
   */
  private setupDefaultRules(): void {
    // Game state validation
    this.addRule({
      name: 'game_state',
      validate: (event, context) => {
        if (context.isGameOver) {
          return { isValid: false, reason: 'Game is over', shouldBlock: true };
        }
        
        if (context.isPaused && event.type !== 'pause') {
          return { isValid: false, reason: 'Game is paused', shouldBlock: true };
        }
        
        if (!context.canMove && ['move_left', 'move_right', 'move_down', 'rotate', 'hard_drop'].includes(event.type)) {
          return { isValid: false, reason: 'Movement not allowed', shouldBlock: true };
        }
        
        return { isValid: true };
      }
    });

    // Rate limiting validation
    this.addRule({
      name: 'rate_limit',
      validate: (event, context) => {
        const now = event.timestamp;
        const recentInputs = context.inputHistory.filter(
          input => now - input.timestamp < 1000
        );
        
        if (recentInputs.length >= context.maxInputsPerSecond) {
          return { 
            isValid: false, 
            reason: 'Input rate limit exceeded', 
            shouldBlock: true 
          };
        }
        
        return { isValid: true };
      }
    });

    // Input cooldown validation
    this.addRule({
      name: 'input_cooldown',
      validate: (event, context) => {
        const minInterval = 50; // 50ms minimum between inputs
        
        if (event.timestamp - context.lastInputTime < minInterval) {
          return { 
            isValid: false, 
            reason: 'Input too frequent', 
            shouldBlock: true 
          };
        }
        
        return { isValid: true };
      }
    });

    // Movement validation (basic constraints)
    this.addRule({
      name: 'movement_constraints',
      validate: (event, context) => {
        // Prevent rapid alternating movements that could cause issues
        const recentMovements = context.inputHistory
          .filter(input => 
            ['move_left', 'move_right'].includes(input.type) &&
            event.timestamp - input.timestamp < 100
          )
          .slice(-3);
        
        if (recentMovements.length >= 2) {
          const isAlternating = recentMovements.every((input, index) => {
            if (index === 0) return true;
            const prev = recentMovements[index - 1];
            return prev && (
              (input.type === 'move_left' && prev.type === 'move_right') ||
              (input.type === 'move_right' && prev.type === 'move_left')
            );
          });
          
          if (isAlternating && ['move_left', 'move_right'].includes(event.type)) {
            return { 
              isValid: false, 
              reason: 'Rapid alternating movement detected', 
              shouldBlock: false // Allow but warn
            };
          }
        }
        
        return { isValid: true };
      }
    });

    // Source validation (ensure consistent input source)
    this.addRule({
      name: 'source_consistency',
      validate: (event, context) => {
        const recentInputs = context.inputHistory
          .filter(input => event.timestamp - input.timestamp < 500)
          .slice(-5);
        
        if (recentInputs.length > 0) {
          const sources = new Set(recentInputs.map(input => input.source));
          
          // If mixing keyboard and touch rapidly, it might be accidental
          if (sources.size > 1 && recentInputs.length >= 3) {
            return { 
              isValid: true, // Allow but note
              reason: 'Mixed input sources detected'
            };
          }
        }
        
        return { isValid: true };
      }
    });
  }

  /**
   * Validate an input event
   */
  public validate(event: InputEvent): ValidationResult {
    // Update context with current event
    this.updateContext(event);
    
    // Run all validation rules
    for (const rule of this.rules) {
      const result = rule.validate(event, this.context);
      
      if (!result.isValid && result.shouldBlock) {
        return result;
      }
      
      // Log warnings for non-blocking validation failures
      if (!result.isValid && !result.shouldBlock) {
        console.warn(`Input validation warning (${rule.name}): ${result.reason}`);
      }
    }
    
    // If all rules pass, record the input
    this.recordInput(event);
    
    return { isValid: true };
  }

  /**
   * Update validation context
   */
  private updateContext(event: InputEvent): void {
    // Clean old history
    const cutoff = event.timestamp - 5000; // Keep 5 seconds of history
    this.context.inputHistory = this.context.inputHistory.filter(
      input => input.timestamp > cutoff
    );
  }

  /**
   * Record a valid input event
   */
  private recordInput(event: InputEvent): void {
    this.context.inputHistory.push(event);
    this.context.lastInputTime = event.timestamp;
  }

  /**
   * Add a custom validation rule
   */
  public addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a validation rule by name
   */
  public removeRule(name: string): void {
    this.rules = this.rules.filter(rule => rule.name !== name);
  }

  /**
   * Update validation context
   */
  public updateValidationContext(updates: Partial<ValidationContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Get current validation context
   */
  public getContext(): ValidationContext {
    return { ...this.context };
  }

  /**
   * Clear input history
   */
  public clearHistory(): void {
    this.context.inputHistory = [];
  }

  /**
   * Get input statistics
   */
  public getInputStats(): {
    totalInputs: number;
    inputsPerSecond: number;
    averageInterval: number;
    sourceBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
  } {
    const history = this.context.inputHistory;
    const now = Date.now();
    const recentInputs = history.filter(input => now - input.timestamp < 1000);
    
    const sourceBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};
    
    history.forEach(input => {
      sourceBreakdown[input.source] = (sourceBreakdown[input.source] || 0) + 1;
      typeBreakdown[input.type] = (typeBreakdown[input.type] || 0) + 1;
    });
    
    let averageInterval = 0;
    if (history.length > 1) {
      const intervals = [];
      for (let i = 1; i < history.length; i++) {
        intervals.push(history[i]!.timestamp - history[i - 1]!.timestamp);
      }
      averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }
    
    return {
      totalInputs: history.length,
      inputsPerSecond: recentInputs.length,
      averageInterval,
      sourceBreakdown,
      typeBreakdown
    };
  }

  /**
   * Reset validator state
   */
  public reset(): void {
    this.context.inputHistory = [];
    this.context.lastInputTime = 0;
  }
}
