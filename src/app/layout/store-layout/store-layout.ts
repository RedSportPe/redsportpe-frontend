import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CartStore } from '../../orders/application/cart.store';
import { CartDrawer } from '../../orders/presentation/components/cart-drawer/cart-drawer';
import { AuthStore } from '../../identity/application/auth.store';
import { AuthModal } from '../../identity/presentation/components/auth-modal/auth-modal';

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CartDrawer, AuthModal],
  templateUrl: './store-layout.html',
  styleUrl: './store-layout.scss',
})
export class StoreLayout {
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  private router = inject(Router);

  onCartClick(): void {
    if (window.innerWidth <= 768) {
      // Mobile: full cart page
      this.router.navigate(['/carrito']);
    } else {
      // Desktop: toggle the drawer
      this.cartStore.toggleDrawer();
    }
  }
}
