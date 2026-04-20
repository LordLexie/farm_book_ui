import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Farm, Status } from './farm.service';
import { ItemMaster } from './item-master.service';

export interface FarmItem {
  id: number;
  code: string;
  farm_id: number;
  item_master_id: number;
  quantity: number;
  status_id: number;
  farm: Farm;
  item_master: ItemMaster;
  status: Status;
}

export interface FarmItemRow {
  farm_id: number;
  item_master_id: number;
  quantity: number;
  status_id?: number;
}

export interface FarmItemUpdateData {
  farm_id?: number;
  item_master_id?: number;
  quantity?: number;
  status_id?: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedFarmItems {
  farm_items: FarmItem[];
  meta: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class FarmItemService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getAll(page = 1, perPage = 15): Observable<PaginatedFarmItems> {
    return this.http.get<PaginatedFarmItems>(`${this.base}/farm-items`, {
      params: { page, per_page: perPage },
    });
  }

  create(items: FarmItemRow[]): Observable<{ message: string; farm_items: FarmItem[] }> {
    return this.http.post<{ message: string; farm_items: FarmItem[] }>(`${this.base}/farm-items`, {
      items,
    });
  }

  update(id: number, data: FarmItemUpdateData): Observable<{ message: string; farm_item: FarmItem }> {
    return this.http.patch<{ message: string; farm_item: FarmItem }>(`${this.base}/farm-items/${id}`, data);
  }
}
