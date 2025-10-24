/**
 * Pure scoring utilities for cascades so logic can be unit tested.
 */
export function computeGroupScore(
  size: number,
  matchedNumber: number,
  facesTotal: number,
  multiplier: number
): number {
  const base = size * matchedNumber;
  const total = base + facesTotal;
  return total * multiplier;
}

export class CascadeManager {
  private multiplier: number;
  private expiryAt: number | null = null; // timestamp in ms when multiplier should reset

  constructor(initial = 1) {
    this.multiplier = initial;
  }

  getMultiplier(): number {
    return this.multiplier;
  }

  increment(): void {
    this.multiplier++;
  }

  reset(): void {
    this.multiplier = 1;
    this.expiryAt = null;
  }

  // Start an expiry timer (logical, uses epoch time). checkExpiry must be called periodically to enforce.
  startExpiry(delayMs: number): void {
    this.expiryAt = Date.now() + Math.max(0, Math.floor(delayMs));
  }

  // Check expiry and reset if needed. Returns true if reset occurred.
  checkExpiry(nowMs?: number): boolean {
    if (!this.expiryAt) return false;
    const now = typeof nowMs === 'number' ? nowMs : Date.now();
    if (now >= this.expiryAt) {
      this.reset();
      return true;
    }
    return false;
  }
}

export default { computeGroupScore, CascadeManager };
