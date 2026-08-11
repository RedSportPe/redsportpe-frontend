import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentsStore } from '../../../application/agents.store';
import { AuthStore } from '../../../application/auth.store';
import { CommercialAgent, nextStoreCode } from '../../../domain/commercial-agent.model';
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
  private authStore = inject(AuthStore);

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
  /** The cashier's login (one account per tienda — provisioned right here) */
  readonly operatorEmail = signal('');
  /** Blank while editing = keep the current password */
  readonly operatorPassword = signal('');
  readonly accountError = signal<string | null>(null);

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
        this.phone().trim() !== '' ||
        this.operatorEmail().trim() !== '' ||
        this.operatorPassword() !== ''
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
      this.phone().trim() !== (agent.phone ?? '') ||
      this.operatorEmail().trim().toLowerCase() !== (agent.operatorEmail ?? '') ||
      this.operatorPassword() !== ''
    );
  });

  /** Creating a tienda REQUIRES its cashier login (email + password) */
  readonly canSave = computed(() => {
    const base = this.managerName().trim() !== '' && this.address().trim() !== '';
    if (this.editingCode() === null) {
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
    this.editingCode.set(agent.storeCode);
    this.name.set(agent.name);
    this.managerName.set(agent.managerName);
    this.address.set(agent.address);
    this.district.set(agent.district);
    this.province.set(agent.province);
    this.department.set(agent.department);
    this.phone.set(agent.phone ?? '');
    this.operatorEmail.set(agent.operatorEmail ?? '');
    this.operatorPassword.set('');   // blank = keep current password
    this.accountError.set(null);
  }

  save(): void {
    if (!this.canSave()) return;
    this.accountError.set(null);
    const code = this.editingCode();
    const email = this.operatorEmail().trim().toLowerCase();
    const password = this.operatorPassword();
    const data = {
      name: this.name(),
      managerName: this.managerName(),
      address: this.address(),
      district: this.district(),
      province: this.province(),
      department: this.department(),
      phone: this.phone(),
      operatorEmail: email,
    };

    if (code === null) {
      // New tienda: the cashier account comes first (it validates email/password);
      // only when it succeeds does the tienda get created.
      const newCode = nextStoreCode(this.store.agents());
      const error = this.authStore.provisionOperator(email, password, this.managerName(), newCode);
      if (error) {
        this.accountError.set(error);
        return;
      }
      this.store.addAgent(data);
    } else {
      const agent = this.store.byCode(code)!;
      if (email) {
        // Existing account: sync email/password/name. No account yet: create it.
        const error = agent.operatorEmail
          ? this.authStore.updateOperatorAccount(code, {
              email,
              password: password || undefined,
              name: this.managerName(),
            })
          : password
            ? this.authStore.provisionOperator(email, password, this.managerName(), code)
            : 'Define una contraseña para crear la cuenta de esta tienda.';
        if (error) {
          this.accountError.set(error);
          return;
        }
      }
      this.store.updateAgent(code, data);
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
    this.operatorEmail.set('');
    this.operatorPassword.set('');
    this.accountError.set(null);
  }
}
