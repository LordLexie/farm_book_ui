import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type DeliveryStatus = 'active' | 'cancelled';

export const DELIVERY_STATUSES: DeliveryStatus[] = ['active', 'cancelled'];

export interface DeliveryNoteCustomer {
  id: number;
  code: string;
  name: string;
}

export interface DeliveryNoteItem {
  id: number;
  invoice_item_id: number | null;
  name: string;
  description: string | null;
  unit_of_measure_id: number | null;
  qty_ordered: number;
  unit_of_measure: { id: number; code: string; name: string } | null;
}

export interface DeliveryNote {
  id: number;
  code: string;
  invoice_id: number | null;
  customer_id: number;
  date: string;
  delivery_address: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  delivered_by: string | null;
  vehicle_reg: string | null;
  status: DeliveryStatus;
  notes: string | null;
  customer: DeliveryNoteCustomer | null;
  invoice: { id: number; code: string } | null;
  items: DeliveryNoteItem[];
}

export interface DeliveryNoteFilters {
  customer_id?: number | null;
  status?: DeliveryStatus | null;
  date_from?: string | null;
  date_to?: string | null;
}

export interface UpdateDeliveryNotePayload {
  date?: string;
  delivery_address?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  delivered_by?: string | null;
  vehicle_reg?: string | null;
  notes?: string | null;
}

/** Body of the 409 returned when an invoice already has an active delivery note. */
export interface DeliveryNoteConflict {
  message: string;
  delivery_note: { id: number; code: string };
}

/** Prefill for the "new delivery note" form, and any active note the invoice already has. */
export interface DeliveryNoteDraft {
  draft: { date: string; delivery_address: string | null; contact_person: string | null; contact_phone: string | null };
  existing: { id: number; code: string } | null;
  invoice: { id: number; code: string; customer: string | null };
}

export type NoteResponse = { delivery_note: DeliveryNote };

@Injectable({ providedIn: 'root' })
export class DeliveryNoteService {
  private readonly http = inject(HttpClient);

  getAll(
    page = 1,
    perPage = 15,
    filters: DeliveryNoteFilters = {},
  ): Observable<{ delivery_notes: DeliveryNote[]; meta: PaginationMeta }> {
    const params: Record<string, string | number> = { page, per_page: perPage };
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== undefined && value !== '') {
        params[key] = value;
      }
    }
    return this.http.get<{ delivery_notes: DeliveryNote[]; meta: PaginationMeta }>('/api/v1/delivery-notes', {
      params,
    });
  }

  getById(id: number): Observable<NoteResponse> {
    return this.http.get<NoteResponse>(`/api/v1/delivery-notes/${id}`);
  }

  getDraft(invoiceId: number): Observable<DeliveryNoteDraft> {
    return this.http.get<DeliveryNoteDraft>(`/api/v1/invoices/${invoiceId}/delivery-note/draft`);
  }

  createFromInvoice(invoiceId: number, data: UpdateDeliveryNotePayload = {}): Observable<NoteResponse> {
    return this.http.post<NoteResponse>(`/api/v1/invoices/${invoiceId}/delivery-note`, data);
  }

  update(id: number, data: UpdateDeliveryNotePayload): Observable<NoteResponse> {
    return this.http.patch<NoteResponse>(`/api/v1/delivery-notes/${id}`, data);
  }

  cancel(id: number): Observable<NoteResponse> {
    return this.http.post<NoteResponse>(`/api/v1/delivery-notes/${id}/cancel`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/delivery-notes/${id}`);
  }

  getCustomers(): Observable<{ customers: DeliveryNoteCustomer[] }> {
    return this.http.get<{ customers: DeliveryNoteCustomer[] }>('/api/v1/customers', {
      params: { per_page: 1000 },
    });
  }
}
