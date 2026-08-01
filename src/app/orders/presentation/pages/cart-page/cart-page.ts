import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { CartStore } from '../../../application/cart.store';
import { OrdersStore } from '../../../application/orders.store';
import { AuthStore } from '../../../../identity/application/auth.store';
import { colorLabel } from '../../../../catalog/domain/product-filtering';
import { isQrExpired } from '../../../domain/delivery-rules';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPage {
  readonly store = inject(CartStore);
  readonly ordersStore = inject(OrdersStore);
  readonly authStore = inject(AuthStore);
  private router = inject(Router);

  readonly colorLabel = colorLabel;
  readonly isQrExpired = isQrExpired;

  onQuantityChange(sku: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!isNaN(value)) this.store.updateQuantity(sku, value);
  }

  /** Buying needs an account (points, orders); the modal overlays right here */
  goToCheckout(): void {
    if (!this.authStore.isAuthenticated()) {
      this.authStore.openModal('login');
      return;
    }
    this.router.navigate(['/carrito/checkout']);
  }

  /** Expired QR revives with a fresh 8h one before heading to the payment screen */
  payPendingOrder(orderId: string): void {
    const order = this.ordersStore.orderById(orderId);
    if (order && isQrExpired(order.qrExpiresAt)) {
      this.ordersStore.renewQr(orderId);
    }
    this.router.navigate(['/carrito/pago', orderId]);
  }
}
