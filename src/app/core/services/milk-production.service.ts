import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MilkSessionType {
  id: number;
  name: string;
}

export interface MilkSessionFarm {
  id: number;
  name: string;
}

export interface MilkSession {
  id: number;
  code: string;
  notes: string | null;
  farm: MilkSessionFarm | null;
  session_type: MilkSessionType | null;
  started_at: string;
}

export interface MilkLivestock {
  id: number;
  code: string;
  name: string | null;
}

export interface MilkProductionCreator {
  id: number;
  name: string;
}

export interface MilkProduction {
  id: number;
  livestock_id: number;
  farm_session_id: number;
  date: string;
  quantity: number;
  livestock: MilkLivestock | null;
  farm_session: MilkSession | null;
  creator: MilkProductionCreator | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MilkProductionPayload {
  livestock_id: number;
  farm_session_id: number;
  date: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class MilkProductionService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ milk_productions: MilkProduction[]; meta: PaginationMeta }> {
    return this.http.get<{ milk_productions: MilkProduction[]; meta: PaginationMeta }>('/api/v1/milk-productions', {
      params: { page, per_page: perPage },
    });
  }

  create(payload: MilkProductionPayload[]): Observable<{ milk_productions: MilkProduction[] }> {
    return this.http.post<{ milk_productions: MilkProduction[] }>('/api/v1/milk-productions', {
      data: payload,
    });
  }

  update(
    id: number,
    payload: Partial<MilkProductionPayload>,
  ): Observable<{ milk_production: MilkProduction }> {
    return this.http.patch<{ milk_production: MilkProduction }>(
      `/api/v1/milk-productions/${id}`,
      payload,
    );
  }

  getLivestocks(): Observable<{ farm_livestocks: MilkLivestock[] }> {
    return this.http.get<{ farm_livestocks: MilkLivestock[] }>('/api/v1/farm-livestocks');
  }

  getSessions(): Observable<{ farm_sessions: MilkSession[] }> {
    return this.http.get<{ farm_sessions: MilkSession[] }>('/api/v1/farm-sessions');
  }
}
