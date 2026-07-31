/** Loyalty rule (ubiquitous language): every full sol spent earns 1 RedSport point.
 *  S/ 129.90 → 129 points. Cents never round up. */
export function pointsForPurchase(amountInSoles: number): number {
  return Math.max(0, Math.floor(amountInSoles));
}
