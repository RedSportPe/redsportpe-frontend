import { CartItem } from './cart-item.model';

export type DeliveryMethod = 'motorizado' | 'shalom';

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  motorizado: 'Motorizado (delivery)',
  shalom: 'Shalom (recojo en agencia)',
};

export interface ShippingDetails {
  fullName: string;
  phone: string;
  address?: string;    // motorizado: street + number
  district?: string;   // motorizado
  agency?: string;     // shalom: destination office/city
}

/** An order is born unpaid with an 8h QR. Payment stamps paidAt, computes the
 *  delivery/dispatch date and credits RedSport points. Tracking then moves
 *  through the 4 steps of its delivery method. */
export interface Order {
  id: string;
  code: string;           // human-friendly, shown to the customer (RS-XXXX)
  userId: string;         // orders belong to an authenticated customer
  items: CartItem[];      // snapshot of the cart at checkout (SKU = Published Language)
  total: number;          // soles, what the QR charges
  method: DeliveryMethod;
  shipping: ShippingDetails;
  createdAt: string;      // ISO
  qrExpiresAt: string;    // ISO — 8h after the QR was (re)generated
  paidAt?: string;        // ISO — absent while pending payment
  deliveryDate?: string;  // ISO date — motorizado: promised delivery; shalom: dispatch day
  trackingStep: number;   // 0..3 index into TRACKING_STEPS[method]
}
