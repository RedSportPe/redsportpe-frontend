/** A promotion discounts one product by subtracting a fixed amount in soles
 *  from its regular price (e.g. price 139.90, discountAmount 39.90 → promo 100).
 *  Created by the admin (UI pending); customers only ever read promotions. */
export interface Promotion {
  id: string;
  productId: string;       // the discounted product (catalog is the source of truth for price)
  discountAmount: number;  // soles subtracted from the regular price
  endsAt?: string;         // ISO date, inclusive — after this day the regular price returns
  maxUnits?: number;       // only this many units get the promo price; absent = whole stock
  unitsSold?: number;      // units already sold at promo price (backend will maintain this)
}
