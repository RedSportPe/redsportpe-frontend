import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/catalog-page/catalog-page').then(m => m.CatalogPage),
  },
];
