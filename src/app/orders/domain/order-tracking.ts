import { DeliveryMethod, Order } from './order.model';

/** The 4-dot timeline each method walks, left to right. */
export const TRACKING_STEPS: Record<DeliveryMethod, string[]> = {
  motorizado: ['Preparando', 'Despachado', 'En camino', 'Entregado'],
  shalom: ['Almacén', 'En agencia', 'En tránsito', 'En destino'],
};

export const FINAL_TRACKING_STEP = 3;

export function trackingLabel(order: Order): string {
  return TRACKING_STEPS[order.method][order.trackingStep];
}

export function isDelivered(order: Order): boolean {
  return order.trackingStep >= FINAL_TRACKING_STEP;
}

/** Business rule: once paid and at destination there is no return (no refunds). */
export function nextTrackingStep(current: number): number {
  return Math.min(current + 1, FINAL_TRACKING_STEP);
}
