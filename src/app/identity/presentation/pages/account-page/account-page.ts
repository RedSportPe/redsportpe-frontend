import { Component, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../application/auth.store';
import { CatalogStore } from '../../../../catalog/application/catalog.store';

@Component({
  selector: 'app-account-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
})
export class AccountPage {
  readonly store = inject(AuthStore);
  readonly catalogStore = inject(CatalogStore);

  readonly initial = computed(() =>
    (this.store.currentUser()?.name.charAt(0) ?? '?').toUpperCase()
  );

  // Inline edit state for the delivery-info card
  readonly editing = signal(false);
  readonly phone = signal('');
  readonly address = signal('');
  readonly district = signal('');
  readonly agency = signal('');

  startEditing(): void {
    const info = this.store.currentUser()?.deliveryInfo;
    this.phone.set(info?.phone ?? '');
    this.address.set(info?.address ?? '');
    this.district.set(info?.district ?? '');
    this.agency.set(info?.agency ?? '');
    this.editing.set(true);
  }

  onInput(field: 'phone' | 'address' | 'district' | 'agency', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  readonly canSave = computed(() => this.phone().trim().length >= 9);

  saveDeliveryInfo(): void {
    if (!this.canSave()) return;
    this.store.saveDeliveryInfo({
      phone: this.phone().trim(),
      address: this.address().trim() || undefined,
      district: this.district().trim() || undefined,
      agency: this.agency().trim() || undefined,
    });
    this.editing.set(false);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }
}
