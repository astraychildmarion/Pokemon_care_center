import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME_SPEED, GAME_SPEEDS } from './gameSpeed';

describe('game speeds', () => {
  it('uses Normal by default and exposes the four requested intervals', () => {
    expect(DEFAULT_GAME_SPEED).toBe('normal');
    expect(GAME_SPEEDS).toEqual({
      relaxed: { label: 'Relaxed', seconds: 15, intervalMs: 15_000 },
      normal: { label: 'Normal', seconds: 10, intervalMs: 10_000 },
      fast: { label: 'Fast', seconds: 5, intervalMs: 5_000 },
      challenge: { label: 'Challenge', seconds: 3, intervalMs: 3_000 },
    });
  });
});
