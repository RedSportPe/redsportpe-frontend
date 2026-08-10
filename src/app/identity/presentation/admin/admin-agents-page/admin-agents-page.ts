import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentsStore } from '../../../application/agents.store';
import { CommercialAgent } from '../../../domain/commercial-agent.model';
import { UnsavedChangesAware } from '../../../../layout/unsaved-changes.guard';

/** "Agentes Comerciales": the admin's registry of physical stores (Tienda 1…N).
 *  Each agent's data (address, encargada, boleta serie) feeds the POS boleta. */
@Component({
  selector: 'app-admin-agents-page',
  imports: [RouterLink],
  templateUrl: './admin-agents-page.html',
  styleUrl: './admin-agents-page.scss',
})
export class AdminAgentsPage implements UnsavedChangesAware {
  readonly store = inject(AgentsStore);

  /** Blocked-exit feedback: the form shakes and the button pulses */
  readonly blocked = signal(false);

  // Form state — creating a new tienda, or editing an existing one
  readonly editingCode = signal<string | null>(null);
  readonly name = signal('');
  readonly managerName = signal('');
  readonly address = signal('');
  readonly district = signal('');
  readonly province = signal('');
  readonly department = signal('');
  readonly phone = signal('');

  readonly isEditing = computed(() => this.editingCode() !== null);

  readonly formDirty = computed(() => {
    const code = this.editingCode();
    if (code === null) {
      return (
        this.name().trim() !== '' ||
        this.managerName().trim() !== '' ||
        this.address().trim() !== '' ||
        this.district().trim() !== '' ||
        this.province().trim() !== '' ||
        this.department().trim() !== '' ||
        this.phone().trim() !== ''
      );
    }
    const agent = this.store.byCode(code);
    if (!agent) return false;
    return (
      this.name().trim() !== agent.name ||
      this.managerName().trim() !== agent.managerName ||
      this.address().trim() !== agent.address ||
      this.district().trim() !== agent.district ||
      this.province().trim() !== agent.province ||
      this.department().trim() !== agent.department ||
      this.phone().trim() !== (agent.phone ?? '')
    );
  });

  readonly canSave = computed(() => this.managerName().trim() !== '' && this.address().trim() !== '');

  hasUnsavedChanges(): boolean {
    return this.formDirty();
  }

  notifyBlockedNavigation(): void {
    if (this.blocked()) return;
    this.blocked.set(true);
    setTimeout(() => this.blocked.set(false), 1200);
  }

  onInput(
    field: 'name' | 'managerName' | 'address' | 'district' | 'province' | 'department' | 'phone',
    event: Event
  ): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  startEdit(agent: CommercialAgent): void {
    this.editingCode.set(agent.storeCode);
    this.name.set(agent.name);
    this.managerName.set(agent.managerName);
    this.address.set(agent.address);
    this.district.set(agent.district);
    this.province.set(agent.province);
    this.department.set(agent.department);
    this.phone.set(agent.phone ?? '');
  }

  save(): void {
    if (!this.canSave()) return;
    const code = this.editingCode();
    const data = {
      name: this.name(),
      managerName: this.managerName(),
      address: this.address(),
      district: this.district(),
      province: this.province(),
      department: this.department(),
      phone: this.phone(),
    };
    if (code !== null) {
      this.store.updateAgent(code, data);
    } else {
      this.store.addAgent(data);
    }
    this.clearForm();
  }

  /** The explicit way out of a half-filled form (guard-friendly) */
  clearForm(): void {
    this.editingCode.set(null);
    this.name.set('');
    this.managerName.set('');
    this.address.set('');
    this.district.set('');
    this.province.set('');
    this.department.set('');
    this.phone.set('');
  }
}
