import { Injectable, inject, signal, computed } from '@angular/core';
import { CatalogRepository } from '../infrastructure/catalog.repository';
import { Product } from '../domain/product.model';
import { SortOption, sortProducts } from '../domain/product-sorting';
import { GenderFilter, filterByCategory, filterByGender } from '../domain/product-filtering';

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private repository = inject(CatalogRepository);

  // Private state
  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _sortOption = signal<SortOption>('relevance');
  private _categoryFilter = signal<string | 'all'>('all');
  private _genderFilter = signal<GenderFilter>('all');

  // Public read-only state
  readonly loading = this._loading.asReadonly();
  readonly sortOption = this._sortOption.asReadonly();
  readonly categoryFilter = this._categoryFilter.asReadonly();
  readonly genderFilter = this._genderFilter.asReadonly();

  readonly featuredProducts = computed(() =>
    this._products().filter(p => p.featured)
  );

  /** Available categories, derived from the actual products */
  readonly categories = computed(() =>
    [...new Set(this._products().map(p => p.category))].sort()
  );

  /** The catalog view: filter by category → filter by gender → sort */
  readonly products = computed(() => {
    let result = filterByCategory(this._products(), this._categoryFilter());
    result = filterByGender(result, this._genderFilter());
    return sortProducts(result, this._sortOption());
  });

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

  changeCategory(category: string | 'all'): void {
    this._categoryFilter.set(category);
  }

  changeGender(gender: GenderFilter): void {
    this._genderFilter.set(gender);
  }
}
