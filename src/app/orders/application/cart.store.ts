import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../domain/cart-item.model';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly STORAGE_KEY = 'redsport_cart';
  private _items = signal<CartItem[]>(this.loadFromSession());
  private _drawerOpen = signal(false);
  readonly drawerOpen = this._drawerOpen.asReadonly();
  readonly items = this._items.asReadonly();

  /** Total units — the navbar badge */
  readonly totalQuantity = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  /** Cart total in soles */
  readonly totalAmount = computed(() =>
    this._items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  readonly isEmpty = computed(() => this._items().length === 0);

  /** Command: add variant to cart. If the SKU is already there, increase quantity. */
  addItem(newItem: Omit<CartItem, 'quantity'>, quantity = 1): void {
    const items = [...this._items()];
    const existing = items.find(i => i.sku === newItem.sku);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, existing.maxStock);
    } else {
      items.push({ ...newItem, quantity: Math.min(quantity, newItem.maxStock) });
    }
    this._items.set(items);
  }

  /** Command: change quantity (clamped between 1 and stock) */
  updateQuantity(sku: string, quantity: number): void {
    this._items.set(
      this._items().map(item =>
        item.sku === sku
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock)) }
          : item
      )
    );
  }

  /** Command: remove variant from cart */
  removeItem(sku: string): void {
    this._items.set(this._items().filter(item => item.sku !== sku));
  }
  /** Session persistence: survives page reloads, cleared when the tab closes.
   *  Real persistence (account-linked) will come with IAM + backend. */
  private loadFromSession(): CartItem[] {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToSession(): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._items()));
    } catch {
      // storage unavailable — cart works in memory only
    }
  }
  clearCart(): void {
    this._items.set([]);
  }

  toggleDrawer(): void {
    this._drawerOpen.set(!this._drawerOpen());
  }

  closeDrawer(): void {
    this._drawerOpen.set(false);
  }

}
