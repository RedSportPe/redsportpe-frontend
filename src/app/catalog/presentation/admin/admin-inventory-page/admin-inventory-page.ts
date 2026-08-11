import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CatalogStore } from '../../../application/catalog.store';
import { colorLabel, sizeLabel } from '../../../domain/product-filtering';
import { UnsavedChangesAware } from '../../../../layout/unsaved-changes.guard';

/** Flat inventory row: one variant = one SKU = one stock number */
interface StockRow {
  productId: string;
  productName: string;
  published: boolean;
  sku: string;
  size: string;
  color: string;
  stock: number;         // what the input shows (draft if edited)
  originalStock: number; // what the catalog currently holds
  modified: boolean;
}

@Component({
  selector: 'app-admin-inventory-page',
  templateUrl: './admin-inventory-page.html',
  styleUrl: './admin-inventory-page.scss',
})
export class AdminInventoryPage implements OnInit, UnsavedChangesAware {
  readonly store = inject(CatalogStore);
  readonly colorLabel = colorLabel;
  readonly sizeLabel = sizeLabel;

  readonly search = signal('');

  /** Blocked-exit feedback: the page shakes and Guardar/Descartar pulse */
  readonly blocked = signal(false);

  hasUnsavedChanges(): boolean {
    return this.pendingCount() > 0;
  }

  notifyBlockedNavigation(): void {
    if (this.blocked()) return;
    this.blocked.set(true);
    setTimeout(() => this.blocked.set(false), 1200);
  }

  /** DRAFT edits (sku → new stock). Nothing touches the catalog until
   *  "Guardar cambios" — a typo must never alter live stock. */
  private _pending = signal<Map<string, number>>(new Map());

  readonly pendingCount = computed(() => this._pending().size);

  /** Inventory operates on VARIANTS (SKU is the Published Language), not products */
  readonly rows = computed<StockRow[]>(() => {
    const query = this.search().trim().toLowerCase();
    const pending = this._pending();
    return this.store.allProducts()
      .flatMap(p =>
        p.variants.map(v => {
          const draft = pending.get(v.sku);
          return {
            productId: p.id,
            productName: p.name,
            published: p.published,
            sku: v.sku,
            size: v.size,
            color: v.color,
            stock: draft ?? v.totalStock,
            originalStock: v.totalStock,
            modified: draft !== undefined,
          };
        })
      )
      .filter(row =>
        !query ||
        row.sku.toLowerCase().includes(query) ||
        row.productName.toLowerCase().includes(query)
      );
  });

  readonly outOfStockCount = computed(() => this.rows().filter(r => r.originalStock === 0).length);
  readonly lowStockCount = computed(() =>
    this.rows().filter(r => r.originalStock > 0 && r.originalStock <= 5).length
  );

  ngOnInit(): void {
    this.store.loadCatalog();
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  /** Typing only updates the draft; same-as-original removes it from the draft */
  onStockInput(row: StockRow, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (raw === '') return; // still typing
    this.setDraft(row, Math.max(0, Number(raw) || 0));
  }

  // ===== Quick +/- adjustment ("llegaron 25") =====
  // The +/- buttons swap into one wide field with an inline ✓; confirming does
  // the math against the CURRENT (draft-aware) stock and feeds the same draft —
  // Guardar cambios / Descartar keep working exactly as before.
  readonly adjustingSku = signal<string | null>(null);
  readonly adjustSign = signal<1 | -1>(1);
  readonly adjustValue = signal('');

  startAdjust(row: StockRow, sign: 1 | -1): void {
    this.adjustingSku.set(row.sku);
    this.adjustSign.set(sign);
    this.adjustValue.set('');
  }

  onAdjustInput(event: Event): void {
    this.adjustValue.set((event.target as HTMLInputElement).value);
  }

  applyAdjust(row: StockRow): void {
    const amount = Math.trunc(Number(this.adjustValue()));
    if (!isNaN(amount) && amount > 0) {
      this.setDraft(row, Math.max(0, row.stock + this.adjustSign() * amount));
    }
    this.cancelAdjust();
  }

  cancelAdjust(): void {
    this.adjustingSku.set(null);
    this.adjustValue.set('');
  }

  /** Single entry point into the draft (manual edits and +/- adjustments alike) */
  private setDraft(row: StockRow, value: number): void {
    const pending = new Map(this._pending());
    if (value === row.originalStock) {
      pending.delete(row.sku);
    } else {
      pending.set(row.sku, value);
    }
    this._pending.set(pending);
  }

  /** Command: apply every drafted change to the catalog at once */
  applyChanges(): void {
    const skuToProduct = new Map(
      this.store.allProducts().flatMap(p => p.variants.map(v => [v.sku, p.id] as const))
    );
    for (const [sku, stock] of this._pending()) {
      const productId = skuToProduct.get(sku);
      if (productId) this.store.updateVariantStock(productId, sku, stock);
    }
    this._pending.set(new Map());
  }

  /** Back out of everything: inputs re-render with the real stock */
  discardChanges(): void {
    this._pending.set(new Map());
  }
}
