import { Product } from './product.model';

/** Normalizes text: lowercase, no accents, trimmed */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strips accents: cásaca → casaca
    .trim();
}

/** Levenshtein distance: how many single-letter edits between two words */
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}

/** A query word matches a text word if it's contained OR is 1 typo away (for words 4+) */
function wordMatches(queryWord: string, textWord: string): boolean {
  if (textWord.includes(queryWord)) return true;
  if (queryWord.length >= 4) {
    return editDistance(queryWord, textWord) <= 1;   // "gim" won't reach here, but "jaket"→"jacket" will
  }
  return false;
}

/** Business rule: every query word must match somewhere in the product's
 *  name, description or category (any order) */
export function searchProducts(products: Product[], query: string): Product[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return products;

  const queryWords = normalizedQuery.split(/\s+/);

  return products.filter(product => {
    const haystack = normalize(`${product.name} ${product.description} ${product.category}`);
    const textWords = haystack.split(/\s+/);

    return queryWords.every(qw =>
      haystack.includes(qw) || textWords.some(tw => wordMatches(qw, tw))
    );
  });
}
