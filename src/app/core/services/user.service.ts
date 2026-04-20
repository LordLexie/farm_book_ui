import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginationMeta } from './permission.service';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getAll(page = 1, perPage = 15): Observable<{ users: AppUser[]; meta: PaginationMeta }> {
    return this.http.get<{ users: AppUser[]; meta: PaginationMeta }>(`${this.base}/users`, {
      params: { page, per_page: perPage },
    });
  }

  create(data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Observable<{ message: string; user: AppUser }> {
    return this.http.post<{ message: string; user: AppUser }>(`${this.base}/users`, data);
  }

  update(
    id: number,
    data: { name: string; email: string; role: string },
  ): Observable<{ message: string; user: AppUser }> {
    return this.http.patch<{ message: string; user: AppUser }>(`${this.base}/users/${id}`, data);
  }
}
