import { Injectable } from '@angular/core';
import { Order } from '../../orders/domain/order.model';
import { montoEnLetras } from '../../orders/domain/amount-in-words';

/** Talks to the local print bridge (ESC/POS over USB) running on
 *  http://localhost:3000. The bridge is a separate Node process — not
 *  part of this Angular app — see red-boss-test/serve_escpos.js. */
@Injectable({ providedIn: 'root' })
export class ImpresionService {
  private readonly printBridgeUrl = 'http://localhost:3000/api/print/boleta';

  async imprimirBoleta(order: Order): Promise<void> {
    const payload = {
      codigo: order.code,
      cliente: order.shipping.fullName,
      vendedor: order.sellerName,
      items: order.items.map(line => ({
        sku: line.sku,
        nombre: line.name,
        cantidad: line.quantity,
        precio: line.unitPrice,
      })),
      subtotal: order.subtotal,
      descuento: order.subtotal ? order.subtotal - order.total : undefined,
      motivoDescuento: order.discountReason,
      total: order.total,
      montoEnLetras: montoEnLetras(order.total),
      metodoPago: order.paymentMethod,
      cashReceived: order.cashReceived,
      qrAmount: order.qrAmount,
    };

    const response = await fetch(this.printBridgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('No se pudo imprimir la boleta');
    }
  }
}
