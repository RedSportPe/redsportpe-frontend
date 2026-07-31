import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PromotionsRepository } from '../infrastructure/promotions.repository';
import { CatalogRepository } from '../../catalog/infrastructure/catalog.repository';
import { Product } from '../../catalog/domain/product.model';
import { Promotion } from '../domain/promotion.model';
import { isPromotionActive, discountPercent } from '../domain/promotion-rules';

/** Read model for the Promos page: a product joined with its active promotion.
 *  Products stay in Catalog; Promotions only reference them by productId. */
export interface PromoProduct {
  product: Product;
  promo: Promotion;
}

@Injectable({ providedIn: 'root' })
export class PromotionsStore {
  private promotionsRepository = inject(PromotionsRepository);
  private catalogRepository = inject(CatalogRepository);

  // Private state
  private _promotions = signal<Promotion[]>([]);
  private _products = signal<Product[]>([]);
  private _loading = signal(false);

  // Public read-only state
  readonly loading = this._loading.asReadonly();

  /** Only promos that are neither expired nor depleted — the domain decides, not the UI */
  readonly activePromotions = computed(() =>
    this._promotions().filter(promo => isPromotionActive(promo))
  );

  /** The Promos view: active promos joined with their products, biggest discount first */
  readonly promoProducts = computed<PromoProduct[]>(() => {
    const products = this._products();
    return this.activePromotions()
      .map(promo => {
        const product = products.find(p => p.id === promo.productId);
        return product ? { product, promo } : undefined;
      })
      .filter((item): item is PromoProduct => item !== undefined)
      .sort(
        (a, b) =>
          discountPercent(b.product.price, b.promo) -
          discountPercent(a.product.price, a.promo)
      );
  });

  readonly resultsCount = computed(() => this.promoProducts().length);
  readonly isEmpty = computed(() => this.promoProducts().length === 0);

  /** Lookup for other contexts (e.g. product detail): active promo for one product */
  readonly promoByProductId = computed<Map<string, Promotion>>(() =>
    new Map(this.activePromotions().map(promo => [promo.productId, promo]))
  );

  loadPromos(): void {
    this._loading.set(true);
    forkJoin({
      promotions: this.promotionsRepository.getPromotions(),
      products: this.catalogRepository.getPublishedProducts(),
    }).subscribe({
      next: ({ promotions, products }) => {
        this._promotions.set(promotions);
        this._products.set(products.filter(p => p.published));
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }
}
