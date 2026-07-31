import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // Public store: top navbar
    path: '',
    loadComponent: () =>
      import('./layout/store-layout/store-layout').then(m => m.StoreLayout),
    children: [
      {
        path: '',
        loadChildren: () => import('./catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
      },
      {
        path: 'promos',
        loadChildren: () => import('./promotions/promotions.routes').then(m => m.PROMOTIONS_ROUTES),
      },
      {
        path: 'carrito',
        loadChildren: () => import('./orders/orders.routes').then(m => m.ORDERS_ROUTES),
      },
      {
        path: 'cuenta',
        loadChildren: () => import('./identity/identity.routes').then(m => m.IDENTITY_ROUTES),
      },
    ],
  },
  {
    // Staff panel: left sidebar
    path: 'admin',
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [],
  },
];
