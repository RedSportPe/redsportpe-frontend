import { Promotion } from './promotion.model';
import {
  isExpired,
  isDepleted,
  isPromotionActive,
  promoPrice,
  discountPercent,
  remainingPromoUnits,
} from './promotion-rules';

const basePromo: Promotion = {
  id: 'promo-test',
  productId: '1',
  discountAmount: 39,
};

describe('promotion-rules', () => {
  describe('promoPrice', () => {
    it('subtracts the discount from the regular price (139 - 39 = 100)', () => {
      expect(promoPrice(139, basePromo)).toBe(100);
    });

    it('never goes below zero', () => {
      expect(promoPrice(20, basePromo)).toBe(0);
    });

    it('keeps two decimals (129.90 - 39 = 90.90)', () => {
      expect(promoPrice(129.9, basePromo)).toBe(90.9);
    });
  });

  describe('discountPercent', () => {
    it('rounds the discount as a percentage of the regular price', () => {
      expect(discountPercent(129.9, basePromo)).toBe(30);
    });
  });

  describe('isExpired', () => {
    it('is not expired without a deadline', () => {
      expect(isExpired(basePromo, new Date('2099-01-01'))).toBe(false);
    });

    it('lives through the whole endsAt day (inclusive)', () => {
      const promo = { ...basePromo, endsAt: '2026-08-15' };
      expect(isExpired(promo, new Date('2026-08-15T22:00:00'))).toBe(false);
    });

    it('expires the day after endsAt', () => {
      const promo = { ...basePromo, endsAt: '2026-08-15' };
      expect(isExpired(promo, new Date('2026-08-16T00:00:01'))).toBe(true);
    });
  });

  describe('remainingPromoUnits / isDepleted', () => {
    it('returns null when the promo covers the whole stock', () => {
      expect(remainingPromoUnits(basePromo)).toBeNull();
      expect(isDepleted(basePromo)).toBe(false);
    });

    it('counts remaining units (10 max, 3 sold → 7 left)', () => {
      const promo = { ...basePromo, maxUnits: 10, unitsSold: 3 };
      expect(remainingPromoUnits(promo)).toBe(7);
      expect(isDepleted(promo)).toBe(false);
    });

    it('is depleted once all promo units are sold', () => {
      const promo = { ...basePromo, maxUnits: 10, unitsSold: 10 };
      expect(remainingPromoUnits(promo)).toBe(0);
      expect(isDepleted(promo)).toBe(true);
    });
  });

  describe('isPromotionActive', () => {
    it('is active when neither expired nor depleted', () => {
      const promo = { ...basePromo, endsAt: '2026-08-15', maxUnits: 10, unitsSold: 3 };
      expect(isPromotionActive(promo, new Date('2026-07-31'))).toBe(true);
    });

    it('is inactive when expired', () => {
      const promo = { ...basePromo, endsAt: '2026-07-15' };
      expect(isPromotionActive(promo, new Date('2026-07-31'))).toBe(false);
    });

    it('is inactive when depleted', () => {
      const promo = { ...basePromo, maxUnits: 5, unitsSold: 5 };
      expect(isPromotionActive(promo, new Date('2026-07-31'))).toBe(false);
    });
  });
});
