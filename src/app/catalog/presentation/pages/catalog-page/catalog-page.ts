import { Component, inject, OnInit } from '@angular/core';
import { CatalogStore } from '../../../application/catalog.store';
import { ProductCard } from '../../components/product-card/product-card';
import { SortOption, SORT_LABELS } from '../../../domain/product-sorting';
import { GenderFilter, GENDER_LABELS, colorLabel, sizeLabel } from '../../../domain/product-filtering';

@Component({
  selector: 'app-catalog-page',
  imports: [ProductCard],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage implements OnInit {
  readonly store = inject(CatalogStore);

  readonly sortOptions = Object.entries(SORT_LABELS) as [SortOption, string][];
  readonly genderOptions = Object.entries(GENDER_LABELS) as [GenderFilter, string][];
  readonly colorLabel = colorLabel;
  readonly sizeLabel = sizeLabel;

  /** Placeholder cards for the skeleton loader */
  readonly skeletonItems = Array.from({ length: 6 });

  ngOnInit(): void {
    this.store.loadCatalog();
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SortOption;
    this.store.changeSort(value);
  }

  onCategoryChange(event: Event): void {
    this.store.changeCategory((event.target as HTMLSelectElement).value);
  }

  onGenderChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as GenderFilter;
    this.store.changeGender(value);
  }

  onColorChange(event: Event): void {
    this.store.changeColor((event.target as HTMLSelectElement).value);
  }

  onSizeChange(event: Event): void {
    this.store.changeSize((event.target as HTMLSelectElement).value);
  }
}
