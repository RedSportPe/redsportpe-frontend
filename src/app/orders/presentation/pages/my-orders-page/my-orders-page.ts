import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrdersStore } from '../../../application/orders.store';
import { AuthStore } from '../../../../identity/application/auth.store';
import { Order, DELIVERY_METHOD_LABELS } from '../../../domain/order.model';
import { TRACKING_STEPS, isDelivered } from '../../../domain/order-tracking';

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
