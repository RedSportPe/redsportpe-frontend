import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartStore } from '../../../application/cart.store';
import { colorLabel } from '../../../../catalog/domain/product-filtering';

@Component({
  selector: 'app-cart-drawer',
  imports: [CurrencyPipe],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
})
export class CartDrawer {
  readonly store = inject(CartStore);
  readonly colorLabel = colorLabel;
  private router = inject(Router);

  goToCart(): void {
    this.store.closeDrawer();
    this.router.navigate(['/carrito']);
  }
}
