import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/** Business rule: only users with role 'admin' can enter /admin/*.
 *  Anyone else lands back on the store (with the login modal if anonymous). */
export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.currentUser()?.role === 'admin') {
    return true;
  }
  if (!authStore.isAuthenticated()) {
    authStore.openModal('login');
  }
  return router.createUrlTree(['/']);
};
