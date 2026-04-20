import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface QuotationStatus {
  id: number;
  code: string;
  name: string;
}

export interface QuotationCustomer {
  id: number;
  code: string;
  name: string;
}

export interface QuotationUnitOfMeasure {
  id: number;
  code: string;
  name: string;
}

export interface QuotationItem {
  id: number;
  name: string;
  description: string | null;
  unit_of_measure_id: number;
  quantity: number;
  unit_price: number;
  unit_of_measure: QuotationUnitOfMeasure | null;
}

export interface Quotation {
  id: number;
  code: string;
  customer_id: number;
  status_id: number;
  date: string;
  valid_until: string | null;
  total: number;
  notes: string | null;
  customer: QuotationCustomer | null;
  status: QuotationStatus | null;
  items: QuotationItem[];
}

export interface QuotationItemPayload {
  name: string;
  description?: string | null;
  unit_of_measure_id: number;
  quantity: number;
  unit_price: number;
}

export interface StoreQuotationPayload {
  customer_id: number;
  date: string;
  valid_until?: string | null;
  notes?: string | null;
  items: QuotationItemPayload[];
}

export interface UpdateQuotationPayload {
  customer_id?: number;
  status_id?: number;
  date?: string;
  valid_until?: string | null;
  notes?: string | null;
  items?: QuotationItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class QuotationService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ quotations: Quotation[]; meta: PaginationMeta }> {
    return this.http.get<{ quotations: Quotation[]; meta: PaginationMeta }>('/api/v1/quotations', {
      params: { page, per_page: perPage },
    });
  }

  getById(id: number): Observable<{ quotation: Quotation }> {
    return this.http.get<{ quotation: Quotation }>(`/api/v1/quotations/${id}`);
  }

  create(data: StoreQuotationPayload): Observable<{ quotation: Quotation }> {
    return this.http.post<{ quotation: Quotation }>('/api/v1/quotations', data);
  }

  update(id: number, data: UpdateQuotationPayload): Observable<{ quotation: Quotation }> {
    return this.http.patch<{ quotation: Quotation }>(`/api/v1/quotations/${id}`, data);
  }

  getPrintUrl(id: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`/api/v1/quotations/${id}/print-url`);
  }

  getCustomers(): Observable<{ customers: QuotationCustomer[] }> {
    return this.http.get<{ customers: QuotationCustomer[] }>('/api/v1/customers', {
      params: { per_page: 1000 },
    });
  }

  getStatuses(): Observable<{ statuses: QuotationStatus[] }> {
    return this.http.get<{ statuses: QuotationStatus[] }>('/api/v1/statuses');
  }

  getUnitOfMeasures(): Observable<{ unit_of_measures: QuotationUnitOfMeasure[] }> {
    return this.http.get<{ unit_of_measures: QuotationUnitOfMeasure[] }>('/api/v1/unit-of-measures');
  }
}
