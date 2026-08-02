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
  stock: number;
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

  /** Inventory operates on VARIANTS (SKU is the Published Language), not products */
  readonly rows = computed<StockRow[]>(() => {
    const query = this.search().trim().toLowerCase();
    return this.store.allProducts()
      .flatMap(p =>
        p.variants.map(v => ({
          productId: p.id,
          productName: p.name,
          published: p.published,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.totalStock,
        }))
      )
      .filter(row =>
        !query ||
        row.sku.toLowerCase().includes(query) ||
        row.productName.toLowerCase().includes(query)
      );
  });

  readonly outOfStockCount = computed(() => this.rows().filter(r => r.stock === 0).length);
  readonly lowStockCount = computed(() =>
    this.rows().filter(r => r.stock > 0 && r.stock <= 5).length
  );

  ngOnInit(): void {
    this.store.loadCatalog();
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onStockChange(row: StockRow, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!isNaN(value)) this.store.updateVariantStock(row.productId, row.sku, value);
  }
}
