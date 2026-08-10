import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { CatalogStore } from '../../../application/catalog.store';
import { colorLabel, sizeLabel } from '../../../domain/product-filtering';
import { CartStore } from '../../../../orders/application/cart.store';
import { PromotionsStore } from '../../../../promotions/application/promotions.store';
import { AuthStore } from '../../../../identity/application/auth.store';
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
  private authStore = inject(AuthStore);
  readonly store = inject(CatalogStore);

  /** Business rule: no anonymous favorites — hearting requires an account */
  onFavoriteClick(productId: string): void {
    if (!this.authStore.isAuthenticated()) {
      this.authStore.openModal('login');
      return;
    }
    this.store.toggleFavorite(productId);
  }

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

  // ===== Image gallery =====
  /** How many thumbnails fit beside the main image before arrows are needed */
  readonly THUMB_WINDOW = 4;
  readonly selectedImageIndex = signal(0);
  private thumbStart = signal(0);

  readonly galleryImages = computed(() => {
    const product = this.store.selectedProduct();
    if (!product) return [];
    return product.images?.length ? product.images : [product.imageUrl];
  });

  readonly selectedImage = computed(
    () => this.galleryImages()[this.selectedImageIndex()] ?? this.galleryImages()[0]
  );

  /** The sliding window of visible thumbnails (start index kept for selection) */
  readonly visibleThumbs = computed(() =>
    this.galleryImages()
      .map((src, index) => ({ src, index }))
      .slice(this.thumbStart(), this.thumbStart() + this.THUMB_WINDOW)
  );

  /** Arrows only exist when the admin uploaded more images than the window fits */
  readonly hasThumbOverflow = computed(() => this.galleryImages().length > this.THUMB_WINDOW);
  readonly canScrollUp = computed(() => this.thumbStart() > 0);
  readonly canScrollDown = computed(
    () => this.thumbStart() + this.THUMB_WINDOW < this.galleryImages().length
  );

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  scrollThumbs(direction: 1 | -1): void {
    const max = Math.max(0, this.galleryImages().length - this.THUMB_WINDOW);
    this.thumbStart.update(start => Math.min(max, Math.max(0, start + direction)));
  }

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
    // Subscribed (not snapshot): product→product navigation reuses this
    // component, and every product change must reset gallery + selection
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.store.loadProduct(id);
      this.selectedImageIndex.set(0);
      this.thumbStart.set(0);
      this.selectedSize.set(null);
      this.selectedColor.set(null);
    });
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
      catalogPrice: this.effectivePrice(),  // online store: no negotiation, same as unitPrice
      unitPrice: this.effectivePrice(),  // snapshot: promo price if one is active
      maxStock: variant.totalStock,
    });
    this.justAdded.set(true);
    setTimeout(() => this.justAdded.set(false), 2000);
  }

}
