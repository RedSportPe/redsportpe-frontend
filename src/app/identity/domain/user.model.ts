import { DeliveryInfo } from './delivery-info.model';

export type AuthProvider = 'email' | 'google';

/** Business rule: only 'admin' users can enter /admin/*. The 'operator' is the
 *  in-store cashier: shops like a customer but confirms sales directly (cash or
 *  instant QR). Roles are assigned internally (never self-service); the backend
 *  will be the real authority. */
export type UserRole = 'customer' | 'admin' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  role: UserRole;
  /** RedSport points balance — earned at checkout (1 sol = 1 point) */
  points: number;
  createdAt: string;   // ISO date — "miembro desde"
  /** Saved on the first checkout; editable from "Mi cuenta" */
  deliveryInfo?: DeliveryInfo;
  /** Operators only: which tienda (commercial agent) runs their register */
  storeCode?: string;
}
