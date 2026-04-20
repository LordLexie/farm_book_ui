import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Status } from './farm.service';

export type { Status };

export interface ServiceType {
  id: number;
  code: string;
  name: string;
}

export interface UnitOfMeasure {
  id: number;
  code: string;
  name: string;
}

export interface Service {
  id: number;
  code: string;
  name: string;
  description: string | null;
  service_type_id: number;
  unit_of_measure_id: number;
  status_id: number;
  service_type: ServiceType | null;
  unit_of_measure: UnitOfMeasure | null;
  status: Status | null;
}

export interface ServiceFormRow {
  name: string;
  description?: string | null;
  service_type_id: number;
  unit_of_measure_id?: number;
  status_id: number;
}

export interface ServiceUpdateData {
  name?: string;
  description?: string | null;
  service_type_id?: number;
  unit_of_measure_id?: number;
  status_id?: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedServices {
  services: Service[];
  meta: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<PaginatedServices> {
    return this.http.get<PaginatedServices>('/api/v1/services', {
      params: { page, per_page: perPage },
    });
  }

  create(services: ServiceFormRow[]): Observable<{ services: Service[] }> {
    return this.http.post<{ services: Service[] }>('/api/v1/services', { services });
  }

  update(id: number, data: ServiceUpdateData): Observable<{ service: Service }> {
    return this.http.patch<{ service: Service }>(`/api/v1/services/${id}`, data);
  }

  getServiceTypes(): Observable<{ service_types: ServiceType[] }> {
    return this.http.get<{ service_types: ServiceType[] }>('/api/v1/service-types', {
      params: { per_page: 100 },
    });
  }

  getUnitOfMeasures(): Observable<{ unit_of_measures: UnitOfMeasure[] }> {
    return this.http.get<{ unit_of_measures: UnitOfMeasure[] }>('/api/v1/unit-of-measures', {
      params: { per_page: 100 },
    });
  }

  getStatuses(): Observable<{ statuses: Status[] }> {
    return this.http.get<{ statuses: Status[] }>('/api/v1/statuses?category=GEN');
  }
}
