/** The customer's saved delivery data — captured on their FIRST checkout,
 *  then shown (and editable) in "Mi cuenta" and prefilled on later checkouts. */
export interface DeliveryInfo {
  phone: string;
  address?: string;    // motorizado: street + number
  district?: string;   // motorizado
  agency?: string;     // shalom: usual pickup office/city
}
