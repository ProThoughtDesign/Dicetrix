import { GridPosition, DieColor } from '../types/game.js';
import { 
  DifficultyModeConfig, 
  EnhancedDie, 
  MultiDiePiece, 
  BoosterType 
} from '../types/difficulty.js';
import { FloodFillValidator } from './FloodFillValidator.js';

/**
 * ProceduralPieceGenerator creates pieces using constraint-based generation
 * with random walk algorithms and connectivity validation.
 */
export class ProceduralPieceGenerator {
  private static readonly MAX_GENERATION_ATTEMPTS = 50;
  private static readonly DIE_COLORS: DieColor[] = [
    'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'
  ];

  /**
   * Generates a procedural piece based on difficulty configuration
   * @param config Difficulty mode configuration
   * @returns Generated multi-die piece
   */
  static generatePiece(config: DifficultyModeConfig): MultiDiePiece {
    let attempts = 0;
    
    while (attempts < this.MAX_GENERATION_ATTEMPTS) {
      try {
        // Generate connected shape within dimensional bounds
        const positions = this.generateConnectedShape(
          config.maxPieceWidth,
          config.maxPieceHeight,
          config.maxDicePerPiece
        );

        // Validate connectivity
        if (!FloodFillValidator.validateConnectivity(positions)) {
          attempts++;
          continue;
        }

        // Assign dice types based on configuration
        const dice = this.assignDiceTypes(positions, config);

        // Apply booster effects
        this.applyBoosterEffects(dice, config.boosterChance);

        // Calculate piece dimensions and center
        const bounds = this.calculatePieceBounds(positions);

        return {
          dice,
          width: bounds.width,
          height: bounds.height,
          centerX: bounds.centerX,
          centerY: bounds.centerY
        };

      } catch (error) {
        attempts++;
        if (attempts >= this.MAX_GENERATION_ATTEMPTS) {
          // Fallback to single die piece
          return this.generateSingleDiePiece(config);
        }
      }
    }

    // Final fallback to single die
    return this.generateSingleDiePiece(config);
  }

