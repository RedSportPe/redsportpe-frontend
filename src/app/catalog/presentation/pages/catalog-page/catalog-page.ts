import { Component, inject, OnInit } from '@angular/core';
import { CatalogStore } from '../../../application/catalog.store';
import { ProductCard } from '../../components/product-card/product-card';
import { SortOption, SORT_LABELS } from '../../../domain/product-sorting';

@Component({
  selector: 'app-catalog-page',
  imports: [ProductCard],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage implements OnInit {
  readonly store = inject(CatalogStore);

  /** For the template: sort options with their labels */
  readonly sortOptions = Object.entries(SORT_LABELS) as [SortOption, string][];

  ngOnInit(): void {
    this.store.loadCatalog();
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SortOption;
    this.store.changeSort(value);
  }
}
