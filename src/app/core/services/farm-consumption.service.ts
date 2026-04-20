import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ConsumptionItemMaster {
  id: number;
  name: string;
}

export interface ConsumptionFarmItem {
  id: number;
  code: string;
  item_master: ConsumptionItemMaster | null;
}

export interface ConsumptionLivestock {
  id: number;
  code: string;
  name: string | null;
}

export interface ConsumptionCreator {
  id: number;
  name: string;
}

export interface FarmConsumption {
  id: number;
  livestock_id: number | null;
  farm_session_id: number | null;
  farm_item_id: number;
  quantity: number;
  consumption_date: string;
  livestock: ConsumptionLivestock | null;
  farm_item: ConsumptionFarmItem | null;
  creator: ConsumptionCreator | null;
}

export interface FarmConsumptionPayload {
  farm_item_id: number;
  quantity: number;
  consumption_date: string;
  livestock_id?: number | null;
}

@Injectable({ providedIn: 'root' })
export class FarmConsumptionService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ farm_consumptions: FarmConsumption[]; meta: PaginationMeta }> {
    return this.http.get<{ farm_consumptions: FarmConsumption[]; meta: PaginationMeta }>('/api/v1/farm-consumptions', {
      params: { page, per_page: perPage },
    });
  }

  create(payload: FarmConsumptionPayload): Observable<{ farm_consumption: FarmConsumption }> {
    return this.http.post<{ farm_consumption: FarmConsumption }>(
      '/api/v1/farm-consumptions',
      payload,
    );
  }

  update(
    id: number,
    payload: FarmConsumptionPayload,
  ): Observable<{ farm_consumption: FarmConsumption }> {
    return this.http.patch<{ farm_consumption: FarmConsumption }>(
      `/api/v1/farm-consumptions/${id}`,
      payload,
    );
  }

  getFarmItems(): Observable<{ farm_items: ConsumptionFarmItem[] }> {
    return this.http.get<{ farm_items: ConsumptionFarmItem[] }>('/api/v1/farm-items');
  }

  getLivestocks(): Observable<{ farm_livestocks: ConsumptionLivestock[] }> {
    return this.http.get<{ farm_livestocks: ConsumptionLivestock[] }>('/api/v1/farm-livestocks');
  }
}