  /**
   * Generates a connected shape using symmetrical templates
   * @param maxWidth Maximum width constraint
   * @param maxHeight Maximum height constraint
   * @param maxDice Maximum dice count constraint
   * @returns Array of connected positions
   */
  private static generateConnectedShape(
    maxWidth: number, 
    maxHeight: number, 
    maxDice: number
  ): GridPosition[] {
    // Get available symmetrical templates that fit within constraints
    const availableTemplates = this.getSymmetricalTemplates(maxWidth, maxHeight, maxDice);
    
    if (availableTemplates.length === 0) {
      // Fallback to single die if no templates fit
      return [{ x: 0, y: 0 }];
    }

    // Select random template from available options
    const selectedTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)]!;
    
    return selectedTemplate.positions;
  }

  /**
   * Gets symmetrical piece templates that fit within the given constraints
   * @param maxWidth Maximum width constraint
   * @param maxHeight Maximum height constraint
   * @param maxDice Maximum dice count constraint
   * @returns Array of valid templates
   */
  private static getSymmetricalTemplates(
    maxWidth: number,
    maxHeight: number,
    maxDice: number
  ): Array<{ name: string; positions: GridPosition[] }> {
    const templates = [
      // Single die
      {
        name: 'single',
        positions: [{ x: 0, y: 0 }]
      },
      
      // 2-dice templates
      {
        name: 'horizontal_pair',
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }]
      },
      {
        name: 'vertical_pair',
        positions: [{ x: 0, y: 0 }, { x: 0, y: 1 }]
      },
      
      // 3-dice templates
      {
        name: 'horizontal_line',
        positions: [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }]
      },
      {
        name: 'vertical_line',
        positions: [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }]
      },
      {
        name: 'L_shape',
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]
      },
      
      // 4-dice templates
      {
        name: 'square',
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }]
      },
      {
        name: 'horizontal_line_4',
        positions: [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
      },
      {
        name: 'vertical_line_4',
        positions: [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }]
      },
      {
        name: 'T_shape',
        positions: [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]
      },
      {
        name: 'L_shape_4',
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }]
      },
      {
        name: 'Z_shape',
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }]
      },
      
      // 5-dice templates
      {
        name: 'plus_shape',
        positions: [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }]
      },
      {
        name: 'horizontal_line_5',
        positions: [{ x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]
      },
      {
        name: 'vertical_line_5',
        positions: [{ x: 0, y: -2 }, { x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }]
      },
      {
        name: 'L_shape_5',
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }]
      },
      
      // 6-dice templates
      {
        name: 'rectangle_2x3',
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }]
      },
      {
        name: 'rectangle_3x2',
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]
      },
      
      // 8-dice templates
      {
        name: 'rectangle_2x4',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }
        ]
      },
      {
        name: 'rectangle_4x2',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }
        ]
      },
      
      // 9-dice templates
      {
        name: 'square_3x3',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
        ]
      },
      
      // 10-dice templates
      {
        name: 'rectangle_2x5',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 },
          { x: 1, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 4 }
        ]
      },
      {
        name: 'rectangle_5x2',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }
        ]
      },
      
      // 12-dice templates
      {
        name: 'rectangle_3x4',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }
        ]
      },
      {
        name: 'rectangle_4x3',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
        ]
      },
      
      // 15-dice templates
      {
        name: 'rectangle_3x5',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 },
          { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 0, y: 3 },
          { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }
        ]
      },
      {
        name: 'rectangle_5x3',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }
        ]
      },
      
      // 16-dice templates
      {
        name: 'square_4x4',
        positions: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
          { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }
        ]
      }
    ];

    // Filter templates that fit within constraints
    return templates.filter(template => {
      const bounds = this.calculatePieceBounds(template.positions);
      return (
        template.positions.length <= maxDice &&
        bounds.width <= maxWidth &&
        bounds.height <= maxHeight
      );
    });
  }

  /**
   * Assigns dice types to positions based on difficulty configuration
   * @param positions Array of grid positions
   * @param config Difficulty mode configuration
   * @returns Array of enhanced dice
   */
  private static assignDiceTypes(
    positions: GridPosition[], 
    config: DifficultyModeConfig
  ): EnhancedDie[] {
    const dice: EnhancedDie[] = [];

    // Handle Zen mode uniform dice rule - takes precedence over all other dice type selection
    let uniformDiceType: number | null = null;
    if (config.uniformDiceRule && positions.length > 1) {
      // Select single dice type for entire piece in Zen mode
      // Zen mode should only use the configured dice types, not Black Dice
      uniformDiceType = config.diceTypes[Math.floor(Math.random() * config.diceTypes.length)]!;
    }

    for (let i = 0; i < positions.length; i++) {
      const position = positions[i]!;
      
      // Determine dice type
      let diceType: number;
      let isBlack = false;

      if (uniformDiceType !== null) {
        // Use uniform dice type for Zen mode - no Black Dice in uniform mode
        diceType = uniformDiceType;
      } else if (config.allowBlackDice && Math.random() < 0.1) {
        // Check for Black Die generation (Hard and Expert modes only)
        // 10% chance for Black Die when not in uniform dice mode
        diceType = 20; // Black dice are d20
        isBlack = true;
      } else {
        // Normal dice type selection
        diceType = config.diceTypes[Math.floor(Math.random() * config.diceTypes.length)]!;
      }

      // Generate random number within dice range - different numbers allowed in Zen mode
      const number = Math.floor(Math.random() * diceType) + 1;

      // Select random color
      const color = this.DIE_COLORS[Math.floor(Math.random() * this.DIE_COLORS.length)]!;

      // Create enhanced die
      const die: EnhancedDie = {
        id: `die_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        sides: diceType,
        number,
        color,
        relativePos: position,
        isBlack,
        isWild: isBlack, // Black dice are wild
        boosterType: BoosterType.NONE
      };

      dice.push(die);
    }

    return dice;
  }

  /**
   * Applies booster effects to dice based on booster chance
   * @param dice Array of dice to apply effects to
   * @param boosterChance Probability of booster effect (0.0 to 1.0)
   */
  private static applyBoosterEffects(dice: EnhancedDie[], boosterChance: number): void {
    const boosterTypes = [
      BoosterType.RED_GLOW,
      BoosterType.BLUE_GLOW,
      BoosterType.GREEN_GLOW,
      BoosterType.YELLOW_GLOW,
      BoosterType.PURPLE_GLOW,
      BoosterType.ORANGE_GLOW,
      BoosterType.MAGENTA_GLOW,
      BoosterType.CYAN_GLOW,
      BoosterType.TEAL_GLOW
    ];

    for (const die of dice) {
      if (Math.random() < boosterChance) {
        die.boosterType = boosterTypes[Math.floor(Math.random() * boosterTypes.length)]!;
        die.glowColor = die.boosterType as string;
      }
    }
  }



  /**
   * Calculates piece bounds and center
   * @param positions Array of positions
   * @returns Bounds information
   */
  private static calculatePieceBounds(positions: GridPosition[]): {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    if (positions.length === 0) {
      return { width: 0, height: 0, centerX: 0, centerY: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return { width, height, centerX, centerY, minX, maxX, minY, maxY };
  }



  /**
   * Generates a fallback single die piece
   * @param config Difficulty mode configuration
   * @returns Single die piece
   */
  private static generateSingleDiePiece(config: DifficultyModeConfig): MultiDiePiece {
    const diceType = config.diceTypes[Math.floor(Math.random() * config.diceTypes.length)]!;
    const number = Math.floor(Math.random() * diceType) + 1;
    const color = this.DIE_COLORS[Math.floor(Math.random() * this.DIE_COLORS.length)]!;

    const die: EnhancedDie = {
      id: `single_die_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      sides: diceType,
      number,
      color,
      relativePos: { x: 0, y: 0 },
      isBlack: false,
      isWild: false,
      boosterType: Math.random() < config.boosterChance ? 
        BoosterType.BLUE_GLOW : BoosterType.NONE
    };

    if (die.boosterType !== BoosterType.NONE) {
      die.glowColor = die.boosterType as string;
    }

    return {
      dice: [die],
      width: 1,
      height: 1,
      centerX: 0,
      centerY: 0
    };
  }
}
