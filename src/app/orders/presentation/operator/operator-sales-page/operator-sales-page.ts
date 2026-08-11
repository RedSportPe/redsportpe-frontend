import { Component, inject, computed, signal } from '@angular/core';
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

  // Filters: date interval (inclusive) + customer name + scannable code
  readonly dateFrom = signal('');      // 'YYYY-MM-DD' or '' = no lower bound
  readonly dateTo = signal('');        // 'YYYY-MM-DD' or '' = no upper bound
  readonly customerQuery = signal('');
  /** Scan the boleta's barcode (B001-00000001) or a garment's SKU here —
   *  matches boleta number, venta code AND item SKUs */
  readonly codeQuery = signal('');

  /** Every in-store sale of this operator, before filtering */
  private allSales = computed(() =>
    this.ordersStore.paidOrders().filter(order => order.method === 'tienda')
  );

  /** The filtered view: date interval → customer name → boleta/SKU code */
  readonly sales = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    const query = this.customerQuery().trim().toLowerCase();
    const code = this.codeQuery().trim().toUpperCase();

    return this.allSales().filter(sale => {
      // Compare in LOCAL dates: paidAt is stored in UTC, and an evening sale
      // in Peru already belongs to the next UTC day
      const day = this.localDate(sale.paidAt ?? sale.createdAt);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (query && !sale.shipping.fullName.toLowerCase().includes(query)) return false;
      if (code) {
        const matchesBoleta = sale.boletaNumber?.toUpperCase().includes(code);
        const matchesVenta = sale.code.toUpperCase().includes(code);
        const matchesSku = sale.items.some(item => item.sku.toUpperCase().includes(code));
        if (!matchesBoleta && !matchesVenta && !matchesSku) return false;
      }
      return true;
    });
  });

  readonly allCount = computed(() => this.allSales().length);

  readonly hasActiveFilters = computed(
    () =>
      this.dateFrom() !== '' ||
      this.dateTo() !== '' ||
      this.customerQuery().trim() !== '' ||
      this.codeQuery().trim() !== ''
  );

  /** Total collected for the CURRENT filter (matches what the table shows) */
  readonly totalCollected = computed(() =>
    Math.round(this.sales().reduce((sum, sale) => sum + sale.total, 0) * 100) / 100
  );

  onFilter(field: 'dateFrom' | 'dateTo' | 'customerQuery' | 'codeQuery', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  clearFilters(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.customerQuery.set('');
    this.codeQuery.set('');
  }

  itemsCount(sale: Order): number {
    return sale.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private localDate(iso: string): string {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
}
