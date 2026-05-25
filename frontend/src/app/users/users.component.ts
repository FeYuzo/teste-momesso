import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, User, Company } from '../shared/api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  companies = signal<Company[]>([]);
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  deleteConfirm = signal<string | null>(null);
  error = signal('');
  success = signal('');

  form: any = {};
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
    this.api.getUsers().subscribe({
      next: (data) => { this.users.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.form = { role: 'USER', companyId: this.authService.currentUser()?.companyId };
    this.editingId = null;
    this.error.set('');
    this.showModal.set(true);
  }

  openEdit(u: User) {
    this.form = { name: u.name, email: u.email, role: u.role, companyId: u.companyId };
    this.editingId = u.id;
    this.error.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.form = {};
    this.editingId = null;
  }

  save() {
    if (!this.form.name || !this.form.email || (!this.editingId && !this.form.password)) {
      this.error.set('Preencha todos os campos obrigatórios');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const payload = { ...this.form };
    if (this.editingId && !payload.password) delete payload.password;

    const obs = this.editingId
      ? this.api.updateUser(this.editingId, payload)
      : this.api.createUser(payload);

    obs.subscribe({
      next: () => {
        this.closeModal();
        this.load();
        this.showSuccessMsg(this.editingId ? 'Usuário atualizado!' : 'Usuário criado!');
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
    this.api.deleteUser(id).subscribe({
      next: () => {
        this.deleteConfirm.set(null);
        this.load();
        this.showSuccessMsg('Usuário removido!');
      },
      error: () => this.deleteConfirm.set(null),
    });
  }

  private showSuccessMsg(msg: string) {
    this.success.set(msg);
    setTimeout(() => this.success.set(''), 3000);
  }
}
