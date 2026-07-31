import { Routes } from '@angular/router';

export const IDENTITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/account-page/account-page').then(m => m.AccountPage),
  },
];
