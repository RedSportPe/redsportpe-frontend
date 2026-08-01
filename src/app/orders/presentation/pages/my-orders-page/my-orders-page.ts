import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrdersStore } from '../../../application/orders.store';
import { AuthStore } from '../../../../identity/application/auth.store';
import { Order, DELIVERY_METHOD_LABELS } from '../../../domain/order.model';
import { TRACKING_STEPS, isDelivered } from '../../../domain/order-tracking';
import { colorLabel } from '../../../../catalog/domain/product-filtering';

@Component({
  selector: 'app-my-orders-page',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './my-orders-page.html',
  styleUrl: './my-orders-page.scss',
})
export class MyOrdersPage {
  readonly ordersStore = inject(OrdersStore);
  readonly authStore = inject(AuthStore);

  readonly methodLabels = DELIVERY_METHOD_LABELS;
  readonly isDelivered = isDelivered;
  readonly colorLabel = colorLabel;

  /** Orders with their detail panel expanded */
  private _expanded = signal<Set<string>>(new Set());

  isExpanded(orderId: string): boolean {
    return this._expanded().has(orderId);
  }

  toggleDetail(orderId: string): void {
    const expanded = new Set(this._expanded());
    expanded.has(orderId) ? expanded.delete(orderId) : expanded.add(orderId);
    this._expanded.set(expanded);
  }

  steps(order: Order): string[] {
    return TRACKING_STEPS[order.method];
  }

  itemsCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /** "Consultar" the first time this session; "Actualizar pedido" afterwards */
  buttonLabel(order: Order): string {
    return this.ordersStore.hasConsulted(order.id) ? 'Actualizar pedido' : 'Consultar';
  }
}
