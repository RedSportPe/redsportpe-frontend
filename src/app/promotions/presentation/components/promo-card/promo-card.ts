import { Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PromoProduct } from '../../../domain/promo-product.model';
import {
  promoPrice,
  discountPercent,
  remainingPromoUnits,
} from '../../../domain/promotion-rules';
import { isSoldOut } from '../../../../catalog/domain/product-badges';

@Component({
  selector: 'app-promo-card',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './promo-card.html',
  styleUrl: './promo-card.scss',
})
export class PromoCard {
  item = input.required<PromoProduct>();

  readonly promoPrice = promoPrice;
  readonly discountPercent = discountPercent;
  readonly remainingPromoUnits = remainingPromoUnits;
  readonly isSoldOut = isSoldOut;
}
