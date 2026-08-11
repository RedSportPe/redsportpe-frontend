import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthRepository } from '../infrastructure/auth.repository';
import { User } from '../domain/user.model';
import {
  isValidEmail,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
} from '../domain/credentials-rules';
import { addPoints } from '../domain/redsport-points';
import { DeliveryInfo } from '../domain/delivery-info.model';

export type AuthMode = 'login' | 'register';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private repository = inject(AuthRepository);

  // Private state — session is in-memory for now (like the cart);
  // real persistence arrives with the backend.
  private _currentUser = signal<User | null>(null);
  private _modalOpen = signal(false);
  private _mode = signal<AuthMode>('login');
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public read-only state
  readonly currentUser = this._currentUser.asReadonly();
  readonly modalOpen = this._modalOpen.asReadonly();
  readonly mode = this._mode.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /** Command: open the overlay in 'login' or 'register' mode (any page can call this) */
  openModal(mode: AuthMode): void {
    this._mode.set(mode);
    this._error.set(null);
    this._modalOpen.set(true);
  }

  closeModal(): void {
    this._modalOpen.set(false);
    this._error.set(null);
  }

  switchMode(mode: AuthMode): void {
    this._mode.set(mode);
    this._error.set(null);
  }

  login(email: string, password: string): void {
    if (!isValidEmail(email)) {
      this._error.set('Ingresa un correo válido.');
      return;
    }
    this.authenticate(this.repository.login(email, password));
  }

  register(name: string, email: string, password: string): void {
    if (!name.trim()) {
      this._error.set('Ingresa tu nombre.');
      return;
    }
    if (!isValidEmail(email)) {
      this._error.set('Ingresa un correo válido.');
      return;
    }
    if (!isValidPassword(password)) {
      this._error.set(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    this.authenticate(this.repository.register(name, email, password));
  }

  loginWithGoogle(): void {
    this.authenticate(this.repository.loginWithGoogle());
  }

  logout(): void {
    this._currentUser.set(null);
  }

  /** Command (called by Orders when a payment confirms): credit RedSport points */
  creditPoints(earned: number): void {
    const user = this._currentUser();
    if (!user) return;
    this._currentUser.set({ ...user, points: addPoints(user.points, earned) });
  }

  /** Command (admin only, from Agentes Comerciales): create the cashier login
   *  for a tienda. Returns an error message to display, or null on success. */
  provisionOperator(email: string, password: string, name: string, storeCode: string): string | null {
    return this.repository.createOperator(email, password, name, storeCode);
  }

  /** Command (admin only): update a tienda's cashier account */
  updateOperatorAccount(
    storeCode: string,
    changes: { email?: string; password?: string; name?: string }
  ): string | null {
    return this.repository.updateOperator(storeCode, changes);
  }

  /** Command: save/update the customer's delivery data (first checkout or "Mi cuenta" edit) */
  saveDeliveryInfo(deliveryInfo: DeliveryInfo): void {
    const user = this._currentUser();
    if (!user) return;
    this.repository.saveDeliveryInfo(user.id, deliveryInfo);
    this._currentUser.set({ ...user, deliveryInfo });
  }

  /** Shared flow: loading → success closes the modal, failure shows the message */
  private authenticate(request: ReturnType<AuthRepository['loginWithGoogle']>): void {
    if (this._loading()) return; // no double-submit
    this._loading.set(true);
    this._error.set(null);
    request.subscribe({
      next: user => {
        this._currentUser.set(user);
        this._loading.set(false);
        this._modalOpen.set(false);
      },
      error: (err: Error) => {
        this._error.set(err.message);
        this._loading.set(false);
      },
    });
  }
}
