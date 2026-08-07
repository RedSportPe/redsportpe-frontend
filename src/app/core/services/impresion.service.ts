import { Injectable } from '@angular/core';
import { Order } from '../../orders/domain/order.model';

/** Talks to the local print bridge (ESC/POS over USB) running on
 *  http://localhost:3000. The bridge is a separate Node process — not
 *  part of this Angular app — see red-boss-test/server.js. */
@Injectable({ providedIn: 'root' })
export class ImpresionService {
  private readonly printBridgeUrl = 'http://localhost:3000/api/print/boleta';

  async imprimirBoleta(order: Order): Promise<void> {
    const payload = {
      codigo: order.code,
      cliente: order.shipping.fullName,
      items: order.items.map(line => ({
        sku: line.sku,
        nombre: line.name,
        cantidad: line.quantity,
        precio: line.unitPrice,
      })),
      total: order.total,
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
