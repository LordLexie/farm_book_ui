import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Invoice,
  InvoiceCustomer,
  InvoiceCurrency,
  InvoiceFarmItem,
  InvoiceItemPayload,
  InvoiceService,
  InvoiceStatus,
  InvoiceTax,
  InvoiceUnitOfMeasure,
  PaginationMeta,
} from './invoice.service';

export interface ProFormaInvoiceItem {
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

export interface ProFormaInvoice {
  id: number;
  code: string;
  customer_id: number;
  status_id: number;
  currency_id: number;
  tax_id: number | null;
  date: string;
  discount: number;
  total: number;
  customer: InvoiceCustomer | null;
  status: InvoiceStatus | null;
  currency: InvoiceCurrency | null;
  tax: InvoiceTax | null;
  items: ProFormaInvoiceItem[];
}

export interface StoreProFormaPayload {
  customer_id: number;
  status_id?: number;
  currency_id: number;
  tax_id?: number | null;
  date: string;
  discount?: number;
  items: InvoiceItemPayload[];
}

export interface UpdateProFormaPayload {
  customer_id?: number;
  status_id?: number;
  currency_id?: number;
  tax_id?: number | null;
  date?: string;
  discount?: number;
  items?: InvoiceItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class ProFormaInvoiceService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ pro_forma_invoices: ProFormaInvoice[]; meta: PaginationMeta }> {
    return this.http.get<{ pro_forma_invoices: ProFormaInvoice[]; meta: PaginationMeta }>('/api/v1/pro-forma-invoices', {
      params: { page, per_page: perPage },
    });
  }

  getById(id: number): Observable<{ pro_forma_invoice: ProFormaInvoice }> {
    return this.http.get<{ pro_forma_invoice: ProFormaInvoice }>(`/api/v1/pro-forma-invoices/${id}`);
  }

  create(data: StoreProFormaPayload): Observable<{ pro_forma_invoice: ProFormaInvoice }> {
    return this.http.post<{ pro_forma_invoice: ProFormaInvoice }>('/api/v1/pro-forma-invoices', data);
  }

  update(id: number, data: UpdateProFormaPayload): Observable<{ pro_forma_invoice: ProFormaInvoice }> {
    return this.http.patch<{ pro_forma_invoice: ProFormaInvoice }>(`/api/v1/pro-forma-invoices/${id}`, data);
  }

  destroy(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/v1/pro-forma-invoices/${id}`);
  }

  convert(id: number): Observable<{ invoice: Invoice }> {
    return this.http.post<{ invoice: Invoice }>(`/api/v1/pro-forma-invoices/${id}/convert`, {});
  }

  getPrintUrl(id: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`/api/v1/pro-forma-invoices/${id}/print-url`);
  }
}
