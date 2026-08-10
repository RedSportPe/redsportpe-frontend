import { Injectable, signal, computed } from '@angular/core';
import {
  CommercialAgent,
  DEFAULT_AGENTS,
  nextStoreCode,
  serieForStore,
} from '../domain/commercial-agent.model';

/** In-memory for now (resets on reload) — same pattern as GarmentTypesStore.
 *  Tomorrow: /api/agents through a repository. */
@Injectable({ providedIn: 'root' })
export class AgentsStore {
  private _agents = signal<CommercialAgent[]>(DEFAULT_AGENTS);
  readonly agents = this._agents.asReadonly();

  readonly count = computed(() => this._agents().length);

  byCode(storeCode: string): CommercialAgent | undefined {
    return this._agents().find(agent => agent.storeCode === storeCode);
  }

  /** Command: the admin opens a new tienda — code and boleta serie are assigned
   *  automatically (T3 → B003). Returns the created agent. */
  addAgent(data: { name?: string; managerName: string; address: string; phone?: string }): CommercialAgent {
    const storeCode = nextStoreCode(this._agents());
    const agent: CommercialAgent = {
      storeCode,
      name: data.name?.trim() || `Tienda ${storeCode.replace(/\D/g, '')}`,
      managerName: data.managerName.trim(),
      address: data.address.trim(),
      phone: data.phone?.trim() || undefined,
      boletaSerie: serieForStore(storeCode),
    };
    this._agents.update(list => [...list, agent]);
    return agent;
  }

  /** Command: edit a tienda's basic info (code and serie never change) */
  updateAgent(
    storeCode: string,
    changes: { name?: string; managerName?: string; address?: string; phone?: string }
  ): void {
    this._agents.update(list =>
      list.map(agent =>
        agent.storeCode === storeCode
          ? {
              ...agent,
              name: changes.name?.trim() || agent.name,
              managerName: changes.managerName?.trim() ?? agent.managerName,
              address: changes.address?.trim() ?? agent.address,
              phone: changes.phone?.trim() || undefined,
            }
          : agent
      )
    );
  }
}
