import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getAll(page = 1, perPage = 15): Observable<{ permissions: Permission[]; meta: PaginationMeta }> {
    return this.http.get<{ permissions: Permission[]; meta: PaginationMeta }>(
      `${this.base}/permissions`,
      { params: { page, per_page: perPage } },
    );
  }

  create(name: string): Observable<{ message: string; permission: Permission }> {
    return this.http.post<{ message: string; permission: Permission }>(
      `${this.base}/permissions`,
      { name },
    );
  }

  update(id: number, name: string): Observable<{ message: string; permission: Permission }> {
    return this.http.patch<{ message: string; permission: Permission }>(
      `${this.base}/permissions/${id}`,
      { name },
    );
  }

  getAllUnpaginated(): Observable<Permission[]> {
    return this.http
      .get<{ permissions: Permission[]; meta: PaginationMeta }>(`${this.base}/permissions`, {
        params: { page: 1, per_page: 100 },
      })
      .pipe(map((res) => res.permissions));
  }
}
