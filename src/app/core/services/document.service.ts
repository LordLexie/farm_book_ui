import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginationMeta } from './customer.service';

export interface AppDocument {
  id: number;
  code: string;
  name: string;
  description: string | null;
  original_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by: number | null;
  uploader: { id: number; name: string } | null;
  created_at: string;
}

export interface DocumentsResponse {
  documents: AppDocument[];
  meta: PaginationMeta;
  total_size: number;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 15): Observable<DocumentsResponse> {
    return this.http.get<DocumentsResponse>('/api/v1/documents', {
      params: { page, per_page: perPage },
    });
  }

  upload(file: File, name: string, description: string): Observable<{ document: AppDocument }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (description) formData.append('description', description);
    return this.http.post<{ document: AppDocument }>('/api/v1/documents', formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/documents/${id}`);
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`/api/v1/documents/${id}/download`, { responseType: 'blob' });
  }
}
