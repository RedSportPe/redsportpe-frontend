import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthRepository } from './auth.repository';

/**
 * Attaches the JWT (Authorization: Bearer <token>) to every request going to
 * our backend, so protected endpoints accept it.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authRepo = inject(AuthRepository);
  const token = authRepo.token;

  if (token && req.url.includes('localhost:8080')) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authReq);
  }

  return next(req);
};
