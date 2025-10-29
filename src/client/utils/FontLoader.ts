import Logger from './Logger';

/**
 * FontLoader utility class for loading custom fonts with timeout handling and fallback mechanisms
 * Extracted from SplashScreen.ts to provide reusable font loading functionality across scenes
 * 
 * Features:
 * - Asynchronous font loading with Promise-based API
 * - Configurable timeout mechanism (default 3 seconds)
 * - Comprehensive error handling and logging
 * - Fallback font chain support
 * - Browser compatibility checks
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export class FontLoader {
  private static readonly DEFAULT_TIMEOUT = 3000; // 3 second timeout
  private static readonly FALLBACK_FONT_CHAIN = '"Arial Black", Arial, "Helvetica Neue", Helvetica, sans-serif';
  
  /**
   * Load fonts asynchronously with timeout protection
   * @param fonts Array of font names to load (e.g., ['Asimovian', 'Nabla'])
   * @param timeout Timeout in milliseconds (default: 3000ms)
   * @returns Promise that resolves when fonts are loaded or timeout occurs
   */
  public static async loadFonts(
    fonts: string[] = ['Asimovian', 'Nabla'], 
    timeout: number = FontLoader.DEFAULT_TIMEOUT
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      Logger.log(`FontLoader: Starting font loading process for [${fonts.join(', ')}] with ${timeout}ms timeout`);
      
      // Check browser compatibility
      if (!FontLoader.isFontLoadingSupported()) {
        Logger.log('FontLoader: document.fonts.load API not available, using fallback fonts');
        return; // Exit early with fallback behavior
      }
      
      const fontPromises: Promise<void>[] = [];
      
      // Create font loading promises for each font
      fonts.forEach(fontName => {
        if (document?.fonts?.load) {
          fontPromises.push(document.fonts.load(`16px "${fontName}"`).then(() => {}));
          Logger.log(`FontLoader: Added ${fontName} font to loading queue`);
        }
      });
      
      // Add fonts.ready promise if available for better compatibility
      if (document?.fonts?.ready) {
        fontPromises.push(document.fonts.ready.then(() => {}));
        Logger.log('FontLoader: Added fonts.ready to loading queue');
      }
      
      // Create timeout promise that rejects after specified time
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          const elapsedTime = Date.now() - startTime;
          reject(new Error(`Font loading timeout after ${elapsedTime}ms (limit: ${timeout}ms)`));
        }, timeout);
      });
      
      // Wait for all fonts to load concurrently with timeout protection
      if (fontPromises.length > 0) {
        Logger.log(`FontLoader: Waiting for ${fontPromises.length} font loading promises with ${timeout}ms timeout`);
        
        // Race between font loading and timeout
        await Promise.race([
          Promise.all(fontPromises),
          timeoutPromise
        ]);
        
        const elapsedTime = Date.now() - startTime;
        Logger.log(`FontLoader: All fonts loaded successfully in ${elapsedTime}ms`);
      } else {
        Logger.log('FontLoader: No font loading promises to wait for, using fallback fonts');
      }
      
    } catch (error) {
      FontLoader.handleFontLoadingError(error, startTime, timeout);
      // Continue execution with fallback fonts - do not throw
    }
  }
  
  /**
   * Load Asimovian font specifically (primary game font)
   * @param timeout Timeout in milliseconds (default: 3000ms)
   * @returns Promise that resolves when Asimovian font is loaded or timeout occurs
   */
  public static async loadAsimovianFont(timeout: number = FontLoader.DEFAULT_TIMEOUT): Promise<void> {
    return FontLoader.loadFonts(['Asimovian'], timeout);
  }
  
  /**
   * Create font family string with fallback chain for text elements
   * @param primaryFont Primary font name (e.g., 'Asimovian')
   * @param customFallbacks Optional custom fallback fonts
   * @returns Font family string with comprehensive fallback chain
   */
  public static createFontFamily(
    primaryFont: string = 'Asimovian', 
    customFallbacks?: string[]
  ): string {
    const fallbacks = customFallbacks || ['"Arial Black"', 'Arial', '"Helvetica Neue"', 'Helvetica', 'sans-serif'];
    return `${primaryFont}, ${fallbacks.join(', ')}`;
  }
  
  /**
   * Apply fallback font styling to existing text element
   * @param textElement Phaser text element to apply fallback fonts to
   * @param fallbackChain Optional custom fallback chain
   */
  public static applyFallbackFonts(
    textElement: any, 
    fallbackChain: string = FontLoader.FALLBACK_FONT_CHAIN
  ): void {
    try {
      if (!textElement || !textElement.setStyle) {
        Logger.log('FontLoader: Invalid text element provided for fallback font application');
        return;
      }
      
      textElement.setStyle({ fontFamily: fallbackChain });
      Logger.log(`FontLoader: Applied fallback fonts to text element: ${fallbackChain}`);
    } catch (error) {
      Logger.log(`FontLoader: Error applying fallback fonts - ${error}`);
    }
  }
  
  /**
   * Check if the browser supports font loading APIs
   * @returns True if font loading is supported, false otherwise
   */
  public static isFontLoadingSupported(): boolean {
    try {
      return !!(
        typeof document !== 'undefined' &&
        document.fonts &&
        document.fonts.load &&
        typeof document.fonts.load === 'function'
      );
    } catch (error) {
      Logger.log(`FontLoader: Error checking font loading support - ${error}`);
      return false;
    }
  }
  
  /**
   * Validate if a specific font is available in the document
   * @param fontName Name of the font to check
   * @returns True if font is available, false otherwise
   */
  public static async validateFontAvailability(fontName: string): Promise<boolean> {
    try {
      if (!FontLoader.isFontLoadingSupported()) {
        return false;
      }
      
      // Try to load the font and check if it's available
      await document.fonts.load(`16px "${fontName}"`);
      
      // Simple availability check without iterating FontFaceSet
      const isAvailable = document.fonts.check(`16px "${fontName}"`);
      Logger.log(`FontLoader: Font '${fontName}' availability check: ${isAvailable}`);
      return isAvailable;
    } catch (error) {
      Logger.log(`FontLoader: Error validating font availability for '${fontName}' - ${error}`);
      return false;
    }
  }
  
  /**
   * Get comprehensive font loading debug information
   * @returns Object containing font loading environment details
   */
  public static getFontLoadingDebugInfo(): Record<string, any> {
    try {
      return {
        documentExists: typeof document !== 'undefined',
        fontsApiExists: !!(document && document.fonts),
        loadMethodExists: !!(document && document.fonts && document.fonts.load),
        readyExists: !!(document && document.fonts && document.fonts.ready),
        userAgent: navigator?.userAgent || 'unknown',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      Logger.log(`FontLoader: Error collecting debug info - ${error}`);
      return { error: String(error) };
    }
  }
  
  /**
   * Handle font loading errors with comprehensive logging and context
   * @param error The error that occurred during font loading
   * @param startTime When font loading started (for elapsed time calculation)
   * @param timeout The timeout limit that was set
   */
  private static handleFontLoadingError(error: any, startTime: number, timeout: number): void {
    const elapsedTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if this was a timeout error
    if (errorMessage.includes('timeout')) {
      Logger.log(`FontLoader: Font loading timed out after ${elapsedTime}ms - proceeding with fallback fonts`);
      Logger.log('FontLoader: Timeout event logged for performance monitoring');
    } else {
      Logger.log(`FontLoader: Font loading failed after ${elapsedTime}ms - ${errorMessage}`);
      Logger.log('FontLoader: Continuing with fallback fonts due to loading failure');
    }
    
    // Log fallback behavior for debugging
    Logger.log('FontLoader: Fallback font behavior activated - text will use system fonts');
    
    // Log additional context for debugging
    try {
      const debugInfo = FontLoader.getFontLoadingDebugInfo();
      debugInfo.elapsedTime = elapsedTime;
      debugInfo.timeoutLimit = timeout;
      Logger.log(`FontLoader: Font loading context - ${JSON.stringify(debugInfo)}`);
    } catch (debugError) {
      Logger.log(`FontLoader: Could not collect font loading debug info - ${debugError}`);
    }
  }
}

export default FontLoader;
