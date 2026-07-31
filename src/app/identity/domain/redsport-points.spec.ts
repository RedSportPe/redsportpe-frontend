import { pointsForPurchase } from './redsport-points';

describe('pointsForPurchase', () => {
  it('earns 1 point per full sol (1 sol = 1 punto)', () => {
    expect(pointsForPurchase(100)).toBe(100);
  });

  it('never rounds cents up (129.90 → 129 points)', () => {
    expect(pointsForPurchase(129.9)).toBe(129);
  });

  it('never goes negative', () => {
    expect(pointsForPurchase(-10)).toBe(0);
  });

  it('zero purchase earns zero points', () => {
    expect(pointsForPurchase(0)).toBe(0);
  });
});
