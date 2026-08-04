import { Routes } from '@angular/router';
import { adminGuard } from './identity/application/admin.guard';
import { unsavedChangesGuard } from './layout/unsaved-changes.guard';

export const routes: Routes = [
  {
    // Staff panel: left sidebar. Business rule: admins only.
    // MUST be declared before the store: the store mounts at '' (prefix match)
    // and its '**' fallback would otherwise swallow every /admin URL.
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'productos' },
      {
        path: 'productos',
        loadChildren: () => import('./catalog/catalog.routes').then(m => m.CATALOG_ADMIN_ROUTES),
      },
      {
        path: 'inventario',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./catalog/presentation/admin/admin-inventory-page/admin-inventory-page').then(m => m.AdminInventoryPage),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./orders/presentation/admin/admin-orders-page/admin-orders-page').then(m => m.AdminOrdersPage),
      },
      {
        path: 'descuentos',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./promotions/presentation/admin/admin-promos-page/admin-promos-page').then(m => m.AdminPromosPage),
      },
      {
        // 404 inside the panel: unknown /admin URLs keep the sidebar
        path: '**',
        loadComponent: () =>
          import('./layout/not-found-page/not-found-page').then(m => m.NotFoundPage),
      },
    ],
  },
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
        path: 'pedidos',
        loadChildren: () => import('./orders/orders.routes').then(m => m.MY_ORDERS_ROUTES),
      },
      {
        path: 'cuenta',
        loadChildren: () => import('./identity/identity.routes').then(m => m.IDENTITY_ROUTES),
      },
      {
        // 404 inside the store: unknown URLs keep the navbar
        path: '**',
        loadComponent: () =>
          import('./layout/not-found-page/not-found-page').then(m => m.NotFoundPage),
      },
    ],
  },
];
