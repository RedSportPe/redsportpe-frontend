import { Component, inject, OnInit, signal, computed, viewChild, ElementRef } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { CatalogStore } from '../../../../catalog/application/catalog.store';
import { PromotionsStore } from '../../../../promotions/application/promotions.store';
import { OrdersStore } from '../../../application/orders.store';
import { CartItem } from '../../../domain/cart-item.model';
import { Order, PaymentMethod } from '../../../domain/order.model';
import { promoPrice } from '../../../../promotions/domain/promotion-rules';
import { colorLabel } from '../../../../catalog/domain/product-filtering';
import { isValidSku } from '../../../../catalog/domain/sku.value-object';
import { ScanDetector } from '../scan-detection';
import { ImpresionService } from '../../../../core/services/impresion.service';
import { montoEnLetras } from '../../../domain/amount-in-words';
import { AuthStore } from '../../../../identity/application/auth.store';
import { AgentsStore } from '../../../../identity/application/agents.store';
import { COMPANY } from '../../../../core/company-info';

/** The in-store register: the cashier scans SKUs, the ticket fills up, and the
 *  sale confirms on the spot — cash (amount received → change) or instant QR. */
@Component({
  selector: 'app-pos-page',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './pos-page.html',
  styleUrl: './pos-page.scss',
})
export class PosPage implements OnInit {
  private catalogStore = inject(CatalogStore);
  private promotionsStore = inject(PromotionsStore);
  private ordersStore = inject(OrdersStore);
  private impresionService = inject(ImpresionService);
  private authStore = inject(AuthStore);
  private agentsStore = inject(AgentsStore);

  readonly colorLabel = colorLabel;
  readonly montoEnLetras = montoEnLetras;
  readonly company = COMPANY;

  /** The tienda running this register — feeds the boleta header */
  readonly agent = computed(() =>
    this.agentsStore.byCode(this.authStore.currentUser()?.storeCode ?? 'T1')
  );

  private scanBox = viewChild<ElementRef<HTMLInputElement>>('scanBox');
  private scanDetector = new ScanDetector();

  // Scanning
  readonly skuCode = signal('');
  readonly scanError = signal<string | null>(null);

  // The ticket (local to the register — NOT the customer cart)
  readonly ticket = signal<CartItem[]>([]);
  /** Sum of unitPrice × qty — reflects any per-line "regateo" already applied */
  readonly total = computed(() =>
    this.ticket().reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  );
  /** Sum of catalogPrice × qty — the untouched "precio de lista", used to show the discount */
  readonly subtotal = computed(() =>
    this.ticket().reduce((sum, line) => sum + line.catalogPrice * line.quantity, 0)
  );
  readonly itemsCount = computed(() =>
    this.ticket().reduce((sum, line) => sum + line.quantity, 0)
  );

  // Per-line price editing ("te dejo este buso a S/70")
  readonly editingSku = signal<string | null>(null);
  readonly editPriceValue = signal('');

  // Whole-ticket price override ("todo por S/150")
  readonly totalAdjustmentInput = signal('');

  /** What actually gets charged: the total-level override if the operator set one,
   *  otherwise the line-adjusted total. Layers on top — never replaces line edits. */
  readonly finalTotal = computed(() => {
    const override = this.totalAdjustmentInput().trim();
    if (override !== '') {
      const parsed = Number(override);
      if (!isNaN(parsed) && parsed >= 0) return Math.round(parsed * 100) / 100;
    }
    return this.total();
  });

  readonly discountAmount = computed(() =>
    Math.round((this.subtotal() - this.finalTotal()) * 100) / 100
  );
  readonly hasDiscount = computed(() => this.discountAmount() > 0.009);
  readonly discountReason = signal('');
  /** True once we tried to confirm without a reason for an active discount */
  readonly reasonMissing = signal(false);

  // Payment
  readonly customerName = signal('');
  /** Customer DNI for the boleta — empty prints the generic 00000001 */
  readonly customerDoc = signal('');
  readonly posPayment = signal<PaymentMethod>('efectivo');
  readonly cashReceived = signal('');
  /** 'mixto' only: how much of the total the customer pays in cash — the rest goes to QR */
  readonly mixedCashInput = signal('');
  /** Blocked-confirm feedback: the register shakes and the button pulses */
  readonly posBlocked = signal(false);
  readonly completedSale = signal<Order | null>(null);

  readonly cashAmount = computed(() => Number(this.cashReceived()) || 0);
  readonly change = computed(() =>
    Math.round((this.cashAmount() - this.finalTotal()) * 100) / 100
  );
  readonly cashValid = computed(
    () => this.cashReceived().trim() !== '' && this.cashAmount() >= this.finalTotal()
  );

  /** 'mixto': cash portion the operator typed in */
  readonly mixedCashAmount = computed(() => {
    const n = Number(this.mixedCashInput());
    return isNaN(n) || n < 0 ? 0 : Math.min(n, this.finalTotal());
  });
  /** 'mixto': whatever isn't covered by cash goes through QR/Yape/Plin */
  readonly mixedQrAmount = computed(() =>
    Math.round((this.finalTotal() - this.mixedCashAmount()) * 100) / 100
  );
  readonly mixedValid = computed(() => {
    const cash = this.mixedCashAmount();
    return cash > 0 && cash < this.finalTotal();
  });

