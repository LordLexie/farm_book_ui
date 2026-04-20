import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MilkSaleCustomer {
  id: number;
  code: string;
  name: string;
  rate_plan_id: number | null;
}

export interface MilkSaleCurrency {
  id: number;
  code: string;
  name: string;
}

export interface MilkSale {
  id: number;
  code: string;
  customer_id: number;
  currency_id: number;
  date: string;
  quantity: number;
  unit_price: number;
  total: number;
  amount_paid: number;
  balance: number;
  customer: MilkSaleCustomer | null;
  currency: MilkSaleCurrency | null;
  creator: { id: number; name: string } | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MilkSalePayload {
  customer_id: number;
  currency_id: number;
  date: string;
  quantity: number;
  unit_price: number;
}

@Injectable({ providedIn: 'root' })
export class MilkSaleService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ milk_sales: MilkSale[]; meta: PaginationMeta }> {
    return this.http.get<{ milk_sales: MilkSale[]; meta: PaginationMeta }>('/api/v1/milk-sales', {
      params: { page, per_page: perPage },
    });
  }

  create(payload: MilkSalePayload): Observable<{ milk_sale: MilkSale }> {
    return this.http.post<{ milk_sale: MilkSale }>('/api/v1/milk-sales', payload);
  }

  update(id: number, payload: Partial<MilkSalePayload>): Observable<{ milk_sale: MilkSale }> {
    return this.http.patch<{ milk_sale: MilkSale }>(`/api/v1/milk-sales/${id}`, payload);
  }

  getCustomers(): Observable<{ customers: MilkSaleCustomer[] }> {
    return this.http.get<{ customers: MilkSaleCustomer[] }>('/api/v1/customers', {
      params: { per_page: 1000 },
    });
  }

  getCurrencies(): Observable<{ currencies: MilkSaleCurrency[] }> {
    return this.http.get<{ currencies: MilkSaleCurrency[] }>('/api/v1/currencies');
  }

  getMilkRates(): Observable<{ milk_rates: { id: number; rate_plan_id: number; price: number }[] }> {
    return this.http.get<{ milk_rates: { id: number; rate_plan_id: number; price: number }[] }>(
      '/api/v1/milk-rates',
    );
  }
}
