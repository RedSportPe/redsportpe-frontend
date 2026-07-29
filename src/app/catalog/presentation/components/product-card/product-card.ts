import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../../domain/product.model';
import { isSoldOut, isLowStock, isNew } from '../../../domain/product-badges';
import { CatalogStore } from '../../../application/catalog.store';
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
  readonly isSoldOut = isSoldOut;
  readonly isLowStock = isLowStock;
  readonly isNew = isNew;

  onFavoriteClick(event: Event): void {
    event.stopPropagation();  // don't trigger the card click (future: navigate to detail)
    this.store.toggleFavorite(this.product().id);
  }
}
