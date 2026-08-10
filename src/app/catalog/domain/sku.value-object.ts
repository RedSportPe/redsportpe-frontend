/** SKU — the Published Language between Catalog, Orders and Inventory.
 *  Format: [BRAND]-[PRODUCT]-[GENDER]-[SIZE]-[COLOR]-[STORE]
 *  e.g. RS-CJCN-H-L-ROJ-T1
 *  - Brand: RS (RedSport), AD (Adidas), NK (Nike).
 *  - Product: garment type + model abbreviation (CJ + CN = CJCN).
 *  - Gender: H (hombre), M (mujer), U (unisex adulto), NO (niño), NA (niña).
 *  - Size: adults (H/M/U) wear S-XXL; kids (NO/NA) wear EVEN sizes 4-16.
 *    Gender and size must agree — that's a business rule, not just a format.
 *  - Color: 3-letter code, extensible by the admin (COLOR_LABELS + ColorsStore).
 *  - Store: T+number (T1 = Tienda 1). Stock lives per STORE (no warehouses:
 *    stores prepare and dispatch the online orders too). */

export const BRAND_CODES: Record<string, string> = {
  RS: 'RedSport',
  AD: 'Adidas',
  NK: 'Nike',
};

// NOTE: the tienda list itself (T1…TN, addresses, boleta series) lives in
// identity/domain/commercial-agent.model.ts — the admin manages it at
// /admin/agentes. The SKU only validates the T\d+ shape.

export const ADULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
/** Kids sizes are EVEN numbers only, 4 through 16 */
export const KID_SIZES = ['4', '6', '8', '10', '12', '14', '16'];

const KID_GENDERS = ['NO', 'NA'];

const SKU_PATTERN =
  /^(RS|AD|NK)-[A-Z0-9]{2,6}-(H|M|U|NO|NA)-(4|6|8|10|12|14|16|S|M|L|XL|XXL)-[A-Z]{3}-T\d+$/;

export function isValidSku(value: string): boolean {
  if (!SKU_PATTERN.test(value)) return false;
  const [, , gender, size] = value.split('-');
  // Business rule: kids wear even numeric sizes, adults wear letter sizes
  return KID_GENDERS.includes(gender)
    ? KID_SIZES.includes(size)
    : ADULT_SIZES.includes(size);
}

/** Builds a SKU from its parts; throws if the result breaks format or rules */
export function buildSku(
  brand: string,
  productCode: string,
  gender: string,
  size: string,
  color: string,
  store: string
): string {
  const sku = `${brand}-${productCode}-${gender}-${size}-${color}-${store}`.toUpperCase();
  if (!isValidSku(sku)) {
    throw new Error(`Invalid SKU: ${sku}`);
  }
  return sku;
}

/** The sizes a given gender can wear (drives the admin variant editor) */
export function sizesForGender(gender: string): string[] {
  return KID_GENDERS.includes(gender) ? KID_SIZES : ADULT_SIZES;
}
