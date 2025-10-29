import { MatchGroup } from './types';

export function computeMatchScore(match: MatchGroup, base = 10): number {
  // Simple scoring: base * size * (1 + 0.1*(size-3))
  const size = match.size;
  const multiplier = 1 + Math.max(0, size - 3) * 0.1;
  return Math.floor(base * size * multiplier);
}

export function computeMatchesScore(matches: MatchGroup[]): number {
  return matches.reduce((sum, m) => sum + computeMatchScore(m), 0);
}
