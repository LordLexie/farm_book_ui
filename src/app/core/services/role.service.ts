import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission, PaginationMeta } from './permission.service';

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: Permission[];
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getAll(page = 1, perPage = 15): Observable<{ roles: Role[]; meta: PaginationMeta }> {
    return this.http.get<{ roles: Role[]; meta: PaginationMeta }>(`${this.base}/roles`, {
      params: { page, per_page: perPage },
    });
  }

  getById(id: number): Observable<{ role: Role }> {
    return this.http.get<{ role: Role }>(`${this.base}/roles/${id}`);
  }

  create(data: { name: string }): Observable<{ message: string; role: Role }> {
    return this.http.post<{ message: string; role: Role }>(`${this.base}/roles`, data);
  }

  update(id: number, data: { name: string }): Observable<{ message: string; role: Role }> {
    return this.http.patch<{ message: string; role: Role }>(`${this.base}/roles/${id}`, data);
  }

  syncPermissions(
    roleId: number,
    permissions: string[],
  ): Observable<{ message: string; role: Role }> {
    return this.http.patch<{ message: string; role: Role }>(
      `${this.base}/roles/${roleId}/permissions`,
      { permissions },
    );
  }
}
