import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentCustomer {
  id: number;
  code: string;
  name: string;
}

export interface PaymentCurrency {
  id: number;
  code: string;
  name: string;
}

export interface PaymentMode {
  id: number;
  code: string;
  name: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Payment {
  id: number;
  code: string;
  customer_id: number;
  currency_id: number;
  payment_mode_id: number | null;
  amount: number;
  date: string;
  notes: string | null;
  customer: PaymentCustomer | null;
  currency: PaymentCurrency | null;
  payment_mode: PaymentMode | null;
  creator: { id: number; name: string } | null;
}

export interface StorePaymentPayload {
  customer_id: number;
  currency_id: number;
  payment_mode_id: number | null;
  amount: number;
  date: string;
  notes: string | null;
}

export interface UpdatePaymentPayload {
  date?: string;
  payment_mode_id?: number | null;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ payments: Payment[]; meta: PaginationMeta }> {
    return this.http.get<{ payments: Payment[]; meta: PaginationMeta }>('/api/v1/payments', {
      params: { page, per_page: perPage },
    });
  }

  create(payload: StorePaymentPayload): Observable<{ payment: Payment }> {
    return this.http.post<{ payment: Payment }>('/api/v1/payments', payload);
  }

  update(id: number, payload: UpdatePaymentPayload): Observable<{ payment: Payment }> {
    return this.http.patch<{ payment: Payment }>(`/api/v1/payments/${id}`, payload);
  }

  getCustomers(): Observable<{ customers: PaymentCustomer[] }> {
    return this.http.get<{ customers: PaymentCustomer[] }>('/api/v1/customers', {
      params: { per_page: 1000 },
    });
  }

  getCurrencies(): Observable<{ currencies: PaymentCurrency[] }> {
    return this.http.get<{ currencies: PaymentCurrency[] }>('/api/v1/currencies');
  }

  getPaymentModes(): Observable<{ payment_modes: PaymentMode[] }> {
    return this.http.get<{ payment_modes: PaymentMode[] }>('/api/v1/payment-modes');
  }

  getReceiptUrl(id: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`/api/v1/payments/${id}/print-url`);
  }
}
