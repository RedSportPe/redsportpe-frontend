import { Component, inject, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrdersStore } from '../../../application/orders.store';
import { Order, DELIVERY_METHOD_LABELS } from '../../../domain/order.model';
import { trackingLabel, isDelivered } from '../../../domain/order-tracking';
import { isQrExpired } from '../../../domain/delivery-rules';

type PaymentStatus = 'paid' | 'pending' | 'expired';

@Component({
  selector: 'app-admin-orders-page',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './admin-orders-page.html',
  styleUrl: './admin-orders-page.scss',
})
export class AdminOrdersPage {
  readonly ordersStore = inject(OrdersStore);

  readonly methodLabels = DELIVERY_METHOD_LABELS;
  readonly trackingLabel = trackingLabel;
  readonly isDelivered = isDelivered;

  /** Every order in the system, newest first */
  readonly orders = computed(() =>
    [...this.ordersStore.allOrders()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  readonly paidCount = computed(() => this.orders().filter(o => !!o.paidAt).length);
  readonly pendingCount = computed(() => this.orders().filter(o => !o.paidAt).length);

  paymentStatus(order: Order): PaymentStatus {
    if (order.paidAt) return 'paid';
    return isQrExpired(order.qrExpiresAt) ? 'expired' : 'pending';
  }

  itemsCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /** Admin drives the tracking: same simulation the customer's "Consultar" uses.
   *  With the backend, THIS becomes the real source of state changes. */
  advance(order: Order): void {
    this.ordersStore.refreshTracking(order.id);
  }
}
