import { Component, inject, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrdersStore } from '../../../application/orders.store';
import { Order } from '../../../domain/order.model';

@Component({
  selector: 'app-operator-sales-page',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './operator-sales-page.html',
  styleUrl: './operator-sales-page.scss',
})
export class OperatorSalesPage {
  private ordersStore = inject(OrdersStore);

  /** In-store sales registered by this operator, newest first */
  readonly sales = computed(() =>
    this.ordersStore.paidOrders().filter(order => order.method === 'tienda')
  );

  readonly totalCollected = computed(() =>
    Math.round(this.sales().reduce((sum, sale) => sum + sale.total, 0) * 100) / 100
  );

  itemsCount(sale: Order): number {
    return sale.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
