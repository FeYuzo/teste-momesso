import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  companyId: string;
  company?: Company;
  createdAt: string;
}

export interface Machine {
  id: string;
  name: string;
  serialNumber: string;
  companyId: string;
  company?: Company;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Companies
  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.base}/companies`);
  }
  getCompany(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.base}/companies/${id}`);
  }
  createCompany(data: Partial<Company>): Observable<Company> {
    return this.http.post<Company>(`${this.base}/companies`, data);
  }
  updateCompany(id: string, data: Partial<Company>): Observable<Company> {
    return this.http.patch<Company>(`${this.base}/companies/${id}`, data);
  }
  deleteCompany(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/companies/${id}`);
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/users/${id}`);
  }
  createUser(data: Partial<User> & { password: string }): Observable<User> {
    return this.http.post<User>(`${this.base}/users`, data);
  }
  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}`, data);
  }
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  // Machines
  getMachines(): Observable<Machine[]> {
    return this.http.get<Machine[]>(`${this.base}/machines`);
  }
  getMachine(id: string): Observable<Machine> {
    return this.http.get<Machine>(`${this.base}/machines/${id}`);
  }
  createMachine(data: Partial<Machine>): Observable<Machine> {
    return this.http.post<Machine>(`${this.base}/machines`, data);
  }
  updateMachine(id: string, data: Partial<Machine>): Observable<Machine> {
    return this.http.patch<Machine>(`${this.base}/machines/${id}`, data);
  }
  deleteMachine(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/machines/${id}`);
  }
}
