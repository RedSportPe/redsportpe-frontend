import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/** Business rule: only users with role 'operator' enter /operador/* (the
 *  in-store POS panel). Anyone else lands back on the store. */
export const operatorGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.currentUser()?.role === 'operator') {
    return true;
  }
  if (!authStore.isAuthenticated()) {
    authStore.openModal('login');
  }
  return router.createUrlTree(['/']);
};
