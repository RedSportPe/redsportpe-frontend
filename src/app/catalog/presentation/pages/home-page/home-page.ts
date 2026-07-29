import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogStore } from '../../../application/catalog.store';
import { TrendsCarousel } from '../../components/trends-carousel/trends-carousel';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, TrendsCarousel],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  readonly store = inject(CatalogStore);

  ngOnInit(): void {
    this.store.loadCatalog();
  }
}
