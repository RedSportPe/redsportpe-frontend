import { Product } from './product.model';

/** Total stock across all variants */
export function totalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.totalStock, 0);
}

/** Business rule: sold out = no stock in any variant */
export function isSoldOut(product: Product): boolean {
  return totalStock(product) === 0;
}

/** Business rule: low stock = 1 to 5 units left in total */
export function isLowStock(product: Product): boolean {
  const stock = totalStock(product);
  return stock > 0 && stock <= 5;
}

/** Business rule: new = created within the last 30 days */
export function isNew(product: Product): boolean {
  const created = new Date(product.createdAt).getTime();
  const daysAgo = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return daysAgo <= 30;
}
