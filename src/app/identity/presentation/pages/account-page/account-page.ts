import { Component, inject, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../application/auth.store';

@Component({
  selector: 'app-account-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
})
export class AccountPage {
  readonly store = inject(AuthStore);

  readonly initial = computed(() =>
    (this.store.currentUser()?.name.charAt(0) ?? '?').toUpperCase()
  );
}
