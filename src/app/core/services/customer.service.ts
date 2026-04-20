import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CustomerStatus {
  id: number;
  code: string;
  name: string;
}

export interface CustomerGender {
  id: number;
  name: string;
}

export interface CustomerBillingCycle {
  id: number;
  code: string;
  name: string;
}

export interface CustomerRatePlan {
  id: number;
  code: string;
  name: string;
}

export interface Customer {
  id: number;
  code: string;
  type: 'individual' | 'organization';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  first_name: string | null;
  last_name: string | null;
  gender_id: number | null;
  registration_number: string | null;
  contact_person: string | null;
  status_id: number;
  billing_cycle_id: number | null;
  rate_plan_id: number | null;
  amount_due: number;
  credit: number;
  status: CustomerStatus | null;
  gender: CustomerGender | null;
  billingCycle: CustomerBillingCycle | null;
  ratePlan: CustomerRatePlan | null;
}

export interface CustomerPayload {
  type: 'individual' | 'organization';
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status_id?: number;
  first_name?: string | null;
  last_name?: string | null;
  gender_id?: number | null;
  registration_number?: string | null;
  contact_person?: string | null;
  billing_cycle_id?: number | null;
  rate_plan_id?: number | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<{ customers: Customer[]; meta: PaginationMeta }> {
    return this.http.get<{ customers: Customer[]; meta: PaginationMeta }>('/api/v1/customers', {
      params: { page, per_page: perPage },
    });
  }

  create(data: CustomerPayload): Observable<{ customer: Customer }> {
    return this.http.post<{ customer: Customer }>('/api/v1/customers', data);
  }

  update(id: number, data: CustomerPayload): Observable<{ customer: Customer }> {
    return this.http.patch<{ customer: Customer }>(`/api/v1/customers/${id}`, data);
  }

  getStatuses(): Observable<{ statuses: CustomerStatus[] }> {
    return this.http.get<{ statuses: CustomerStatus[] }>('/api/v1/statuses?category=GEN');
  }

  getGenders(): Observable<{ genders: CustomerGender[] }> {
    return this.http.get<{ genders: CustomerGender[] }>('/api/v1/genders');
  }

  getBillingCycles(): Observable<{ billing_cycles: CustomerBillingCycle[] }> {
    return this.http.get<{ billing_cycles: CustomerBillingCycle[] }>('/api/v1/billing-cycles');
  }

  getRatePlans(): Observable<{ rate_plans: CustomerRatePlan[] }> {
    return this.http.get<{ rate_plans: CustomerRatePlan[] }>('/api/v1/rate-plans');
  }
}
