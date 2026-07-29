import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CatalogStore } from '../../../application/catalog.store';
import { colorLabel, sizeLabel } from '../../../domain/product-filtering';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  readonly store = inject(CatalogStore);

  readonly colorLabel = colorLabel;
  readonly sizeLabel = sizeLabel;

  // User's current selection
  readonly selectedSize = signal<string | null>(null);
  readonly selectedColor = signal<string | null>(null);

  /** Sizes available for this product (unique, from variants) */
  readonly availableSizes = computed(() => {
    const product = this.store.selectedProduct();
    if (!product) return [];
    return [...new Set(product.variants.map(v => v.size))];
  });

  /** Colors available FOR THE CHOSEN SIZE (narrows as you select) */
  readonly availableColors = computed(() => {
    const product = this.store.selectedProduct();
    if (!product) return [];
    const size = this.selectedSize();
    const variants = size
      ? product.variants.filter(v => v.size === size)
      : product.variants;
    return [...new Set(variants.map(v => v.color))];
  });

  /** THE key computed: size + color resolve to ONE variant (and its SKU) */
  readonly selectedVariant = computed(() => {
    const product = this.store.selectedProduct();
    const size = this.selectedSize();
    const color = this.selectedColor();
    if (!product || !size || !color) return undefined;
    return product.variants.find(v => v.size === size && v.color === color);
  });

  readonly canAddToCart = computed(() => {
    const variant = this.selectedVariant();
    return !!variant && variant.totalStock > 0;
  });

  ngOnInit(): void {
    // Reads the :id from the URL — this is what makes ONE route serve ALL products
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.loadProduct(id);
    }
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
    // Reset color if it's not available in the new size
    if (this.selectedColor() && !this.availableColors().includes(this.selectedColor()!)) {
      this.selectedColor.set(null);
    }
  }

  selectColor(color: string): void {
    this.selectedColor.set(color);
  }

  addToCart(): void {
    const variant = this.selectedVariant();
    if (!variant) return;
    // TODO: Orders context (cart) will take it from here
    console.log('[Add to cart] SKU:', variant.sku, '| stock:', variant.totalStock);
  }
}
