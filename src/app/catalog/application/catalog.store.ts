import { Injectable, inject, signal, computed } from '@angular/core';
import { CatalogRepository } from '../infrastructure/catalog.repository';
import { Product } from '../domain/product.model';

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private repository = inject(CatalogRepository);

  // Private state
  private _products = signal<Product[]>([]);
  private _loading = signal(false);

  // Public read-only state
  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly totalProducts = computed(() => this._products().length);
  readonly featuredProducts = computed(() =>
    this._products().filter(p => p.featured)
  );
  loadCatalog(): void {
    this._loading.set(true);
    this.repository.getPublishedProducts().subscribe({
      next: (products) => {
        this._products.set(products.filter(p => p.published));
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }
}
