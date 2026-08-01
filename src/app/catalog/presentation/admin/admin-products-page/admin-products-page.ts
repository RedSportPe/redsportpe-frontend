import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CatalogStore } from '../../../application/catalog.store';
import { OrdersStore } from '../../../../orders/application/orders.store';
import { productHasActiveOrders } from '../../../../orders/domain/order-tracking';
import { totalStock } from '../../../domain/product-badges';
import { Product } from '../../../domain/product.model';

@Component({
  selector: 'app-admin-products-page',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './admin-products-page.html',
  styleUrl: './admin-products-page.scss',
})
export class AdminProductsPage implements OnInit {
  readonly store = inject(CatalogStore);
  private ordersStore = inject(OrdersStore);

  readonly totalStock = totalStock;
  readonly deleteError = signal<string | null>(null);

  ngOnInit(): void {
    this.store.loadCatalog();
  }

  onDelete(product: Product): void {
    // Business rule: a product with active (undelivered) orders cannot be deleted
    if (productHasActiveOrders(this.ordersStore.allOrders(), product.id)) {
      this.deleteError.set(
        `"${product.name}" tiene pedidos activos asociados — no se puede eliminar hasta que se entreguen.`
      );
      return;
    }
    this.deleteError.set(null);
    this.store.deleteProduct(product.id);
  }
}
