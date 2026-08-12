import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TRACKING_STEPS, trackingLabel, isDelivered } from '../../../domain/order-tracking';
import { DELIVERY_METHOD_LABELS } from '../../../domain/order.model';
import { OnlineOrdersStore } from '../../../application/online-orders.store';

@Component({
  selector: 'app-my-orders-operator-page',
  imports: [CurrencyPipe],
  templateUrl: './my-orders-operator-page.html',
  styleUrl: './my-orders-operator-page.scss',
})
export class MyOrdersOperatorPage implements OnInit {
  readonly store = inject(OnlineOrdersStore);

  readonly methodLabels = DELIVERY_METHOD_LABELS;
  readonly trackingSteps = TRACKING_STEPS;
  readonly trackingLabel = trackingLabel;
  readonly isDelivered = isDelivered;

  ngOnInit(): void {
    this.store.initFromMock();
  }

  advance(orderId: string): void {
    this.store.advanceTracking(orderId);
  }
}
