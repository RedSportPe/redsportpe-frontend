export class Sku {
  private constructor(readonly value: string) {}

  /** Creates a SKU validating the RS-PRODUCT-GENDER-SIZE-COLOR format */
  static create(value: string): Sku {
    const pattern = /^RS-[A-Z0-9]{2,6}-(M|W|U)-(XS|S|M|L|XL|XXL)-[A-Z]{3}$/;
    if (!pattern.test(value)) {
      throw new Error(`Invalid SKU: ${value}`);
    }
    return new Sku(value);
  }

  static generate(product: string, gender: 'M' | 'W' | 'U', size: string, color: string): Sku {
    return Sku.create(`RS-${product}-${gender}-${size}-${color}`.toUpperCase());
  }

  equals(other: Sku): boolean {
    return this.value === other.value;
  }
}
