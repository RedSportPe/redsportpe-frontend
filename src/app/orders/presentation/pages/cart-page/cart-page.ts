import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartStore } from '../../../application/cart.store';
import { colorLabel } from '../../../../catalog/domain/product-filtering';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPage {
  readonly store = inject(CartStore);
  readonly colorLabel = colorLabel;

  onQuantityChange(sku: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!isNaN(value)) this.store.updateQuantity(sku, value);
  }
}
