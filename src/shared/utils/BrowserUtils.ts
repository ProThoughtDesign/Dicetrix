/**
 * Browser environment utilities
 * Provides safe access to browser APIs with proper type checking
 */

declare const window: any;
declare const localStorage: any;

export class BrowserUtils {
  /**
   * Check if we're running in a browser environment
   */
  public static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  /**
   * Get localStorage safely
   */
  public static getLocalStorage(): any | null {
    if (this.isBrowser()) {
      return window.localStorage;
    }
    return null;
  }

  /**
   * Set timeout safely
   */
  public static setTimeout(callback: () => void, delay: number): number | null {
    if (this.isBrowser()) {
      return window.setTimeout(callback, delay);
    }
    return null;
  }

  /**
   * Clear timeout safely
   */
  public static clearTimeout(timeoutId: number | null): void {
    if (this.isBrowser() && timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }

  /**
   * Create Blob safely
   */
  public static createBlob(data: any[]): { size: number } | null {
    if (this.isBrowser() && typeof Blob !== 'undefined') {
      return new Blob(data);
    }
    return null;
  }
}
