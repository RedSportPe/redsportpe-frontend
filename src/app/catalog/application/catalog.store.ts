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

  /** Customers only ever see published products; admin sees everything */
  private publishedProducts = computed(() => this._products().filter(p => p.published));
  /** The admin view: every product, published or not */
  readonly allProducts = computed(() => this._products());

  readonly featuredProducts = computed(() =>
    this.publishedProducts().filter(p => p.featured)
  );
  /** Available categories, derived from the actual products */
  readonly categories = computed(() =>
    [...new Set(this.publishedProducts().map(p => p.category))].sort()
  );
  /** Available colors, derived from the actual products' variants */
  readonly availableColors = computed(() =>
    [...new Set(
      this.publishedProducts().flatMap(p => p.variants.map(v => v.color))
    )].sort()
  );
  /** Available sizes, derived from variants, in business order (8-16, S-XXL) */
  readonly availableSizes = computed(() =>
    sortSizes([...new Set(
      this.publishedProducts().flatMap(p => p.variants.map(v => v.size))
    )])
  );
  /** The catalog view: search → category → gender → color → size → sort */
  readonly products = computed(() => {
    let result = searchProducts(this.publishedProducts(), this._searchQuery());
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
  /** Newest products first (by createdAt), top 4 — for the home "Novedades" section */
  readonly newestProducts = computed(() =>
    [...this.publishedProducts()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  );
  readonly selectedProduct = this._selectedProduct.asReadonly();
  readonly loadingProduct = this._loadingProduct.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();

  loadCatalog(): void {
    // Cache-first: reloading would wipe the admin's in-memory edits.
    // Real freshness arrives with the backend API.
    if (this._products().length > 0) return;
    this._loading.set(true);
    this.repository.getPublishedProducts().subscribe({
      next: (products) => {
        this._products.set(products);
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
  /** The favorites view: full products, only those the customer hearted */
  readonly favoriteProducts = computed(() =>
    this.publishedProducts().filter(p => this._favorites().has(p.id))
  );
  readonly favoritesCount = computed(() => this._favorites().size);
  isFavorite(productId: string): boolean {
    return this._favorites().has(productId);
  }
  toggleFavorite(productId: string): void {
    const next = new Set(this._favorites());
    next.has(productId) ? next.delete(productId) : next.add(productId);
    this._favorites.set(next);
  }
  loadProduct(id: string): void {
    // Cache-first so admin-created/edited products resolve too
    const cached = this._products().find(p => p.id === id);
    if (cached) {
      this._selectedProduct.set(cached);
      this._loadingProduct.set(false);
      return;
    }
    this._loadingProduct.set(true);
    this._selectedProduct.set(undefined);
    this.repository.getProductById(id).subscribe({
      next: (product) => {
        this._selectedProduct.set(product);
        this._loadingProduct.set(false);
      },
      error: () => this._loadingProduct.set(false),
    });
  }

  changeSearch(query: string): void {
    this._searchQuery.set(query);
  }

  // ===== Admin commands =====
  // Today they mutate the in-memory catalog (resets on reload).
  // Tomorrow: POST/PUT/DELETE /api/products through the repository.

  createProduct(data: Omit<Product, 'id' | 'salesCount' | 'createdAt'>): Product {
    const nextId = String(
      Math.max(0, ...this._products().map(p => Number(p.id) || 0)) + 1
    );
    const product: Product = {
      ...data,
      id: nextId,
      salesCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this._products.set([...this._products(), product]);
    return product;
  }

  updateProduct(id: string, changes: Partial<Omit<Product, 'id'>>): void {
    this._products.set(
      this._products().map(p => (p.id === id ? { ...p, ...changes } : p))
    );
  }

  togglePublished(id: string): void {
    this._products.set(
      this._products().map(p => (p.id === id ? { ...p, published: !p.published } : p))
    );
  }

  /** The "can it be deleted?" rule (no active orders) is enforced by the caller
   *  with productHasActiveOrders — Orders owns that knowledge, not Catalog. */
  deleteProduct(id: string): void {
    this._products.set(this._products().filter(p => p.id !== id));
  }
}
