/** A commercial agent = one physical store (Tienda 1 … Tienda N), created and
 *  managed by the admin in "Agentes Comerciales". Its data feeds two places:
 *  the SKU store suffix (T1) and the boleta header (address, serie, encargada). */
export interface CommercialAgent {
  storeCode: string;    // 'T1' — the SKU suffix (Published Language with Catalog)
  name: string;         // 'Tienda 1'
  managerName: string;  // encargada de la caja
  address: string;      // physical address printed on the boleta ('' = not configured yet)
  phone?: string;
  boletaSerie: string;  // 'B001' — boleta series for this store's sales
}

/** Seed stores — extensible from /admin/agentes (in-memory until the backend) */
export const DEFAULT_AGENTS: CommercialAgent[] = [
  {
    storeCode: 'T1',
    name: 'Tienda 1',
    managerName: 'Operadora Tienda',
    address: '',
    boletaSerie: 'B001',
  },
  {
    storeCode: 'T2',
    name: 'Tienda 2',
    managerName: '',
    address: '',
    boletaSerie: 'B002',
  },
];

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
