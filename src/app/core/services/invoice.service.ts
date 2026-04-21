import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface InvoiceStatus {
  id: number;
  code: string;
  name: string;
}

export interface InvoiceCurrency {
  id: number;
  code: string;
  name: string;
}

export interface InvoiceCustomer {
  id: number;
  code: string;
  name: string;
}

export interface InvoiceFarmItem {
  id: number;
  code: string;
  name: string;
}

export interface InvoiceService {
  id: number;
  code: string;
  name: string;
  unit_of_measure_id: number;
}

export interface InvoiceUnitOfMeasure {
  id: number;
  code: string;
  name: string;
}

export interface InvoiceTax {
  id: number;
  code: string;
  name: string;
  value: number;
}

export interface InvoiceItem {
  id: number;
  invoiceable_type: 'farm_item' | 'service';
  invoiceable_id: number;
  unit_of_measure_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  invoiceable: InvoiceFarmItem | InvoiceService | null;
  unit_of_measure: InvoiceUnitOfMeasure | null;
}

export interface Invoice {
  id: number;
  code: string;
  customer_id: number;
  status_id: number;
  currency_id: number;
  tax_id: number | null;
  date: string;
  discount: number;
  total: number;
  amount: number | null;
  balance: number | null;
  customer: InvoiceCustomer | null;
  status: InvoiceStatus | null;
  currency: InvoiceCurrency | null;
  tax: InvoiceTax | null;
  items: InvoiceItem[];
}

export interface InvoiceItemPayload {
  invoiceable_type: 'farm_item' | 'service';
  invoiceable_id: number;
  unit_of_measure_id: number;
  quantity: number;
  unit_price: number;
}

export interface StoreInvoicePayload {
  customer_id: number;
  status_id?: number;
  currency_id: number;
  tax_id?: number | null;
  date: string;
  discount?: number;
  items: InvoiceItemPayload[];
}

export interface UpdateInvoicePayload {
  customer_id?: number;
  status_id?: number;
  currency_id?: number;
  tax_id?: number | null;
  date?: string;
  discount?: number;
  items?: InvoiceItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ invoices: Invoice[]; meta: PaginationMeta }> {
    return this.http.get<{ invoices: Invoice[]; meta: PaginationMeta }>('/api/v1/invoices', {
      params: { page, per_page: perPage },
    });
  }

  getById(id: number): Observable<{ invoice: Invoice }> {
    return this.http.get<{ invoice: Invoice }>(`/api/v1/invoices/${id}`);
  }

  create(data: StoreInvoicePayload): Observable<{ invoice: Invoice }> {
    return this.http.post<{ invoice: Invoice }>('/api/v1/invoices', data);
  }

  update(id: number, data: UpdateInvoicePayload): Observable<{ invoice: Invoice }> {
    return this.http.patch<{ invoice: Invoice }>(`/api/v1/invoices/${id}`, data);
  }

  getCustomers(): Observable<{ customers: InvoiceCustomer[] }> {
    return this.http.get<{ customers: InvoiceCustomer[] }>('/api/v1/customers', {
      params: { per_page: 1000 },
    });
  }

  getStatuses(): Observable<{ statuses: InvoiceStatus[] }> {
    return this.http.get<{ statuses: InvoiceStatus[] }>('/api/v1/statuses?category=GEN');
  }

  getCurrencies(): Observable<{ currencies: InvoiceCurrency[] }> {
    return this.http.get<{ currencies: InvoiceCurrency[] }>('/api/v1/currencies');
  }

  getFarmItems(): Observable<{ farm_items: InvoiceFarmItem[] }> {
    return this.http.get<{ farm_items: InvoiceFarmItem[] }>('/api/v1/farm-items', {
      params: { per_page: 1000 },
    });
  }

  getServices(): Observable<{ services: InvoiceService[] }> {
    return this.http.get<{ services: InvoiceService[] }>('/api/v1/services', {
      params: { per_page: 1000 },
    });
  }

  getUnitOfMeasures(): Observable<{ unit_of_measures: InvoiceUnitOfMeasure[] }> {
    return this.http.get<{ unit_of_measures: InvoiceUnitOfMeasure[] }>('/api/v1/unit-of-measures');
  }

  getTaxes(): Observable<{ taxes: InvoiceTax[] }> {
    return this.http.get<{ taxes: InvoiceTax[] }>('/api/v1/taxes');
  }

  getPrintUrl(id: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`/api/v1/invoices/${id}/print-url`);
  }
}
