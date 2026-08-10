export interface ItemPedido {
  sku: string;
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface PedidoMock {
  items: ItemPedido[];
  total: number;
}

export const PEDIDO_MOCK: PedidoMock = {
  items: [
    { sku: 'RS-CJCN-H-S-NEG-T1', nombre: 'Casaca Nova Premium', cantidad: 1, precio: 89.90 },
    { sku: 'RS-LGEC-M-M-AZU-T1', nombre: 'Legging PolyFresh', cantidad: 2, precio: 45.00 }
  ],
  total: 179.90
};
