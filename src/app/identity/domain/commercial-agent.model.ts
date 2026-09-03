/** A commercial agent = one physical store (Tienda 1 … Tienda N), created and
 *  managed by the admin in "Agentes Comerciales". Now backed by the real API. */
export interface CommercialAgent {
  id: string;           // UUID from the backend (the real store id)
  storeCode: string;    // 'T1' — the SKU suffix (Published Language with Catalog)
  name: string;         // 'Tienda 1'
  managerName: string;  // encargada de la caja
  address: string;      // physical address printed on the boleta
  district: string;
  province: string;
  department: string;
  phone?: string;
  boletaSerie: string;  // 'B001' — boleta series for this store's sales
  operatorEmail?: string;
}

/** "Cercado de Lima - Lima - Lima" for the boleta ('' when nothing configured) */
export function ubigeoLine(agent: CommercialAgent): string {
  return [agent.district, agent.province, agent.department].filter(Boolean).join(' - ');
}

/** Business rule: every store numbered N uses boleta series B00N (B012 for T12) */
export function serieForStore(storeCode: string): string {
  const n = Number(storeCode.replace(/\D/g, '')) || 1;
  return `B${String(n).padStart(3, '0')}`;
}

/** The next store code after the existing ones: T1, T2 → T3 */
export function nextStoreCode(agents: CommercialAgent[]): string {
  const max = agents.reduce(
    (top, agent) => Math.max(top, Number(agent.storeCode.replace(/\D/g, '')) || 0),
    0
  );
  return `T${max + 1}`;
}
