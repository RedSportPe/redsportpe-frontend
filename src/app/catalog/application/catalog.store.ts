import { Injectable, inject, signal, computed } from '@angular/core';
import { CatalogRepository } from '../infrastructure/catalog.repository';
import { Product } from '../domain/product.model';
import { SortOption, sortProducts } from '../domain/product-sorting';
import {
  GenderFilter,
  filterByCategory,
  filterByGender,
  filterByColor,
  filterBySize,
  sortSizes,
} from '../domain/product-filtering';
import { searchProducts } from '../domain/product-search';

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private repository = inject(CatalogRepository);

  // Private state
  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _sortOption = signal<SortOption>('relevance');
  private _categoryFilter = signal<string | 'all'>('all');
  private _genderFilter = signal<GenderFilter>('all');
  private _colorFilter = signal<string | 'all'>('all');
  private _sizeFilter = signal<string | 'all'>('all');
  // Favorites (in-memory for now; will persist per account once IAM exists)
  private _favorites = signal<Set<string>>(new Set());
  private _selectedProduct = signal<Product | undefined>(undefined);
  private _loadingProduct = signal(false);
  private _searchQuery = signal('');

  // Public read-only state
  readonly loading = this._loading.asReadonly();
  readonly sortOption = this._sortOption.asReadonly();
  readonly categoryFilter = this._categoryFilter.asReadonly();
  readonly genderFilter = this._genderFilter.asReadonly();
  readonly colorFilter = this._colorFilter.asReadonly();
  readonly sizeFilter = this._sizeFilter.asReadonly();
  readonly featuredProducts = computed(() =>
    this._products().filter(p => p.featured)
  );
  /** Available categories, derived from the actual products */
  readonly categories = computed(() =>
    [...new Set(this._products().map(p => p.category))].sort()
  );
  /** Available colors, derived from the actual products' variants */
  readonly availableColors = computed(() =>
    [...new Set(
      this._products().flatMap(p => p.variants.map(v => v.color))
    )].sort()
  );
  /** Available sizes, derived from variants, in business order (8-16, S-XXL) */
  readonly availableSizes = computed(() =>
    sortSizes([...new Set(
      this._products().flatMap(p => p.variants.map(v => v.size))
    )])
  );
  /** The catalog view: category → gender → color → size → sort */
  /** The catalog view: search → category → gender → color → size → sort */
  readonly products = computed(() => {
    let result = searchProducts(this._products(), this._searchQuery());
    result = filterByCategory(result, this._categoryFilter());
    result = filterByGender(result, this._genderFilter());
    result = filterByColor(result, this._colorFilter());
    result = filterBySize(result, this._sizeFilter());
    return sortProducts(result, this._sortOption());
  });
  /** Results counter for the UI */
  readonly resultsCount = computed(() => this.products().length);
  /** True when any filter differs from its default */
  readonly hasActiveFilters = computed(() =>
    this._searchQuery() !== '' ||
    this._categoryFilter() !== 'all' ||
    this._genderFilter() !== 'all' ||
    this._colorFilter() !== 'all' ||
    this._sizeFilter() !== 'all'
  );
  readonly selectedProduct = this._selectedProduct.asReadonly();
  readonly loadingProduct = this._loadingProduct.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();

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

  changeColor(colorCode: string | 'all'): void {
    this._colorFilter.set(colorCode);
  }

  changeSize(size: string | 'all'): void {
    this._sizeFilter.set(size);
  }

  /** Resets all filters to default (sort is kept — it's not a filter) */
  /** Resets all filters to default (sort is kept — it's not a filter) */
  clearFilters(): void {
    this._searchQuery.set('');
    this._categoryFilter.set('all');
    this._genderFilter.set('all');
    this._colorFilter.set('all');
    this._sizeFilter.set('all');
  }
  isFavorite(productId: string): boolean {
    return this._favorites().has(productId);
  }
  toggleFavorite(productId: string): void {
    const next = new Set(this._favorites());
    next.has(productId) ? next.delete(productId) : next.add(productId);
    this._favorites.set(next);
  }
  loadProduct(id: string): void {
    this._loadingProduct.set(true);
    this._selectedProduct.set(undefined);
    this.repository.getProductById(id).subscribe({
      next: (product) => {
        this._selectedProduct.set(product);
        this._loadingProduct.set(false);
      },
      error: () => this._loadingProduct.set(false),
    });
  }changeSearch(query: string): void {
    this._searchQuery.set(query);
  }

}
