import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../identity/application/auth.store';

@Component({
  selector: 'app-operator-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './operator-layout.html',
  styleUrl: './operator-layout.scss',
})
export class OperatorLayout {
  readonly authStore = inject(AuthStore);
}
