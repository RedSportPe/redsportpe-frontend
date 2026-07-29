import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // Public store: top navbar
    path: '',
    loadComponent: () =>
      import('./layouts/store-layout/store-layout').then(m => m.StoreLayout),
    children: [
      {
        path: '',
        loadChildren: () => import('./catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
      },
    ],
  },
  {
    // Staff panel: left sidebar
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [],
  },
];
