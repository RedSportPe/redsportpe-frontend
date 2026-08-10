import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { CartItem } from '../domain/cart-item.model';
import { Order, DeliveryMethod, PaymentMethod, ShippingDetails } from '../domain/order.model';
import { qrExpiry, motorizadoDeliveryDate, shalomDispatchDate } from '../domain/delivery-rules';
import { nextTrackingStep, FINAL_TRACKING_STEP } from '../domain/order-tracking';
import { AuthStore } from '../../identity/application/auth.store';
import { pointsForPurchase } from '../../identity/domain/redsport-points';

/** Orders DO persist in sessionStorage (unlike the cart): "Mis pedidos" would be
 *  useless without it. Real persistence (account-linked) comes with the backend. */
@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly STORAGE_KEY = 'redsport_orders';
  private authStore = inject(AuthStore);

  private _orders = signal<Order[]>(this.loadFromSession());

  /** Orders whose tracking was already queried THIS login session.
   *  Drives the button label: first query says "Consultar", then "Actualizar
   *  pedido" — and logging out resets everything back to "Consultar". */
  private _consulted = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      this.authStore.currentUser();       // react to login/logout
      this._consulted.set(new Set());
    });
  }

  /** Every order in the system — the admin side needs the full picture */
  readonly allOrders = computed(() => this._orders());

  /** Orders of the logged-in customer, newest first */
  readonly myOrders = computed(() => {
    const user = this.authStore.currentUser();
    if (!user) return [];
    return this._orders()
      .filter(order => order.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  /** Paid orders — what "Mis pedidos" lists with tracking */
  readonly paidOrders = computed(() => this.myOrders().filter(o => !!o.paidAt));

  /** Unpaid orders — shown at the bottom of the cart page (pay again or delete) */
  readonly unpaidOrders = computed(() => this.myOrders().filter(o => !o.paidAt));

  orderById(id: string): Order | undefined {
    return this._orders().find(o => o.id === id);
  }

  /** Command: checkout confirmed → the order is born unpaid with a fresh 8h QR */
  placeOrder(items: CartItem[], total: number, method: DeliveryMethod, shipping: ShippingDetails): Order | undefined {
    const user = this.authStore.currentUser();
    if (!user || items.length === 0) return undefined;

    const now = new Date();
    const order: Order = {
      id: `order-${now.getTime()}`,
      code: `RS-${String(now.getTime()).slice(-4)}`,
      userId: user.id,
      items,
      total,
      method,
      shipping,
      createdAt: now.toISOString(),
      qrExpiresAt: qrExpiry(now).toISOString(),
      trackingStep: 0,
    };
    this.update([order, ...this._orders()]);
    return order;
  }

  /** Command: expired QR → generate a fresh one, the order revives for 8 more hours */
  renewQr(orderId: string): void {
    const now = new Date();
    this.update(
      this._orders().map(order =>
        order.id === orderId && !order.paidAt
          ? { ...order, qrExpiresAt: qrExpiry(now).toISOString() }
          : order
      )
    );
  }

  /** Command: payment confirmed → delivery date locks in (3pm cutoff) and
   *  RedSport points credit immediately. No refunds from here on. */
  payOrder(orderId: string): void {
    const order = this.orderById(orderId);
    if (!order || order.paidAt) return;

    const paidAt = new Date();
    const deliveryDate =
      order.method === 'motorizado'
        ? motorizadoDeliveryDate(paidAt)
        : shalomDispatchDate(paidAt);

    this.update(
      this._orders().map(o =>
        o.id === orderId
          ? {
            ...o,
            paidAt: paidAt.toISOString(),
            deliveryDate: deliveryDate.toISOString(),
            paymentMethod: 'qr' as PaymentMethod,
          }
          : o
      )
    );
    this.authStore.creditPoints(pointsForPurchase(order.total));
  }

  /** Command (operator only): in-store sale. Born PAID and DELIVERED — the
   *  customer pays at the counter (cash or instant QR) and leaves with the bag.
   *  NO RedSport points: they belong to the buyer, and the buyer isn't the
   *  logged-in operator (account-linked in-store points come with the backend). */
  registerPosSale(
    items: CartItem[],
    total: number,
    customerName: string,
    payment: { method: PaymentMethod; cashReceived?: number; qrAmount?: number },
    discount?: { subtotal: number; reason: string }
  ): Order | undefined {
    const user = this.authStore.currentUser();
    if (!user || user.role !== 'operator' || items.length === 0) return undefined;

    const now = new Date();
    const order: Order = {
      id: `order-${now.getTime()}`,
      code: `RS-${String(now.getTime()).slice(-4)}`,
      userId: user.id,
      items,
      total,
      method: 'tienda',
      shipping: { fullName: customerName || 'Clientes Varios', phone: '—' },
      createdAt: now.toISOString(),
      qrExpiresAt: now.toISOString(),   // never pending: paid on the spot
      paidAt: now.toISOString(),
      deliveryDate: now.toISOString(),
      trackingStep: FINAL_TRACKING_STEP,
      paymentMethod: payment.method,
      cashReceived: payment.cashReceived,
      qrAmount: payment.qrAmount,
      sellerName: user.name,
      subtotal: discount?.subtotal,
      discountReason: discount?.reason,
    };
    this.update([order, ...this._orders()]);
    return order;
  }

  /** Command: remove an unpaid order (the customer gave up on it) */
  deleteUnpaidOrder(orderId: string): void {
    this.update(this._orders().filter(o => !(o.id === orderId && !o.paidAt)));
  }

  /** True once this order's tracking was queried in the current login session */
  hasConsulted(orderId: string): boolean {
    return this._consulted().has(orderId);
  }

  /** Command: "Consultar" / "Actualizar pedido". Today the simulation advances
   *  one step per query; tomorrow this asks the backend (Shalom API included). */
  refreshTracking(orderId: string): void {
    this.update(
      this._orders().map(order =>
        order.id === orderId && order.paidAt
          ? { ...order, trackingStep: nextTrackingStep(order.trackingStep) }
          : order
      )
    );
    const consulted = new Set(this._consulted());
    consulted.add(orderId);
    this._consulted.set(consulted);
  }

  private update(orders: Order[]): void {
    this._orders.set(orders);
    this.saveToSession();
  }

  private loadFromSession(): Order[] {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToSession(): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._orders()));
    } catch {
      // storage unavailable — orders live in memory only
    }
  }
}
