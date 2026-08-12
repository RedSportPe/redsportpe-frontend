import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order } from '../domain/order.model';
import { nextTrackingStep } from '../domain/order-tracking';

@Injectable({ providedIn: 'root' })
export class OnlineOrdersStore {
  private http = inject(HttpClient);
  private readonly PENDING_KEY = 'redsport_online_pending';
  private readonly ACCEPTED_KEY = 'redsport_online_accepted';

  private _pending = signal<Order[]>(this.loadFromSession(this.PENDING_KEY));
  private _accepted = signal<Order[]>(this.loadFromSession(this.ACCEPTED_KEY));
  private _loaded = signal(false);

  /** Shared across every store: pedidos aún no reclamados por ninguna tienda */
  readonly pending = this._pending.asReadonly();
  /** Only what THIS browser/operator accepted — "Mis Pedidos" */
  readonly accepted = this._accepted.asReadonly();

  /** Loads the initial mock pools only once per session (both are empty the first time) */
  initFromMock(): void {
    if (this._loaded()) return;
    this._loaded.set(true);

    if (this._pending().length === 0 && sessionStorage.getItem(this.PENDING_KEY) === null) {
      this.http.get<Order[]>('/data/online-orders.json').subscribe(orders => {
        this._pending.set(orders);
        this.save(this.PENDING_KEY, orders);
      });
    }
    if (this._accepted().length === 0 && sessionStorage.getItem(this.ACCEPTED_KEY) === null) {
      this.http.get<Order[]>('/data/my-orders-seed.json').subscribe(orders => {
        this._accepted.set(orders);
        this.save(this.ACCEPTED_KEY, orders);
      });
    }
  }

  /** Command: an operator claims the order — it moves out of the shared pool */
  accept(orderId: string, acceptedBy: string): void {
    const order = this._pending().find(o => o.id === orderId);
    if (!order) return;

    this._pending.set(this._pending().filter(o => o.id !== orderId));
    this._accepted.set([{ ...order, sellerName: acceptedBy }, ...this._accepted()]);

    this.save(this.PENDING_KEY, this._pending());
    this.save(this.ACCEPTED_KEY, this._accepted());
  }

  /** In-memory demo only — a real advance would PATCH the backend */
  advanceTracking(orderId: string): void {
    this._accepted.set(
      this._accepted().map(o =>
        o.id === orderId ? { ...o, trackingStep: nextTrackingStep(o.trackingStep) } : o
      )
    );
    this.save(this.ACCEPTED_KEY, this._accepted());
  }

  private loadFromSession(key: string): Order[] {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(key: string, orders: Order[]): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(orders));
    } catch { /* storage unavailable — stays in memory only */ }
  }
}
