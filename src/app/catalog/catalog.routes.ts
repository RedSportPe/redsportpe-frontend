import { Routes } from '@angular/router';

/** Admin side of the catalog context — mounted at /admin/productos */
export const CATALOG_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/admin/admin-products-page/admin-products-page').then(m => m.AdminProductsPage),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./presentation/admin/admin-product-form-page/admin-product-form-page').then(m => m.AdminProductFormPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./presentation/admin/admin-product-form-page/admin-product-form-page').then(m => m.AdminProductFormPage),
  },
];

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
