import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ItemCategory {
  id: number;
  code: string;
  name: string;
}

export interface UnitOfMeasure {
  id: number;
  code: string;
  name: string;
}

export interface ItemMaster {
  id: number;
  code: string;
  name: string;
  description: string | null;
  item_category_id: number;
  unit_of_measure_id: number;
  item_category: ItemCategory;
  unit_of_measure: UnitOfMeasure;
}

export interface ItemMasterFormData {
  name: string;
  description: string | null;
  item_category_id: number;
  unit_of_measure_id: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedItemMasters {
  item_masters: ItemMaster[];
  meta: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class ItemMasterService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getAll(page = 1, perPage = 15): Observable<PaginatedItemMasters> {
    return this.http.get<PaginatedItemMasters>(`${this.base}/item-masters`, {
      params: { page, per_page: perPage },
    });
  }

  create(items: ItemMasterFormData[]): Observable<{ message: string; item_masters: ItemMaster[] }> {
    return this.http.post<{ message: string; item_masters: ItemMaster[] }>(`${this.base}/item-masters`, {
      items,
    });
  }

  update(id: number, data: Partial<ItemMasterFormData>): Observable<{ message: string; item_master: ItemMaster }> {
    return this.http.patch<{ message: string; item_master: ItemMaster }>(`${this.base}/item-masters/${id}`, data);
  }

  getCategories(): Observable<{ item_categories: ItemCategory[] }> {
    return this.http.get<{ item_categories: ItemCategory[] }>(`${this.base}/item-categories`, {
      params: { per_page: 100 },
    });
  }

  getUnitsOfMeasure(): Observable<{ unit_of_measures: UnitOfMeasure[] }> {
    return this.http.get<{ unit_of_measures: UnitOfMeasure[] }>(`${this.base}/unit-of-measures`, {
      params: { per_page: 100 },
    });
  }
}
