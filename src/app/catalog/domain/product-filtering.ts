import { Product } from './product.model';

export type GenderFilter = 'all' | 'H' | 'M' | 'NO' | 'NA';

export const GENDER_LABELS: Record<GenderFilter, string> = {
  'all': 'Todos',
  'H': 'Hombre',
  'M': 'Mujer',
  'NO': 'Niño',
  'NA': 'Niña',
};

/** Official SKU color codes table (part of the ubiquitous language).
 *  Extensible at runtime: the admin can add colors (JAD = Jade) from the
 *  product form via ColorsStore, which calls registerColor below. */
export const COLOR_LABELS: Record<string, string> = {
  'NEG': 'Negro',
  'ROJ': 'Rojo',
  'GRI': 'Gris',
  'BLA': 'Blanco',
  'AZU': 'Azul',
  'BEI': 'Beige',
};

/** Runtime extension point — keeps colorLabel() working app-wide for new colors */
export function registerColor(code: string, label: string): void {
  COLOR_LABELS[code] = label;
}

/** Translates a SKU color code to its display name (falls back to the code) */
export function colorLabel(code: string): string {
  return COLOR_LABELS[code] ?? code;
}

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

/** Business rule: a product matches a color if ANY of its variants has it */
export function filterByColor(products: Product[], colorCode: string | 'all'): Product[] {
  if (colorCode === 'all') return products;
  return products.filter(p => p.variants.some(v => v.color === colorCode));
}
/** Official size order (part of the ubiquitous language):
 *  kids EVEN sizes first (4-16, for NO/NA), then adult sizes S to XXL */
export const SIZE_ORDER: string[] = ['4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL', 'XXL'];

export const SIZE_LABELS: Record<string, string> = {
  '4': '4', '6': '6', '8': '8', '10': '10', '12': '12', '14': '14', '16': '16',
  'S': 'S (Small)',
  'M': 'M (Medium)',
  'L': 'L (Large)',
  'XL': 'XL (XLarge)',
  'XXL': 'XXL (XXLarge)',
};

/** Sorts size codes by their natural business order, not alphabetically */
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
}

export function sizeLabel(code: string): string {
  return SIZE_LABELS[code] ?? code;
}

/** Business rule: a product matches a size if ANY of its variants has it */
export function filterBySize(products: Product[], size: string | 'all'): Product[] {
  if (size === 'all') return products;
  return products.filter(p => p.variants.some(v => v.size === size));
}
