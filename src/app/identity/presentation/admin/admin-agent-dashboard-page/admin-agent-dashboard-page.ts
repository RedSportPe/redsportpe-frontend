import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AgentsStore } from '../../../application/agents.store';
import { ubigeoLine } from '../../../domain/commercial-agent.model';
import { OrdersStore } from '../../../../orders/application/orders.store';
import { Order, DELIVERY_METHOD_LABELS } from '../../../../orders/domain/order.model';

type SaleFilter = 'todas' | 'fisica' | 'online';

/** Per-tienda sales dashboard ("Ver" from Agentes Comerciales): totals and the
 *  sales list, filterable between in-store (POS) and online sales. */
@Component({
  selector: 'app-admin-agent-dashboard-page',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './admin-agent-dashboard-page.html',
  styleUrl: './admin-agent-dashboard-page.scss',
})
export class AdminAgentDashboardPage {
  private route = inject(ActivatedRoute);
  private agentsStore = inject(AgentsStore);
  private ordersStore = inject(OrdersStore);

  readonly methodLabels = DELIVERY_METHOD_LABELS;
  readonly ubigeoLine = ubigeoLine;

  private storeCode = this.route.snapshot.paramMap.get('storeCode') ?? 'T1';
  readonly agent = computed(() => this.agentsStore.byCode(this.storeCode));

  readonly filter = signal<SaleFilter>('todas');

  private paidOrders = computed(() =>
    this.ordersStore.allOrders().filter(order => !!order.paidAt)
  );

  /** POS sales rung up at THIS tienda's register */
  readonly fisicaSales = computed(() =>
    this.paidOrders().filter(o => o.method === 'tienda' && o.storeCode === this.storeCode)
  );

  /** Paid online orders (motorizado/Shalom). Store assignment for dispatch is a
   *  planned next step, so for now every tienda sees the full online list. */
  readonly onlineSales = computed(() =>
    this.paidOrders().filter(o => o.method !== 'tienda')
  );

  readonly sales = computed(() => {
    const list =
      this.filter() === 'fisica' ? this.fisicaSales()
      : this.filter() === 'online' ? this.onlineSales()
      : [...this.fisicaSales(), ...this.onlineSales()];
    return [...list].sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''));
  });

  readonly fisicaTotal = computed(() => this.round(this.fisicaSales().reduce((s, o) => s + o.total, 0)));
  readonly onlineTotal = computed(() => this.round(this.onlineSales().reduce((s, o) => s + o.total, 0)));
  readonly filteredTotal = computed(() => this.round(this.sales().reduce((s, o) => s + o.total, 0)));

  isOnline(order: Order): boolean {
    return order.method !== 'tienda';
  }

  paymentLabel(order: Order): string {
    if (order.paymentMethod === 'efectivo') return 'Efectivo';
    if (order.paymentMethod === 'mixto') return 'Mixto';
    return 'QR Yape/Plin';
  }

  setFilter(filter: SaleFilter): void {
    this.filter.set(filter);
  }

  private round(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
