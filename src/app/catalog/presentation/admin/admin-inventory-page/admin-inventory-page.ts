import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CatalogStore } from '../../../application/catalog.store';
import { colorLabel, sizeLabel } from '../../../domain/product-filtering';

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
export class AdminInventoryPage implements OnInit {
  readonly store = inject(CatalogStore);
  readonly colorLabel = colorLabel;
  readonly sizeLabel = sizeLabel;

  readonly search = signal('');

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
    const value = Math.max(0, Number(raw) || 0);

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
