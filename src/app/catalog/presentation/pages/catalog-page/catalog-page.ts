import { Component, inject, OnInit } from '@angular/core';
import { CatalogStore } from '../../../application/catalog.store';
import { ProductCard } from '../../components/product-card/product-card';

@Component({
  selector: 'app-catalog-page',
  imports: [ProductCard],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage implements OnInit {
  readonly store = inject(CatalogStore);

  ngOnInit(): void {
    this.store.loadCatalog();
  }
}
