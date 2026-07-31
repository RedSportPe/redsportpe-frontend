import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CartStore } from '../../orders/application/cart.store';
import { CartDrawer } from '../../orders/presentation/components/cart-drawer/cart-drawer';

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CartDrawer],
  templateUrl: './store-layout.html',
  styleUrl: './store-layout.scss',
})
export class StoreLayout {
  readonly cartStore = inject(CartStore);
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
