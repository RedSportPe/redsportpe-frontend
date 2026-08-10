import { Injectable, inject } from '@angular/core';
import { Order } from '../../orders/domain/order.model';
import { montoEnLetras } from '../../orders/domain/amount-in-words';
import { AgentsStore } from '../../identity/application/agents.store';
import { ubigeoLine } from '../../identity/domain/commercial-agent.model';
import { COMPANY } from '../company-info';

/** Talks to the local print bridge (ESC/POS over USB) running on
 *  http://localhost:3000. The bridge is a separate Node process — not
 *  part of this Angular app — see red-boss-test/serve_escpos.js. */
@Injectable({ providedIn: 'root' })
export class ImpresionService {
  private readonly printBridgeUrl = 'http://localhost:3000/api/print/boleta';
  private agentsStore = inject(AgentsStore);

  async imprimirBoleta(order: Order): Promise<void> {
    const agent = this.agentsStore.byCode(order.storeCode ?? 'T1');

    const payload = {
      // Legal header (Tambo-style)
      empresa: {
        nombreComercial: COMPANY.nombreComercial,
        razonSocial: COMPANY.razonSocial,
        ruc: COMPANY.ruc,
      },
      tienda: {
        codigo: order.storeCode,
        nombre: agent?.name,
        direccion: agent?.address || undefined,
        ubigeo: agent ? ubigeoLine(agent) || undefined : undefined,  // "Cercado de Lima - Lima - Lima"
      },
      boleta: order.boletaNumber,
      fecha: order.paidAt,
      caja: 1,
      ticket: order.code,
      // Kept for backward compatibility: older bridge templates print "Venta: {codigo}"
      codigo: order.code,
      vendedor: order.sellerName,
      cliente: order.shipping.fullName,
      documentoCliente: order.customerDoc,
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
      leyenda: 'ESTA ES UNA REPRESENTACIÓN IMPRESA DE LA BOLETA DE VENTA.',
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
