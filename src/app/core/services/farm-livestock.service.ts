import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface LivestockStatus {
  id: number;
  code: string;
  name: string;
}

export interface LivestockType {
  id: number;
  code: string;
  name: string;
}

export interface LivestockFarm {
  id: number;
  code: string;
  name: string;
}

export interface LivestockGender {
  id: number;
  code: string;
  name: string;
}

export interface FarmLivestock {
  id: number;
  code: string;
  farm_id: number;
  livestock_type_id: number;
  name: string | null;
  description: string | null;
  date_of_birth: string | null;
  breed: string | null;
  status_id: number;
  gender_id: number;
  farm: LivestockFarm | null;
  livestock_type: LivestockType | null;
  status: LivestockStatus | null;
  gender: LivestockGender | null;
}

export interface FarmLivestockPayload {
  farm_id: number;
  livestock_type_id: number;
  gender_id: number;
  name?: string | null;
  description?: string | null;
  date_of_birth?: string | null;
  breed?: string | null;
  status_id?: number;
}

@Injectable({ providedIn: 'root' })
export class FarmLivestockService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ farm_livestocks: FarmLivestock[]; meta: PaginationMeta }> {
    return this.http.get<{ farm_livestocks: FarmLivestock[]; meta: PaginationMeta }>('/api/v1/farm-livestocks', {
      params: { page, per_page: perPage },
    });
  }

  create(payload: FarmLivestockPayload): Observable<{ farm_livestocks: FarmLivestock[] }> {
    return this.http.post<{ farm_livestocks: FarmLivestock[] }>('/api/v1/farm-livestocks', {
      items: [payload],
    });
  }

  update(id: number, payload: FarmLivestockPayload): Observable<{ farm_livestock: FarmLivestock }> {
    return this.http.patch<{ farm_livestock: FarmLivestock }>(
      `/api/v1/farm-livestocks/${id}`,
      payload,
    );
  }

  getLivestockTypes(): Observable<{ livestock_types: LivestockType[] }> {
    return this.http.get<{ livestock_types: LivestockType[] }>('/api/v1/livestock-types');
  }

  getFarms(): Observable<{ farms: LivestockFarm[] }> {
    return this.http.get<{ farms: LivestockFarm[] }>('/api/v1/farms');
  }

  getGenders(): Observable<{ genders: LivestockGender[] }> {
    return this.http.get<{ genders: LivestockGender[] }>('/api/v1/genders');
  }

  getStatuses(): Observable<{ statuses: LivestockStatus[] }> {
    return this.http.get<{ statuses: LivestockStatus[] }>('/api/v1/statuses?category=LIVE');
  }
}
