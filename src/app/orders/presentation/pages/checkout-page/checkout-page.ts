import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartStore } from '../../../application/cart.store';
import { OrdersStore } from '../../../application/orders.store';
import { AuthStore } from '../../../../identity/application/auth.store';
import { DeliveryMethod, DELIVERY_METHOD_LABELS } from '../../../domain/order.model';
import { PAYMENT_CUTOFF_HOUR, isBeforeCutoff } from '../../../domain/delivery-rules';

@Component({
  selector: 'app-checkout-page',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage {
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  private ordersStore = inject(OrdersStore);
  private router = inject(Router);

  readonly methodLabels = DELIVERY_METHOD_LABELS;
  readonly cutoffHour = PAYMENT_CUTOFF_HOUR;

  readonly method = signal<DeliveryMethod>('motorizado');
  readonly fullName = signal(this.authStore.currentUser()?.name ?? '');
  readonly phone = signal('');
  readonly address = signal('');
  readonly district = signal('');
  readonly agency = signal('');

  /** Delivery estimate shown BEFORE paying, driven by the 3pm cutoff rule */
  readonly deliveryEstimate = computed(() => {
    const now = new Date();
    const fmt = (daysAhead: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + daysAhead);
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    const stillBeforeCutoff = isBeforeCutoff(now);

    if (this.method() === 'motorizado') {
      return stillBeforeCutoff
        ? `Si pagas antes de las 3:00 pm, tu pedido llega mañana ${fmt(1)}. Después de las 3:00 pm llegaría el ${fmt(2)}.`
        : `Ya pasaron las 3:00 pm: pagando ahora, tu pedido llega el ${fmt(2)}.`;
    }
    return stillBeforeCutoff
      ? `Si pagas antes de las 3:00 pm, hoy mismo dejamos tu pedido en Shalom. Luego sigues su viaje desde "Mis pedidos".`
      : `Ya pasaron las 3:00 pm: pagando ahora, dejamos tu pedido en Shalom mañana ${fmt(1)}. Luego sigues su viaje desde "Mis pedidos".`;
  });

  readonly canPlaceOrder = computed(() => {
    if (this.cartStore.isEmpty() || !this.authStore.isAuthenticated()) return false;
    if (!this.fullName().trim() || this.phone().trim().length < 9) return false;
    if (this.method() === 'motorizado') {
      return !!this.address().trim() && !!this.district().trim();
    }
    return !!this.agency().trim();
  });

  onInput(field: 'fullName' | 'phone' | 'address' | 'district' | 'agency', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  selectMethod(method: DeliveryMethod): void {
    this.method.set(method);
  }

  placeOrder(): void {
    if (!this.canPlaceOrder()) return;
    const order = this.ordersStore.placeOrder(
      this.cartStore.items(),
      this.cartStore.totalAmount(),
      this.method(),
      {
        fullName: this.fullName().trim(),
        phone: this.phone().trim(),
        address: this.method() === 'motorizado' ? this.address().trim() : undefined,
        district: this.method() === 'motorizado' ? this.district().trim() : undefined,
        agency: this.method() === 'shalom' ? this.agency().trim() : undefined,
      }
    );
    if (order) {
      this.cartStore.clearCart();
      this.router.navigate(['/carrito/pago', order.id]);
    }
  }
}
