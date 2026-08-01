import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/home-page/home-page').then(m => m.HomePage),
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./presentation/pages/catalog-page/catalog-page').then(m => m.CatalogPage),
  },
  {
    path: 'producto/:id',
    loadComponent: () =>
      import('./presentation/pages/product-detail-page/product-detail-page').then(m => m.ProductDetailPage),
  },
  {
    path: 'favoritos',
    loadComponent: () =>
      import('./presentation/pages/favorites-page/favorites-page').then(m => m.FavoritesPage),
  },
];
