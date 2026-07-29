import { Product } from './product.model';

export type GenderFilter = 'all' | 'H' | 'M' | 'NO' | 'NA';

export const GENDER_LABELS: Record<GenderFilter, string> = {
  'all': 'Todos',
  'H': 'Hombre',
  'M': 'Mujer',
  'NO': 'Niño',
  'NA': 'Niña',
};

/** Business rule: a product matches a category filter by exact category name */
export function filterByCategory(products: Product[], category: string | 'all'): Product[] {
  if (category === 'all') return products;
  return products.filter(p => p.category === category);
}

/** Business rule: a product matches a gender if ANY of its variants matches.
 *  'U' (unisex) variants match both Hombre and Mujer. */
export function filterByGender(products: Product[], gender: GenderFilter): Product[] {
  if (gender === 'all') return products;
  return products.filter(p =>
    p.variants.some(v =>
      v.gender === gender ||
      (v.gender === 'U' && (gender === 'H' || gender === 'M'))
    )
  );
}
