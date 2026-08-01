/** SKU — the Published Language between Catalog, Orders and Inventory.
 *  Format: RS-[PRODUCT]-[GENDER]-[SIZE]-[COLOR], e.g. RS-CJCN-H-S-NEG.
 *  Gender: H (hombre), M (mujer), U (unisex adulto), NO (niño), NA (niña).
 *  Sizes: 8-16 kids, S-XXL adults. Colors: 3-letter codes (COLOR_LABELS). */
const SKU_PATTERN = /^RS-[A-Z0-9]{2,6}-(H|M|U|NO|NA)-(8|10|12|14|16|S|M|L|XL|XXL)-[A-Z]{3}$/;

export function isValidSku(value: string): boolean {
  return SKU_PATTERN.test(value);
}

/** Builds a SKU from its parts; throws if the result breaks the format */
export function buildSku(productCode: string, gender: string, size: string, color: string): string {
  const sku = `RS-${productCode}-${gender}-${size}-${color}`.toUpperCase();
  if (!isValidSku(sku)) {
    throw new Error(`Invalid SKU: ${sku}`);
  }
  return sku;
}
