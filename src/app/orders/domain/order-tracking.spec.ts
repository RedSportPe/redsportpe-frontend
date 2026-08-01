import { Order } from './order.model';
import {
  TRACKING_STEPS,
  trackingLabel,
  isDelivered,
  nextTrackingStep,
  FINAL_TRACKING_STEP,
} from './order-tracking';

function makeOrder(method: Order['method'], trackingStep: number): Order {
  return {
    id: 'o-1',
    code: 'RS-0001',
    userId: 'u-1',
    items: [],
    total: 100,
    method,
    shipping: { fullName: 'Test', phone: '999999999' },
    createdAt: '2026-07-31T10:00:00',
    qrExpiresAt: '2026-07-31T18:00:00',
    paidAt: '2026-07-31T11:00:00',
    trackingStep,
  };
}

describe('order-tracking', () => {
  it('motorizado walks Preparando → Despachado → En camino → Entregado', () => {
    expect(TRACKING_STEPS.motorizado).toEqual(['Preparando', 'Despachado', 'En camino', 'Entregado']);
  });

  it('shalom walks Almacén → En agencia → En tránsito → En destino', () => {
    expect(TRACKING_STEPS.shalom).toEqual(['Almacén', 'En agencia', 'En tránsito', 'En destino']);
  });

  it('labels the current step per method', () => {
    expect(trackingLabel(makeOrder('motorizado', 2))).toBe('En camino');
    expect(trackingLabel(makeOrder('shalom', 1))).toBe('En agencia');
  });

  it('advances one step at a time and never past the final step', () => {
    expect(nextTrackingStep(0)).toBe(1);
    expect(nextTrackingStep(FINAL_TRACKING_STEP)).toBe(FINAL_TRACKING_STEP);
  });

  it('an order at the last step is delivered / at destination', () => {
    expect(isDelivered(makeOrder('motorizado', 3))).toBe(true);
    expect(isDelivered(makeOrder('shalom', 2))).toBe(false);
  });
});
