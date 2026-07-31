import { Promotion } from './promotion.model';

/** Business rule: the deadline is inclusive — the promo lives through the whole endsAt day. */
export function isExpired(promo: Promotion, now: Date = new Date()): boolean {
  if (!promo.endsAt) return false;
  const endOfDay = new Date(`${promo.endsAt}T23:59:59`);
  return now.getTime() > endOfDay.getTime();
}

/** Units still available at the promo price, or null when the promo covers the whole stock. */
export function remainingPromoUnits(promo: Promotion): number | null {
  if (promo.maxUnits == null) return null;
  return Math.max(0, promo.maxUnits - (promo.unitsSold ?? 0));
}

/** Business rule: a unit-capped promo dies once all its units are sold. */
export function isDepleted(promo: Promotion): boolean {
  return remainingPromoUnits(promo) === 0;
}

/** A promotion applies only while it is neither expired nor depleted. */
export function isPromotionActive(promo: Promotion, now: Date = new Date()): boolean {
  return !isExpired(promo, now) && !isDepleted(promo);
}

/** Promo price = regular price minus the discount, never below zero. */
export function promoPrice(regularPrice: number, promo: Promotion): number {
  return Math.max(0, Math.round((regularPrice - promo.discountAmount) * 100) / 100);
}

/** Discount as a percentage of the regular price — for the "-30%" badge. */
export function discountPercent(regularPrice: number, promo: Promotion): number {
  if (regularPrice <= 0) return 0;
  return Math.round((promo.discountAmount / regularPrice) * 100);
}
