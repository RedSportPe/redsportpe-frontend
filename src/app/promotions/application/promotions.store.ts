import { Injectable, inject, signal, computed } from '@angular/core';
import { PromotionsRepository } from '../infrastructure/promotions.repository';
import { CatalogStore } from '../../catalog/application/catalog.store';
import { Promotion } from '../domain/promotion.model';
import { PromoProduct } from '../domain/promo-product.model';
import { isPromotionActive } from '../domain/promotion-rules';
import { PromoSortOption, sortPromoProducts } from '../domain/promo-sorting';
import {
  GenderFilter,
  filterByCategory,
  filterByGender,
  filterByColor,
  filterBySize,
  sortSizes,
} from '../../catalog/domain/product-filtering';

@Injectable({ providedIn: 'root' })
export class PromotionsStore {
  private promotionsRepository = inject(PromotionsRepository);
  // Products come from the catalog's in-memory store (single source of truth):
  // promos see admin-created products and survive admin edits.
  private catalogStore = inject(CatalogStore);

  // Private state
  private _promotions = signal<Promotion[]>([]);
  private _loaded = signal(false);
  private _loading = signal(false);
  private _sortOption = signal<PromoSortOption>('discount');
  private _categoryFilter = signal<string | 'all'>('all');
  private _genderFilter = signal<GenderFilter>('all');
  private _colorFilter = signal<string | 'all'>('all');
  private _sizeFilter = signal<string | 'all'>('all');

  // Public read-only state
  readonly loading = computed(() => this._loading() || this.catalogStore.loading());
  readonly sortOption = this._sortOption.asReadonly();
  readonly categoryFilter = this._categoryFilter.asReadonly();
  readonly genderFilter = this._genderFilter.asReadonly();
  readonly colorFilter = this._colorFilter.asReadonly();
  readonly sizeFilter = this._sizeFilter.asReadonly();

  /** Every promotion, any state — the admin Descuentos view */
  readonly allPromotions = computed(() => this._promotions());

  /** Only promos that are neither expired nor depleted — the domain decides, not the UI */
  readonly activePromotions = computed(() =>
    this._promotions().filter(promo => isPromotionActive(promo))
  );

  /** Every active promo joined with its (published) product, before any filtering */
  readonly allPromoProducts = computed<PromoProduct[]>(() => {
    const products = this.catalogStore.allProducts().filter(p => p.published);
    return this.activePromotions()
      .map(promo => {
        const product = products.find(p => p.id === promo.productId);
        return product ? { product, promo } : undefined;
      })
      .filter((item): item is PromoProduct => item !== undefined);
  });

  /** The Promos view: category → gender → color → size → sort (mirrors the catalog) */
  readonly promoProducts = computed<PromoProduct[]>(() => {
    const joined = this.allPromoProducts();
    let products = joined.map(item => item.product);
    products = filterByCategory(products, this._categoryFilter());
    products = filterByGender(products, this._genderFilter());
    products = filterByColor(products, this._colorFilter());
    products = filterBySize(products, this._sizeFilter());
    const allowed = new Set(products.map(p => p.id));
    return sortPromoProducts(
      joined.filter(item => allowed.has(item.product.id)),
      this._sortOption()
    );
  });

  /** Filter options derive from the products actually on promo, like the catalog */
  readonly categories = computed(() =>
    [...new Set(this.allPromoProducts().map(item => item.product.category))].sort()
  );
  readonly availableColors = computed(() =>
    [...new Set(
      this.allPromoProducts().flatMap(item => item.product.variants.map(v => v.color))
    )].sort()
  );
  readonly availableSizes = computed(() =>
    sortSizes([...new Set(
      this.allPromoProducts().flatMap(item => item.product.variants.map(v => v.size))
    )])
  );

  readonly resultsCount = computed(() => this.promoProducts().length);
  /** No active promos at all (different from "filters matched nothing") */
  readonly isEmpty = computed(() => this.allPromoProducts().length === 0);
  /** True when any filter differs from its default */
  readonly hasActiveFilters = computed(() =>
    this._categoryFilter() !== 'all' ||
    this._genderFilter() !== 'all' ||
    this._colorFilter() !== 'all' ||
    this._sizeFilter() !== 'all'
  );

  /** Lookup for other contexts (e.g. product detail): active promo for one product */
  readonly promoByProductId = computed<Map<string, Promotion>>(() =>
    new Map(this.activePromotions().map(promo => [promo.productId, promo]))
  );

  loadPromos(): void {
    this.catalogStore.loadCatalog();
    // Cache-first: reloading would wipe the admin's in-memory promos
    if (this._loaded()) return;
    this._loading.set(true);
    this.promotionsRepository.getPromotions().subscribe({
      next: promotions => {
        this._promotions.set(promotions);
        this._loaded.set(true);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  changeSort(option: PromoSortOption): void {
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
  clearFilters(): void {
    this._categoryFilter.set('all');
    this._genderFilter.set('all');
    this._colorFilter.set('all');
    this._sizeFilter.set('all');
  }

  // ===== Admin commands =====
  // Today they mutate the in-memory list (resets on reload).
  // Tomorrow: POST/DELETE /api/promotions through the repository.

  createPromotion(data: Omit<Promotion, 'id'>): void {
    const promotion: Promotion = { ...data, id: `promo-${Date.now()}` };
    this._promotions.set([...this._promotions(), promotion]);
  }

  deletePromotion(id: string): void {
    this._promotions.set(this._promotions().filter(p => p.id !== id));
  }
}
