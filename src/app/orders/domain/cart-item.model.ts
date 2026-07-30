/** An item in the cart references an exact variant by SKU (the Published Language
 *  between Catalog and Orders) plus a snapshot of display data at add-time. */
export interface CartItem {
  sku: string;            // 'RS-CJCN-H-S-NEG' — the exact variant
  productId: string;
  name: string;           // snapshot for display
  imageUrl: string;       // snapshot for display
  size: string;
  color: string;
  unitPrice: number;      // snapshot: price when added
  quantity: number;
  maxStock: number;       // UX limit: can't order more than available
}
