import { Component, inject, signal, effect } from '@angular/core';
import { AuthStore } from '../../../application/auth.store';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss',
  host: {
    '(document:keydown.escape)': 'store.closeModal()',
  },
})
export class AuthModal {
  readonly store = inject(AuthStore);

  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');

  constructor() {
    // Fresh form every time the modal opens
    effect(() => {
      if (this.store.modalOpen()) {
        this.name.set('');
        this.email.set('');
        this.password.set('');
      }
    });
  }

  onInput(field: 'name' | 'email' | 'password', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.store.mode() === 'login') {
      this.store.login(this.email(), this.password());
    } else {
      this.store.register(this.name(), this.email(), this.password());
    }
  }
}
