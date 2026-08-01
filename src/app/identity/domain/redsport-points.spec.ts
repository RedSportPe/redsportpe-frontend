import { pointsForPurchase, addPoints } from './redsport-points';

describe('pointsForPurchase', () => {
  it('earns 1 point per sol (1 sol = 1 punto)', () => {
    expect(pointsForPurchase(100)).toBe(100);
  });

  it('keeps decimals: S/ 150.99 → 150.99 points', () => {
    expect(pointsForPurchase(150.99)).toBe(150.99);
  });

  it('never goes negative', () => {
    expect(pointsForPurchase(-10)).toBe(0);
  });

  it('zero purchase earns zero points', () => {
    expect(pointsForPurchase(0)).toBe(0);
  });
});

describe('addPoints', () => {
  it('accumulates with two decimals, no float noise', () => {
    expect(addPoints(0.1, 0.2)).toBe(0.3);
    expect(addPoints(320, 150.99)).toBe(470.99);
  });
});
