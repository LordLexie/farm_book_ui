import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Status {
  id: number;
  code: string;
  name: string;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
}

export interface BillSupplier {
  id: number;
  code: string;
  name: string;
}

export interface BillService {
  id: number;
  code: string;
  name: string;
  unit_of_measure_id: number;
}

export interface UnitOfMeasure {
  id: number;
  code: string;
  name: string;
}

export interface BillItem {
  id: number;
  service_id: number;
  unit_of_measure_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  notes: string | null;
  service: BillService | null;
  unit_of_measure: UnitOfMeasure | null;
}

export interface Bill {
  id: number;
  code: string;
  supplier_id: number;
  status_id: number;
  currency_id: number;
  date: string;
  total: number;
  notes: string | null;
  supplier: BillSupplier | null;
  status: Status | null;
  currency: Currency | null;
  items: BillItem[];
}

export interface BillItemPayload {
  service_id: number;
  unit_of_measure_id: number;
  quantity: number;
  unit_price: number;
}

export interface StoreBillPayload {
  supplier_id: number;
  status_id: number;
  currency_id: number;
  date: string;
  notes?: string | null;
  items: BillItemPayload[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UpdateBillPayload {
  supplier_id?: number;
  status_id?: number;
  currency_id?: number;
  date?: string;
  notes?: string | null;
  items?: BillItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class BillService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ bills: Bill[]; meta: PaginationMeta }> {
    return this.http.get<{ bills: Bill[]; meta: PaginationMeta }>('/api/v1/bills', {
      params: { page, per_page: perPage },
    });
  }

  getById(id: number): Observable<{ bill: Bill }> {
    return this.http.get<{ bill: Bill }>(`/api/v1/bills/${id}`);
  }

  create(data: StoreBillPayload): Observable<{ bill: Bill }> {
    return this.http.post<{ bill: Bill }>('/api/v1/bills', data);
  }

  update(id: number, data: UpdateBillPayload): Observable<{ bill: Bill }> {
    return this.http.patch<{ bill: Bill }>(`/api/v1/bills/${id}`, data);
  }

  getSuppliers(): Observable<{ suppliers: BillSupplier[] }> {
    return this.http.get<{ suppliers: BillSupplier[] }>('/api/v1/suppliers');
  }

  getStatuses(): Observable<{ statuses: Status[] }> {
    return this.http.get<{ statuses: Status[] }>('/api/v1/statuses');
  }

  getCurrencies(): Observable<{ currencies: Currency[] }> {
    return this.http.get<{ currencies: Currency[] }>('/api/v1/currencies');
  }

  getServices(): Observable<{ services: BillService[] }> {
    return this.http.get<{ services: BillService[] }>('/api/v1/services', { params: { per_page: 100 } });
  }

  getUnitOfMeasures(): Observable<{ unit_of_measures: UnitOfMeasure[] }> {
    return this.http.get<{ unit_of_measures: UnitOfMeasure[] }>('/api/v1/unit-of-measures');
  }
}
