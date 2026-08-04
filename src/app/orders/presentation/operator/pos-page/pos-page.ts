import { Component, inject, OnInit, signal, computed, viewChild, ElementRef } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CatalogStore } from '../../../../catalog/application/catalog.store';
import { PromotionsStore } from '../../../../promotions/application/promotions.store';
import { OrdersStore } from '../../../application/orders.store';
import { CartItem } from '../../../domain/cart-item.model';
import { Order, PaymentMethod } from '../../../domain/order.model';
import { promoPrice } from '../../../../promotions/domain/promotion-rules';
import { colorLabel } from '../../../../catalog/domain/product-filtering';
import { isValidSku } from '../../../../catalog/domain/sku.value-object';

/** The in-store register: the cashier scans SKUs, the ticket fills up, and the
 *  sale confirms on the spot — cash (amount received → change) or instant QR. */
@Component({
  selector: 'app-pos-page',
  imports: [CurrencyPipe],
  templateUrl: './pos-page.html',
  styleUrl: './pos-page.scss',
})
export class PosPage implements OnInit {
  private catalogStore = inject(CatalogStore);
  private promotionsStore = inject(PromotionsStore);
  private ordersStore = inject(OrdersStore);

  readonly colorLabel = colorLabel;

  private scanBox = viewChild<ElementRef<HTMLInputElement>>('scanBox');

  // Scanning
  readonly skuCode = signal('');
  readonly scanError = signal<string | null>(null);
  /** When the current entry started — a hardware scanner "types" in a burst */
  private entryStartedAt = 0;
  /** Human typing is ~150-300ms per char; scanners run under ~30ms per char */
  private readonly SCANNER_MS_PER_CHAR = 40;

  // The ticket (local to the register — NOT the customer cart)
  readonly ticket = signal<CartItem[]>([]);
  readonly total = computed(() =>
    this.ticket().reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  );
  readonly itemsCount = computed(() =>
    this.ticket().reduce((sum, line) => sum + line.quantity, 0)
  );

  // Payment
  readonly customerName = signal('');
  readonly posPayment = signal<PaymentMethod>('efectivo');
  readonly cashReceived = signal('');
  /** Blocked-confirm feedback: the register shakes and the button pulses */
  readonly posBlocked = signal(false);
  readonly completedSale = signal<Order | null>(null);

  readonly cashAmount = computed(() => Number(this.cashReceived()) || 0);
  readonly change = computed(() =>
    Math.round((this.cashAmount() - this.total()) * 100) / 100
  );
  readonly cashValid = computed(
    () => this.cashReceived().trim() !== '' && this.cashAmount() >= this.total()
  );

  ngOnInit(): void {
    this.catalogStore.loadCatalog();
    this.promotionsStore.loadPromos();  // in-store sales honor active promos too
  }

  onInput(field: 'customerName' | 'cashReceived', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  /** Scanner auto-detection: a USB scanner "types" the whole code in a burst
   *  (<40ms per char). When a COMPLETE valid SKU arrives at that speed, it
   *  registers itself — no Enter, no button. Manual (human-speed) typing
   *  still needs Enter or "Agregar". */
  onScanInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.skuCode() === '' && value !== '') {
      this.entryStartedAt = Date.now();
    }
    this.skuCode.set(value);

    const code = value.trim().toUpperCase();
    if (!isValidSku(code)) return;

    const elapsed = Date.now() - this.entryStartedAt;
    if (elapsed <= value.length * this.SCANNER_MS_PER_CHAR) {
      this.addBySku();
    }
  }

  /** Enter (or the scanner's automatic Enter) adds the scanned SKU to the ticket */
  addBySku(): void {
    const code = this.skuCode().trim().toUpperCase();
    if (!code) return;

    for (const product of this.catalogStore.allProducts()) {
      const variant = product.variants.find(v => v.sku === code);
      if (!variant) continue;

      const existing = this.ticket().find(line => line.sku === code);
      const wanted = (existing?.quantity ?? 0) + 1;
      if (wanted > variant.totalStock) {
        this.scanError.set(`Sin stock suficiente de ${code} (${variant.totalStock} disponibles).`);
        return;
      }

      const promo = this.promotionsStore.promoByProductId().get(product.id);
      const unitPrice = promo ? promoPrice(product.price, promo) : product.price;

      this.ticket.update(lines =>
        existing
          ? lines.map(line =>
              line.sku === code ? { ...line, quantity: line.quantity + 1 } : line
            )
          : [
              ...lines,
              {
                sku: variant.sku,
                productId: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                size: variant.size,
                color: variant.color,
                unitPrice,
                quantity: 1,
                maxStock: variant.totalStock,
              },
            ]
      );
      this.clearScanBox();
      this.scanError.set(null);
      this.focusScanner();
      return;
    }
    this.scanError.set(`SKU no encontrado: ${code}`);
  }

  /** Clears signal AND the DOM input: after signal '' → code → '' in one tick,
   *  Angular sees no net change and won't rewrite the input on its own */
  private clearScanBox(): void {
    this.skuCode.set('');
    const box = this.scanBox()?.nativeElement;
    if (box) box.value = '';
  }

  changeQuantity(sku: string, delta: number): void {
    this.ticket.update(lines =>
      lines.map(line =>
        line.sku === sku
          ? { ...line, quantity: Math.max(1, Math.min(line.quantity + delta, line.maxStock)) }
          : line
      )
    );
  }

  removeLine(sku: string): void {
    this.ticket.update(lines => lines.filter(line => line.sku !== sku));
    this.focusScanner();
  }

  selectPayment(method: PaymentMethod): void {
    this.posPayment.set(method);
  }

  confirmSale(): void {
    if (this.ticket().length === 0) return;
    // Business rule: cash needs the received amount (>= total) BEFORE confirming
    if (this.posPayment() === 'efectivo' && !this.cashValid()) {
      if (!this.posBlocked()) {
        this.posBlocked.set(true);
        setTimeout(() => this.posBlocked.set(false), 1200);
      }
      return;
    }
    const order = this.ordersStore.registerPosSale(
      this.ticket(),
      this.total(),
      this.customerName().trim(),
      {
        method: this.posPayment(),
        cashReceived: this.posPayment() === 'efectivo' ? this.cashAmount() : undefined,
      }
    );
    if (order) {
      this.completedSale.set(order);
      this.ticket.set([]);
    }
  }

  /** Ready for the next customer in line */
  newSale(): void {
    this.completedSale.set(null);
    this.customerName.set('');
    this.cashReceived.set('');
    this.clearScanBox();
    this.scanError.set(null);
    this.focusScanner();
  }

  private focusScanner(): void {
    setTimeout(() => this.scanBox()?.nativeElement.focus(), 0);
  }
}
