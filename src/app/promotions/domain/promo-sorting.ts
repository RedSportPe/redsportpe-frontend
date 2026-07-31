import { PromoProduct } from './promo-product.model';
import { promoPrice, discountPercent } from './promotion-rules';

export type PromoSortOption = 'discount' | 'price-asc' | 'price-desc';

export const PROMO_SORT_LABELS: Record<PromoSortOption, string> = {
  'discount': 'Mayor descuento',
  'price-asc': 'Precio promo: menor a mayor',
  'price-desc': 'Precio promo: mayor a menor',
};

/** Business rule: price sorts use what the customer actually pays (the promo price).
 *  Default 'discount' puts the most aggressive offers first. */
export function sortPromoProducts(items: PromoProduct[], option: PromoSortOption): PromoProduct[] {
  const sorted = [...items]; // never mutate the original

  switch (option) {
    case 'price-asc':
      return sorted.sort(
        (a, b) => promoPrice(a.product.price, a.promo) - promoPrice(b.product.price, b.promo)
      );
    case 'price-desc':
      return sorted.sort(
        (a, b) => promoPrice(b.product.price, b.promo) - promoPrice(a.product.price, a.promo)
      );
    case 'discount':
      return sorted.sort(
        (a, b) =>
          discountPercent(b.product.price, b.promo) - discountPercent(a.product.price, a.promo)
      );
  }
}
