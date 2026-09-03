import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AgentsRepository } from '../infrastructure/agents.repository';
import { CommercialAgent } from '../domain/commercial-agent.model';

/** Now backed by /api/stores. Loads on demand; commands hit the backend and
 *  refresh the local signal on success. */
@Injectable({ providedIn: 'root' })
export class AgentsStore {
  private repo = inject(AgentsRepository);

  private _agents = signal<CommercialAgent[]>([]);
  readonly agents = this._agents.asReadonly();
  readonly count = computed(() => this._agents().length);

  private _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  byCode(storeCode: string): CommercialAgent | undefined {
    return this._agents().find(agent => agent.storeCode === storeCode);
  }

  byId(id: string): CommercialAgent | undefined {
    return this._agents().find(agent => agent.id === id);
  }

  /** Load the store list from the backend */
  load(): void {
    this._loading.set(true);
    this.repo.getAll().subscribe({
      next: agents => {
        this._agents.set(agents);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  /** Create a store + its operator in one backend call */
  createStore(data: {
    name: string;
    address: string;
    managerName: string;
    district: string;
    province: string;
    department: string;
    phone: string;
    operatorEmail: string;
    operatorPassword: string;
  }): Observable<CommercialAgent> {
    return this.repo.create(data).pipe(
      tap(agent => this._agents.update(list => [...list, agent]))
    );
  }

  /** Change the cashier credential of a store */
  updateOperator(
    storeId: string,
    changes: { name?: string; email?: string; password?: string }
  ): Observable<CommercialAgent> {
    return this.repo.updateOperator(storeId, changes).pipe(
      tap(updated =>
        this._agents.update(list =>
          list.map(a => (a.id === updated.id ? updated : a))
        )
      )
    );
  }

  /** Soft-delete a store (removes it from the active list) */
  deleteStore(storeId: string): Observable<void> {
    return this.repo.remove(storeId).pipe(
      tap(() => this._agents.update(list => list.filter(a => a.id !== storeId)))
    );
  }
}
