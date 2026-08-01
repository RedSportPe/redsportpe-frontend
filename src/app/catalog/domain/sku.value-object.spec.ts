import { isValidSku, buildSku } from './sku.value-object';

describe('sku', () => {
  it('accepts real catalog SKUs (adults and kids)', () => {
    expect(isValidSku('RS-CJCN-H-S-NEG')).toBe(true);
    expect(isValidSku('RS-PDRF-NO-12-ROJ')).toBe(true);
    expect(isValidSku('RS-HOOD-U-XXL-NEG')).toBe(true);
  });

  it('rejects malformed SKUs', () => {
    expect(isValidSku('RS-CJCN-X-S-NEG')).toBe(false);   // unknown gender
    expect(isValidSku('RS-CJCN-H-9-NEG')).toBe(false);   // size outside the table
    expect(isValidSku('CJCN-H-S-NEG')).toBe(false);      // missing RS prefix
  });

  it('builds and uppercases from parts', () => {
    expect(buildSku('cjcn', 'h', 's', 'neg')).toBe('RS-CJCN-H-S-NEG');
  });

  it('throws when the parts produce an invalid SKU', () => {
    expect(() => buildSku('C', 'H', 'S', 'NEG')).toThrow();  // code too short
  });
});
