import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Status {
  id: number;
  code: string;
  name: string;
}

export interface Farm {
  id: number;
  code: string;
  name: string;
  longitude: string | null;
  latitude: string | null;
  status_id: number;
  status: Status;
}

export interface FarmFormData {
  name: string;
  longitude: string | null;
  latitude: string | null;
  status_id?: number;
}

@Injectable({ providedIn: 'root' })
export class FarmService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getAll(): Observable<{ farms: Farm[] }> {
    return this.http.get<{ farms: Farm[] }>(`${this.base}/farms`);
  }

  create(data: FarmFormData): Observable<{ message: string; farm: Farm }> {
    return this.http.post<{ message: string; farm: Farm }>(`${this.base}/farms`, data);
  }

  update(id: number, data: Partial<FarmFormData>): Observable<{ message: string; farm: Farm }> {
    return this.http.patch<{ message: string; farm: Farm }>(`${this.base}/farms/${id}`, data);
  }

  getStatuses(): Observable<{ statuses: Status[] }> {
    return this.http.get<{ statuses: Status[] }>(`${this.base}/statuses`, {
      params: { category: 'GEN' },
    });
  }
}
