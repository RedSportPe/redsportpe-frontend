import { Injectable } from '@angular/core';
import { Observable, of, timer, delay, map } from 'rxjs';
import { User } from '../domain/user.model';
import { DeliveryInfo } from '../domain/delivery-info.model';

/** Today: in-memory simulation so the whole auth UX can be built and demoed.
 *  Tomorrow: POST /api/auth/register|login + the real Google Identity Services
 *  flow — only this repository changes, the store and components stay intact. */
@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private registered = new Map<string, { user: User; password: string }>([
    // Seeded internal admin (demo) — real staff accounts come with the backend
    ['admin@redsport.pe', {
      user: {
        id: 'user-admin-demo',
        name: 'Admin RedSport',
        email: 'admin@redsport.pe',
        provider: 'email',
        role: 'admin',
        points: 0,
        createdAt: '2026-01-05T12:00:00.000Z',
      },
      password: 'admin123',
    }],
    // Seeded store operator (demo) — the in-store cashier
    ['operadora@redsport.pe', {
      user: {
        id: 'user-operator-demo',
        name: 'Operadora Tienda',
        email: 'operadora@redsport.pe',
        provider: 'email',
        role: 'operator',
        points: 0,
        createdAt: '2026-02-10T12:00:00.000Z',
        storeCode: 'T1',
      },
      password: 'operador123',
    }],
  ]);

  register(name: string, email: string, password: string): Observable<User> {
    const key = email.trim().toLowerCase();
    if (this.registered.has(key)) {
      return this.fail('Este correo ya está registrado. Inicia sesión.');
    }
    const user: User = {
      id: `user-${this.registered.size + 1}`,
      name: name.trim(),
      email: key,
      provider: 'email',
      role: 'customer',   // self-registration is always a customer
      points: 0,
      createdAt: new Date().toISOString(),
    };
    this.registered.set(key, { user, password });
    return of(user).pipe(delay(500));
  }

  login(email: string, password: string): Observable<User> {
    const entry = this.registered.get(email.trim().toLowerCase());
    if (!entry || entry.password !== password) {
      return this.fail('Correo o contraseña incorrectos.');
    }
    return of(entry.user).pipe(delay(500));
  }

  // Kept as an instance so re-logins in the same app session keep saved data
  private googleUser: User = {
    id: 'user-google-demo',
    name: 'Cliente Google',
    email: 'cliente.demo@gmail.com',
    provider: 'google',
    role: 'customer',
    points: 320,
    createdAt: '2026-05-15T12:00:00.000Z',  // midday: same date in any timezone
  };

  loginWithGoogle(): Observable<User> {
    // Simulated Google account (with demo points) until the real GIS flow lands
    return of(this.googleUser).pipe(delay(700));
  }

  /** Today: updates the in-memory user. Tomorrow: PATCH /api/customers/me */
  saveDeliveryInfo(userId: string, deliveryInfo: DeliveryInfo): void {
    if (this.googleUser.id === userId) {
      this.googleUser = { ...this.googleUser, deliveryInfo };
      return;
    }
    for (const entry of this.registered.values()) {
      if (entry.user.id === userId) {
        entry.user = { ...entry.user, deliveryInfo };
        return;
      }
    }
  }

  /** Errors also take a moment, like a real network call would */
  private fail(message: string): Observable<never> {
    return timer(500).pipe(
      map(() => {
        throw new Error(message);
      })
    );
  }
}
