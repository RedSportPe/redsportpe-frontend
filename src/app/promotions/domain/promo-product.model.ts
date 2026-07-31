import { Product } from '../../catalog/domain/product.model';
import { Promotion } from './promotion.model';

/** Read model for the Promos page: a product joined with its active promotion.
 *  Products stay in Catalog; Promotions only reference them by productId. */
export interface PromoProduct {
  product: Product;
  promo: Promotion;
}
