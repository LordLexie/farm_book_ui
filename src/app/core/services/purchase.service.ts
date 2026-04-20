import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

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

export interface PurchaseSupplier {
  id: number;
  code: string;
  name: string;
}

export interface ItemMaster {
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

export interface PurchaseItem {
  id: number;
  item_master_id: number;
  unit_of_measure_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  notes: string | null;
  item_master: ItemMaster | null;
  unit_of_measure: UnitOfMeasure | null;
}

export interface Purchase {
  id: number;
  code: string;
  supplier_id: number;
  quotation_id: number | null;
  status_id: number;
  currency_id: number;
  date: string;
  total: number;
  notes: string | null;
  supplier: PurchaseSupplier | null;
  status: Status | null;
  currency: Currency | null;
  items: PurchaseItem[];
}

export interface PurchaseItemPayload {
  item_master_id: number;
  unit_of_measure_id: number;
  quantity: number;
  unit_price: number;
}

export interface StorePurchasePayload {
  supplier_id: number;
  quotation_id?: number | null;
  status_id: number;
  currency_id: number;
  date: string;
  notes?: string | null;
  items: PurchaseItemPayload[];
}

export interface UpdatePurchasePayload {
  supplier_id?: number;
  quotation_id?: number | null;
  status_id?: number;
  currency_id?: number;
  date?: string;
  notes?: string | null;
  items?: PurchaseItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ purchases: Purchase[]; meta: PaginationMeta }> {
    return this.http.get<{ purchases: Purchase[]; meta: PaginationMeta }>('/api/v1/purchases', {
      params: { page, per_page: perPage },
    });
  }

  getById(id: number): Observable<{ purchase: Purchase }> {
    return this.http.get<{ purchase: Purchase }>(`/api/v1/purchases/${id}`);
  }

  create(data: StorePurchasePayload): Observable<{ purchase: Purchase }> {
    return this.http.post<{ purchase: Purchase }>('/api/v1/purchases', data);
  }

  update(id: number, data: UpdatePurchasePayload): Observable<{ purchase: Purchase }> {
    return this.http.patch<{ purchase: Purchase }>(`/api/v1/purchases/${id}`, data);
  }

  getSuppliers(): Observable<{ suppliers: PurchaseSupplier[] }> {
    return this.http.get<{ suppliers: PurchaseSupplier[] }>('/api/v1/suppliers');
  }

  getStatuses(): Observable<{ statuses: Status[] }> {
    return this.http.get<{ statuses: Status[] }>('/api/v1/statuses');
  }

  getCurrencies(): Observable<{ currencies: Currency[] }> {
    return this.http.get<{ currencies: Currency[] }>('/api/v1/currencies');
  }

  getItemMasters(): Observable<{ item_masters: ItemMaster[] }> {
    return this.http.get<{ item_masters: ItemMaster[] }>('/api/v1/item-masters?per_page=100');
  }

  getUnitOfMeasures(): Observable<{ unit_of_measures: UnitOfMeasure[] }> {
    return this.http.get<{ unit_of_measures: UnitOfMeasure[] }>('/api/v1/unit-of-measures');
  }
}
