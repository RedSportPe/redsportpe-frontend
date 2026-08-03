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
  /** Cover image — always the first of `images` when the gallery exists */
  imageUrl: string;
  /** Full gallery (admin-uploaded). Today they are data URLs in memory;
   *  tomorrow the backend stores files and these become CDN URLs. */
  images?: string[];
  published: boolean;
  featured: boolean;
  salesCount: number;
  createdAt: string;   // ISO date, used for the "Nuevo" badge
  variants: Variant[];
}
