import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MilkRatePlan {
  id: number;
  code: string;
  name: string;
}

export interface MilkRate {
  id: number;
  rate_plan_id: number;
  price: number;
  rate_plan: MilkRatePlan;
}

export interface MilkRatePayload {
  rate_plan_id?: number;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class MilkRateService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getAll(): Observable<{ milk_rates: MilkRate[] }> {
    return this.http.get<{ milk_rates: MilkRate[] }>(`${this.base}/milk-rates`);
  }

  create(data: MilkRatePayload): Observable<{ message: string; milk_rate: MilkRate }> {
    return this.http.post<{ message: string; milk_rate: MilkRate }>(`${this.base}/milk-rates`, data);
  }

  update(id: number, data: Partial<MilkRatePayload>): Observable<{ message: string; milk_rate: MilkRate }> {
    return this.http.patch<{ message: string; milk_rate: MilkRate }>(`${this.base}/milk-rates/${id}`, data);
  }

  getRatePlans(): Observable<{ rate_plans: MilkRatePlan[] }> {
    return this.http.get<{ rate_plans: MilkRatePlan[] }>(`${this.base}/rate-plans`);
  }
}
