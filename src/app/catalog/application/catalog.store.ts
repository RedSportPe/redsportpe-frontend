import { Injectable, inject, signal, computed } from '@angular/core';
import { CatalogRepository } from '../infrastructure/catalog.repository';
import { Product } from '../domain/product.model';
import { SortOption, sortProducts } from '../domain/product-sorting';

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private repository = inject(CatalogRepository);

  // Private state
  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _sortOption = signal<SortOption>('relevance');

  // Public read-only state
  readonly loading = this._loading.asReadonly();
  readonly sortOption = this._sortOption.asReadonly();
  readonly totalProducts = computed(() => this._products().length);

  readonly featuredProducts = computed(() =>
    this._products().filter(p => p.featured)
  );

  /** The catalog view: always sorted by the current option */
  readonly products = computed(() =>
    sortProducts(this._products(), this._sortOption())
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

  changeSort(option: SortOption): void {
    this._sortOption.set(option);
  }
}
