import { Routes } from '@angular/router';

/** Mounted at /carrito */
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/cart-page/cart-page').then(m => m.CartPage),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./presentation/pages/checkout-page/checkout-page').then(m => m.CheckoutPage),
  },
  {
    path: 'pago/:id',
    loadComponent: () =>
      import('./presentation/pages/payment-page/payment-page').then(m => m.PaymentPage),
  },
];

/** Mounted at /pedidos */
export const MY_ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/my-orders-page/my-orders-page').then(m => m.MyOrdersPage),
  },
];
