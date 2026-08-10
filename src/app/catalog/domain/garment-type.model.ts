/** The first segment of a product's SKU code: what KIND of garment it is
 *  (Conjunto, Casaca, Pantalón...). Combined with a per-model abbreviation
 *  to build the full code, e.g. 'CJ' + 'TP' = 'CJTP' (Conjunto Tiburón Princesa). */
export interface GarmentType {
  code: string;   // 1-3 uppercase letters, e.g. 'CJ'
  label: string;  // e.g. 'Conjunto'
}

/** Seed list — extensible at runtime from the admin form (see GarmentTypesStore) */
export const DEFAULT_GARMENT_TYPES: GarmentType[] = [
  { code: 'CJ', label: 'Conjunto' },
  { code: 'C', label: 'Casaca' },
  { code: 'P', label: 'Pantalón' },
  { code: 'T', label: 'Polo' },
  { code: 'S', label: 'Short' },
];

const GARMENT_TYPE_PATTERN = /^[A-Z]{1,3}$/;

export function isValidGarmentTypeCode(code: string): boolean {
  return GARMENT_TYPE_PATTERN.test(code);
}

/** Splits a legacy/combined product code (e.g. 'CJTP') back into its garment
 *  type + model abbreviation, matching the LONGEST known type code first so
 *  'CJ' doesn't wrongly swallow into a type coded just 'C'. Returns null if no
 *  known type matches the start of the code (older/manual codes). */
export function splitProductCode(
  fullCode: string,
  types: GarmentType[]
): { typeCode: string; modelCode: string } | null {
  const sorted = [...types].sort((a, b) => b.code.length - a.code.length);
  for (const type of sorted) {
    if (fullCode.startsWith(type.code)) {
      return { typeCode: type.code, modelCode: fullCode.slice(type.code.length) };
    }
  }
  return null;
}
