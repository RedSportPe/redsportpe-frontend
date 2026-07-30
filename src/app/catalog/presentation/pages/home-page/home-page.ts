import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogStore } from '../../../application/catalog.store';
import { TrendsCarousel } from '../../components/trends-carousel/trends-carousel';
import { ProductCard } from '../../components/product-card/product-card';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, TrendsCarousel, ProductCard],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  readonly store = inject(CatalogStore);

  /** TODO: replace with the real WhatsApp Community invite link */
  readonly whatsappCommunityUrl = 'https://chat.whatsapp.com/';

  ngOnInit(): void {
    this.store.loadCatalog();
  }
}
