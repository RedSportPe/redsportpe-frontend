export interface Variant {
  sku: string;
  gender: 'H' | 'M' | 'U' | 'NO' | 'NA';
  size: string;
  color: string;
  totalStock: number;
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
