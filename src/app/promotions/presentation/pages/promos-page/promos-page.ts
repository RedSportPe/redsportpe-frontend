import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PromotionsStore } from '../../../application/promotions.store';
import { PromoCard } from '../../components/promo-card/promo-card';
import { PromoSortOption, PROMO_SORT_LABELS } from '../../../domain/promo-sorting';
import {
  GenderFilter,
  GENDER_LABELS,
  colorLabel,
  sizeLabel,
} from '../../../../catalog/domain/product-filtering';

@Component({
  selector: 'app-promos-page',
  imports: [RouterLink, PromoCard],
  templateUrl: './promos-page.html',
  styleUrl: './promos-page.scss',
})
export class PromosPage implements OnInit {
  readonly store = inject(PromotionsStore);

  readonly sortOptions = Object.entries(PROMO_SORT_LABELS) as [PromoSortOption, string][];
  readonly genderOptions = Object.entries(GENDER_LABELS) as [GenderFilter, string][];
  readonly colorLabel = colorLabel;
  readonly sizeLabel = sizeLabel;

  ngOnInit(): void {
    this.store.loadPromos();
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PromoSortOption;
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
