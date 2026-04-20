import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LookupItem {
  id: number;
  code: string;
  name: string;
}

export interface LookupConfig {
  /** API path segment, e.g. 'unit-of-measures' */
  resource: string;
  /** Top-level key in GET/POST response, e.g. 'unit_of_measures' */
  responseKey: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly http = inject(HttpClient);

  getAll(
    resource: string,
    page = 1,
    perPage = 15,
  ): Observable<{ meta: PaginationMeta } & Record<string, unknown>> {
    return this.http.get<{ meta: PaginationMeta } & Record<string, unknown>>(`/api/v1/${resource}`, {
      params: { page, per_page: perPage },
    });
  }

  create(
    resource: string,
    items: { code: string; name: string }[],
  ): Observable<Record<string, LookupItem[]>> {
    return this.http.post<Record<string, LookupItem[]>>(`/api/v1/${resource}`, { items });
  }

  update(
    resource: string,
    id: number,
    data: { code?: string; name?: string },
  ): Observable<Record<string, LookupItem>> {
    return this.http.patch<Record<string, LookupItem>>(`/api/v1/${resource}/${id}`, data);
  }
}
