import { Product } from '../../catalog/domain/product.model';
import { PromoProduct } from './promo-product.model';
import { sortPromoProducts } from './promo-sorting';

function makeItem(id: string, price: number, discountAmount: number): PromoProduct {
  const product: Product = {
    id,
    name: `Product ${id}`,
    description: '',
    category: 'Test',
    price,
    imageUrl: '',
    published: true,
    featured: false,
    salesCount: 0,
    createdAt: '2026-01-01',
    variants: [],
  };
  return { product, promo: { id: `promo-${id}`, productId: id, discountAmount } };
}

describe('sortPromoProducts', () => {
  // 100 - 50 = 50 (50% off) · 200 - 60 = 140 (30% off) · 80 - 8 = 72 (10% off)
  const items = [makeItem('a', 200, 60), makeItem('b', 100, 50), makeItem('c', 80, 8)];

  it('puts the biggest discount percentage first', () => {
    const result = sortPromoProducts(items, 'discount');
    expect(result.map(i => i.product.id)).toEqual(['b', 'a', 'c']);
  });

  it('sorts ascending by the promo price the customer pays, not the regular price', () => {
    const result = sortPromoProducts(items, 'price-asc');
    expect(result.map(i => i.product.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts descending by promo price', () => {
    const result = sortPromoProducts(items, 'price-desc');
    expect(result.map(i => i.product.id)).toEqual(['a', 'c', 'b']);
  });

  it('does not mutate the original array', () => {
    const original = [...items];
    sortPromoProducts(items, 'price-asc');
    expect(items).toEqual(original);
  });
});
