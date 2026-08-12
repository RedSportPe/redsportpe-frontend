import { Component, inject, signal, computed } from '@angular/core';
import { CatalogStore } from '../../../../catalog/application/catalog.store';
import { LabelPrintStore } from '../../../application/label-print.store';
import { colorLabel } from '../../../../catalog/domain/product-filtering';

@Component({
  selector: 'app-label-print-page',
  imports: [],
  templateUrl: './label-print-page.html',
  styleUrl: './label-print-page.scss',
})
export class LabelPrintPage {
  readonly catalog = inject(CatalogStore);
  readonly printQueue = inject(LabelPrintStore);
  readonly colorLabel = colorLabel;

  readonly search = signal('');
  readonly sending = signal(false);
  readonly sent = signal(false);

  readonly filteredProducts = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.catalog.products();
    return this.catalog.products().filter(p => p.name.toLowerCase().includes(q));
  });

  addVariant(productName: string, imageUrl: string, variant: { sku: string; size: string; color: string }): void {
    this.printQueue.addToQueue({ sku: variant.sku, productName, imageUrl, size: variant.size, color: variant.color });
  }

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setQuantity(sku: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!isNaN(value)) this.printQueue.setQuantity(sku, value);
  }

  async print(): Promise<void> {
    this.sending.set(true);
    const result = await this.printQueue.sendToPrinter();
    this.sending.set(false);
    if (result.success) {
      this.sent.set(true);
      setTimeout(() => this.sent.set(false), 2500);
    }
  }
}
