export interface Variant {
  sku: string;              // 'RS-CJCN-H-S-NEG'
  gender: 'H' | 'M' | 'U';  // SKU values kept as originally defined
  size: string;
  color: string;
  totalStock: number;       // sum across warehouses (never the breakdown)
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;            // in soles (PEN)
  imageUrl: string;
  published: boolean;
  featured: boolean;
  salesCount: number;
  variants: Variant[];
}
