import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, catchError, throwError } from 'rxjs';
import { User } from '../domain/user.model';
import { DeliveryInfo } from '../domain/delivery-info.model';
import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from '../domain/credentials-rules';

/** The backend base URL. Later, move this to an environment file. */
const API_URL = 'http://localhost:8080/api';

/** Shape of the backend's /auth/sign-in response */
interface AuthenticatedUserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

/** Now wired to the real Spring Boot backend for login. Register, Google, and
 *  operator provisioning stay in-memory until their endpoints are connected. */
@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private http = inject(HttpClient);

  private readonly TOKEN_KEY = 'redsport_token';

  get token(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
  /** REAL: POST /api/auth/sign-in → returns the user + JWT from PostgreSQL */
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthenticatedUserResponse>(`${API_URL}/auth/sign-in`, {
        email: email.trim().toLowerCase(),
        password,
      })
      .pipe(
        map(response => {
          this.setToken(response.token);  // remember the JWT for later
          return this.toUser(response);
        }),
        catchError(() =>
          throwError(() => new Error('Correo o contraseña incorrectos.'))
        )
      );
  }

  /** Maps the backend response into the frontend User model.
   *  Backend sends id/name/email/role/token; the rest gets sensible defaults
   *  until those fields travel from the server too. */
  private toUser(r: AuthenticatedUserResponse): User {
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      provider: 'email',
      role: r.role as User['role'],
      points: 0,
      createdAt: new Date().toISOString(),
    };
  }

  // ===== Below: still in-memory until their endpoints are wired =====

  private registered = new Map<string, { user: User; password: string }>();

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
      role: 'customer',
      points: 0,
      createdAt: new Date().toISOString(),
    };
    this.registered.set(key, { user, password });
    return of(user).pipe(delay(500));
  }

  private googleUser: User = {
    id: 'user-google-demo',
    name: 'Cliente Google',
    email: 'cliente.demo@gmail.com',
    provider: 'google',
    role: 'customer',
    points: 320,
    createdAt: '2026-05-15T12:00:00.000Z',
  };

  loginWithGoogle(): Observable<User> {
    return of(this.googleUser).pipe(delay(700));
  }

  createOperator(email: string, password: string, name: string, storeCode: string): string | null {
    const key = email.trim().toLowerCase();
    if (!isValidEmail(key)) return 'Ingresa un correo válido para la operadora.';
    if (!isValidPassword(password)) {
      return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (this.registered.has(key)) return 'Este correo ya está registrado.';
    this.registered.set(key, {
      user: {
        id: `user-op-${storeCode.toLowerCase()}`,
        name: name.trim() || 'Operadora',
        email: key,
        provider: 'email',
        role: 'operator',
        points: 0,
        createdAt: new Date().toISOString(),
        storeCode,
      },
      password,
    });
    return null;
  }

  updateOperator(
    storeCode: string,
    changes: { email?: string; password?: string; name?: string }
  ): string | null {
    const entry = [...this.registered.entries()].find(
      ([, data]) => data.user.role === 'operator' && data.user.storeCode === storeCode
    );
    if (!entry) return 'Esta tienda aún no tiene cuenta de operadora.';
    const [currentKey, data] = entry;
    let key = currentKey;
    if (changes.email) {
      const next = changes.email.trim().toLowerCase();
      if (!isValidEmail(next)) return 'Ingresa un correo válido para la operadora.';
      if (next !== currentKey && this.registered.has(next)) return 'Este correo ya está registrado.';
      key = next;
    }
    if (changes.password && !isValidPassword(changes.password)) {
      return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    this.registered.delete(currentKey);
    this.registered.set(key, {
      user: { ...data.user, email: key, name: changes.name?.trim() || data.user.name },
      password: changes.password || data.password,
    });
    return null;
  }

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

  private fail(message: string): Observable<never> {
    return throwError(() => new Error(message));
  }
}
