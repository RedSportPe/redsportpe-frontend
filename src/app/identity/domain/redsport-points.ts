/** Loyalty rule (ubiquitous language): 1 sol = 1 RedSport point, decimals included
 *  (S/ 150.99 → 150.99 points). Credited when the order is PAID.
 *  No refunds: once paid, points never return, even if the order is cancelled. */
export function pointsForPurchase(amountInSoles: number): number {
  return Math.max(0, Math.round(amountInSoles * 100) / 100);
}

/** Adds points keeping two decimals (avoids 0.1 + 0.2 float noise) */
export function addPoints(current: number, earned: number): number {
  return Math.round((current + earned) * 100) / 100;
}
