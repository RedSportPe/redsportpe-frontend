import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { PromotionsStore } from '../../../application/promotions.store';
import { CatalogStore } from '../../../../catalog/application/catalog.store';
import { Promotion } from '../../../domain/promotion.model';
import {
  isExpired,
  isDepleted,
  promoPrice,
  discountPercent,
  remainingPromoUnits,
} from '../../../domain/promotion-rules';

@Component({
  selector: 'app-admin-promos-page',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './admin-promos-page.html',
  styleUrl: './admin-promos-page.scss',
})
export class AdminPromosPage implements OnInit {
  readonly store = inject(PromotionsStore);
  readonly catalogStore = inject(CatalogStore);

  readonly promoPrice = promoPrice;
  readonly discountPercent = discountPercent;
  readonly remainingPromoUnits = remainingPromoUnits;

  // Form state — mirrors the business flow: product, amount to subtract,
  // optional deadline, optional unit cap
  readonly productId = signal('');
  readonly discountAmount = signal(0);
  readonly endsAt = signal('');     // '' = no deadline
  readonly maxUnits = signal('');   // '' = whole stock

  readonly selectedProduct = computed(() =>
    this.catalogStore.allProducts().find(p => p.id === this.productId())
  );

  /** Live preview: "S/ 139.90 → S/ 100.90 (-28%)" */
  readonly preview = computed(() => {
    const product = this.selectedProduct();
    const amount = this.discountAmount();
    if (!product || amount <= 0 || amount >= product.price) return null;
    const promo = { id: '', productId: product.id, discountAmount: amount };
    return {
      regular: product.price,
      promo: promoPrice(product.price, promo),
      percent: discountPercent(product.price, promo),
    };
  });

  /** Business rule: one active promo per product */
  readonly productAlreadyOnPromo = computed(() =>
    this.store.activePromotions().some(p => p.productId === this.productId())
  );

  readonly canCreate = computed(() => {
    const product = this.selectedProduct();
    if (!product || this.productAlreadyOnPromo()) return false;
    const amount = this.discountAmount();
    if (amount <= 0 || amount >= product.price) return false;
    const units = this.maxUnits().trim();
    if (units !== '' && (!/^\d+$/.test(units) || Number(units) <= 0)) return false;
    return true;
  });

  ngOnInit(): void {
    this.store.loadPromos();
  }

  onProduct(event: Event): void {
    this.productId.set((event.target as HTMLSelectElement).value);
  }

  onAmount(event: Event): void {
    this.discountAmount.set(Number((event.target as HTMLInputElement).value) || 0);
  }

  onEndsAt(event: Event): void {
    this.endsAt.set((event.target as HTMLInputElement).value);
  }

  onMaxUnits(event: Event): void {
    this.maxUnits.set((event.target as HTMLInputElement).value);
  }

  create(): void {
    if (!this.canCreate()) return;
    this.store.createPromotion({
      productId: this.productId(),
      discountAmount: this.discountAmount(),
      endsAt: this.endsAt() || undefined,
      maxUnits: this.maxUnits().trim() ? Number(this.maxUnits()) : undefined,
      unitsSold: this.maxUnits().trim() ? 0 : undefined,
    });
    this.productId.set('');
    this.discountAmount.set(0);
    this.endsAt.set('');
    this.maxUnits.set('');
  }

  productName(promo: Promotion): string {
    return (
      this.catalogStore.allProducts().find(p => p.id === promo.productId)?.name ??
      `(producto ${promo.productId})`
    );
  }

  productPrice(promo: Promotion): number {
    return this.catalogStore.allProducts().find(p => p.id === promo.productId)?.price ?? 0;
  }

  status(promo: Promotion): 'Activa' | 'Expirada' | 'Agotada' {
    if (isExpired(promo)) return 'Expirada';
    if (isDepleted(promo)) return 'Agotada';
    return 'Activa';
  }
}
