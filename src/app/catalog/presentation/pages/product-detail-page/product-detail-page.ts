import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { CatalogStore } from '../../../application/catalog.store';
import { colorLabel, sizeLabel } from '../../../domain/product-filtering';
import { CartStore } from '../../../../orders/application/cart.store';
import { PromotionsStore } from '../../../../promotions/application/promotions.store';
import {
  promoPrice,
  discountPercent,
  remainingPromoUnits,
} from '../../../../promotions/domain/promotion-rules';
@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private cartStore = inject(CartStore);
  private promotionsStore = inject(PromotionsStore);
  readonly store = inject(CatalogStore);

  readonly colorLabel = colorLabel;
  readonly sizeLabel = sizeLabel;
  readonly discountPercent = discountPercent;
  readonly remainingPromoUnits = remainingPromoUnits;

  /** Active promo for this product, if any (Promotions context decides) */
  readonly activePromo = computed(() => {
    const product = this.store.selectedProduct();
    if (!product) return undefined;
    return this.promotionsStore.promoByProductId().get(product.id);
  });

  /** What the customer actually pays per unit: promo price if active, regular otherwise */
  readonly effectivePrice = computed(() => {
    const product = this.store.selectedProduct();
    if (!product) return 0;
    const promo = this.activePromo();
    return promo ? promoPrice(product.price, promo) : product.price;
  });
  readonly justAdded = signal(false);
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
    // Promos affect the price shown here, so this page needs them loaded too
    this.promotionsStore.loadPromos();
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
    const product = this.store.selectedProduct();
    const variant = this.selectedVariant();
    if (!product || !variant) return;

    this.cartStore.addItem({
      sku: variant.sku,
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      size: variant.size,
      color: variant.color,
      unitPrice: this.effectivePrice(),  // snapshot: promo price if one is active
      maxStock: variant.totalStock,
    });
    this.justAdded.set(true);
    setTimeout(() => this.justAdded.set(false), 2000);
  }

}
