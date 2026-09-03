import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentsStore } from '../../../application/agents.store';
import { CommercialAgent } from '../../../domain/commercial-agent.model';
import { UnsavedChangesAware } from '../../../../layout/unsaved-changes.guard';

/** "Agentes Comerciales": the admin's registry of physical stores, now backed
 *  by the real /api/stores backend. */
@Component({
  selector: 'app-admin-agents-page',
  imports: [RouterLink],
  templateUrl: './admin-agents-page.html',
  styleUrl: './admin-agents-page.scss',
})
export class AdminAgentsPage implements UnsavedChangesAware, OnInit {
  readonly store = inject(AgentsStore);

  readonly blocked = signal(false);
  readonly saving = signal(false);

  // Form state
  readonly editingId = signal<string | null>(null);
  readonly name = signal('');
  readonly managerName = signal('');
  readonly address = signal('');
  readonly district = signal('');
  readonly province = signal('');
  readonly department = signal('');
  readonly phone = signal('');
  readonly operatorEmail = signal('');
  readonly operatorPassword = signal('');
  readonly accountError = signal<string | null>(null);

  readonly isEditing = computed(() => this.editingId() !== null);

  ngOnInit(): void {
    this.store.load();   // fetch stores from the backend on open
  }

  readonly formDirty = computed(() => {
    const id = this.editingId();
    if (id === null) {
      return (
        this.name().trim() !== '' ||
        this.managerName().trim() !== '' ||
        this.address().trim() !== '' ||
        this.district().trim() !== '' ||
        this.province().trim() !== '' ||
        this.department().trim() !== '' ||
        this.phone().trim() !== '' ||
        this.operatorEmail().trim() !== '' ||
        this.operatorPassword() !== ''
      );
    }
    const agent = this.store.byId(id);
    if (!agent) return false;
    return (
      this.name().trim() !== agent.name ||
      this.managerName().trim() !== agent.managerName ||
      this.address().trim() !== agent.address ||
      this.district().trim() !== agent.district ||
      this.province().trim() !== agent.province ||
      this.department().trim() !== agent.department ||
      this.phone().trim() !== (agent.phone ?? '') ||
      this.operatorEmail().trim().toLowerCase() !== (agent.operatorEmail ?? '') ||
      this.operatorPassword() !== ''
    );
  });

  /** Creating a tienda REQUIRES its cashier login (email + password) */
  readonly canSave = computed(() => {
    const base = this.managerName().trim() !== '' && this.address().trim() !== '';
    if (this.editingId() === null) {
      return base && this.operatorEmail().trim() !== '' && this.operatorPassword() !== '';
    }
    return base;
  });

  hasUnsavedChanges(): boolean {
    return this.formDirty();
  }

  notifyBlockedNavigation(): void {
    if (this.blocked()) return;
    this.blocked.set(true);
    setTimeout(() => this.blocked.set(false), 1200);
  }

  onInput(
    field: 'name' | 'managerName' | 'address' | 'district' | 'province' | 'department' | 'phone' | 'operatorEmail' | 'operatorPassword',
    event: Event
  ): void {
    this[field].set((event.target as HTMLInputElement).value);
    this.accountError.set(null);
  }

  startEdit(agent: CommercialAgent): void {
    this.editingId.set(agent.id);
    this.name.set(agent.name);
    this.managerName.set(agent.managerName);
    this.address.set(agent.address);
    this.district.set(agent.district);
    this.province.set(agent.province);
    this.department.set(agent.department);
    this.phone.set(agent.phone ?? '');
    this.operatorEmail.set(agent.operatorEmail ?? '');
    this.operatorPassword.set('');
    this.accountError.set(null);
  }

  save(): void {
    if (!this.canSave() || this.saving()) return;
    this.accountError.set(null);
    this.saving.set(true);

    const id = this.editingId();

    if (id === null) {
      // New store: one backend call creates store + operator + link
      this.store.createStore({
        name: this.name().trim(),
        address: this.address().trim(),
        managerName: this.managerName().trim(),
        district: this.district().trim(),
        province: this.province().trim(),
        department: this.department().trim(),
        phone: this.phone().trim(),
        operatorEmail: this.operatorEmail().trim().toLowerCase(),
        operatorPassword: this.operatorPassword(),
      }).subscribe({
        next: () => { this.saving.set(false); this.clearForm(); },
        error: (err) => {
          this.saving.set(false);
          this.accountError.set(err?.error?.message || 'No se pudo crear la tienda.');
        },
      });
    } else {
      // Editing: update the operator credential of this store
      this.store.updateOperator(id, {
        name: this.managerName().trim(),
        email: this.operatorEmail().trim().toLowerCase() || undefined,
        password: this.operatorPassword() || undefined,
      }).subscribe({
        next: () => { this.saving.set(false); this.clearForm(); },
        error: (err) => {
          this.saving.set(false);
          this.accountError.set(err?.error?.message || 'No se pudo actualizar la operadora.');
        },
      });
    }
  }

  /** Soft-delete the store */
  deleteStore(agent: CommercialAgent): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.store.deleteStore(agent.id).subscribe({
      next: () => this.saving.set(false),
      error: () => this.saving.set(false),
    });
  }

  clearForm(): void {
    this.editingId.set(null);
    this.name.set('');
    this.managerName.set('');
    this.address.set('');
    this.district.set('');
    this.province.set('');
    this.department.set('');
    this.phone.set('');
    this.operatorEmail.set('');
    this.operatorPassword.set('');
    this.accountError.set(null);
  }
}
