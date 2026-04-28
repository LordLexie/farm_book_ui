import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginLog {
  id: number;
  user_id: number | null;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failed';
  user: { id: number; name: string } | null;
  created_at: string;
}

export interface LoginLogSummary {
  today_total: number;
  today_failed: number;
  month_total: number;
  unique_users_today: number;
}

export interface LoginLogsResponse {
  login_logs: LoginLog[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  summary: LoginLogSummary;
}

@Injectable({ providedIn: 'root' })
export class LoginLogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getAll(page: number, perPage: number, from?: string, to?: string, status?: string): Observable<LoginLogsResponse> {
    let params = new HttpParams().set('page', page).set('per_page', perPage);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (status) params = params.set('status', status);
    return this.http.get<LoginLogsResponse>(`${this.base}/login-logs`, { params });
  }
}
