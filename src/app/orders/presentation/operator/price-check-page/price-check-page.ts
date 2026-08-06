import { Component, inject, OnInit, signal, viewChild, ElementRef } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CatalogStore } from '../../../../catalog/application/catalog.store';
import { PromotionsStore } from '../../../../promotions/application/promotions.store';
import { colorLabel, sizeLabel } from '../../../../catalog/domain/product-filtering';
import { isValidSku } from '../../../../catalog/domain/sku.value-object';
import { promoPrice, discountPercent } from '../../../../promotions/domain/promotion-rules';
import { ScanDetector } from '../scan-detection';

interface PriceCheckResult {
  imageUrl: string;
  category: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  regularPrice: number;
  promoPrice: number | null;
  discountPercent: number | null;
}

/** Read-only counter tool: the cashier scans a product a customer is asking
 *  about and sees its price/promo/stock — nothing is added to any sale. */
@Component({
  selector: 'app-price-check-page',
  imports: [CurrencyPipe],
  templateUrl: './price-check-page.html',
  styleUrl: './price-check-page.scss',
})
export class PriceCheckPage implements OnInit {
  private catalogStore = inject(CatalogStore);
  private promotionsStore = inject(PromotionsStore);

  readonly colorLabel = colorLabel;
  readonly sizeLabel = sizeLabel;

  private scanBox = viewChild<ElementRef<HTMLInputElement>>('scanBox');
  private scanDetector = new ScanDetector();

  readonly skuCode = signal('');
  readonly result = signal<PriceCheckResult | null>(null);
  readonly notFoundCode = signal<string | null>(null);

  ngOnInit(): void {
    this.catalogStore.loadCatalog();
    this.promotionsStore.loadPromos();
  }

  onScanInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.skuCode.set(value);

    const isScannerBurst = this.scanDetector.observe(value);
    const code = value.trim().toUpperCase();
    if (isScannerBurst && isValidSku(code)) {
      this.lookup();
    }
  }

  lookup(): void {
    const code = this.skuCode().trim().toUpperCase();
    if (!code) return;

    for (const product of this.catalogStore.allProducts()) {
      const variant = product.variants.find(v => v.sku === code);
      if (!variant) continue;

      const promo = this.promotionsStore.promoByProductId().get(product.id);
      this.result.set({
        imageUrl: product.imageUrl,
        category: product.category,
        productName: product.name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        stock: variant.totalStock,
        regularPrice: product.price,
        promoPrice: promo ? promoPrice(product.price, promo) : null,
        discountPercent: promo ? discountPercent(product.price, promo) : null,
      });
      this.notFoundCode.set(null);
      this.clearScanBox();
      this.focusScanner();
      return;
    }
    this.result.set(null);
    this.notFoundCode.set(code);
    this.clearScanBox();
    this.focusScanner();
  }

  private clearScanBox(): void {
    this.skuCode.set('');
    this.scanDetector.reset();
    const box = this.scanBox()?.nativeElement;
    if (box) box.value = '';
  }

  private focusScanner(): void {
    setTimeout(() => this.scanBox()?.nativeElement.focus(), 0);
  }
}
