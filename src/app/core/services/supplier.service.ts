import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Status } from './farm.service';

export type { Status };

export interface Gender {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  code: string;
  type: 'individual' | 'organization';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  first_name: string | null;
  last_name: string | null;
  gender_id: number | null;
  registration_number: string | null;
  contact_person: string | null;
  status_id: number;
  status: Status | null;
  gender: Gender | null;
}

export interface SupplierPayload {
  type: 'individual' | 'organization';
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status_id?: number;
  first_name?: string | null;
  last_name?: string | null;
  gender_id?: number | null;
  registration_number?: string | null;
  contact_person?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<{ suppliers: Supplier[] }> {
    return this.http.get<{ suppliers: Supplier[] }>('/api/v1/suppliers');
  }

  create(data: SupplierPayload): Observable<{ supplier: Supplier }> {
    return this.http.post<{ supplier: Supplier }>('/api/v1/suppliers', data);
  }

  update(id: number, data: SupplierPayload): Observable<{ supplier: Supplier }> {
    return this.http.patch<{ supplier: Supplier }>(`/api/v1/suppliers/${id}`, data);
  }

  getStatuses(): Observable<{ statuses: Status[] }> {
    return this.http.get<{ statuses: Status[] }>('/api/v1/statuses?category=GEN');
  }

  getGenders(): Observable<{ genders: Gender[] }> {
    return this.http.get<{ genders: Gender[] }>('/api/v1/genders');
  }
}
