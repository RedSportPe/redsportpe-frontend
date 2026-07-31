import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PromotionsStore } from '../../../application/promotions.store';
import { PromoCard } from '../../components/promo-card/promo-card';

@Component({
  selector: 'app-promos-page',
  imports: [RouterLink, PromoCard],
  templateUrl: './promos-page.html',
  styleUrl: './promos-page.scss',
})
export class PromosPage implements OnInit {
  readonly store = inject(PromotionsStore);

  ngOnInit(): void {
    this.store.loadPromos();
  }
}
