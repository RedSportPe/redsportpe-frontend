/** Business rule: payments confirmed before 3pm are dispatched the same day. */
export const PAYMENT_CUTOFF_HOUR = 15;

/** Business rule: a payment QR lives 8 hours; unpaid orders release after that. */
export const QR_VALIDITY_HOURS = 8;

export function qrExpiry(from: Date): Date {
  return new Date(from.getTime() + QR_VALIDITY_HOURS * 60 * 60 * 1000);
}

export function isQrExpired(expiresAt: string | Date, now: Date = new Date()): boolean {
  return now.getTime() > new Date(expiresAt).getTime();
}

export function isBeforeCutoff(at: Date): boolean {
  return at.getHours() < PAYMENT_CUTOFF_HOUR;
}

/** Motorizado: paid before 3pm → delivered tomorrow; after 3pm → the day after. */
export function motorizadoDeliveryDate(paidAt: Date): Date {
  const date = new Date(paidAt);
  date.setDate(date.getDate() + (isBeforeCutoff(paidAt) ? 1 : 2));
  return date;
}

/** Shalom: paid before 3pm → dropped at the agency the same day; after → tomorrow.
 *  Arrival is not promised — the customer follows it through tracking. */
export function shalomDispatchDate(paidAt: Date): Date {
  const date = new Date(paidAt);
  date.setDate(date.getDate() + (isBeforeCutoff(paidAt) ? 0 : 1));
  return date;
}
