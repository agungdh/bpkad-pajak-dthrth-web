import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KodePajak {
    uuid: string;
    kode: string;
    nama: string;
}

export interface KodePajakPaginationResponse {
    data: KodePajak[];
    path: string;
    per_page: number;
    next_cursor: string | null;
    next_page_url: string | null;
    prev_cursor: string | null;
    prev_page_url: string | null;
    total: number;
}

export interface KodePajakFormData {
    kode: string;
    nama: string;
}

@Injectable({
    providedIn: 'root',
})
export class KodePajakService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api/kode-pajak';

    getAll(
        cursor?: string,
        search?: string,
        sortBy?: string,
        sortOrder?: string,
    ): Observable<KodePajakPaginationResponse> {
        let url = this.apiUrl;
        const params: string[] = [];

        if (cursor) params.push(`cursor=${cursor}`);
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (sortBy) params.push(`sort_by=${sortBy}`);
        if (sortOrder) params.push(`sort_order=${sortOrder}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<KodePajakPaginationResponse>(url);
    }

    get(uuid: string): Observable<KodePajak> {
        return this.http.get<KodePajak>(`${this.apiUrl}/${uuid}`);
    }

    create(data: KodePajakFormData): Observable<KodePajak> {
        return this.http.post<KodePajak>(this.apiUrl, data);
    }

    update(uuid: string, data: KodePajakFormData): Observable<KodePajak> {
        return this.http.put<KodePajak>(`${this.apiUrl}/${uuid}`, data);
    }

    delete(uuid: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${uuid}`);
    }
}
