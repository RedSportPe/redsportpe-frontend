import { Product } from './product.model';

export type SortOption = 'relevance' | 'price-asc' | 'price-desc';

export const SORT_LABELS: Record<SortOption, string> = {
  'relevance': 'Relevancia',
  'price-asc': 'Precio: menor a mayor',
  'price-desc': 'Precio: mayor a menor',
};

/** Business rule: relevance = most sold first; ties broken by lower price first */
export function sortProducts(products: Product[], option: SortOption): Product[] {
  const sorted = [...products]; // never mutate the original

  switch (option) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'relevance':
      return sorted.sort((a, b) => {
        if (b.salesCount !== a.salesCount) {
          return b.salesCount - a.salesCount;   // more sales first
        }
        return a.price - b.price;               // tie-break: cheaper first
      });
  }
}
