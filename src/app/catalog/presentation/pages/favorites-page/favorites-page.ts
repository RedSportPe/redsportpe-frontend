import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogStore } from '../../../application/catalog.store';
import { ProductCard } from '../../components/product-card/product-card';
import { AuthStore } from '../../../../identity/application/auth.store';

@Component({
  selector: 'app-favorites-page',
  imports: [RouterLink, ProductCard],
  templateUrl: './favorites-page.html',
  styleUrl: './favorites-page.scss',
})
export class FavoritesPage implements OnInit {
  readonly store = inject(CatalogStore);
  readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    // Favorites hold product ids; the catalog provides the full products
    this.store.loadCatalog();
  }
}
