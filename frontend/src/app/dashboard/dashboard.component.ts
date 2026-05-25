import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../auth/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats = signal({ companies: 0, users: 0, machines: 0 });
  recentMachines = signal<any[]>([]);
  recentUsers = signal<any[]>([]);
  loading = signal(true);

  constructor(
    private api: ApiService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    forkJoin({
      companies: this.api.getCompanies(),
      users: this.api.getUsers(),
      machines: this.api.getMachines(),
    }).subscribe({
      next: ({ companies, users, machines }) => {
        this.stats.set({
          companies: companies.length,
          users: users.length,
          machines: machines.length,
        });
        this.recentMachines.set(machines.slice(0, 5));
        this.recentUsers.set(users.slice(0, 5));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
