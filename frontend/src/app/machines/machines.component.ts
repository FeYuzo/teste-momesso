import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Machine, Company } from '../shared/api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.scss'],
})
export class MachinesComponent implements OnInit {
  machines = signal<Machine[]>([]);
  companies = signal<Company[]>([]);
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  deleteConfirm = signal<string | null>(null);
  error = signal('');
  success = signal('');

  form: Partial<Machine> = {};
  editingId: string | null = null;

  constructor(
    private api: ApiService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.load();
    this.api.getCompanies().subscribe((c) => this.companies.set(c));
  }

  load() {
    this.loading.set(true);
    this.api.getMachines().subscribe({
      next: (data) => { this.machines.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.form = { companyId: this.authService.currentUser()?.companyId };
    this.editingId = null;
    this.error.set('');
    this.showModal.set(true);
  }

  openEdit(m: Machine) {
    this.form = { name: m.name, serialNumber: m.serialNumber, companyId: m.companyId };
    this.editingId = m.id;
    this.error.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.form = {};
    this.editingId = null;
  }

  save() {
    if (!this.form.name || !this.form.serialNumber || !this.form.companyId) {
      this.error.set('Preencha todos os campos obrigatórios');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const obs = this.editingId
      ? this.api.updateMachine(this.editingId, this.form)
      : this.api.createMachine(this.form);

    obs.subscribe({
      next: () => {
        this.closeModal();
        this.load();
        this.showSuccessMsg(this.editingId ? 'Máquina atualizada!' : 'Máquina criada!');
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erro ao salvar');
        this.saving.set(false);
      },
    });
  }

  confirmDelete(id: string) { this.deleteConfirm.set(id); }
  cancelDelete() { this.deleteConfirm.set(null); }

  doDelete() {
    const id = this.deleteConfirm();
    if (!id) return;
    this.api.deleteMachine(id).subscribe({
      next: () => {
        this.deleteConfirm.set(null);
        this.load();
        this.showSuccessMsg('Máquina removida!');
      },
      error: () => this.deleteConfirm.set(null),
    });
  }

  private showSuccessMsg(msg: string) {
    this.success.set(msg);
    setTimeout(() => this.success.set(''), 3000);
  }
}
