import { isValidSku, buildSku, sizesForGender, ADULT_SIZES, KID_SIZES } from './sku.value-object';

describe('sku', () => {
  it('accepts the new format [BRAND]-[PRODUCT]-[GENDER]-[SIZE]-[COLOR]-[STORE]', () => {
    expect(isValidSku('RS-CJCN-H-L-ROJ-T1')).toBe(true);
    expect(isValidSku('AD-PDRF-M-S-NEG-T1')).toBe(true);
    expect(isValidSku('NK-HOOD-U-XXL-GRI-T2')).toBe(true);
  });

  it('accepts kids EVEN sizes 4-16 only for NO/NA', () => {
    expect(isValidSku('RS-CJCN-NO-4-AZU-T1')).toBe(true);
    expect(isValidSku('RS-CJCN-NA-16-ROJ-T1')).toBe(true);
    expect(isValidSku('RS-CJCN-NO-5-AZU-T1')).toBe(false);   // odd size doesn't exist
    expect(isValidSku('RS-CJCN-NO-M-AZU-T1')).toBe(false);   // kids don't wear letter sizes
  });

  it('rejects adult genders with kid sizes (and vice versa)', () => {
    expect(isValidSku('RS-CJCN-H-12-NEG-T1')).toBe(false);   // hombre with kid size
    expect(isValidSku('RS-CJCN-U-8-NEG-T1')).toBe(false);    // unisex adulto with kid size
    expect(isValidSku('RS-CJCN-H-S-NEG-T1')).toBe(true);
  });

  it('rejects malformed SKUs', () => {
    expect(isValidSku('XX-CJCN-H-S-NEG-T1')).toBe(false);    // unknown brand
    expect(isValidSku('RS-CJCN-H-S-NEG')).toBe(false);       // missing store suffix
    expect(isValidSku('RS-CJCN-H-S-NEGRO-T1')).toBe(false);  // color must be 3 letters
    expect(isValidSku('RS-CJCN-X-S-NEG-T1')).toBe(false);    // unknown gender
  });

  it('builds and uppercases from parts', () => {
    expect(buildSku('rs', 'cjcn', 'h', 'l', 'roj', 't1')).toBe('RS-CJCN-H-L-ROJ-T1');
  });

  it('throws when the parts produce an invalid SKU', () => {
    expect(() => buildSku('RS', 'C', 'H', 'S', 'NEG', 'T1')).toThrow();  // code too short
    expect(() => buildSku('RS', 'CJCN', 'NO', 'S', 'NEG', 'T1')).toThrow(); // kid with adult size
  });

  it('sizesForGender drives the admin variant editor', () => {
    expect(sizesForGender('NO')).toEqual(KID_SIZES);
    expect(sizesForGender('NA')).toEqual(KID_SIZES);
    expect(sizesForGender('H')).toEqual(ADULT_SIZES);
    expect(sizesForGender('U')).toEqual(ADULT_SIZES);
  });
});
