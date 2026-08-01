import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrdersStore } from '../../../application/orders.store';
import { isQrExpired } from '../../../domain/delivery-rules';
import { pointsForPurchase } from '../../../../identity/domain/redsport-points';

@Component({
  selector: 'app-payment-page',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './payment-page.html',
  styleUrl: './payment-page.scss',
})
export class PaymentPage {
  private route = inject(ActivatedRoute);
  readonly ordersStore = inject(OrdersStore);

  readonly pointsForPurchase = pointsForPurchase;

  private orderId = this.route.snapshot.paramMap.get('id') ?? '';

  /** Re-checked whenever an action changes the order (pay / renew QR) */
  private _refresh = signal(0);

  readonly order = computed(() => {
    this._refresh();
    return this.ordersStore.orderById(this.orderId);
  });

  readonly qrExpired = computed(() => {
    const order = this.order();
    return !!order && !order.paidAt && isQrExpired(order.qrExpiresAt);
  });

  /** Fake QR cells — deterministic pattern from the order id, until a real
   *  payment provider generates the image */
  readonly qrCells = computed(() => {
    const seedText = this.order()?.id ?? 'rs';
    let seed = 0;
    for (const char of seedText) seed = (seed * 31 + char.charCodeAt(0)) % 9973;
    const cells: boolean[] = [];
    for (let i = 0; i < 121; i++) {
      seed = (seed * 75 + 74) % 65537;
      cells.push(seed % 2 === 0);
    }
    return cells;
  });

  confirmPayment(): void {
    this.ordersStore.payOrder(this.orderId);
    this._refresh.update(n => n + 1);
  }

  renewQr(): void {
    this.ordersStore.renewQr(this.orderId);
    this._refresh.update(n => n + 1);
  }
}
