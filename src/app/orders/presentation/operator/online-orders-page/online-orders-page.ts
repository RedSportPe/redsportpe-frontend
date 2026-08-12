import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { DELIVERY_METHOD_LABELS } from '../../../domain/order.model';
import { OnlineOrdersStore } from '../../../application/online-orders.store';
import { AuthStore } from '../../../../identity/application/auth.store';

@Component({
  selector: 'app-online-orders-page',
  imports: [CurrencyPipe],
  templateUrl: './online-orders-page.html',
  styleUrl: './online-orders-page.scss',
})
export class OnlineOrdersPage implements OnInit {
  readonly store = inject(OnlineOrdersStore);
  private auth = inject(AuthStore);

  readonly methodLabels = DELIVERY_METHOD_LABELS;

  ngOnInit(): void {
    this.store.initFromMock();
  }

  accept(orderId: string): void {
    const name = this.auth.currentUser()?.name ?? 'Operador';
    this.store.accept(orderId, name);
  }
}
