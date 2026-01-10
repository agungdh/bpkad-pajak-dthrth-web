import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Skpd {
  id: number;
  uuid: string;
  nama: string;
  created_at?: number;
  updated_at?: number;
  created_by?: number;
  updated_by?: number;
  deleted_at?: number;
  deleted_by?: number;
}

export interface SkpdPaginationResponse {
  data: Skpd[];
  path: string;
  per_page: number;
  next_cursor: string | null;
  next_page_url: string | null;
  prev_cursor: string | null;
  prev_page_url: string | null;
  total: number;
}

export interface SkpdFormData {
  nama: string;
}

@Injectable({
  providedIn: 'root',
})
export class SkpdService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/skpd';

  getAll(cursor?: string, search?: string): Observable<SkpdPaginationResponse> {
    let url = this.apiUrl;
    const params: string[] = [];

    if (cursor) params.push(`cursor=${cursor}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<SkpdPaginationResponse>(url);
  }

  create(data: SkpdFormData): Observable<Skpd> {
    return this.http.post<Skpd>(this.apiUrl, data);
  }

  update(uuid: string, data: SkpdFormData): Observable<Skpd> {
    return this.http.put<Skpd>(`${this.apiUrl}/${uuid}`, data);
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${uuid}`);
  }
}
