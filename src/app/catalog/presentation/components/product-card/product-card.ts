import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../../domain/product.model';
import { isSoldOut, isLowStock, isNew } from '../../../domain/product-badges';
import { CatalogStore } from '../../../application/catalog.store';
import { AuthStore } from '../../../../identity/application/auth.store';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  product = input.required<Product>();

  readonly store = inject(CatalogStore);
  private authStore = inject(AuthStore);
  readonly isSoldOut = isSoldOut;
  readonly isLowStock = isLowStock;
  readonly isNew = isNew;

  onFavoriteClick(event: Event): void {
    // The heart lives INSIDE the card's <a>: preventDefault stops the anchor's
    // native navigation and stopPropagation keeps routerLink from firing.
    event.preventDefault();
    event.stopPropagation();
    // Business rule: no anonymous favorites — hearting requires an account
    if (!this.authStore.isAuthenticated()) {
      this.authStore.openModal('login');
      return;
    }
    this.store.toggleFavorite(this.product().id);
  }
}