  readonly amountInWords = computed(() => montoEnLetras(this.finalTotal()));

  ngOnInit(): void {
    this.catalogStore.loadCatalog();
    this.promotionsStore.loadPromos();  // in-store sales honor active promos too
  }

  onInput(field: 'customerName' | 'customerDoc' | 'cashReceived', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  onMixedCashInput(event: Event): void {
    this.mixedCashInput.set((event.target as HTMLInputElement).value);
  }

  /** Scanner auto-detection: a USB scanner "types" the whole code in a burst.
   *  When a COMPLETE valid SKU arrives at that speed, it registers itself —
   *  no Enter, no button. Manual (human-speed) typing still needs Enter or
   *  "Agregar" (see ScanDetector for the speed heuristic). */
  onScanInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.skuCode.set(value);

    const isScannerBurst = this.scanDetector.observe(value);
    const code = value.trim().toUpperCase();
    if (isScannerBurst && isValidSku(code)) {
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
              catalogPrice: unitPrice,
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
    this.scanDetector.reset();
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

  /** Typing the quantity directly, instead of only +/− */
  setQuantity(sku: string, event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    this.ticket.update(lines =>
      lines.map(line =>
        line.sku === sku
          ? { ...line, quantity: Math.max(1, Math.min(isNaN(raw) ? 1 : Math.trunc(raw), line.maxStock)) }
          : line
      )
    );
  }

  removeLine(sku: string): void {
    this.ticket.update(lines => lines.filter(line => line.sku !== sku));
    this.focusScanner();
  }

  /** Opens the inline price editor for one line ("este buso a S/70") */
  startEditPrice(line: CartItem): void {
    this.editingSku.set(line.sku);
    this.editPriceValue.set(line.unitPrice.toFixed(2));
  }

  cancelEditPrice(): void {
    this.editingSku.set(null);
    this.editPriceValue.set('');
  }

  onEditPriceInput(event: Event): void {
    this.editPriceValue.set((event.target as HTMLInputElement).value);
  }

  /** Confirms the new unit price for ONE line — catalogPrice stays untouched,
   *  so the discount is still visible/traceable afterwards. */
  applyEditPrice(sku: string): void {
    const parsed = Number(this.editPriceValue());
    if (!isNaN(parsed) && parsed >= 0) {
      this.ticket.update(lines =>
        lines.map(line => (line.sku === sku ? { ...line, unitPrice: parsed } : line))
      );
    }
    this.cancelEditPrice();
  }

  onTotalAdjustmentInput(event: Event): void {
    this.totalAdjustmentInput.set((event.target as HTMLInputElement).value);
    this.reasonMissing.set(false);
  }

  onDiscountReasonInput(event: Event): void {
    this.discountReason.set((event.target as HTMLInputElement).value);
    this.reasonMissing.set(false);
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
    // Business rule: mixed payment needs a valid cash portion (between 0 and the total)
    if (this.posPayment() === 'mixto' && !this.mixedValid()) {
      if (!this.posBlocked()) {
        this.posBlocked.set(true);
        setTimeout(() => this.posBlocked.set(false), 1200);
      }
      return;
    }
    // Business rule: any discount (line-level or total-level) needs a written reason
    if (this.hasDiscount() && this.discountReason().trim() === '') {
      this.reasonMissing.set(true);
      return;
    }
    const order = this.ordersStore.registerPosSale(
      this.ticket(),
      this.finalTotal(),
      this.customerName().trim(),
      {
        method: this.posPayment(),
        cashReceived:
          this.posPayment() === 'efectivo' ? this.cashAmount()
            : this.posPayment() === 'mixto' ? this.mixedCashAmount()
              : undefined,
        qrAmount: this.posPayment() === 'mixto' ? this.mixedQrAmount() : undefined,
      },
      this.hasDiscount()
        ? { subtotal: this.subtotal(), reason: this.discountReason().trim() }
        : undefined,
      this.customerDoc()
    );
    if (order) {
      this.completedSale.set(order);
      this.ticket.set([]);
      this.totalAdjustmentInput.set('');
      this.discountReason.set('');
      this.mixedCashInput.set('');
      // Zero-click printing via the local print bridge (ESC/POS over USB).
      // Falls back to window.print() if the bridge isn't running.
      this.imprimirBoleta(order);
    }
  }

  printReceiptAgain(): void {
    const order = this.completedSale();
    if (order) this.imprimirBoleta(order);
  }

  private async imprimirBoleta(order: Order): Promise<void> {
    try {
      await this.impresionService.imprimirBoleta(order);
    } catch (e) {
      console.warn('Print bridge no disponible, usando window.print()', e);
      window.print();
    }
  }

  /** Ready for the next customer in line */
  newSale(): void {
    this.completedSale.set(null);
    this.customerName.set('');
    this.customerDoc.set('');
    this.cashReceived.set('');
    this.mixedCashInput.set('');
    this.totalAdjustmentInput.set('');
    this.discountReason.set('');
    this.reasonMissing.set(false);
    this.clearScanBox();
    this.scanError.set(null);
    this.focusScanner();
  }

  private focusScanner(): void {
    setTimeout(() => this.scanBox()?.nativeElement.focus(), 0);
  }
}
